package br.com.financeos.dashboard;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionRepository;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.path.json.JsonPath;
import jakarta.inject.Inject;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class DashboardAccumulatedBalanceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final String PREFIX = "Teste acumulado";

    @Inject
    TransactionRepository repository;

    // Apaga antes e depois, em qualquer usuario: os asserts de saldo anterior sao exatos e somam tudo
    // o que o usuario ...0001 tem desde out/2026, entao sobra de outra rodada contaminaria o resultado.
    @BeforeEach
    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> repository.delete("description like ?1", PREFIX + "%"));
    }

    @Test
    void shouldStartAccumulationInOctober2026() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();

        JsonPath october = summary(2026, 10);
        assertMoney(october, "balance", "400.00");
        assertMoney(october, "previousBalance", "0");
        assertMoney(october, "accumulatedBalance", "400.00");

        assertMoney(october, "monthlyEvolution[9].accumulatedBalance", "400.00");
        assertMoney(october, "monthlyEvolution[10].accumulatedBalance", "200.00");
        assertMoney(october, "monthlyEvolution[11].accumulatedBalance", "200.00");
        for (int index = 0; index < 12; index++) {
            assertNotNull(october.get("monthlyEvolution[%d].accumulatedBalance".formatted(index)));
        }
    }

    @Test
    void shouldCarryNegativeBalanceToTheNextMonths() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();

        JsonPath november = summary(2026, 11);
        assertMoney(november, "balance", "-200.00");
        assertMoney(november, "previousBalance", "400.00");
        assertMoney(november, "accumulatedBalance", "200.00");

        JsonPath december = summary(2026, 12);
        assertMoney(december, "balance", "0");
        assertMoney(december, "previousBalance", "200.00");
        assertMoney(december, "accumulatedBalance", "200.00");
    }

    @Test
    void shouldSumFutureMonthsOnlyUntilTheCurrentMonth() {
        createCriterion2Scenario();
        createTransaction(TEST_USER_ID, "2026-12-05", "dezembro receita", 1000, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2027-01-05", "janeiro receita", 300, TransactionType.INCOME, null);

        fixCurrentMonth(2026, 11);
        JsonPath december = summary(2026, 12);
        assertMoney(december, "previousBalance", "200.00");
        assertMoney(december, "accumulatedBalance", "1200.00");

        JsonPath january = summary(2027, 1);
        assertMoney(january, "previousBalance", "200.00");
        assertMoney(january, "accumulatedBalance", "500.00");

        fixCurrentMonth(2026, 12);
        JsonPath januaryAfterDecember = summary(2027, 1);
        assertMoney(januaryAfterDecember, "previousBalance", "1200.00");
        assertMoney(januaryAfterDecember, "accumulatedBalance", "1500.00");
    }

    @Test
    void shouldIgnoreTransactionsBeforeOctober2026() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();
        createTransaction(TEST_USER_ID, "2026-09-15", "setembro receita", 5000, TransactionType.INCOME, null);

        assertMoney(summary(2026, 10), "accumulatedBalance", "400.00");

        JsonPath november = summary(2026, 11);
        assertMoney(november, "previousBalance", "400.00");
        assertMoney(november, "accumulatedBalance", "200.00");

        JsonPath december = summary(2026, 12);
        assertMoney(december, "previousBalance", "200.00");
        assertMoney(december, "accumulatedBalance", "200.00");
    }

    @Test
    void shouldKeepAccumulatedEqualToBalanceBeforeOctober2026() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();
        createTransaction(TEST_USER_ID, "2026-09-15", "setembro receita", 5000, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2026-03-10", "marco despesa", 250, TransactionType.EXPENSE,
                TransactionStatus.PAID);

        JsonPath september = summary(2026, 9);
        assertMoney(september, "balance", "5000.00");
        assertMoney(september, "previousBalance", "0");
        assertMoney(september, "accumulatedBalance", "5000.00");

        for (int index = 0; index < 9; index++) {
            assertMoney(september, "monthlyEvolution[%d].accumulatedBalance".formatted(index),
                    september.getString("monthlyEvolution[%d].balance".formatted(index)));
        }
        assertMoney(september, "monthlyEvolution[2].accumulatedBalance", "-250.00");
    }

    @Test
    void shouldIgnorePendingExpenseInPreviousBalance() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();
        createTransaction(TEST_USER_ID, "2026-10-20", "outubro pendente", 300, TransactionType.EXPENSE,
                TransactionStatus.PENDING);

        assertMoney(summary(2026, 11), "previousBalance", "400.00");
    }

    @Test
    void shouldAccumulateOnlyTheLoggedUserTransactions() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();
        createTransaction(OTHER_USER_ID, "2026-10-12", "outro usuario receita", 900, TransactionType.INCOME, null);
        createTransaction(OTHER_USER_ID, "2026-10-13", "outro usuario despesa", 50, TransactionType.EXPENSE,
                TransactionStatus.PAID);

        assertMoney(summary(2026, 11), "previousBalance", "400.00");
    }

    @Test
    void shouldRecalculateAfterEditingOrDeletingAnOldTransaction() {
        fixCurrentMonth(2026, 12);
        String octoberIncome = createTransaction(TEST_USER_ID, "2026-10-05", "outubro receita", 1000,
                TransactionType.INCOME, null);
        String octoberExpense = createTransaction(TEST_USER_ID, "2026-10-10", "outubro despesa", 600,
                TransactionType.EXPENSE, TransactionStatus.PAID);

        assertMoney(summary(2026, 11), "previousBalance", "400.00");

        QuarkusTransaction.requiringNew().run(() -> repository.findByIdOptional(UUID.fromString(octoberIncome))
                .ifPresent(transaction -> transaction.amount = new BigDecimal("1500.00")));
        assertMoney(summary(2026, 11), "previousBalance", "900.00");

        given()
                .when().delete("/transactions/{id}", octoberExpense)
                .then()
                .statusCode(204);
        assertMoney(summary(2026, 11), "previousBalance", "1500.00");
    }

    @Test
    void shouldKeepExistingTotalsUnchanged() {
        fixCurrentMonth(2026, 12);
        createCriterion2Scenario();
        createTransaction(TEST_USER_ID, "2026-11-20", "novembro pendente", 80, TransactionType.EXPENSE,
                TransactionStatus.PENDING);

        JsonPath november = summary(2026, 11);
        assertMoney(november, "totalIncome", "500.00");
        assertMoney(november, "totalExpense", "700.00");
        assertMoney(november, "paidExpense", "700.00");
        assertMoney(november, "pendingExpense", "80.00");
        assertMoney(november, "balance", "-200.00");
        assertMoney(november, "paidExpensePercent", "140.0");
        assertEquals(3, november.getInt("transactionCount"));

        assertMoney(november, "monthlyEvolution[9].balance", "400.00");
        assertMoney(november, "monthlyEvolution[10].balance", "-200.00");
        for (int index = 0; index < 12; index++) {
            BigDecimal income = money(november, "monthlyEvolution[%d].income".formatted(index));
            BigDecimal expense = money(november, "monthlyEvolution[%d].expense".formatted(index));
            assertMoney(november, "monthlyEvolution[%d].balance".formatted(index), income.subtract(expense).toPlainString());
        }
    }

    private void createCriterion2Scenario() {
        createTransaction(TEST_USER_ID, "2026-10-05", "outubro receita", 1000, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2026-10-10", "outubro despesa", 600, TransactionType.EXPENSE,
                TransactionStatus.PAID);
        createTransaction(TEST_USER_ID, "2026-11-05", "novembro receita", 500, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2026-11-10", "novembro despesa", 700, TransactionType.EXPENSE,
                TransactionStatus.PAID);
    }

    private static void fixCurrentMonth(int year, int month) {
        QuarkusMock.installMockForType(new FixedCurrentMonth(YearMonth.of(year, month)), CurrentMonth.class);
    }

    private static JsonPath summary(int year, int month) {
        return given()
                .queryParam("year", year)
                .queryParam("month", month)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .extract().jsonPath();
    }

    private static BigDecimal money(JsonPath body, String path) {
        return new BigDecimal(body.getString(path));
    }

    private static void assertMoney(JsonPath body, String path, String expected) {
        BigDecimal actual = money(body, path);
        assertEquals(0, new BigDecimal(expected).compareTo(actual), path + ": esperado " + expected + ", veio " + actual);
    }

    // Persistido direto pelo repositorio: o POST /transactions exige categoria (issue #45), irrelevante aqui.
    private String createTransaction(UUID userId, String date, String description, int amount, TransactionType type,
            TransactionStatus status) {
        return QuarkusTransaction.requiringNew().call(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = userId;
            transaction.categoryId = null;
            transaction.transactionDate = LocalDate.parse(date);
            transaction.description = PREFIX + " " + description;
            transaction.amount = new BigDecimal(amount);
            transaction.type = type;
            transaction.status = status;
            transaction.source = TransactionSource.MANUAL;
            repository.persist(transaction);
            return transaction.id.toString();
        });
    }

    static class FixedCurrentMonth extends CurrentMonth {

        private final YearMonth value;

        FixedCurrentMonth(YearMonth value) {
            this.value = value;
        }

        @Override
        public YearMonth current() {
            return value;
        }
    }
}
