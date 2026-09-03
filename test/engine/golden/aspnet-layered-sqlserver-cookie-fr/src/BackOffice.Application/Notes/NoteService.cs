using BackOffice.Domain.Common;
using BackOffice.Domain.Notes;

namespace BackOffice.Application.Notes;

// Le cas d'usage. Testable sans base et sans hôte : ses dépendances sont un port et une
// horloge, tous deux remplaçables dans un test unitaire (CORE-020).
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
        // CORE-014 : la pagination est bornée ici, pas dans le contrôleur.
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
