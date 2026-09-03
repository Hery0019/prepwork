using Edge.Api.Domain.Common;
using Edge.Api.Domain.Notes;

namespace Edge.Api.Application.Notes;

// The use case. Testable with no database and no host: its dependencies are a port and a
// clock, both replaceable in a unit test (CORE-020).
public sealed class NoteService(INoteRepository notes, TimeProvider clock)
{
    public async Task<NoteView> CreateAsync(
        string title,
        string body,
        CancellationToken cancellationToken
    )
    {
        var created = await notes.AddAsync(new Note(title, body, clock.GetUtcNow()), cancellationToken);
        return NoteView.From(created);
    }

    public async Task<NoteView> GetAsync(long id, CancellationToken cancellationToken)
    {
        var note =
            await notes.FindAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Note {id} not found");
        return NoteView.From(note);
    }

    public async Task<PagedResult<NoteView>> ListAsync(
        int page,
        int size,
        CancellationToken cancellationToken
    )
    {
        // CORE-014: pagination is bounded here, not in the controller.
        var boundedPage = Math.Max(page, 0);
        var boundedSize = Math.Clamp(size, 1, 100);
        var (items, total) = await notes.ListAsync(boundedPage, boundedSize, cancellationToken);
        return new PagedResult<NoteView>(
            [.. items.Select(NoteView.From)],
            boundedPage,
            boundedSize,
            total
        );
    }
}
