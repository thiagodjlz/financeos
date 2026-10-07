package br.com.financeos.audit;

public record AuditChange(String field, String oldValue, String newValue) {
}
