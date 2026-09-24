package br.com.financeos.documentation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import br.com.financeos.documentation.content.DocumentationContent;

class DocumentationContentTest {

    private static final int MAX_PARAGRAPH_LENGTH = 600;

    private static final Pattern REMOVED_OR_UNIMPLEMENTED = Pattern.compile(
            "Contas|Cartões|Cartoes|Relatórios|Relatorios|Excel|Recorrência|Recorrencia|Subcategoria",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern TECHNICAL_IDENTIFIER = Pattern.compile(
            "INCOME|EXPENSE|PENDING|PAID|CANCELED|Screen\\.|Action\\.|accessControl|@NotNull|@NotBlank"
                    + "|Panache|Flyway|ProfilePermission|localStorage|JWT");

    private static final DocumentationResponse CONTENT = DocumentationContent.build();

    private static Stream<DocumentationArea> allAreas() {
        return Stream.concat(Stream.of(CONTENT.introduction()), CONTENT.areas().stream());
    }

    private static List<String> displayedTexts() {
        List<String> texts = new ArrayList<>();
        texts.add(CONTENT.title());

        allAreas().forEach(area -> {
            texts.add(area.title());
            texts.add(area.summary());

            area.sections().forEach(section -> {
                texts.add(section.title());

                section.blocks().forEach(block -> {
                    if (block.text() != null) {
                        texts.add(block.text());
                    }
                    texts.addAll(block.items());
                    if (block.table() != null) {
                        texts.addAll(block.table().columns());
                        block.table().rows().forEach(texts::addAll);
                    }
                });
            });
        });

        return texts;
    }

    @Test
    void shouldPublishIntroductionAndFiveAreas() {
        assertTrue(CONTENT.title() != null && !CONTENT.title().isBlank());
        assertTrue(CONTENT.introduction() != null);
        assertEquals(5, CONTENT.areas().size());
        assertEquals(
                List.of("Resumo", "Lançamentos", "Categorias", "Usuários", "Perfis"),
                CONTENT.areas().stream().map(DocumentationArea::title).toList());
    }

    @Test
    void shouldGiveEveryAreaAUniqueIdentifier() {
        List<String> ids = allAreas().map(DocumentationArea::id).toList();

        ids.forEach(id -> assertTrue(id != null && !id.isBlank()));
        assertEquals(ids.size(), ids.stream().distinct().count());
    }

    @Test
    void shouldPublishTheMinimumSectionsOfEveryArea() {
        CONTENT.areas().forEach(area -> {
            List<String> titles = area.sections().stream().map(DocumentationSection::title).toList();

            List.of("Descrição", "Funcionalidades", "Regras de negócio", "Ações")
                    .forEach(required -> assertTrue(titles.contains(required),
                            area.title() + " sem a seção " + required));
        });
    }

    @Test
    void shouldNotPublishEmptySection() {
        allAreas().forEach(area -> {
            assertFalse(area.sections().isEmpty(), area.title() + " sem seção");

            area.sections().forEach(section -> {
                assertTrue(section.title() != null && !section.title().isBlank());
                assertFalse(section.blocks().isEmpty(), section.title() + " sem bloco");

                section.blocks().forEach(block -> {
                    boolean hasContent = switch (block.kind()) {
                        case PARAGRAPH, HIGHLIGHT -> block.text() != null && !block.text().isBlank();
                        case LIST -> !block.items().isEmpty()
                                && block.items().stream().noneMatch(String::isBlank);
                        case TABLE -> block.table() != null
                                && !block.table().columns().isEmpty()
                                && !block.table().rows().isEmpty();
                    };

                    assertTrue(hasContent, "Bloco sem conteúdo em " + section.title());
                });
            });
        });
    }

    @Test
    void shouldNotMentionRemovedOrUnimplementedFeatures() {
        allAreas().forEach(area -> {
            assertFalse(REMOVED_OR_UNIMPLEMENTED.matcher(area.title()).find(), area.title());

            area.sections().forEach(section -> assertFalse(
                    REMOVED_OR_UNIMPLEMENTED.matcher(section.title()).find(), section.title()));
        });
    }

    @Test
    void shouldNotExposeTechnicalIdentifiers() {
        displayedTexts().forEach(text -> assertFalse(
                TECHNICAL_IDENTIFIER.matcher(text).find(), "Identificador técnico exibido: " + text));
    }

    @Test
    void shouldKeepParagraphsShort() {
        allAreas().forEach(area -> area.sections().forEach(section -> section.blocks().forEach(block -> {
            if (block.text() != null) {
                assertTrue(block.text().length() <= MAX_PARAGRAPH_LENGTH,
                        "Parágrafo com " + block.text().length() + " caracteres em " + section.title());
            }
        })));
    }

    @Test
    void shouldExplainTheBackToTopButtonInHowToNavigate() {
        DocumentationSection navegacao = CONTENT.introduction().sections().stream()
                .filter(section -> "Como navegar".equals(section.title()))
                .findFirst()
                .orElseThrow();

        assertTrue(navegacao.blocks().stream()
                .anyMatch(block -> block.text() != null && block.text().contains("Voltar ao topo")));
    }

    @Test
    void shouldExplainOwnAccountProtectionsInUsersBusinessRules() {
        DocumentationSection regras = CONTENT.areas().stream()
                .filter(area -> "Usuários".equals(area.title()))
                .findFirst()
                .orElseThrow()
                .sections().stream()
                .filter(section -> "Regras de negócio".equals(section.title()))
                .findFirst()
                .orElseThrow();

        String highlight = regras.blocks().stream()
                .filter(block -> block.kind() == DocumentationBlock.Kind.HIGHLIGHT)
                .map(DocumentationBlock::text)
                .findFirst()
                .orElseThrow();

        assertTrue(highlight.contains("botão Desativar"), highlight);
        assertTrue(highlight.contains("Status"), highlight);
        assertTrue(highlight.contains("Inativo"), highlight);
        assertTrue(highlight.contains("próprio perfil"), highlight);
        assertTrue(highlight.contains("Você não pode desativar a própria conta."), highlight);
        assertTrue(highlight.contains("Você não pode alterar o próprio perfil."), highlight);
    }

    @Test
    void shouldDescribeDefinitiveCategoryDeletion() {
        String published = String.join("\n", displayedTexts());

        assertFalse(published.contains("Excluir uma categoria significa apenas torná-la Inativa"));
        assertFalse(published.contains("uma desativação em Categorias"));

        String categoryRules = CONTENT.areas().stream()
                .filter(area -> "Categorias".equals(area.title()))
                .findFirst()
                .orElseThrow()
                .sections().stream()
                .filter(section -> "Regras de negócio".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .flatMap(block -> block.items().stream())
                .reduce("", (left, right) -> left + "\n" + right);

        assertTrue(categoryRules.contains("remove definitivamente"), categoryRules);
        assertTrue(categoryRules.contains("Não é possível excluir a categoria"), categoryRules);
        assertTrue(categoryRules.contains("qualquer que seja a pessoa"), categoryRules);
        assertTrue(categoryRules.contains("cancelado"), categoryRules);
        assertTrue(categoryRules.contains("Situação"), categoryRules);
    }

    @Test
    void shouldKeepEveryTableRowAlignedWithItsColumns() {
        allAreas().forEach(area -> area.sections().forEach(section -> section.blocks().forEach(block -> {
            if (block.table() != null) {
                int columns = block.table().columns().size();

                block.table().rows().forEach(row -> assertEquals(columns, row.size(),
                        "Linha de tabela fora do número de colunas em " + section.title()));
            }
        })));
    }

    private static final List<String> REGISTRATION_AREAS =
            List.of("Lançamentos", "Categorias", "Usuários", "Perfis");

    private static final Pattern INLINE_EDITING_OR_SIDE_FORM = Pattern.compile(
            "à esquerda|à direita|na própria linha|na linha da tabela|ali mesmo na tabela|formulário lateral"
                    + "|Sair \\(linha\\)|Salvar \\(linha\\)");

    private static String areaText(DocumentationArea area) {
        List<String> texts = new ArrayList<>();
        texts.add(area.summary());
        area.sections().forEach(section -> section.blocks().forEach(block -> {
            if (block.text() != null) {
                texts.add(block.text());
            }
            texts.addAll(block.items());
            if (block.table() != null) {
                block.table().rows().forEach(texts::addAll);
            }
        }));
        return String.join("\n", texts);
    }

    @Test
    void shouldNotDescribeSideFormNorInlineEditingInAnyArea() {
        CONTENT.areas().forEach(area -> assertFalse(
                INLINE_EDITING_OR_SIDE_FORM.matcher(areaText(area)).find(),
                area.title() + " ainda descreve formulário lateral ou edição na linha"));
    }

    @Test
    void shouldDescribeIncludeEditFiltersAndPaginationInRegistrationAreas() {
        CONTENT.areas().stream()
                .filter(area -> REGISTRATION_AREAS.contains(area.title()))
                .forEach(area -> {
                    String text = areaText(area);

                    List.of("Incluir", "Editar", "tela própria", "Filtros", "Anterior", "Próxima", "por página")
                            .forEach(expected -> assertTrue(text.contains(expected),
                                    area.title() + " sem mencionar " + expected));
                });
    }
}
