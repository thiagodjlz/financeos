# Relatorio de qualidade

Rodada: repeticao apos correcao do criterio 17 (CSS de impressao em `transaction-reports.scss` e `styles.scss`). Suite completa, sem escopo.

## Backend (`./mvnw test`)

PASSOU — 269 testes em 27 classes, 0 falhas, 0 erros, 0 ignorados. Linha final do Maven: `Tests run: 269, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS`. Conferido contra os XML do surefire (`backend/target/surefire-reports/`): 27 arquivos, soma 269 testes, 0 falhas, 0 erros, 0 ignorados. Log: `specs/114-relatorios-lancamentos/evidence/backend-test.log`.

## Frontend (`npm test`)

PASSOU — vitest: `Test Files 46 passed (46)`, `Tests 573 passed (573)`, 0 falhas. Log: `specs/114-relatorios-lancamentos/evidence/frontend-test.log`.

## Frontend build (`npm run build`)

PASSOU — compila sem erros de tipo; nenhuma linha de warning ou erro no log. Bundle inicial 339.74 kB (86.69 kB transferido); chunk lazy `transaction-reports` 34.27 kB (8.44 kB transferido). Log: `specs/114-relatorios-lancamentos/evidence/frontend-build.log`.

## Conclusao

Pronto para build. Os tres checks passaram na suite completa, incluindo o build que compila os estilos corrigidos do criterio 17.
