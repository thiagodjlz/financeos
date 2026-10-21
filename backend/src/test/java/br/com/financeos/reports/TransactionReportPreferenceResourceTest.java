package br.com.financeos.reports;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.audit.AuditProbe;
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
import io.restassured.http.ContentType;
import io.restassured.path.json.JsonPath;
import jakarta.inject.Inject;

@QuarkusTest
@TestSecurity(user = TransactionReportPreferenceResourceTest.USER_EMAIL)
@JwtSecurity(claims = {
        @Claim(key = "sub", value = TransactionReportPreferenceResourceTest.USER_ID)
})
class TransactionReportPreferenceResourceTest {

    static final String USER_ID = "00000000-0000-0000-0000-000000001143";
    static final String USER_EMAIL = "teste-relatorios-preferencias@financeos.local";
    private static final String OTHER_ID = "00000000-0000-0000-0000-000000001144";
    private static final String OTHER_EMAIL = "teste-relatorios-preferencias-outro@financeos.local";
    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";
    private static final String CATEGORY_PREFIX = "Teste Preferência ";
    private static final String PATH = "/transaction-reports/preferences";

    @Inject
    TransactionReportPreferenceRepository repository;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    TransactionRepository transactionRepository;

    @Inject
    AppUserRepository userRepository;

    @Inject
    AuditProbe probe;

