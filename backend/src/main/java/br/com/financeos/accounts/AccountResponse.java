package br.com.financeos.accounts;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        String name,
        AccountType type,
        BigDecimal initialBalance,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    public static AccountResponse from(Account account) {
        return new AccountResponse(
                account.id,
                account.name,
                account.type,
                account.initialBalance,
                account.active,
                account.createdAt,
                account.updatedAt);
    }
}
