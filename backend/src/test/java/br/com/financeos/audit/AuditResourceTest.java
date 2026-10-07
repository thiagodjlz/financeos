package br.com.financeos.audit;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.categories.CategoryRepository;
import br.com.financeos.profiles.ProfileRepository;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
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
class AuditResourceTest {

    private static final UUID SUPER_ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";
    private static final String PREFIX = "Teste Consulta Auditoria";

    @Inject
    AuditRecordRepository repository;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    @Inject
    AuditProbe probe;

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            categoryRepository.delete("name like ?1", PREFIX + "%");
            userRepository.delete("email like ?1", "teste-consulta-auditoria-%");
            profileRepository.delete("name like ?1", PREFIX + "%");
        });
    }

    @Test
    void shouldListMostRecentFirstWithPaginationAndLabels() {
        String marker = marker();
        OffsetDateTime base = OffsetDateTime.parse("2026-03-01T12:00:00-03:00");
        for (int index = 0; index < 12; index++) {
            insert(marker, "CHANGE", "UPDATE", "CATEGORIES", base.plusMinutes(index), false, null);
        }

        String newest = given()
                .queryParam("user", marker)
                .queryParam("size", 10)
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(12))
                .body("totalPages", equalTo(2))
                .body("items", hasSize(10))
                .body("items[0].userName", equalTo(marker))
                .body("items[0].typeLabel", equalTo("Alteração"))
                .body("items[0].actionLabel", equalTo("Alteração"))
                .body("items[0].screenLabel", equalTo("Categorias"))
                .body("items[0].recordLabel", equalTo("Registro " + marker))
                .body("items[0].changes[0].field", equalTo("Nome"))
                .body("items[0].changes[0].oldValue", equalTo("Antes"))
                .body("items[0].changes[0].newValue", equalTo("Depois"))
                .extract().path("items[0].occurredAt");
        assertEquals(base.plusMinutes(11).toInstant(), OffsetDateTime.parse(newest).toInstant());

        String oldest = given()
                .queryParam("user", marker)
                .queryParam("page", 2)
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("items", hasSize(2))
                .extract().path("items[1].occurredAt");
        assertEquals(base.toInstant(), OffsetDateTime.parse(oldest).toInstant());
    }

    @Test
    void shouldFilterByUserIgnoringCaseAndAccentsAndByTypeActionAndScreen() {
        String marker = marker();
        OffsetDateTime when = OffsetDateTime.parse("2026-03-02T10:00:00-03:00");
        insert("Márcia " + marker, "LOGIN", null, null, when, false, null);
        insert("Márcia " + marker, "CHANGE", "CREATE", "TRANSACTIONS", when.plusMinutes(1), false, null);
        insert("Márcia " + marker, "CHANGE", "DELETE", "CATEGORIES", when.plusMinutes(2), false, null);

        given()
                .queryParam("user", "MARCIA " + marker.toUpperCase())
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(3));

        given()
                .queryParam("user", marker)
                .queryParam("type", "LOGIN")
                .when().get("/audit")
                .then()
                .body("totalItems", equalTo(1))
                .body("items[0].typeLabel", equalTo("Login"))
                .body("items[0].action", nullValue())
                .body("items[0].screenLabel", nullValue());

        given()
                .queryParam("user", marker)
                .queryParam("action", "CREATE")
                .when().get("/audit")
                .then()
                .body("totalItems", equalTo(1))
                .body("items[0].actionLabel", equalTo("Inclusão"))
                .body("items[0].screenLabel", equalTo("Lançamentos"));

        given()
                .queryParam("user", marker)
                .queryParam("screen", "CATEGORIES")
                .when().get("/audit")
                .then()
                .body("totalItems", equalTo(1))
                .body("items[0].actionLabel", equalTo("Exclusão"));
    }

    @Test
    void shouldFilterByPeriodInTheInformedTimeZone() {
        String marker = marker();
        insert(marker, "LOGIN", null, null, OffsetDateTime.parse("2026-01-10T12:00:00-03:00"), false, null);
        insert(marker, "LOGIN", null, null, OffsetDateTime.parse("2026-01-20T12:00:00-03:00"), false, null);
        insert(marker, "LOGIN", null, null, OffsetDateTime.parse("2026-01-31T23:30:00-03:00"), false, null);
        insert(marker, "LOGIN", null, null, OffsetDateTime.parse("2020-05-05T08:00:00-03:00"), false, null);

        given()
                .queryParam("user", marker)
                .queryParam("startDate", "2026-01-15")
                .queryParam("endDate", "2026-01-31")
                .queryParam("timeZone", "America/Sao_Paulo")
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(2));

        given()
                .queryParam("user", marker)
                .queryParam("startDate", "2026-01-15")
                .queryParam("endDate", "2026-01-31")
                .queryParam("timeZone", "UTC")
                .when().get("/audit")
                .then()
                .body("totalItems", equalTo(1));

        given()
                .queryParam("user", marker)
                .when().get("/audit")
                .then()
                .body("totalItems", equalTo(4));
    }

    @Test
    void shouldRejectInvalidFiltersInPortuguese() {
        given()
                .queryParam("startDate", "2026-02-10")
                .queryParam("endDate", "2026-02-01")
                .when().get("/audit")
                .then()
                .statusCode(400)
                .body("message", equalTo("A data inicial não pode ser posterior à data final."));

        assertBadRequest("startDate", "10/02/2026", "A data inicial informada é inválida.");
        assertBadRequest("endDate", "ontem", "A data final informada é inválida.");
        assertBadRequest("type", "XYZ", "O tipo informado é inválido.");
        assertBadRequest("action", "XYZ", "A ação informada é inválida.");
        assertBadRequest("screen", "XYZ", "A funcionalidade informada é inválida.");
        assertBadRequest("timeZone", "Lua/Base", "O fuso horário informado é inválido.");
        assertBadRequest("size", "50", "O tamanho da página deve ser um número entre 1 e 10.");
    }

    @Test
    void shouldShowUnknownEventTypeByItsCodeWithoutMigration() {
        String marker = marker();
        insert(marker, "TIPO_FUTURO", null, null, OffsetDateTime.parse("2026-03-03T10:00:00-03:00"), false, null);

        given()
                .queryParam("user", marker)
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("items[0].type", equalTo("TIPO_FUTURO"))
                .body("items[0].typeLabel", equalTo("TIPO_FUTURO"));
    }

    @Test
    void shouldNeverReturnSuperAdminRecords() {
        String marker = marker();
        OffsetDateTime when = OffsetDateTime.parse("2026-03-04T10:00:00-03:00");
        insert(marker, "LOGIN", null, null, when, true, SUPER_ADMIN_ID);
        insert(marker, "LOGIN", null, null, when.plusMinutes(1), false, SUPER_ADMIN_ID);
        insert(marker, "LOGIN", null, null, when.plusMinutes(2), true, UUID.randomUUID());
        insert(marker, "LOGIN", null, null, when.plusMinutes(3), false, null);

        given()
                .queryParam("user", marker)
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(1))
                .body("items", hasSize(1));

        given()
                .queryParam("user", "owner@financeos.internal")
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(0));
    }

    @Test
    @TestSecurity(user = "owner@financeos.internal")
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000099")
    })
    void shouldRecordSuperAdminWritesButHideThemEvenFromTheSuperAdmin() {
        String name = PREFIX + " Super " + UUID.randomUUID();

        String id = given()
                .contentType(ContentType.JSON)
                .body("{ \"name\": \"%s\", \"type\": \"EXPENSE\", \"color\": \"#ff0000\", \"active\": true }"
                        .formatted(name))
                .when().post("/categories")
                .then()
                .statusCode(201)
                .extract().path("id");

        List<AuditProbe.Entry> entries = probe.byRecord(UUID.fromString(id));
        assertEquals(1, entries.size());
        assertTrue(entries.get(0).userSuperAdmin());

        given()
                .queryParam("screen", "CATEGORIES")
                .queryParam("action", "CREATE")
                .queryParam("size", 10)
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("items.recordLabel.findAll { it == '%s' }".formatted(name), hasSize(0));

        given()
                .queryParam("user", "System Owner")
                .when().get("/audit")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(0));
    }

    @Test
    void shouldHaveNoMaintenanceEndpoints() {
        String marker = marker();
        insert(marker, "LOGIN", null, null, OffsetDateTime.parse("2026-03-05T10:00:00-03:00"), false, null);
        String id = given().queryParam("user", marker).when().get("/audit").then().extract().path("items[0].id");

        given().contentType(ContentType.JSON).body("{}").when().put("/audit").then().statusCode(405);
        given().when().delete("/audit").then().statusCode(405);
        given().contentType(ContentType.JSON).body("{}").when().put("/audit/{id}", id).then().statusCode(404);
        given().when().delete("/audit/{id}", id).then().statusCode(404);

        given()
                .queryParam("user", marker)
                .when().get("/audit")
                .then()
                .body("totalItems", equalTo(1))
                .body("items[0].id", equalTo(id));
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldKeepRecordsWhenTheAuditedDataIsRemoved() {
        List<Object> foreignKeys = QuarkusTransaction.requiringNew().call(() -> repository.getEntityManager()
                .createNativeQuery("""
                        select tc.constraint_name
                        from information_schema.table_constraints tc
                        join information_schema.constraint_column_usage ccu
                          on ccu.constraint_name = tc.constraint_name
                         and ccu.constraint_schema = tc.constraint_schema
                        where tc.constraint_type = 'FOREIGN KEY'
                          and tc.table_name in ('audit_records', 'audit_record_changes')
                          and ccu.table_name <> 'audit_records'
                        """)
                .getResultList());
        assertEquals(List.of(), foreignKeys);

        String email = "teste-consulta-auditoria-" + UUID.randomUUID() + "@financeos.local";
        String userId = given()
                .contentType(ContentType.JSON)
                .body("{ \"name\": \"Usuario Removido\", \"email\": \"%s\", \"password\": \"SenhaSecreta123\", \"profileId\": \"%s\" }"
                        .formatted(email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract().path("id");

        String profileName = PREFIX + " Perfil " + UUID.randomUUID();
        String profileId = given()
                .contentType(ContentType.JSON)
                .body("{ \"name\": \"%s\", \"permissions\": [ { \"screen\": \"DASHBOARD\", \"canView\": true } ] }"
                        .formatted(profileName))
                .when().post("/profiles")
                .then()
                .statusCode(201)
                .extract().path("id");

        QuarkusTransaction.requiringNew().run(() -> {
            userRepository.deleteById(UUID.fromString(userId));
            profileRepository.deleteById(UUID.fromString(profileId));
        });

        assertEquals(List.of("Usuario Removido"),
                probe.byRecord(UUID.fromString(userId)).stream().map(AuditProbe.Entry::recordLabel).toList());
        assertEquals(List.of(profileName),
                probe.byRecord(UUID.fromString(profileId)).stream().map(AuditProbe.Entry::recordLabel).toList());

    }

    private void assertBadRequest(String parameter, String value, String message) {
        given()
                .queryParam(parameter, value)
                .when().get("/audit")
                .then()
                .statusCode(400)
                .body("message", equalTo(message));
    }

    private static String marker() {
        return "Marcador" + UUID.randomUUID().toString().replace("-", "");
    }

    private void insert(String userName, String type, String action, String screen, OffsetDateTime occurredAt,
            boolean superAdmin, UUID userId) {
        QuarkusTransaction.requiringNew().run(() -> {
            AuditRecord record = new AuditRecord();
            record.occurredAt = occurredAt;
            record.eventType = type;
            record.action = action;
            record.screen = screen;
            record.userId = userId;
            record.userName = userName;
            record.userEmail = userName.toLowerCase().replace(' ', '.') + "@financeos.local";
            record.userSuperAdmin = superAdmin;
            record.recordId = UUID.randomUUID();
            record.recordLabel = "Registro " + userName;

            AuditRecordChange change = new AuditRecordChange();
            change.record = record;
            change.position = 0;
            change.fieldLabel = "Nome";
            change.oldValue = "Antes";
            change.newValue = "Depois";
            record.changes.add(change);

            repository.persist(record);
        });
    }
}
