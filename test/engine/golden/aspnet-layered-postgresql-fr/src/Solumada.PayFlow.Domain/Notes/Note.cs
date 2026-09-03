namespace Solumada.PayFlow.Domain.Notes;

/// <summary>Exemple de référence : une note de texte.</summary>
// NET-005 : aucun attribut de persistance ni de sérialisation. Le mapping relationnel est
// déclaré dans la couche infrastructure, qui est la seule à connaître une base.
public sealed class Note
{
    /// <summary>Requis par le mapping relationnel, qui matérialise sans passer par le constructeur.</summary>
    private Note() { }

    public Note(string title, string body, DateTimeOffset createdAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        Title = title;
        Body = body ?? string.Empty;
        CreatedAt = createdAt;
    }

    public long Id { get; private set; }

    /// <summary>Attribuée par l'adaptateur de persistance au premier enregistrement.</summary>
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
