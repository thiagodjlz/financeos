package br.com.financeos.shared;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonMappingException.Reference;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;

import br.com.financeos.shared.ValidationExceptionMapper.ValidationReport;
import br.com.financeos.shared.ValidationExceptionMapper.Violation;
import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

// Valor que nem chega ao Bean Validation porque não converte para o tipo do campo (ex.: "12abc" no
// Valor, issue #109). Sem este mapper o 400 sairia do mapper embutido, sem mensagem em português e sem
// o campo; aqui ele ganha o mesmo formato do ValidationExceptionMapper, para a tela destacar o campo.
@Provider
@Priority(Priorities.USER)
public class InvalidFormatExceptionMapper implements ExceptionMapper<InvalidFormatException> {

    private static final String TITLE = "Constraint Violation";
    private static final String VALIDATION_HEADER = "validation-exception";

    private static final Map<String, String> MESSAGES = Map.of(
            "amount", "O valor informado é inválido.",
            "transactionDate", "A data informada é inválida.",
            "type", "O tipo informado é inválido.",
            "status", "O status informado é inválido.",
            "categoryId", "A categoria informada é inválida.");

    @Override
    public Response toResponse(InvalidFormatException exception) {
        String field = fieldOf(exception.getPath());
        String message = MESSAGES.getOrDefault(field,
                "O campo " + FieldLabels.labelFor(field) + " está em formato inválido.");

        ValidationReport report = new ValidationReport(TITLE, Response.Status.BAD_REQUEST.getStatusCode(),
                List.of(new Violation(field, message)), message);

        return Response.status(Response.Status.BAD_REQUEST)
                .header(VALIDATION_HEADER, true)
                .type(MediaType.APPLICATION_JSON)
                .entity(report)
                .build();
    }

    private static String fieldOf(List<Reference> path) {
        return path == null ? "" : path.stream()
                .map(Reference::getFieldName)
                .filter(name -> name != null && !name.isBlank())
                .collect(Collectors.joining("."));
    }
}
