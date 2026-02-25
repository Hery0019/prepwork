using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Solumada.PayFlow.Api.Security;

// SECN-001 : aucune authentification. Les deux méthodes existent quand même pour que
// `Program` ne change pas le jour où l'option change — elles ne font rien.
public static class ApiSecurity
{
    public static IServiceCollection AddApiSecurity(
        this IServiceCollection services,
        IConfiguration configuration
    ) => services;

    public static WebApplication UseApiSecurity(this WebApplication app) => app;
}
