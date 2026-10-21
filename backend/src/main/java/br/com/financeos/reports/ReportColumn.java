package br.com.financeos.reports;

import java.util.List;

public enum ReportColumn {
    DATE("Data"),
    DESCRIPTION("Descrição"),
    CATEGORY("Categoria"),
    TYPE("Tipo"),
    STATUS("Status"),
    SOURCE("Origem"),
    INSTALLMENT("Parcela"),
    AMOUNT("Valor"),
    NOTES("Observações");

    public static final List<ReportColumn> DEFAULTS = List.of(DATE, DESCRIPTION, CATEGORY, TYPE, STATUS, AMOUNT);

    private final String label;

    ReportColumn(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
