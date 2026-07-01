package br.com.financeos.cards;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import br.com.financeos.accounts.AccountRepository;
import br.com.financeos.shared.DevUser;
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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/cards")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CardResource {

    private final CardRepository repository;
    private final AccountRepository accountRepository;

    public CardResource(CardRepository repository, AccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    @GET
    public List<CardResponse> list() {
        return repository.listActive(DevUser.ID).stream()
                .map(CardResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    public CardResponse get(@PathParam("id") UUID id) {
        return repository.findActiveByUserAndId(DevUser.ID, id)
                .map(CardResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    public Response create(@Valid CardRequest request) {
        validateAccount(request.accountId());

        Card card = new Card();
        card.userId = DevUser.ID;
        apply(card, request);
        repository.persistAndFlush(card);

        return Response.created(URI.create("/api/cards/" + card.id))
                .entity(CardResponse.from(card))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public CardResponse update(@PathParam("id") UUID id, @Valid CardRequest request) {
        validateAccount(request.accountId());

        Card card = repository.findActiveByUserAndId(DevUser.ID, id)
                .orElseThrow(NotFoundException::new);

        apply(card, request);
        return CardResponse.from(card);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deactivate(@PathParam("id") UUID id) {
        Card card = repository.findActiveByUserAndId(DevUser.ID, id)
                .orElseThrow(NotFoundException::new);

        card.active = false;
        return Response.noContent().build();
    }

    private void validateAccount(UUID accountId) {
        if (accountId == null) {
            return;
        }

        accountRepository.findActiveByUserAndId(DevUser.ID, accountId)
                .orElseThrow(() -> new BadRequestException("accountId must reference an active account"));
    }

    private static void apply(Card card, CardRequest request) {
        card.name = request.name().trim();
        card.accountId = request.accountId();
        card.brand = blankToNull(request.brand());
        card.creditLimit = request.creditLimit();
        card.closingDay = request.closingDay();
        card.dueDay = request.dueDay();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
