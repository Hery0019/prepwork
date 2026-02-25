using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;

namespace Edge.Api.Tests.Architecture;

// The downward boundaries are held by the reference graph: they simply do not compile
// when crossed. These tests hold what the compiler cannot see.
[Trait("Category", "Unit")]
public sealed class LayeredArchitectureTest
{
    private static readonly Assembly ApiAssembly = Assembly.Load("Edge.Api.Api");
    private static readonly Assembly DomainAssembly = Assembly.Load("Edge.Api.Domain");
    private static readonly Assembly InfrastructureAssembly = Assembly.Load(
        "Edge.Api.Infrastructure"
    );

    [Fact]
    public void NET_003_only_the_composition_root_names_an_infrastructure_type()
    {
        // `Program` has no namespace: it falls outside this selection, and that is exactly
        // the boundary the rule describes.
        var result = Types
            .InAssembly(ApiAssembly)
            .That()
            .ResideInNamespaceStartingWith("Edge.Api.Api")
            .ShouldNot()
            .HaveDependencyOn("Edge.Api.Infrastructure")
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    [Fact]
    public void NET_004_a_controller_names_no_persistence_type()
    {
        var result = Types
            .InAssembly(ApiAssembly)
            .That()
            .Inherit(typeof(ControllerBase))
            .ShouldNot()
            .HaveDependencyOnAny("Edge.Api.Infrastructure", "Microsoft.EntityFrameworkCore")
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    [Fact]
    public void NET_005_a_domain_entity_carries_no_persistence_or_serialisation_attribute()
    {
        var result = Types
            .InAssembly(DomainAssembly)
            .That()
            .DoNotResideInNamespaceEndingWith(".Common")
            .ShouldNot()
            .HaveDependencyOnAny(
                "Microsoft.EntityFrameworkCore",
                "System.Text.Json",
                "System.ComponentModel.DataAnnotations"
            )
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    [Fact]
    public void NET_007_a_repository_implementation_is_not_public()
    {
        var result = Types
            .InAssembly(InfrastructureAssembly)
            .That()
            .HaveNameEndingWith("Repository")
            .Should()
            .NotBePublic()
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    [Fact]
    public void NET_008_a_controller_is_sealed_and_named_after_its_role()
    {
        var result = Types
            .InAssembly(ApiAssembly)
            .That()
            .Inherit(typeof(ControllerBase))
            .Should()
            .BeSealed()
            .And()
            .HaveNameEndingWith("Controller")
            .GetResult();

        Assert.True(result.IsSuccessful, Explain(result));
    }

    private static string Explain(TestResult result) =>
        result.FailingTypeNames is null ? string.Empty : string.Join(", ", result.FailingTypeNames);
}
