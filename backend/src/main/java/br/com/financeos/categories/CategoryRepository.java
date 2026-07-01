package br.com.financeos.categories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CategoryRepository implements PanacheRepositoryBase<Category, UUID> {

    public List<Category> listActive(CategoryType type) {
        if (type == null) {
            return list("active = true order by type, name");
        }

        return list("active = true and type = ?1 order by name", type);
    }

    public Optional<Category> findActiveById(UUID id) {
        return find("id = ?1 and active = true", id).firstResultOptional();
    }
}
