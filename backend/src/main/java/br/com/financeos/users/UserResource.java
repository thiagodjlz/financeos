package br.com.financeos.users;

import java.net.URI;
import java.util.Objects;
import java.util.UUID;

import br.com.financeos.profiles.ProfileRepository;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.shared.ListParams;
import br.com.financeos.shared.PageResponse;
import io.quarkus.elytron.security.common.BcryptUtil;
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

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class UserResource {

    private final AppUserRepository repository;
    private final ProfileRepository profileRepository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public UserResource(AppUserRepository repository, ProfileRepository profileRepository,
            CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.profileRepository = profileRepository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    @GET
    public PageResponse<UserResponse> list(@Context UriInfo uriInfo) {
        accessControl.require(Screen.USERS, Action.VIEW);
        ListParams params = ListParams.from(uriInfo);
        String name = ListParams.text(uriInfo, "name");
        String email = ListParams.text(uriInfo, "email");
        UUID profileId = ListParams.uuid(uriInfo, "profileId", "O perfil informado é inválido.");
        Boolean active = ListParams.bool(uriInfo, "active", "A situação informada é inválida.");

        return PageResponse.of(repository.searchVisible(name, email, profileId, active), params, UserResponse::from);
    }

    @GET
    @Path("/{id}")
    public UserResponse get(@PathParam("id") UUID id) {
        accessControl.require(Screen.USERS, Action.VIEW);
        return repository.findVisibleById(id)
                .map(UserResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    public Response create(@Valid UserCreateRequest request) {
        accessControl.require(Screen.USERS, Action.CREATE);
        String email = request.email().trim().toLowerCase();

        if (repository.findByEmail(email).isPresent()) {
            throw new WebApplicationException("E-mail já cadastrado.", Response.Status.CONFLICT);
        }

        requireProfileExists(request.profileId());

        AppUser user = new AppUser();
        user.name = request.name().trim();
        user.email = email;
        user.passwordHash = BcryptUtil.bcryptHash(request.password());
        user.profileId = request.profileId();
        repository.persistAndFlush(user);

        return Response.created(URI.create("/api/users/" + user.id))
                .entity(UserResponse.from(user))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public UserResponse update(@PathParam("id") UUID id, @Valid UserUpdateRequest request) {
        accessControl.require(Screen.USERS, Action.EDIT);
        AppUser user = repository.findVisibleById(id).orElseThrow(NotFoundException::new);
        String email = request.email().trim().toLowerCase();

        boolean emailTakenByOther = repository.findByEmail(email)
                .filter(other -> !other.id.equals(id))
                .isPresent();
        if (emailTakenByOther) {
            throw new WebApplicationException("E-mail já cadastrado.", Response.Status.CONFLICT);
        }

        requireProfileExists(request.profileId());

        if (currentUser.id().equals(id)) {
            if (!request.active()) {
                throw new WebApplicationException("Você não pode desativar a própria conta.", Response.Status.CONFLICT);
            }
            if (!Objects.equals(user.profileId, request.profileId())) {
                throw new WebApplicationException("Você não pode alterar o próprio perfil.", Response.Status.CONFLICT);
            }
        }

        user.name = request.name().trim();
        user.email = email;
        user.profileId = request.profileId();
        user.active = request.active();

        if (request.password() != null && !request.password().isBlank()) {
            user.passwordHash = BcryptUtil.bcryptHash(request.password());
        }

        return UserResponse.from(user);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deactivate(@PathParam("id") UUID id) {
        accessControl.require(Screen.USERS, Action.DELETE);

        if (currentUser.id().equals(id)) {
            throw new WebApplicationException("Você não pode desativar a própria conta.", Response.Status.CONFLICT);
        }

        AppUser user = repository.findVisibleById(id).orElseThrow(NotFoundException::new);
        user.active = false;

        return Response.noContent().build();
    }

    private void requireProfileExists(UUID profileId) {
        if (profileRepository.findByIdOptional(profileId).isEmpty()) {
            throw new WebApplicationException("Perfil informado não existe.", Response.Status.BAD_REQUEST);
        }
    }
}
