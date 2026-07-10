# Estimativa

| Area | Horas |
|---|---|
| Backend (5 arquivos) | 2,5 |
| Frontend (4 arquivos) | 4 |
| Migration/dados | 0,5 |
| Testes | 2 |
| **Total** | **9** |

## Confianca

Média-Alta — mudanças bem demarcadas (remoção de 2 campos em 9 arquivos espalhados entre backend, frontend e schema). Nenhuma lógica complexa, nenhuma alteração de regra de negócio. Backend e frontend têm modificações previsíveis: deletar imports, campos de form, atributos de entidade, métodos auxiliares e fixtures. A sequência do plano é clara. Riscos principais: confirmar que nenhum outro resource/repository usa esses campos indiretamente; validar excess property checking do TypeScript no `transaction.service.spec.ts`; perda de dado histórico é intencional mas requer aviso ao ambientes de produção.

## Premissas

- `TransactionRepository` e `TransactionResource` já não usam `accountId`/`cardId` em filtros ou retornos; se houver referência oculta, aumenta em ~1-2h.
- Dashboard não depende desses campos (conforme `knowledge/dashboard.md`); se houver dependência não documentada, requer reanálise.
- `CardService`/`AccountService` não são usados em `transactions.ts` para nenhum outro propósito além de popular os dois campos a remover; se houver outra dependência, reduz o escopo de remoção.
- Migrations anteriores ja foram commitadas e nao serão editadas; V7 é o próximo número livre.
- Ambiente de desenvolvimento pode perder dados históricos de `account_id`/`card_id` durante a migration sem impacto (versão local não é crítica).
