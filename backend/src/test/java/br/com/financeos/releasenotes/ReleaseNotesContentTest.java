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
    }

    @Test
    void shouldPublishTheThreeCategoriesInThe102Block() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        assertTrue(v102.categories().stream().anyMatch(c -> c.kind() == ReleaseNoteCategory.Kind.NEW));
        assertTrue(v102.categories().stream().anyMatch(c -> c.kind() == ReleaseNoteCategory.Kind.IMPROVEMENT));
        assertTrue(v102.categories().stream().anyMatch(c -> c.kind() == ReleaseNoteCategory.Kind.FIX));
    }

    @Test
    void shouldAnnounceTheBackToTopButtonAsImprovementIn102() {
        ReleaseNoteVersion v102 = VERSIONS.get(0);

        assertEquals("1.0.2", v102.version());
        assertTrue(v102.categories().stream()
                .filter(c -> c.kind() == ReleaseNoteCategory.Kind.IMPROVEMENT)
                .flatMap(c -> c.items().stream())
                .anyMatch(item -> item.contains("Voltar ao topo")));
    }
}
