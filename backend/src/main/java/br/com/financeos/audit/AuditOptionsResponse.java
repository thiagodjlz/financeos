package br.com.financeos.audit;

import java.util.Arrays;
import java.util.List;

import br.com.financeos.profiles.Screen;

public record AuditOptionsResponse(List<Option> types, List<Option> actions, List<Option> screens) {

    public record Option(String code, String label) {
    }

    public static AuditOptionsResponse current() {
        return new AuditOptionsResponse(
                Arrays.stream(AuditEventType.values()).map(type -> new Option(type.name(), type.label())).toList(),
                Arrays.stream(AuditAction.values()).map(action -> new Option(action.name(), action.label())).toList(),
                Arrays.stream(Screen.values()).map(screen -> new Option(screen.name(), screen.label())).toList());
    }
}
