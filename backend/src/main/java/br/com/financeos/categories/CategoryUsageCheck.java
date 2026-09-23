package br.com.financeos.categories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.ToLongFunction;

import br.com.financeos.transactions.TransactionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CategoryUsageCheck {

    record UsageType(String screenLabel, ToLongFunction<UUID> counter) {
    }

    private static final String BLOCKING_HEADER = "Não é possível excluir a categoria. Ela está em uso em:";

    private final List<UsageType> usageTypes;

    // Subcategorias e itens de planejamento ficam de fora de proposito: o banco solta o vinculo
    // (on delete set null) e nenhum deles tem tela para o usuario conferir.
    @Inject
    public CategoryUsageCheck(TransactionRepository transactionRepository) {
        this(List.of(new UsageType("Lançamentos", id -> transactionRepository.count("categoryId", id))));
    }

    CategoryUsageCheck(List<UsageType> usageTypes) {
        this.usageTypes = List.copyOf(usageTypes);
    }

    public List<CategoryUsage> usagesOf(UUID categoryId) {
        return usageTypes.stream()
                .map(type -> new CategoryUsage(type.screenLabel(), type.counter().applyAsLong(categoryId)))
                .toList();
    }

    public static Optional<String> blockingMessage(List<CategoryUsage> usages) {
        List<CategoryUsage> blocking = usages.stream()
                .filter(usage -> usage.count() > 0)
                .toList();

        if (blocking.isEmpty()) {
            return Optional.empty();
        }

        StringBuilder message = new StringBuilder(BLOCKING_HEADER);
        for (CategoryUsage usage : blocking) {
            message.append('\n')
                    .append(usage.screenLabel())
                    .append(": ")
                    .append(usage.count())
                    .append(usage.count() == 1 ? " registro" : " registros");
        }

        return Optional.of(message.toString());
    }
}
