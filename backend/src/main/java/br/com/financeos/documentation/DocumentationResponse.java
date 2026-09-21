package br.com.financeos.documentation;

import java.util.List;

public record DocumentationResponse(
        String title,
        DocumentationArea introduction,
        List<DocumentationArea> areas) {
}
