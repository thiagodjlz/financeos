package br.com.financeos.audit;

import java.util.Arrays;

import br.com.financeos.shared.Action;

public enum AuditAction {
    CREATE("Inclusão"),
    UPDATE("Alteração"),
    DELETE("Exclusão"),
    VIEW("Visualização");

    private final String label;

    AuditAction(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public static AuditAction of(Action action) {
        return switch (action) {
            case VIEW -> VIEW;
            case CREATE -> CREATE;
            case EDIT -> UPDATE;
            case DELETE -> DELETE;
        };
    }

    public static String labelOf(String code) {
        if (code == null) {
            return null;
        }

        return Arrays.stream(values())
                .filter(action -> action.name().equals(code))
                .findFirst()
                .map(AuditAction::label)
                .orElse(code);
    }
}
