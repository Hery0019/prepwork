using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Solumada.PayFlow.Tests.Support;

// CORE-020 : l'hôte des tests slice et d'intégration. Un test slice remplace les ports par
// des doublures ; un test d'intégration branche la base Testcontainers.
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly Dictionary<string, string?> _settings = [];
    private Action<IServiceCollection>? _configureServices;
    private bool _migrate;

    /// <summary>Force un réglage de configuration pour ce test.</summary>
    public ApiFactory WithSetting(string key, string? value)
    {
        _settings[key] = value;
        return this;
    }

    /// <summary>Remplace des services enregistrés — un port par une doublure.</summary>
    public ApiFactory WithServices(Action<IServiceCollection> configure)
    {
        _configureServices = configure;
        return this;
    }

    /// <summary>Branche la base du conteneur et applique les migrations avant le premier test.</summary>
    public ApiFactory WithDatabase(string connectionString)
    {
        _migrate = true;
        return WithSetting("DB_CONNECTION_STRING", connectionString);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        builder.UseEnvironment("Testing");
        // L'authentification est éteinte par défaut : un test métier ne dépend pas du mode
        // d'authentification choisi. Les tests de sécurité la rallument explicitement.
        builder.UseSetting("Security:Enabled", "false");
        // EF Core n'ouvre aucune connexion au démarrage : un test slice tourne avec cette
        // chaîne factice, qu'un test d'intégration remplace.
        builder.UseSetting("DB_CONNECTION_STRING", "Host=localhost;Port=5432;Database=slice;Username=slice;Password=slice");

        foreach (var (key, value) in _settings)
        {
            builder.UseSetting(key, value);
        }

        if (_configureServices is not null)
        {
            builder.ConfigureTestServices(_configureServices);
        }
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        if (_migrate)
        {
            // CORE-021 : le schéma vient des migrations, jamais d'un `EnsureCreated`.
            DatabaseMigrator.Migrate(host.Services);
        }

        return host;
    }
}
