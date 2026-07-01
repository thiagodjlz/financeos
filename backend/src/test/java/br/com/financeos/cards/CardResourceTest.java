package br.com.financeos.cards;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.accounts.AccountRepository;
import br.com.financeos.shared.DevUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
class CardResourceTest {

    @Inject
    CardRepository repository;

    @Inject
    AccountRepository accountRepository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("userId = ?1 and name like ?2", DevUser.ID, "Teste Cartao%");
        accountRepository.delete("userId = ?1 and name like ?2", DevUser.ID, "Teste Conta Cartao%");
    }

    @Test
    void shouldCreateUpdateListAndDeactivateCard() {
        String accountId = createAccount();
        String cardName = "Teste Cartao " + UUID.randomUUID();
        String updatedName = "Teste Cartao Atualizado " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "accountId": "%s",
                          "brand": "Visa",
                          "creditLimit": 3000.00,
                          "closingDay": 10,
                          "dueDay": 20
                        }
                        """.formatted(cardName, accountId))
                .when().post("/cards")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo(cardName))
                .body("accountId", equalTo(accountId))
                .body("brand", equalTo("Visa"))
                .body("creditLimit", equalTo(3000.00F))
                .body("active", equalTo(true))
                .extract()
                .path("id");

        given()
                .when().get("/cards")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "accountId": "%s",
                          "brand": "Mastercard",
                          "creditLimit": 5000.00,
                          "closingDay": 5,
                          "dueDay": 15
                        }
                        """.formatted(updatedName, accountId))
                .when().put("/cards/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo(updatedName))
                .body("brand", equalTo("Mastercard"))
                .body("creditLimit", equalTo(5000.00F));

        given()
                .when().delete("/cards/{id}", id)
                .then()
                .statusCode(204);

        given()
                .when().get("/cards/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    void shouldRejectUnknownAccount() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Cartao sem conta",
                          "accountId": "11111111-1111-1111-1111-111111111111",
                          "creditLimit": 1000.00
                        }
                        """)
                .when().post("/cards")
                .then()
                .statusCode(400);
    }

    private static String createAccount() {
        return given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Conta Cartao %s",
                          "type": "CHECKING",
                          "initialBalance": 0
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/accounts")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }
}
