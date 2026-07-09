package br.com.financeos.categories;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

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
                          "icon": "gamepad-2"
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
                          "icon": "smile"
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
    void shouldCreateInactiveCategoryWhenActiveIsFalse() {
        String categoryName = "Teste Lazer " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "type": "EXPENSE",
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
