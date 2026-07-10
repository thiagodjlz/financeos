package br.com.financeos.users;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotBlank(message = "O nome e obrigatorio.") @Size(max = 120, message = "O nome deve ter no maximo 120 caracteres.") String name,
        @NotBlank(message = "O e-mail e obrigatorio.") @Email(message = "Informe um e-mail valido.") @Size(max = 180, message = "O e-mail deve ter no maximo 180 caracteres.") String email,
        @NotNull(message = "O perfil e obrigatorio.") UUID profileId,
        boolean active,
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.") String password) {
}
