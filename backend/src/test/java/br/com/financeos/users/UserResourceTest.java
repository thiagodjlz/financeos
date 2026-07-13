package br.com.financeos.users;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;

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
class UserResourceTest {

    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";

    @Inject
    AppUserRepository repository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("email like ?1", "teste-usuarios-%");
    }

    @Test
    void shouldReturnPortugueseMessageForMalformedEmail() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste",
                          "email": "abc",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("Informe um e-mail valido."));
    }

    @Test
    void shouldReturnPortugueseMessageForPasswordOutOfRange() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste",
                          "email": "teste-usuarios-%s@financeos.local",
                          "password": "123",
                          "profileId": "%s"
                        }
                        """.formatted(UUID.randomUUID(), ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha deve ter entre 8 e 72 caracteres."));
    }

    @Test
    void shouldReturnPortugueseMessagesForBlankRequiredFields() {
        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome e obrigatorio."))
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("O e-mail e obrigatorio."))
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha e obrigatoria."))
                .body("violations.find { it.field.endsWith('.profileId') }.message",
                        equalTo("O perfil e obrigatorio."));
    }

    @Test
    void shouldReturnPortugueseMessagesForOversizedNameAndEmail() {
        String oversizedWellFormedEmail =
                "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(48) + ".com";

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted("a".repeat(121), oversizedWellFormedEmail, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome deve ter no maximo 120 caracteres."))
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("O e-mail deve ter no maximo 180 caracteres."));
    }

    @Test
    void shouldRejectDuplicateEmailOnUpdate() {
        String firstEmail = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";
        String secondEmail = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Um",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(firstEmail, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201);

        String secondId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Dois",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(secondEmail, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Dois",
                          "email": "%s",
                          "profileId": "%s",
                          "active": true
                        }
                        """.formatted(firstEmail, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", secondId)
                .then()
                .statusCode(409);
    }

    @Test
    void shouldAllowKeepingOwnEmailOnUpdate() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Mesmo Email",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Mesmo Email Editado",
                          "email": "%s",
                          "profileId": "%s",
                          "active": true
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Usuario Teste Mesmo Email Editado"));
    }

    @Test
    void shouldRejectNonexistentProfileOnCreate() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Perfil Invalido",
                          "email": "teste-usuarios-%s@financeos.local",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(UUID.randomUUID(), UUID.randomUUID()))
                .when().post("/users")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldReturnPortugueseMessageForShortPasswordOnUpdate() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Update",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Update",
                          "email": "%s",
                          "profileId": "%s",
                          "active": true,
                          "password": "123"
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", id)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha deve ter entre 8 e 72 caracteres."));
    }
}
