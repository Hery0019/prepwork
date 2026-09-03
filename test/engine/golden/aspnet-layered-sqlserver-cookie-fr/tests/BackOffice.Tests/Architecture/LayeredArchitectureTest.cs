using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;

namespace BackOffice.Tests.Architecture;

// Les frontières descendantes sont tenues par le graphe de références : elles ne compilent
// pas si on les franchit. Ces tests tiennent ce que le compilateur ne peut pas voir.
[Trait("Category", "Unit")]
public sealed class LayeredArchitectureTest
{
    private static readonly Assembly ApiAssembly = Assembly.Load("BackOffice.Api");
    private static readonly Assembly DomainAssembly = Assembly.Load("BackOffice.Domain");
    private static readonly Assembly InfrastructureAssembly = Assembly.Load(
        "BackOffice.Infrastructure"
    );

    [Fact]
    public void NET_003_only_the_composition_root_names_an_infrastructure_type()
    {
        // `Program` n'a pas d'espace de noms : il est hors de cette sélection, et c'est
        // exactement la frontière que la règle décrit.
        var result = Types
            .InAssembly(ApiAssembly)
            .That()
            .ResideInNamespaceStartingWith("BackOffice.Api")
            .ShouldNot()
            .HaveDependencyOn("BackOffice.Infrastructure")
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
            .HaveDependencyOnAny("BackOffice.Infrastructure", "Microsoft.EntityFrameworkCore")
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
