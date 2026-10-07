package br.com.financeos.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.interceptor.InterceptorBinding;

// Marca endpoint de escrita: o método precisa chamar o AuditTrail antes de responder, senão o
// AuditInterceptor recusa a resposta e a transação é desfeita. AuditCoverageTest cobra a anotação
// em todo @POST/@PUT/@DELETE/@PATCH dos *Resource.
@InterceptorBinding
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.METHOD, ElementType.TYPE })
public @interface Audited {
}
