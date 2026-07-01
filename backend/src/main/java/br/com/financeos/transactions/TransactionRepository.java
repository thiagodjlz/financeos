package br.com.financeos.transactions;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TransactionRepository implements PanacheRepositoryBase<FinancialTransaction, UUID> {

    public List<FinancialTransaction> listByFilters(
            UUID userId,
            TransactionType type,
            TransactionStatus status,
            LocalDate startDate,
            LocalDate endDate,
            UUID categoryId) {

        Map<String, Object> params = new HashMap<>();
        List<String> filters = new ArrayList<>();

        filters.add("userId = :userId");
        params.put("userId", userId);

        if (type != null) {
            filters.add("type = :type");
            params.put("type", type);
        }

        if (status != null) {
            filters.add("status = :status");
            params.put("status", status);
        }

        if (startDate != null) {
            filters.add("transactionDate >= :startDate");
            params.put("startDate", startDate);
        }

        if (endDate != null) {
            filters.add("transactionDate <= :endDate");
            params.put("endDate", endDate);
        }

        if (categoryId != null) {
            filters.add("categoryId = :categoryId");
            params.put("categoryId", categoryId);
        }

        String query = String.join(" and ", filters) + " order by transactionDate desc, createdAt desc";
        PanacheQuery<FinancialTransaction> transactions = find(query, params);

        return transactions.list();
    }

    public Optional<FinancialTransaction> findByUserAndId(UUID userId, UUID id) {
        return find("userId = ?1 and id = ?2", userId, id).firstResultOptional();
    }
}
