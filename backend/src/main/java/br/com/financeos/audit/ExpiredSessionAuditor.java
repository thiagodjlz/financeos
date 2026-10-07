package br.com.financeos.audit;

import java.util.Optional;
import java.util.UUID;

import org.jboss.logging.Logger;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtContext;

import br.com.financeos.users.AppUser;
import br.com.financeos.users.AppUserRepository;
import io.quarkus.security.spi.runtime.AuthenticationFailureEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.enterprise.event.ObservesAsync;
import jakarta.inject.Inject;

// "Sessão expirada": token de assinatura válida recusado só pelo vencimento. O jose4j confere a
// assinatura antes das claims, então um InvalidJwtException com hasExpired() garante que o `sub` veio
// de um token emitido por nós. Token malformado ou de assinatura inválida não gera evento.
// Assíncrono porque o evento de falha chega na thread de I/O, onde não dá para usar o banco.
@ApplicationScoped
public class ExpiredSessionAuditor {

    private static final Logger LOG = Logger.getLogger(ExpiredSessionAuditor.class);

    @Inject
    AuditWriter writer;

    @Inject
    AppUserRepository userRepository;

    @ActivateRequestContext
    void onAuthenticationFailure(@ObservesAsync AuthenticationFailureEvent event) {
        expiredSubject(event.getAuthenticationFailure()).ifPresent(this::record);
    }

    static Optional<UUID> expiredSubject(Throwable failure) {
        Throwable current = failure;

        for (int depth = 0; current != null && depth < 10; depth++, current = current.getCause()) {
            if (current instanceof InvalidJwtException rejected && rejected.hasExpired()) {
                return subjectOf(rejected.getJwtContext());
            }
        }

        return Optional.empty();
    }

    private static Optional<UUID> subjectOf(JwtContext context) {
        if (context == null || context.getJwtClaims() == null) {
            return Optional.empty();
        }

        try {
            String subject = context.getJwtClaims().getSubject();
            return subject == null ? Optional.empty() : Optional.of(UUID.fromString(subject));
        } catch (MalformedClaimException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private void record(UUID userId) {
        try {
            AppUser user = userRepository.findById(userId);
            AuditActor actor = user == null ? new AuditActor(userId, null, null, false) : AuditActor.of(user);
            writer.writeEvent(AuditEventType.SESSION_EXPIRED, actor, null, null);
        } catch (RuntimeException ex) {
            LOG.warnf(ex, "Não foi possível registrar a sessão expirada do usuário %s", userId);
        }
    }
}
