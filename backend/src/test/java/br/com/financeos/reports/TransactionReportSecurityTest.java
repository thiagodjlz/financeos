package br.com.financeos.reports;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.profiles.ProfileRepository;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;

// Sem @TestSecurity de classe: o 401 precisa de requisição sem usuário, e o 403 de um perfil sem a tela.
@QuarkusTest
class TransactionReportSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-000000001145";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-000000001146";
    private static final String RESTRICTED_USER_EMAIL = "teste-relatorios-sem-acesso@financeos.local";

    private static final String SUPER_ADMIN_EMAIL = "owner@financeos.internal";
    private static final String SUPER_ADMIN_ID = "00000000-0000-0000-0000-000000000099";

    private static final String ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";
    private static final String REPORT_PATH = "/transaction-reports";
    private static final String PREFERENCES_PATH = "/transaction-reports/preferences";
    private static final String VALID_BODY = """
            { "name": "Teste segurança", "period": "CURRENT_MONTH", "columns": ["DATE"] }
            """;

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    @BeforeEach
    void createRestrictedUser() {
        QuarkusTransaction.requiringNew().run(() -> {
            profileRepository.getEntityManager()
                    .createNativeQuery("insert into profiles (id, name) values (cast(?1 as uuid), ?2)")
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .setParameter(2, "Teste relatórios sem acesso")
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste relatórios restrito")
                    .setParameter(3, RESTRICTED_USER_EMAIL)
                    .setParameter(4, "$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm")
                    .setParameter(5, RESTRICTED_PROFILE_ID)
                    .executeUpdate();
        });
    }

    @AfterEach
    void removeRestrictedUser() {
        QuarkusTransaction.requiringNew().run(() -> {
            userRepository.delete("email = ?1", RESTRICTED_USER_EMAIL);
            profileRepository.getEntityManager()
                    .createNativeQuery("delete from profile_permissions where profile_id = cast(?1 as uuid)")
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .executeUpdate();
            profileRepository.deleteById(UUID.fromString(RESTRICTED_PROFILE_ID));
        });
    }

    private void grant(boolean view, boolean create, boolean edit, boolean delete) {
        QuarkusTransaction.requiringNew().run(() -> profileRepository.getEntityManager()
                .createNativeQuery("""
                        insert into profile_permissions
                            (profile_id, screen, can_view, can_create, can_edit, can_delete)
                        values (cast(?1 as uuid), 'TRANSACTION_REPORTS', ?2, ?3, ?4, ?5)
                        """)
                .setParameter(1, RESTRICTED_PROFILE_ID)
                .setParameter(2, view)
                .setParameter(3, create)
                .setParameter(4, edit)
                .setParameter(5, delete)
                .executeUpdate());
    }

    @Test
    void shouldRequireAuthentication() {
        given().when().get(REPORT_PATH).then().statusCode(401);
        given().when().get(PREFERENCES_PATH).then().statusCode(401);
        given().contentType(ContentType.JSON).body(VALID_BODY).when().post(PREFERENCES_PATH).then().statusCode(401);
        given().contentType(ContentType.JSON).body(VALID_BODY)
                .when().put(PREFERENCES_PATH + "/{id}", UUID.randomUUID()).then().statusCode(401);
        given().when().delete(PREFERENCES_PATH + "/{id}", UUID.randomUUID()).then().statusCode(401);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyEveryEndpointWithoutThePermission() {
        given()
                .queryParam("period", "XYZ")
                .queryParam("minAmount", "abc")
                .when().get(REPORT_PATH)
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));

        given().when().get(PREFERENCES_PATH)
                .then().statusCode(403).body("message", equalTo(ACCESS_DENIED_MESSAGE));

        given().contentType(ContentType.JSON).body(VALID_BODY).when().post(PREFERENCES_PATH)
                .then().statusCode(403).body("message", equalTo(ACCESS_DENIED_MESSAGE));

        given().contentType(ContentType.JSON).body(VALID_BODY)
                .when().put(PREFERENCES_PATH + "/{id}", UUID.randomUUID())
                .then().statusCode(403).body("message", equalTo(ACCESS_DENIED_MESSAGE));

        given().when().delete(PREFERENCES_PATH + "/{id}", UUID.randomUUID())
                .then().statusCode(403).body("message", equalTo(ACCESS_DENIED_MESSAGE));
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldSeparateViewFromPreferenceWrites() {
        grant(true, false, false, false);

        given().when().get(REPORT_PATH).then().statusCode(200);
        given().when().get(PREFERENCES_PATH).then().statusCode(200);

        given().contentType(ContentType.JSON).body(VALID_BODY).when().post(PREFERENCES_PATH)
                .then().statusCode(403).body("message", equalTo(ACCESS_DENIED_MESSAGE));
        given().contentType(ContentType.JSON).body(VALID_BODY)
                .when().put(PREFERENCES_PATH + "/{id}", UUID.randomUUID())
                .then().statusCode(403);
        given().when().delete(PREFERENCES_PATH + "/{id}", UUID.randomUUID())
                .then().statusCode(403);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldAllowEachWriteWithItsOwnAction() {
        grant(true, true, true, true);

        String id = given().contentType(ContentType.JSON).body(VALID_BODY).when().post(PREFERENCES_PATH)
                .then().statusCode(201).extract().path("id");
        given().contentType(ContentType.JSON).body(VALID_BODY).when().put(PREFERENCES_PATH + "/{id}", id)
                .then().statusCode(200);
        given().when().delete(PREFERENCES_PATH + "/{id}", id).then().statusCode(204);
    }

    @Test
    @TestSecurity(user = SUPER_ADMIN_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = SUPER_ADMIN_ID)
    })
    void shouldAllowHiddenSuperAdmin() {
        given().when().get(REPORT_PATH).then().statusCode(200);
        given().when().get(PREFERENCES_PATH).then().statusCode(200);
    }
}
