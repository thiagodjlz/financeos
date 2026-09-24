package br.com.financeos.users;

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
public class AppUserRepository implements PanacheRepositoryBase<AppUser, UUID> {

    public Optional<AppUser> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    // O super_admin oculto nunca entra na lista nem na contagem de registros.
    public PanacheQuery<AppUser> searchVisible(String name, String email, UUID profileId, Boolean active) {
        Map<String, Object> params = new HashMap<>();
        List<String> filters = new ArrayList<>();

        filters.add("superAdmin = false");

        if (name != null) {
            filters.add(TextSearch.condition("name", "name"));
            params.put("name", TextSearch.containsPattern(name));
        }

        if (email != null) {
            filters.add(TextSearch.condition("email", "email"));
            params.put("email", TextSearch.containsPattern(email));
        }

        if (profileId != null) {
            filters.add("profileId = :profileId");
            params.put("profileId", profileId);
        }

        if (active != null) {
            filters.add("active = :active");
            params.put("active", active);
        }

        return find(String.join(" and ", filters) + " order by name, id", params);
    }

    public Optional<AppUser> findVisibleById(UUID id) {
        return find("id = ?1 and superAdmin = false", id).firstResultOptional();
    }
}
