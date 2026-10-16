using System.Security.Claims;
using System.Text.Json;
using InsuranceGroup.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace InsuranceGroup.Api.Infrastructure;

public sealed class CurrentOwner(HttpContext context, UserManager<ApplicationUser> users)
{
    private ApplicationUser? cached;
    public async Task<ApplicationUser?> Optional() => cached ??= context.User.Identity?.IsAuthenticated == true ? await users.GetUserAsync(context.User) : null;
    public async Task<ApplicationUser> Require() => await Optional() ?? throw new ApiException(401, "AUTH_REQUIRED", "Sign in to continue.");
    public async Task<ApplicationUser> Operator()
    {
        var user = await Require();
        if (!await users.IsInRoleAsync(user, "operator")) throw new ApiException(403, "FORBIDDEN", "Operations access is required.");
        return user;
    }
    public async Task<AuthSessionDto> Session(ApplicationUser? user = null)
    {
        user ??= await Optional();
        return new(user is null ? null : new(user.Id, user.IsGuest ? "" : user.Email ?? "", await users.IsInRoleAsync(user, "operator") ? "operator" : "customer", user.IsGuest));
    }
}
/// <summary>All demo writes are short, atomic PostgreSQL transactions. A database advisory
/// lock serializes mutations across API instances, including account transfer and upload retries.
/// This intentionally favors simple correctness over high write throughput in the interview demo.</summary>
public sealed class MutationTransactionFilter(InsuranceDbContext db) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        if (HttpMethods.IsGet(context.HttpContext.Request.Method) || context.HttpContext.Request.Path == "/api/v1/assistant/chat") return await next(context);
        await using var transaction = await db.Database.BeginTransactionAsync(context.HttpContext.RequestAborted);
        await db.Database.ExecuteSqlRawAsync("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '20s';", context.HttpContext.RequestAborted);
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(482015081)", context.HttpContext.RequestAborted);
        object? result;
        try { result = await next(context); }
        catch (ApiException e) when (e.Code is "INVALID_CREDENTIALS" or "RATE_LIMITED")
        {
            // Identity's failed-access counter must survive a rejected login.
            await db.SaveChangesAsync(context.HttpContext.RequestAborted);
            await transaction.CommitAsync(context.HttpContext.RequestAborted);
            throw;
        }
        await db.SaveChangesAsync(context.HttpContext.RequestAborted);
        await transaction.CommitAsync(context.HttpContext.RequestAborted);
        return result;
    }
}
public static class ApiInfrastructure
{
    public static async Task ErrorBoundary(HttpContext context, RequestDelegate next)
    {
        context.Response.Headers.CacheControl = "private, no-store";
        context.Response.Headers.XContentTypeOptions = "nosniff";
        try { await next(context); }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            var error = exception switch
            {
                ApiException known => known,
                BadHttpRequestException bad => new ApiException(bad.StatusCode == 413 ? 413 : 422, "VALIDATION", "The request body is invalid or too large."),
                JsonException => new ApiException(422, "VALIDATION", "The request body is invalid."),
                DbUpdateConcurrencyException => new ApiException(409, "STATE_CHANGED", "The item changed. Refresh and try again."),
                PostgresException pg when pg.SqlState is "55P03" or "57014" => new ApiException(503, "BUSY", "The service is busy. Retry the request."),
                _ => new ApiException(500, "INTERNAL", "The request could not be completed. Please try again.")
            };
            if (error.Status == 500) context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("ApiError").LogError("Request failed: {ExceptionType}", exception.GetType().Name);
            context.Response.Clear();
            context.Response.StatusCode = error.Status;
            context.Response.Headers.CacheControl = "private, no-store";
            context.Response.Headers.XContentTypeOptions = "nosniff";
            await context.Response.WriteAsJsonAsync(new { error = new { code = error.Code, message = error.Message, fields = error.Fields } }, JsonDefaults.Options);
        }
    }
    public static Task CheckOrigin(HttpContext context, RequestDelegate next)
    {
        if (context.Request.Path.StartsWithSegments("/api") && !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
        {
            var configured = context.RequestServices.GetRequiredService<IConfiguration>()["FrontendUrl"] ?? context.RequestServices.GetRequiredService<IConfiguration>()["FrontendOrigin"] ?? "http://localhost:3001";
            var origin = context.Request.Headers.Origin.ToString();
            // Browsers always send Origin on same-origin JSON/form writes. Server CLI clients must
            // supply it explicitly too, keeping the cookie mutation boundary small and testable.
            if (origin != configured) throw new ApiException(403, "INVALID_ORIGIN", "This request origin is not allowed.");
        }
        return next(context);
    }
}
