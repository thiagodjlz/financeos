# Relatorio de qualidade

Issue #120 — branch `fix/issue-120-icone-guia-ordem-menu` (target v1.0.3). Suite completa, sem escopo, rodada apos os ajustes pedidos pelo usuario (icone com "F", `index.html` com `?v=2`, item de Novidades 1.0.3 reescrito).

## Backend (`./mvnw test`)

PASSOU — 274 testes, 0 falhas, 0 erros, 0 ignorados (linha `Tests run: 274` do Maven, conferida pela soma de `tests` dos 27 `TEST-*.xml` do surefire). Log: `specs/120-icone-guia-ordem-menu/evidence/quality-backend-mvn-test.log`. O `WARN` do Hibernate (`transactions_status_check`, SQLState 23514) vem de `TransactionResourceTest.shouldKeepNoCanceledTransactionInDatabase`, que afirma de proposito que o banco recusa `CANCELED`; nao e falha.

## Frontend (`npm test`)

PASSOU — 573 testes em 46 arquivos (vitest: `Tests 573 passed (573)`, `Test Files 46 passed (46)`). Executado como `CI=true npm test`, porque o `ng test` do projeto nao aceita `--run`. Log: `specs/120-icone-guia-ordem-menu/evidence/quality-frontend-npm-test.log`.

## Frontend build (`npm run build`)

PASSOU — bundle gerado sem erros de tipo e sem avisos (nenhuma ocorrencia de `error`/`warning` no log). Log: `specs/120-icone-guia-ordem-menu/evidence/quality-frontend-build.log`.

## Conclusao

Pronto para build. Nenhuma falha em backend, frontend ou build. Spec atualizada para `stage: quality-checked`; nao havia linha `quality: failed` a remover.
