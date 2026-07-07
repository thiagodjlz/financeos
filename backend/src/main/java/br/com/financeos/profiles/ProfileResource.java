package br.com.financeos.profiles;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.security.Authenticated;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/profiles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class ProfileResource {

    private final ProfileRepository repository;
    private final ProfilePermissionRepository permissionRepository;
    private final AppUserRepository userRepository;
    private final AccessControl accessControl;

    public ProfileResource(ProfileRepository repository, ProfilePermissionRepository permissionRepository,
            AppUserRepository userRepository, AccessControl accessControl) {
        this.repository = repository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.accessControl = accessControl;
    }

    @GET
    public List<ProfileResponse> list() {
        accessControl.require(Screen.PROFILES, Action.VIEW);
        return repository.list("order by name").stream()
                .map(profile -> ProfileResponse.from(profile, resolvePermissions(profile.id)))
                .toList();
    }

    @POST
    @Transactional
    public Response create(@Valid ProfileRequest request) {
        accessControl.require(Screen.PROFILES, Action.CREATE);

        Profile profile = new Profile();
        profile.name = request.name().trim();
        repository.persistAndFlush(profile);

        savePermissions(profile.id, request.permissions());

        return Response.status(Response.Status.CREATED)
                .entity(ProfileResponse.from(profile, resolvePermissions(profile.id)))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public ProfileResponse update(@PathParam("id") UUID id, @Valid ProfileRequest request) {
        accessControl.require(Screen.PROFILES, Action.EDIT);
        Profile profile = repository.findByIdOptional(id).orElseThrow(NotFoundException::new);

        profile.name = request.name().trim();
        permissionRepository.deleteByProfile(id);
        savePermissions(id, request.permissions());

        return ProfileResponse.from(profile, resolvePermissions(id));
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") UUID id) {
        accessControl.require(Screen.PROFILES, Action.DELETE);
        repository.findByIdOptional(id).orElseThrow(NotFoundException::new);

        if (userRepository.count("profileId", id) > 0) {
            throw new WebApplicationException("Perfil em uso por usuarios.", Response.Status.CONFLICT);
        }

        permissionRepository.deleteByProfile(id);
        repository.deleteById(id);

        return Response.noContent().build();
    }

    private void savePermissions(UUID profileId, List<PermissionEntry> entries) {
        for (PermissionEntry entry : entries) {
            ProfilePermission permission = new ProfilePermission();
            permission.profileId = profileId;
            permission.screen = entry.screen();
            permission.canView = entry.canView();
            permission.canCreate = entry.canCreate();
            permission.canEdit = entry.canEdit();
            permission.canDelete = entry.canDelete();
            permissionRepository.persist(permission);
        }
    }

    private List<PermissionEntry> resolvePermissions(UUID profileId) {
        List<ProfilePermission> stored = permissionRepository.listByProfile(profileId);

        return Arrays.stream(Screen.values())
                .map(screen -> stored.stream()
                        .filter(permission -> permission.screen == screen)
                        .findFirst()
                        .map(PermissionEntry::from)
                        .orElseGet(() -> PermissionEntry.denyAll(screen)))
                .toList();
    }
}
