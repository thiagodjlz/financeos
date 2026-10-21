package br.com.financeos.reports;

import java.net.URI;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import br.com.financeos.audit.AuditTrail;
import br.com.financeos.audit.AuditValues;
import br.com.financeos.audit.Audited;
import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import io.quarkus.security.Authenticated;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
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

// Preferências são de cada usuário (D9): a de outra pessoa responde 404, como se não existisse.
// A exclusão é definitiva — a preferência não tem histórico próprio além da auditoria.
@Path("/transaction-reports/preferences")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class TransactionReportPreferenceResource {

    private static final String DUPLICATE_NAME_MESSAGE = "Já existe uma preferência com esse nome.";

    private final TransactionReportPreferenceRepository repository;
    private final CategoryRepository categoryRepository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;
    private final AuditTrail auditTrail;
    private final CurrentDate currentDate;

    public TransactionReportPreferenceResource(TransactionReportPreferenceRepository repository,
            CategoryRepository categoryRepository, CurrentUser currentUser, AccessControl accessControl,
            AuditTrail auditTrail, CurrentDate currentDate) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
        this.auditTrail = auditTrail;
        this.currentDate = currentDate;
    }

    @GET
    public List<TransactionReportPreferenceResponse> list() {
        accessControl.require(Screen.TRANSACTION_REPORTS, Action.VIEW);
        return repository.listByUser(currentUser.id()).stream()
                .map(TransactionReportPreferenceResponse::from)
                .toList();
    }

    @POST
    @Transactional
    @Audited
    public Response create(@Valid TransactionReportPreferenceRequest request) {
        accessControl.require(Screen.TRANSACTION_REPORTS, Action.CREATE);
        UUID userId = currentUser.id();
        Validated validated = validate(request);
        String name = request.name().trim();

        if (repository.nameTaken(userId, name, null)) {
            throw new WebApplicationException(DUPLICATE_NAME_MESSAGE, Response.Status.CONFLICT);
        }
        if (request.defaultPreference()) {
            repository.clearDefault(userId, null);
        }

        TransactionReportPreference preference = new TransactionReportPreference();
        preference.userId = userId;
        apply(preference, name, request.defaultPreference(), validated);
        repository.persistAndFlush(preference);
        auditTrail.created(Screen.TRANSACTION_REPORTS, preference.id, preference.name, auditValues(preference));

        return Response.created(URI.create("/api/transaction-reports/preferences/" + preference.id))
                .entity(TransactionReportPreferenceResponse.from(preference))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @Audited
    public TransactionReportPreferenceResponse update(@PathParam("id") UUID id,
            @Valid TransactionReportPreferenceRequest request) {
        accessControl.require(Screen.TRANSACTION_REPORTS, Action.EDIT);
        UUID userId = currentUser.id();
        TransactionReportPreference preference = repository.findByUserAndId(userId, id)
                .orElseThrow(NotFoundException::new);
        Validated validated = validate(request);
        String name = request.name().trim();

        if (repository.nameTaken(userId, name, id)) {
            throw new WebApplicationException(DUPLICATE_NAME_MESSAGE, Response.Status.CONFLICT);
        }

        AuditValues before = auditValues(preference);
        if (request.defaultPreference()) {
            repository.clearDefault(userId, id);
        }

        apply(preference, name, request.defaultPreference(), validated);
        repository.flush();
        auditTrail.updated(Screen.TRANSACTION_REPORTS, id, preference.name, before, auditValues(preference));
        return TransactionReportPreferenceResponse.from(preference);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @Audited
    public Response delete(@PathParam("id") UUID id) {
        accessControl.require(Screen.TRANSACTION_REPORTS, Action.DELETE);
        TransactionReportPreference preference = repository.findByUserAndId(currentUser.id(), id)
                .orElseThrow(NotFoundException::new);

        AuditValues values = auditValues(preference);
        repository.delete(preference);
        auditTrail.deleted(Screen.TRANSACTION_REPORTS, id, preference.name, values);
        return Response.noContent().build();
    }

    private record Validated(TransactionReportCriteria criteria, List<ReportColumn> columns) {
    }

    private Validated validate(TransactionReportPreferenceRequest request) {
        ReportPeriod period = TransactionReportCriteria.parse(request.period(), ReportPeriod.class,
                TransactionReportCriteria.PERIOD_MESSAGE);

        TransactionReportCriteria criteria = TransactionReportCriteria.of(
                period,
                request.startDate(),
                request.endDate(),
                request.categoryIds(),
                TransactionReportCriteria.parse(request.type(), TransactionType.class,
                        TransactionReportCriteria.TYPE_MESSAGE),
                TransactionReportCriteria.parse(request.status(), TransactionStatus.class,
                        TransactionReportCriteria.STATUS_MESSAGE),
                TransactionReportCriteria.parse(request.source(), TransactionSource.class,
                        TransactionReportCriteria.SOURCE_MESSAGE),
                request.minAmount(),
                request.maxAmount(),
                TransactionReportCriteria.parse(request.installments(), InstallmentFilter.class,
                        TransactionReportCriteria.INSTALLMENTS_MESSAGE),
                TransactionReportCriteria.parseAll(request.groupBy(), ReportGrouping.class,
                        TransactionReportCriteria.GROUPING_MESSAGE),
                currentDate.today());

        List<ReportColumn> columns = TransactionReportCriteria.parseAll(request.columns(), ReportColumn.class,
                "A coluna informada é inválida.");
        Set<ReportColumn> seen = EnumSet.noneOf(ReportColumn.class);
        for (ReportColumn column : columns) {
            if (!seen.add(column)) {
                throw new BadRequestException("A mesma coluna não pode ser escolhida duas vezes.");
            }
        }

        if (!criteria.categoryIds().isEmpty()
                && categoryRepository.count("id in ?1", criteria.categoryIds()) != criteria.categoryIds().size()) {
            throw new BadRequestException("Categoria informada não existe.");
        }

        return new Validated(criteria, columns);
    }

    private static void apply(TransactionReportPreference preference, String name, boolean defaultPreference,
            Validated validated) {
        TransactionReportCriteria criteria = validated.criteria();
        boolean custom = criteria.period() == ReportPeriod.CUSTOM;

        preference.name = name;
        preference.defaultPreference = defaultPreference;
        preference.period = criteria.period();
        preference.startDate = custom ? criteria.startDate() : null;
        preference.endDate = custom ? criteria.endDate() : null;
        preference.categoryIds.clear();
        preference.categoryIds.addAll(criteria.categoryIds());
        preference.type = criteria.type();
        preference.status = criteria.status();
        preference.source = criteria.source();
        preference.minAmount = criteria.minAmount();
        preference.maxAmount = criteria.maxAmount();
        preference.installments = criteria.installments();
        preference.groupings(criteria.groupBy());
        preference.reportColumns(validated.columns());
    }

    private AuditValues auditValues(TransactionReportPreference preference) {
        String categories = preference.categoryIds.isEmpty()
                ? null
                : categoryRepository.list("id in ?1", preference.categoryIds).stream()
                        .map(category -> category.name)
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .collect(Collectors.joining(", "));

        return AuditValues.create()
                .text("Nome", preference.name)
                .yesNo("Padrão", preference.defaultPreference)
                .text("Período", preference.period == null ? null : preference.period.label())
                .date("Data inicial", preference.startDate)
                .date("Data final", preference.endDate)
                .text("Categorias", categories)
                .text("Tipo", TransactionReportBuilder.typeLabel(preference.type))
                .text("Status", preference.status == null ? null : TransactionReportBuilder.statusLabel(preference.status))
                .text("Origem", TransactionReportBuilder.sourceLabel(preference.source))
                .money("Valor mínimo", preference.minAmount)
                .money("Valor máximo", preference.maxAmount)
                .text("Parcelamento", preference.installments == null ? null : preference.installments.label())
                .text("Agrupamento", preference.groupings().stream()
                        .map(ReportGrouping::label)
                        .collect(Collectors.joining(" > ")))
                .text("Colunas", preference.reportColumns().stream()
                        .map(ReportColumn::label)
                        .collect(Collectors.joining(", ")));
    }
}
