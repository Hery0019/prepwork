package mg.solumada.payflow.note;

/**
 * Événement de domaine (MOD-006) : un fait passé, immuable, publié par la façade du module.
 */
public record NoteCreated(Long noteId, String title) {}
