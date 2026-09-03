using Microsoft.AspNetCore.Mvc;
using Solumada.PayFlow.Application.Notes;
using Solumada.PayFlow.Domain.Common;

namespace Solumada.PayFlow.Api.Notes;

// NET-004 : une seule dépendance, le service applicatif. Ni `DbContext`, ni dépôt.
// CORE-015 : la route porte la version dès le premier jour.
[ApiController]
[Route("api/v1/notes")]
public sealed class NotesController(NoteService notes) : ControllerBase
{
    /// <summary>Crée une note.</summary>
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

    /// <summary>Lit une note.</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NoteView>> GetById(long id, CancellationToken cancellationToken) =>
        Ok(await notes.GetAsync(id, cancellationToken));

    /// <summary>Liste les notes, de la plus récente à la plus ancienne.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<NoteView>>> List(
        CancellationToken cancellationToken,
        [FromQuery] int page = 0,
        [FromQuery] int size = 20
    ) => Ok(await notes.ListAsync(page, size, cancellationToken));
}
