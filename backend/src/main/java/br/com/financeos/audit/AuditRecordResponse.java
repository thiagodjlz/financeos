package br.com.financeos.audit;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import br.com.financeos.profiles.Screen;

// Os rótulos em português vão prontos: a tela exibe o que chegar, sem mapa próprio, e um tipo de
// evento novo aparece nela sem mudança no front-end.
public record AuditRecordResponse(
        UUID id,
        OffsetDateTime occurredAt,
        String userName,
        String userEmail,
        String type,
        String typeLabel,
        String action,
        String actionLabel,
        String screen,
        String screenLabel,
        UUID recordId,
        String recordLabel,
        List<Change> changes) {

    public record Change(String field, String oldValue, String newValue) {
    }

    public static AuditRecordResponse from(AuditRecord record) {
        return new AuditRecordResponse(
                record.id,
                record.occurredAt,
                record.userName,
                record.userEmail,
                record.eventType,
                AuditEventType.labelOf(record.eventType),
                record.action,
                AuditAction.labelOf(record.action),
                record.screen,
                screenLabel(record.screen),
                record.recordId,
                record.recordLabel,
                record.changes.stream()
                        .map(change -> new Change(change.fieldLabel, change.oldValue, change.newValue))
                        .toList());
    }

    private static String screenLabel(String code) {
        if (code == null) {
            return null;
        }

        return Arrays.stream(Screen.values())
                .filter(screen -> screen.name().equals(code))
                .findFirst()
                .map(Screen::label)
                .orElse(code);
    }
}
