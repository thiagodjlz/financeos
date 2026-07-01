package br.com.financeos.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        PeriodResponse period,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal balance,
        BigDecimal paidExpense,
        BigDecimal pendingExpense,
        long transactionCount,
        List<CategoryBreakdownResponse> categoryBreakdown,
        List<MonthlySummaryResponse> monthlyEvolution) {
}
