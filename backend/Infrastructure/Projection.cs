using InsuranceGroup.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace InsuranceGroup.Api.Infrastructure;

public static class Projection
{
    public static IQueryable<OrderEntity> WithDetails(this IQueryable<OrderEntity> query) => query.Include(x => x.Travelers).Include(x => x.Events).Include(x => x.Policy).AsSplitQuery();
    public static IQueryable<ClaimEntity> WithDetails(this IQueryable<ClaimEntity> query) => query.Include(x => x.Events).Include(x => x.Evidence.Where(e => !e.Abandoned)).AsSplitQuery();
    public static IQueryable<PolicyEntity> WithDetails(this IQueryable<PolicyEntity> query) => query.Include(x => x.Order).ThenInclude(x => x.Travelers).AsSplitQuery();
    public static TravelerInput[] Travelers(OrderEntity o) => o.Travelers.OrderBy(x => x.Position).Select(x => new TravelerInput(x.FirstName, x.LastName, x.DateOfBirth)).ToArray();
    public static OrderDto Order(OrderEntity o) => new(o.Id, o.OwnerId, JsonDefaults.Read<QuoteDto>(o.QuoteJson), JsonDefaults.Read<TripInput>(o.TripJson), Travelers(o), o.ContactEmail, o.Status, o.PaymentStatus, o.Policy?.Id, o.CreatedAt, o.UpdatedAt, o.Events.OrderBy(x => x.CreatedAt).Select(x => new EventDto(x.Id, x.Status, x.CreatedAt, x.Note)).ToArray());
    public static PolicyDto Policy(PolicyEntity p)
    {
        var trip = JsonDefaults.Read<TripInput>(p.Order.TripJson);
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var status = string.CompareOrdinal(today, trip.StartDate) < 0 ? "upcoming" : string.CompareOrdinal(today, trip.EndDate) > 0 ? "expired" : "active";
        return new(p.Id, p.OrderId, p.OwnerId, p.Number, JsonDefaults.Read<QuoteDto>(p.Order.QuoteJson), trip, Travelers(p.Order), p.Order.ContactEmail, status, p.Order.DocumentAvailableAt > DateTimeOffset.UtcNow ? "pending" : "ready", p.CreatedAt);
    }
    public static ClaimDto Claim(ClaimEntity c) => new(c.Id, c.OwnerId, c.PolicyId, c.IncidentType, c.IncidentDate, c.Description, c.AmountCents, "EUR", c.Status, c.Evidence.Where(x => !x.Abandoned).OrderBy(x => x.CreatedAt).Select(x => new EvidenceDto(x.Id, x.Name, x.Size, x.MimeType, x.CreatedAt)).ToArray(), c.Events.OrderBy(x => x.CreatedAt).Select(x => new EventDto(x.Id, x.Status, x.CreatedAt, x.Note)).ToArray(), c.CreatedAt, c.UpdatedAt);
    public static QuoteSessionDto Session(QuoteSessionEntity s) => new(s.Id, JsonDefaults.Read<TripInput>(s.TripJson), s.Quotes.Select(x => JsonDefaults.Read<QuoteDto>(x.SnapshotJson)).ToArray(), s.CreatedAt, s.ExpiresAt);
}
