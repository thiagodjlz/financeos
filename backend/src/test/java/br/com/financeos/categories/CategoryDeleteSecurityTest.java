package br.com.financeos.categories;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

// Classe sem @TestSecurity de classe: CategoryResourceTest autentica como o administrador, que tem
// todas as permissoes, e nao permitiria exercitar um perfil que ve Categorias mas nao pode excluir.
@QuarkusTest
class CategoryDeleteSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-0000000009e1";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000009e2";
    private static final String RESTRICTED_USER_EMAIL = "teste-categorias-sem-exclusao@financeos.local";

    private static final String ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    @Inject
    CategoryRepository categoryRepository;

    private UUID categoryId;

    @BeforeEach
    void createRestrictedUserAndCategory() {
        QuarkusTransaction.requiringNew().run(() -> {
            profileRepository.getEntityManager()
                    .createNativeQuery("insert into profiles (id, name) values (cast(?1 as uuid), ?2)")
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .setParameter(2, "Teste categorias sem exclusao")
                    .executeUpdate();

            profileRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into profile_permissions
                                (profile_id, screen, can_view, can_create, can_edit, can_delete)
                            values (cast(?1 as uuid), 'CATEGORIES', true, true, true, false)
                            """)
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste categorias")
                    .setParameter(3, RESTRICTED_USER_EMAIL)
                    .setParameter(4, "$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm")
                    .setParameter(5, RESTRICTED_PROFILE_ID)
                    .executeUpdate();
        });

        categoryId = QuarkusTransaction.requiringNew().call(() -> {
            Category category = new Category();
            category.name = "Teste Seguranca Exclusao " + UUID.randomUUID();
            category.type = CategoryType.EXPENSE;
            category.color = "#F59E0B";
            categoryRepository.persist(category);
            return category.id;
        });
    }

    @AfterEach
    void removeRestrictedUserAndCategory() {
        QuarkusTransaction.requiringNew().run(() -> {
            categoryRepository.delete("name like ?1", "Teste Seguranca Exclusao%");
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
    void shouldDenyDeleteWithoutPermission() {
        given()
                .when().delete("/categories/{id}", categoryId)
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));

        Category stored = QuarkusTransaction.requiringNew()
                .call(() -> categoryRepository.findByIdOptional(categoryId).orElseThrow());
        assertTrue(stored.active);
    }

    @Test
    @TestSecurity(user = RESTRICTED_USER_EMAIL)
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = RESTRICTED_USER_ID)
    })
    void shouldStillAllowViewingCategoriesWithoutDeletePermission() {
        given()
                .when().get("/categories")
                .then()
                .statusCode(200);
    }
}
