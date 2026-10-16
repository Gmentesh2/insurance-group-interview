using InsuranceGroup.Api.Domain;
using Microsoft.AspNetCore.Identity;

namespace InsuranceGroup.Api.Features;

/// <summary>Optional local customer fixture, never an operator or a production account.</summary>
public static class DemoAccountSeed
{
    public static async Task SeedDemoAccount(this WebApplication app)
    {
        var username = app.Configuration["DemoAccount:Username"];
        var password = app.Configuration["DemoAccount:Password"];
        if (string.IsNullOrEmpty(username) && string.IsNullOrEmpty(password)) return;
        if (!app.Environment.IsDevelopment()) throw new InvalidOperationException("Demo account configuration is allowed only in Development.");
        if (string.IsNullOrEmpty(username) || username.Length is < 3 or > 32 || username.Any(c => !char.IsAsciiLetterOrDigit(c) && c is not '-' and not '_') || password is not { Length: >= 8 and <= 128 })
            throw new InvalidOperationException("Configure a demo username (3–32 letters/digits, dash or underscore) and an 8–128 character password.");
        using var scope = app.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await users.FindByNameAsync(username);
        var id = "demo-" + username.ToLowerInvariant();
        if (user != null)
        {
            // Never overwrite a registered customer's credentials or grant an operator role.
            if (user.Id != id || user.IsGuest || await users.IsInRoleAsync(user, "operator") || !await users.CheckPasswordAsync(user, password))
                throw new InvalidOperationException("Demo account configuration conflicts with an existing account. No credentials were changed.");
            return;
        }
        user = new ApplicationUser { Id = id, UserName = username, Email = username.ToLowerInvariant() + "@example.test" };
        if (!(await users.CreateAsync(user, password)).Succeeded)
            throw new InvalidOperationException("Demo account provisioning failed. No existing account was modified.");
    }
}
