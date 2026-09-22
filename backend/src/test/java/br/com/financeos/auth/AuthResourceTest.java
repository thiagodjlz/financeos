package br.com.financeos.auth;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;

import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;

@QuarkusTest
class AuthResourceTest {

    @Test
    void shouldReturnPortugueseMessagesForEmptyLogin() {
        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .when().post("/auth/login")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("O e-mail é obrigatório."))
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha é obrigatória."))
                .body("message", equalTo("Informe os campos obrigatórios: E-mail, Senha."))
                .body("violations.message.toString()", not(containsString("must not be")));
    }

    @Test
    void shouldReturnPortugueseMessageForInvalidCredentials() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "email": "dev@financeos.local",
                          "password": "senha-que-nao-existe"
                        }
                        """)
                .when().post("/auth/login")
                .then()
                .statusCode(401)
                .body("message", equalTo("Credenciais inválidas."));
    }

    @Test
    void shouldKeepUnauthorizedForRequestWithoutToken() {
        given()
                .when().get("/users")
                .then()
                .statusCode(401);
    }

    @Test
    @TestSecurity(user = "dev@financeos.local")
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
    })
    void shouldListEveryScreenInEffectivePermissions() {
        given()
                .when().get("/auth/me")
                .then()
                .statusCode(200)
                .body("permissions", hasSize(7))
                .body("permissions.screen", hasItem("DOCUMENTATION"))
                .body("permissions.screen", hasItem("RELEASE_NOTES"));
    }
}
