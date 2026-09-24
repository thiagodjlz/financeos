package br.com.financeos.shared;

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

// Classe sem @TestSecurity de classe: as demais autenticam como o administrador, que tem todas as
// permissões. Aqui o perfil só vê o Resumo, para exercitar o 403 das listagens paginadas — que precisa
// vir antes da validação dos parâmetros, senão um parâmetro malformado revelaria a tela com um 400.
@QuarkusTest
class ListingSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-0000000009f1";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000009f2";
    private static final String RESTRICTED_USER_EMAIL = "teste-listagens-sem-acesso@financeos.local";

    private static final String ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";

    private static final String[] LIST_PATHS = { "/transactions", "/categories", "/users", "/profiles" };
    private static final String[] OTHER_READ_PATHS = {
            "/categories/options", "/profiles/options",
            "/transactions/" + UUID.randomUUID(), "/categories/" + UUID.randomUUID(),
            "/users/" + UUID.randomUUID(), "/profiles/" + UUID.randomUUID() };

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
                    .setParameter(2, "Teste listagens sem acesso")
                    .executeUpdate();

            profileRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into profile_permissions
                                (profile_id, screen, can_view, can_create, can_edit, can_delete)
                            values (cast(?1 as uuid), 'DASHBOARD', true, false, false, false)
                            """)
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste listagens")
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

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyListingsWithoutViewPermission() {
        for (String path : LIST_PATHS) {
            given()
                    .when().get(path)
                    .then()
                    .statusCode(403)
                    .body("message", equalTo(ACCESS_DENIED_MESSAGE));
        }
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyBeforeValidatingMalformedParameters() {
        for (String path : LIST_PATHS) {
            given()
                    .queryParam("size", "99")
                    .queryParam("page", "abc")
                    .queryParam("status", "XYZ")
                    .queryParam("active", "talvez")
                    .when().get(path)
                    .then()
                    .statusCode(403)
                    .body("message", equalTo(ACCESS_DENIED_MESSAGE));
        }
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyOptionsAndDetailWithoutViewPermission() {
        for (String path : OTHER_READ_PATHS) {
            given()
                    .queryParam("type", "XYZ")
                    .when().get(path)
                    .then()
                    .statusCode(403)
                    .body("message", equalTo(ACCESS_DENIED_MESSAGE));
        }
    }
}
