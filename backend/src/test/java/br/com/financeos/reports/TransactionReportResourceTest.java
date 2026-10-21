package br.com.financeos.reports;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.categories.Category;
import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.categories.CategoryType;
import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionRepository;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.path.json.JsonPath;
import io.restassured.specification.RequestSpecification;
import jakarta.inject.Inject;

// Usuário próprio (UUID constante, perfil Administrador): as somas exatas, inclusive o Saldo atual, que
// soma tudo do usuário desde out/2026, não podem depender do que outras classes gravam no ...0001.
@QuarkusTest
@TestSecurity(user = TransactionReportResourceTest.USER_EMAIL)
@JwtSecurity(claims = {
        @Claim(key = "sub", value = TransactionReportResourceTest.USER_ID)
})
class TransactionReportResourceTest {

    static final String USER_ID = "00000000-0000-0000-0000-000000001141";
    static final String USER_EMAIL = "teste-relatorios@financeos.local";
    private static final String OTHER_ID = "00000000-0000-0000-0000-000000001142";
    private static final String OTHER_EMAIL = "teste-relatorios-outro@financeos.local";
    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";
    private static final String CATEGORY_PREFIX = "Teste Relatório ";
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 20);

    @Inject
    TransactionRepository transactionRepository;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    AppUserRepository userRepository;

    @BeforeEach
    void setUp() {
        QuarkusMock.installMockForType(new FixedCurrentDate(TODAY), CurrentDate.class);
        removeData();
        QuarkusTransaction.requiringNew().run(() -> {
            insertUser(USER_ID, "Teste Relatórios", USER_EMAIL);
            insertUser(OTHER_ID, "Teste Relatórios Outro", OTHER_EMAIL);
        });
    }

    @AfterEach
    void tearDown() {
        removeData();
    }

    private void removeData() {
        QuarkusTransaction.requiringNew().run(() -> {
            userRepository.delete("email in ?1", List.of(USER_EMAIL, OTHER_EMAIL));
            categoryRepository.delete("name like ?1", CATEGORY_PREFIX + "%");
        });
    }

    private void insertUser(String id, String name, String email) {
        userRepository.getEntityManager()
                .createNativeQuery("""
                        insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                        values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                        """)
                .setParameter(1, id)
                .setParameter(2, name)
                .setParameter(3, email)
                .setParameter(4, "$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm")
                .setParameter(5, ADMIN_PROFILE_ID)
                .executeUpdate();
    }

    @Test
    void shouldResolvePreviousMonthWithTheFixedToday() {
        create(USER_ID, "2026-08-31", "100.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-09-01", "101.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-09-30", "102.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-01", "103.00", TransactionType.INCOME, null, null);

        JsonPath report = report(given().queryParam("period", "PREVIOUS_MONTH"));

        assertEquals("PREVIOUS_MONTH", report.getString("period.code"));
        assertEquals("Mês anterior", report.getString("period.label"));
        assertEquals("2026-09-01", report.getString("period.startDate"));
        assertEquals("2026-09-30", report.getString("period.endDate"));
        assertEquals(List.of("2026-09-01", "2026-09-30"), report.getList("rows.transactionDate"));
    }

    @Test
    void shouldDefaultToTheCurrentMonthAndResolveYears() {
        create(USER_ID, "2025-12-31", "1.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-01-01", "2.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-31", "3.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-11-01", "4.00", TransactionType.INCOME, null, null);

        JsonPath current = report(given());
        assertEquals("CURRENT_MONTH", current.getString("period.code"));
        assertEquals(List.of("2026-10-31"), current.getList("rows.transactionDate"));

        assertEquals(List.of("2026-01-01", "2026-10-31", "2026-11-01"),
                report(given().queryParam("period", "CURRENT_YEAR")).getList("rows.transactionDate"));
        assertEquals(List.of("2025-12-31"),
                report(given().queryParam("period", "PREVIOUS_YEAR")).getList("rows.transactionDate"));

        JsonPath custom = report(given().queryParam("period", "CUSTOM")
                .queryParam("startDate", "2026-01-01").queryParam("endDate", "2026-10-31"));
        assertEquals(List.of("2026-01-01", "2026-10-31"), custom.getList("rows.transactionDate"));
    }

    @Test
    void shouldFilterByTwoOfThreeCategories() {
        UUID food = category("Alimentação", CategoryType.EXPENSE, true);
        UUID home = category("Casa", CategoryType.EXPENSE, true);
        UUID leisure = category("Lazer", CategoryType.EXPENSE, true);
        create(USER_ID, "2026-10-02", "10.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-10-03", "20.00", TransactionType.EXPENSE, TransactionStatus.PAID, home);
        create(USER_ID, "2026-10-04", "30.00", TransactionType.EXPENSE, TransactionStatus.PAID, leisure);
        create(USER_ID, "2026-10-05", "40.00", TransactionType.EXPENSE, TransactionStatus.PAID, null);

        JsonPath report = report(given().queryParam("categoryId", food.toString(), home.toString()));

        assertEquals(List.of(food.toString(), home.toString()), report.getList("rows.categoryId"));
        assertMoney(report, "totals.paidExpense", "30.00");
        assertEquals(4, report(given()).getInt("transactionCount"));
    }

    @Test
    void shouldFilterByType() {
        create(USER_ID, "2026-10-02", "10.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-03", "20.00", TransactionType.EXPENSE, TransactionStatus.PAID, null);

        JsonPath report = report(given().queryParam("type", "EXPENSE"));

        assertEquals(List.of("EXPENSE"), report.getList("rows.type"));
    }

    @Test
    void shouldFilterByStatusLeavingIncomeOut() {
        create(USER_ID, "2026-10-02", "10.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-03", "20.00", TransactionType.EXPENSE, TransactionStatus.PAID, null);
        create(USER_ID, "2026-10-04", "30.00", TransactionType.EXPENSE, TransactionStatus.PENDING, null);

        JsonPath report = report(given().queryParam("status", "PAID"));

        assertEquals(List.of("PAID"), report.getList("rows.status"));
        assertMoney(report, "rows[0].amount", "20.00");
    }

    @Test
    void shouldFilterBySource() {
        create(USER_ID, "2026-10-02", "10.00", TransactionType.INCOME, null, null);
        FinancialTransaction imported = transaction(USER_ID, "2026-10-03", "20.00", TransactionType.INCOME, null, null);
        imported.source = TransactionSource.EXCEL_IMPORT;
        persist(imported);

        JsonPath report = report(given().queryParam("source", "EXCEL_IMPORT"));

        assertEquals(List.of("EXCEL_IMPORT"), report.getList("rows.source"));
    }

    @Test
    void shouldFilterByInclusiveAmountRange() {
        create(USER_ID, "2026-10-02", "99.99", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-03", "100.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-04", "200.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-05", "200.01", TransactionType.INCOME, null, null);

        JsonPath report = report(given().queryParam("minAmount", "100.00").queryParam("maxAmount", "200,00"));

        assertEquals(List.of("2026-10-03", "2026-10-04"), report.getList("rows.transactionDate"));
    }

    @Test
    void shouldFilterInstallmentsAndSinglePayments() {
        createInstallment("2026-10-02", null);
        createInstallment("2026-10-03", 1);
        createInstallment("2026-10-04", 3);

        assertEquals(List.of("2026-10-04"),
                report(given().queryParam("installments", "INSTALLMENT")).getList("rows.transactionDate"));
        assertEquals(List.of("2026-10-02", "2026-10-03"),
                report(given().queryParam("installments", "SINGLE")).getList("rows.transactionDate"));
        assertEquals(3, report(given().queryParam("installments", "ALL")).getInt("transactionCount"));
    }

    @Test
    void shouldCombineFiltersWithAnd() {
        UUID food = category("Alimentação", CategoryType.EXPENSE, true);
        create(USER_ID, "2026-10-02", "150.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-10-03", "150.00", TransactionType.EXPENSE, TransactionStatus.PENDING, food);
        create(USER_ID, "2026-10-04", "50.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-10-05", "150.00", TransactionType.EXPENSE, TransactionStatus.PAID, null);

        JsonPath report = report(given()
                .queryParam("categoryId", food.toString())
                .queryParam("status", "PAID")
                .queryParam("minAmount", "100"));

        assertEquals(List.of("2026-10-02"), report.getList("rows.transactionDate"));
    }

    @Test
    void shouldRejectInvalidCriteriaInPortuguese() {
        assertBadRequest(given().queryParam("period", "CUSTOM").queryParam("startDate", "2026-10-01"),
                "Informe a data inicial e a data final do período personalizado.");
        assertBadRequest(given().queryParam("period", "CUSTOM")
                .queryParam("startDate", "2026-10-31").queryParam("endDate", "2026-10-01"),
                "A data inicial não pode ser posterior à data final.");
        assertBadRequest(given().queryParam("minAmount", "200").queryParam("maxAmount", "100"),
                "O valor mínimo não pode ser maior que o valor máximo.");
        assertBadRequest(given().queryParam("minAmount", "-1"), "O valor mínimo não pode ser negativo.");
        assertBadRequest(given().queryParam("maxAmount", "-0.01"), "O valor máximo não pode ser negativo.");
        assertBadRequest(given().queryParam("minAmount", "abc"), "O valor mínimo informado é inválido.");
        assertBadRequest(given().queryParam("type", "XYZ"), "O tipo informado é inválido.");
        assertBadRequest(given().queryParam("status", "CANCELED"), "O status informado é inválido.");
        assertBadRequest(given().queryParam("source", "XYZ"), "A origem informada é inválida.");
        assertBadRequest(given().queryParam("installments", "XYZ"), "O parcelamento informado é inválido.");
        assertBadRequest(given().queryParam("period", "NEXT_MONTH"), "O período informado é inválido.");
        assertBadRequest(given().queryParam("groupBy", "DESCRIPTION"), "O agrupamento informado é inválido.");
        assertBadRequest(given().queryParam("groupBy", "CATEGORY", "MONTH", "CATEGORY"),
                "O agrupamento não pode repetir o mesmo campo.");
        assertBadRequest(given().queryParam("categoryId", "abc"), "A categoria informada é inválida.");
        assertBadRequest(given().queryParam("startDate", "2026-13-01").queryParam("period", "CUSTOM"),
                "A data inicial informada é inválida.");
    }

    @Test
    void shouldGroupByCategoryThenMonthWithSubtotals() {
        UUID food = category("Alimentação", CategoryType.EXPENSE, true);
        UUID salary = category("Salário", CategoryType.INCOME, true);
        create(USER_ID, "2026-10-05", "50.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-11-05", "30.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-10-10", "1000.00", TransactionType.INCOME, null, salary);

        JsonPath report = report(custom("2026-10-01", "2026-11-30").queryParam("groupBy", "CATEGORY", "MONTH"));

        assertEquals(List.of(CATEGORY_PREFIX + "Alimentação", CATEGORY_PREFIX + "Salário"),
                report.getList("groups.label"));
        assertEquals(List.of("CATEGORY", "CATEGORY"), report.getList("groups.field"));
        assertEquals("Categoria", report.getString("groups[0].fieldLabel"));
        assertEquals(List.of("Outubro de 2026", "Novembro de 2026"), report.getList("groups[0].groups.label"));
        assertEquals("MONTH", report.getString("groups[0].groups[0].field"));

        assertMoney(report, "groups[0].groups[0].totals.income", "0.00");
        assertMoney(report, "groups[0].groups[0].totals.paidExpense", "50.00");
        assertMoney(report, "groups[0].groups[0].totals.balance", "-50.00");
        assertMoney(report, "groups[0].groups[1].totals.balance", "-30.00");
        assertMoney(report, "groups[0].totals.balance", "-80.00");
        assertMoney(report, "groups[1].totals.balance", "1000.00");
        assertEquals(List.of("Outubro de 2026"), report.getList("groups[1].groups.label"));
        assertMoney(report, "totals.balance", "920.00");

        assertEquals(List.of(), report.getList("rows"));
        assertEquals(List.of(), report.getList("groups[0].rows"));
        assertEquals(1, report.getList("groups[0].groups[0].rows").size());
    }

    @Test
    void shouldGroupInThreeLevelsWithoutStatusAndWithoutCategoryLast() {
        UUID food = category("Alimentação", CategoryType.EXPENSE, true);
        create(USER_ID, "2026-10-05", "50.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-10-06", "70.00", TransactionType.EXPENSE, TransactionStatus.PENDING, food);
        create(USER_ID, "2026-10-07", "500.00", TransactionType.INCOME, null, null);

        JsonPath report = report(given().queryParam("groupBy", "CATEGORY", "MONTH", "STATUS"));

        assertEquals(List.of(CATEGORY_PREFIX + "Alimentação", "Sem categoria"), report.getList("groups.label"));
        assertEquals(List.of("Pendente", "Pago"), report.getList("groups[0].groups[0].groups.label"));
        assertMoney(report, "groups[0].groups[0].groups[0].totals.paidExpense", "0.00");
        assertMoney(report, "groups[0].groups[0].groups[1].totals.paidExpense", "50.00");
        assertEquals(List.of("Sem status"), report.getList("groups[1].groups[0].groups.label"));
        assertMoney(report, "groups[1].groups[0].groups[0].totals.income", "500.00");

        JsonPath byStatus = report(given().queryParam("groupBy", "STATUS", "TYPE"));
        assertEquals(List.of("Pendente", "Pago", "Sem status"), byStatus.getList("groups.label"));
        assertEquals(List.of("Receita"), byStatus.getList("groups[2].groups.label"));

        JsonPath byDay = report(given().queryParam("groupBy", "YEAR", "DAY"));
        assertEquals(List.of("2026"), byDay.getList("groups.label"));
        assertEquals(List.of("05/10/2026", "06/10/2026", "07/10/2026"), byDay.getList("groups[0].groups.label"));
    }

    @Test
    void shouldComputeThePeriodBalanceWithPaidExpensesOnly() {
        UUID food = category("Alimentação", CategoryType.EXPENSE, true);
        UUID salary = category("Salário", CategoryType.INCOME, true);
        create(USER_ID, "2026-10-05", "1000.00", TransactionType.INCOME, null, salary);
        create(USER_ID, "2026-10-06", "600.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);
        create(USER_ID, "2026-10-07", "300.00", TransactionType.EXPENSE, TransactionStatus.PENDING, food);

        JsonPath report = report(given().queryParam("groupBy", "MONTH"));
        assertMoney(report, "totals.income", "1000.00");
        assertMoney(report, "totals.paidExpense", "600.00");
        assertMoney(report, "totals.balance", "400.00");
        assertMoney(report, "groups[0].totals.balance", "400.00");
        assertEquals(3, report.getInt("groups[0].transactionCount"));

        JsonPath onlyFood = report(given().queryParam("categoryId", food.toString()));
        assertMoney(onlyFood, "totals.income", "0.00");
        assertMoney(onlyFood, "totals.balance", "-600.00");
        assertEquals(2, onlyFood.getInt("transactionCount"));
    }

    @Test
    void shouldComputeTheCurrentBalanceIgnoringFilters() {
        create(USER_ID, "2026-09-30", "500.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-05", "1000.00", TransactionType.INCOME, null, null);
        create(USER_ID, "2026-10-10", "300.00", TransactionType.EXPENSE, TransactionStatus.PAID, null);
        create(USER_ID, "2026-10-15", "200.00", TransactionType.EXPENSE, TransactionStatus.PENDING, null);
        create(USER_ID, "2026-10-20", "100.00", TransactionType.EXPENSE, TransactionStatus.PAID, null);
        create(USER_ID, "2026-10-25", "400.00", TransactionType.INCOME, null, null);

        JsonPath report = report(given());
        assertMoney(report, "currentBalance", "600.00");
        assertEquals("2026-10-20", report.getString("generatedOn"));
        assertMoney(report(given().queryParam("type", "EXPENSE").queryParam("period", "PREVIOUS_YEAR")),
                "currentBalance", "600.00");
    }

    @Test
    void shouldReturnEveryRowWithoutPagination() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (int index = 0; index < 120; index++) {
                transactionRepository.persist(transaction(USER_ID, "2026-10-" + String.format("%02d", 1 + index % 28),
                        "1.00", TransactionType.INCOME, null, null));
            }
        });

        JsonPath report = report(given());
        assertEquals(120, report.getList("rows").size());
        assertEquals(120, report.getInt("transactionCount"));
        assertMoney(report, "totals.income", "120.00");
    }

    @Test
    void shouldLeaveOtherUsersTransactionsOut() {
        UUID food = category("Alimentação", CategoryType.EXPENSE, true);
        create(USER_ID, "2026-10-05", "100.00", TransactionType.INCOME, null, null);
        create(OTHER_ID, "2026-10-05", "900.00", TransactionType.INCOME, null, null);
        create(OTHER_ID, "2026-10-06", "50.00", TransactionType.EXPENSE, TransactionStatus.PAID, food);

        JsonPath report = report(given().queryParam("groupBy", "CATEGORY"));
        assertEquals(1, report.getInt("transactionCount"));
        assertEquals(List.of("Sem categoria"), report.getList("groups.label"));
        assertMoney(report, "totals.balance", "100.00");
        assertMoney(report, "currentBalance", "100.00");
    }

    @Test
    void shouldAnswerEmptyReportWithZeroBalance() {
        create(USER_ID, "2026-10-05", "100.00", TransactionType.INCOME, null, null);

        JsonPath report = report(given().queryParam("period", "PREVIOUS_MONTH"));
        assertEquals(0, report.getInt("transactionCount"));
        assertMoney(report, "totals.balance", "0.00");
        assertMoney(report, "currentBalance", "100.00");
    }

    private RequestSpecification custom(String start, String end) {
        return given().queryParam("period", "CUSTOM").queryParam("startDate", start).queryParam("endDate", end);
    }

    private static JsonPath report(RequestSpecification request) {
        return request
                .when().get("/transaction-reports")
                .then()
                .statusCode(200)
                .extract().jsonPath();
    }

    private static void assertBadRequest(RequestSpecification request, String message) {
        request
                .when().get("/transaction-reports")
                .then()
                .statusCode(400)
                .body("message", equalTo(message));
    }

    private static void assertMoney(JsonPath body, String path, String expected) {
        String raw = body.getString(path);
        assertTrue(raw != null, path + " ausente");
        BigDecimal actual = new BigDecimal(raw);
        assertEquals(0, new BigDecimal(expected).compareTo(actual), path + ": esperado " + expected + ", veio " + actual);
    }

    private UUID category(String name, CategoryType type, boolean active) {
        return QuarkusTransaction.requiringNew().call(() -> {
            Category category = new Category();
            category.name = CATEGORY_PREFIX + name;
            category.type = type;
            category.active = active;
            categoryRepository.persist(category);
            return category.id;
        });
    }

    private void createInstallment(String date, Integer total) {
        FinancialTransaction transaction = transaction(USER_ID, date, "10.00", TransactionType.EXPENSE,
                TransactionStatus.PAID, null);
        transaction.installmentNumber = total == null ? null : 1;
        transaction.installmentTotal = total;
        persist(transaction);
    }

    private void create(String userId, String date, String amount, TransactionType type, TransactionStatus status,
            UUID categoryId) {
        persist(transaction(userId, date, amount, type, status, categoryId));
    }

    private void persist(FinancialTransaction transaction) {
        QuarkusTransaction.requiringNew().run(() -> transactionRepository.persist(transaction));
    }

    private static FinancialTransaction transaction(String userId, String date, String amount, TransactionType type,
            TransactionStatus status, UUID categoryId) {
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.userId = UUID.fromString(userId);
        transaction.categoryId = categoryId;
        transaction.transactionDate = LocalDate.parse(date);
        transaction.description = "Teste relatório " + date;
        transaction.amount = new BigDecimal(amount);
        transaction.type = type;
        transaction.status = status;
        transaction.source = TransactionSource.MANUAL;
        return transaction;
    }

    static class FixedCurrentDate extends CurrentDate {

        private final LocalDate value;

        FixedCurrentDate(LocalDate value) {
            this.value = value;
        }

        @Override
        public LocalDate today() {
            return value;
        }
    }
}
