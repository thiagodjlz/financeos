package br.com.financeos.reports;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TransactionReportRepository {

    private final TransactionRepository transactions;

    public TransactionReportRepository(TransactionRepository transactions) {
        this.transactions = transactions;
    }

    // Sem paginação (D11): o relatório traz tudo o que passou nos filtros. O filtro de Status deixa
    // as receitas de fora porque elas não têm status, como em Lançamentos; o de Categoria deixa de
    // fora o lançamento antigo sem categoria.
    public List<FinancialTransaction> search(UUID userId, TransactionReportCriteria criteria) {
        Map<String, Object> params = new HashMap<>();
        List<String> filters = new ArrayList<>();

        filters.add("userId = :userId");
        params.put("userId", userId);

        filters.add("transactionDate between :startDate and :endDate");
        params.put("startDate", criteria.startDate());
        params.put("endDate", criteria.endDate());

        if (!criteria.categoryIds().isEmpty()) {
            filters.add("categoryId in :categoryIds");
            params.put("categoryIds", criteria.categoryIds());
        }

        if (criteria.type() != null) {
            filters.add("type = :type");
            params.put("type", criteria.type());
        }

        if (criteria.status() != null) {
            filters.add("status = :status");
            params.put("status", criteria.status());
        }

        if (criteria.source() != null) {
            filters.add("source = :source");
            params.put("source", criteria.source());
        }

        if (criteria.minAmount() != null) {
            filters.add("amount >= :minAmount");
            params.put("minAmount", criteria.minAmount());
        }

        if (criteria.maxAmount() != null) {
            filters.add("amount <= :maxAmount");
            params.put("maxAmount", criteria.maxAmount());
        }

        switch (criteria.installments()) {
            case INSTALLMENT -> filters.add("installmentTotal > 1");
            case SINGLE -> filters.add("(installmentTotal is null or installmentTotal <= 1)");
            case ALL -> {
            }
        }

        String query = String.join(" and ", filters) + " order by transactionDate, createdAt, id";
        return transactions.list(query, params);
    }
}
