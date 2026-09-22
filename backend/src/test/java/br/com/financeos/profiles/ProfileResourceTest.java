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

    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";

    private static final String WRITABLE_DOCUMENTATION_BODY = """
            {
              "name": "%s",
              "permissions": [
                {
                  "screen": "DOCUMENTATION",
                  "canView": true,
                  "canCreate": true,
                  "canEdit": true,
                  "canDelete": true
                }
              ]
            }
            """;

    private static final String WRITABLE_RELEASE_NOTES_BODY = """
            {
              "name": "%s",
              "permissions": [
                {
                  "screen": "RELEASE_NOTES",
                  "canView": true,
                  "canCreate": true,
                  "canEdit": true,
                  "canDelete": true
                }
              ]
            }
            """;

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
    void shouldRequireNameOnCreateAndUpdate() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "",
                          "permissions": [
                            { "screen": "DASHBOARD", "canView": true }
                          ]
                        }
                        """)
                .when().post("/profiles")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome é obrigatório."))
                .body("message", equalTo("Informe os campos obrigatórios: Nome."));

        String profileName = "Teste Perfil " + UUID.randomUUID();

        String id = given()
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
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "   ",
                          "permissions": [
                            { "screen": "DASHBOARD", "canView": true }
                          ]
                        }
                        """)
                .when().put("/profiles/{id}", id)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome é obrigatório."))
                .body("message", equalTo("Informe os campos obrigatórios: Nome."));
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
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.screen') }.message",
                        equalTo("A tela é obrigatória."))
                .body("message", equalTo("Informe os campos obrigatórios: Tela."));
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
                .statusCode(400)
                .body("message", equalTo("Tela duplicada nas permissões do perfil."));
    }

    @Test
    void shouldForceDocumentationPermissionToViewOnlyOnCreate() {
        given()
                .contentType(ContentType.JSON)
                .body(WRITABLE_DOCUMENTATION_BODY.formatted("Teste Perfil " + UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canView", equalTo(true))
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canCreate", equalTo(false))
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canEdit", equalTo(false))
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canDelete", equalTo(false));
    }

    @Test
    void shouldForceDocumentationPermissionToViewOnlyOnUpdate() {
        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Perfil %s",
                          "permissions": [
                            { "screen": "DASHBOARD", "canView": true }
                          ]
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body(WRITABLE_DOCUMENTATION_BODY.formatted("Teste Perfil " + UUID.randomUUID()))
                .when().put("/profiles/{id}", id)
                .then()
                .statusCode(200)
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canView", equalTo(true))
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canCreate", equalTo(false))
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canEdit", equalTo(false))
                .body("permissions.find { it.screen == 'DOCUMENTATION' }.canDelete", equalTo(false));

        given()
                .when().get("/profiles")
                .then()
                .statusCode(200)
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'DOCUMENTATION' }.canCreate"
                        .formatted(id), equalTo(false))
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'DOCUMENTATION' }.canEdit"
                        .formatted(id), equalTo(false))
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'DOCUMENTATION' }.canDelete"
                        .formatted(id), equalTo(false))
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'DOCUMENTATION' }.canView"
                        .formatted(id), equalTo(true));
    }

    @Test
    void shouldForceReleaseNotesPermissionToViewOnlyOnCreate() {
        given()
                .contentType(ContentType.JSON)
                .body(WRITABLE_RELEASE_NOTES_BODY.formatted("Teste Perfil " + UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canView", equalTo(true))
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canCreate", equalTo(false))
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canEdit", equalTo(false))
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canDelete", equalTo(false));
    }

    @Test
    void shouldForceReleaseNotesPermissionToViewOnlyOnUpdate() {
        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Perfil %s",
                          "permissions": [
                            { "screen": "DASHBOARD", "canView": true }
                          ]
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body(WRITABLE_RELEASE_NOTES_BODY.formatted("Teste Perfil " + UUID.randomUUID()))
                .when().put("/profiles/{id}", id)
                .then()
                .statusCode(200)
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canView", equalTo(true))
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canCreate", equalTo(false))
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canEdit", equalTo(false))
                .body("permissions.find { it.screen == 'RELEASE_NOTES' }.canDelete", equalTo(false));

        given()
                .when().get("/profiles")
                .then()
                .statusCode(200)
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'RELEASE_NOTES' }.canCreate"
                        .formatted(id), equalTo(false))
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'RELEASE_NOTES' }.canEdit"
                        .formatted(id), equalTo(false))
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'RELEASE_NOTES' }.canDelete"
                        .formatted(id), equalTo(false))
                .body("find { it.id == '%s' }.permissions.find { it.screen == 'RELEASE_NOTES' }.canView"
                        .formatted(id), equalTo(true));
    }

    @Test
    void shouldKeepWriteFlagsForOtherScreens() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Perfil %s",
                          "permissions": [
                            {
                              "screen": "TRANSACTIONS",
                              "canView": true,
                              "canCreate": true,
                              "canEdit": true,
                              "canDelete": true
                            }
                          ]
                        }
                        """.formatted(UUID.randomUUID()))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .body("permissions.find { it.screen == 'TRANSACTIONS' }.canView", equalTo(true))
                .body("permissions.find { it.screen == 'TRANSACTIONS' }.canCreate", equalTo(true))
                .body("permissions.find { it.screen == 'TRANSACTIONS' }.canEdit", equalTo(true))
                .body("permissions.find { it.screen == 'TRANSACTIONS' }.canDelete", equalTo(true));
    }

    @Test
    void shouldRejectDeletingProfileInUse() {
        given()
                .when().delete("/profiles/{id}", ADMIN_PROFILE_ID)
                .then()
                .statusCode(409)
                .body("message", equalTo("Perfil em uso por usuários."));
    }
}
