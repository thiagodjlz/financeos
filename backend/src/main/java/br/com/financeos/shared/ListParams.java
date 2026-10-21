package br.com.financeos.shared;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.UriInfo;

// Parâmetros das listagens lidos crus do UriInfo, como no DashboardResource: a conversão de um
// @QueryParam tipado ("?page=abc", "?status=XYZ") falha fora do método e escapa do
// BusinessExceptionMapper. Aqui o valor inválido vira 400 com a mensagem em português do chamador.
public record ListParams(int page, int size) {

    public static final int MAX_SIZE = 10;

    private static final String INVALID_PAGE = "A página deve ser um número inteiro maior ou igual a 1.";
    private static final String INVALID_SIZE = "O tamanho da página deve ser um número entre 1 e " + MAX_SIZE + ".";

    public static ListParams from(UriInfo uriInfo) {
        String page = raw(uriInfo, "page");
        String size = raw(uriInfo, "size");

        Integer parsedPage = page == null ? Integer.valueOf(1) : parseInteger(page);
        if (parsedPage == null || parsedPage < 1) {
            throw new BadRequestException(INVALID_PAGE);
        }

        Integer parsedSize = size == null ? Integer.valueOf(MAX_SIZE) : parseInteger(size);
        if (parsedSize == null || parsedSize < 1 || parsedSize > MAX_SIZE) {
            throw new BadRequestException(INVALID_SIZE);
        }

        return new ListParams(parsedPage, parsedSize);
    }

    public static String text(UriInfo uriInfo, String name) {
        String value = raw(uriInfo, name);
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static UUID uuid(UriInfo uriInfo, String name, String errorMessage) {
        String value = text(uriInfo, name);
        if (value == null) {
            return null;
        }

        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(errorMessage);
        }
    }

    public static LocalDate date(UriInfo uriInfo, String name, String errorMessage) {
        String value = text(uriInfo, name);
        if (value == null) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new BadRequestException(errorMessage);
        }
    }

    public static <E extends Enum<E>> E enumValue(UriInfo uriInfo, String name, Class<E> type, String errorMessage) {
        String value = text(uriInfo, name);
        if (value == null) {
            return null;
        }

        try {
            return Enum.valueOf(type, value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(errorMessage);
        }
    }

    // Parâmetro repetido ("?groupBy=CATEGORY&groupBy=MONTH") ou separado por vírgula, na ordem recebida;
    // valores em branco são ignorados.
    public static <E extends Enum<E>> List<E> enumValues(UriInfo uriInfo, String name, Class<E> type,
            String errorMessage) {
        List<E> parsed = new ArrayList<>();
        for (String value : allValues(uriInfo, name)) {
            try {
                parsed.add(Enum.valueOf(type, value));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException(errorMessage);
            }
        }

        return List.copyOf(parsed);
    }

    public static List<UUID> uuids(UriInfo uriInfo, String name, String errorMessage) {
        List<UUID> parsed = new ArrayList<>();
        for (String value : allValues(uriInfo, name)) {
            try {
                parsed.add(UUID.fromString(value));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException(errorMessage);
            }
        }

        return List.copyOf(parsed);
    }

    // Aceita ponto ou vírgula como separador decimal ("100.5" e "100,5"); a mensagem da
    // NumberFormatException não chega à tela.
    public static BigDecimal decimal(UriInfo uriInfo, String name, String errorMessage) {
        String value = text(uriInfo, name);
        if (value == null) {
            return null;
        }

        try {
            return new BigDecimal(value.replace(',', '.'));
        } catch (NumberFormatException ex) {
            throw new BadRequestException(errorMessage);
        }
    }

    public static Boolean bool(UriInfo uriInfo, String name, String errorMessage) {
        String value = text(uriInfo, name);
        if (value == null) {
            return null;
        }

        return switch (value) {
            case "true" -> Boolean.TRUE;
            case "false" -> Boolean.FALSE;
            default -> throw new BadRequestException(errorMessage);
        };
    }

    private static List<String> allValues(UriInfo uriInfo, String name) {
        List<String> values = uriInfo.getQueryParameters().get(name);
        if (values == null) {
            return List.of();
        }

        return values.stream()
                .filter(value -> value != null)
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    private static String raw(UriInfo uriInfo, String name) {
        List<String> values = uriInfo.getQueryParameters().get(name);

        if (values == null || values.isEmpty()) {
            return null;
        }

        return values.get(0) == null ? "" : values.get(0);
    }

    // A mensagem da NumberFormatException ("For input string: ...") não pode virar texto de tela.
    private static Integer parseInteger(String value) {
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
