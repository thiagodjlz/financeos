package br.com.financeos.dashboard;

import static io.restassured.RestAssured.given;

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

// Classe sem @TestSecurity de classe: a anotacao de classe de DashboardResourceTest autentica tudo
// e nao permitiria exercitar nem o 401 nem um usuario sem permissao de Resumo.
@QuarkusTest
class DashboardPeriodsSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-0000000009a1";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000009a2";
    private static final String RESTRICTED_USER_EMAIL = "teste-periodos-sem-permissao@financeos.local";

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
                    .setParameter(2, "Teste periodos sem permissao")
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste periodos")
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

    @Test
    void shouldRequireAuthentication() {
        given()
                .when().get("/dashboard/periods")
                .then()
                .statusCode(401);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldDenyUserWithoutDashboardView() {
        given()
                .when().get("/dashboard/periods")
                .then()
                .statusCode(403);
    }
}
