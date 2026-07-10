# Estimativa

| Area | Horas |
|---|---|
| Backend | 0 |
| Frontend | 2 |
| Migration/dados | 0 |
| Testes | 0.5 |
| **Total** | **2.5** |

## Confianca

**Alta** — feature é puramente de frontend (formulário de usuários), sem mudanças em backend, schema ou outras telas. O plan é muito detalhado, listando exatamente quais métodos, signals, constantes, template refs e bindings implementar. Não há lógica de negócio complexa, apenas manipulação de `HttpErrorResponse`, DOM e CSS. Os riscos listados no plan (novalidate implícito, order de foco, campos dificilmente exercitados) são bem-mapeados e não criam blockers.

## Premissas

- `users.ts` usa Signal API do Angular (`signal<Set<string>>` será suportado sem migração de versão)
- Não há mudanças nas regras de validação do backend ou no formato de resposta `{violations: [{field, message}]}`
- Arquivo `users.html` mantém `NgForm` com `novalidate` implícito (comportamento já existente)
- Testes manuais conforme roteiro do plan (6–7 cenários: senha curta, campo único, múltiplos campos, limpeza ao corrigir, nova tentativa, erro sem violations, validação visual) são suficientes
