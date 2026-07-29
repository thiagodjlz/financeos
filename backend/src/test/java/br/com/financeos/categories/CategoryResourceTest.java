package br.com.financeos.categories;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.startsWith;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

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

    @Inject
    CategoryRepository repository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("name like ?1", "Teste Lazer%");
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
    void shouldCreateUpdateAndDeactivateCategory() {
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
                .body("name", org.hamcrest.Matchers.hasItem(categoryName));
    }
}
