package br.com.financeos.shared;

import java.util.Arrays;
import java.util.List;

import br.com.financeos.profiles.PermissionEntry;
import br.com.financeos.profiles.ProfilePermission;
import br.com.financeos.profiles.ProfilePermissionRepository;
import br.com.financeos.profiles.Screen;
import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;

@RequestScoped
public class AccessControl {

    @Inject
    CurrentUser currentUser;

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfilePermissionRepository permissionRepository;

    private AppUser cachedUser;
    private List<ProfilePermission> cachedPermissions;

    public void require(Screen screen, Action action) {
        AppUser user = loadUser();

        if (user.superAdmin) {
            return;
        }

        boolean allowed = loadPermissions().stream()
                .filter(permission -> permission.screen == screen)
                .findFirst()
                .map(permission -> switch (action) {
                    case VIEW -> permission.canView;
                    case CREATE -> permission.canCreate;
                    case EDIT -> permission.canEdit;
                    case DELETE -> permission.canDelete;
                })
                .orElse(false);

        if (!allowed) {
            throw new ForbiddenException("Sem permissao de " + action + " em " + screen);
        }
    }

    public boolean isSuperAdmin() {
        return loadUser().superAdmin;
    }

    public List<PermissionEntry> effectivePermissions() {
        AppUser user = loadUser();

        return Arrays.stream(Screen.values())
                .map(screen -> {
                    if (user.superAdmin) {
                        return PermissionEntry.allowAll(screen);
                    }

                    return loadPermissions().stream()
                            .filter(permission -> permission.screen == screen)
                            .findFirst()
                            .map(PermissionEntry::from)
                            .orElseGet(() -> PermissionEntry.denyAll(screen));
                })
                .toList();
    }

    private AppUser loadUser() {
        if (cachedUser == null) {
            cachedUser = userRepository.findByIdOptional(currentUser.id())
                    .orElseThrow(() -> new NotAuthorizedException("Bearer"));
        }

        return cachedUser;
    }

    private List<ProfilePermission> loadPermissions() {
        if (cachedPermissions == null) {
            AppUser user = loadUser();
            cachedPermissions = user.profileId == null
                    ? List.of()
                    : permissionRepository.listByProfile(user.profileId);
        }

        return cachedPermissions;
    }
}
