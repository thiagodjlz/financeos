package br.com.financeos.documentation;

import java.util.List;

public record DocumentationSection(String title, List<DocumentationBlock> blocks) {

    public static DocumentationSection of(String title, DocumentationBlock... blocks) {
        return new DocumentationSection(title, List.of(blocks));
    }
}
