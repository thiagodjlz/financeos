package br.com.financeos.releasenotes;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;

import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class ReleaseNotesResourceTest {

    @Test
    void shouldReturnReleaseNotesForAllowedUser() {
        given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .body("currentVersion", matchesPattern("\\d+\\.\\d+\\.\\d+"))
                .body("versions", hasSize(1))
                .body("versions[0].version", equalTo("1.0.2"));
    }

    @Test
    void shouldListTheBackToTopButtonAmongThe102Improvements() {
        given()
                .when().get("/release-notes")
                .then()
                .statusCode(200)
                .body("versions[0].version", equalTo("1.0.2"))
                .body("versions[0].categories.find { it.kind == 'IMPROVEMENT' }.items",
                        hasItem(containsString("Voltar ao topo")));
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
}
