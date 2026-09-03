namespace BackOffice.Domain.Common;

// CORE-011 : levée par le domaine, traduite en 404 par le handler unique. Le domaine ne
// connaît aucun code de statut HTTP.
public sealed class NotFoundException : Exception
{
    public NotFoundException()
        : base("Resource not found") { }

    public NotFoundException(string message)
        : base(message) { }

    public NotFoundException(string message, Exception innerException)
        : base(message, innerException) { }
}
