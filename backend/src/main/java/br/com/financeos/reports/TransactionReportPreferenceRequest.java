package br.com.financeos.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

// Período, Tipo, Status, Origem, Parcelamento, agrupamentos e colunas chegam como texto e são
// convertidos pelo TransactionReportCriteria: o código desconhecido responde a mesma mensagem da geração.
public record TransactionReportPreferenceRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.") String name,
        boolean defaultPreference,
        @NotBlank(message = "O período é obrigatório.") String period,
        LocalDate startDate,
        LocalDate endDate,
        List<UUID> categoryIds,
        String type,
        String status,
        String source,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        String installments,
        List<String> groupBy,
        @NotEmpty(message = "Escolha ao menos uma coluna.") List<String> columns) {
}
