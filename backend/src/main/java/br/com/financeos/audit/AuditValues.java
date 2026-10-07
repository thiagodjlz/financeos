package br.com.financeos.audit;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

// Snapshot de um registro para a auditoria: rótulo do campo -> valor como o usuário o lê na tela.
// Referência a outro cadastro entra pelo nome do momento, e não pelo id.
public final class AuditValues {

    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final Map<String, String> values = new LinkedHashMap<>();

    private AuditValues() {
    }

    public static AuditValues create() {
        return new AuditValues();
    }

    public AuditValues text(String field, String value) {
        values.put(field, value == null || value.isBlank() ? null : value);
        return this;
    }

    public AuditValues yesNo(String field, boolean value) {
        values.put(field, value ? "Sim" : "Não");
        return this;
    }

    public AuditValues money(String field, BigDecimal value) {
        values.put(field, value == null ? null
                : NumberFormat.getCurrencyInstance(PT_BR).format(value).replace('\u00A0', ' '));
        return this;
    }

    public AuditValues date(String field, LocalDate value) {
        values.put(field, value == null ? null : DATE.format(value));
        return this;
    }

    public AuditValues number(String field, Integer value) {
        values.put(field, value == null ? null : value.toString());
        return this;
    }

    Map<String, String> asMap() {
        return Collections.unmodifiableMap(values);
    }
}
