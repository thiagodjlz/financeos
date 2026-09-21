package br.com.financeos.documentation;

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

// Classe sem @TestSecurity de classe: a anotacao de classe de DocumentationResourceTest autentica
// tudo e nao permitiria exercitar nem o 401 nem um usuario sem permissao da Central.
@QuarkusTest
class DocumentationSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-0000000009b1";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000009b2";
    private static final String RESTRICTED_USER_EMAIL = "teste-documentacao-sem-permissao@financeos.local";

    private static final String SUPER_ADMIN_EMAIL = "owner@financeos.internal";
    private static final String SUPER_ADMIN_ID = "00000000-0000-0000-0000-000000000099";

    private static final String ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    // Insercao nativa porque o id das entidades e gerado: com @GeneratedValue nao ha como persistir
    // pela Panache o UUID fixo que as anotacoes de seguranca do teste precisam citar.
    @BeforeEach
    void createRestrictedUser() {
        QuarkusTransaction.requiringNew().run(() -> {
            profileRepository.getEntityManager()
                    .createNativeQuery("insert into profiles (id, name) values (cast(?1 as uuid), ?2)")
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .setParameter(2, "Teste documentacao sem permissao")
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste documentacao")
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

    private void grantDocumentation(boolean canView) {
        QuarkusTransaction.requiringNew().run(() -> profileRepository.getEntityManager()
                .createNativeQuery("""
                        insert into profile_permissions
                            (profile_id, screen, can_view, can_create, can_edit, can_delete)
                        values (cast(?1 as uuid), 'DOCUMENTATION', ?2, false, false, false)
                        """)
                .setParameter(1, RESTRICTED_PROFILE_ID)
                .setParameter(2, canView)
                .executeUpdate());
    }

    @Test
    void shouldRequireAuthentication() {
        given()
                .when().get("/documentation")
                .then()
                .statusCode(401);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyProfileWithoutDocumentationRow() {
        given()
                .when().get("/documentation")
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyProfileWithDocumentationViewFalse() {
        grantDocumentation(false);

        given()
                .when().get("/documentation")
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldAllowProfileWithDocumentationView() {
        grantDocumentation(true);

        given()
                .when().get("/documentation")
                .then()
                .statusCode(200);
    }

    @Test
    @TestSecurity(user = SUPER_ADMIN_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = SUPER_ADMIN_ID)
    })
    void shouldAllowHiddenSuperAdmin() {
        given()
                .when().get("/documentation")
                .then()
                .statusCode(200);
    }
}
