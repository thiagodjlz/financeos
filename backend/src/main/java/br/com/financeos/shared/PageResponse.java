package br.com.financeos.shared;

import java.util.List;
import java.util.function.Function;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;

public record PageResponse<T>(List<T> items, long totalItems, int totalPages, int page, int size) {

    public static <E, T> PageResponse<T> of(PanacheQuery<E> query, ListParams params, Function<E, T> mapper) {
        long totalItems = query.count();
        int totalPages = (int) ((totalItems + params.size() - 1) / params.size());

        // Página muito além da última (ex.: page=999999999) estouraria o offset inteiro do Panache:
        // qualquer página maior que o total já é, por definição, vazia.
        List<T> items = params.page() > totalPages
                ? List.of()
                : query.page(Page.of(params.page() - 1, params.size())).list().stream().map(mapper).toList();

        return new PageResponse<>(items, totalItems, totalPages, params.page(), params.size());
    }
}
