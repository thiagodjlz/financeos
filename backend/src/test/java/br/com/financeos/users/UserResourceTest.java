package br.com.financeos.users;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;

import br.com.financeos.profiles.ProfileRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class UserResourceTest {

    private static final String ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000010";
    private static final String OWN_USER_ID = "00000000-0000-0000-0000-000000000001";
    private static final String SUPER_ADMIN_ID = "00000000-0000-0000-0000-000000000099";
    private static final String OTHER_PROFILE_ID = "00000000-0000-0000-0000-0000000009d2";
    private static final String OTHER_PROFILE_NAME = "Teste usuarios perfil alternativo";

    @Inject
    AppUserRepository repository;

    @Inject
    ProfileRepository profileRepository;

    private OwnUserSnapshot ownSnapshot;

    // O usuario ...0001 e o mesmo de todas as classes @QuarkusTest: se um teste o deixasse inativo ou em
    // outro perfil, as classes seguintes cairiam em 403 longe da causa. A restauracao vai pelo repositorio
    // porque o proprio PUT recusaria desfazer uma desativacao ou troca de perfil da propria conta.
    @BeforeEach
    void setUp() {
        QuarkusTransaction.requiringNew().run(() -> {
            AppUser own = repository.findById(UUID.fromString(OWN_USER_ID));
            ownSnapshot = new OwnUserSnapshot(own.name, own.email, own.profileId, own.active);

            profileRepository.getEntityManager()
                    .createNativeQuery("insert into profiles (id, name) values (cast(?1 as uuid), ?2)")
                    .setParameter(1, OTHER_PROFILE_ID)
                    .setParameter(2, OTHER_PROFILE_NAME)
                    .executeUpdate();
        });
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            AppUser own = repository.findById(UUID.fromString(OWN_USER_ID));
            own.name = ownSnapshot.name();
            own.email = ownSnapshot.email();
            own.profileId = ownSnapshot.profileId();
            own.active = ownSnapshot.active();
            repository.flush();

            repository.delete("email like ?1", "teste-usuarios-%");
            profileRepository.getEntityManager()
                    .createNativeQuery("delete from profile_permissions where profile_id = cast(?1 as uuid)")
                    .setParameter(1, OTHER_PROFILE_ID)
                    .executeUpdate();
            profileRepository.deleteById(UUID.fromString(OTHER_PROFILE_ID));
        });
    }

    private record OwnUserSnapshot(String name, String email, UUID profileId, boolean active) {
    }

    @Test
    void shouldReturnPortugueseMessageForMalformedEmail() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste",
                          "email": "abc",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("Informe um e-mail válido."));
    }

    @Test
    void shouldReturnPortugueseMessageForPasswordOutOfRange() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste",
                          "email": "teste-usuarios-%s@financeos.local",
                          "password": "123",
                          "profileId": "%s"
                        }
                        """.formatted(UUID.randomUUID(), ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha deve ter entre 8 e 72 caracteres."));
    }

    @Test
    void shouldReturnPortugueseMessagesForBlankRequiredFields() {
        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome é obrigatório."))
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("O e-mail é obrigatório."))
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha é obrigatória."))
                .body("violations.find { it.field.endsWith('.profileId') }.message",
                        equalTo("O perfil é obrigatório."))
                .body("message",
                        equalTo("Informe os campos obrigatórios: Nome, E-mail, Senha, Perfil."));
    }

    @Test
    void shouldReturnPortugueseMessagesForOversizedNameAndEmail() {
        String oversizedWellFormedEmail =
                "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(48) + ".com";

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted("a".repeat(121), oversizedWellFormedEmail, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.name') }.message",
                        equalTo("O nome deve ter no máximo 120 caracteres."))
                .body("violations.find { it.field.endsWith('.email') }.message",
                        equalTo("O e-mail deve ter no máximo 180 caracteres."));
    }

    @Test
    void shouldRejectDuplicateEmailOnUpdate() {
        String firstEmail = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";
        String secondEmail = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Um",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(firstEmail, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201);

        String secondId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Dois",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(secondEmail, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Dois",
                          "email": "%s",
                          "profileId": "%s",
                          "active": true
                        }
                        """.formatted(firstEmail, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", secondId)
                .then()
                .statusCode(409)
                .body("message", equalTo("E-mail já cadastrado."));
    }

    @Test
    void shouldRejectDeactivatingOwnAccount() {
        given()
                .when().delete("/users/{id}", "00000000-0000-0000-0000-000000000001")
                .then()
                .statusCode(409)
                .body("message", equalTo("Você não pode desativar a própria conta."));
    }

    @Test
    void shouldAllowKeepingOwnEmailOnUpdate() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Mesmo Email",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Mesmo Email Editado",
                          "email": "%s",
                          "profileId": "%s",
                          "active": true
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Usuario Teste Mesmo Email Editado"));
    }

    @Test
    void shouldRejectNonexistentProfileOnCreate() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Perfil Invalido",
                          "email": "teste-usuarios-%s@financeos.local",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(UUID.randomUUID(), UUID.randomUUID()))
                .when().post("/users")
                .then()
                .statusCode(400)
                .body("message", equalTo("Perfil informado não existe."));
    }

    @Test
    void shouldReturnPortugueseMessageForShortPasswordOnUpdate() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";

        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Update",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Usuario Teste Update",
                          "email": "%s",
                          "profileId": "%s",
                          "active": true,
                          "password": "123"
                        }
                        """.formatted(email, ADMIN_PROFILE_ID))
                .when().put("/users/{id}", id)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.password') }.message",
                        equalTo("A senha deve ter entre 8 e 72 caracteres."));
    }

    @Test
    void shouldRejectDeactivatingOwnAccountOnUpdate() {
        Map<String, Object> before = findUser(OWN_USER_ID);

        putUser(OWN_USER_ID, (String) before.get("name"), (String) before.get("email"),
                (String) before.get("profileId"), "false")
                .then()
                .statusCode(409)
                .body("message", equalTo("Você não pode desativar a própria conta."));

        Map<String, Object> after = findUser(OWN_USER_ID);
        assertUnchanged(before, after);
        assertEquals(true, after.get("active"));
    }

    @Test
    void shouldRejectChangingOwnProfileOnUpdate() {
        Map<String, Object> before = findUser(OWN_USER_ID);

        putUser(OWN_USER_ID, before.get("name") + " Alterado", (String) before.get("email"),
                OTHER_PROFILE_ID, "true")
                .then()
                .statusCode(409)
                .body("message", equalTo("Você não pode alterar o próprio perfil."));

        assertUnchanged(before, findUser(OWN_USER_ID));
    }

    @Test
    void shouldRejectDeactivatingAndChangingOwnProfileTogether() {
        Map<String, Object> before = findUser(OWN_USER_ID);

        putUser(OWN_USER_ID, (String) before.get("name"), (String) before.get("email"),
                OTHER_PROFILE_ID, "false")
                .then()
                .statusCode(409)
                .body("message", equalTo("Você não pode desativar a própria conta."));

        assertUnchanged(before, findUser(OWN_USER_ID));
    }

    @Test
    void shouldAllowUpdatingOwnNameKeepingProfileAndActive() {
        Map<String, Object> before = findUser(OWN_USER_ID);
        String newName = before.get("name") + " Editado";

        putUser(OWN_USER_ID, newName, (String) before.get("email"), (String) before.get("profileId"), "true")
                .then()
                .statusCode(200)
                .body("name", equalTo(newName));

        Map<String, Object> after = findUser(OWN_USER_ID);
        assertEquals(newName, after.get("name"));
        assertEquals(before.get("email"), after.get("email"));
        assertEquals(before.get("profileId"), after.get("profileId"));
        assertEquals(true, after.get("active"));
    }

    @Test
    void shouldRejectNonexistentProfileOnOwnUpdateAsBadRequest() {
        Map<String, Object> before = findUser(OWN_USER_ID);

        putUser(OWN_USER_ID, (String) before.get("name"), (String) before.get("email"),
                UUID.randomUUID().toString(), "true")
                .then()
                .statusCode(400)
                .body("message", equalTo("Perfil informado não existe."));

        assertUnchanged(before, findUser(OWN_USER_ID));
    }

    @Test
    void shouldAllowDeactivatingAnotherUserOnUpdate() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";
        String id = createUser("Usuário Teste Desativar", email);

        putUser(id, "Usuário Teste Desativar", email, ADMIN_PROFILE_ID, "false")
                .then()
                .statusCode(200)
                .body("active", equalTo(false));

        assertEquals(false, findUser(id).get("active"));
    }

    @Test
    void shouldAllowChangingAnotherUserProfileOnUpdate() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";
        String id = createUser("Usuário Teste Perfil", email);

        putUser(id, "Usuário Teste Perfil", email, OTHER_PROFILE_ID, "true")
                .then()
                .statusCode(200)
                .body("profileId", equalTo(OTHER_PROFILE_ID))
                .body("profileName", equalTo(OTHER_PROFILE_NAME));

        assertEquals(OTHER_PROFILE_ID, findUser(id).get("profileId"));
        assertEquals(OTHER_PROFILE_NAME, findUser(id).get("profileName"));
    }

    @Test
    void shouldReturnProfileNameInListAndDetail() {
        String prefix = "teste-usuarios-n-" + UUID.randomUUID().toString().substring(0, 8);
        String adminProfileName = QuarkusTransaction.requiringNew()
                .call(() -> profileRepository.findById(UUID.fromString(ADMIN_PROFILE_ID)).name);

        String withProfile = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "Teste Nome Perfil A",
                          "email": "%s-a@financeos.local",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(prefix, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .body("profileName", equalTo(adminProfileName))
                .extract()
                .path("id");

        UUID withoutProfile = QuarkusTransaction.requiringNew().call(() -> {
            AppUser user = new AppUser();
            user.name = "Teste Nome Perfil B";
            user.email = prefix + "-b@financeos.local";
            user.passwordHash = "sem-login";
            repository.persist(user);
            return user.id;
        });

        given()
                .queryParam("email", prefix)
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(2))
                .body("items[0].id", equalTo(withProfile))
                .body("items[0].profileName", equalTo(adminProfileName))
                .body("items[1].id", equalTo(withoutProfile.toString()))
                .body("items[1].profileId", nullValue())
                .body("items[1].profileName", nullValue());

        assertEquals(adminProfileName, findUser(withProfile).get("profileName"));
        assertEquals(null, findUser(withoutProfile.toString()).get("profileName"));
    }

    @Test
    void shouldRequireActiveOnUpdateForOwnAccount() {
        Map<String, Object> before = findUser(OWN_USER_ID);
        String name = (String) before.get("name");
        String email = (String) before.get("email");
        String profileId = (String) before.get("profileId");

        assertActiveRequired(OWN_USER_ID, name, email, profileId, null);
        assertActiveRequired(OWN_USER_ID, name, email, profileId, "null");

        assertUnchanged(before, findUser(OWN_USER_ID));
    }

    @Test
    void shouldRequireActiveOnUpdateForAnotherUser() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";
        String id = createUser("Usuário Teste Situação", email);
        Map<String, Object> before = findUser(id);

        assertActiveRequired(id, "Usuário Teste Situação Editado", email, ADMIN_PROFILE_ID, null);
        assertActiveRequired(id, "Usuário Teste Situação Editado", email, ADMIN_PROFILE_ID, "null");

        Map<String, Object> after = findUser(id);
        assertUnchanged(before, after);
        assertEquals(true, after.get("active"));
    }

    @Test
    void shouldDeactivateAnotherUserOnDelete() {
        String email = "teste-usuarios-" + UUID.randomUUID() + "@financeos.local";
        String id = createUser("Usuário Teste Exclusão", email);

        given()
                .when().delete("/users/{id}", id)
                .then()
                .statusCode(204);

        assertEquals(false, findUser(id).get("active"));
    }

    @Test
    void shouldReturnNotFoundWhenUpdatingHiddenSuperAdmin() {
        putUser(SUPER_ADMIN_ID, "Proprietário", "teste-usuarios-" + UUID.randomUUID() + "@financeos.local",
                ADMIN_PROFILE_ID, "false")
                .then()
                .statusCode(404);
    }

    private static void assertActiveRequired(String id, String name, String email, String profileId,
            String active) {
        putUser(id, name, email, profileId, active)
                .then()
                .statusCode(400)
                .body("violations.find { it.field.endsWith('.active') }.message",
                        equalTo("A situação é obrigatória."))
                .body("message", containsString("Situação"));
    }

    private static void assertUnchanged(Map<String, Object> before, Map<String, Object> after) {
        assertEquals(before.get("name"), after.get("name"));
        assertEquals(before.get("email"), after.get("email"));
        assertEquals(before.get("profileId"), after.get("profileId"));
        assertEquals(before.get("active"), after.get("active"));
    }

    private static Response putUser(String id, String name, String email, String profileId, String active) {
        String activeField = active == null ? "" : ",\n  \"active\": " + active;
        return given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "email": "%s",
                          "profileId": "%s"%s
                        }
                        """.formatted(name, email, profileId, activeField))
                .when().put("/users/{id}", id);
    }

    private static String createUser(String name, String email) {
        return given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "name": "%s",
                          "email": "%s",
                          "password": "senha-valida",
                          "profileId": "%s"
                        }
                        """.formatted(name, email, ADMIN_PROFILE_ID))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private static Map<String, Object> findUser(String id) {
        Map<String, Object> user = given()
                .when().get("/users/{id}", id)
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getMap("$");
        assertNotNull(user, "Usuário " + id + " não foi encontrado.");
        return user;
    }

    @Test
    void shouldPaginateUsersWithTotals() {
        String prefix = "teste-usuarios-p-" + UUID.randomUUID().toString().substring(0, 8);
        for (int i = 1; i <= 11; i++) {
            createUser("Teste Pagina %02d".formatted(i), prefix + "-%02d@financeos.local".formatted(i));
        }

        given()
                .queryParam("email", prefix)
                .queryParam("size", 10)
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("items.size()", equalTo(10))
                .body("items[0].name", equalTo("Teste Pagina 01"))
                .body("totalItems", equalTo(11))
                .body("totalPages", equalTo(2));

        given()
                .queryParam("email", prefix)
                .queryParam("page", 2)
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("items.size()", equalTo(1))
                .body("items[0].name", equalTo("Teste Pagina 11"));

        given()
                .queryParam("email", prefix)
                .queryParam("page", 3)
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("items.size()", equalTo(0))
                .body("totalItems", equalTo(11))
                .body("totalPages", equalTo(2));
    }

    @Test
    void shouldCombineUserFiltersIgnoringCaseAndAccents() {
        String prefix = "teste-usuarios-f-" + UUID.randomUUID().toString().substring(0, 8);
        String target = createUser("Teste João Filtro", prefix + "-alvo@financeos.local");
        String inactive = createUser("Teste João Filtro", prefix + "-inativo@financeos.local");
        createUser("Teste Maria Filtro", prefix + "-outro@financeos.local");
        putUser(target, "Teste João Filtro", prefix + "-alvo@financeos.local", OTHER_PROFILE_ID, "true")
                .then().statusCode(200);
        putUser(inactive, "Teste João Filtro", prefix + "-inativo@financeos.local", OTHER_PROFILE_ID, "false")
                .then().statusCode(200);

        given()
                .queryParam("name", "JOAO filtro")
                .queryParam("email", prefix)
                .queryParam("profileId", OTHER_PROFILE_ID)
                .queryParam("active", "true")
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("totalItems", equalTo(1))
                .body("items[0].id", equalTo(target));
    }

    @Test
    void shouldNeverListNorCountHiddenSuperAdmin() {
        int total = given()
                .queryParam("active", "true")
                .when().get("/users")
                .then()
                .statusCode(200)
                .extract()
                .path("totalItems");
        long visibleActive = QuarkusTransaction.requiringNew()
                .call(() -> repository.count("superAdmin = false and active = true"));
        assertEquals(visibleActive, total);

        for (int page = 1; page <= (total + 9) / 10; page++) {
            given()
                    .queryParam("page", page)
                    .when().get("/users")
                    .then()
                    .statusCode(200)
                    .body("items.id", not(hasItem(SUPER_ADMIN_ID)));
        }

        given()
                .when().get("/users/{id}", SUPER_ADMIN_ID)
                .then()
                .statusCode(404);
    }

    @Test
    void shouldRejectMalformedUserFiltersInPortuguese() {
        given()
                .queryParam("profileId", "abc")
                .when().get("/users")
                .then()
                .statusCode(400)
                .body("message", equalTo("O perfil informado é inválido."));

        given()
                .queryParam("active", "sim")
                .when().get("/users")
                .then()
                .statusCode(400)
                .body("message", equalTo("A situação informada é inválida."));

        given()
                .queryParam("size", "-3")
                .when().get("/users")
                .then()
                .statusCode(400)
                .body("message", equalTo("O tamanho da página deve ser um número entre 1 e 10."));
    }
}
