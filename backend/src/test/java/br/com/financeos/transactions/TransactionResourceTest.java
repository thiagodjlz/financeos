package br.com.financeos.transactions;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

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
        repository.delete("userId = ?1 and description like ?2", TEST_USER_ID, "Teste mercado%");
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
        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado semanal",
                          "amount": 145.90,
                          "type": "EXPENSE",
                          "status": "PENDING",
                          "notes": "Compra de teste"
                        }
                        """)
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
                .body("size()", greaterThanOrEqualTo(1));

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado semanal atualizado",
                          "amount": 200.00,
                          "type": "EXPENSE",
                          "status": "PAID"
                        }
                        """)
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
                          "categoryId": "%s"
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/transactions")
                .then()
                .statusCode(400);
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
                          "categoryId": "%s"
                        }
                        """.formatted(incomeCategory.id))
                .when().post("/transactions")
                .then()
                .statusCode(400);
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
                          "categoryId": "%s"
                        }
                        """.formatted(inactiveCategory.id))
                .when().post("/transactions")
                .then()
                .statusCode(400);
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
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "Teste mercado cancelado direto",
                          "amount": 10.00,
                          "type": "EXPENSE",
                          "status": "CANCELED"
                        }
                        """)
                .when().post("/transactions")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldRejectInvalidTransaction() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "2026-06-30",
                          "description": "",
                          "amount": 0,
                          "type": "EXPENSE"
                        }
                        """)
                .when().post("/transactions")
                .then()
                .statusCode(400);
    }
}
