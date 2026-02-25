using Edge.Api.Domain.Notes;

namespace Edge.Api.Application.Notes;

// CORE-012 and NET-AP-003: what the API exposes. The `Note` entity never crosses this
// boundary, so a field added to the entity is not published by accident.
public sealed record NoteView(long Id, string Title, string Body, DateTimeOffset CreatedAt)
{
    public static NoteView From(Note note)
    {
        ArgumentNullException.ThrowIfNull(note);
        return new NoteView(note.Id, note.Title, note.Body, note.CreatedAt);
    }
}
