# Pull Request

URL: https://github.com/thiagodjlz/financeos/pull/15

## Resumo

PR aberto para a issue #14, branch `feature/issue-14-tipo-categoria-lancamento` -> `main`.

- Formulario de novo lancamento passa a filtrar categorias pelo tipo (receita/despesa) via `GET /categories?type=`, e oculta o campo Status para receitas.
- `transactions.status` fica opcional no banco (migration `V8`); `TransactionResource.apply()` grava `status = null` para lancamentos `INCOME` (`POST`/`PUT`), sem alterar o cancelamento (`DELETE`, continua `CANCELED`).
- `DashboardRepository` corrigido para tratar `status IS NULL` como "nao cancelado" em receitas (bug encontrado no quality-check, corrigido nos commits `8ce1623` e `2db9cbe`).

## Qualidade no momento da abertura

- Backend: `DashboardResourceTest` corrigido e passando apos a correcao pos quality-check. Falha remanescente e esperada: `CategoryResourceTest.shouldListSeededCategories` (9 vs 11 categorias), por causa de duas categorias apagadas manualmente do banco local — nao e regressao desta feature.
- Frontend: testes e build passando sem falhas.
- Build (backend e frontend): PASSOU.
