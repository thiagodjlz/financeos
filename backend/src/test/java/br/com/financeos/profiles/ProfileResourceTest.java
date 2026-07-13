package br.com.financeos.profiles;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;

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
class ProfileResourceTest {

    @Inject
    ProfileRepository repository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("name like ?1", "Teste Perfil%");
    }

    @Test
    void shouldCreateProfileWithPermissions() {
        String profileName = "Teste Perfil " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "permissions": [
                            { "screen": "DASHBOARD", "canView": true }
                          ]
                        }
                        """.formatted(profileName))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo(profileName));
    }

    @Test
    void shouldRejectPermissionWithoutScreen() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Perfil %s",
                          "permissions": [
                            { "canView": true }
                          ]
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldRejectDuplicateScreensInPermissions() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Perfil %s",
                          "permissions": [
                            { "screen": "DASHBOARD", "canView": true },
                            { "screen": "DASHBOARD", "canView": false }
                          ]
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(400);
    }
}
