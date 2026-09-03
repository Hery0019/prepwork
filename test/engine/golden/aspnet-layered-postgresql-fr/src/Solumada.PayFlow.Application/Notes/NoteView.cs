using Solumada.PayFlow.Domain.Notes;

namespace Solumada.PayFlow.Application.Notes;

// CORE-012 et NET-AP-003 : ce que l'API expose. L'entité `Note` ne franchit jamais cette
// frontière, donc un champ ajouté à l'entité n'est pas publié par accident.
public sealed record NoteView(long Id, string Title, string Body, DateTimeOffset CreatedAt)
{
    public static NoteView From(Note note)
    {
        ArgumentNullException.ThrowIfNull(note);
        return new NoteView(note.Id, note.Title, note.Body, note.CreatedAt);
    }
}
