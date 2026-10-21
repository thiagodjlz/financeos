package br.com.financeos.reports;

public enum ReportGrouping {
    CATEGORY("Categoria"),
    TYPE("Tipo"),
    STATUS("Status"),
    SOURCE("Origem"),
    DAY("Dia"),
    MONTH("Mês"),
    YEAR("Ano");

    private final String label;

    ReportGrouping(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
