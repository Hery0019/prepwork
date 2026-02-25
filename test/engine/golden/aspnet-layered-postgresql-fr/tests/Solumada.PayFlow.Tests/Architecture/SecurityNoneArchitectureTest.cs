using System.Reflection;
using NetArchTest.Rules;

namespace Solumada.PayFlow.Tests.Architecture;

// SECN-003 : une authentification écrite à la main, à moitié, est pire qu'une absence
// explicite. Ce test rend l'absence vérifiable.
[Trait("Category", "Unit")]
public sealed class SecurityNoneArchitectureTest
{
    [Fact]
    public void SECN_003_no_type_wires_authentication_by_hand()
    {
        // `Program` est exclu : sans espace de noms, il sort de cette sélection. C'est lui qui
        // déclare `/health` public, et c'est la seule autorisation légitime ici.
        var result = Types
            .InAssembly(Assembly.Load("Solumada.PayFlow.Api"))
            .That()
            .ResideInNamespaceStartingWith("Solumada.PayFlow.Api")
            .ShouldNot()
            .HaveDependencyOnAny(
                "Microsoft.AspNetCore.Authentication",
                "Microsoft.AspNetCore.Authorization"
            )
            .GetResult();

        Assert.True(
            result.IsSuccessful,
            result.FailingTypeNames is null ? string.Empty : string.Join(", ", result.FailingTypeNames)
        );
    }
}
