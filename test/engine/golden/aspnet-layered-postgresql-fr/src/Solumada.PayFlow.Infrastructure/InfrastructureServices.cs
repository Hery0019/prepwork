using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Solumada.PayFlow.Application.Notes;
using Solumada.PayFlow.Infrastructure.Notes;
using Solumada.PayFlow.Infrastructure.Persistence;

namespace Solumada.PayFlow.Infrastructure;

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
