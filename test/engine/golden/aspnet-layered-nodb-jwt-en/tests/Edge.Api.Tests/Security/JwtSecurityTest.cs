using System.Net;
using System.Net.Http.Headers;
using Edge.Api.Tests.Support;

namespace Edge.Api.Tests.Security;

// SECJ-005: business tests run without authentication; this one switches it back on to
// check that it closes, without ever reaching the provider — no valid token is needed to
// observe a rejection.
[Trait("Category", "Slice")]
public sealed class JwtSecurityTest
{
    private static ApiFactory SecuredFactory() =>
        new ApiFactory()
            .WithSetting("Security:Enabled", "true")
            .WithSetting("JWT_AUTHORITY", "https://auth.invalid/realms/test");

    [Fact]
    public async Task SECJ_005_RequestWithoutAToken_Returns401()
    {
        using var factory = SecuredFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/notes", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SECJ_005_RequestWithAForgedToken_Returns401()
    {
        using var factory = SecuredFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            "not.a.token"
        );

        var response = await client.GetAsync(new Uri("/api/v1/notes", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SECJ_005_Health_StaysPublic_WhenAuthenticationIsOn()
    {
        using var factory = SecuredFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
