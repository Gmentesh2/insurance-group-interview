using System.Globalization;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace InsuranceGroup.Api.Domain;

public sealed class ApiException(int status, string code, string message, Dictionary<string, string>? fields = null) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public Dictionary<string, string>? Fields { get; } = fields;
}
public static partial class Validation
{
    public static void Require(bool condition, string message, string? field = null, string code = "VALIDATION")
    {
        if (!condition) throw new ApiException(422, code, message, field is null ? null : new() { [field] = message });
    }
    public static ApiException Missing() => new(404, "NOT_FOUND", "This item could not be found.");
    public static DateOnly Date(string? value, string field)
    {
        Require(DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _), "Use a valid calendar date.", field);
        return DateOnly.ParseExact(value!, "yyyy-MM-dd", CultureInfo.InvariantCulture);
    }
    public static string Email(string? input)
    {
        var email = input?.Trim() ?? "";
        Require(email.Length is > 0 and <= 254 && MailAddress.TryCreate(email, out var address) && address.Address == email && !email.Any(char.IsControl), "Enter a valid email address.", "email");
        return email;
    }
    public static void Trip(TripInput input)
    {
        Require(input.ResidenceCountry != null && CountryPattern().IsMatch(input.ResidenceCountry), "Use an ISO country code.", "residenceCountry");
        Require(input.DestinationCountries is { Length: > 0 and <= 10 } && input.DestinationCountries.All(x => x != null && CountryPattern().IsMatch(x)), "Choose 1 to 10 countries.", "destinationCountries");
        var start = Date(input.StartDate, "startDate");
        var end = Date(input.EndDate, "endDate");
        Require(start >= DateOnly.FromDateTime(DateTime.UtcNow), "Departure must be today or later.", "startDate");
        Require(end >= start && end.DayNumber - start.DayNumber <= 365, "Trip must be between 1 and 366 days.", "endDate");
        Require(input.Travelers is { Length: > 0 and <= 8 } && input.Travelers.All(x => x is not null && x.Age is >= 0 and <= 100), "Choose 1 to 8 travelers aged 0 to 100.", "travelers");
        Require(Scenarios.Contains(input.Scenario), "Unknown demo scenario.", "scenario");
    }
    public static TravelerInput Traveler(TravelerInput input)
    {
        static string Name(string? s, string field)
        {
            var name = s?.Trim() ?? "";
            Require(name.Length is > 0 and <= 80 && !name.Any(char.IsControl), "Enter a name of 1 to 80 characters.", field);
            return name;
        }
        Require(input != null, "Enter traveler details.");
        var birth = Date(input!.DateOfBirth, "dateOfBirth");
        Require(birth <= DateOnly.FromDateTime(DateTime.UtcNow), "Birth date cannot be in the future.", "dateOfBirth");
        return new(Name(input.FirstName, "firstName"), Name(input.LastName, "lastName"), input.DateOfBirth);
    }
    public static int AgeAt(string birth, string onDate)
    {
        var b = Date(birth, "dateOfBirth");
        var d = Date(onDate, "startDate");
        var age = d.Year - b.Year;
        if (d.Month < b.Month || (d.Month == b.Month && d.Day < b.Day)) age--;
        return age;
    }
    public static void Claim(ClaimInput input, bool creating = false)
    {
        Require(!creating || input.PolicyId is not null && input.PolicyId != Guid.Empty, "Choose a policy.", "policyId");
        Require(input.IncidentType == null || IncidentTypes.Contains(input.IncidentType), "Choose a valid incident type.", "incidentType");
        if (!string.IsNullOrEmpty(input.IncidentDate)) Date(input.IncidentDate, "incidentDate");
        Require(input.Description == null || input.Description.Length <= 10000, "Description must have at most 10,000 characters.", "description");
        Require(input.AmountCents == null || input.AmountCents is >= 0 and <= 100000000, "Enter an amount from EUR 0 to 1,000,000.", "amountCents");
        if (input.ExpectedUpdatedAt != null) Require(DateTimeOffset.TryParse(input.ExpectedUpdatedAt, CultureInfo.InvariantCulture, DateTimeStyles.None, out _), "Use an ISO timestamp.", "expectedUpdatedAt");
    }
    public static void Version(ClaimEntity claim, string? expected)
    {
        if (expected == null) return;
        Require(DateTimeOffset.TryParse(expected, CultureInfo.InvariantCulture, DateTimeStyles.None, out var timestamp), "Use an ISO timestamp.", "expectedUpdatedAt");
        if (timestamp != claim.UpdatedAt) throw new ApiException(409, "CLAIM_CHANGED", "Claim changed. Refresh and review the saved details.");
    }
    public static DateTimeOffset NextVersion(DateTimeOffset previous) => DateTimeOffset.FromUnixTimeMilliseconds(Math.Max(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), previous.ToUnixTimeMilliseconds() + 1));
    public static readonly string[] Scenarios = ["success", "no_offers", "single_offer", "many_offers", "declined", "issuance_pending", "bind_unknown", "document_delayed", "quote_expired", "price_changed"];
    public static readonly string[] IncidentTypes = ["medical", "cancellation", "baggage", "delay", "other"];
    [GeneratedRegex("^[A-Z]{2}$")] private static partial Regex CountryPattern();
}
