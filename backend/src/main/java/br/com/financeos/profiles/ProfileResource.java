package br.com.financeos.profiles;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.ListParams;
import br.com.financeos.shared.PageResponse;
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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

@Path("/profiles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class ProfileResource {

    // Telas cuja funcionalidade e somente de leitura: a matriz nem oferece as tres acoes de escrita
    // para elas, e saneamos aqui porque o payload pode chegar por chamada direta a API.
    private static final Set<Screen> VIEW_ONLY_SCREENS = EnumSet.of(Screen.DOCUMENTATION, Screen.RELEASE_NOTES);

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
    public PageResponse<ProfileResponse> list(@Context UriInfo uriInfo) {
        accessControl.require(Screen.PROFILES, Action.VIEW);
        ListParams params = ListParams.from(uriInfo);
        String name = ListParams.text(uriInfo, "name");

        return PageResponse.of(repository.search(name), params, this::toResponse);
    }

    @GET
    @Path("/options")
    public List<ProfileResponse> options() {
        accessControl.require(Screen.PROFILES, Action.VIEW);
        return repository.list("order by name, id").stream()
                .map(this::toResponse)
                .toList();
    }

    @GET
    @Path("/{id}")
    public ProfileResponse get(@PathParam("id") UUID id) {
        accessControl.require(Screen.PROFILES, Action.VIEW);
        return repository.findByIdOptional(id)
                .map(this::toResponse)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    public Response create(@Valid ProfileRequest request) {
        accessControl.require(Screen.PROFILES, Action.CREATE);
        validatePermissions(request.permissions());

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
        validatePermissions(request.permissions());
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
            throw new WebApplicationException("Perfil em uso por usuários.", Response.Status.CONFLICT);
        }

        permissionRepository.deleteByProfile(id);
        repository.deleteById(id);

        return Response.noContent().build();
    }

    private static void validatePermissions(List<PermissionEntry> entries) {
        Set<Screen> seen = EnumSet.noneOf(Screen.class);

        for (PermissionEntry entry : entries) {
            if (!seen.add(entry.screen())) {
                throw new WebApplicationException(
                        "Tela duplicada nas permissões do perfil.", Response.Status.BAD_REQUEST);
            }
        }
    }

    private void savePermissions(UUID profileId, List<PermissionEntry> entries) {
        for (PermissionEntry entry : entries) {
            boolean writable = !VIEW_ONLY_SCREENS.contains(entry.screen());

            ProfilePermission permission = new ProfilePermission();
            permission.profileId = profileId;
            permission.screen = entry.screen();
            permission.canView = entry.canView();
            permission.canCreate = writable && entry.canCreate();
            permission.canEdit = writable && entry.canEdit();
            permission.canDelete = writable && entry.canDelete();
            permissionRepository.persist(permission);
        }
    }

    private ProfileResponse toResponse(Profile profile) {
        return ProfileResponse.from(profile, resolvePermissions(profile.id));
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
