package br.com.financeos.audit;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.profiles.ProfileRepository;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;

// Sem @TestSecurity de classe: login, logout e token vencido precisam do mecanismo JWT de verdade.
@QuarkusTest
class AuditEventsTest {

    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";

    private static final String USER_ID = "00000000-0000-0000-0000-0000000009a2";
    private static final String USER_EMAIL = "teste-auditoria-eventos@financeos.local";
    private static final String USER_PASSWORD = "SenhaEventos123";

    private static final String RESTRICTED_ID = "00000000-0000-0000-0000-0000000009a3";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000009a4";
    private static final String RESTRICTED_EMAIL = "teste-auditoria-restrito@financeos.local";

    @Inject
    AuditProbe probe;

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    @BeforeEach
    void createUsers() {
        String hash = BcryptUtil.bcryptHash(USER_PASSWORD);

        QuarkusTransaction.requiringNew().run(() -> {
            profileRepository.getEntityManager()
                    .createNativeQuery("insert into profiles (id, name) values (cast(?1 as uuid), ?2)")
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .setParameter(2, "Teste auditoria sem acesso")
                    .executeUpdate();

            insertUser(USER_ID, "Usuario Eventos", USER_EMAIL, hash, ADMIN_PROFILE_ID);
            insertUser(RESTRICTED_ID, "Usuario Restrito", RESTRICTED_EMAIL, hash, RESTRICTED_PROFILE_ID);
        });
    }

    private void insertUser(String id, String name, String email, String hash, String profileId) {
        userRepository.getEntityManager()
                .createNativeQuery("""
                        insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                        values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                        """)
                .setParameter(1, id)
                .setParameter(2, name)
                .setParameter(3, email)
                .setParameter(4, hash)
                .setParameter(5, profileId)
                .executeUpdate();
    }

