package br.com.financeos.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

import br.com.financeos.transactions.TransactionType;

public record CategoryBreakdownResponse(
        UUID categoryId,
        String categoryName,
        TransactionType type,
        BigDecimal totalAmount,
        long transactionCount) {
}
