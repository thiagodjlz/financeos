package br.com.financeos.audit;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import br.com.financeos.profiles.Screen;
import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuditWriter {

    @Inject
    AuditRecordRepository repository;

    // Alteração: na transação da própria operação (MANDATORY) — se a gravação falhar, a operação é
    // desfeita; se a operação falhar, o registro some junto.
    @Transactional(Transactional.TxType.MANDATORY)
    public void writeChange(AuditActor actor, AuditAction action, Screen screen, UUID recordId,
            String recordLabel, List<AuditChange> changes) {
        AuditRecord record = newRecord(AuditEventType.CHANGE, actor, action, screen);
        record.recordId = recordId;
        record.recordLabel = recordLabel;

        int position = 0;
        for (AuditChange change : changes) {
            AuditRecordChange row = new AuditRecordChange();
            row.record = record;
            row.position = position++;
            row.fieldLabel = change.field();
            row.oldValue = change.oldValue();
            row.newValue = change.newValue();
            record.changes.add(row);
        }

        repository.persist(record);
    }

    // Evento: em transação própria, para persistir mesmo quando a requisição termina em 401/403.
    public void writeEvent(AuditEventType type, AuditActor actor, Screen screen, AuditAction action) {
        QuarkusTransaction.requiringNew().run(() -> repository.persist(newRecord(type, actor, action, screen)));
    }

    private static AuditRecord newRecord(AuditEventType type, AuditActor actor, AuditAction action, Screen screen) {
        AuditRecord record = new AuditRecord();
        record.occurredAt = OffsetDateTime.now();
        record.eventType = type.name();
        record.action = action == null ? null : action.name();
        record.screen = screen == null ? null : screen.name();

        if (actor != null) {
            record.userId = actor.id();
            record.userName = actor.name();
            record.userEmail = actor.email();
            record.userSuperAdmin = actor.superAdmin();
        }

        return record;
    }
}
