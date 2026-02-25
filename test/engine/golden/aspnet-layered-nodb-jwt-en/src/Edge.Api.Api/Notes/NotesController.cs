using Edge.Api.Application.Notes;
using Edge.Api.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Edge.Api.Api.Notes;

// NET-004: a single dependency, the application service. No `DbContext`, no repository.
// CORE-015: the route carries the version from day one.
[ApiController]
[Route("api/v1/notes")]
public sealed class NotesController(NoteService notes) : ControllerBase
{
    /// <summary>Creates a note.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<NoteView>> Create(
        CreateNoteRequest request,
        CancellationToken cancellationToken
    )
    {
        ArgumentNullException.ThrowIfNull(request);

        var created = await notes.CreateAsync(request.Title, request.Body, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Reads one note.</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NoteView>> GetById(long id, CancellationToken cancellationToken) =>
        Ok(await notes.GetAsync(id, cancellationToken));

    /// <summary>Lists the notes, most recent first.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<NoteView>>> List(
        CancellationToken cancellationToken,
        [FromQuery] int page = 0,
        [FromQuery] int size = 20
    ) => Ok(await notes.ListAsync(page, size, cancellationToken));
}
