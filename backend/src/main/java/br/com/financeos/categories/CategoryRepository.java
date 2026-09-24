package br.com.financeos.categories;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import br.com.financeos.shared.TextSearch;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CategoryRepository implements PanacheRepositoryBase<Category, UUID> {

    // Catálogo completo para o front: com tipo, só as ativas (dropdown de Lançamentos); sem tipo,
    // todas, inclusive inativas (resolve o nome da categoria nas linhas de Lançamentos).
    public List<Category> options(CategoryType type) {
        if (type == null) {
            return list("order by type, name, id");
        }

        return list("active = true and type = ?1 order by name, id", type);
    }

    public PanacheQuery<Category> search(String name, CategoryType type, Boolean active) {
        Map<String, Object> params = new HashMap<>();
        List<String> filters = new ArrayList<>();

        if (name != null) {
            filters.add(TextSearch.condition("name", "name"));
            params.put("name", TextSearch.containsPattern(name));
        }

        if (type != null) {
            filters.add("type = :type");
            params.put("type", type);
        }

        if (active != null) {
            filters.add("active = :active");
            params.put("active", active);
        }

        String where = filters.isEmpty() ? "" : String.join(" and ", filters) + " ";
        return find(where + "order by type, name, id", params);
    }

    public Optional<Category> findDuplicate(String name, CategoryType type, UUID parentId) {
        if (parentId == null) {
            return find("name = ?1 and type = ?2 and parentId is null", name, type).firstResultOptional();
        }

        return find("name = ?1 and type = ?2 and parentId = ?3", name, type, parentId).firstResultOptional();
    }
}
