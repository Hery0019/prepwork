using Solumada.PayFlow.Api.Common;
using Solumada.PayFlow.Api.Security;
using Solumada.PayFlow.Application;
using Solumada.PayFlow.Infrastructure;

// Racine de composition (NET-003) : le seul endroit qui nomme un type d'infrastructure.
// Elle n'a pas d'espace de noms — `Program` doit rester accessible aux tests.
var builder = WebApplication.CreateBuilder(args);

// CORE-010 et CORE-011 : une seule forme d'erreur, un seul traducteur.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// CORE-033 : liste explicite d'origines, `CORS_ORIGINS` l'emporte sur la configuration.
var configuredOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
var environmentOrigins = builder.Configuration["CORS_ORIGINS"];
var origins = string.IsNullOrWhiteSpace(environmentOrigins)
    ? configuredOrigins
    : environmentOrigins.Split(
        ',',
        StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
    );
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod())
);

// NET-010 : chaque couche enregistre ses propres services.
builder.Services.AddApiSecurity(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    // CORE-036 : le document OpenAPI n'est servi qu'en développement.
    app.MapOpenApi();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseApiSecurity();

app.MapControllers();

// CORE-032 : le seul endpoint de diagnostic, et il reste public.
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();

// Rend `Program` visible à `WebApplicationFactory<Program>` (CORE-020).
public partial class Program;
