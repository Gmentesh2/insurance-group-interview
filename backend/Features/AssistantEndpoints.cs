using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InsuranceGroup.Api.Features;

public sealed record ChatTurn(string Role, string Text);
public sealed record AssistantInput(string Locale, string Message, ChatTurn[]? History = null, Guid? PolicyId = null, bool SharePolicy = false);
public sealed record AssistantSource(string Label, string Href);
public sealed record AssistantReply(string Reply, AssistantSource[] Sources);
public sealed class AssistantService(IConfiguration configuration, IHttpClientFactory clients, InsuranceDbContext db, CurrentOwner owner, IHttpContextAccessor accessor)
{
    private static readonly SemaphoreSlim ConcurrentRequests = new(4, 4);
    private static readonly ConcurrentDictionary<string, byte> ActiveClients = new();
    private static readonly string SystemPrompt = LoadPrompt();
    public bool Configured => !string.IsNullOrWhiteSpace(Key);
    private string? Key => !string.IsNullOrWhiteSpace(configuration["Gemini:ApiKey"]) ? configuration["Gemini:ApiKey"] : configuration["GEMINI_API_KEY"];
    private static string LoadPrompt()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("InsuranceGroup.AssistantSystemPrompt") ?? throw new InvalidOperationException("Assistant system prompt is missing.");
        using var reader = new StreamReader(stream); return reader.ReadToEnd();
    }
    public async Task<AssistantReply> Chat(AssistantInput input, CancellationToken cancellation)
    {
        Validation.Require(input.Locale is "en" or "de" or "ru", "Choose en, de or ru.", "locale");
        Validation.Require(input.Message is { Length: > 0 and <= 1500 } && input.Message.Trim().Length > 0, "Enter a message of 1 to 1,500 characters.", "message");
        var history = input.History ?? [];
        Validation.Require(history.Length <= 8 && history.All(x => x != null && x.Role is "user" or "model" && x.Text is { Length: > 0 and <= 1500 }), "Use at most 8 recent user/model messages.", "history");
        Validation.Require(!input.PolicyId.HasValue || input.SharePolicy, "Explicit consent is required to share policy benefits.", "sharePolicy", "POLICY_CONSENT_REQUIRED");
        Validation.Require(!input.SharePolicy || input.PolicyId.HasValue, "Choose a policy to share.", "policyId");
        object? policyFacts = null;
        if (input.PolicyId.HasValue)
        {
            var user = await owner.Require();
            var quoteJson = await db.Policies.Where(x => x.Id == input.PolicyId && x.OwnerId == user.Id).Select(x => x.Order.QuoteJson).SingleOrDefaultAsync() ?? throw Validation.Missing();
            var quote = JsonDefaults.Read<QuoteDto>(quoteJson);
            // Only factual benefit facts leave the server. No identity, price, dates, travel,
            // policy/order IDs, claims, contacts, traveler names or evidence are included.
            policyFacts = new { quote.Plan, quote.Coverage, quote.Exclusions, quote.TermsVersion };
        }
        if (!Configured) throw new ApiException(503, "ASSISTANT_NOT_CONFIGURED", "The AI assistant is not configured. Help is available without AI.");
        var model = configuration["Gemini:Model"] ?? configuration["GEMINI_MODEL"] ?? "gemini-3.5-flash";
        if (!Regex.IsMatch(model, "^[a-zA-Z0-9.-]{1,80}$", RegexOptions.CultureInvariant)) throw new ApiException(503, "ASSISTANT_UNAVAILABLE", "The AI assistant is unavailable.");
        var context = accessor.HttpContext!;
        var clientKey = (context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "public") + ":" + context.Connection.RemoteIpAddress;
        if (!ActiveClients.TryAdd(clientKey, 0)) throw new ApiException(429, "RATE_LIMITED", "Wait for your current assistant request to finish.");
        var acquired = false;
        try
        {
            acquired = await ConcurrentRequests.WaitAsync(0, cancellation);
            if (!acquired) throw new ApiException(429, "RATE_LIMITED", "The assistant is busy. Try again shortly.");
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellation); timeout.CancelAfter(TimeSpan.FromSeconds(30));
            var contents = history.Select(x => new { role = x.Role, parts = new[] { new { text = x.Text } } }).Append(new { role = "user", parts = new[] { new { text = input.Message.Trim() } } }).ToArray();
            var system = SystemPrompt + "\nTrusted response locale: " + input.Locale + "\nTrusted minimal selected-policy benefit facts (null means absent): " + JsonDefaults.Write(policyFacts);
            using var request = new HttpRequestMessage(HttpMethod.Post, $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
            request.Headers.Add("x-goog-api-key", Key);
            request.Content = JsonContent.Create(new { systemInstruction = new { parts = new[] { new { text = system } } }, contents, generationConfig = new { maxOutputTokens = 1024 } });
            using var response = await clients.CreateClient("Gemini").SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            if (!response.IsSuccessStatusCode) throw new ApiException(response.StatusCode == HttpStatusCode.TooManyRequests ? 429 : 502, response.StatusCode == HttpStatusCode.TooManyRequests ? "RATE_LIMITED" : "ASSISTANT_UNAVAILABLE", "The AI assistant could not answer. Try again later or open Help.");
            await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var memory = new MemoryStream();
            var buffer = new byte[4096];
            int count;
            while ((count = await stream.ReadAsync(buffer, timeout.Token)) > 0)
            {
                if (memory.Length + count > 65536) throw new ApiException(502, "ASSISTANT_UNAVAILABLE", "The AI assistant returned an invalid response.");
                await memory.WriteAsync(buffer.AsMemory(0, count), timeout.Token);
            }
            using var json = JsonDocument.Parse(memory.ToArray());
            var reply = "";
            if (json.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0 && candidates[0].TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts))
                reply = string.Join("\n", parts.EnumerateArray().Where(p => p.TryGetProperty("text", out _) && !(p.TryGetProperty("thought", out var thought) && thought.ValueKind == JsonValueKind.True)).Select(p => p.GetProperty("text").GetString()));
            if (string.IsNullOrWhiteSpace(reply) || reply.Length > 16000) throw new ApiException(502, "ASSISTANT_UNAVAILABLE", "The AI assistant could not answer. Open Help or try another question.");
            var sources = new List<AssistantSource> { new(input.Locale == "de" ? "Hilfe" : input.Locale == "ru" ? "Помощь" : "Help", $"/{input.Locale}/help") };
            if (policyFacts != null) sources.Add(new(input.Locale == "de" ? "Ihre Police" : input.Locale == "ru" ? "Ваш полис" : "Your policy", $"/{input.Locale}/account/policies/{input.PolicyId}"));
            return new(reply, sources.ToArray());
        }
        catch (OperationCanceledException) when (!cancellation.IsCancellationRequested) { throw new ApiException(504, "ASSISTANT_TIMEOUT", "The AI assistant took too long. Try again later."); }
        catch (HttpRequestException) { throw new ApiException(502, "ASSISTANT_UNAVAILABLE", "The AI assistant could not be reached. Try again later."); }
        catch (JsonException) { throw new ApiException(502, "ASSISTANT_UNAVAILABLE", "The AI assistant returned an invalid response."); }
        catch (InvalidOperationException) { throw new ApiException(502, "ASSISTANT_UNAVAILABLE", "The AI assistant returned an invalid response."); }
        catch (IOException) { throw new ApiException(502, "ASSISTANT_UNAVAILABLE", "The AI assistant connection was interrupted."); }
        finally { if (acquired) ConcurrentRequests.Release(); ActiveClients.TryRemove(clientKey, out _); }
    }
}
public static class AssistantEndpoints
{
    public static void MapAssistant(this RouteGroupBuilder api)
    {
        api.MapGet("/assistant/status", (AssistantService service) => new { configured = service.Configured });
        api.MapPost("/assistant/chat", (AssistantInput input, AssistantService service, CancellationToken cancellation) => service.Chat(input, cancellation)).RequireRateLimiting("assistant");
    }
}
