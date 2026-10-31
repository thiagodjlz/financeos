# Relatorio de qualidade

Branch: `fix/issue-117-desconto-saldo-acumulado` (suite completa, sem escopo).

## Backend (`./mvnw test`)

PASSOU — 273 testes, 0 falhas, 0 erros, 0 ignorados (27 classes). Contagem conferida nos `TEST-*.xml` do surefire (soma de `tests` = 273). Saida bruta: `specs/117-desconto-saldo-acumulado/evidence/quality-backend-test.log`.

## Frontend (`npm test`)

PASSOU — 571 testes em 46 arquivos, todos passando (vitest). Saida bruta: `specs/117-desconto-saldo-acumulado/evidence/quality-frontend-test.log`.

## Frontend build (`npm run build`)

PASSOU — compilou sem erros de tipo nem avisos. Bundle inicial 339.72 kB (86.75 kB transferido). Saida bruta: `specs/117-desconto-saldo-acumulado/evidence/quality-frontend-build.log`.

## Conclusao

Pronto para build. Nenhuma falha; `quality: failed` nao estava presente, entao nao foi necessario remove-la.
