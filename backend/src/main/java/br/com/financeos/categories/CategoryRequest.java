package br.com.financeos.categories;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "O nome é obrigatório.") @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.") String name,
        @NotNull(message = "O tipo é obrigatório.") CategoryType type,
        UUID parentId,
        @NotBlank(message = "A cor é obrigatória.") @Size(max = 20, message = "A cor deve ter no máximo 20 caracteres.") String color,
        @NotNull(message = "A situação é obrigatória.") Boolean active) {
}
