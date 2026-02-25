namespace Edge.Api.Domain.Notes;

/// <summary>Reference example: a text note.</summary>
// NET-005: no persistence or serialisation attribute. The relational mapping is declared
// in the infrastructure layer, the only one that knows about a database.
public sealed class Note
{
    /// <summary>Required by the relational mapping, which materialises without the constructor.</summary>
    private Note() { }

    public Note(string title, string body, DateTimeOffset createdAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        Title = title;
        Body = body ?? string.Empty;
        CreatedAt = createdAt;
    }

    public long Id { get; private set; }

    /// <summary>Assigned by the persistence adapter when the note is first stored.</summary>
    public void AssignIdentity(long id)
    {
        if (Id != 0)
        {
            throw new InvalidOperationException("Identity already assigned");
        }

        Id = id;
    }

    public string Title { get; private set; } = string.Empty;

    public string Body { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; }
}
