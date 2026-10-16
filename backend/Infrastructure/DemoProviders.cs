using InsuranceGroup.Api.Domain;

namespace InsuranceGroup.Api.Infrastructure;

public interface IInsuranceProvider
{
    QuoteDto[] Quote(TripInput trip, Guid sessionId, DateTimeOffset now);
    void ReserveBinding(OrderEntity order);
}
public interface IPaymentProvider { void Charge(OrderEntity order); }
public sealed class DemoInsuranceProvider : IInsuranceProvider
{
    public QuoteDto[] Quote(TripInput trip, Guid sessionId, DateTimeOffset now)
    {
        if (trip.Scenario == "no_offers") return [];
        var count = trip.Scenario == "single_offer" ? 1 : trip.Scenario == "many_offers" ? 6 : 3;
        var days = Validation.Date(trip.EndDate, "endDate").DayNumber - Validation.Date(trip.StartDate, "startDate").DayNumber + 1;
        return Enumerable.Range(0, count).Select(offerIndex =>
        {
            var i = offerIndex % 3;
            var total = trip.Travelers.Sum(t => (int)Math.Round((145 + i * 95) * days * (t.Age > 65 ? 1.65 : 1), MidpointRounding.AwayFromZero));
            CoverageDto[] coverage = [
                new("medical", "covered", new[] {10000000, 50000000, 100000000}[i], "per_person", i == 0 ? 10000 : 0),
                new("cancellation", i == 0 ? "excluded" : "conditional", i == 0 ? null : new[] {0, 300000, 750000}[i], "per_person", i == 1 ? 5000 : 0, i > 0 ? "listed_reasons_only" : null),
                new("baggage", "covered", new[] {50000, 150000, 300000}[i], "per_person", 5000),
                new("delay", i == 0 ? "unknown" : "conditional", i == 0 ? null : new[] {0, 25000, 60000}[i], "per_trip", 0, i > 0 ? "after_six_hours" : null),
                new("assistance", "covered", null, "per_person", 0)
            ];
            return new QuoteDto(Guid.NewGuid(), sessionId, new[] {"essential", "comfort", "complete"}[i], offerIndex > 2 ? "Meridian Travel" : "Atlas Travel", total + (offerIndex > 2 ? 350 : 0), "EUR", now.AddMinutes(trip.Scenario == "quote_expired" ? -1 : 30), coverage, ["pre_existing_conditions", "high_risk_sports", "known_events"], "demo-travel-2026-01");
        }).ToArray();
    }
    public void ReserveBinding(OrderEntity order)
    {
        if (order.BindingPolicyId != null) return;
        var trip = JsonDefaults.Read<TripInput>(order.TripJson);
        var now = DateTimeOffset.UtcNow;
        order.BindingPolicyId = Guid.NewGuid();
        order.BindingAvailableAt = now.AddSeconds(trip.Scenario is "issuance_pending" or "bind_unknown" ? 8 : 0);
        order.DocumentAvailableAt = now.AddSeconds(trip.Scenario == "document_delayed" ? 15 : 0);
    }
}
public sealed class DemoPaymentProvider : IPaymentProvider
{
    public void Charge(OrderEntity order)
    {
        if (order.PaymentStatus == "paid") return;
        if (order.Status is not ("ready_to_pay" or "payment_declined")) throw new ApiException(409, "DETAILS_REQUIRED", "Complete traveler details first.");
        if (JsonDefaults.Read<QuoteDto>(order.QuoteJson).ExpiresAt < DateTimeOffset.UtcNow) throw new ApiException(409, "QUOTE_EXPIRED", "This quote expired. Request a new quote.");
        var scenario = JsonDefaults.Read<TripInput>(order.TripJson).Scenario;
        order.PaymentStatus = scenario == "declined" ? "declined" : "paid";
        order.Status = scenario == "declined" ? "payment_declined" : scenario == "bind_unknown" ? "bind_unknown" : "issuance_pending";
        if (order.PaymentStatus == "paid") order.PaidAt = DateTimeOffset.UtcNow;
        order.UpdatedAt = DateTimeOffset.UtcNow;
        order.Events.Add(new() { Status = order.Status });
    }
}
