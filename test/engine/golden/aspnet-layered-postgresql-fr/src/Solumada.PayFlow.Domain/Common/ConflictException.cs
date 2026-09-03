namespace Solumada.PayFlow.Domain.Common;

// CORE-011 : levée quand l'état demandé contredit l'état courant, traduite en 409.
public sealed class ConflictException : Exception
{
    public ConflictException()
        : base("Conflicting state") { }

    public ConflictException(string message)
        : base(message) { }

    public ConflictException(string message, Exception innerException)
        : base(message, innerException) { }
}
