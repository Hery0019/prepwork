using System.Reflection;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;

namespace Edge.Api.Tests.Architecture;

// Core rules, true whatever the profile. Each test carries the identifier of the rule it
// holds: `check:content` rejects a tooled rule with no test.
[Trait("Category", "Unit")]
public sealed class CoreArchitectureTest
{
    private static readonly Assembly[] SolutionAssemblies =
    [
        Assembly.Load("Edge.Api.Domain"),
        Assembly.Load("Edge.Api.Application"),
        Assembly.Load("Edge.Api.Infrastructure"),
        Assembly.Load("Edge.Api.Api"),
        Assembly.Load("Edge.Api.Tests"),
    ];

    private static readonly Assembly ApiAssembly = Assembly.Load("Edge.Api.Api");
    private static readonly Assembly DomainAssembly = Assembly.Load("Edge.Api.Domain");

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
        // The shared domain types (exceptions, pagination) live in `.Common` and are
        // still reachable; only the entities are out of a controller's reach.
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
