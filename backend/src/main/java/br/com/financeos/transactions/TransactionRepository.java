package br.com.financeos.transactions;

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
public class TransactionRepository implements PanacheRepositoryBase<FinancialTransaction, UUID> {

    public PanacheQuery<FinancialTransaction> search(UUID userId, TransactionFilter filter) {
        Map<String, Object> params = new HashMap<>();
        List<String> filters = new ArrayList<>();

        filters.add("userId = :userId");
        params.put("userId", userId);

        if (filter.description() != null) {
            filters.add(TextSearch.condition("description", "description"));
            params.put("description", TextSearch.containsPattern(filter.description()));
        }

        if (filter.categoryId() != null) {
            filters.add("categoryId = :categoryId");
            params.put("categoryId", filter.categoryId());
        }

        if (filter.type() != null) {
            filters.add("type = :type");
            params.put("type", filter.type());
        }

        if (filter.status() != null) {
            filters.add("status = :status");
            params.put("status", filter.status());
        }

        if (filter.startDate() != null) {
            filters.add("transactionDate >= :startDate");
            params.put("startDate", filter.startDate());
        }

        if (filter.endDate() != null) {
            filters.add("transactionDate <= :endDate");
            params.put("endDate", filter.endDate());
        }

        String query = String.join(" and ", filters) + " order by transactionDate desc, createdAt desc, id";
        return find(query, params);
    }

    public Optional<FinancialTransaction> findByUserAndId(UUID userId, UUID id) {
        return find("userId = ?1 and id = ?2", userId, id).firstResultOptional();
    }
}
