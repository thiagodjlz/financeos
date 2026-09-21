package br.com.financeos.documentation;

import java.util.List;

public record DocumentationArea(
        String id,
        String title,
        String summary,
        List<DocumentationSection> sections) {
}
