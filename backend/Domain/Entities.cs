using Microsoft.AspNetCore.Identity;

namespace InsuranceGroup.Api.Domain;

public sealed class ApplicationUser : IdentityUser
{
    public bool IsGuest { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
public sealed class QuoteSessionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = null!;
    public string TripJson { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; set; }
    public List<QuoteEntity> Quotes { get; set; } = [];
}
public sealed class QuoteEntity
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public QuoteSessionEntity Session { get; set; } = null!;
    public string SnapshotJson { get; set; } = "";
}
public sealed class OrderEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = null!;
    public Guid QuoteId { get; set; }
    public QuoteEntity OriginalQuote { get; set; } = null!;
    public string QuoteJson { get; set; } = "";
    public string TripJson { get; set; } = "";
    public string? ContactEmail { get; set; }
    public string Status { get; set; } = "awaiting_details";
    public string PaymentStatus { get; set; } = "unpaid";
    public DateTimeOffset? PaidAt { get; set; }
    public Guid? BindingPolicyId { get; set; }
    public DateTimeOffset? BindingAvailableAt { get; set; }
    public DateTimeOffset? DocumentAvailableAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<TravelerEntity> Travelers { get; set; } = [];
    public List<OrderEventEntity> Events { get; set; } = [];
    public PolicyEntity? Policy { get; set; }
}
public sealed class TravelerEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public OrderEntity Order { get; set; } = null!;
    public int Position { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string DateOfBirth { get; set; } = "";
}
public sealed class PolicyEntity
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderEntity Order { get; set; } = null!;
    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = null!;
    public string Number { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
public sealed class ClaimEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = null!;
    public Guid PolicyId { get; set; }
    public PolicyEntity Policy { get; set; } = null!;
    public string IncidentType { get; set; } = "medical";
    public string IncidentDate { get; set; } = "";
    public string Description { get; set; } = "";
    public int AmountCents { get; set; }
    public string Status { get; set; } = "draft";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<EvidenceEntity> Evidence { get; set; } = [];
    public List<ClaimEventEntity> Events { get; set; } = [];
}
public sealed class EvidenceEntity
{
    public Guid Id { get; set; }
    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = null!;
    public Guid? ClaimId { get; set; }
    public ClaimEntity? Claim { get; set; }
    public Guid BoundClaimId { get; set; }
    public string Sha256 { get; set; } = "";
    public string Name { get; set; } = "";
    public string MimeType { get; set; } = "";
    public int Size { get; set; }
    public EvidenceContentEntity? Content { get; set; }
    public bool Abandoned { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
public sealed class EvidenceContentEntity
{
    public Guid EvidenceId { get; set; }
    public EvidenceEntity Evidence { get; set; } = null!;
    public byte[] Bytes { get; set; } = [];
}
public sealed class ClaimRequestEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = null!;
    public Guid Key { get; set; }
    public string PayloadHash { get; set; } = "";
    public Guid ClaimId { get; set; }
}
public sealed class OrderEventEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public OrderEntity Order { get; set; } = null!;
    public string Status { get; set; } = "";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
public sealed class ClaimEventEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClaimId { get; set; }
    public ClaimEntity Claim { get; set; } = null!;
    public string Status { get; set; } = "";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
