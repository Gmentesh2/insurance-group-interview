using System.Text.Json.Serialization;
using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Features;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PdfSharp.Fonts;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["urls"] ?? "http://localhost:5081");
var connection = builder.Configuration.GetConnectionString("Insurance") ?? throw new InvalidOperationException("Set ConnectionStrings__Insurance to the isolated interview PostgreSQL database.");
builder.Services.AddDbContext<InsuranceDbContext>(options => options.UseNpgsql(connection));
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequiredLength = 12;
    options.Password.RequireUppercase = true; options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true; options.Password.RequireNonAlphanumeric = true;
    options.Lockout.MaxFailedAccessAttempts = 5; options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
}).AddEntityFrameworkStores<InsuranceDbContext>().AddDefaultTokenProviders();
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "ig.interview.session"; options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8); options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return context.Response.WriteAsJsonAsync(new { error = new { code = "AUTH_REQUIRED", message = "Sign in to continue." } }); };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return context.Response.WriteAsJsonAsync(new { error = new { code = "FORBIDDEN", message = "Operations access is required." } }); };
});
builder.Services.AddDataProtection().SetApplicationName("InsuranceGroup.Interview");
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
    options.SerializerOptions.PropertyNameCaseInsensitive = false;
});
builder.Services.Configure<FormOptions>(options => { options.MultipartBodyLengthLimit = 11 * 1024 * 1024; options.ValueLengthLimit = 1024; options.MultipartHeadersLengthLimit = 4096; });
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 11 * 1024 * 1024);
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);
builder.Services.AddHttpContextAccessor();
builder.Services.AddAuthorization();
builder.Services.AddScoped(provider => new CurrentOwner(provider.GetRequiredService<IHttpContextAccessor>().HttpContext!, provider.GetRequiredService<UserManager<ApplicationUser>>()));
builder.Services.AddScoped<AssistantService>();
builder.Services.AddHttpClient("Gemini", client => client.Timeout = Timeout.InfiniteTimeSpan).RemoveAllLoggers();
builder.Services.AddScoped<AccountService>(); builder.Services.AddScoped<CheckoutService>(); builder.Services.AddScoped<ClaimService>();
builder.Services.AddSingleton<IInsuranceProvider, DemoInsuranceProvider>(); builder.Services.AddSingleton<IPaymentProvider, DemoPaymentProvider>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("authentication", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("assistant", context => RateLimitPartition.GetFixedWindowLimiter((context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "public") + ":" + context.Connection.RemoteIpAddress, _ => new FixedWindowRateLimiterOptions { PermitLimit = 8, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.OnRejected = async (context, cancellation) => await context.HttpContext.Response.WriteAsJsonAsync(new { error = new { code = "RATE_LIMITED", message = "Too many attempts. Try again in a minute." } }, cancellation);
});
GlobalFontSettings.FontResolver = new SourceSansFontResolver();
var app = builder.Build();
app.Use(ApiInfrastructure.ErrorBoundary);
app.Use(ApiInfrastructure.CheckOrigin);
app.UseAuthentication(); app.UseRateLimiter(); app.UseAuthorization();
app.MapGet("/health", async (InsuranceDbContext db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok", demo = true }) : Results.Json(new { status = "unavailable" }, statusCode: 503));
var api = app.MapGroup("/api/v1").AddEndpointFilter<MutationTransactionFilter>();
api.MapAuth(); api.MapCheckout(); api.MapPolicies(); api.MapClaims(); api.MapOperations(); api.MapAssistant();
app.MapFallback("/api/{**path}", () => Results.Json(new { error = new { code = "NOT_FOUND", message = "This API route could not be found." } }, statusCode: 404));
await app.SeedOperator();
app.Run();
public partial class Program { }
