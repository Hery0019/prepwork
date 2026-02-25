using System.Net;
using System.Net.Http.Json;
using Edge.Api.Application.Notes;
using Edge.Api.Domain.Notes;
using Edge.Api.Tests.Support;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace Edge.Api.Tests.Slice;

// Slice level (CORE-020): the whole HTTP pipeline — routing, validation, error
// translation — but the port is a test double, so no database is needed.
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
        // CORE-010: even on a validation error, the response is a `ProblemDetails`.
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

    // CORE-014: the shape clients expect, checked from the outside.
    private sealed record PageResponse(
        IReadOnlyList<NoteView> Content,
        int Page,
        int Size,
        long TotalElements
    );
}
