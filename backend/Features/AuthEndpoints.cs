using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InsuranceGroup.Api.Features;

public sealed class AccountService(InsuranceDbContext db, UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn, CurrentOwner owner)
{
    public async Task<ApplicationUser> Guest()
    {
        var current = await owner.Optional();
        if (current != null) return current;
        var guestName = "guest-" + Guid.NewGuid().ToString("N");
        var user = new ApplicationUser { UserName = guestName, Email = guestName + "@guest.invalid", IsGuest = true };
        var result = await users.CreateAsync(user);
        if (!result.Succeeded) throw new ApiException(503, "GUEST_UNAVAILABLE", "Guest access is temporarily unavailable.");
        await signIn.SignInAsync(user, isPersistent: false);
        return user;
    }
    public async Task<AuthSessionDto> Credentials(string emailInput, string password, bool register, bool guestOnly = false)
    {
        var current = await owner.Optional();
        if (guestOnly && current?.IsGuest != true) throw new ApiException(409, "GUEST_REQUIRED", "Use your current guest session to save its access.");
        var email = Validation.Email(emailInput);
        Validation.Require(password is { Length: >= 12 and <= 128 }, "Use a password of 12 to 128 characters.", "password");
        ApplicationUser user;
        if (register)
        {
            user = new ApplicationUser { UserName = email, Email = email };
            var result = await users.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                var duplicate = result.Errors.Any(x => x.Code.Contains("Duplicate", StringComparison.Ordinal));
                throw new ApiException(duplicate ? 409 : 422, duplicate ? "EMAIL_IN_USE" : "PASSWORD_INVALID", duplicate ? "An account already exists for this email. Sign in instead." : "Use at least 12 characters, including uppercase, lowercase, a number and a symbol.");
            }
        }
        else
        {
            user = await users.FindByEmailAsync(email) ?? throw new ApiException(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
            if (user.IsGuest) throw new ApiException(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
            var result = await signIn.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
            if (!result.Succeeded) throw new ApiException(result.IsLockedOut ? 429 : 401, result.IsLockedOut ? "RATE_LIMITED" : "INVALID_CREDENTIALS", result.IsLockedOut ? "Too many attempts. Try again in a few minutes." : "The email or password is incorrect.");
        }
        if (current?.IsGuest == true && current.Id != user.Id) await Transfer(current.Id, user.Id);
        await signIn.SignInAsync(user, isPersistent: false);
        return await owner.Session(user);
    }
    private async Task Transfer(string guestId, string userId)
    {
        // This method runs inside the same mutation transaction as credential verification.
        // The protected current Identity session is the only source of the guest owner ID.
        await db.QuoteSessions.Where(x => x.OwnerId == guestId).ExecuteUpdateAsync(x => x.SetProperty(v => v.OwnerId, userId));
        await db.Orders.Where(x => x.OwnerId == guestId).ExecuteUpdateAsync(x => x.SetProperty(v => v.OwnerId, userId));
        await db.Policies.Where(x => x.OwnerId == guestId).ExecuteUpdateAsync(x => x.SetProperty(v => v.OwnerId, userId));
        await db.Claims.Where(x => x.OwnerId == guestId).ExecuteUpdateAsync(x => x.SetProperty(v => v.OwnerId, userId));
        await db.Evidence.Where(x => x.OwnerId == guestId).ExecuteUpdateAsync(x => x.SetProperty(v => v.OwnerId, userId));
        await db.ClaimRequests.Where(x => x.OwnerId == guestId).ExecuteUpdateAsync(x => x.SetProperty(v => v.OwnerId, userId));
    }
}
public static class AuthEndpoints
{
    public static void MapAuth(this RouteGroupBuilder api)
    {
        api.MapGet("/auth/session", (CurrentOwner owner) => owner.Session());
        api.MapPost("/auth/guest", async (AccountService accounts, CurrentOwner owner) => await owner.Session(await accounts.Guest()));
        api.MapPost("/auth/register", (CredentialsInput input, AccountService accounts) => accounts.Credentials(input.Email, input.Password, true)).RequireRateLimiting("authentication");
        api.MapPost("/auth/login", (CredentialsInput input, AccountService accounts) => accounts.Credentials(input.Email, input.Password, false)).RequireRateLimiting("authentication");
        api.MapPost("/auth/guest-access/credentials", (GuestCredentialsInput input, AccountService accounts) => accounts.Credentials(input.Email, input.Password, input.Register, true)).RequireRateLimiting("authentication");
        api.MapPost("/auth/sign-out", async (SignInManager<ApplicationUser> signIn) => { await signIn.SignOutAsync(); return new { ok = true }; });
    }
    public static async Task SeedOperator(this WebApplication app)
    {
        var email = app.Configuration["Operator:Email"];
        var password = app.Configuration["Operator:Password"];
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password)) return;
        using var scope = app.Services.CreateScope();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        if (!await roles.RoleExistsAsync("operator"))
        {
            var roleResult = await roles.CreateAsync(new IdentityRole("operator"));
            if (!roleResult.Succeeded) throw new InvalidOperationException("Operator role provisioning failed.");
        }
        var user = await users.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser { UserName = email, Email = email };
            if (!(await users.CreateAsync(user, password)).Succeeded) throw new InvalidOperationException("Operator credential provisioning failed.");
        }
        // Configuration can provision a new operator or recognize a previously seeded operator.
        // Never promote a pre-existing public account by matching its email alone.
        else if (!await users.IsInRoleAsync(user, "operator")) throw new InvalidOperationException("Configured operator email is already a public account. Choose a different seed email.");
        if (!await users.IsInRoleAsync(user, "operator")) await users.AddToRoleAsync(user, "operator");
    }
}
