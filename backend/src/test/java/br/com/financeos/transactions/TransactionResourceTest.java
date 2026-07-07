package br.com.financeos.transactions;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

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

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("userId = ?1 and description like ?2", TEST_USER_ID, "Teste mercado%");
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
