using BackOffice.Application.Notes;
using BackOffice.Infrastructure.Notes;
using BackOffice.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BackOffice.Infrastructure;

// NET-010 : l'unique point d'enregistrement de la couche, appelé par `Program`.
public static class InfrastructureServices
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddPersistence(configuration);
        services.AddScoped<INoteRepository, NoteRepository>();

        return services;
    }
}
