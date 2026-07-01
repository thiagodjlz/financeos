package br.com.financeos.cards;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CardResponse(
        UUID id,
        UUID accountId,
        String name,
        String brand,
        BigDecimal creditLimit,
        Short closingDay,
        Short dueDay,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    public static CardResponse from(Card card) {
        return new CardResponse(
                card.id,
                card.accountId,
                card.name,
                card.brand,
                card.creditLimit,
                card.closingDay,
                card.dueDay,
                card.active,
                card.createdAt,
                card.updatedAt);
    }
}
