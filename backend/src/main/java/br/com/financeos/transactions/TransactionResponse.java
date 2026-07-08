package br.com.financeos.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        UUID categoryId,
        LocalDate transactionDate,
        String description,
        BigDecimal amount,
        TransactionType type,
        TransactionStatus status,
        TransactionSource source,
        Integer installmentNumber,
        Integer installmentTotal,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    public static TransactionResponse from(FinancialTransaction transaction) {
        return new TransactionResponse(
                transaction.id,
                transaction.categoryId,
                transaction.transactionDate,
                transaction.description,
                transaction.amount,
                transaction.type,
                transaction.status,
                transaction.source,
                transaction.installmentNumber,
                transaction.installmentTotal,
                transaction.notes,
                transaction.createdAt,
                transaction.updatedAt);
    }
}
