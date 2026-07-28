package br.com.financeos.shared;

import java.util.regex.Pattern;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.USER)
public class BusinessExceptionMapper implements ExceptionMapper<WebApplicationException> {

    // Mensagem sintetizada pelo JAX-RS quando o construtor não recebeu texto (ex.: "HTTP 401 Unauthorized"):
    // serializá-la vazaria jargão técnico em inglês para a UI.
    private static final Pattern DEFAULT_MESSAGE = Pattern.compile("^HTTP \\d{3} .*$");

    @Override
    public Response toResponse(WebApplicationException exception) {
        Response original = exception.getResponse();

        if (original == null) {
            return Response.serverError().build();
        }

        if (original.hasEntity() || !hasExplicitMessage(exception)) {
            return original;
        }

        return Response.fromResponse(original)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ApiError(exception.getMessage()))
                .build();
    }

    private static boolean hasExplicitMessage(WebApplicationException exception) {
        String message = exception.getMessage();

        return message != null && !message.isBlank() && !DEFAULT_MESSAGE.matcher(message).matches();
    }
}
