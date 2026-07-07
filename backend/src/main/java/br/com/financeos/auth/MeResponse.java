package br.com.financeos.auth;

import java.util.List;

import br.com.financeos.profiles.PermissionEntry;

public record MeResponse(String name, String email, boolean superAdmin, List<PermissionEntry> permissions) {
}
