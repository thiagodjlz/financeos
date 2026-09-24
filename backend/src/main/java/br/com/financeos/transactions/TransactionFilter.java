package br.com.financeos.transactions;

import java.time.LocalDate;
import java.util.UUID;

public record TransactionFilter(
        String description,
        UUID categoryId,
        TransactionType type,
        TransactionStatus status,
        LocalDate startDate,
        LocalDate endDate) {
}
