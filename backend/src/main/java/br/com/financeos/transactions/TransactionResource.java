package br.com.financeos.transactions;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class TransactionResource {

    private final TransactionRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public TransactionResource(TransactionRepository repository, CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    @GET
    public List<TransactionResponse> list(
            @QueryParam("type") TransactionType type,
            @QueryParam("status") TransactionStatus status,
            @QueryParam("startDate") LocalDate startDate,
            @QueryParam("endDate") LocalDate endDate,
            @QueryParam("categoryId") UUID categoryId) {

        accessControl.require(Screen.TRANSACTIONS, Action.VIEW);
        return repository.listByFilters(currentUser.id(), type, status, startDate, endDate, categoryId)
                .stream()
                .map(TransactionResponse::from)
                .toList();
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
    public Response create(@Valid TransactionRequest request) {
        accessControl.require(Screen.TRANSACTIONS, Action.CREATE);
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.userId = currentUser.id();
        apply(transaction, request);
        repository.persistAndFlush(transaction);

        return Response.created(URI.create("/api/transactions/" + transaction.id))
                .entity(TransactionResponse.from(transaction))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public TransactionResponse update(@PathParam("id") UUID id, @Valid TransactionRequest request) {
        accessControl.require(Screen.TRANSACTIONS, Action.EDIT);
        FinancialTransaction transaction = repository.findByUserAndId(currentUser.id(), id)
                .orElseThrow(NotFoundException::new);

        apply(transaction, request);
        return TransactionResponse.from(transaction);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response cancel(@PathParam("id") UUID id) {
        accessControl.require(Screen.TRANSACTIONS, Action.DELETE);
        FinancialTransaction transaction = repository.findByUserAndId(currentUser.id(), id)
                .orElseThrow(NotFoundException::new);

        transaction.status = TransactionStatus.CANCELED;
        return Response.noContent().build();
    }

    private static void apply(FinancialTransaction transaction, TransactionRequest request) {
        transaction.categoryId = request.categoryId();
        transaction.transactionDate = request.transactionDate();
        transaction.description = request.description().trim();
        transaction.amount = request.amount();
        transaction.type = request.type();
        transaction.status = request.status() == null ? TransactionStatus.PENDING : request.status();
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
