package br.com.financeos.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TransactionRequest(
        UUID categoryId,
        UUID accountId,
        UUID cardId,
        @NotNull LocalDate transactionDate,
        @NotBlank @Size(max = 255) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull TransactionType type,
        TransactionStatus status,
        TransactionSource source,
        @Min(1) Integer installmentNumber,
        @Min(1) Integer installmentTotal,
        String notes) {
}