    @BeforeEach
    void setUp() {
        fixToday(LocalDate.of(2026, 10, 20));
        removeData();
        QuarkusTransaction.requiringNew().run(() -> {
            insertUser(OTHER_ID, "Teste Preferências Outro", OTHER_EMAIL);
            insertUser(USER_ID, "Teste Preferências", USER_EMAIL);
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
    void shouldRequireNameInPortuguese() {
        given()
                .contentType(ContentType.JSON)
                .body(body("  ", false))
                .when().post(PATH)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message", equalTo("O nome é obrigatório."))
                .body("message", equalTo("Informe os campos obrigatórios: Nome."));

        given()
                .contentType(ContentType.JSON)
                .body(body("x".repeat(101), false))
                .when().post(PATH)
                .then()
                .statusCode(400)
                .body("message", equalTo("O nome deve ter no máximo 100 caracteres."));
    }

    @Test
    void shouldRejectRepeatedNameOnlyForTheSameUser() {
        createForOtherUser("Mensal");

        String id = create(body("Mensal", false));

        given()
                .contentType(ContentType.JSON)
                .body(body("  mensal ", false))
                .when().post(PATH)
                .then()
                .statusCode(409)
                .body("message", equalTo("Já existe uma preferência com esse nome."));

        String second = create(body("Anual", false));
        given()
                .contentType(ContentType.JSON)
                .body(body("MENSAL", false))
                .when().put(PATH + "/{id}", second)
                .then()
                .statusCode(409)
                .body("message", equalTo("Já existe uma preferência com esse nome."));

        given()
                .contentType(ContentType.JSON)
                .body(body(" Mensal  ", false))
                .when().put(PATH + "/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Mensal"));
    }

    @Test
    void shouldListOnlyTheLoggedUserPreferences() {
        createForOtherUser("Do outro");
        create(body("B minha", false));
        create(body("A minha", false));

        given()
                .when().get(PATH)
                .then()
                .statusCode(200)
                .body("name", equalTo(List.of("A minha", "B minha")));
    }

    @Test
    void shouldAnswerNotFoundForAnotherUsersPreference() {
        UUID other = createForOtherUser("Do outro");

        given()
                .contentType(ContentType.JSON)
                .body(body("Tomada", false))
                .when().put(PATH + "/{id}", other)
                .then()
                .statusCode(404);

        given()
                .when().delete(PATH + "/{id}", other)
                .then()
                .statusCode(404);

        assertEquals(1, QuarkusTransaction.requiringNew().call(() -> repository.count("id", other)));
    }

    @Test
    void shouldKeepRelativePeriodWithoutDatesAndResolveItOnTheNewMonth() {
        String payload = """
                {
                  "name": "Mês passado",
                  "period": "PREVIOUS_MONTH",
                  "startDate": "2026-01-01",
                  "endDate": "2026-01-31",
                  "columns": ["DATE", "AMOUNT"]
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(payload)
                .when().post(PATH)
                .then()
                .statusCode(201)
                .body("period", equalTo("PREVIOUS_MONTH"))
                .body("startDate", nullValue())
                .body("endDate", nullValue());

        fixToday(LocalDate.of(2026, 12, 5));

        given()
                .when().get(PATH)
                .then()
                .statusCode(200)
                .body("[0].period", equalTo("PREVIOUS_MONTH"))
                .body("[0].startDate", nullValue());

        given()
                .queryParam("period", "PREVIOUS_MONTH")
                .when().get("/transaction-reports")
                .then()
                .statusCode(200)
                .body("period.startDate", equalTo("2026-11-01"))
                .body("period.endDate", equalTo("2026-11-30"));
    }

    @Test
    void shouldKeepCustomDates() {
        String payload = """
                {
                  "name": "Primeiro semestre",
                  "period": "CUSTOM",
                  "startDate": "2026-01-01",
                  "endDate": "2026-06-30",
                  "groupBy": ["CATEGORY", "MONTH"],
                  "columns": ["DATE", "DESCRIPTION", "AMOUNT"],
                  "minAmount": 10.5,
                  "installments": "INSTALLMENT",
                  "type": "EXPENSE",
                  "status": "PAID",
                  "source": "MANUAL"
                }
                """;

        String id = create(payload);
        fixToday(LocalDate.of(2027, 3, 1));

        JsonPath saved = given().when().get(PATH).then().statusCode(200).extract().jsonPath();
        assertEquals(id, saved.getString("[0].id"));
        assertEquals("2026-01-01", saved.getString("[0].startDate"));
        assertEquals("2026-06-30", saved.getString("[0].endDate"));
        assertEquals(List.of("CATEGORY", "MONTH"), saved.getList("[0].groupBy"));
        assertEquals(List.of("DATE", "DESCRIPTION", "AMOUNT"), saved.getList("[0].columns"));
        assertEquals("INSTALLMENT", saved.getString("[0].installments"));
        assertEquals("EXPENSE", saved.getString("[0].type"));
        assertEquals("PAID", saved.getString("[0].status"));
        assertEquals("MANUAL", saved.getString("[0].source"));
        assertEquals(0, new BigDecimal("10.50").compareTo(new BigDecimal(saved.getString("[0].minAmount"))));
    }

    @Test
    void shouldKeepASingleDefaultPreference() {
        String first = create(body("A", true));
        String second = create(body("B", true));

        given()
                .when().get(PATH)
                .then()
                .statusCode(200)
                .body("find { it.id == '%s' }.defaultPreference".formatted(first), equalTo(false))
                .body("find { it.id == '%s' }.defaultPreference".formatted(second), equalTo(true));

        given()
                .contentType(ContentType.JSON)
                .body(body("A", true))
                .when().put(PATH + "/{id}", first)
                .then()
                .statusCode(200)
                .body("defaultPreference", equalTo(true));

        given()
                .when().get(PATH)
                .then()
                .statusCode(200)
                .body("find { it.id == '%s' }.defaultPreference".formatted(first), equalTo(true))
                .body("find { it.id == '%s' }.defaultPreference".formatted(second), equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .body(body("A", true))
                .when().put(PATH + "/{id}", first)
                .then()
                .statusCode(200)
                .body("defaultPreference", equalTo(true));
    }

    @Test
    void shouldRejectInvalidColumnsAndCriteria() {
        assertBadRequest("""
                { "name": "Sem colunas", "period": "CURRENT_MONTH", "columns": [] }
                """, "Informe os campos obrigatórios: Colunas.");
        assertViolation("""
                { "name": "Sem colunas", "period": "CURRENT_MONTH" }
                """, "columns", "Escolha ao menos uma coluna.");
        assertBadRequest("""
                { "name": "Coluna errada", "period": "CURRENT_MONTH", "columns": ["DATE", "BALANCE"] }
                """, "A coluna informada é inválida.");
        assertBadRequest("""
                { "name": "Coluna repetida", "period": "CURRENT_MONTH", "columns": ["DATE", "DATE"] }
                """, "A mesma coluna não pode ser escolhida duas vezes.");
        assertBadRequest("""
                { "name": "Sem período", "columns": ["DATE"] }
                """, "Informe os campos obrigatórios: Período.");
        assertBadRequest("""
                { "name": "Período errado", "period": "NEXT_MONTH", "columns": ["DATE"] }
                """, "O período informado é inválido.");
        assertBadRequest("""
                { "name": "Datas", "period": "CUSTOM", "startDate": "2026-10-31", "endDate": "2026-10-01",
                  "columns": ["DATE"] }
                """, "A data inicial não pode ser posterior à data final.");
        assertBadRequest("""
                { "name": "Sem datas", "period": "CUSTOM", "columns": ["DATE"] }
                """, "Informe a data inicial e a data final do período personalizado.");
        assertBadRequest("""
                { "name": "Valores", "period": "CURRENT_MONTH", "minAmount": 5, "maxAmount": 1, "columns": ["DATE"] }
                """, "O valor mínimo não pode ser maior que o valor máximo.");
        assertBadRequest("""
                { "name": "Negativo", "period": "CURRENT_MONTH", "minAmount": -1, "columns": ["DATE"] }
                """, "O valor mínimo não pode ser negativo.");
        assertBadRequest("""
                { "name": "Agrupamento", "period": "CURRENT_MONTH", "groupBy": ["MONTH", "MONTH"], "columns": ["DATE"] }
                """, "O agrupamento não pode repetir o mesmo campo.");
        assertBadRequest("""
                { "name": "Tipo", "period": "CURRENT_MONTH", "type": "XYZ", "columns": ["DATE"] }
                """, "O tipo informado é inválido.");
        assertBadRequest("""
                { "name": "Categoria", "period": "CURRENT_MONTH", "categoryIds": ["%s"], "columns": ["DATE"] }
                """.formatted(UUID.randomUUID()), "Categoria informada não existe.");

        given()
                .when().get(PATH)
                .then()
                .statusCode(200)
                .body("size()", equalTo(0));
    }

    @Test
    void shouldDropDeletedCategoryAndKeepInactiveOne() {
        UUID deleted = category("Excluída", true);
        UUID inactive = category("Inativa", false);
        create("""
                { "name": "Categorias", "period": "CURRENT_MONTH", "categoryIds": ["%s", "%s"], "columns": ["DATE"] }
                """.formatted(deleted, inactive));

        given()
                .when().delete("/categories/{id}", deleted)
                .then()
                .statusCode(204);

        given()
                .when().get(PATH)
                .then()
                .statusCode(200)
                .body("[0].categoryIds", equalTo(List.of(inactive.toString())));

        QuarkusTransaction.requiringNew().run(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = UUID.fromString(USER_ID);
            transaction.categoryId = inactive;
            transaction.transactionDate = LocalDate.of(2026, 10, 3);
            transaction.description = "Teste preferência inativa";
            transaction.amount = new BigDecimal("12.00");
            transaction.type = TransactionType.EXPENSE;
            transaction.status = TransactionStatus.PAID;
            transaction.source = TransactionSource.MANUAL;
            transactionRepository.persist(transaction);
        });

        given()
                .queryParam("categoryId", inactive.toString())
                .when().get("/transaction-reports")
                .then()
                .statusCode(200)
                .body("transactionCount", equalTo(1))
                .body("rows[0].categoryName", equalTo(CATEGORY_PREFIX + "Inativa"));
    }

    @Test
    void shouldAuditEveryWriteWithTheNameAsLabel() {
        UUID food = category("Alimentação", true);
        String id = create("""
                { "name": "Auditada", "period": "CURRENT_MONTH", "categoryIds": ["%s"],
                  "groupBy": ["CATEGORY", "MONTH"], "columns": ["DATE", "AMOUNT"], "maxAmount": 200 }
                """.formatted(food));

        given()
                .contentType(ContentType.JSON)
                .body(body("Auditada nova", true))
                .when().put(PATH + "/{id}", id)
                .then()
                .statusCode(200);

        given()
                .when().delete(PATH + "/{id}", id)
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(List.of("CREATE", "UPDATE", "DELETE"), entries.stream().map(AuditProbe.Entry::action).toList());
        entries.forEach(entry -> {
            assertEquals("CHANGE", entry.type());
            assertEquals("TRANSACTION_REPORTS", entry.screen());
        });
        assertEquals(List.of("Auditada", "Auditada nova", "Auditada nova"),
                entries.stream().map(AuditProbe.Entry::recordLabel).toList());

        AuditProbe.Entry created = entries.get(0);
        assertEquals(Arrays.asList(null, "Mês atual"), created.changes().get("Período"));
        assertEquals(Arrays.asList(null, CATEGORY_PREFIX + "Alimentação"), created.changes().get("Categorias"));
        assertEquals(Arrays.asList(null, "Categoria > Mês"), created.changes().get("Agrupamento"));
        assertEquals(Arrays.asList(null, "Data, Valor"), created.changes().get("Colunas"));
        assertEquals(Arrays.asList(null, "R$ 200,00"), created.changes().get("Valor máximo"));

        AuditProbe.Entry updated = entries.get(1);
        assertEquals(List.of("Auditada", "Auditada nova"), updated.changes().get("Nome"));
        assertEquals(List.of("Não", "Sim"), updated.changes().get("Padrão"));
        assertTrue(!updated.changes().containsKey("Período"), "Período não mudou");

        assertEquals(0, QuarkusTransaction.requiringNew().call(() -> repository.count("id", UUID.fromString(id))));
    }

    private void fixToday(LocalDate today) {
        QuarkusMock.installMockForType(new TransactionReportResourceTest.FixedCurrentDate(today), CurrentDate.class);
    }

    private static String body(String name, boolean defaultPreference) {
        return """
                { "name": "%s", "defaultPreference": %s, "period": "CURRENT_MONTH",
                  "columns": ["DATE", "DESCRIPTION", "CATEGORY", "TYPE", "STATUS", "AMOUNT"] }
                """.formatted(name, defaultPreference);
    }

    private static String create(String payload) {
        return given()
                .contentType(ContentType.JSON)
                .body(payload)
                .when().post(PATH)
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private static void assertBadRequest(String payload, String message) {
        given()
                .contentType(ContentType.JSON)
                .body(payload)
                .when().post(PATH)
                .then()
                .statusCode(400)
                .body("message", equalTo(message));
    }

    private static void assertViolation(String payload, String field, String message) {
        given()
                .contentType(ContentType.JSON)
                .body(payload)
                .when().post(PATH)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.%s') }.message".formatted(field), equalTo(message));
    }

    private UUID createForOtherUser(String name) {
        return QuarkusTransaction.requiringNew().call(() -> {
            TransactionReportPreference preference = new TransactionReportPreference();
            preference.userId = UUID.fromString(OTHER_ID);
            preference.name = name;
            preference.period = ReportPeriod.CURRENT_MONTH;
            preference.reportColumns(ReportColumn.DEFAULTS);
            repository.persist(preference);
            return preference.id;
        });
    }

    private UUID category(String name, boolean active) {
        return QuarkusTransaction.requiringNew().call(() -> {
            Category category = new Category();
            category.name = CATEGORY_PREFIX + name;
            category.type = CategoryType.EXPENSE;
            category.active = active;
            categoryRepository.persist(category);
            return category.id;
        });
    }
}
