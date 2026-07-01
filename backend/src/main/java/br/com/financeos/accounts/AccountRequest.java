package br.com.financeos.accounts;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AccountRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull AccountType type,
        @DecimalMin(value = "0.00") BigDecimal initialBalance) {
}
