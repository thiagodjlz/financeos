package br.com.financeos.reports;

import java.time.LocalDate;
import java.time.YearMonth;

public enum ReportPeriod {
    CURRENT_MONTH("Mês atual"),
    PREVIOUS_MONTH("Mês anterior"),
    CURRENT_YEAR("Ano atual"),
    PREVIOUS_YEAR("Ano anterior"),
    CUSTOM("Personalizado");

    private final String label;

    ReportPeriod(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    // Só para os períodos relativos: o Personalizado traz as próprias datas.
    LocalDate startFor(LocalDate today) {
        return switch (this) {
            case CURRENT_MONTH -> YearMonth.from(today).atDay(1);
            case PREVIOUS_MONTH -> YearMonth.from(today).minusMonths(1).atDay(1);
            case CURRENT_YEAR -> LocalDate.of(today.getYear(), 1, 1);
            case PREVIOUS_YEAR -> LocalDate.of(today.getYear() - 1, 1, 1);
            case CUSTOM -> throw new IllegalStateException("Período personalizado não tem data relativa.");
        };
    }

    LocalDate endFor(LocalDate today) {
        return switch (this) {
            case CURRENT_MONTH -> YearMonth.from(today).atEndOfMonth();
            case PREVIOUS_MONTH -> YearMonth.from(today).minusMonths(1).atEndOfMonth();
            case CURRENT_YEAR -> LocalDate.of(today.getYear(), 12, 31);
            case PREVIOUS_YEAR -> LocalDate.of(today.getYear() - 1, 12, 31);
            case CUSTOM -> throw new IllegalStateException("Período personalizado não tem data relativa.");
        };
    }
}
