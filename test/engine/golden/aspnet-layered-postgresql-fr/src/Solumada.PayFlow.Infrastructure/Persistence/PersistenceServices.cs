using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Solumada.PayFlow.Infrastructure.Persistence;

// Point d'entrée de la persistance : `AddInfrastructure` l'appelle, et rien d'autre ne
// connaît le `DbContext`.
public static class PersistenceServices
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        // PERS-003 : la chaîne vient de l'environnement. Absente, l'application refuse de
        // démarrer plutôt que de se rabattre sur une base locale silencieuse.
        var connectionString =
            configuration["DB_CONNECTION_STRING"]
            ?? throw new InvalidOperationException(
                "DB_CONNECTION_STRING is not set (see .env.example)"
            );

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        return services;
    }
}
