package br.com.financeos.shared;

import java.util.LinkedHashMap;
import java.util.Map;

public final class FieldLabels {

    // A ordem de insercao define a ordem dos campos na frase agregada: as violacoes
    // chegam do Bean Validation num Set, sem ordem estavel entre execucoes.
    private static final Map<String, String> LABELS = new LinkedHashMap<>();
    private static final Map<String, Integer> ORDER = new LinkedHashMap<>();

    static {
        LABELS.put("name", "Nome");
        LABELS.put("email", "E-mail");
        LABELS.put("password", "Senha");
        LABELS.put("profileId", "Perfil");
        LABELS.put("description", "Descrição");
        LABELS.put("amount", "Valor");
        LABELS.put("transactionDate", "Data");
        LABELS.put("type", "Tipo");
        LABELS.put("categoryId", "Categoria");
        LABELS.put("status", "Status");
        LABELS.put("color", "Cor");
        LABELS.put("icon", "Ícone");
        LABELS.put("active", "Situação");
        LABELS.put("permissions", "Permissões");
        LABELS.put("screen", "Tela");
        LABELS.put("installmentNumber", "Parcela");
        LABELS.put("installmentTotal", "Total de parcelas");
        LABELS.put("notes", "Observações");

        int position = 0;
        for (String field : LABELS.keySet()) {
            ORDER.put(field, position++);
        }
    }

    private FieldLabels() {
    }

    public static String labelFor(String propertyPath) {
        String field = fieldOf(propertyPath);
        return LABELS.getOrDefault(field, field);
    }

    public static int orderOf(String propertyPath) {
        return ORDER.getOrDefault(fieldOf(propertyPath), Integer.MAX_VALUE);
    }

    private static String fieldOf(String propertyPath) {
        if (propertyPath == null || propertyPath.isBlank()) {
            return "";
        }

        int lastDot = propertyPath.lastIndexOf('.');
        return lastDot < 0 ? propertyPath : propertyPath.substring(lastDot + 1);
    }
}
