package br.com.financeos.dashboard;

import java.math.BigDecimal;

public record MonthlySummaryResponse(
        int year,
        int month,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal previousBalance,
        BigDecimal balance) {

    public static MonthlySummaryResponse empty(int year, int month) {
        return of(year, month, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public static MonthlySummaryResponse of(int year, int month, BigDecimal income, BigDecimal expense) {
        return new MonthlySummaryResponse(year, month, income, expense, BigDecimal.ZERO, income.subtract(expense));
    }

    BigDecimal monthResult() {
        return income.subtract(expense);
    }

    public MonthlySummaryResponse withPreviousBalance(BigDecimal value) {
        return new MonthlySummaryResponse(year, month, income, expense, value, value.add(monthResult()));
    }
}
