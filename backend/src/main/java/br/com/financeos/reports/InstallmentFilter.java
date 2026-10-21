package br.com.financeos.reports;

public enum InstallmentFilter {
    ALL("Todos"),
    INSTALLMENT("Parcelados"),
    SINGLE("À vista");

    private final String label;

    InstallmentFilter(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
