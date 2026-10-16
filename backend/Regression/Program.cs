using System.Net;
using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

// Deterministic provider-adapter regressions. No database, network or real API key is used.
var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Gemini:ApiKey"] = "synthetic-test-key", ["Gemini:Model"] = "gemini-3.5-flash" }).Build();
var handler = new ProviderHandler();
var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
accessor.HttpContext.Connection.RemoteIpAddress = IPAddress.Loopback;
var service = new AssistantService(configuration, new FakeClients(handler), null!, null!, accessor);
var input = new AssistantInput("en", "How does guest access work?");
using var canceled = new CancellationTokenSource(); canceled.Cancel();
try { await service.Chat(input, canceled.Token); throw new Exception("Canceled request should stop."); }
catch (OperationCanceledException) { }
var result = await service.Chat(input, CancellationToken.None);
Require(result.Reply == "Synthetic answer", "Canceled request must release the client concurrency slot.");
Require(result.Sources.Length == 1 && result.Sources[0].Href == "/en/help", "Only trusted server sources are returned.");
Require(handler.Calls == 1, "Canceled request must not reach the provider.");
Require(handler.SawHeader && handler.FixedEndpoint && handler.NoTools, "Provider must use a header key, fixed endpoint and no tools.");
handler.Body = new string('x', 65537);
await Error(502, () => service.Chat(input, CancellationToken.None));
handler.Body = "{\"candidates\":{}}";
await Error(502, () => service.Chat(input, CancellationToken.None));
handler.Body = "{\"candidates\":[]}";
await Error(502, () => service.Chat(input, CancellationToken.None));
handler.Status = HttpStatusCode.TooManyRequests;
await Error(429, () => service.Chat(input, CancellationToken.None));
configuration["Gemini:ApiKey"] = "";
await Error(503, () => service.Chat(input, CancellationToken.None));
Console.WriteLine("Assistant adapter regression passed: canceled acquisition recovery, header-only key/fixed endpoint/no tools, trusted sources, response bounds, malformed/empty provider response, quota and missing-key errors. No network used.");
static void Require(bool condition, string message) { if (!condition) throw new Exception(message); }
static async Task Error(int status, Func<Task<AssistantReply>> action)
{
    try { await action(); throw new Exception("Expected provider adapter error."); }
    catch (ApiException error) { Require(error.Status == status, $"Expected HTTP {status}, got {error.Status}."); }
}
sealed class FakeClients(ProviderHandler handler) : IHttpClientFactory
{
    public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
}
sealed class ProviderHandler : HttpMessageHandler
{
    public string Body { get; set; } = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Synthetic answer\"}]}}]}";
    public HttpStatusCode Status { get; set; } = HttpStatusCode.OK;
    public int Calls { get; private set; }
    public bool SawHeader { get; private set; }
    public bool FixedEndpoint { get; private set; }
    public bool NoTools { get; private set; }
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Calls++;
        SawHeader = request.Headers.Contains("x-goog-api-key");
        FixedEndpoint = request.RequestUri?.GetLeftPart(UriPartial.Query) == "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
        var payload = await request.Content!.ReadAsStringAsync(cancellationToken);
        NoTools = !payload.Contains("\"tools\"", StringComparison.Ordinal);
        return new(Status) { Content = new StringContent(Body) };
    }
}
