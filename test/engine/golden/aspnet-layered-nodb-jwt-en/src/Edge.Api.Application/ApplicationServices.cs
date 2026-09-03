using Edge.Api.Application.Notes;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Edge.Api.Application;

// NET-010: the single registration point of the layer. `Program` calls it and needs to know
// nothing about the services it contains.
public static class ApplicationServices
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<NoteService>();
        return services;
    }
}
