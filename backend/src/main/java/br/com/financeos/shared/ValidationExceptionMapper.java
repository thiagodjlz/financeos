package br.com.financeos.shared;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import jakarta.annotation.Priority;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

// Declarado para ConstraintViolationException, subtipo mais especifico do ValidationException
// tratado pelo mapper embutido do Quarkus (ResteasyReactiveViolationExceptionMapper) — por isso
// este vence a resolucao e o corpo passa a ter a mensagem agregada alem do violations[].
@Provider
@Priority(Priorities.USER)
public class ValidationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {

    private static final String TITLE = "Constraint Violation";
    private static final String VALIDATION_HEADER = "validation-exception";
    private static final String FALLBACK_MESSAGE = "Revise os campos informados e tente novamente.";
    private static final Set<Class<?>> MISSING_FIELD_CONSTRAINTS =
            Set.of(NotNull.class, NotBlank.class, NotEmpty.class);

    public record Violation(String field, String message) {
    }

    public record ValidationReport(String title, int status, List<Violation> violations, String message) {
    }

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        List<ConstraintViolation<?>> violations = new ArrayList<>();
        if (exception.getConstraintViolations() != null) {
            violations.addAll(exception.getConstraintViolations());
        }
        violations.sort(Comparator.comparingInt(violation -> FieldLabels.orderOf(pathOf(violation))));

        List<Violation> reported = violations.stream()
                .map(violation -> new Violation(pathOf(violation), violation.getMessage()))
                .toList();

        ValidationReport report = new ValidationReport(
                TITLE, Response.Status.BAD_REQUEST.getStatusCode(), reported, aggregate(violations));

        return Response.status(Response.Status.BAD_REQUEST)
                .header(VALIDATION_HEADER, true)
                .type(MediaType.APPLICATION_JSON)
                .entity(report)
                .build();
    }

    private static String aggregate(List<ConstraintViolation<?>> violations) {
        List<String> missingLabels = new ArrayList<>();
        List<String> otherMessages = new ArrayList<>();

        for (ConstraintViolation<?> violation : violations) {
            if (isMissingField(violation)) {
                String label = FieldLabels.labelFor(pathOf(violation));
                if (!missingLabels.contains(label)) {
                    missingLabels.add(label);
                }
            } else if (violation.getMessage() != null && !otherMessages.contains(violation.getMessage())) {
                otherMessages.add(violation.getMessage());
            }
        }

        List<String> parts = new ArrayList<>();
        if (!missingLabels.isEmpty()) {
            parts.add("Informe os campos obrigatórios: " + String.join(", ", missingLabels) + ".");
        }
        parts.addAll(otherMessages);

        return parts.isEmpty() ? FALLBACK_MESSAGE : String.join(" ", parts);
    }

    private static boolean isMissingField(ConstraintViolation<?> violation) {
        if (violation.getConstraintDescriptor() == null || violation.getConstraintDescriptor().getAnnotation() == null) {
            return false;
        }

        return MISSING_FIELD_CONSTRAINTS.contains(
                violation.getConstraintDescriptor().getAnnotation().annotationType());
    }

    private static String pathOf(ConstraintViolation<?> violation) {
        return violation.getPropertyPath() == null ? "" : violation.getPropertyPath().toString();
    }
}
