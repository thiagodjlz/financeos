package br.com.financeos.categories;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
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
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class CategoryResource {

    private final CategoryRepository repository;
    private final AccessControl accessControl;

    public CategoryResource(CategoryRepository repository, AccessControl accessControl) {
        this.repository = repository;
        this.accessControl = accessControl;
    }

    @GET
    public List<CategoryResponse> list(@QueryParam("type") CategoryType type) {
        accessControl.require(Screen.CATEGORIES, Action.VIEW);
        return repository.list(type).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    public CategoryResponse get(@PathParam("id") UUID id) {
        accessControl.require(Screen.CATEGORIES, Action.VIEW);
        return repository.findActiveById(id)
                .map(CategoryResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    public Response create(@Valid CategoryRequest request) {
        accessControl.require(Screen.CATEGORIES, Action.CREATE);
        validateParent(request, null);
        validateDuplicate(request, null);

        Category category = new Category();
        apply(category, request);
        repository.persistAndFlush(category);

        return Response.created(URI.create("/api/categories/" + category.id))
                .entity(CategoryResponse.from(category))
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public CategoryResponse update(@PathParam("id") UUID id, @Valid CategoryRequest request) {
        accessControl.require(Screen.CATEGORIES, Action.EDIT);
        Category category = repository.findByIdOptional(id)
                .orElseThrow(NotFoundException::new);

        validateParent(request, id);
        validateDuplicate(request, id);
        apply(category, request);
        return CategoryResponse.from(category);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deactivate(@PathParam("id") UUID id) {
        accessControl.require(Screen.CATEGORIES, Action.DELETE);
        Category category = repository.findActiveById(id)
                .orElseThrow(NotFoundException::new);

        category.active = false;
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

    private static void apply(Category category, CategoryRequest request) {
        category.name = request.name().trim();
        category.type = request.type();
        category.parentId = request.parentId();
        category.color = request.color().trim();
        category.active = request.active();
    }
}
