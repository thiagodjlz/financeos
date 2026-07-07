package br.com.financeos.users;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AppUserRepository implements PanacheRepositoryBase<AppUser, UUID> {

    public Optional<AppUser> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public List<AppUser> listVisible() {
        return list("superAdmin = false order by name");
    }

    public Optional<AppUser> findVisibleById(UUID id) {
        return find("id = ?1 and superAdmin = false", id).firstResultOptional();
    }
}
