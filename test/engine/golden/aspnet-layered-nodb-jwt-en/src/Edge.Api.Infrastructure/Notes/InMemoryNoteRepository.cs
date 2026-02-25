using Edge.Api.Application.Notes;
using Edge.Api.Domain.Notes;

namespace Edge.Api.Infrastructure.Notes;

// In-memory repository, until a database exists. It honours the same contract as the
// persistent one: replacing it touches neither the application layer nor the API (NET-007).
internal sealed class InMemoryNoteRepository : INoteRepository
{
    private readonly Lock _gate = new();
    private readonly List<Note> _notes = [];
    private long _sequence;

    public Task<Note> AddAsync(Note note, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(note);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            note.AssignIdentity(++_sequence);
            _notes.Add(note);
        }

        return Task.FromResult(note);
    }

    public Task<Note?> FindAsync(long id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            return Task.FromResult(_notes.Find(note => note.Id == id));
        }
    }

    public Task<(IReadOnlyList<Note> Items, long Total)> ListAsync(
        int page,
        int size,
        CancellationToken cancellationToken
    )
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            IReadOnlyList<Note> items =
            [
                .. _notes.OrderByDescending(note => note.CreatedAt).Skip(page * size).Take(size),
            ];
            return Task.FromResult((items, (long)_notes.Count));
        }
    }
}
