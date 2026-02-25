using BackOffice.Domain.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BackOffice.Api.Common;

// CORE-011 : le point de traduction unique des exceptions en réponses. Les erreurs de
// validation n'y passent pas : `[ApiController]` répond 400 avant d'atteindre le pipeline.
internal sealed partial class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger
) : IExceptionHandler
{
    // Journalisation générée à la compilation : pas de boxing, pas de formatage inutile
    // quand le niveau est désactivé. C'est ce qu'exige l'analyseur CA1848.
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
            // Seul le 500 est journalisé : un 404 est un cas nominal, pas un incident.
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
                    // CORE-036 : jamais de message interne ni de stack trace dans un 500.
                    Detail =
                        status == StatusCodes.Status500InternalServerError ? null : exception.Message,
                },
            }
        );
    }
}
