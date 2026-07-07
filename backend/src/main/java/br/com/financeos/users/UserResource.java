package br.com.financeos.users;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class UserResource {

    private final AppUserRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public UserResource(AppUserRepository repository, CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    @GET
    public List<UserResponse> list() {
        accessControl.require(Screen.USERS, Action.VIEW);
        return repository.listVisible().stream()
                .map(UserResponse::from)
                .toList();
    }

    @POST
    @Transactional
    public Response create(@Valid UserCreateRequest request) {
        accessControl.require(Screen.USERS, Action.CREATE);
        String email = request.email().trim().toLowerCase();

        if (repository.findByEmail(email).isPresent()) {
            throw new WebApplicationException("E-mail ja cadastrado.", Response.Status.CONFLICT);
        }

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

        user.name = request.name().trim();
        user.email = request.email().trim().toLowerCase();
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
            throw new WebApplicationException("Voce nao pode desativar a propria conta.", Response.Status.CONFLICT);
        }

        AppUser user = repository.findVisibleById(id).orElseThrow(NotFoundException::new);
        user.active = false;

        return Response.noContent().build();
    }
}
