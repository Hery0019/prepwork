using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Solumada.PayFlow.Infrastructure.Persistence;

// Utilisé uniquement par `dotnet ef`, qui doit construire un contexte sans démarrer
// l'application. Générer une migration ne se connecte à aucune base : la chaîne de repli
// ci-dessous ne sert qu'à choisir le dialecte.
internal sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") ?? "Host=localhost;Database=design;Username=design;Password=design";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }
}
