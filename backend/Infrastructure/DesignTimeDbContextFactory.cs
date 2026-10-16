using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace InsuranceGroup.Api.Infrastructure;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<InsuranceDbContext>
{
    public InsuranceDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__Insurance") ?? "Host=127.0.0.1;Port=55462;Database=insurance_interview;Username=insurance_interview";
        return new(new DbContextOptionsBuilder<InsuranceDbContext>().UseNpgsql(connection).Options);
    }
}
