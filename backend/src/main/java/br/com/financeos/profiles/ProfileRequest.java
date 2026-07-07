package br.com.financeos.profiles;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record ProfileRequest(
        @NotBlank @Size(max = 120) String name,
        @NotEmpty List<PermissionEntry> permissions) {
}
