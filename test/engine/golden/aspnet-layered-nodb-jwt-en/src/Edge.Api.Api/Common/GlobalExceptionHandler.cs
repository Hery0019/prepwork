using Edge.Api.Domain.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Edge.Api.Api.Common;

// CORE-011: the single point that translates exceptions into responses. Validation
// errors never reach it: `[ApiController]` answers 400 before the pipeline runs.
internal sealed partial class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger
) : IExceptionHandler
{
    // Logging generated at compile time: no boxing, no formatting wasted when the level is
    // disabled. This is what the CA1848 analyzer asks for.
    [LoggerMessage(EventId = 1, Level = LogLevel.Error, Message = "Unhandled exception on {Path}")]
    private static partial void LogUnhandled(ILogger logger, string path, Exception exception);

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ConflictException => (StatusCodes.Status409Conflict, "Conflicting state"),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected error"),
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            // Only the 500 is logged: a 404 is a nominal case, not an incident.
            LogUnhandled(logger, httpContext.Request.Path.ToString(), exception);
        }

        httpContext.Response.StatusCode = status;
        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = new ProblemDetails
                {
                    Status = status,
                    Title = title,
                    // CORE-036: never an internal message nor a stack trace in a 500.
                    Detail =
                        status == StatusCodes.Status500InternalServerError ? null : exception.Message,
                },
            }
        );
    }
}
