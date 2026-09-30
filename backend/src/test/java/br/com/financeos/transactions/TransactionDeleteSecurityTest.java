package br.com.financeos.transactions;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
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

// Classe sem @TestSecurity de classe: TransactionResourceTest autentica como o administrador, que tem
// todas as permissoes, e nao permitiria exercitar um perfil que ve Lancamentos mas nao pode excluir.
@QuarkusTest
class TransactionDeleteSecurityTest {

    private static final String RESTRICTED_USER_ID = "00000000-0000-0000-0000-0000000010e1";
    private static final String RESTRICTED_PROFILE_ID = "00000000-0000-0000-0000-0000000010e2";
    private static final String RESTRICTED_USER_EMAIL = "teste-lancamentos-sem-exclusao@financeos.local";

    private static final String ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação.";

    @Inject
    AppUserRepository userRepository;

    @Inject
    ProfileRepository profileRepository;

    @Inject
    TransactionRepository transactionRepository;

    private UUID transactionId;

    @BeforeEach
    void createRestrictedUserAndTransaction() {
        QuarkusTransaction.requiringNew().run(() -> {
            profileRepository.getEntityManager()
                    .createNativeQuery("insert into profiles (id, name) values (cast(?1 as uuid), ?2)")
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .setParameter(2, "Teste lancamentos sem exclusao")
                    .executeUpdate();

            profileRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into profile_permissions
                                (profile_id, screen, can_view, can_create, can_edit, can_delete)
                            values (cast(?1 as uuid), 'TRANSACTIONS', true, true, true, false)
                            """)
                    .setParameter(1, RESTRICTED_PROFILE_ID)
                    .executeUpdate();

            userRepository.getEntityManager()
                    .createNativeQuery("""
                            insert into app_users (id, name, email, password_hash, profile_id, super_admin)
                            values (cast(?1 as uuid), ?2, ?3, ?4, cast(?5 as uuid), false)
                            """)
                    .setParameter(1, RESTRICTED_USER_ID)
                    .setParameter(2, "Teste lancamentos")
                    .setParameter(3, RESTRICTED_USER_EMAIL)
                    .setParameter(4, "$2a$10$XkNvynD0Tr39JcSNBBMwjOXy6DZJZOdQ4LBFpAAC9yCqwHFWmWtBm")
                    .setParameter(5, RESTRICTED_PROFILE_ID)
                    .executeUpdate();
        });

        transactionId = QuarkusTransaction.requiringNew().call(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = UUID.fromString(RESTRICTED_USER_ID);
            transaction.description = "Teste seguranca exclusao " + UUID.randomUUID();
            transaction.transactionDate = LocalDate.of(2026, 6, 30);
            transaction.amount = new BigDecimal("10.00");
            transaction.type = TransactionType.EXPENSE;
            transaction.status = TransactionStatus.PENDING;
            transactionRepository.persist(transaction);
            return transaction.id;
        });
    }

    @AfterEach
    void removeRestrictedUserAndTransaction() {
        QuarkusTransaction.requiringNew().run(() -> {
            transactionRepository.delete("userId", UUID.fromString(RESTRICTED_USER_ID));
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
                .when().delete("/transactions/{id}", transactionId)
                .then()
                .statusCode(403)
                .body("message", equalTo(ACCESS_DENIED_MESSAGE));

        FinancialTransaction stored = QuarkusTransaction.requiringNew()
                .call(() -> transactionRepository.findByIdOptional(transactionId).orElseThrow());
        assertEquals(TransactionStatus.PENDING, stored.status);
    }
}
