package br.com.financeos.categories;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import br.com.financeos.audit.AuditTrail;
import br.com.financeos.audit.AuditValues;
import br.com.financeos.audit.Audited;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
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

@Path("/categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class CategoryResource {

    private final CategoryRepository repository;
    private final CategoryUsageCheck usageCheck;
    private final AccessControl accessControl;
    private final AuditTrail auditTrail;

    public CategoryResource(CategoryRepository repository, CategoryUsageCheck usageCheck,
            AccessControl accessControl, AuditTrail auditTrail) {
        this.repository = repository;
        this.usageCheck = usageCheck;
        this.accessControl = accessControl;
        this.auditTrail = auditTrail;
    }

    @GET
    public PageResponse<CategoryResponse> list(@Context UriInfo uriInfo) {
        accessControl.require(Screen.CATEGORIES, Action.VIEW);
        ListParams params = ListParams.from(uriInfo);
        String name = ListParams.text(uriInfo, "name");
        CategoryType type = ListParams.enumValue(uriInfo, "type", CategoryType.class, "O tipo informado é inválido.");
        Boolean active = ListParams.bool(uriInfo, "active", "A situação informada é inválida.");

        return PageResponse.of(repository.search(name, type, active), params, CategoryResponse::from);
    }

    @GET
    @Path("/options")
    public List<CategoryResponse> options(@Context UriInfo uriInfo) {
        accessControl.require(Screen.CATEGORIES, Action.VIEW);
        CategoryType type = ListParams.enumValue(uriInfo, "type", CategoryType.class, "O tipo informado é inválido.");

        return repository.options(type).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    // Devolve também a inativa: a tela de edição precisa abri-la para permitir a reativação.
    @GET
    @Path("/{id}")
    public CategoryResponse get(@PathParam("id") UUID id) {
        accessControl.require(Screen.CATEGORIES, Action.VIEW);
        return repository.findByIdOptional(id)
                .map(CategoryResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    @Audited
    public Response create(@Valid CategoryRequest request) {
        accessControl.require(Screen.CATEGORIES, Action.CREATE);
        validateParent(request, null);
        validateDuplicate(request, null);

        Category category = new Category();
        apply(category, request);
        repository.persistAndFlush(category);
        auditTrail.created(Screen.CATEGORIES, category.id, category.name, auditValues(category));

        return Response.created(URI.create("/api/categories/" + category.id))
                .entity(CategoryResponse.from(category))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @Audited
    public CategoryResponse update(@PathParam("id") UUID id, @Valid CategoryRequest request) {
        accessControl.require(Screen.CATEGORIES, Action.EDIT);
        Category category = repository.findByIdOptional(id)
                .orElseThrow(NotFoundException::new);

        validateParent(request, id);
        validateDuplicate(request, id);
        AuditValues before = auditValues(category);
        apply(category, request);
        auditTrail.updated(Screen.CATEGORIES, id, category.name, before, auditValues(category));
        return CategoryResponse.from(category);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @Audited
    public Response delete(@PathParam("id") UUID id) {
        accessControl.require(Screen.CATEGORIES, Action.DELETE);
        Category category = repository.findByIdOptional(id)
                .orElseThrow(NotFoundException::new);

        CategoryUsageCheck.blockingMessage(usageCheck.usagesOf(id)).ifPresent(message -> {
            throw new WebApplicationException(message, Response.Status.CONFLICT);
        });

        AuditValues values = auditValues(category);
        repository.delete(category);
        auditTrail.deleted(Screen.CATEGORIES, id, category.name, values);
        return Response.noContent().build();
    }

    private void validateParent(CategoryRequest request, UUID id) {
        if (request.parentId() == null) {
            return;
        }

        if (request.parentId().equals(id)) {
            throw new WebApplicationException(
                    "Uma categoria não pode ser pai dela mesma.", Response.Status.BAD_REQUEST);
        }

        if (repository.findByIdOptional(request.parentId()).isEmpty()) {
            throw new WebApplicationException(
                    "Categoria pai informada não existe.", Response.Status.BAD_REQUEST);
        }
    }

    private void validateDuplicate(CategoryRequest request, UUID id) {
        boolean duplicated = repository.findDuplicate(request.name().trim(), request.type(), request.parentId())
                .filter(existing -> !existing.id.equals(id))
                .isPresent();

        if (duplicated) {
            throw new WebApplicationException(
                    "Já existe uma categoria com esse nome e tipo.", Response.Status.CONFLICT);
        }
    }

    private AuditValues auditValues(Category category) {
        String parentName = category.parentId == null ? null
                : repository.findByIdOptional(category.parentId).map(parent -> parent.name).orElse(null);

        return AuditValues.create()
                .text("Nome", category.name)
                .text("Tipo", category.type == CategoryType.INCOME ? "Receita" : "Despesa")
                .text("Categoria pai", parentName)
                .text("Cor", category.color)
                .text("Situação", category.active ? "Ativo" : "Inativo");
    }

    private static void apply(Category category, CategoryRequest request) {
        category.name = request.name().trim();
        category.type = request.type();
        category.parentId = request.parentId();
        category.color = request.color().trim();
        category.active = request.active();
    }
}
