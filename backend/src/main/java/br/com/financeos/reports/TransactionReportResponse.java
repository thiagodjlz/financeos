package br.com.financeos.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;

// A tela só exibe: totais, saldos e rótulos dos grupos chegam prontos daqui.
public record TransactionReportResponse(
        Period period,
        LocalDate generatedOn,
        BigDecimal currentBalance,
        Totals totals,
        int transactionCount,
        List<Group> groups,
        List<Row> rows) {

    public record Period(ReportPeriod code, String label, LocalDate startDate, LocalDate endDate) {
    }

    public record Totals(BigDecimal income, BigDecimal paidExpense, BigDecimal balance) {
    }

    // Grupo folha traz as linhas; grupo intermediário traz os subgrupos do nível seguinte.
    public record Group(
            ReportGrouping field,
            String fieldLabel,
            String key,
            String label,
            Totals totals,
            int transactionCount,
            List<Group> groups,
            List<Row> rows) {
    }

    public record Row(
            UUID id,
            LocalDate transactionDate,
            String description,
            UUID categoryId,
            String categoryName,
            TransactionType type,
            TransactionStatus status,
            TransactionSource source,
            Integer installmentNumber,
            Integer installmentTotal,
            BigDecimal amount,
            String notes) {

        static Row from(FinancialTransaction transaction) {
            return new Row(
                    transaction.id,
                    transaction.transactionDate,
                    transaction.description,
                    transaction.categoryId,
                    transaction.categoryName,
                    transaction.type,
                    transaction.status,
                    transaction.source,
                    transaction.installmentNumber,
                    transaction.installmentTotal,
                    transaction.amount,
                    transaction.notes);
        }
    }
}
