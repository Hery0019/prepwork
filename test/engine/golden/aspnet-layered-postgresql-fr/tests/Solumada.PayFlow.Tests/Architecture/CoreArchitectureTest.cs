using System.Reflection;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;

namespace Solumada.PayFlow.Tests.Architecture;

// Règles du socle, valables quel que soit le profil. Chaque test porte l'identifiant de la
// règle qu'il tient : `check:content` refuse une règle outillée sans test.
[Trait("Category", "Unit")]
public sealed class CoreArchitectureTest
{
    private static readonly Assembly[] SolutionAssemblies =
    [
        Assembly.Load("Solumada.PayFlow.Domain"),
        Assembly.Load("Solumada.PayFlow.Application"),
        Assembly.Load("Solumada.PayFlow.Infrastructure"),
        Assembly.Load("Solumada.PayFlow.Api"),
        Assembly.Load("Solumada.PayFlow.Tests"),
    ];

    private static readonly Assembly ApiAssembly = Assembly.Load("Solumada.PayFlow.Api");
    private static readonly Assembly DomainAssembly = Assembly.Load("Solumada.PayFlow.Domain");

    [Fact]
    public void CORE_011_exactly_one_handler_translates_exceptions()
    {
        var handlers = Types
            .InAssembly(ApiAssembly)
            .That()
            .ImplementInterface(typeof(IExceptionHandler))
            .GetTypes();

        Assert.Single(handlers);
    }

    [Fact]
    public void CORE_012_controllers_do_not_name_a_domain_entity()
    {
        // Les types partagés du domaine (exceptions, pagination) vivent dans `.Common` et
        // restent accessibles ; seules les entités sont hors de portée d'un contrôleur.
        var entityNamespaces = DomainAssembly
            .GetExportedTypes()
            .Select(type => type.Namespace)
            .Where(name => name is not null && !name.EndsWith(".Common", StringComparison.Ordinal))
            .Distinct()
            .Cast<string>()
            .ToArray();

        var result = Types
            .InAssembly(ApiAssembly)
            .That()
            .Inherit(typeof(ControllerBase))
            .ShouldNot()
            .HaveDependencyOnAny(entityNamespaces)
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    [Fact]
    public void CORE_015_every_controller_is_mapped_under_api_v1()
    {
        var controllers = Types
            .InAssembly(ApiAssembly)
            .That()
            .Inherit(typeof(ControllerBase))
            .GetTypes();

        Assert.All(
            controllers,
            controller =>
            {
                var route = controller.GetCustomAttribute<RouteAttribute>();
                Assert.NotNull(route);
                Assert.StartsWith("api/v1/", route.Template, StringComparison.Ordinal);
            }
        );
    }

    [Fact]
    public void CORE_021_no_project_uses_an_in_memory_database_provider()
    {
        var result = Types
            .InAssemblies(SolutionAssemblies)
            .ShouldNot()
            .HaveDependencyOnAny(
                "Microsoft.EntityFrameworkCore.InMemory",
                "Microsoft.EntityFrameworkCore.Sqlite"
            )
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    [Fact]
    public void CORE_023_every_test_class_declares_its_category()
    {
        var result = Types
            .InAssembly(typeof(CoreArchitectureTest).Assembly)
            .That()
            .HaveNameEndingWith("Test")
            .Should()
            .HaveCustomAttribute(typeof(TraitAttribute))
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    private static string Explain(TestResult result) =>
        result.FailingTypeNames is null ? string.Empty : string.Join(", ", result.FailingTypeNames);
}
