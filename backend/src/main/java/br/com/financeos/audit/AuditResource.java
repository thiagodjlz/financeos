package br.com.financeos.audit;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.shared.ListParams;
import br.com.financeos.shared.PageResponse;
import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.security.Authenticated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

// Sem PUT/DELETE de propósito: registro de auditoria não tem manutenção.
@Path("/audit")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class AuditResource {

    // O período é lido no fuso de quem consulta, para "hoje" bater com o relógio da tela; sem o
    // parâmetro vale o do Brasil, onde o sistema é usado.
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("America/Sao_Paulo");

    private final AuditRecordRepository repository;
    private final AuditWriter writer;
    private final AccessControl accessControl;
    private final CurrentUser currentUser;
    private final AppUserRepository userRepository;

    public AuditResource(AuditRecordRepository repository, AuditWriter writer, AccessControl accessControl,
            CurrentUser currentUser, AppUserRepository userRepository) {
        this.repository = repository;
        this.writer = writer;
        this.accessControl = accessControl;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
    }

    @GET
    public PageResponse<AuditRecordResponse> list(@Context UriInfo uriInfo) {
        accessControl.require(Screen.AUDIT, Action.VIEW);
        ListParams params = ListParams.from(uriInfo);
        LocalDate startDate = ListParams.date(uriInfo, "startDate", "A data inicial informada é inválida.");
        LocalDate endDate = ListParams.date(uriInfo, "endDate", "A data final informada é inválida.");
        ZoneId zone = zone(ListParams.text(uriInfo, "timeZone"));

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("A data inicial não pode ser posterior à data final.");
        }

        AuditFilter filter = new AuditFilter(
                startDate == null ? null : startOfDay(startDate, zone),
                endDate == null ? null : startOfDay(endDate.plusDays(1), zone),
                ListParams.text(uriInfo, "user"),
                ListParams.enumValue(uriInfo, "type", AuditEventType.class, "O tipo informado é inválido."),
                ListParams.enumValue(uriInfo, "action", AuditAction.class, "A ação informada é inválida."),
                ListParams.enumValue(uriInfo, "screen", Screen.class, "A funcionalidade informada é inválida."));

        return PageResponse.of(repository.search(filter), params, AuditRecordResponse::from);
    }

    @GET
    @Path("/options")
    public AuditOptionsResponse options() {
        accessControl.require(Screen.AUDIT, Action.VIEW);
        return AuditOptionsResponse.current();
    }

    // Chamado pelo front-end ao entrar numa tela do menu. Quem não pode ver a tela informada recebe
    // 403 (e o AccessControl grava "Acesso negado"), nunca um "Acesso à tela".
    @POST
    @Path("/screen-access")
    public Response screenAccess(@Valid @NotNull(message = "A tela é obrigatória.") ScreenAccessRequest request) {
        accessControl.require(request.screen(), Action.VIEW);
        AppUser user = userRepository.findByIdOptional(currentUser.id())
                .orElseThrow(() -> new WebApplicationException(Response.Status.UNAUTHORIZED));

        writer.writeEvent(AuditEventType.SCREEN_ACCESS, AuditActor.of(user), request.screen(), AuditAction.VIEW);
        return Response.noContent().build();
    }

    private static ZoneId zone(String value) {
        if (value == null) {
            return DEFAULT_ZONE;
        }

        try {
            return ZoneId.of(value);
        } catch (DateTimeException ex) {
            throw new BadRequestException("O fuso horário informado é inválido.");
        }
    }

    private static OffsetDateTime startOfDay(LocalDate date, ZoneId zone) {
        return date.atStartOfDay(zone).toOffsetDateTime();
    }
}
