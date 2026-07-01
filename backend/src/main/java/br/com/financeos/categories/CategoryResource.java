package br.com.financeos.categories;

import java.net.URI;
import java.util.List;
import java.util.UUID;

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

@Path("/categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoryResource {

    private final CategoryRepository repository;

    public CategoryResource(CategoryRepository repository) {
        this.repository = repository;
    }

    @GET
    public List<CategoryResponse> list(@QueryParam("type") CategoryType type) {
        return repository.listActive(type).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    public CategoryResponse get(@PathParam("id") UUID id) {
        return repository.findActiveById(id)
                .map(CategoryResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    @POST
    @Transactional
    public Response create(@Valid CategoryRequest request) {
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
        Category category = repository.findActiveById(id)
                .orElseThrow(NotFoundException::new);

        apply(category, request);
        return CategoryResponse.from(category);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deactivate(@PathParam("id") UUID id) {
        Category category = repository.findActiveById(id)
                .orElseThrow(NotFoundException::new);

        category.active = false;
        return Response.noContent().build();
    }

    private static void apply(Category category, CategoryRequest request) {
        category.name = request.name().trim();
        category.type = request.type();
        category.parentId = request.parentId();
        category.color = blankToNull(request.color());
        category.icon = blankToNull(request.icon());
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
