using System.ComponentModel.DataAnnotations;

namespace Edge.Api.Api.Notes;

// CORE-013: constraints are declared on the input DTO. `[ApiController]` answers a
// 400 in the `ProblemDetails` format before the controller is even called.
//
// On a `record`, the attributes go on the constructor parameter, never on the property
// through `[property: …]`: MVC rejects that case and throws on the first call.
public sealed record CreateNoteRequest(
    [Required][StringLength(200, MinimumLength = 1)] string Title,
    [StringLength(2000)] string Body
);
