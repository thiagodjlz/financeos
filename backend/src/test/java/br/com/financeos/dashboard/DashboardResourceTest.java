package br.com.financeos.dashboard;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.empty;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import br.com.financeos.categories.Category;
import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.categories.CategoryType;
import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionRepository;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.path.json.JsonPath;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class DashboardResourceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final String OTHER_USER_EMAIL = "owner@financeos.internal";

    @Inject
    TransactionRepository repository;

    @Inject
    CategoryRepository categoryRepository;

    // Apaga por descricao em qualquer usuario: filtrar pelo usuario do teste deixaria o lancamento
    // do outro usuario vivo e tornaria as assercoes de periodos dependentes da ordem dos metodos.
    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("description like ?1", "Teste dashboard%");
        categoryRepository.delete("name like ?1", "Teste dashboard categoria%");
    }

    @Test
    void shouldReturnCategoryColorInBreakdown() {
        UUID colored = createCategory(CategoryType.EXPENSE, "#B93A2E");
        UUID colorless = createCategory(CategoryType.EXPENSE, null);
        setCategory(createTransaction("2026-05-05", "Teste dashboard cor com", 100, "EXPENSE", "PAID"), colored);
        setCategory(createTransaction("2026-05-06", "Teste dashboard cor sem", 50, "EXPENSE", "PAID"), colorless);
        createTransaction("2026-05-07", "Teste dashboard cor legado", 20, "EXPENSE", "PAID");

        given()
                .queryParam("year", 2026)
                .queryParam("month", 5)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("categoryBreakdown.find { it.categoryId == '%s' }.categoryColor".formatted(colored),
                        equalTo("#B93A2E"))
                .body("categoryBreakdown.find { it.categoryId == '%s' }.categoryColor".formatted(colorless),
                        nullValue())
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' }.categoryColor", nullValue())
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' }.totalAmount", equalTo(20.00F));
    }

    @Test
    void shouldReturnMonthlySummary() {
        createTransaction("2026-06-05", "Teste dashboard salario", 5000, "INCOME", "PAID");
        createTransaction("2026-06-10", "Teste dashboard aluguel", 1200, "EXPENSE", "PAID");
        createTransaction("2026-06-15", "Teste dashboard mercado", 300, "EXPENSE", "PENDING");
        createTransaction("2026-07-01", "Teste dashboard julho", 40, "EXPENSE", "PAID");

        given()
                .queryParam("year", 2026)
                .queryParam("month", 6)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.year", equalTo(2026))
                .body("period.month", equalTo(6))
                .body("totalIncome", equalTo(5000.00F))
                .body("totalExpense", equalTo(1200.00F))
                .body("balance", equalTo(3800.00F))
                .body("paidExpense", equalTo(1200.00F))
                .body("pendingExpense", equalTo(300.00F))
                .body("transactionCount", equalTo(3))
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' && it.type == 'INCOME' }.totalAmount",
                        equalTo(5000.00F))
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' && it.type == 'EXPENSE' }.totalAmount",
                        equalTo(1200.00F))
                .body("monthlyEvolution[5].income", equalTo(5000.00F))
                .body("monthlyEvolution[5].expense", equalTo(1200.00F))
                .body("monthlyEvolution[6].expense", equalTo(40.00F));
    }

    @Test
    void shouldRoundPaidExpensePercentHalfUp() {
        createTransaction("2016-03-05", "Teste dashboard percentual receita", 4000, "INCOME", "PAID");
        createTransaction("2016-03-10", "Teste dashboard percentual paga", 1170, "EXPENSE", "PAID");
        createTransaction("2016-03-15", "Teste dashboard percentual pendente", 300, "EXPENSE", "PENDING");

        given()
                .queryParam("year", 2016)
                .queryParam("month", 3)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("paidExpense", equalTo(1170.00F))
                .body("paidExpensePercent", equalTo(29.3F));
    }

    @Test
    void shouldReturnRealPaidExpensePercentAboveHundred() {
        createTransaction("2016-04-05", "Teste dashboard acima receita", 1000, "INCOME", "PAID");
        createTransaction("2016-04-10", "Teste dashboard acima paga", 1300, "EXPENSE", "PAID");

        given()
                .queryParam("year", 2016)
                .queryParam("month", 4)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("paidExpensePercent", equalTo(130.0F));
    }

    @Test
    void shouldReturnNullPaidExpensePercentWithoutIncome() {
        createTransaction("2016-05-10", "Teste dashboard sem receita", 250, "EXPENSE", "PAID");

        given()
                .queryParam("year", 2016)
                .queryParam("month", 5)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("paidExpense", equalTo(250.00F))
                .body("paidExpensePercent", nullValue());
    }

    @Test
    void shouldReturnCategorySharePercentOfItsType() {
        UUID first = createCategory(CategoryType.EXPENSE, null);
        UUID second = createCategory(CategoryType.EXPENSE, null);
        setCategory(createTransaction("2016-06-05", "Teste dashboard fatia menor", 117, "EXPENSE", "PAID"), first);
        setCategory(createTransaction("2016-06-06", "Teste dashboard fatia maior", 283, "EXPENSE", "PAID"), second);
        setCategory(createTransaction("2016-06-07", "Teste dashboard fatia pendente", 600, "EXPENSE", "PENDING"),
                first);
        createTransaction("2016-06-08", "Teste dashboard fatia receita", 900, "INCOME", "PAID");

        given()
                .queryParam("year", 2016)
                .queryParam("month", 6)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("categoryBreakdown.find { it.categoryId == '%s' }.sharePercent".formatted(first),
                        equalTo(29.3F))
                .body("categoryBreakdown.find { it.categoryId == '%s' }.sharePercent".formatted(second),
                        equalTo(70.8F))
                .body("categoryBreakdown.find { it.type == 'INCOME' }.sharePercent", equalTo(100.0F));
    }

    @Test
    void shouldRejectIncompletePeriod() {
        given()
                .queryParam("year", 2026)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400)
                .body("message", equalTo("Informe o ano e o mês juntos."));
    }

    @Test
    void shouldRejectMonthOutOfRange() {
        given()
                .queryParam("year", 2026)
                .queryParam("month", 13)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400)
                .body("message", equalTo("O mês deve estar entre 1 e 12."));
    }

    @Test
    void shouldListAvailablePeriodsFromTransactions() {
        createTransaction("2023-03-10", "Teste dashboard marco 2023", 100, "EXPENSE", "PAID");
        createTransaction("2025-07-01", "Teste dashboard julho 2025", 100, "EXPENSE", "PAID");
        createTransaction("2025-11-02", "Teste dashboard novembro 2025", 100, "EXPENSE", "PAID");
        createTransaction("2026-01-05", "Teste dashboard janeiro 2026", 100, "EXPENSE", "PAID");

        List<Map<String, Object>> periods = availablePeriods();
        List<Integer> years = periods.stream().map(period -> (Integer) period.get("year")).toList();

        assertEquals(years.stream().sorted(Comparator.reverseOrder()).toList(), years);
        assertFalse(years.contains(2024));
        assertTrue(years.contains(Year.now().getValue()));
        assertEquals(List.of(1), monthsOf(periods, 2026));
        assertEquals(List.of(7, 11), monthsOf(periods, 2025));
        assertEquals(List.of(3), monthsOf(periods, 2023));
    }

    @Test
    void shouldNotListPeriodsOfAnotherUser() {
        createTransactionFor(OTHER_USER_ID, "2018-04-09", "Teste dashboard outro usuario", 120, "EXPENSE", "PAID");

        List<Integer> years = availablePeriods().stream().map(period -> (Integer) period.get("year")).toList();

        assertFalse(years.contains(2018));
    }

    @Test
    @TestSecurity(user = OTHER_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000099")
    })
    void shouldAlwaysIncludeCurrentYearWithoutTransactions() {
        given()
                .when().get("/dashboard/periods")
                .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].year", equalTo(Year.now().getValue()))
                .body("[0].months", empty());
    }

    @Test
    void shouldRejectNonNumericYear() {
        given()
                .queryParam("year", "abc")
                .queryParam("month", 9)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400)
                .body("message", equalTo("O ano informado é inválido."));
    }

    @Test
    void shouldRejectEmptyYear() {
        given()
                .when().get("/dashboard/summary?year=&month=9")
                .then()
                .statusCode(400)
                .body("message", equalTo("O ano informado é inválido."));
    }

    @Test
    void shouldRejectImplausibleYear() {
        for (String year : List.of("0", "99999")) {
            given()
                    .queryParam("year", year)
                    .queryParam("month", 9)
                    .when().get("/dashboard/summary")
                    .then()
                    .statusCode(400)
                    .body("message", equalTo("O ano informado é inválido."));
        }
    }

    @Test
    void shouldReturnZeroedSummaryForYearWithoutTransactions() {
        createTransaction(LocalDate.of(Year.now().getValue(), 1, 15).toString(),
                "Teste dashboard ano corrente", 100, "EXPENSE", "PAID");

        JsonPath body = given()
                .queryParam("year", 2019)
                .queryParam("month", 3)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.year", equalTo(2019))
                .body("period.month", equalTo(3))
                .body("transactionCount", equalTo(0))
                .body("categoryBreakdown", empty())
                .body("monthlyEvolution.size()", equalTo(12))
                .extract().jsonPath();

        assertZeroedTotals(body);
        for (int index = 0; index < 12; index++) {
            assertEquals(2019, body.getInt("monthlyEvolution[%d].year".formatted(index)));
            assertEquals(0.0d, body.getDouble("monthlyEvolution[%d].income".formatted(index)));
            assertEquals(0.0d, body.getDouble("monthlyEvolution[%d].expense".formatted(index)));
        }
    }

    @Test
    void shouldCheckMonthBeforeYearWithoutTransactions() {
        given()
                .queryParam("year", 2019)
                .queryParam("month", 13)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400)
                .body("message", equalTo("O mês deve estar entre 1 e 12."));
    }

    @Test
    @TestSecurity(user = OTHER_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000099")
    })
    void shouldAcceptCurrentYearWithoutTransactions() {
        YearMonth now = YearMonth.now();

        JsonPath body = given()
                .queryParam("year", now.getYear())
                .queryParam("month", now.getMonthValue())
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.year", equalTo(now.getYear()))
                .body("period.month", equalTo(now.getMonthValue()))
                .extract().jsonPath();

        assertZeroedTotals(body);
    }

    @Test
    void shouldReturnZeroedSummaryForMonthWithoutData() {
        int currentYear = Year.now().getValue();
        createTransaction(LocalDate.of(currentYear, 1, 20).toString(),
                "Teste dashboard janeiro do ano corrente", 800, "EXPENSE", "PAID");

        JsonPath body = given()
                .queryParam("year", currentYear)
                .queryParam("month", 9)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("monthlyEvolution.size()", equalTo(12))
                .body("paidExpensePercent", nullValue())
                .extract().jsonPath();

        assertZeroedTotals(body);
    }

    private static void assertZeroedTotals(JsonPath body) {
        for (String field : List.of("totalIncome", "totalExpense", "pendingExpense", "balance")) {
            assertEquals(0.0d, body.getDouble(field), field);
        }
    }

    private static List<Map<String, Object>> availablePeriods() {
        return given()
                .when().get("/dashboard/periods")
                .then()
                .statusCode(200)
                .extract().jsonPath().getList("$");
    }

    private static List<Integer> monthsOf(List<Map<String, Object>> periods, int year) {
        return periods.stream()
                .filter(period -> Integer.valueOf(year).equals(period.get("year")))
                .findFirst()
                .map(period -> {
                    @SuppressWarnings("unchecked")
                    List<Integer> months = (List<Integer>) period.get("months");
                    return months;
                })
                .orElse(List.of());
    }

    // Persistido direto pelo repositorio: o POST /transactions passou a exigir categoria (issue #45)
    // e o agrupamento "Sem categoria" do DashboardRepository so e exercitado com category_id nulo.
    private String createTransaction(String date, String description, int amount, String type, String status) {
        return createTransactionFor(TEST_USER_ID, date, description, amount, type, status);
    }

    private String createTransactionFor(UUID userId, String date, String description, int amount, String type,
            String status) {
        return QuarkusTransaction.requiringNew().call(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = userId;
            transaction.categoryId = null;
            transaction.transactionDate = LocalDate.parse(date);
            transaction.description = description;
            transaction.amount = new BigDecimal(amount);
            transaction.type = TransactionType.valueOf(type);
            transaction.status = transaction.type == TransactionType.INCOME
                    ? null
                    : TransactionStatus.valueOf(status);
            transaction.source = TransactionSource.MANUAL;
            repository.persist(transaction);
            return transaction.id.toString();
        });
    }

    private UUID createCategory(CategoryType type, String color) {
        return QuarkusTransaction.requiringNew().call(() -> {
            Category category = new Category();
            category.name = "Teste dashboard categoria " + UUID.randomUUID();
            category.type = type;
            category.color = color;
            categoryRepository.persist(category);
            return category.id;
        });
    }

    private void setCategory(String transactionId, UUID categoryId) {
        QuarkusTransaction.requiringNew().run(() -> repository.findByIdOptional(UUID.fromString(transactionId))
                .ifPresent(transaction -> transaction.categoryId = categoryId));
    }
}
