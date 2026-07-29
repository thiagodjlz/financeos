package br.com.financeos.dashboard;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.financeos.transactions.FinancialTransaction;
import br.com.financeos.transactions.TransactionRepository;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
@TestSecurity(user = "dev@financeos.local")
@JwtSecurity(claims = {
        @Claim(key = "sub", value = "00000000-0000-0000-0000-000000000001")
})
class DashboardResourceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Inject
    TransactionRepository repository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("userId = ?1 and description like ?2", TEST_USER_ID, "Teste dashboard%");
    }

    @Test
    void shouldReturnMonthlySummary() {
        createTransaction("2026-06-05", "Teste dashboard salario", 5000, "INCOME", "PAID");
        createTransaction("2026-06-10", "Teste dashboard aluguel", 1200, "EXPENSE", "PAID");
        createTransaction("2026-06-15", "Teste dashboard mercado", 300, "EXPENSE", "PENDING");
        cancelTransaction(createTransaction("2026-06-20", "Teste dashboard cancelado", 90, "EXPENSE", "PENDING"));
        createTransaction("2026-07-01", "Teste dashboard julho", 40, "EXPENSE", "PAID");

        given()
                .queryParam("year", 2026)
                .queryParam("month", 6)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.year", equalTo(2026))
                .body("period.month", equalTo(6))
                .body("totalIncome", equalTo(5000.00F))
                .body("totalExpense", equalTo(1200.00F))
                .body("balance", equalTo(3800.00F))
                .body("paidExpense", equalTo(1200.00F))
                .body("pendingExpense", equalTo(300.00F))
                .body("transactionCount", equalTo(3))
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' && it.type == 'INCOME' }.totalAmount",
                        equalTo(5000.00F))
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' && it.type == 'EXPENSE' }.totalAmount",
                        equalTo(1200.00F))
                .body("monthlyEvolution[5].income", equalTo(5000.00F))
                .body("monthlyEvolution[5].expense", equalTo(1200.00F))
                .body("monthlyEvolution[6].expense", equalTo(40.00F));
    }

    @Test
    void shouldRejectIncompletePeriod() {
        given()
                .queryParam("year", 2026)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400)
                .body("message", equalTo("Informe o ano e o mês juntos."));
    }

    @Test
    void shouldRejectMonthOutOfRange() {
        given()
                .queryParam("year", 2026)
                .queryParam("month", 13)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400)
                .body("message", equalTo("O mês deve estar entre 1 e 12."));
    }

    // Persistido direto pelo repositorio: o POST /transactions passou a exigir categoria (issue #45)
    // e o agrupamento "Sem categoria" do DashboardRepository so e exercitado com category_id nulo.
    private String createTransaction(String date, String description, int amount, String type, String status) {
        return QuarkusTransaction.requiringNew().call(() -> {
            FinancialTransaction transaction = new FinancialTransaction();
            transaction.userId = TEST_USER_ID;
            transaction.categoryId = null;
            transaction.transactionDate = LocalDate.parse(date);
            transaction.description = description;
            transaction.amount = new BigDecimal(amount);
            transaction.type = TransactionType.valueOf(type);
            transaction.status = transaction.type == TransactionType.INCOME
                    ? null
                    : TransactionStatus.valueOf(status);
            transaction.source = TransactionSource.MANUAL;
            repository.persist(transaction);
            return transaction.id.toString();
        });
    }

    private static void cancelTransaction(String id) {
        given()
                .when().delete("/transactions/{id}", id)
                .then()
                .statusCode(204);
    }
}
