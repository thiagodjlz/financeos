package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationResponse;

public final class DocumentationContent {

    private DocumentationContent() {
    }

    public static DocumentationResponse build() {
        return new DocumentationResponse(
                "Central de Documentação",
                OverviewContent.build(),
                List.of(
                        SummaryAreaContent.build(),
                        TransactionsAreaContent.build(),
                        CategoriesAreaContent.build(),
                        UsersAreaContent.build(),
                        ProfilesAreaContent.build()));
    }
}
