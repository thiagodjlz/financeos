# Relatorio de qualidade

Suite completa, sem escopo, rodada em 2026-10-20 na branch `feature/issue-113-saldo-acumulado`.

## Backend (`./mvnw test`)

PASSOU — 230 testes, 0 falhas, 0 erros, 0 ignorados (linha `Tests run: 230, Failures: 0, Errors: 0, Skipped: 0` e `BUILD SUCCESS`). Contagem conferida contra os 24 XMLs do surefire (soma de `tests=` = 230, nenhum com failures/errors). `DashboardAccumulatedBalanceTest` passou com 9 testes, sem valores extras no periodo de out/2026 em diante. Log: `specs/113-saldo-acumulado/evidence/backend-test.log`.

## Frontend (`npm test`)

PASSOU — vitest: Test Files 44 passed (44), Tests 542 passed (542), 0 falhas. Log: `specs/113-saldo-acumulado/evidence/frontend-test.log`.

## Frontend build (`npm run build`)

PASSOU — build de producao concluido sem erros de tipo nem avisos (0 linhas de erro/warning no log). Saida em `frontend/dist/frontend`. Log: `specs/113-saldo-acumulado/evidence/frontend-build.log`.

## Conclusao

Pronto para build.
