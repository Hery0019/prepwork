namespace BackOffice.Api.Common;

// CORE-034 : ASP.NET Core ne pose aucun de ces en-têtes par défaut, contrairement à
// Spring Security. Les retirer demande un ADR.
internal sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var headers = context.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        headers["Cross-Origin-Opener-Policy"] = "same-origin";

        return next(context);
    }
}
