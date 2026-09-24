package br.com.financeos.shared;

import java.text.Normalizer;
import java.util.Locale;

// Filtro de texto das listagens: "contém", sem diferenciar maiúsculas nem acentos ("acai" acha "Açaí").
// O acento sai da coluna pelo unaccent do Postgres (V15) e do termo buscado aqui, antes de virar padrão.
public final class TextSearch {

    private TextSearch() {
    }

    public static String condition(String field, String parameter) {
        return "cast(function('unaccent', %s) as String) ilike :%s escape '!'".formatted(field, parameter);
    }

    public static String containsPattern(String text) {
        String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String escaped = withoutAccents.toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");

        return "%" + escaped + "%";
    }
}
