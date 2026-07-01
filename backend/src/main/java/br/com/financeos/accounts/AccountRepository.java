package br.com.financeos.accounts;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AccountRepository implements PanacheRepositoryBase<Account, UUID> {

    public List<Account> listActive(UUID userId, AccountType type) {
        if (type == null) {
            return list("userId = ?1 and active = true order by name", userId);
        }

        return list("userId = ?1 and type = ?2 and active = true order by name", userId, type);
    }

    public Optional<Account> findActiveByUserAndId(UUID userId, UUID id) {
        return find("userId = ?1 and id = ?2 and active = true", userId, id).firstResultOptional();
    }
}
