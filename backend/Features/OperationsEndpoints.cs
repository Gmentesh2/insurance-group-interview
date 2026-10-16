using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InsuranceGroup.Api.Features;

public static class OperationsEndpoints
{
    public static void MapOperations(this RouteGroupBuilder api)
    {
        api.MapGet("/ops", async (string? search, CurrentOwner owner, InsuranceDbContext db) =>
        {
            await owner.Operator();
            var query = search?.Trim().ToLowerInvariant() ?? "";
            Validation.Require(query.Length <= 100, "Search must have at most 100 characters.");
            var orders = (await db.Orders.OrderByDescending(x => x.CreatedAt).WithDetails().Take(100).ToListAsync()).Select(Projection.Order).Where(x => query == "" || $"{x.Id} {x.UserId} {string.Join(' ', x.Trip.DestinationCountries)} {x.Status}".ToLowerInvariant().Contains(query)).ToArray();
            var claims = (await db.Claims.OrderByDescending(x => x.CreatedAt).WithDetails().Take(100).ToListAsync()).Select(Projection.Claim).Where(x => query == "" || $"{x.Id} {x.UserId} {x.Status}".ToLowerInvariant().Contains(query)).ToArray();
            return new { orders, claims, events = orders.SelectMany(x => x.Events).Concat(claims.SelectMany(x => x.Events)).OrderByDescending(x => x.CreatedAt).Take(100) };
        });
        api.MapPost("/ops", async (OperationsInput input, CurrentOwner owner, CheckoutService checkout, ClaimService claims) =>
        {
            await owner.Operator();
            if (input.Action == "reconcile")
            {
                Validation.Require(input.OrderId.HasValue, "Choose an order.");
                await checkout.Reconcile(input.OrderId!.Value, true);
            }
            else if (input.Action == "claim_status")
            {
                Validation.Require(input.ClaimId.HasValue && input.Status is "under_review" or "more_information" or "approved" or "declined", "Choose a valid claim status.");
                var note = input.Note?.Trim() ?? "";
                Validation.Require(note.Length <= 1000 && (input.Status is not ("more_information" or "declined") || note.Length >= 10), "Add a customer-visible explanation of 10 to 1,000 characters.", "note");
                var claim = await claims.Owned(input.ClaimId!.Value, true);
                if (claim.Status is "draft" or "approved" or "declined" || claim.Status == "more_information" && input.Status != "under_review") throw new ApiException(409, "INVALID_TRANSITION", "This claim cannot move to that status.");
                claim.Status = input.Status!; claim.UpdatedAt = Validation.NextVersion(claim.UpdatedAt); claim.Events.Add(new() { Status = input.Status!, Note = note.Length == 0 ? null : note });
            }
            else throw new ApiException(422, "VALIDATION", "Choose a valid operation.");
            return new { ok = true };
        });
        api.MapGet("/ops/claims/{id:guid}/documents/{documentId:guid}", (Guid id, Guid documentId, ClaimService claims) => claims.Download(id, documentId, true));
    }
}
