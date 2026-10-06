package br.com.financeos.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

import br.com.financeos.transactions.TransactionType;

public record CategoryBreakdownResponse(
        UUID categoryId,
        String categoryName,
        String categoryColor,
        TransactionType type,
        BigDecimal totalAmount,
        long transactionCount,
        BigDecimal sharePercent) {

    public CategoryBreakdownResponse withSharePercent(BigDecimal value) {
        return new CategoryBreakdownResponse(categoryId, categoryName, categoryColor, type, totalAmount,
                transactionCount, value);
    }
}
