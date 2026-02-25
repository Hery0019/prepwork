namespace Edge.Api.Domain.Common;

// CORE-011: thrown by the domain, translated to a 404 by the single handler. The domain
// knows no HTTP status code.
public sealed class NotFoundException : Exception
{
    public NotFoundException()
        : base("Resource not found") { }

    public NotFoundException(string message)
        : base(message) { }

    public NotFoundException(string message, Exception innerException)
        : base(message, innerException) { }
}
