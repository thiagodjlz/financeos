package br.com.financeos.profiles;

import java.util.List;
import java.util.UUID;

public record ProfileResponse(UUID id, String name, boolean active, List<PermissionEntry> permissions) {

    public static ProfileResponse from(Profile profile, List<PermissionEntry> permissions) {
        return new ProfileResponse(profile.id, profile.name, profile.active, permissions);
    }
}
