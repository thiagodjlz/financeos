package br.com.financeos.audit;

import java.util.Arrays;

// Gravado como texto, sem check no banco: tipo novo entra aqui, sem migration, e a consulta devolve o
// rótulo pronto para a tela (que não mantém mapa próprio).
public enum AuditEventType {
    CHANGE("Alteração"),
    LOGIN("Login"),
    LOGIN_FAILED("Login com falha"),
    LOGOUT("Logout"),
    SESSION_EXPIRED("Sessão expirada"),
    ACCESS_DENIED("Acesso negado"),
    SCREEN_ACCESS("Acesso à tela"),
    PRINT("Impressão");

    private final String label;

    AuditEventType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public static String labelOf(String code) {
        return Arrays.stream(values())
                .filter(type -> type.name().equals(code))
                .findFirst()
                .map(AuditEventType::label)
                .orElse(code);
    }
}
