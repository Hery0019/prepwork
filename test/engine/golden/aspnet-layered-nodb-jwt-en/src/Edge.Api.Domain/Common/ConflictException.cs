namespace Edge.Api.Domain.Common;

// CORE-011: thrown when the requested state contradicts the current one, translated to a 409.
public sealed class ConflictException : Exception
{
    public ConflictException()
        : base("Conflicting state") { }

    public ConflictException(string message)
        : base(message) { }

    public ConflictException(string message, Exception innerException)
        : base(message, innerException) { }
}
