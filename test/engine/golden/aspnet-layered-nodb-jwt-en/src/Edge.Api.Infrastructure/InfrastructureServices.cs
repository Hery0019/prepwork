using Edge.Api.Application.Notes;
using Edge.Api.Infrastructure.Notes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Edge.Api.Infrastructure;

// NET-010: the single registration point of the layer, called by `Program`.
public static class InfrastructureServices
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        ArgumentNullException.ThrowIfNull(services);

        // With no database the repository lives in memory: replace it as soon as a database exists.
        services.AddSingleton<INoteRepository, InMemoryNoteRepository>();

        return services;
    }
}
