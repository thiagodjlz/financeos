package br.com.financeos.reports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TransactionReportPreferenceRepository implements PanacheRepositoryBase<TransactionReportPreference, UUID> {

    public List<TransactionReportPreference> listByUser(UUID userId) {
        return list("userId = ?1 order by lower(name), id", userId);
    }

    public Optional<TransactionReportPreference> findByUserAndId(UUID userId, UUID id) {
        return find("userId = ?1 and id = ?2", userId, id).firstResultOptional();
    }

    public boolean nameTaken(UUID userId, String name, UUID exceptId) {
        if (exceptId == null) {
            return count("userId = ?1 and lower(name) = lower(?2)", userId, name) > 0;
        }

        return count("userId = ?1 and lower(name) = lower(?2) and id <> ?3", userId, name, exceptId) > 0;
    }

    // Chamado antes de mexer na preferência que vira padrão: o índice único parcial aceita uma só por
    // usuário, e deixar as duas mudanças para o flush faria o Hibernate gravar a nova antes de
    // desmarcar a anterior.
    public void clearDefault(UUID userId, UUID exceptId) {
        if (exceptId == null) {
            update("defaultPreference = false where userId = ?1 and defaultPreference = true", userId);
            return;
        }

        update("defaultPreference = false where userId = ?1 and defaultPreference = true and id <> ?2",
                userId, exceptId);
    }
}
