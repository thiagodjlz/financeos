package br.com.financeos.audit;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.profiles.ProfileRepository;
import br.com.financeos.profiles.Screen;
import br.com.financeos.transactions.TransactionRepository;
import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class AuditChangeRecordingTest {

    private static final UUID DEV_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";
    private static final String PREFIX = "Teste Auditoria";
    private static final String USER_EMAIL_PREFIX = "teste-auditoria-";

    private static final String ACTOR_ID = "00000000-0000-0000-0000-0000000009a1";
    private static final String ACTOR_EMAIL = "teste-auditoria-autor@financeos.local";

    @Inject
    AuditProbe probe;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    TransactionRepository transactionRepository;

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    @BeforeEach
    void createActor() {
        QuarkusTransaction.requiringNew().run(() -> userRepository.getEntityManager()
                .createNativeQuery("""
                        insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                        values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                        """)
                .setParameter(1, ACTOR_ID)
                .setParameter(2, "Autor Original")
                .setParameter(3, ACTOR_EMAIL)
                .setParameter(4, "$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm")
                .setParameter(5, ADMIN_PROFILE_ID)
                .executeUpdate());
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            transactionRepository.delete("description like ?1", PREFIX + "%");
            categoryRepository.delete("name like ?1", PREFIX + "%");
            userRepository.delete("email like ?1", USER_EMAIL_PREFIX + "%");
            profileRepository.delete("name like ?1", PREFIX + "%");
        });
    }

    @Test
    void shouldRecordCategoryCreateUpdateAndDeleteWithFieldDetail() {
        String name = PREFIX + " Categoria " + UUID.randomUUID();
        String id = createCategory(name, "#ff0000");

        given()
                .contentType(ContentType.JSON)
                .body(categoryBody(name, "#00ff00", true))
                .when().put("/categories/{id}", id)
                .then()
                .statusCode(200);

        given()
                .when().delete("/categories/{id}", id)
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(List.of("CREATE", "UPDATE", "DELETE"), entries.stream().map(AuditProbe.Entry::action).toList());

        AppUser dev = QuarkusTransaction.requiringNew().call(() -> userRepository.findById(DEV_USER_ID));
        for (AuditProbe.Entry entry : entries) {
            assertEquals("CHANGE", entry.type());
            assertEquals(Screen.CATEGORIES.name(), entry.screen());
            assertEquals(DEV_USER_ID, entry.userId());
            assertEquals(dev.name, entry.userName());
            assertEquals(dev.email, entry.userEmail());
            assertEquals(name, entry.recordLabel());
            assertNotNull(entry.occurredAt());
        }

        AuditProbe.Entry created = entries.get(0);
        assertEquals(Arrays.asList(null, name), created.changes().get("Nome"));
        assertEquals(Arrays.asList(null, "Despesa"), created.changes().get("Tipo"));
        assertEquals(Arrays.asList(null, "#ff0000"), created.changes().get("Cor"));
        assertEquals(Arrays.asList(null, "Ativo"), created.changes().get("Situação"));
        assertFalse(created.changes().containsKey("Categoria pai"));

        AuditProbe.Entry updated = entries.get(1);
        assertEquals(List.of("Cor"), List.copyOf(updated.changes().keySet()));
        assertEquals(Arrays.asList("#ff0000", "#00ff00"), updated.changes().get("Cor"));

        AuditProbe.Entry deleted = entries.get(2);
        assertEquals(Arrays.asList(name, null), deleted.changes().get("Nome"));
        assertEquals(Arrays.asList("#00ff00", null), deleted.changes().get("Cor"));
    }

    @Test
    void shouldRecordTransactionChangesWithCategoryNameAndReadableValues() {
        String categoryName = PREFIX + " Categoria Lancamento " + UUID.randomUUID();
        String categoryId = createCategory(categoryName, "#123456");
        String description = PREFIX + " Lancamento " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body(transactionBody(categoryId, description, "10.00"))
                .when().post("/transactions")
                .then()
                .statusCode(201)
                .extract().path("id");

        given()
                .contentType(ContentType.JSON)
                .body(transactionBody(categoryId, description, "25.50"))
                .when().put("/transactions/{id}", id)
                .then()
                .statusCode(200);

        given()
                .when().delete("/transactions/{id}", id)
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(List.of("CREATE", "UPDATE", "DELETE"), entries.stream().map(AuditProbe.Entry::action).toList());
        entries.forEach(entry -> assertEquals(Screen.TRANSACTIONS.name(), entry.screen()));

        AuditProbe.Entry created = entries.get(0);
        assertEquals(Arrays.asList(null, categoryName), created.changes().get("Categoria"));
        assertEquals(Arrays.asList(null, "R$ 10,00"), created.changes().get("Valor"));
        assertEquals(Arrays.asList(null, "01/10/2026"), created.changes().get("Data"));
        assertEquals(Arrays.asList(null, "Pendente"), created.changes().get("Status"));
        assertEquals(Arrays.asList(null, "Despesa"), created.changes().get("Tipo"));

        AuditProbe.Entry updated = entries.get(1);
        assertEquals(List.of("Valor"), List.copyOf(updated.changes().keySet()));
        assertEquals(Arrays.asList("R$ 10,00", "R$ 25,50"), updated.changes().get("Valor"));

        AuditProbe.Entry deleted = entries.get(2);
        assertEquals(Arrays.asList(categoryName, null), deleted.changes().get("Categoria"));
        assertEquals(Arrays.asList("R$ 25,50", null), deleted.changes().get("Valor"));
    }

    @Test
    void shouldRecordUserChangesWithoutPasswordOrHash() {
        String email = USER_EMAIL_PREFIX + UUID.randomUUID() + "@financeos.local";
        String password = "SenhaSecreta123";
        String newPassword = "OutraSenha4567";

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        { "name": "Usuario Auditado", "email": "%s", "password": "%s", "profileId": "%s" }
                        """.formatted(email, password, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract().path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        { "name": "Usuario Renomeado", "email": "%s", "profileId": "%s", "active": true, "password": "%s" }
                        """.formatted(email, ADMIN_PROFILE_ID, newPassword))
                .when().put("/users/{id}", id)
                .then()
                .statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .body("""
                        { "name": "Usuario Renomeado", "email": "%s", "profileId": "%s", "active": true, "password": "%s" }
                        """.formatted(email, ADMIN_PROFILE_ID, password))
                .when().put("/users/{id}", id)
                .then()
                .statusCode(200);

        given()
                .when().delete("/users/{id}", id)
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(List.of("CREATE", "UPDATE", "UPDATE", "UPDATE"),
                entries.stream().map(AuditProbe.Entry::action).toList());

        AuditProbe.Entry created = entries.get(0);
        assertEquals(List.of("Nome", "E-mail", "Perfil", "Ativo"), List.copyOf(created.changes().keySet()));
        assertEquals(Arrays.asList(null, "Administrador"), created.changes().get("Perfil"));
        assertEquals(Arrays.asList(null, "Sim"), created.changes().get("Ativo"));

        assertEquals(List.of("Nome"), List.copyOf(entries.get(1).changes().keySet()));
        assertEquals("Usuario Renomeado", entries.get(1).recordLabel());
        assertTrue(entries.get(2).changes().isEmpty(), "troca só de senha é Alteração sem campos");

        AuditProbe.Entry deactivated = entries.get(3);
        assertEquals(List.of("Ativo"), List.copyOf(deactivated.changes().keySet()));
        assertEquals(Arrays.asList("Sim", "Não"), deactivated.changes().get("Ativo"));

        String hash = QuarkusTransaction.requiringNew().call(() -> userRepository.findById(UUID.fromString(id)).passwordHash);
        for (AuditProbe.Entry entry : entries) {
            for (var change : entry.changes().entrySet()) {
                assertFalse(change.getKey().toLowerCase().contains("senha"), change.getKey());
                for (String value : change.getValue()) {
                    if (value != null) {
                        assertFalse(value.contains(password) || value.contains(newPassword) || value.contains(hash)
                                || value.startsWith("$2a$"), value);
                    }
                }
            }
        }
    }

    @Test
    void shouldRecordOnlyChangedPermissionsForProfiles() {
        String name = PREFIX + " Perfil " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body(profileBody(name, "{ \"screen\": \"DASHBOARD\", \"canView\": true }"))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .extract().path("id");

        given()
                .contentType(ContentType.JSON)
                .body(profileBody(name, """
                        { "screen": "DASHBOARD", "canView": true },
                        { "screen": "TRANSACTIONS", "canView": true, "canCreate": true }
                        """))
                .when().put("/profiles/{id}", id)
                .then()
                .statusCode(200);

        given()
                .when().delete("/profiles/{id}", id)
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(List.of("CREATE", "UPDATE", "DELETE"), entries.stream().map(AuditProbe.Entry::action).toList());
        entries.forEach(entry -> assertEquals(Screen.PROFILES.name(), entry.screen()));

        AuditProbe.Entry created = entries.get(0);
        assertEquals(Arrays.asList(null, name), created.changes().get("Nome"));
        assertEquals(Arrays.asList(null, "Ver"), created.changes().get("Permissões: Resumo"));
        assertEquals(Arrays.asList(null, "Sem acesso"), created.changes().get("Permissões: Auditoria"));

        AuditProbe.Entry updated = entries.get(1);
        assertEquals(List.of("Permissões: Lançamentos"), List.copyOf(updated.changes().keySet()));
        assertEquals(Arrays.asList("Sem acesso", "Ver, Incluir"), updated.changes().get("Permissões: Lançamentos"));

        AuditProbe.Entry deleted = entries.get(2);
        assertEquals(Arrays.asList("Ver, Incluir", null), deleted.changes().get("Permissões: Lançamentos"));
    }

    @Test
    void shouldNotRecordRefusedWrites() {
        String name = PREFIX + " Duplicada " + UUID.randomUUID();
        createCategory(name, "#ff0000");

        given()
                .contentType(ContentType.JSON)
                .body(categoryBody(name, "#ff0000", true))
                .when().post("/categories")
                .then()
                .statusCode(409);
        assertEquals(1, probe.byRecordLabel(name).size());

        UUID missing = UUID.randomUUID();
        given()
                .contentType(ContentType.JSON)
                .body(categoryBody(PREFIX + " Inexistente", "#ff0000", true))
                .when().put("/categories/{id}", missing)
                .then()
                .statusCode(404);
        given()
                .when().delete("/transactions/{id}", missing)
                .then()
                .statusCode(404);
        assertTrue(probe.byRecord(missing).isEmpty());

        String description = PREFIX + " Recusado " + UUID.randomUUID();
        given()
                .contentType(ContentType.JSON)
                .body(transactionBody(UUID.randomUUID().toString(), description, "10.00"))
                .when().post("/transactions")
                .then()
                .statusCode(400);
        given()
                .contentType(ContentType.JSON)
                .body("{ \"name\": \"\", \"type\": \"EXPENSE\", \"color\": \"#ff0000\", \"active\": true }")
                .when().post("/categories")
                .then()
                .statusCode(400);
        assertTrue(probe.byRecordLabel(description).isEmpty());
    }

    @Test
    void shouldRollBackTheOperationWhenTheAuditFails() {
        QuarkusMock.installMockForType(new FailingAuditWriter(), AuditWriter.class);
        String name = PREFIX + " Rollback " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .body(categoryBody(name, "#ff0000", true))
                .when().post("/categories")
                .then()
                .statusCode(500);

        long saved = QuarkusTransaction.requiringNew().call(() -> categoryRepository.count("name", name));
        assertEquals(0, saved);
        assertTrue(probe.byRecordLabel(name).isEmpty());
    }

    @Test
    void shouldKeepLabelsAfterDeletingTheRecordAndRenamingTheUser() {
        String name = PREFIX + " Excluida " + UUID.randomUUID();
        String id = createCategory(name, "#ff0000");

        given()
                .when().delete("/categories/{id}", id)
                .then()
                .statusCode(204);

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(2, entries.size());
        entries.forEach(entry -> assertEquals(name, entry.recordLabel()));

        String email = USER_EMAIL_PREFIX + UUID.randomUUID() + "@financeos.local";
        String userId = given()
                .contentType(ContentType.JSON)
                .body("""
                        { "name": "Nome Antigo", "email": "%s", "password": "SenhaSecreta123", "profileId": "%s" }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract().path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        { "name": "Nome Novo", "email": "%s", "profileId": "%s", "active": true }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", userId)
                .then()
                .statusCode(200);

        assertEquals("Nome Antigo", probe.byRecord(UUID.fromString(userId)).get(0).recordLabel());
    }

    @Test
    @TestSecurity(user = ACTOR_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = ACTOR_ID)
    })
    void shouldKeepTheActorNameOfTheMoment() {
        String name = PREFIX + " Autor " + UUID.randomUUID();
        String id = createCategory(name, "#ff0000");

        QuarkusTransaction.requiringNew().run(() -> userRepository.findById(UUID.fromString(ACTOR_ID)).name = "Autor Renomeado");

        AuditProbe.Entry entry = probe.byRecord(UUID.fromString(id)).get(0);
        assertEquals(UUID.fromString(ACTOR_ID), entry.userId());
        assertEquals("Autor Original", entry.userName());
        assertEquals(ACTOR_EMAIL, entry.userEmail());
        assertNull(entry.changes().get("Categoria pai"));
    }

    private String createCategory(String name, String color) {
        return given()
                .contentType(ContentType.JSON)
                .body(categoryBody(name, color, true))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private static String categoryBody(String name, String color, boolean active) {
        return """
                { "name": "%s", "type": "EXPENSE", "color": "%s", "active": %s }
                """.formatted(name, color, active);
    }

    private static String transactionBody(String categoryId, String description, String amount) {
        return """
                {
                  "categoryId": "%s",
                  "transactionDate": "2026-10-01",
                  "description": "%s",
                  "amount": %s,
                  "type": "EXPENSE",
                  "status": "PENDING"
                }
                """.formatted(categoryId, description, amount);
    }

    private static String profileBody(String name, String permissions) {
        return """
                { "name": "%s", "permissions": [ %s ] }
                """.formatted(name, permissions);
    }

    static class FailingAuditWriter extends AuditWriter {

        @Override
        public void writeChange(AuditActor actor, AuditAction action, Screen screen, UUID recordId,
                String recordLabel, List<AuditChange> changes) {
            throw new IllegalStateException("Falha simulada na gravação da auditoria.");
        }
    }
}
