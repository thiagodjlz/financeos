package br.com.financeos.documentation;

import java.util.List;

public record DocumentationBlock(
        Kind kind,
        String text,
        List<String> items,
        DocumentationTable table) {

    public enum Kind {
        PARAGRAPH,
        LIST,
        TABLE,
        HIGHLIGHT
    }

    public static DocumentationBlock paragraph(String text) {
        return new DocumentationBlock(Kind.PARAGRAPH, text, List.of(), null);
    }

    public static DocumentationBlock highlight(String text) {
        return new DocumentationBlock(Kind.HIGHLIGHT, text, List.of(), null);
    }

    public static DocumentationBlock list(String... items) {
        return new DocumentationBlock(Kind.LIST, null, List.of(items), null);
    }

    public static DocumentationBlock table(List<String> columns, List<List<String>> rows) {
        return new DocumentationBlock(Kind.TABLE, null, List.of(), new DocumentationTable(columns, rows));
    }
}
