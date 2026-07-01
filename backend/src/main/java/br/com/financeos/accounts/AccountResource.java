package br.com.financeos.accounts;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.UUID;

import br.com.financeos.shared.DevUser;
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

@Path("/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AccountResource {

    private final AccountRepository repository;

    public AccountResource(AccountRepository repository) {
        this.repository = repository;
    }

    @GET
    public List<AccountResponse> list(@QueryParam("type") AccountType type) {
        return repository.listActive(DevUser.ID, type).stream()
                .map(AccountResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    public AccountResponse get(@PathParam("id") UUID id) {
        return repository.findActiveByUserAndId(DevUser.ID, id)
                .map(AccountResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    public Response create(@Valid AccountRequest request) {
        Account account = new Account();
        account.userId = DevUser.ID;
        apply(account, request);
        repository.persistAndFlush(account);

        return Response.created(URI.create("/api/accounts/" + account.id))
                .entity(AccountResponse.from(account))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public AccountResponse update(@PathParam("id") UUID id, @Valid AccountRequest request) {
        Account account = repository.findActiveByUserAndId(DevUser.ID, id)
                .orElseThrow(NotFoundException::new);

        apply(account, request);
        return AccountResponse.from(account);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deactivate(@PathParam("id") UUID id) {
        Account account = repository.findActiveByUserAndId(DevUser.ID, id)
                .orElseThrow(NotFoundException::new);

        account.active = false;
        return Response.noContent().build();
    }

    private static void apply(Account account, AccountRequest request) {
        account.name = request.name().trim();
        account.type = request.type();
        account.initialBalance = request.initialBalance() == null ? BigDecimal.ZERO : request.initialBalance();
    }
}
