package br.com.financeos.reports;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Collator;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import br.com.financeos.reports.TransactionReportResponse.Group;
import br.com.financeos.reports.TransactionReportResponse.Row;
import br.com.financeos.reports.TransactionReportResponse.Totals;
import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;

// Monta grupos e subtotais a partir das linhas já filtradas e ordenadas por data. Os subtotais seguem
// o Saldo do Resumo: Receitas menos Despesas pagas; despesa pendente aparece só na linha (DD3).
public final class TransactionReportBuilder {

    static final String WITHOUT_CATEGORY = "Sem categoria";
    static final String WITHOUT_STATUS = "Sem status";

    private static final String NONE_KEY = "NONE";
    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private TransactionReportBuilder() {
    }

    public static Totals totals(List<FinancialTransaction> transactions) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal paidExpense = BigDecimal.ZERO;

        for (FinancialTransaction transaction : transactions) {
            if (transaction.type == TransactionType.INCOME) {
                income = income.add(transaction.amount);
            } else if (transaction.status == TransactionStatus.PAID) {
                paidExpense = paidExpense.add(transaction.amount);
            }
        }

        return new Totals(money(income), money(paidExpense), money(income.subtract(paidExpense)));
    }

    public static List<Row> rows(List<FinancialTransaction> transactions) {
        return transactions.stream().map(Row::from).toList();
    }

    public static List<Group> groups(List<FinancialTransaction> transactions, List<ReportGrouping> levels) {
        if (levels.isEmpty()) {
            return List.of();
        }

        ReportGrouping level = levels.get(0);
        List<ReportGrouping> remaining = levels.subList(1, levels.size());

        Map<String, List<FinancialTransaction>> buckets = new LinkedHashMap<>();
        for (FinancialTransaction transaction : transactions) {
            buckets.computeIfAbsent(keyOf(level, transaction), key -> new ArrayList<>()).add(transaction);
        }

        List<Map.Entry<String, List<FinancialTransaction>>> ordered = new ArrayList<>(buckets.entrySet());
        ordered.sort(comparator(level));

        List<Group> groups = new ArrayList<>(ordered.size());
        for (Map.Entry<String, List<FinancialTransaction>> bucket : ordered) {
            List<FinancialTransaction> members = bucket.getValue();
            boolean leaf = remaining.isEmpty();

            groups.add(new Group(
                    level,
                    level.label(),
                    bucket.getKey(),
                    labelOf(level, members.get(0)),
                    totals(members),
                    members.size(),
                    leaf ? List.of() : groups(members, remaining),
                    leaf ? rows(members) : List.of()));
        }

        return List.copyOf(groups);
    }

    private static String keyOf(ReportGrouping level, FinancialTransaction transaction) {
        return switch (level) {
            case CATEGORY -> transaction.categoryId == null ? NONE_KEY : transaction.categoryId.toString();
            case TYPE -> transaction.type.name();
            case STATUS -> transaction.status == null ? NONE_KEY : transaction.status.name();
            case SOURCE -> transaction.source.name();
            case DAY -> transaction.transactionDate.toString();
            case MONTH -> YearMonth.from(transaction.transactionDate).toString();
            case YEAR -> String.valueOf(transaction.transactionDate.getYear());
        };
    }

    // Categoria pelo nome; Tipo, Status e Origem na ordem do enum; Dia, Mês e Ano em ordem
    // cronológica (a chave ISO já ordena). "Sem categoria" e "Sem status" ficam por último.
    private static Comparator<Map.Entry<String, List<FinancialTransaction>>> comparator(ReportGrouping level) {
        Comparator<Map.Entry<String, List<FinancialTransaction>>> noneLast =
                Comparator.comparing(entry -> NONE_KEY.equals(entry.getKey()));

        return switch (level) {
            case CATEGORY -> {
                Collator collator = Collator.getInstance(PT_BR);
                collator.setStrength(Collator.SECONDARY);
                yield noneLast
                        .thenComparing(entry -> labelOf(level, entry.getValue().get(0)), collator)
                        .thenComparing(Map.Entry::getKey);
            }
            case TYPE, STATUS, SOURCE -> noneLast.thenComparingInt(entry -> ordinalOf(level, entry.getValue().get(0)));
            case DAY, MONTH, YEAR -> Comparator.comparing(Map.Entry::getKey);
        };
    }

    private static int ordinalOf(ReportGrouping level, FinancialTransaction transaction) {
        return switch (level) {
            case TYPE -> transaction.type.ordinal();
            case STATUS -> transaction.status == null ? Integer.MAX_VALUE : transaction.status.ordinal();
            case SOURCE -> transaction.source.ordinal();
            default -> 0;
        };
    }

    private static String labelOf(ReportGrouping level, FinancialTransaction transaction) {
        return switch (level) {
            case CATEGORY -> transaction.categoryName == null ? WITHOUT_CATEGORY : transaction.categoryName;
            case TYPE -> typeLabel(transaction.type);
            case STATUS -> statusLabel(transaction.status);
            case SOURCE -> sourceLabel(transaction.source);
            case DAY -> DAY.format(transaction.transactionDate);
            case MONTH -> monthLabel(transaction.transactionDate);
            case YEAR -> String.valueOf(transaction.transactionDate.getYear());
        };
    }

    static String typeLabel(TransactionType type) {
        if (type == null) {
            return null;
        }

        return switch (type) {
            case INCOME -> "Receita";
            case EXPENSE -> "Despesa";
        };
    }

    static String statusLabel(TransactionStatus status) {
        if (status == null) {
            return WITHOUT_STATUS;
        }

        return switch (status) {
            case PENDING -> "Pendente";
            case PAID -> "Pago";
        };
    }

    static String sourceLabel(TransactionSource source) {
        if (source == null) {
            return null;
        }

        return switch (source) {
            case MANUAL -> "Manual";
            case EXCEL_IMPORT -> "Importação de planilha";
            case RECURRENCE -> "Recorrência";
        };
    }

    // "Outubro de 2026", como o título de mês do Resumo.
    private static String monthLabel(LocalDate date) {
        String month = date.getMonth().getDisplayName(TextStyle.FULL, PT_BR);
        return Character.toUpperCase(month.charAt(0)) + month.substring(1) + " de " + date.getYear();
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
