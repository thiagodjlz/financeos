# Notas de implementacao

Branch: `feature/issue-14-tipo-categoria-lancamento`

## Arquivos alterados

- `backend/src/main/resources/db/migration/V8__make_transactions_status_nullable.sql` — nova migration, remove o `NOT NULL` da coluna `transactions.status` (a `CHECK (status in (...))` existente ja aceita `NULL` pela logica trivalorada do SQL, sem precisar recriar a constraint).
- `backend/src/main/java/br/com/financeos/transactions/FinancialTransaction.java` — `@Column` de `status` deixa de ter `nullable = false`, refletindo a nova constraint do banco.
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — `apply()` (usado por `create()`/`POST` e `update()`/`PUT`) grava `status = null` quando `request.type() == TransactionType.INCOME`; para `EXPENSE` mantem o comportamento atual (`status` recebido ou `PENDING` como default). `cancel()`/`DELETE` nao foi alterado, continua gravando `CANCELED` sempre.
- `frontend/src/app/core/models.ts` — `Transaction.status` passa a ser `TransactionStatus | null`.
- `frontend/src/app/core/services/category.service.ts` — novo metodo `listByType(type)` que chama `GET /categories?type=` e retorna a lista sem alterar o signal `categories` (que continua sendo o catalogo completo usado pela tabela).
- `frontend/src/app/features/transactions/transactions.ts` — novo signal `filteredCategories`; `transactionForm.status` aceita `TransactionStatus | null`; novo metodo `onTypeChange()` (chamado via `(ngModelChange)` no select de Tipo) que recarrega `filteredCategories` pelo tipo escolhido e limpa `transactionForm.categoryId` se a categoria selecionada nao pertencer mais ao tipo; `loadData()` tambem carrega as categorias filtradas pelo tipo inicial do formulario; `saveTransaction()` envia `status: null` quando `type === 'INCOME'`.
- `frontend/src/app/features/transactions/transactions.html` — `(ngModelChange)="onTypeChange()"` no `<select name="type">`; campo Status envolvido em `*ngIf="transactionForm.type !== 'INCOME'"`; dropdown de categoria passa a iterar `filteredCategories()` em vez de `categories()`.

## Decisoes

- Nenhuma mudanca em `Category`/`CategoryResource`/`CategoryType`/seed — confirmado que o filtro por tipo e o campo `type` ja existiam e atendiam os criterios 1 e 2 da spec.
- `CategoryService.categories` (signal global, catalogo completo) foi mantido intacto; o filtro por tipo do formulario usa um metodo separado (`listByType`) que nao sobrescreve esse signal, preservando a exibicao de nomes de categoria na tabela "Ultimos lancamentos" para lancamentos de qualquer tipo.
- A migration nao recria a `CHECK` constraint de `status`, apenas remove o `NOT NULL` — validado em Postgres real (via `./mvnw test`) que a constraint aceita `status IS NULL` sem erro.

## Desvios em relacao ao plano

Nenhum desvio. A implementacao seguiu o plano descrito em `plan.md` em todos os arquivos e na sequencia sugerida.

## Correcao pos quality-check (rodada 2)

`quality-report.md` apontou que `DashboardResourceTest.shouldReturnMonthlySummary` falhava porque `DashboardRepository` usava `status <> 'CANCELED'` para filtrar receitas nao canceladas. Como receitas passaram a gravar `status = NULL` (ver "Decisoes" acima), essa condicao SQL avalia para `NULL` (nao `TRUE`), entao as receitas somem dos resultados.

- `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java` — trocado `status <> 'CANCELED'` por `(status IS NULL OR status <> 'CANCELED')` em toda ocorrencia que poderia incluir receitas: `totals()` (colunas `total_income` e `transaction_count`; `total_expense`/`paid_expense`/`pending_expense` nao precisaram de ajuste porque despesas nunca tem `status` nulo), `categoryBreakdown()` (filtro `t.status <> 'CANCELED'`, que se aplica a receitas e despesas juntas) e `monthlyEvolution()` (coluna `income`).

O segundo item do `quality-report.md` (`CategoryResourceTest.shouldListSeededCategories` retornando 9 em vez de 11) nao foi alterado — e resultado de o usuario ter apagado manualmente as categorias "Extras" e "Investimentos" do banco local de testes, comportamento esperado e fora do escopo desta feature.

Validacao: `./mvnw -o test -Dtest=DashboardResourceTest` passou (2/2). `./mvnw -o test` completo: 9/10 passam; a unica falha remanescente e `CategoryResourceTest.shouldListSeededCategories`, esperada por causa do estado manual do banco.
