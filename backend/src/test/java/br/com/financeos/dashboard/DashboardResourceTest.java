package br.com.financeos.dashboard;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import br.com.financeos.shared.DevUser;
import br.com.financeos.transactions.TransactionRepository;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
class DashboardResourceTest {

    @Inject
    TransactionRepository repository;

    @AfterEach
    @Transactional
    void cleanup() {
        repository.delete("userId = ?1 and description like ?2", DevUser.ID, "Teste dashboard%");
    }

    @Test
    void shouldReturnMonthlySummary() {
        createTransaction("2026-06-05", "Teste dashboard salario", 5000, "INCOME", "PAID");
        createTransaction("2026-06-10", "Teste dashboard aluguel", 1200, "EXPENSE", "PAID");
        createTransaction("2026-06-15", "Teste dashboard mercado", 300, "EXPENSE", "PENDING");
        createTransaction("2026-06-20", "Teste dashboard cancelado", 90, "EXPENSE", "CANCELED");
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
                .body("totalExpense", equalTo(1500.00F))
                .body("balance", equalTo(3500.00F))
                .body("paidExpense", equalTo(1200.00F))
                .body("pendingExpense", equalTo(300.00F))
                .body("transactionCount", equalTo(3))
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' && it.type == 'INCOME' }.totalAmount",
                        equalTo(5000.00F))
                .body("categoryBreakdown.find { it.categoryName == 'Sem categoria' && it.type == 'EXPENSE' }.totalAmount",
                        equalTo(1500.00F))
                .body("monthlyEvolution[5].income", equalTo(5000.00F))
                .body("monthlyEvolution[5].expense", equalTo(1500.00F))
                .body("monthlyEvolution[6].expense", equalTo(40.00F));
    }

    @Test
    void shouldRejectIncompletePeriod() {
        given()
                .queryParam("year", 2026)
                .when().get("/dashboard/summary")
                .then()
                .statusCode(400);
    }

    private static void createTransaction(String date, String description, int amount, String type, String status) {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "transactionDate": "%s",
                          "description": "%s",
                          "amount": %d,
                          "type": "%s",
                          "status": "%s"
                        }
                        """.formatted(date, description, amount, type, status))
                .when().post("/transactions")
                .then()
                .statusCode(201);
    }
}
