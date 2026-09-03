using System.Net;
using BackOffice.Tests.Support;

namespace BackOffice.Tests.Security;

// SECC-005 : les tests métier tournent sans authentification ; celui-ci la rallume pour
// vérifier qu'elle ferme bien, et que `/health` reste public.
[Trait("Category", "Slice")]
public sealed class CookieSecurityTest
{
    private static ApiFactory SecuredFactory() =>
        new ApiFactory().WithSetting("Security:Enabled", "true");

    [Fact]
    public async Task SECC_005_AnonymousRequest_OnABusinessEndpoint_Returns401()
    {
        using var factory = SecuredFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/notes", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SECC_005_Health_StaysPublic_WhenAuthenticationIsOn()
    {
        using var factory = SecuredFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
