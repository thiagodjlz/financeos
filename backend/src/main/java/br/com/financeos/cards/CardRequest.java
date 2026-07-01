package br.com.financeos.cards;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CardRequest(
        @NotBlank @Size(max = 120) String name,
        UUID accountId,
        @Size(max = 60) String brand,
        @DecimalMin(value = "0.00") BigDecimal creditLimit,
        @Min(1) @Max(31) Short closingDay,
        @Min(1) @Max(31) Short dueDay) {
}
