package br.com.financeos.documentation;

import java.util.List;

public record DocumentationTable(List<String> columns, List<List<String>> rows) {
}
