package br.com.financeos.auth;

import java.time.Duration;
import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import br.com.financeos.audit.AuditActor;
import br.com.financeos.audit.AuditEventType;
import br.com.financeos.audit.AuditWriter;
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

    private static final Duration TOKEN_TTL = Duration.ofHours(12);

    private final AppUserRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;
    private final AuditWriter auditWriter;
    private final String issuer;

    public AuthResource(AppUserRepository repository, CurrentUser currentUser, AccessControl accessControl,
            AuditWriter auditWriter, @ConfigProperty(name = "mp.jwt.verify.issuer") String issuer) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
        this.auditWriter = auditWriter;
        this.issuer = issuer;
    }

    @POST
    @Path("/login")
    @PermitAll
    public AuthResponse login(@Valid LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        Optional<AppUser> account = repository.findByEmail(email);

        Optional<AppUser> authenticated = account
                .filter(candidate -> candidate.active)
                .filter(candidate -> BcryptUtil.matches(request.password(), candidate.passwordHash));

        if (authenticated.isEmpty()) {
            // O e-mail digitado fica no registro mesmo sem conta, para quem consulta ver a tentativa;
            // existindo a conta, o registro também fica vinculado a ela.
            String typedEmail = request.email().trim();
            AuditActor actor = account
                    .map(user -> new AuditActor(user.id, user.name, typedEmail, user.superAdmin))
                    .orElseGet(() -> AuditActor.unknown(typedEmail));
            auditWriter.writeEvent(AuditEventType.LOGIN_FAILED, actor, null, null);

            throw new WebApplicationException("Credenciais inválidas.", Response.Status.UNAUTHORIZED);
        }

        AppUser user = authenticated.get();
        String token = Jwt.issuer(issuer)
                .subject(user.id.toString())
                .upn(user.email)
                .expiresIn(TOKEN_TTL)
                .sign();

        auditWriter.writeEvent(AuditEventType.LOGIN, AuditActor.of(user), null, null);
        return new AuthResponse(token, TOKEN_TTL.toSeconds());
    }

    // Sem accessControl.require, como o /me: sair não depende de tela. Só registra o Logout; quem
    // descarta o token é o front-end, depois desta resposta. Sem corpo, então aceita qualquer
    // Content-Type (o POST vazio do front-end não manda nenhum).
    @POST
    @Path("/logout")
    @Consumes(MediaType.WILDCARD)
    @Authenticated
    public Response logout() {
        AppUser user = repository.findByIdOptional(currentUser.id())
                .orElseThrow(() -> new WebApplicationException(Response.Status.UNAUTHORIZED));

        auditWriter.writeEvent(AuditEventType.LOGOUT, AuditActor.of(user), null, null);
        return Response.noContent().build();
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
