package br.com.financeos.dashboard;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    void shouldAddThePreviousBalanceToTheMonthBalance() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();

        JsonPath october = summary(2026, 10);
        assertMoney(october, "previousBalance", "0");
        assertMoney(october, "balance", "400.00");

        JsonPath november = summary(2026, 11);
        assertMoney(november, "previousBalance", "400.00");
        assertMoney(november, "balance", "600.00");

        JsonPath december = summary(2026, 12);
        assertMoney(december, "previousBalance", "600.00");
        assertMoney(december, "balance", "600.00");

        JsonPath february = summary(2027, 2);
        assertMoney(february, "previousBalance", "600.00");
        assertMoney(february, "balance", "600.00");
    }

    @Test
    void shouldIgnoreTransactionsBeforeOctober2026() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();
        createTransaction(TEST_USER_ID, "2026-09-15", "setembro receita", 100, TransactionType.INCOME, null);

        JsonPath september = summary(2026, 9);
        assertMoney(september, "balance", "100.00");
        assertMoney(september, "previousBalance", "0");

        assertMoney(summary(2026, 10), "previousBalance", "0");
        assertMoney(summary(2026, 11), "previousBalance", "400.00");
        assertMoney(summary(2026, 12), "previousBalance", "600.00");
    }

    @Test
    void shouldNeverCarryTheNewMonthBalanceIntoThePreviousBalance() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();
        createTransaction(TEST_USER_ID, "2026-12-05", "dezembro receita", 50, TransactionType.INCOME, null);

        JsonPath december = summary(2026, 12);
        assertMoney(december, "previousBalance", "600.00");
        assertMoney(december, "balance", "650.00");

        JsonPath january = summary(2027, 1);
        assertMoney(january, "previousBalance", "650.00");
        assertMoney(january, "balance", "650.00");
    }

    @Test
    void shouldMatchTheMonthlyEvolutionWithTheSummaryOfEachMonth() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();
        createTransaction(TEST_USER_ID, "2026-03-10", "marco despesa", 250, TransactionType.EXPENSE,
                TransactionStatus.PAID);

        JsonPath body = summary(2026, 11);
        assertMoney(body, "monthlyEvolution[9].balance", "400.00");
        assertMoney(body, "monthlyEvolution[10].balance", "600.00");
        assertMoney(body, "monthlyEvolution[11].balance", "600.00");
        assertMoney(body, "monthlyEvolution[2].balance", "-250.00");

        for (int index = 0; index < 12; index++) {
            String item = "monthlyEvolution[%d].".formatted(index);
            BigDecimal income = money(body, item + "income");
            BigDecimal expense = money(body, item + "expense");
            BigDecimal previous = money(body, item + "previousBalance");
            assertMoney(body, item + "balance", previous.add(income).subtract(expense).toPlainString());
            if (index < 9) {
                assertMoney(body, item + "previousBalance", "0");
            }

            JsonPath month = summary(2026, index + 1);
            assertMoney(body, item + "balance", month.getString("balance"));
            assertMoney(body, item + "previousBalance", month.getString("previousBalance"));
        }
    }

    @Test
    void shouldNotExposeTheAccumulatedBalance() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();

        JsonPath november = summary(2026, 11);
        assertTrue(november.getMap("").keySet().stream().noneMatch(key -> key.toString().contains("accumulated")));
        for (int index = 0; index < 12; index++) {
            assertNull(november.get("monthlyEvolution[%d].accumulatedBalance".formatted(index)));
            assertNotNull(november.get("monthlyEvolution[%d].previousBalance".formatted(index)));
        }
    }

    @Test
    void shouldCarryNegativeBalanceToTheNextMonths() {
        fixCurrentMonth(2026, 12);
        createTransaction(TEST_USER_ID, "2026-10-05", "outubro receita", 100, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2026-10-10", "outubro despesa", 300, TransactionType.EXPENSE,
                TransactionStatus.PAID);
        createTransaction(TEST_USER_ID, "2026-11-05", "novembro receita", 500, TransactionType.INCOME, null);

        JsonPath november = summary(2026, 11);
        assertMoney(november, "previousBalance", "-200.00");
        assertMoney(november, "balance", "300.00");
    }

    @Test
    void shouldSumFutureMonthsOnlyUntilTheCurrentMonth() {
        createCriterion1Scenario();
        createTransaction(TEST_USER_ID, "2026-12-05", "dezembro receita", 1000, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2027-01-05", "janeiro receita", 300, TransactionType.INCOME, null);

        fixCurrentMonth(2026, 11);
        JsonPath december = summary(2026, 12);
        assertMoney(december, "previousBalance", "600.00");
        assertMoney(december, "balance", "1600.00");

        JsonPath january = summary(2027, 1);
        assertMoney(january, "previousBalance", "600.00");
        assertMoney(january, "balance", "900.00");

        fixCurrentMonth(2026, 12);
        JsonPath januaryAfterDecember = summary(2027, 1);
        assertMoney(januaryAfterDecember, "previousBalance", "1600.00");
        assertMoney(januaryAfterDecember, "balance", "1900.00");
    }

    @Test
    void shouldIgnorePendingExpenseInPreviousBalance() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();
        createTransaction(TEST_USER_ID, "2026-10-20", "outubro pendente", 300, TransactionType.EXPENSE,
                TransactionStatus.PENDING);

        assertMoney(summary(2026, 11), "previousBalance", "400.00");
        assertMoney(summary(2026, 12), "previousBalance", "600.00");
    }

    @Test
    void shouldAccumulateOnlyTheLoggedUserTransactions() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();
        createTransaction(OTHER_USER_ID, "2026-10-12", "outro usuario receita", 900, TransactionType.INCOME, null);
        createTransaction(OTHER_USER_ID, "2026-10-13", "outro usuario despesa", 50, TransactionType.EXPENSE,
                TransactionStatus.PAID);

        JsonPath november = summary(2026, 11);
        assertMoney(november, "previousBalance", "400.00");
        assertMoney(november, "balance", "600.00");
    }

    @Test
    void shouldRecalculateAfterEditingOrDeletingAnOldTransaction() {
        fixCurrentMonth(2026, 12);
        String octoberIncome = createTransaction(TEST_USER_ID, "2026-10-05", "outubro receita", 1000,
                TransactionType.INCOME, null);
        String octoberExpense = createTransaction(TEST_USER_ID, "2026-10-10", "outubro despesa", 600,
                TransactionType.EXPENSE, TransactionStatus.PAID);

        assertMoney(summary(2026, 11), "previousBalance", "400.00");
        assertMoney(summary(2026, 12), "balance", "400.00");

        QuarkusTransaction.requiringNew().run(() -> repository.findByIdOptional(UUID.fromString(octoberIncome))
                .ifPresent(transaction -> transaction.amount = new BigDecimal("1500.00")));
        assertMoney(summary(2026, 11), "previousBalance", "900.00");
        assertMoney(summary(2026, 12), "balance", "900.00");

        given()
                .when().delete("/transactions/{id}", octoberExpense)
                .then()
                .statusCode(204);
        assertMoney(summary(2026, 11), "previousBalance", "1500.00");
        assertMoney(summary(2026, 12), "balance", "1500.00");
    }

    @Test
    void shouldKeepExistingTotalsUnchanged() {
        fixCurrentMonth(2026, 12);
        createCriterion1Scenario();

        JsonPath november = summary(2026, 11);
        assertMoney(november, "totalIncome", "3000.00");
        assertMoney(november, "totalExpense", "2800.00");
        assertMoney(november, "paidExpense", "2800.00");
        assertMoney(november, "pendingExpense", "500.00");
        assertMoney(november, "paidExpensePercent", "93.3");
        assertEquals(3, november.getInt("transactionCount"));
        assertMoney(november, "monthlyEvolution[10].income", "3000.00");
        assertMoney(november, "monthlyEvolution[10].expense", "2800.00");
    }

    private void createCriterion1Scenario() {
        createTransaction(TEST_USER_ID, "2026-10-05", "outubro receita", 1000, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2026-10-10", "outubro despesa", 600, TransactionType.EXPENSE,
                TransactionStatus.PAID);
        createTransaction(TEST_USER_ID, "2026-11-05", "novembro receita", 3000, TransactionType.INCOME, null);
        createTransaction(TEST_USER_ID, "2026-11-10", "novembro despesa", 2800, TransactionType.EXPENSE,
                TransactionStatus.PAID);
        createTransaction(TEST_USER_ID, "2026-11-15", "novembro pendente", 500, TransactionType.EXPENSE,
                TransactionStatus.PENDING);
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
