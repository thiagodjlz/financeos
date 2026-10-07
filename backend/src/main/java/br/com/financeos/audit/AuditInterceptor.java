package br.com.financeos.audit;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;

// Prioridade APPLICATION (2000) fica dentro do @Transactional (200): o registro e a verificação
// abaixo acontecem antes do commit, e a exceção daqui desfaz a operação.
@Audited
@Interceptor
@Priority(Interceptor.Priority.APPLICATION)
public class AuditInterceptor {

    @Inject
    AuditTrail trail;

    @AroundInvoke
    Object audit(InvocationContext context) throws Exception {
        trail.begin();
        Object result = context.proceed();

        if (!trail.recorded()) {
            throw new IllegalStateException("Endpoint de escrita respondeu sem registro de auditoria: "
                    + context.getMethod().getDeclaringClass().getSimpleName() + "." + context.getMethod().getName());
        }

        return result;
    }
}
