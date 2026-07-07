package br.com.financeos.auth;

import java.time.Duration;

import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.security.Authenticated;
import io.smallrye.jwt.build.Jwt;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    private static final String ISSUER = "https://financeos.local/issuer";
    private static final Duration TOKEN_TTL = Duration.ofHours(12);

    private final AppUserRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public AuthResource(AppUserRepository repository, CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    @POST
    @Path("/login")
    @PermitAll
    public AuthResponse login(@Valid LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        AppUser user = repository.findByEmail(email)
                .filter(candidate -> candidate.active)
                .filter(candidate -> BcryptUtil.matches(request.password(), candidate.passwordHash))
                .orElseThrow(() -> new WebApplicationException("Credenciais invalidas.", Response.Status.UNAUTHORIZED));

        String token = Jwt.issuer(ISSUER)
                .subject(user.id.toString())
                .upn(user.email)
                .expiresIn(TOKEN_TTL)
                .sign();

        return new AuthResponse(token, TOKEN_TTL.toSeconds());
    }

    @GET
    @Path("/me")
    @Authenticated
    public MeResponse me() {
        AppUser user = repository.findByIdOptional(currentUser.id())
                .orElseThrow(() -> new WebApplicationException(Response.Status.UNAUTHORIZED));

        return new MeResponse(user.name, user.email, user.superAdmin, accessControl.effectivePermissions());
    }
}
