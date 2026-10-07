package br.com.financeos.profiles;

public enum Screen {
    DASHBOARD("Resumo"),
    TRANSACTIONS("Lançamentos"),
    CATEGORIES("Categorias"),
    USERS("Usuários"),
    PROFILES("Perfis"),
    AUDIT("Auditoria"),
    DOCUMENTATION("Documentação"),
    RELEASE_NOTES("Novidades por versão");

    private final String label;

    Screen(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
