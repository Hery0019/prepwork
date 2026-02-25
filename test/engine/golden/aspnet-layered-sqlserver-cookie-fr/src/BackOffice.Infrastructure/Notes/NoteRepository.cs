using BackOffice.Application.Notes;
using BackOffice.Domain.Notes;
using BackOffice.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BackOffice.Infrastructure.Notes;

// NET-007 : `internal`. Le reste de l'application ne voit que `INoteRepository`, donc
// personne ne peut l'injecter directement, même en étant pressé.
internal sealed class NoteRepository(AppDbContext context) : INoteRepository
{
    public async Task<Note> AddAsync(Note note, CancellationToken cancellationToken)
    {
        context.Set<Note>().Add(note);
        await context.SaveChangesAsync(cancellationToken);
        return note;
    }

    public Task<Note?> FindAsync(long id, CancellationToken cancellationToken) =>
        context.Set<Note>().AsNoTracking().FirstOrDefaultAsync(note => note.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<Note> Items, long Total)> ListAsync(
        int page,
        int size,
        CancellationToken cancellationToken
    )
    {
        var query = context.Set<Note>().AsNoTracking().OrderByDescending(note => note.CreatedAt);
        var total = await query.LongCountAsync(cancellationToken);
        var items = await query.Skip(page * size).Take(size).ToListAsync(cancellationToken);
        return (items, total);
    }
}
