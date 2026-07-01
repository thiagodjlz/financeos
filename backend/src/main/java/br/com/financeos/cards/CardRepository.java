package br.com.financeos.cards;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CardRepository implements PanacheRepositoryBase<Card, UUID> {

    public List<Card> listActive(UUID userId) {
        return list("userId = ?1 and active = true order by name", userId);
    }

    public Optional<Card> findActiveByUserAndId(UUID userId, UUID id) {
        return find("userId = ?1 and id = ?2 and active = true", userId, id).firstResultOptional();
    }
}
