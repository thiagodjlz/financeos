package br.com.financeos.releasenotes;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import jakarta.inject.Inject;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class ReleaseNotesResourceTest {

    private static final String V102 = "versions.find { it.version == '1.0.2' }";

    @Inject
    ObjectMapper objectMapper;

    @Test
    void shouldReturnReleaseNotesForAllowedUser() {
        given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .body("currentVersion", matchesPattern("\\d+\\.\\d+\\.\\d+"))
                .body("versions.version", hasItem("1.0.2"))
                .body(V102 + ".version", equalTo("1.0.2"));
    }

    @Test
    void shouldNotListTheBackToTopButtonAmongThe102Improvements() {
        given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .body(V102 + ".version", equalTo("1.0.2"))
                .body(V102 + ".categories.find { it.kind == 'IMPROVEMENT' }.items",
                        not(hasItem(containsString("Voltar ao topo"))));
    }

    @Test
    void shouldMatchCurrentVersionWithTheNewestBlock() {
        String currentVersion = given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .extract()
                .path("currentVersion");

        given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .body("versions[0].version", equalTo(currentVersion));
    }

    @Test
    void shouldSerializeAVersionWithoutCategoriesAsAnEmptyList() throws Exception {
        ReleaseNotesResponse response = new ReleaseNotesResponse("9.9.9",
                List.of(new ReleaseNoteVersion("9.9.9", List.of())));

        JsonNode categories = objectMapper.readTree(objectMapper.writeValueAsString(response))
                .path("versions").path(0).path("categories");

        assertTrue(categories.isArray(), "categories deveria ser uma lista, veio: " + categories);
        assertEquals(0, categories.size());
    }

    @Test
    void shouldAlwaysReturnTheCategoriesListOfEveryVersion() {
        given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .body("versions.categories", everyItem(notNullValue()));
    }
}
