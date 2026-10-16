using InsuranceGroup.Api.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace InsuranceGroup.Api.Infrastructure;

public sealed class InsuranceDbContext(DbContextOptions<InsuranceDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<QuoteSessionEntity> QuoteSessions => Set<QuoteSessionEntity>();
    public DbSet<QuoteEntity> Quotes => Set<QuoteEntity>();
    public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    public DbSet<TravelerEntity> Travelers => Set<TravelerEntity>();
    public DbSet<PolicyEntity> Policies => Set<PolicyEntity>();
    public DbSet<ClaimEntity> Claims => Set<ClaimEntity>();
    public DbSet<EvidenceEntity> Evidence => Set<EvidenceEntity>();
    public DbSet<EvidenceContentEntity> EvidenceContents => Set<EvidenceContentEntity>();
    public DbSet<ClaimRequestEntity> ClaimRequests => Set<ClaimRequestEntity>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<QuoteSessionEntity>().HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<QuoteSessionEntity>().Property(x => x.TripJson).HasColumnType("jsonb");
        b.Entity<QuoteEntity>().HasOne(x => x.Session).WithMany(x => x.Quotes).HasForeignKey(x => x.SessionId);
        b.Entity<QuoteEntity>().Property(x => x.SnapshotJson).HasColumnType("jsonb");
        b.Entity<OrderEntity>().HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<OrderEntity>().HasOne(x => x.OriginalQuote).WithMany().HasForeignKey(x => x.QuoteId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<OrderEntity>().HasIndex(x => x.QuoteId).IsUnique();
        b.Entity<OrderEntity>().Property(x => x.TripJson).HasColumnType("jsonb");
        b.Entity<OrderEntity>().Property(x => x.QuoteJson).HasColumnType("jsonb");
        b.Entity<TravelerEntity>().HasOne(x => x.Order).WithMany(x => x.Travelers).HasForeignKey(x => x.OrderId);
        b.Entity<TravelerEntity>().HasIndex(x => new { x.OrderId, x.Position }).IsUnique();
        b.Entity<PolicyEntity>().HasOne(x => x.Order).WithOne(x => x.Policy).HasForeignKey<PolicyEntity>(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<PolicyEntity>().HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<PolicyEntity>().HasIndex(x => x.Number).IsUnique();
        b.Entity<ClaimEntity>().HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<ClaimEntity>().HasOne(x => x.Policy).WithMany().HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<ClaimEntity>().Property(x => x.UpdatedAt).IsConcurrencyToken();
        b.Entity<ClaimEntity>().ToTable("Claims", t => t.HasCheckConstraint("CK_Claims_Amount", "\"AmountCents\" >= 0 AND \"AmountCents\" <= 100000000"));
        b.Entity<EvidenceEntity>().HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<EvidenceEntity>().HasOne(x => x.Claim).WithMany(x => x.Evidence).HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<EvidenceEntity>().ToTable("Evidence", t => t.HasCheckConstraint("CK_Evidence_Size", "\"Size\" >= 0 AND \"Size\" <= 10485760"));
        b.Entity<EvidenceContentEntity>().HasKey(x => x.EvidenceId);
        b.Entity<EvidenceContentEntity>().HasOne(x => x.Evidence).WithOne(x => x.Content).HasForeignKey<EvidenceContentEntity>(x => x.EvidenceId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<EvidenceContentEntity>().ToTable("EvidenceContents", t => t.HasCheckConstraint("CK_EvidenceContents_Size", "octet_length(\"Bytes\") <= 10485760"));
        b.Entity<ClaimRequestEntity>().HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<ClaimRequestEntity>().HasIndex(x => new { x.OwnerId, x.Key }).IsUnique();
        b.Entity<OrderEventEntity>().HasOne(x => x.Order).WithMany(x => x.Events).HasForeignKey(x => x.OrderId);
        b.Entity<ClaimEventEntity>().HasOne(x => x.Claim).WithMany(x => x.Events).HasForeignKey(x => x.ClaimId);
        foreach (var type in b.Model.GetEntityTypes())
        foreach (var property in type.GetProperties().Where(p => p.IsPrimaryKey() && p.ClrType == typeof(Guid)))
            property.ValueGenerated = ValueGenerated.Never;
        foreach (var type in b.Model.GetEntityTypes())
        foreach (var property in type.GetProperties().Where(p => p.ClrType == typeof(string) && p.GetColumnType() != "jsonb"))
            if (property.GetMaxLength() == null) property.SetMaxLength(property.Name == "Description" ? 10000 : 1024);
    }
}
