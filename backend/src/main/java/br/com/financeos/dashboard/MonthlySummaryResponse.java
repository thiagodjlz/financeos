package br.com.financeos.dashboard;

import java.math.BigDecimal;

public record MonthlySummaryResponse(
        int year,
        int month,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance) {

    public static MonthlySummaryResponse empty(int year, int month) {
        return of(year, month, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public static MonthlySummaryResponse of(int year, int month, BigDecimal income, BigDecimal expense) {
        return new MonthlySummaryResponse(year, month, income, expense, income.subtract(expense));
    }
}
