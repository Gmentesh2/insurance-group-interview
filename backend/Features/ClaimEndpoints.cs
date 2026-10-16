using System.Security.Cryptography;
using System.Text;
using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace InsuranceGroup.Api.Features;

public sealed class ClaimService(InsuranceDbContext db, CurrentOwner owner)
{
    public async Task<ClaimEntity> Owned(Guid id, bool operations = false)
    {
        var user = operations ? await owner.Operator() : await owner.Require();
        return await db.Claims.WithDetails().SingleOrDefaultAsync(x => x.Id == id && (operations || x.OwnerId == user.Id)) ?? throw Validation.Missing();
    }
    public static void Editable(ClaimEntity claim)
    {
        if (claim.Status is not ("draft" or "more_information")) throw new ApiException(409, "CLAIM_LOCKED", "This claim cannot be edited now.");
    }
    public async Task<ClaimDto> Create(ClaimInput input, string? keyHeader)
    {
        Validation.Claim(input, true);
        var user = await owner.Require();
        var policyId = input.PolicyId!.Value;
        if (!await db.Policies.AnyAsync(x => x.Id == policyId && x.OwnerId == user.Id)) throw Validation.Missing();
        Guid? key = null;
        if (keyHeader != null)
        {
            Validation.Require(Guid.TryParse(keyHeader, out var parsed), "Use a UUID as the request identity.", code: "INVALID_IDEMPOTENCY_KEY");
            key = parsed;
        }
        var canonical = new { policyId, incidentType = input.IncidentType ?? "medical", incidentDate = input.IncidentDate ?? "", description = input.Description?.Trim() ?? "", amountCents = input.AmountCents ?? 0 };
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonDefaults.Write(canonical))));
        if (key.HasValue)
        {
            var existing = await db.ClaimRequests.SingleOrDefaultAsync(x => x.OwnerId == user.Id && x.Key == key.Value);
            if (existing != null)
            {
                if (existing.PayloadHash != hash) throw new ApiException(409, "CLAIM_CREATE_CONFLICT", "This request identity was used for different claim details.");
                var found = await db.Claims.WithDetails().SingleOrDefaultAsync(x => x.Id == existing.ClaimId && x.OwnerId == user.Id);
                if (found == null) throw new ApiException(409, "CLAIM_DELETED", "This draft was deleted. Start a new claim.");
                return Projection.Claim(found);
            }
        }
        var claim = new ClaimEntity { OwnerId = user.Id, PolicyId = policyId, IncidentType = canonical.incidentType, IncidentDate = canonical.incidentDate, Description = canonical.description, AmountCents = canonical.amountCents };
        // Persist millisecond versions so every frontend-returned timestamp round-trips exactly.
        claim.CreatedAt = claim.UpdatedAt = DateTimeOffset.FromUnixTimeMilliseconds(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        claim.Events.Add(new() { Status = "draft" });
        db.Claims.Add(claim);
        if (key.HasValue) db.ClaimRequests.Add(new() { OwnerId = user.Id, Key = key.Value, ClaimId = claim.Id, PayloadHash = hash });
        return Projection.Claim(claim);
    }
    public async Task<ClaimDto> Update(Guid id, ClaimInput input)
    {
        Validation.Claim(input);
        var claim = await Owned(id);
        Validation.Version(claim, input.ExpectedUpdatedAt); Editable(claim);
        if (input.PolicyId != null && input.PolicyId != claim.PolicyId) throw new ApiException(422, "POLICY_LOCKED", "The policy cannot be changed.");
        if (input.IncidentType != null) claim.IncidentType = input.IncidentType;
        if (input.IncidentDate != null) claim.IncidentDate = input.IncidentDate;
        if (input.Description != null) claim.Description = input.Description.Trim();
        if (input.AmountCents.HasValue) claim.AmountCents = input.AmountCents.Value;
        claim.UpdatedAt = Validation.NextVersion(claim.UpdatedAt);
        return Projection.Claim(claim);
    }
    public async Task<ClaimDto> Submit(Guid id, VersionInput input)
    {
        var claim = await Owned(id);
        if (claim.Status is "submitted" or "under_review" or "approved" or "declined") return Projection.Claim(claim);
        Validation.Version(claim, input.ExpectedUpdatedAt); Editable(claim);
        Validation.Require(claim.Description.Trim().Length >= 20 && claim.IncidentDate != "" && claim.AmountCents > 0, "Add an incident date, a positive amount and a description of at least 20 characters.", code: "CLAIM_INCOMPLETE");
        Validation.Require(Validation.Date(claim.IncidentDate, "incidentDate") <= DateOnly.FromDateTime(DateTime.UtcNow), "The incident date cannot be in the future.", "incidentDate", "INCIDENT_DATE");
        claim.Status = "submitted"; claim.UpdatedAt = Validation.NextVersion(claim.UpdatedAt); claim.Events.Add(new() { Status = "submitted" });
        return Projection.Claim(claim);
    }
    public async Task<ClaimDto> Upload(Guid id, HttpRequest request, CancellationToken cancellation)
    {
        var claim = await Owned(id);
        if (request.ContentLength > 11 * 1024 * 1024) throw new ApiException(413, "FILE_TOO_LARGE", "Files must be 10 MB or smaller.");
        Validation.Require(request.HasFormContentType, "Upload a multipart file.", code: "INVALID_FILE");
        var form = await request.ReadFormAsync(cancellation);
        var file = form.Files.GetFile("file");
        Validation.Require(file != null && form.Files.Count == 1 && file.Length is > 0 and <= 10 * 1024 * 1024, "Choose a PDF, PNG or JPEG file up to 10 MB.", code: "INVALID_FILE");
        var attemptValue = form["attemptId"].ToString();
        var attemptId = Guid.NewGuid();
        if (attemptValue.Length > 0) Validation.Require(Guid.TryParse(attemptValue, out attemptId), "Use a UUID as the upload identity.", code: "INVALID_UPLOAD_ATTEMPT");
        using var memory = new MemoryStream((int)file!.Length);
        await file.CopyToAsync(memory, cancellation);
        var bytes = memory.ToArray();
        Validation.Require(Signature(bytes, file.ContentType), "Choose a valid PDF, PNG or JPEG file.", code: "INVALID_FILE");
        var digest = Convert.ToHexString(SHA256.HashData(bytes));
        var name = string.Concat(Path.GetFileName(file.FileName).Normalize().Select(c => char.IsControl(c) || c is '/' or '\\' ? '_' : c));
        if (name.Length > 180) name = name[..180];
        if (name.Length == 0) name = "document";
        var prior = await db.Evidence.FindAsync([attemptId], cancellation);
        if (prior != null)
        {
            if (prior.OwnerId != claim.OwnerId || prior.BoundClaimId != claim.Id) throw new ApiException(409, "UPLOAD_ATTEMPT_CONFLICT", "This upload identity was used for a different file or claim.");
            if (prior.Abandoned) throw new ApiException(409, "UPLOAD_ATTEMPT_EXPIRED", "This upload was abandoned. Select the file again.");
            if (prior.Sha256 != digest || prior.Name != name || prior.MimeType != file.ContentType) throw new ApiException(409, "UPLOAD_ATTEMPT_CONFLICT", "This upload identity was used for a different file or claim.");
            return Projection.Claim(claim);
        }
        Editable(claim);
        Validation.Require(claim.Evidence.Count(x => !x.Abandoned) < 10, "A claim can include up to 10 files.", code: "FILE_LIMIT");
        var evidence = new EvidenceEntity { Id = attemptId, OwnerId = claim.OwnerId, ClaimId = claim.Id, BoundClaimId = claim.Id, Name = name, MimeType = file.ContentType, Size = bytes.Length, Content = new EvidenceContentEntity { EvidenceId = attemptId, Bytes = bytes }, Sha256 = digest };
        claim.Evidence.Add(evidence);
        claim.UpdatedAt = Validation.NextVersion(claim.UpdatedAt);
        return Projection.Claim(claim);
    }
    public async Task<object> Abandon(Guid id, Guid attemptId)
    {
        var claim = await Owned(id);
        var existing = await db.Evidence.FindAsync(attemptId);
        if (existing != null)
        {
            if (existing.OwnerId != claim.OwnerId || existing.BoundClaimId != claim.Id) throw Validation.Missing();
            // Upload and metadata attach in the same transaction: an attached file is durable.
            return new { claim = Projection.Claim(claim), abandoned = existing.Abandoned };
        }
        db.Evidence.Add(new() { Id = attemptId, OwnerId = claim.OwnerId, BoundClaimId = claim.Id, Abandoned = true });
        return new { claim = Projection.Claim(claim), abandoned = true };
    }
    public async Task<IResult> Download(Guid id, Guid documentId, bool operations = false)
    {
        var claim = await Owned(id, operations);
        var document = claim.Evidence.SingleOrDefault(x => x.Id == documentId && !x.Abandoned) ?? throw Validation.Missing();
        var bytes = await db.EvidenceContents.Where(x => x.EvidenceId == document.Id).Select(x => x.Bytes).SingleOrDefaultAsync() ?? throw Validation.Missing();
        return Results.File(bytes, document.MimeType, document.Name, enableRangeProcessing: false);
    }
    private static bool Signature(byte[] bytes, string mime) => mime switch
    {
        "application/pdf" => bytes.AsSpan().StartsWith("%PDF-"u8),
        "image/png" => bytes.AsSpan().StartsWith(new byte[] {137, 80, 78, 71, 13, 10, 26, 10}),
        "image/jpeg" => bytes.AsSpan().StartsWith(new byte[] {255, 216, 255}),
        _ => false
    };
}
public static class ClaimEndpoints
{
    public static void MapClaims(this RouteGroupBuilder api)
    {
        api.MapGet("/claims", async (InsuranceDbContext db, CurrentOwner owner) =>
        {
            var user = await owner.Require();
            return new { claims = (await db.Claims.Where(x => x.OwnerId == user.Id).OrderByDescending(x => x.CreatedAt).WithDetails().Take(200).ToListAsync()).Select(Projection.Claim) };
        });
        api.MapPost("/claims", (ClaimInput input, HttpRequest request, ClaimService claims) => claims.Create(input, request.Headers.ContainsKey("Idempotency-Key") ? request.Headers["Idempotency-Key"].ToString() : null));
        api.MapGet("/claims/{id:guid}", async (Guid id, ClaimService claims) => Projection.Claim(await claims.Owned(id)));
        api.MapPatch("/claims/{id:guid}", (Guid id, ClaimInput input, ClaimService claims) => claims.Update(id, input));
        api.MapDelete("/claims/{id:guid}", async (Guid id, HttpRequest request, ClaimService claims, InsuranceDbContext db) =>
        {
            var claim = await claims.Owned(id);
            var input = request.HasJsonContentType() && request.ContentLength != 0 ? await request.ReadFromJsonAsync<VersionInput>() : null;
            Validation.Version(claim, input?.ExpectedUpdatedAt ?? request.Query["expectedUpdatedAt"].FirstOrDefault());
            if (claim.Status != "draft") throw new ApiException(409, "CLAIM_LOCKED", "Only a draft claim can be deleted.");
            db.Claims.Remove(claim);
            return new { ok = true };
        });
        api.MapPost("/claims/{id:guid}/submit", (Guid id, VersionInput input, ClaimService claims) => claims.Submit(id, input));
        api.MapPost("/claims/{id:guid}/documents", (Guid id, HttpRequest request, ClaimService claims, CancellationToken cancellation) => claims.Upload(id, request, cancellation)).DisableAntiforgery();
        api.MapPost("/claims/{id:guid}/uploads/{attemptId:guid}/abandon", (Guid id, Guid attemptId, ClaimService claims) => claims.Abandon(id, attemptId));
        api.MapGet("/claims/{id:guid}/documents/{documentId:guid}", (Guid id, Guid documentId, ClaimService claims) => claims.Download(id, documentId));
    }
}
