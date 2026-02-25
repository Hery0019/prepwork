using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Solumada.PayFlow.Application.Notes;

namespace Solumada.PayFlow.Application;

// NET-010 : l'unique point d'enregistrement de la couche. `Program` l'appelle et n'a pas à
// connaître les services qui la composent.
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
