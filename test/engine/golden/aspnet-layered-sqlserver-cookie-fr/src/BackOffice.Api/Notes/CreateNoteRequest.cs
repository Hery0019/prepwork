using System.ComponentModel.DataAnnotations;

namespace BackOffice.Api.Notes;

// CORE-013 : les contraintes sont déclarées sur le DTO d'entrée. `[ApiController]` répond
// un 400 au format `ProblemDetails` avant que le contrôleur ne soit appelé.
//
// Sur un `record`, les attributs vont sur le paramètre du constructeur, jamais sur la
// propriété via `[property: …]` : MVC refuse ce cas et lève au premier appel.
public sealed record CreateNoteRequest(
    [Required][StringLength(200, MinimumLength = 1)] string Title,
    [StringLength(2000)] string Body
);
