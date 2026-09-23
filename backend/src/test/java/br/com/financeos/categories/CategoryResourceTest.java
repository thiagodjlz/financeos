package br.com.financeos.categories;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionRepository;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class CategoryResourceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final String USAGE_PREFIX = "Teste exclusao categoria";

    @Inject
    CategoryRepository repository;

    @Inject
    TransactionRepository transactionRepository;

    @AfterEach
    @Transactional
    void cleanup() {
        transactionRepository.delete("description like ?1", USAGE_PREFIX + "%");
        repository.getEntityManager()
                .createNativeQuery("delete from planning_items where title like ?1")
                .setParameter(1, USAGE_PREFIX + "%")
                .executeUpdate();
        repository.delete("name like ?1", "Teste Lazer%");
    }

    private Category createCategory(boolean active, UUID parentId) {
        return QuarkusTransaction.requiringNew().call(() -> {
            Category category = new Category();
            category.name = "Teste Lazer Exclusao " + UUID.randomUUID();
            category.type = CategoryType.EXPENSE;
            category.color = "#F59E0B";
            category.active = active;
            category.parentId = parentId;
            repository.persist(category);
            return category;
        });
    }

    private UUID createTransaction(UUID userId, UUID categoryId, TransactionStatus status) {
        return QuarkusTransaction.requiringNew().call(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = userId;
            transaction.categoryId = categoryId;
            transaction.transactionDate = LocalDate.of(2026, 9, 1);
            transaction.description = USAGE_PREFIX + " " + UUID.randomUUID();
            transaction.amount = new BigDecimal("10.00");
            transaction.type = TransactionType.EXPENSE;
            transaction.status = status;
            transactionRepository.persist(transaction);
            return transaction.id;
        });
    }

    // planning_items nao tem entidade JPA: a tabela e legada e so existe no schema.
    private UUID createPlanningItem(UUID categoryId) {
        UUID id = UUID.randomUUID();
        QuarkusTransaction.requiringNew().run(() -> repository.getEntityManager()
                .createNativeQuery("""
                        insert into planning_items (id, user_id, category_id, title)
                        values (cast(?1 as uuid), cast(?2 as uuid), cast(?3 as uuid), ?4)
                        """)
                .setParameter(1, id.toString())
                .setParameter(2, TEST_USER_ID.toString())
                .setParameter(3, categoryId.toString())
                .setParameter(4, USAGE_PREFIX + " " + id)
                .executeUpdate());
        return id;
    }

    private Object planningItemCategory(UUID planningItemId) {
        return QuarkusTransaction.requiringNew().call(() -> repository.getEntityManager()
                .createNativeQuery("select cast(category_id as varchar) from planning_items where id = cast(?1 as uuid)")
                .setParameter(1, planningItemId.toString())
                .getSingleResult());
    }

    private Category findCategory(UUID id) {
        return QuarkusTransaction.requiringNew().call(() -> repository.findByIdOptional(id).orElse(null));
    }

    private List<FinancialTransaction> findTransactions(List<UUID> ids) {
        return QuarkusTransaction.requiringNew().call(() -> transactionRepository.list("id in ?1", ids));
    }

    @Test
    void shouldListSeededCategories() {
        given()
                .when().get("/categories")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(11));
    }

    @Test
    void shouldCreateUpdateAndDeleteCategory() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();
        String updatedName = "Teste Lazer Familia " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo(categoryName))
                .body("type", equalTo("EXPENSE"))
                .body("active", equalTo(true))
                .body("createdAt", notNullValue())
                .body("updatedAt", notNullValue())
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F97316",
                          "active": true
                        }
                        """.formatted(updatedName))
                .when().put("/categories/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo(updatedName))
                .body("color", equalTo("#F97316"));

        given()
                .when().delete("/categories/{id}", id)
                .then()
                .statusCode(204);

        given()
                .when().get("/categories/{id}", id)
                .then()
                .statusCode(404);

        assertNull(findCategory(UUID.fromString(id)));
        given()
                .when().get("/categories")
                .then()
                .statusCode(200)
                .body("id", not(hasItem(id)));
    }

    @Test
    void shouldDeleteInactiveCategoryWithoutTransactions() {
        Category category = createCategory(false, null);

        given()
                .when().delete("/categories/{id}", category.id)
                .then()
                .statusCode(204);

        assertNull(findCategory(category.id));
        given()
                .when().get("/categories")
                .then()
                .statusCode(200)
                .body("id", not(hasItem(category.id.toString())));
    }

    @Test
    void shouldReturnNotFoundWhenDeletingUnknownCategory() {
        given()
                .when().delete("/categories/{id}", UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void shouldBlockDeletingInactiveCategoryInUse() {
        Category category = createCategory(false, null);
        createTransaction(TEST_USER_ID, category.id, TransactionStatus.PAID);

        given()
                .when().delete("/categories/{id}", category.id)
                .then()
                .statusCode(409)
                .body("message", equalTo("""
                        Não é possível excluir a categoria. Ela está em uso em:
                        Lançamentos: 1 registro"""));

        Category stored = findCategory(category.id);
        assertNotNull(stored);
        assertFalse(stored.active);
    }

    @Test
    void shouldBlockDeletingCategoryInUseKeepingCategoryAndTransactions() {
        Category category = createCategory(true, null);
        List<UUID> transactionIds = List.of(
                createTransaction(TEST_USER_ID, category.id, TransactionStatus.PENDING),
                createTransaction(TEST_USER_ID, category.id, TransactionStatus.PAID),
                createTransaction(TEST_USER_ID, category.id, TransactionStatus.PENDING));

        given()
                .when().delete("/categories/{id}", category.id)
                .then()
                .statusCode(409)
                .body("message", startsWith("Não é possível excluir a categoria."))
                .body("message", containsString("Lançamentos: 3 registros"));

        Category stored = findCategory(category.id);
        assertNotNull(stored);
        assertTrue(stored.active);
        assertEquals(category.name, stored.name);

        List<FinancialTransaction> transactions = findTransactions(transactionIds);
        assertEquals(3, transactions.size());
        transactions.forEach(transaction -> assertEquals(category.id, transaction.categoryId));
    }

    @Test
    void shouldCountTransactionsOfEveryUserAndStatus() {
        Category category = createCategory(true, null);
        createTransaction(TEST_USER_ID, category.id, TransactionStatus.PAID);
        createTransaction(TEST_USER_ID, category.id, TransactionStatus.CANCELED);
        UUID otherUserTransactionId = createTransaction(OTHER_USER_ID, category.id, TransactionStatus.PENDING);
        String otherUserDescription = findTransactions(List.of(otherUserTransactionId)).get(0).description;

        String message = given()
                .when().delete("/categories/{id}", category.id)
                .then()
                .statusCode(409)
                .extract()
                .path("message");

        assertEquals("""
                Não é possível excluir a categoria. Ela está em uso em:
                Lançamentos: 3 registros""", message);
        for (String privateData : List.of(otherUserDescription, USAGE_PREFIX, "System Owner",
                "owner@financeos.internal", "dev@financeos.local")) {
            assertFalse(message.contains(privateData), privateData);
        }
        assertNotNull(findCategory(category.id));
    }

    @Test
    void shouldDeleteCategoryDetachingSubcategoryAndPlanningItems() {
        Category category = createCategory(true, null);
        Category subcategory = createCategory(true, category.id);
        UUID planningItemId = createPlanningItem(category.id);

        given()
                .when().delete("/categories/{id}", category.id)
                .then()
                .statusCode(204);

        assertNull(findCategory(category.id));
        Category storedSubcategory = findCategory(subcategory.id);
        assertNotNull(storedSubcategory);
        assertNull(storedSubcategory.parentId);
        assertNull(planningItemCategory(planningItemId));
    }

    @Test
    void shouldNotExposeIconInResponses() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .body("$", not(hasKey("icon")))
                .extract()
                .path("id");

        given()
                .when().get("/categories")
                .then()
                .statusCode(200)
                .body("[0]", not(hasKey("icon")));

        given()
                .when().get("/categories/{id}", id)
                .then()
                .statusCode(200)
                .body("$", not(hasKey("icon")));
    }

    @Test
    void shouldIgnoreUnknownIconProperty() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true,
                          "icon": "gamepad-2"
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .body("name", equalTo(categoryName))
                .body("$", not(hasKey("icon")));
    }

    @Test
    void shouldRejectDuplicateNameAndType() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();
        String body = """
                {
                  "name": "%s",
                  "type": "EXPENSE",
                  "color": "#F59E0B",
                  "active": true
                }
                """.formatted(categoryName);

        given()
                .contentType(ContentType.JSON)
                .body(body)
                .when().post("/categories")
                .then()
                .statusCode(201);

        given()
                .contentType(ContentType.JSON)
                .body(body)
                .when().post("/categories")
                .then()
                .statusCode(409)
                .body("message", equalTo("Já existe uma categoria com esse nome e tipo."));
    }

    @Test
    void shouldReturnMessageNamingTheFieldWhenNameIsMissing() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE"
                        }
                        """)
                .when().post("/categories")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome é obrigatório."))
                .body("message", equalTo("Informe os campos obrigatórios: Nome, Cor, Situação."));
    }

    @Test
    void shouldRequireType() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Lazer %s",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/categories")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.type') }.message",
                        equalTo("O tipo é obrigatório."))
                .body("message", equalTo("Informe os campos obrigatórios: Tipo."));
    }

    @Test
    void shouldRequireColor() {
        String missing = """
                {
                  "name": "Teste Lazer %s",
                  "type": "EXPENSE",
                  "active": true
                }
                """.formatted(UUID.randomUUID());

        String explicitNull = """
                {
                  "name": "Teste Lazer %s",
                  "type": "EXPENSE",
                  "color": null,
                  "active": true
                }
                """.formatted(UUID.randomUUID());

        String blank = """
                {
                  "name": "Teste Lazer %s",
                  "type": "EXPENSE",
                  "color": "   ",
                  "active": true
                }
                """.formatted(UUID.randomUUID());

        for (String body : new String[] { missing, explicitNull, blank }) {
            given()
                    .contentType(ContentType.JSON)
                    .body(body)
                    .when().post("/categories")
                    .then()
                    .statusCode(400)
                    .body("violations.find { it.field.endsWith('.color') }.message",
                            equalTo("A cor é obrigatória."))
                    .body("message", equalTo("Informe os campos obrigatórios: Cor."));
        }
    }

    @Test
    void shouldRequireActive() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Lazer %s",
                          "type": "EXPENSE",
                          "color": "#F59E0B"
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/categories")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.active') }.message",
                        equalTo("A situação é obrigatória."))
                .body("message", equalTo("Informe os campos obrigatórios: Situação."));
    }

    @Test
    void shouldApplyRequiredFieldsOnUpdate() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE"
                        }
                        """)
                .when().put("/categories/{id}", id)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome é obrigatório."))
                .body("violations.find { it.field.endsWith('.color') }.message",
                        equalTo("A cor é obrigatória."))
                .body("violations.find { it.field.endsWith('.active') }.message",
                        equalTo("A situação é obrigatória."))
                .body("message", equalTo("Informe os campos obrigatórios: Nome, Cor, Situação."));
    }

    @Test
    void shouldReturnOnlyPortugueseValidationMessages() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "color": "   "
                        }
                        """)
                .when().post("/categories")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message", startsWith("O nome"))
                .body("violations.find { it.field.endsWith('.type') }.message", startsWith("O tipo"))
                .body("violations.find { it.field.endsWith('.color') }.message", startsWith("A cor"))
                .body("violations.find { it.field.endsWith('.active') }.message", startsWith("A situação"))
                .body("message", startsWith("Informe os campos obrigatórios:"));
    }

    @Test
    void shouldAllowSameNameWithDifferentType() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "INCOME",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201);
    }

    @Test
    void shouldRejectNonexistentParent() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Lazer %s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true,
                          "parentId": "%s"
                        }
                        """.formatted(UUID.randomUUID(), UUID.randomUUID()))
                .when().post("/categories")
                .then()
                .statusCode(400)
                .body("message", equalTo("Categoria pai informada não existe."));
    }

    @Test
    void shouldRejectCategoryAsItsOwnParent() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true,
                          "parentId": "%s"
                        }
                        """.formatted(categoryName, id))
                .when().put("/categories/{id}", id)
                .then()
                .statusCode(400)
                .body("message", equalTo("Uma categoria não pode ser pai dela mesma."));
    }

    @Test
    void shouldCreateInactiveCategoryWhenActiveIsFalse() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": false
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .body("active", equalTo(false));
    }

    @Test
    void shouldReactivateCategoryViaUpdate() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": false
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": true
                        }
                        """.formatted(categoryName))
                .when().put("/categories/{id}", id)
                .then()
                .statusCode(200)
                .body("active", equalTo(true));
    }

    @Test
    void shouldExcludeInactiveCategoryFromTypeFilterButIncludeInFullList() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
                          "color": "#F59E0B",
                          "active": false
                        }
                        """.formatted(categoryName))
                .when().post("/categories")
                .then()
                .statusCode(201);

        given()
                .when().get("/categories?type=EXPENSE")
                .then()
                .statusCode(200)
                .body("name", org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(categoryName)));

        given()
                .when().get("/categories")
                .then()
                .statusCode(200)
                .body("name", hasItem(categoryName));
    }
}