    @AfterEach
    void removeUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            userRepository.delete("email in ?1", List.of(USER_EMAIL, RESTRICTED_EMAIL));
            profileRepository.deleteById(UUID.fromString(RESTRICTED_PROFILE_ID));
        });
    }

    @Test
    void shouldRecordLoginAndLogout() {
        Instant before = Instant.now();

        String token = given()
                .contentType(ContentType.JSON)
                .body(loginBody(USER_EMAIL, USER_PASSWORD))
                .when().post("/auth/login")
                .then()
                .statusCode(200)
                .extract().path("token");

        given()
                .header("Authorization", "Bearer " + token)
                .when().post("/auth/logout")
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = recentFor(UUID.fromString(USER_ID), before);
        assertEquals(List.of("LOGIN", "LOGOUT"), entries.stream().map(AuditProbe.Entry::type).toList());
        for (AuditProbe.Entry entry : entries) {
            assertEquals("Usuario Eventos", entry.userName());
            assertEquals(USER_EMAIL, entry.userEmail());
            assertNull(entry.action());
            assertNull(entry.screen());
        }
    }

    @Test
    void shouldRequireAuthenticationToLogout() {
        given()
                .when().post("/auth/logout")
                .then()
                .statusCode(401);
    }

    @Test
    void shouldRecordFailedLoginLinkedToExistingAccount() {
        Instant before = Instant.now();

        given()
                .contentType(ContentType.JSON)
                .body(loginBody(USER_EMAIL, "senha-errada-123"))
                .when().post("/auth/login")
                .then()
                .statusCode(401)
                .body("message", equalTo("Credenciais inválidas."));

        List<AuditProbe.Entry> entries = recentFor(UUID.fromString(USER_ID), before);
        assertEquals(1, entries.size());
        AuditProbe.Entry entry = entries.get(0);
        assertEquals("LOGIN_FAILED", entry.type());
        assertEquals(USER_EMAIL, entry.userEmail());
        assertTrue(entry.changes().isEmpty());
    }

    @Test
    void shouldRecordFailedLoginWithUnknownEmailWithoutUser() {
        String email = "teste-auditoria-inexistente-" + UUID.randomUUID() + "@financeos.local";

        given()
                .contentType(ContentType.JSON)
                .body(loginBody(email, "qualquer-senha"))
                .when().post("/auth/login")
                .then()
                .statusCode(401);

        List<AuditProbe.Entry> entries = probe.byUserEmail(email);
        assertEquals(1, entries.size());
        assertEquals("LOGIN_FAILED", entries.get(0).type());
        assertNull(entries.get(0).userId());
        assertNull(entries.get(0).userName());
    }

    @Test
    void shouldRecordExpiredSessionForTokenWithValidSignature() throws InterruptedException {
        Instant now = Instant.now();
        String expired = Jwt.issuer(issuer)
                .subject(USER_ID)
                .upn(USER_EMAIL)
                .issuedAt(now.minus(Duration.ofHours(13)))
                .expiresAt(now.minus(Duration.ofHours(1)))
                .sign();

        given()
                .header("Authorization", "Bearer " + expired)
                .when().get("/auth/me")
                .then()
                .statusCode(401);

        List<AuditProbe.Entry> entries = waitFor(() -> recentFor(UUID.fromString(USER_ID), now));
        assertEquals(List.of("SESSION_EXPIRED"), entries.stream().map(AuditProbe.Entry::type).toList());
        assertEquals("Usuario Eventos", entries.get(0).userName());
    }

    @Test
    void shouldNotRecordExpiredSessionForMalformedToken() throws InterruptedException {
        Instant now = Instant.now();

        given()
                .header("Authorization", "Bearer token-que-nao-e-jwt")
                .when().get("/auth/me")
                .then()
                .statusCode(401);

        Thread.sleep(500);
        assertTrue(recentFor(UUID.fromString(USER_ID), now).isEmpty());
    }

    @Test
    @TestSecurity(user = RESTRICTED_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_ID)
    })
    void shouldRecordAccessDeniedWithScreenAndAction() {
        Instant before = Instant.now();

        given()
                .when().get("/categories")
                .then()
                .statusCode(403);

        given()
                .contentType(ContentType.JSON)
                .body("{ \"name\": \"Teste\", \"type\": \"EXPENSE\", \"color\": \"#ff0000\", \"active\": true }")
                .when().post("/categories")
                .then()
                .statusCode(403);

        List<AuditProbe.Entry> entries = recentFor(UUID.fromString(RESTRICTED_ID), before);
        assertEquals(List.of("ACCESS_DENIED", "ACCESS_DENIED"), entries.stream().map(AuditProbe.Entry::type).toList());
        assertEquals(List.of("CATEGORIES", "CATEGORIES"), entries.stream().map(AuditProbe.Entry::screen).toList());
        assertEquals(List.of("VIEW", "CREATE"), entries.stream().map(AuditProbe.Entry::action).toList());
    }

    @Test
    @TestSecurity(user = USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = USER_ID)
    })
    void shouldRecordScreenAccess() {
        Instant before = Instant.now();

        given()
                .contentType(ContentType.JSON)
                .body("{ \"screen\": \"TRANSACTIONS\" }")
                .when().post("/audit/screen-access")
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = recentFor(UUID.fromString(USER_ID), before);
        assertEquals(1, entries.size());
        assertEquals("SCREEN_ACCESS", entries.get(0).type());
        assertEquals("TRANSACTIONS", entries.get(0).screen());
        assertEquals("VIEW", entries.get(0).action());
    }

    @Test
    @TestSecurity(user = USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = USER_ID)
    })
    void shouldRejectInvalidOrMissingScreenInPortuguese() {
        Instant before = Instant.now();

        given()
                .contentType(ContentType.JSON)
                .body("{ \"screen\": \"XYZ\" }")
                .when().post("/audit/screen-access")
                .then()
                .statusCode(400)
                .body("message", equalTo("A tela informada é inválida."));

        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .when().post("/audit/screen-access")
                .then()
                .statusCode(400)
                .body("message", equalTo("Informe os campos obrigatórios: Tela."));

        assertTrue(recentFor(UUID.fromString(USER_ID), before).isEmpty());
    }

    @Test
    @TestSecurity(user = RESTRICTED_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_ID)
    })
    void shouldDenyScreenAccessWithoutViewPermission() {
        Instant before = Instant.now();

        given()
                .contentType(ContentType.JSON)
                .body("{ \"screen\": \"USERS\" }")
                .when().post("/audit/screen-access")
                .then()
                .statusCode(403)
                .body("message", equalTo("Você não tem permissão para realizar esta ação."));

        List<AuditProbe.Entry> entries = recentFor(UUID.fromString(RESTRICTED_ID), before);
        assertEquals(List.of("ACCESS_DENIED"), entries.stream().map(AuditProbe.Entry::type).toList());
        assertEquals("USERS", entries.get(0).screen());
    }

    @Test
    @TestSecurity(user = USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = USER_ID)
    })
    void shouldOfferPrintTypeAndLabelsInOptions() {
        given()
                .when().get("/audit/options")
                .then()
                .statusCode(200)
                .body("types.find { it.code == 'PRINT' }.label", equalTo("Impressão"))
                .body("types.find { it.code == 'SCREEN_ACCESS' }.label", equalTo("Acesso à tela"))
                .body("actions.find { it.code == 'CREATE' }.label", equalTo("Inclusão"))
                .body("screens.find { it.code == 'AUDIT' }.label", equalTo("Auditoria"));
    }

    private List<AuditProbe.Entry> recentFor(UUID userId, Instant since) {
        return probe.byUser(userId).stream()
                .filter(entry -> !entry.occurredAt().toInstant().isBefore(since.minusMillis(1)))
                .toList();
    }

    // O evento de sessão expirada é gravado por um observador assíncrono.
    private static List<AuditProbe.Entry> waitFor(Supplier<List<AuditProbe.Entry>> query) throws InterruptedException {
        for (int attempt = 0; attempt < 50; attempt++) {
            List<AuditProbe.Entry> entries = query.get();
            if (!entries.isEmpty()) {
                return entries;
            }
            Thread.sleep(100);
        }

        return query.get();
    }

    private static String loginBody(String email, String password) {
        return """
                { "email": "%s", "password": "%s" }
                """.formatted(email, password);
    }

    @Test
    void shouldNotExposeTheTypedPasswordOnFailedLogin() {
        String email = "teste-auditoria-senha-" + UUID.randomUUID() + "@financeos.local";

        given()
                .contentType(ContentType.JSON)
                .body(loginBody(email, "SenhaDigitadaSecreta"))
                .when().post("/auth/login")
                .then()
                .statusCode(401);

        AuditProbe.Entry entry = probe.byUserEmail(email).get(0);
        assertFalse(String.valueOf(entry).contains("SenhaDigitadaSecreta"));
    }
}
