package br.com.financeos.categories;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import br.com.financeos.categories.CategoryUsageCheck.UsageType;

class CategoryUsageCheckTest {

    private static final UUID CATEGORY_ID = UUID.randomUUID();

    @Test
    void shouldGroupMessageByScreenOmittingScreensWithoutUsage() {
        CategoryUsageCheck check = new CategoryUsageCheck(List.of(
                new UsageType("Lançamentos", id -> 3),
                new UsageType("Metas", id -> 0),
                new UsageType("Contas", id -> 1)));

        String message = CategoryUsageCheck.blockingMessage(check.usagesOf(CATEGORY_ID)).orElseThrow();

        assertEquals("""
                Não é possível excluir a categoria. Ela está em uso em:
                Lançamentos: 3 registros
                Contas: 1 registro""", message);
        assertFalse(message.contains("Metas"));
        for (String technical : List.of("transactions", "category_id", "categoryId", "FinancialTransaction",
                "CANCELED", "TransactionRepository")) {
            assertFalse(message.contains(technical), technical);
        }
    }

    @Test
    void shouldCountEachUsageTypeWithTheGivenCategory() {
        CategoryUsageCheck check = new CategoryUsageCheck(List.of(
                new UsageType("Lançamentos", id -> id.equals(CATEGORY_ID) ? 5 : 0),
                new UsageType("Metas", id -> id.equals(CATEGORY_ID) ? 2 : 0)));

        assertEquals(List.of(new CategoryUsage("Lançamentos", 5), new CategoryUsage("Metas", 2)),
                check.usagesOf(CATEGORY_ID));
        assertEquals(List.of(new CategoryUsage("Lançamentos", 0), new CategoryUsage("Metas", 0)),
                check.usagesOf(UUID.randomUUID()));
    }

    @Test
    void shouldNotBlockWhenEveryUsageIsZero() {
        Optional<String> message = CategoryUsageCheck.blockingMessage(List.of(
                new CategoryUsage("Lançamentos", 0),
                new CategoryUsage("Metas", 0)));

        assertTrue(message.isEmpty());
    }

    @Test
    void shouldNotBlockWithoutUsageTypes() {
        assertTrue(CategoryUsageCheck.blockingMessage(new CategoryUsageCheck(List.of()).usagesOf(CATEGORY_ID))
                .isEmpty());
    }
}
