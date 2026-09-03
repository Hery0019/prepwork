using Edge.Api.Api.Common;
using Edge.Api.Api.Security;
using Edge.Api.Application;
using Edge.Api.Infrastructure;

// Composition root (NET-003): the only place that names an infrastructure type.
// It has no namespace — `Program` must stay reachable from the tests.
var builder = WebApplication.CreateBuilder(args);

// CORE-010 and CORE-011: one error shape, one translator.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// CORE-033: an explicit list of origins, `CORS_ORIGINS` taking precedence over configuration.
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

// NET-010: each layer registers its own services.
builder.Services.AddApiSecurity(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    // CORE-036: the OpenAPI document is served in development only.
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

// CORE-032: the only diagnostic endpoint, and it stays public.
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();

// Makes `Program` visible to `WebApplicationFactory<Program>` (CORE-020).
public partial class Program;
