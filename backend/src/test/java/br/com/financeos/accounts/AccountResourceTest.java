package br.com.financeos.accounts;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

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
class AccountResourceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Inject
    AccountRepository repository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("userId = ?1 and name like ?2", TEST_USER_ID, "Teste Conta%");
    }

    @Test
    void shouldCreateUpdateListAndDeactivateAccount() {
        String accountName = "Teste Conta " + UUID.randomUUID();
        String updatedName = "Teste Conta Atualizada " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "CHECKING",
                          "initialBalance": 100.50
                        }
                        """.formatted(accountName))
                .when().post("/accounts")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo(accountName))
                .body("type", equalTo("CHECKING"))
                .body("initialBalance", equalTo(100.50F))
                .body("active", equalTo(true))
                .extract()
                .path("id");

        given()
                .queryParam("type", "CHECKING")
                .when().get("/accounts")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "SAVINGS",
                          "initialBalance": 250.00
                        }
                        """.formatted(updatedName))
                .when().put("/accounts/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo(updatedName))
                .body("type", equalTo("SAVINGS"))
                .body("initialBalance", equalTo(250.00F));

        given()
                .when().delete("/accounts/{id}", id)
                .then()
                .statusCode(204);

        given()
                .when().get("/accounts/{id}", id)
                .then()
                .statusCode(404);
    }
}
