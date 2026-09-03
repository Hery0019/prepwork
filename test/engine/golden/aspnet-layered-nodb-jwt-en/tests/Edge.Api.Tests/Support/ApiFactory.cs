using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Edge.Api.Tests.Support;

// CORE-020: the host of slice and integration tests. A slice test replaces the ports with
// test doubles; an integration test plugs in the Testcontainers database.
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly Dictionary<string, string?> _settings = [];
    private Action<IServiceCollection>? _configureServices;

    /// <summary>Forces one configuration setting for this test.</summary>
    public ApiFactory WithSetting(string key, string? value)
    {
        _settings[key] = value;
        return this;
    }

    /// <summary>Replaces registered services — a port by a test double.</summary>
    public ApiFactory WithServices(Action<IServiceCollection> configure)
    {
        _configureServices = configure;
        return this;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        builder.UseEnvironment("Testing");
        // Authentication is off by default: a business test does not depend on the chosen
        // authentication mode. The security tests switch it back on explicitly.
        builder.UseSetting("Security:Enabled", "false");

        foreach (var (key, value) in _settings)
        {
            builder.UseSetting(key, value);
        }

        if (_configureServices is not null)
        {
            builder.ConfigureTestServices(_configureServices);
        }
    }
}
