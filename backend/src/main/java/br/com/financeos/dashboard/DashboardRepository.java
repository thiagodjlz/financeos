package br.com.financeos.dashboard;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.sql.DataSource;

import br.com.financeos.transactions.TransactionType;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DashboardRepository {

    private final DataSource dataSource;

    public DashboardRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public DashboardTotals totals(UUID userId, LocalDate startDate, LocalDate endDate) throws Exception {
        String sql = """
                select
                    coalesce(sum(case when type = 'INCOME' and status <> 'CANCELED' then amount else 0 end), 0) as total_income,
                    coalesce(sum(case when type = 'EXPENSE' and status <> 'CANCELED' then amount else 0 end), 0) as total_expense,
                    coalesce(sum(case when type = 'EXPENSE' and status = 'PAID' then amount else 0 end), 0) as paid_expense,
                    coalesce(sum(case when type = 'EXPENSE' and status = 'PENDING' then amount else 0 end), 0) as pending_expense,
                    count(*) filter (where status <> 'CANCELED') as transaction_count
                from transactions
                where user_id = ?
                  and transaction_date between ? and ?
                """;

        try (Connection connection = dataSource.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, userId);
            statement.setDate(2, Date.valueOf(startDate));
            statement.setDate(3, Date.valueOf(endDate));

            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return new DashboardTotals(
                        resultSet.getBigDecimal("total_income"),
                        resultSet.getBigDecimal("total_expense"),
                        resultSet.getBigDecimal("paid_expense"),
                        resultSet.getBigDecimal("pending_expense"),
                        resultSet.getLong("transaction_count"));
            }
        }
    }

    public List<CategoryBreakdownResponse> categoryBreakdown(UUID userId, LocalDate startDate, LocalDate endDate)
            throws Exception {
        String sql = """
                select
                    t.category_id,
                    coalesce(c.name, 'Sem categoria') as category_name,
                    t.type,
                    coalesce(sum(t.amount), 0) as total_amount,
                    count(*) as transaction_count
                from transactions t
                left join categories c on c.id = t.category_id
                where t.user_id = ?
                  and t.status <> 'CANCELED'
                  and t.transaction_date between ? and ?
                group by t.category_id, c.name, t.type
                order by total_amount desc, category_name
                """;

        List<CategoryBreakdownResponse> items = new ArrayList<>();

        try (Connection connection = dataSource.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, userId);
            statement.setDate(2, Date.valueOf(startDate));
            statement.setDate(3, Date.valueOf(endDate));

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    items.add(new CategoryBreakdownResponse(
                            resultSet.getObject("category_id", UUID.class),
                            resultSet.getString("category_name"),
                            TransactionType.valueOf(resultSet.getString("type")),
                            resultSet.getBigDecimal("total_amount"),
                            resultSet.getLong("transaction_count")));
                }
            }
        }

        return items;
    }

    public List<MonthlySummaryResponse> monthlyEvolution(UUID userId, int year) throws Exception {
        String sql = """
                select
                    extract(month from transaction_date)::int as month,
                    coalesce(sum(case when type = 'INCOME' and status <> 'CANCELED' then amount else 0 end), 0) as income,
                    coalesce(sum(case when type = 'EXPENSE' and status <> 'CANCELED' then amount else 0 end), 0) as expense
                from transactions
                where user_id = ?
                  and transaction_date between ? and ?
                group by extract(month from transaction_date)::int
                order by month
                """;

        Map<Integer, MonthlySummaryResponse> months = new LinkedHashMap<>();
        for (int month = 1; month <= 12; month++) {
            months.put(month, MonthlySummaryResponse.empty(year, month));
        }

        try (Connection connection = dataSource.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, userId);
            statement.setDate(2, Date.valueOf(LocalDate.of(year, 1, 1)));
            statement.setDate(3, Date.valueOf(LocalDate.of(year, 12, 31)));

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    int month = resultSet.getInt("month");
                    BigDecimal income = resultSet.getBigDecimal("income");
                    BigDecimal expense = resultSet.getBigDecimal("expense");
                    months.put(month, MonthlySummaryResponse.of(year, month, income, expense));
                }
            }
        }

        return List.copyOf(months.values());
    }

    public record DashboardTotals(
            BigDecimal totalIncome,
            BigDecimal totalExpense,
            BigDecimal paidExpense,
            BigDecimal pendingExpense,
            long transactionCount) {
    }
}
