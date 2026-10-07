package br.com.financeos.audit;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import br.com.financeos.shared.TextSearch;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AuditRecordRepository implements PanacheRepositoryBase<AuditRecord, UUID> {

    // O super_admin oculto é auditado, mas a consulta nunca devolve nem conta as linhas dele: pela
    // marca gravada no momento (sobrevive à exclusão da conta) e por quem é super_admin hoje (conta
    // promovida depois de já ter registros).
    private static final String HIDE_SUPER_ADMIN = "userSuperAdmin = false"
            + " and (userId is null or userId not in (select u.id from AppUser u where u.superAdmin = true))";

    public PanacheQuery<AuditRecord> search(AuditFilter filter) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        conditions.add(HIDE_SUPER_ADMIN);

        if (filter.from() != null) {
            conditions.add("occurredAt >= :from");
            params.put("from", filter.from());
        }

        if (filter.until() != null) {
            conditions.add("occurredAt < :until");
            params.put("until", filter.until());
        }

        if (filter.user() != null) {
            conditions.add("(" + TextSearch.condition("userName", "user")
                    + " or " + TextSearch.condition("userEmail", "user") + ")");
            params.put("user", TextSearch.containsPattern(filter.user()));
        }

        if (filter.type() != null) {
            conditions.add("eventType = :type");
            params.put("type", filter.type().name());
        }

        if (filter.action() != null) {
            conditions.add("action = :action");
            params.put("action", filter.action().name());
        }

        if (filter.screen() != null) {
            conditions.add("screen = :screen");
            params.put("screen", filter.screen().name());
        }

        return find(String.join(" and ", conditions) + " order by occurredAt desc, id desc", params);
    }
}
