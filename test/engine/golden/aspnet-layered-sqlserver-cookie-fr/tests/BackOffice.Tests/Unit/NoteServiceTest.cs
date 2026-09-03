using BackOffice.Application.Notes;
using BackOffice.Domain.Common;
using BackOffice.Domain.Notes;
using NSubstitute;

namespace BackOffice.Tests.Unit;

// Niveau unitaire (CORE-020) : aucun hôte, aucune base. Le port est une doublure et
// l'horloge est fixe, donc le test est déterministe et tient en millisecondes.
[Trait("Category", "Unit")]
public sealed class NoteServiceTest
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly INoteRepository _notes = Substitute.For<INoteRepository>();
    private readonly NoteService _service;

    public NoteServiceTest() => _service = new NoteService(_notes, new FixedClock(Now));

    [Fact]
    public async Task CreateAsync_ValidTitle_StampsTheCreationTime()
    {
        _notes
            .AddAsync(Arg.Any<Note>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => Task.FromResult(callInfo.Arg<Note>()));

        var created = await _service.CreateAsync("Title", "Body", CancellationToken.None);

        Assert.Equal(Now, created.CreatedAt);
        Assert.Equal("Title", created.Title);
    }

    [Fact]
    public async Task GetAsync_UnknownId_ThrowsNotFound()
    {
        _notes.FindAsync(42, Arg.Any<CancellationToken>()).Returns(Task.FromResult<Note?>(null));

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(42, CancellationToken.None)
        );
    }

    [Fact]
    public async Task ListAsync_SizeAboveTheCap_IsBoundedTo100()
    {
        _notes
            .ListAsync(0, 100, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<(IReadOnlyList<Note>, long)>(([], 0)));

        var page = await _service.ListAsync(0, 5_000, CancellationToken.None);

        Assert.Equal(100, page.Size);
        await _notes.Received(1).ListAsync(0, 100, Arg.Any<CancellationToken>());
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
