package br.com.financeos.profiles;

import java.util.UUID;

import br.com.financeos.shared.TextSearch;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Parameters;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProfileRepository implements PanacheRepositoryBase<Profile, UUID> {

    public PanacheQuery<Profile> search(String name) {
        if (name == null) {
            return find("order by name, id");
        }

        return find(TextSearch.condition("name", "name") + " order by name, id",
                Parameters.with("name", TextSearch.containsPattern(name)));
    }
}
