using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InsuranceGroup.Api.Features;

public sealed class CheckoutService(InsuranceDbContext db, CurrentOwner owner, IInsuranceProvider insurance, IPaymentProvider payment)
{
    public async Task<OrderEntity> OwnedOrder(Guid id, bool operations = false)
    {
        var user = operations ? await owner.Operator() : await owner.Require();
        return await db.Orders.WithDetails().SingleOrDefaultAsync(x => x.Id == id && (operations || x.OwnerId == user.Id)) ?? throw Validation.Missing();
    }
    public async Task<OrderDto> Create(CreateOrderInput input)
    {
        var user = await owner.Require();
        var existing = await db.Orders.WithDetails().SingleOrDefaultAsync(x => x.QuoteId == input.QuoteId && x.OwnerId == user.Id);
        if (existing != null) return Projection.Order(existing);
        var quote = await db.Quotes.Include(x => x.Session).SingleOrDefaultAsync(x => x.Id == input.QuoteId && x.Session.OwnerId == user.Id) ?? throw Validation.Missing();
        var snapshot = JsonDefaults.Read<QuoteDto>(quote.SnapshotJson);
        var trip = JsonDefaults.Read<TripInput>(quote.Session.TripJson);
        if (snapshot.ExpiresAt < DateTimeOffset.UtcNow) throw new ApiException(409, "QUOTE_EXPIRED", "This quote expired. Request a new quote.");
        if (trip.Scenario == "price_changed" && !input.AcceptPriceChange) throw new ApiException(409, "PRICE_CHANGED", "The total price increased by EUR 5.00. Accept the new price to continue.", new() { ["currentTotalCents"] = (snapshot.TotalCents + 500).ToString() });
        if (trip.Scenario == "price_changed") snapshot = snapshot with { TotalCents = snapshot.TotalCents + 500 };
        var order = new OrderEntity { OwnerId = user.Id, QuoteId = quote.Id, QuoteJson = JsonDefaults.Write(snapshot), TripJson = quote.Session.TripJson };
        order.Events.Add(new() { Status = order.Status });
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return Projection.Order(order);
    }
    public async Task<OrderDto> Details(Guid id, CustomerDetailsInput input)
    {
        var user = await owner.Require();
        var order = await OwnedOrder(id);
        if (order.Status is not ("awaiting_details" or "ready_to_pay" or "payment_declined")) throw new ApiException(409, "ORDER_LOCKED", "Paid order details cannot be changed.");
        var trip = JsonDefaults.Read<TripInput>(order.TripJson);
        Validation.Require(input.Travelers != null && input.Travelers.Length == trip.Travelers.Length, "Traveler count must match the quote.", "travelers", "TRAVELER_COUNT");
        var travelers = input.Travelers!.Select(Validation.Traveler).ToArray();
        for (var i = 0; i < travelers.Length; i++) Validation.Require(Validation.AgeAt(travelers[i].DateOfBirth, trip.StartDate) == trip.Travelers[i].Age, "Date of birth must match age at departure.", $"travelers.{i}.dateOfBirth", "AGE_MISMATCH");
        var email = input.ContactEmail == null ? order.ContactEmail : Validation.Email(input.ContactEmail);
        Validation.Require(!user.IsGuest || email != null, "Provide a contact email.", "contactEmail", "CONTACT_REQUIRED");
        // Reuse positions to avoid delete/insert uniqueness ordering collisions.
        for (var i = 0; i < travelers.Length; i++)
        {
            var row = order.Travelers.SingleOrDefault(x => x.Position == i);
            if (row == null) { row = new() { Position = i }; order.Travelers.Add(row); }
            row.FirstName = travelers[i].FirstName; row.LastName = travelers[i].LastName; row.DateOfBirth = travelers[i].DateOfBirth;
        }
        order.ContactEmail = email; order.Status = "ready_to_pay"; order.UpdatedAt = Validation.NextVersion(order.UpdatedAt);
        return Projection.Order(order);
    }
    public async Task<OrderDto> Pay(Guid id)
    {
        var order = await OwnedOrder(id);
        if ((await owner.Require()).IsGuest && order.ContactEmail == null) throw new ApiException(409, "CONTACT_REQUIRED", "Save a contact email before payment.");
        payment.Charge(order);
        if (order.PaymentStatus == "paid") await Issue(order);
        return Projection.Order(order);
    }
    public async Task<OrderDto> Reconcile(Guid id, bool operations = false)
    {
        var order = await OwnedOrder(id, operations);
        if (order.PaymentStatus != "paid") throw new ApiException(409, "PAYMENT_REQUIRED", "Payment is required before policy issuance.");
        await Issue(order);
        return Projection.Order(order);
    }
    private async Task Issue(OrderEntity order)
    {
        if (order.Policy != null) return;
        insurance.ReserveBinding(order);
        if (order.BindingAvailableAt > DateTimeOffset.UtcNow) return;
        var policy = new PolicyEntity { Id = order.BindingPolicyId!.Value, OrderId = order.Id, OwnerId = order.OwnerId, Number = "IG-" + order.BindingPolicyId.Value.ToString("N")[..8].ToUpperInvariant(), Order = order };
        db.Policies.Add(policy); order.Policy = policy; order.Status = "issued"; order.UpdatedAt = Validation.NextVersion(order.UpdatedAt);
        order.Events.Add(new() { Status = "issued" });
        await db.SaveChangesAsync();
    }
}
public static class CheckoutEndpoints
{
    public static void MapCheckout(this RouteGroupBuilder api)
    {
        api.MapPost("/quotes", async (TripInput input, InsuranceDbContext db, AccountService accounts, IInsuranceProvider provider) =>
        {
            Validation.Trip(input);
            var user = await accounts.Guest();
            var session = new QuoteSessionEntity { OwnerId = user.Id, TripJson = JsonDefaults.Write(input), ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30) };
            session.Quotes = provider.Quote(input, session.Id, session.CreatedAt).Select(q => new QuoteEntity { Id = q.Id, SessionId = session.Id, SnapshotJson = JsonDefaults.Write(q) }).ToList();
            db.QuoteSessions.Add(session);
            return Projection.Session(session);
        });
        api.MapGet("/quote-sessions/{id:guid}", async (Guid id, InsuranceDbContext db, CurrentOwner owner) =>
        {
            var user = await owner.Require();
            var session = await db.QuoteSessions.Include(x => x.Quotes).SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == user.Id) ?? throw Validation.Missing();
            return Projection.Session(session);
        });
        api.MapPost("/orders", (CreateOrderInput input, CheckoutService checkout) => checkout.Create(input));
        api.MapGet("/orders", async (InsuranceDbContext db, CurrentOwner owner) =>
        {
            var user = await owner.Require();
            return new { orders = (await db.Orders.Where(x => x.OwnerId == user.Id).OrderByDescending(x => x.CreatedAt).WithDetails().Take(200).ToListAsync()).Select(Projection.Order) };
        });
        api.MapGet("/orders/{id:guid}", async (Guid id, CheckoutService checkout) => Projection.Order(await checkout.OwnedOrder(id)));
        api.MapPost("/orders/{id:guid}/customer-details", (Guid id, CustomerDetailsInput input, CheckoutService checkout) => checkout.Details(id, input));
        api.MapPost("/orders/{id:guid}/pay", (Guid id, CheckoutService checkout) => checkout.Pay(id));
        api.MapPost("/orders/{id:guid}/reconcile", (Guid id, CheckoutService checkout) => checkout.Reconcile(id));
    }
}
