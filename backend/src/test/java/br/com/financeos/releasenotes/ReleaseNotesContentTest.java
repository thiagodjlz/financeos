package br.com.financeos.releasenotes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

import br.com.financeos.releasenotes.content.ReleaseNotesContent;

class ReleaseNotesContentTest {

    private static final Pattern TECHNICAL_IDENTIFIER = Pattern.compile(
            "INCOME|EXPENSE|PENDING|PAID|CANCELED|Screen\\.|Action\\.|accessControl|@NotNull|@NotBlank"
                    + "|Panache|Flyway|ProfilePermission|localStorage|JWT",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern INFRASTRUCTURE_TERM = Pattern.compile(
            "Tailscale|HTTPS|Docker|deploy|hospedagem|Flyway|migration|endpoint|\\bAPI\\b|banco de dados"
                    + "|\\btoken\\b|Caddy|Swagger|framework|JWT",
            Pattern.CASE_INSENSITIVE);

    private static final List<ReleaseNoteVersion> VERSIONS = ReleaseNotesContent.build();

    private static List<String> displayedTexts() {
        List<String> texts = new ArrayList<>();

        VERSIONS.forEach(version -> {
            texts.add(version.version());
            version.categories().forEach(category -> texts.addAll(category.items()));
        });

        return texts;
    }

    @Test
    void shouldNeverPublishVersion101() {
        VERSIONS.forEach(version -> assertFalse("1.0.1".equals(version.version()), version.version()));
    }

    @Test
    void shouldHave102AsTheOldestBlock() {
        assertFalse(VERSIONS.isEmpty());
        assertEquals("1.0.2", VERSIONS.get(VERSIONS.size() - 1).version());
    }

    @Test
    void shouldOrderVersionsFromNewestToOldest() {
        List<String> versions = VERSIONS.stream().map(ReleaseNoteVersion::version).toList();
        List<String> sorted = versions.stream().sorted((a, b) -> b.compareTo(a)).toList();

        assertEquals(sorted, versions);
    }

    @Test
    void shouldNotPublishEmptyCategory() {
        VERSIONS.forEach(version -> version.categories().forEach(category -> assertFalse(
                category.items().isEmpty(), version.version() + " com categoria " + category.kind() + " vazia")));
    }

    @Test
    void shouldNotRepeatAnyItemAcrossVersions() {
        List<String> allItems = new ArrayList<>();
        VERSIONS.forEach(version -> version.categories().forEach(category -> allItems.addAll(category.items())));

        assertEquals(allItems.size(), allItems.stream().distinct().count());
    }

    @Test
    void shouldNotExposeTechnicalIdentifiers() {
        displayedTexts().forEach(text -> assertFalse(
                TECHNICAL_IDENTIFIER.matcher(text).find(), "Identificador técnico exibido: " + text));
        displayedTexts().forEach(text -> assertFalse(
                INFRASTRUCTURE_TERM.matcher(text).find(), "Termo de infraestrutura exibido: " + text));
    }

    @Test
    void shouldPublishTheThreeCategoriesInThe102Block() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        assertTrue(v102.categories().stream().anyMatch(c -> c.kind() == ReleaseNoteCategory.Kind.NEW));
        assertTrue(v102.categories().stream().anyMatch(c -> c.kind() == ReleaseNoteCategory.Kind.IMPROVEMENT));
        assertTrue(v102.categories().stream().anyMatch(c -> c.kind() == ReleaseNoteCategory.Kind.FIX));
    }

    @Test
    void shouldAnnounceOwnAccountProtectionsAsASingleFixIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        List<String> fixes = v102.categories().stream()
                .filter(c -> c.kind() == ReleaseNoteCategory.Kind.FIX)
                .flatMap(c -> c.items().stream())
                .toList();

        assertEquals("1.0.2", v102.version());
        assertEquals(3, fixes.size());
        assertTrue(fixes.stream().anyMatch(item -> item.contains("contraste da borda")));
        assertEquals(1, fixes.stream()
                .filter(item -> item.contains("própria conta") && item.contains("próprio perfil"))
                .count());
    }

    @Test
    void shouldAnnounceCategoryDeletionAsImprovementIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        assertEquals("1.0.2", v102.version());
        assertEquals(1, v102.categories().stream()
                .filter(c -> c.kind() == ReleaseNoteCategory.Kind.IMPROVEMENT)
                .flatMap(c -> c.items().stream())
                .filter(item -> item.contains("Categorias") && item.contains("Excluir"))
                .count());
    }

    @Test
    void shouldNotAnnounceTheBackToTopButtonIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        assertEquals("1.0.2", v102.version());
        assertTrue(v102.categories().stream()
                .flatMap(c -> c.items().stream())
                .noneMatch(item -> item.contains("Voltar ao topo")));
    }

    @Test
    void shouldAnnounceRegistrationScreensWithFiltersAndPaginationAsImprovementIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        List<String> improvements = v102.categories().stream()
                .filter(c -> c.kind() == ReleaseNoteCategory.Kind.IMPROVEMENT)
                .flatMap(c -> c.items().stream())
                .toList();

        assertEquals("1.0.2", v102.version());
        assertEquals(1, improvements.stream()
                .filter(item -> item.contains("tela própria") && item.contains("Filtros")
                        && item.contains("por página"))
                .count());
        assertTrue(improvements.stream().anyMatch(item -> item.contains("não consegue carregar")));
    }

    @Test
    void shouldAnnounceListSearchFiltersPasswordCounterDayGroupsAndEntryFixIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        List<String> improvements = v102.categories().stream()
                .filter(c -> c.kind() == ReleaseNoteCategory.Kind.IMPROVEMENT)
                .flatMap(c -> c.items().stream())
                .toList();
        List<String> fixes = v102.categories().stream()
                .filter(c -> c.kind() == ReleaseNoteCategory.Kind.FIX)
                .flatMap(c -> c.items().stream())
                .toList();

        assertEquals("1.0.2", v102.version());
        List.of("sem diferenciar maiúsculas nem acentos", "Filtros ativos", "Nenhum registro encontrado",
                "mesmos filtros e na mesma página", "Mostrar senha", "caracteres da Descrição", "Hoje",
                "agrupada por dia")
                .forEach(expected -> assertTrue(improvements.stream().anyMatch(item -> item.contains(expected)),
                        "Melhorias da 1.0.2 sem mencionar " + expected));
        assertEquals(1, fixes.stream()
                .filter(item -> item.contains("primeira tela") && item.contains("Sem acesso"))
                .count());
    }

    private static final Pattern REPLACED_INTERFACE = Pattern.compile(
            "gaveta|ano e mês só listam|botão Filtros|Incluir e Editar");

    @Test
    void shouldAnnounceTheRedesignWithoutDescribingTheReplacedInterfaceIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);
        List<String> items = v102.categories().stream().flatMap(c -> c.items().stream()).toList();

        items.forEach(item -> assertFalse(REPLACED_INTERFACE.matcher(item).find(), item));
        assertTrue(items.stream().anyMatch(item -> item.contains("Visual novo")));
        assertTrue(items.stream().anyMatch(item -> item.contains("barra de navegação")));
        assertTrue(items.stream().anyMatch(item -> item.contains("Mês anterior") && item.contains("Próximo mês")));
        assertTrue(items.stream().anyMatch(item -> item.contains("Por categoria")));
    }
}
