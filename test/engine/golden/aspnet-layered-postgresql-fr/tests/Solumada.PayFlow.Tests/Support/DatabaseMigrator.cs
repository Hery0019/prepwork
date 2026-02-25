using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Solumada.PayFlow.Infrastructure.Persistence;

namespace Solumada.PayFlow.Tests.Support;

// PERS-005 : l'application n'applique jamais les migrations elle-même. Les tests, si —
// le conteneur démarre vide, et le schéma doit venir de l'historique des migrations.
internal static class DatabaseMigrator
{
    public static void Migrate(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
    }
}
