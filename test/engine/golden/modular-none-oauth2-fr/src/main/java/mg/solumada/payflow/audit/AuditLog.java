package mg.solumada.payflow.audit;

import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

/**
 * Façade publique du module `audit` : compte les notes créées, alimentée par les événements du module `note` (MOD-005). Exemple volontairement minimal.
 */
@Service
public class AuditLog {

    private final AtomicLong createdNotes = new AtomicLong();

    public void recordCreatedNote() {
        createdNotes.incrementAndGet();
    }

    public long createdNotes() {
        return createdNotes.get();
    }
}
