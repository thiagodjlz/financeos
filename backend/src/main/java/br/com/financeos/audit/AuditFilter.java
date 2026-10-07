package br.com.financeos.audit;

import java.time.OffsetDateTime;

import br.com.financeos.profiles.Screen;

public record AuditFilter(
        OffsetDateTime from,
        OffsetDateTime until,
        String user,
        AuditEventType type,
        AuditAction action,
        Screen screen) {
}
