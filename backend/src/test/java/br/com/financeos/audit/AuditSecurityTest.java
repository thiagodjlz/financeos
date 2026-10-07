package br.com.financeos.audit;

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
import jakarta.inject.Inject;

// Classe sem @TestSecurity de classe, para exercitar o 401 e perfis sem a permissão da Auditoria.
@QuarkusTest
class AuditSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-0000000009a5";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000009a6";
    private static final String RESTRICTED_USER_EMAIL = "teste-auditoria-permissao@financeos.local";

    private static final String ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";

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
                    .setParameter(2, "Teste auditoria permissao")
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste auditoria permissao")
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
            profileRepository.deleteById(UUID.fromString(RESTRICTED_PROFILE_ID));
        });
    }

    private void grantAudit(boolean canView) {
        QuarkusTransaction.requiringNew().run(() -> profileRepository.getEntityManager()
                .createNativeQuery("""
                        insert into profile_permissions
                            (profile_id, screen, can_view, can_create, can_edit, can_delete)
                        values (cast(?1 as uuid), 'AUDIT', ?2, false, false, false)
                        """)
                .setParameter(1, RESTRICTED_PROFILE_ID)
                .setParameter(2, canView)
                .executeUpdate());
    }

    @Test
    void shouldRequireAuthentication() {
        given().when().get("/audit").then().statusCode(401);
        given().when().get("/audit/options").then().statusCode(401);
        given().contentType("application/json").body("{ \"screen\": \"DASHBOARD\" }")
                .when().post("/audit/screen-access").then().statusCode(401);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyProfileWithoutAuditRow() {
        given()
                .queryParam("size", "99")
                .queryParam("type", "XYZ")
                .when().get("/audit")
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));

        given()
                .when().get("/audit/options")
                .then()
                .statusCode(403);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyProfileWithAuditViewFalse() {
        grantAudit(false);

        given()
                .when().get("/audit")
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));
    }

    // Só Auditoria, sem Usuários: o filtro por usuário vale mesmo sem a permissão de ver Usuários.
    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldAllowProfileWithAuditViewIncludingUserFilter() {
        grantAudit(true);

        given()
                .queryParam("user", "dev")
                .when().get("/audit")
                .then()
                .statusCode(200);

        given()
                .when().get("/audit/options")
                .then()
                .statusCode(200);
    }

    @Test
    @TestSecurity(user = "owner@financeos.internal")
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000099")
    })
    void shouldAllowHiddenSuperAdmin() {
        given()
                .when().get("/audit")
                .then()
                .statusCode(200);
    }
}
