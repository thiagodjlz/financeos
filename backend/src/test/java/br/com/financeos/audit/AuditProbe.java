package br.com.financeos.audit;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

// Leitura dos registros gravados pelos testes, sempre em transação nova (o que a requisição gravou
// já foi confirmado em outra transação). O banco é compartilhado entre as classes: as asserções filtram
// por id de registro ou e-mail próprios, nunca por contagem global.
@ApplicationScoped
public class AuditProbe {

    public record Entry(
            UUID id,
            OffsetDateTime occurredAt,
            String type,
            String action,
            String screen,
            UUID userId,
            String userName,
            String userEmail,
            boolean userSuperAdmin,
            UUID recordId,
            String recordLabel,
            Map<String, List<String>> changes) {

        static Entry of(AuditRecord record) {
            Map<String, List<String>> changes = new LinkedHashMap<>();
            for (AuditRecordChange change : record.changes) {
                changes.put(change.fieldLabel, Arrays.asList(change.oldValue, change.newValue));
            }

            return new Entry(record.id, record.occurredAt, record.eventType, record.action, record.screen,
                    record.userId, record.userName, record.userEmail, record.userSuperAdmin, record.recordId,
                    record.recordLabel, changes);
        }
    }

    @Inject
    AuditRecordRepository repository;

    public List<Entry> byRecord(UUID recordId) {
        return query("recordId = ?1 order by occurredAt, id", recordId);
    }

    public List<Entry> byRecordLabel(String label) {
        return query("recordLabel = ?1 order by occurredAt, id", label);
    }

    public List<Entry> byUserEmail(String email) {
        return query("lower(userEmail) = lower(?1) order by occurredAt, id", email);
    }

    public List<Entry> byUser(UUID userId) {
        return query("userId = ?1 order by occurredAt, id", userId);
    }

    private List<Entry> query(String query, Object parameter) {
        return QuarkusTransaction.requiringNew().call(() -> repository.list(query, parameter).stream()
                .map(Entry::of)
                .toList());
    }
}
