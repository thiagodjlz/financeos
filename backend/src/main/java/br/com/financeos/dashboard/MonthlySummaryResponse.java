package br.com.financeos.dashboard;

import java.math.BigDecimal;

public record MonthlySummaryResponse(
        int year,
        int month,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance,
        BigDecimal accumulatedBalance) {

    public static MonthlySummaryResponse empty(int year, int month) {
        return of(year, month, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public static MonthlySummaryResponse of(int year, int month, BigDecimal income, BigDecimal expense) {
        BigDecimal balance = income.subtract(expense);
        return new MonthlySummaryResponse(year, month, income, expense, balance, balance);
    }

    public MonthlySummaryResponse withAccumulatedBalance(BigDecimal value) {
        return new MonthlySummaryResponse(year, month, income, expense, balance, value);
    }
}
