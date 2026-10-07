package br.com.financeos.transactions;

import java.net.URI;
import java.util.UUID;

import br.com.financeos.audit.AuditTrail;
import br.com.financeos.audit.AuditValues;
import br.com.financeos.audit.Audited;
import br.com.financeos.categories.Category;
import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.shared.ListParams;
import br.com.financeos.shared.PageResponse;
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

@Path("/transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class TransactionResource {

    private final TransactionRepository repository;
    private final CategoryRepository categoryRepository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;
    private final AuditTrail auditTrail;

    public TransactionResource(TransactionRepository repository, CategoryRepository categoryRepository,
            CurrentUser currentUser, AccessControl accessControl, AuditTrail auditTrail) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
        this.auditTrail = auditTrail;
    }

    @GET
    public PageResponse<TransactionResponse> list(@Context UriInfo uriInfo) {
        accessControl.require(Screen.TRANSACTIONS, Action.VIEW);
        ListParams params = ListParams.from(uriInfo);
        TransactionFilter filter = new TransactionFilter(
                ListParams.text(uriInfo, "description"),
                ListParams.uuid(uriInfo, "categoryId", "A categoria informada é inválida."),
                ListParams.enumValue(uriInfo, "type", TransactionType.class, "O tipo informado é inválido."),
                ListParams.enumValue(uriInfo, "status", TransactionStatus.class, "O status informado é inválido."),
                ListParams.date(uriInfo, "startDate", "A data inicial informada é inválida."),
                ListParams.date(uriInfo, "endDate", "A data final informada é inválida."));

        return PageResponse.of(repository.search(currentUser.id(), filter), params, TransactionResponse::from);
    }

    @GET
    @Path("/{id}")
    public TransactionResponse get(@PathParam("id") UUID id) {
        accessControl.require(Screen.TRANSACTIONS, Action.VIEW);
        return repository.findByUserAndId(currentUser.id(), id)
                .map(TransactionResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    @Audited
    public Response create(@Valid TransactionRequest request) {
        accessControl.require(Screen.TRANSACTIONS, Action.CREATE);
        validateStatus(request);
        Category category = validateCategory(request, null);

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.userId = currentUser.id();
        apply(transaction, request);
        repository.persistAndFlush(transaction);
        auditTrail.created(Screen.TRANSACTIONS, transaction.id, transaction.description,
                auditValues(transaction, nameOf(category)));

        return Response.created(URI.create("/api/transactions/" + transaction.id))
                .entity(TransactionResponse.from(transaction, nameOf(category), colorOf(category)))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @Audited
    public TransactionResponse update(@PathParam("id") UUID id, @Valid TransactionRequest request) {
        accessControl.require(Screen.TRANSACTIONS, Action.EDIT);
        FinancialTransaction transaction = repository.findByUserAndId(currentUser.id(), id)
                .orElseThrow(NotFoundException::new);

        validateStatus(request);
        Category category = validateCategory(request, transaction);
        AuditValues before = auditValues(transaction, transaction.categoryName);
        apply(transaction, request);
        auditTrail.updated(Screen.TRANSACTIONS, id, transaction.description, before,
                auditValues(transaction, nameOf(category)));
        return TransactionResponse.from(transaction, nameOf(category), colorOf(category));
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @Audited
    public Response delete(@PathParam("id") UUID id) {
        accessControl.require(Screen.TRANSACTIONS, Action.DELETE);
        FinancialTransaction transaction = repository.findByUserAndId(currentUser.id(), id)
                .orElseThrow(NotFoundException::new);

        AuditValues values = auditValues(transaction, transaction.categoryName);
        repository.delete(transaction);
        auditTrail.deleted(Screen.TRANSACTIONS, id, transaction.description, values);
        return Response.noContent().build();
    }

    private Category validateCategory(TransactionRequest request, FinancialTransaction existing) {
        if (request.categoryId() == null) {
            return null;
        }

        Category category = categoryRepository.findByIdOptional(request.categoryId())
                .orElseThrow(() -> new WebApplicationException(
                        "Categoria informada não existe.", Response.Status.BAD_REQUEST));

        if (!category.type.name().equals(request.type().name())) {
            throw new WebApplicationException(
                    "A categoria deve ser do mesmo tipo do lançamento.", Response.Status.BAD_REQUEST);
        }

        // Categoria inativa só é aceita se já era a categoria do lançamento (issue #20)
        boolean keepingCurrentCategory = existing != null && request.categoryId().equals(existing.categoryId);
        if (!category.active && !keepingCurrentCategory) {
            throw new WebApplicationException(
                    "Categoria inativa não pode ser selecionada.", Response.Status.BAD_REQUEST);
        }

        return category;
    }

    private static String nameOf(Category category) {
        return category == null ? null : category.name;
    }

    private static String colorOf(Category category) {
        return category == null ? null : category.color;
    }

    private static void validateStatus(TransactionRequest request) {
        if (request.type() == TransactionType.EXPENSE && request.status() == null) {
            throw new WebApplicationException("O status é obrigatório.", Response.Status.BAD_REQUEST);
        }
    }

    private static AuditValues auditValues(FinancialTransaction transaction, String categoryName) {
        return AuditValues.create()
                .text("Tipo", transaction.type == TransactionType.INCOME ? "Receita" : "Despesa")
                .money("Valor", transaction.amount)
                .text("Descrição", transaction.description)
                .text("Categoria", categoryName)
                .date("Data", transaction.transactionDate)
                .text("Status", statusLabel(transaction.status))
                .text("Origem", sourceLabel(transaction.source))
                .number("Parcela", transaction.installmentNumber)
                .number("Total de parcelas", transaction.installmentTotal)
                .text("Observações", transaction.notes);
    }

    private static String statusLabel(TransactionStatus status) {
        if (status == null) {
            return null;
        }

        return switch (status) {
            case PENDING -> "Pendente";
            case PAID -> "Pago";
        };
    }

    private static String sourceLabel(TransactionSource source) {
        if (source == null) {
            return null;
        }

        return switch (source) {
            case MANUAL -> "Manual";
            case EXCEL_IMPORT -> "Importação de planilha";
            case RECURRENCE -> "Recorrência";
        };
    }

    private static void apply(FinancialTransaction transaction, TransactionRequest request) {
        transaction.categoryId = request.categoryId();
        transaction.transactionDate = request.transactionDate();
        transaction.description = request.description().trim();
        transaction.amount = request.amount();
        transaction.type = request.type();
        transaction.status = request.type() == TransactionType.INCOME
                ? null
                : (request.status() == null ? TransactionStatus.PENDING : request.status());
        transaction.source = request.source() == null ? TransactionSource.MANUAL : request.source();
        transaction.installmentNumber = request.installmentNumber();
        transaction.installmentTotal = request.installmentTotal();
        transaction.notes = blankToNull(request.notes());
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
