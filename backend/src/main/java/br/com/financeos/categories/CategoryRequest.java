package br.com.financeos.categories;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull CategoryType type,
        UUID parentId,
        @Size(max = 20) String color,
        @Size(max = 80) String icon,
        Boolean active) {
}
