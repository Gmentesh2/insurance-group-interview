using System.Text.Json;
using System.Text.Json.Serialization;

namespace InsuranceGroup.Api.Domain;

public static class JsonDefaults
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
    public static string Write<T>(T value) => JsonSerializer.Serialize(value, Options);
    public static T Read<T>(string json) => JsonSerializer.Deserialize<T>(json, Options)!;
}
public sealed record AgeInput(int Age);
public sealed record TripInput(string ResidenceCountry, string[] DestinationCountries, string StartDate, string EndDate, AgeInput[] Travelers, string Scenario = "success");
public sealed record CoverageDto(string Key, string Status, int? LimitCents, string Scope, int DeductibleCents, string? Condition = null);
public sealed record QuoteDto(Guid Id, Guid SessionId, string Plan, string Provider, int TotalCents, string Currency, DateTimeOffset ExpiresAt, CoverageDto[] Coverage, string[] Exclusions, string TermsVersion);
public sealed record QuoteSessionDto(Guid Id, TripInput Trip, QuoteDto[] Quotes, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);
public sealed record TravelerInput(string FirstName, string LastName, string DateOfBirth);
public sealed record EventDto(Guid Id, string Status, DateTimeOffset CreatedAt, string? Note);
public sealed record OrderDto(Guid Id, string UserId, QuoteDto Quote, TripInput Trip, TravelerInput[] Travelers, string? ContactEmail, string Status, string PaymentStatus, Guid? PolicyId, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, EventDto[] Events);
public sealed record PolicyDto(Guid Id, Guid OrderId, string UserId, string Number, QuoteDto Quote, TripInput Trip, TravelerInput[] Travelers, string? ContactEmail, string Status, string DocumentStatus, DateTimeOffset CreatedAt);
public sealed record EvidenceDto(Guid Id, string Name, long Size, string MimeType, DateTimeOffset CreatedAt);
public sealed record ClaimDto(Guid Id, string UserId, Guid PolicyId, string IncidentType, string IncidentDate, string Description, int AmountCents, string Currency, string Status, EvidenceDto[] Documents, EventDto[] Events, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record SessionUserDto(string Id, string Email, string Role, bool IsGuest, string? Username = null);
public sealed record AuthSessionDto(SessionUserDto? User);
public sealed record CredentialsInput(string Email, string Password);
public sealed record GuestCredentialsInput(string Email, string Password, bool Register);
public sealed record CreateOrderInput(Guid QuoteId, bool AcceptPriceChange = false);
public sealed record CustomerDetailsInput(TravelerInput[] Travelers, string? ContactEmail);
public sealed record ClaimInput(Guid? PolicyId = null, string? IncidentType = null, string? IncidentDate = null, string? Description = null, int? AmountCents = null, string? ExpectedUpdatedAt = null);
public sealed record VersionInput(string? ExpectedUpdatedAt = null);
public sealed record OperationsInput(string Action, Guid? OrderId = null, Guid? ClaimId = null, string? Status = null, string? Note = null);
