using System.Net;
using System.Net.Http.Json;
using BackOffice.Application.Notes;
using BackOffice.Domain.Notes;
using BackOffice.Tests.Support;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace BackOffice.Tests.Slice;

// Niveau slice (CORE-020) : le pipeline HTTP complet — routage, validation, traduction
// des erreurs — mais le port est une doublure, donc aucune base n'est nécessaire.
[Trait("Category", "Slice")]
public sealed class NotesControllerTest
{
    private static ApiFactory FactoryWith(INoteRepository notes) =>
        new ApiFactory().WithServices(services => services.AddScoped(_ => notes));

    [Fact]
    public async Task Create_TitleBlank_Returns400()
    {
        using var factory = FactoryWith(Substitute.For<INoteRepository>());
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/notes",
            new { title = "", body = "Body" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        // CORE-010 : même sur une erreur de validation, la réponse est un `ProblemDetails`.
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        var notes = Substitute.For<INoteRepository>();
        notes
            .FindAsync(Arg.Any<long>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<Note?>(null));

        using var factory = FactoryWith(notes);
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/notes/404", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task List_NoNote_ReturnsAnEmptyPage()
    {
        var notes = Substitute.For<INoteRepository>();
        notes
            .ListAsync(0, 20, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<(IReadOnlyList<Note>, long)>(([], 0)));

        using var factory = FactoryWith(notes);
        using var client = factory.CreateClient();

        var page = await client.GetFromJsonAsync<PageResponse>(
            new Uri("/api/v1/notes", UriKind.Relative)
        );

        Assert.NotNull(page);
        Assert.Empty(page.Content);
        Assert.Equal(0, page.TotalElements);
    }

    // CORE-014 : la forme attendue par les clients, vérifiée depuis l'extérieur.
    private sealed record PageResponse(
        IReadOnlyList<NoteView> Content,
        int Page,
        int Size,
        long TotalElements
    );
}
