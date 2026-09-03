using Solumada.PayFlow.Domain.Notes;

namespace Solumada.PayFlow.Application.Notes;

// NET-002 : le port. La couche applicative le déclare, l'infrastructure l'implémente ;
// aucune référence de projet ne remonte, donc aucun type EF Core n'est atteignable ici.
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
