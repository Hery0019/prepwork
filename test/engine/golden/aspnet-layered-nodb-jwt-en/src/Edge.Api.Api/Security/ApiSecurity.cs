using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Edge.Api.Api.Security;

// SECJ-002: this application validates tokens, it issues none.
public static class ApiSecurity
{
    public static IServiceCollection AddApiSecurity(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        // SECJ-005: business tests do not have to reach an identity provider.
        if (!configuration.GetValue("Security:Enabled", defaultValue: true))
        {
            return services;
        }

        var authority =
            configuration["JWT_AUTHORITY"]
            ?? throw new InvalidOperationException("JWT_AUTHORITY is not set (see .env.example)");
        var audience = configuration["JWT_AUDIENCE"];

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = authority;
                options.Audience = audience;
                // SECJ-AP-002: the metadata carries the signing keys; never in clear text.
                options.RequireHttpsMetadata = !authority.StartsWith(
                    "http://localhost",
                    StringComparison.OrdinalIgnoreCase
                );
                // SECJ-004: the four checks, spelled out, so that disabling one is visible.
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = !string.IsNullOrWhiteSpace(audience),
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
            });

        // SECJ-001: closed by default. A public endpoint is an explicit `[AllowAnonymous]`.
        services
            .AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        return services;
    }

    public static WebApplication UseApiSecurity(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        if (!app.Configuration.GetValue("Security:Enabled", defaultValue: true))
        {
            return app;
        }

        app.UseAuthentication();
        app.UseAuthorization();
        return app;
    }
}
