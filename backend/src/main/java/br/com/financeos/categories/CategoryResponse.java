package br.com.financeos.categories;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        UUID parentId,
        String name,
        CategoryType type,
        String color,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.id,
                category.parentId,
                category.name,
                category.type,
                category.color,
                category.active,
                category.createdAt,
                category.updatedAt);
    }
}
