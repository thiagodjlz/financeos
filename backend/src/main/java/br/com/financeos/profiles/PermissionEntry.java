package br.com.financeos.profiles;

import jakarta.validation.constraints.NotNull;

public record PermissionEntry(
        @NotNull Screen screen,
        boolean canView,
        boolean canCreate,
        boolean canEdit,
        boolean canDelete) {

    public static PermissionEntry from(ProfilePermission permission) {
        return new PermissionEntry(
                permission.screen,
                permission.canView,
                permission.canCreate,
                permission.canEdit,
                permission.canDelete);
    }

    public static PermissionEntry allowAll(Screen screen) {
        return new PermissionEntry(screen, true, true, true, true);
    }

    public static PermissionEntry denyAll(Screen screen) {
        return new PermissionEntry(screen, false, false, false, false);
    }
}
