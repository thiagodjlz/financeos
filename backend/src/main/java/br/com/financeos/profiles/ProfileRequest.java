package br.com.financeos.profiles;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record ProfileRequest(
        @NotBlank(message = "O nome é obrigatório.") @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.") String name,
        @NotEmpty(message = "As permissões são obrigatórias.") List<@Valid PermissionEntry> permissions) {
}
