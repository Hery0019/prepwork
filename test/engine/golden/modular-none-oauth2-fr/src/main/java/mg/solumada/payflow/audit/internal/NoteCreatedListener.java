package mg.solumada.payflow.audit.internal;

import mg.solumada.payflow.audit.AuditLog;
import mg.solumada.payflow.note.NoteCreated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Réaction du module `audit` à un événement du module `note` (MOD-005) : aucune dépendance vers `note.internal` (MOD-002).
 */
@Component
public class NoteCreatedListener {

    private static final Logger log = LoggerFactory.getLogger(NoteCreatedListener.class);

    private final AuditLog auditLog;

    public NoteCreatedListener(AuditLog auditLog) {
        this.auditLog = auditLog;
    }

    @EventListener
    public void on(NoteCreated event) {
        log.info("Note created: id={} title={}", event.noteId(), event.title());
        auditLog.recordCreatedNote();
    }
}
