package br.com.financeos.documentation;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;

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
class DocumentationResourceTest {

    @Test
    void shouldReturnDocumentationForAllowedUser() {
        given()
                .when().get("/documentation")
                .then()
                .statusCode(200)
                .body("title", notNullValue())
                .body("introduction.title", equalTo("Como utilizar o sistema"))
                .body("areas", hasSize(5))
                .body("areas.title", contains("Resumo", "Lançamentos", "Categorias", "Usuários", "Perfis"));
    }
}
