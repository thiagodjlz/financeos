package br.com.financeos.audit;

import java.util.UUID;

import br.com.financeos.users.AppUser;

// Usuário como estava no momento do registro: renomear ou excluir a conta não muda o que foi gravado.
public record AuditActor(UUID id, String name, String email, boolean superAdmin) {

    public static AuditActor of(AppUser user) {
        return new AuditActor(user.id, user.name, user.email, user.superAdmin);
    }

    public static AuditActor unknown(String email) {
        return new AuditActor(null, null, email, false);
    }
}
