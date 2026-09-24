package br.com.financeos.transactions;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.financeos.categories.Category;
import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.categories.CategoryType;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class TransactionResourceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Inject
    TransactionRepository repository;

    @Inject
    CategoryRepository categoryRepository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("description like ?1", "Teste mercado%");
        categoryRepository.delete("name like ?1", "Teste TX Categoria%");
    }

    Category createCategory(CategoryType type, boolean active) {
        return QuarkusTransaction.requiringNew().call(() -> {
            Category category = new Category();
            category.name = "Teste TX Categoria " + UUID.randomUUID();
            category.type = type;
            category.active = active;
            categoryRepository.persist(category);
            return category;
        });
    }

    void deactivateCategory(UUID id) {
        QuarkusTransaction.requiringNew().run(
                () -> categoryRepository.findByIdOptional(id).ifPresent(category -> category.active = false));
    }

    @Test
    void shouldCreateListUpdateAndCancelTransaction() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado semanal",
                          "amount": 145.90,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s",
                          "notes": "Compra de teste"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("description", equalTo("Teste mercado semanal"))
                .body("amount", equalTo(145.90F))
                .body("type", equalTo("EXPENSE"))
                .body("status", equalTo("PENDING"))
                .body("source", equalTo("MANUAL"))
                .body("createdAt", notNullValue())
                .body("updatedAt", notNullValue())
                .extract()
                .path("id");

        given()
                .queryParam("type", "EXPENSE")
                .queryParam("status", "PENDING")
                .queryParam("startDate", "2026-06-01")
                .queryParam("endDate", "2026-06-30")
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("items.size()", greaterThanOrEqualTo(1))
                .body("totalItems", greaterThanOrEqualTo(1));

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado semanal atualizado",
                          "amount": 200.00,
                          "type": "EXPENSE",
                          "status": "PAID",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().put("/transactions/{id}", id)
                .then()
                .statusCode(200)
                .body("description", equalTo("Teste mercado semanal atualizado"))
                .body("amount", equalTo(200.00F))
                .body("status", equalTo("PAID"));

        given()
                .when().delete("/transactions/{id}", id)
                .then()
                .statusCode(204);

        given()
                .when().get("/transactions/{id}", id)
                .then()
                .statusCode(200)
                .body("status", equalTo("CANCELED"));
    }

    @Test
    void shouldRejectNonexistentCategory() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado categoria inexistente",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("message", equalTo("Categoria informada não existe."));
    }

    @Test
    void shouldRejectCategoryOfDifferentType() {
        Category incomeCategory = createCategory(CategoryType.INCOME, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado tipo incompativel",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(incomeCategory.id))
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("message", equalTo("A categoria deve ser do mesmo tipo do lançamento."));
    }

    @Test
    void shouldRejectInactiveCategoryOnCreate() {
        Category inactiveCategory = createCategory(CategoryType.EXPENSE, false);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado categoria inativa",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(inactiveCategory.id))
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("message", equalTo("Categoria inativa não pode ser selecionada."));
    }

    @Test
    void shouldKeepInactiveCategoryAlreadyLinkedOnUpdate() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado categoria mantida",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        deactivateCategory(category.id);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado categoria mantida editada",
                          "amount": 20.00,
                          "type": "EXPENSE",
                          "status": "PAID",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().put("/transactions/{id}", id)
                .then()
                .statusCode(200)
                .body("categoryId", equalTo(category.id.toString()));
    }

    @Test
    void shouldRejectCanceledStatusOnCreate() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado cancelado direto",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "CANCELED",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("message",
                        equalTo("O status Cancelado só pode ser aplicado pelo cancelamento do lançamento."));
    }

    @Test
    void shouldRejectInvalidTransaction() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "",
                          "amount": 0,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldRequireCategoryOnCreateAndUpdate() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado sem categoria",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING"
                        }
                        """)
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.categoryId') }.message",
                        equalTo("A categoria é obrigatória."))
                .body("message", equalTo("Informe os campos obrigatórios: Categoria."));

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado com categoria",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado com categoria editado",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "PENDING"
                        }
                        """)
                .when().put("/transactions/{id}", id)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.categoryId') }.message",
                        equalTo("A categoria é obrigatória."))
                .body("message", equalTo("Informe os campos obrigatórios: Categoria."));
    }

    @Test
    void shouldRequireStatusForExpense() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado despesa sem status",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("message", equalTo("O status é obrigatório."));
    }

    @Test
    void shouldKeepNullStatusForIncome() {
        Category category = createCategory(CategoryType.INCOME, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado receita sem status",
                          "amount": 10.00,
                          "type": "INCOME",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(201)
                .body("status", nullValue());
    }

    @Test
    void shouldNameAllMissingFields() {
        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("message",
                        equalTo("Informe os campos obrigatórios: Descrição, Valor, Data, Tipo, Categoria."));
    }

    @Test
    void shouldReturnAggregatedMessageNamingMissingFields() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "type": "EXPENSE"
                        }
                        """)
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.description') }.message",
                        equalTo("A descrição é obrigatória."))
                .body("violations.find { it.field.endsWith('.amount') }.message",
                        equalTo("O valor é obrigatório."))
                .body("message", equalTo("Informe os campos obrigatórios: Descrição, Valor, Categoria."));
    }

    @Test
    void shouldReturnLimitMessageForAmountBelowMinimum() {
        Category category = createCategory(CategoryType.EXPENSE, true);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado valor zero",
                          "amount": 0,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "categoryId": "%s"
                        }
                        """.formatted(category.id))
                .when().post("/transactions")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.amount') }.message",
                        equalTo("O valor deve ser maior que zero."))
                .body("message", equalTo("O valor deve ser maior que zero."));
    }

    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");

    private void createTransaction(UUID userId, String description, LocalDate date, TransactionType type,
            TransactionStatus status, UUID categoryId) {
        QuarkusTransaction.requiringNew().run(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = userId;
            transaction.description = description;
            transaction.transactionDate = date;
            transaction.amount = new BigDecimal("10.00");
            transaction.type = type;
            transaction.status = status;
            transaction.categoryId = categoryId;
            repository.persist(transaction);
        });
    }

    @Test
    void shouldPaginateTransactionsWithTotals() {
        String prefix = "Teste mercado pagina " + UUID.randomUUID();
        for (int day = 1; day <= 11; day++) {
            createTransaction(TEST_USER_ID, prefix + " %02d".formatted(day), LocalDate.of(2026, 5, day),
                    TransactionType.EXPENSE, TransactionStatus.PENDING, null);
        }

        given()
                .queryParam("description", prefix)
                .queryParam("size", 10)
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("items.size()", equalTo(10))
                .body("items[0].description", equalTo(prefix + " 11"))
                .body("totalItems", equalTo(11))
                .body("totalPages", equalTo(2));

        given()
                .queryParam("description", prefix)
                .queryParam("page", 2)
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("items.size()", equalTo(1))
                .body("items[0].description", equalTo(prefix + " 01"))
                .body("totalItems", equalTo(11))
                .body("totalPages", equalTo(2));

        given()
                .queryParam("description", prefix)
                .queryParam("page", 5)
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("items.size()", equalTo(0))
                .body("totalItems", equalTo(11))
                .body("totalPages", equalTo(2));
    }

    @Test
    void shouldCombineFiltersWithAnd() {
        String prefix = "Teste mercado filtro " + UUID.randomUUID();
        Category category = createCategory(CategoryType.EXPENSE, true);
        createTransaction(TEST_USER_ID, prefix + " alvo", LocalDate.of(2026, 3, 10),
                TransactionType.EXPENSE, TransactionStatus.PAID, category.id);
        createTransaction(TEST_USER_ID, prefix + " pendente", LocalDate.of(2026, 3, 10),
                TransactionType.EXPENSE, TransactionStatus.PENDING, category.id);
        createTransaction(TEST_USER_ID, prefix + " fora do periodo", LocalDate.of(2026, 4, 10),
                TransactionType.EXPENSE, TransactionStatus.PAID, category.id);
        createTransaction(TEST_USER_ID, prefix + " sem categoria", LocalDate.of(2026, 3, 10),
                TransactionType.EXPENSE, TransactionStatus.PAID, null);

        given()
                .queryParam("description", prefix)
                .queryParam("categoryId", category.id)
                .queryParam("status", "PAID")
                .queryParam("startDate", "2026-03-01")
                .queryParam("endDate", "2026-03-31")
                .queryParam("type", "EXPENSE")
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(1))
                .body("items[0].description", equalTo(prefix + " alvo"));
    }

    @Test
    void shouldSearchDescriptionIgnoringCaseAndAccents() {
        String suffix = UUID.randomUUID().toString();
        createTransaction(TEST_USER_ID, "Teste mercado Açaí " + suffix, LocalDate.of(2026, 2, 1),
                TransactionType.EXPENSE, TransactionStatus.PENDING, null);

        given()
                .queryParam("description", "MERCADO acai " + suffix)
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(1))
                .body("items[0].description", equalTo("Teste mercado Açaí " + suffix));
    }

    @Test
    void shouldListOnlyTransactionsOfTheLoggedUser() {
        String prefix = "Teste mercado escopo " + UUID.randomUUID();
        createTransaction(TEST_USER_ID, prefix + " meu", LocalDate.of(2026, 2, 1),
                TransactionType.EXPENSE, TransactionStatus.PENDING, null);
        createTransaction(OTHER_USER_ID, prefix + " de outro", LocalDate.of(2026, 2, 1),
                TransactionType.EXPENSE, TransactionStatus.PENDING, null);

        given()
                .queryParam("description", prefix)
                .when().get("/transactions")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(1))
                .body("items.description", not(hasItem(prefix + " de outro")));
    }

    @Test
    void shouldRejectMalformedFiltersInPortuguese() {
        assertBadListRequest("status", "XYZ", "O status informado é inválido.");
        assertBadListRequest("type", "OUTRO", "O tipo informado é inválido.");
        assertBadListRequest("startDate", "abc", "A data inicial informada é inválida.");
        assertBadListRequest("endDate", "2026-02-30", "A data final informada é inválida.");
        assertBadListRequest("categoryId", "nao-e-uuid", "A categoria informada é inválida.");
        assertBadListRequest("size", "11", "O tamanho da página deve ser um número entre 1 e 10.");
        assertBadListRequest("page", "x", "A página deve ser um número inteiro maior ou igual a 1.");
    }

    private static void assertBadListRequest(String param, String value, String message) {
        given()
                .queryParam(param, value)
                .when().get("/transactions")
                .then()
                .statusCode(400)
                .body("message", equalTo(message));
    }
}
