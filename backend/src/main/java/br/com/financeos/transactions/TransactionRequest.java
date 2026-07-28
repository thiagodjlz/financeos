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
        @NotNull(message = "A data é obrigatória.") LocalDate transactionDate,
        @NotBlank(message = "A descrição é obrigatória.") @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres.") String description,
        @NotNull(message = "O valor é obrigatório.") @DecimalMin(value = "0.01", message = "O valor deve ser maior ou igual a 0,01.") BigDecimal amount,
        @NotNull(message = "O tipo é obrigatório.") TransactionType type,
        TransactionStatus status,
        TransactionSource source,
        @Min(value = 1, message = "A parcela deve ser maior ou igual a 1.") Integer installmentNumber,
        @Min(value = 1, message = "O total de parcelas deve ser maior ou igual a 1.") Integer installmentTotal,
        String notes) {
}
