using Edge.Api.Domain.Notes;

namespace Edge.Api.Application.Notes;

// NET-002: the port. The application layer declares it, infrastructure implements it;
// no project reference points upwards, so no EF Core type is reachable here.
public interface INoteRepository
{
    Task<Note> AddAsync(Note note, CancellationToken cancellationToken);

    Task<Note?> FindAsync(long id, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Note> Items, long Total)> ListAsync(
        int page,
        int size,
        CancellationToken cancellationToken
    );
}
