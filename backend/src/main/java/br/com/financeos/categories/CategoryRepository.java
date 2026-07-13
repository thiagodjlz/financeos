package br.com.financeos.categories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CategoryRepository implements PanacheRepositoryBase<Category, UUID> {

    public List<Category> list(CategoryType type) {
        if (type == null) {
            return list("order by type, name");
        }

        return list("active = true and type = ?1 order by name", type);
    }

    public Optional<Category> findActiveById(UUID id) {
        return find("id = ?1 and active = true", id).firstResultOptional();
    }

    public Optional<Category> findDuplicate(String name, CategoryType type, UUID parentId) {
        if (parentId == null) {
            return find("name = ?1 and type = ?2 and parentId is null", name, type).firstResultOptional();
        }

        return find("name = ?1 and type = ?2 and parentId = ?3", name, type, parentId).firstResultOptional();
    }
}
