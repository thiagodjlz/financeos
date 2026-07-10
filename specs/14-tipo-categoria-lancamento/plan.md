# Plano de implementacao

## Abordagem

O backend de categorias (`Category`, `CategoryResource`, filtro `?type=`) ja esta pronto — nao muda nada. O trabalho real e todo em transacoes: (1) tornar a coluna `status` opcional via migration Flyway e ajustar `TransactionResource.apply()` (usado por `POST` e `PUT`) para gravar `status = null` sempre que `type = INCOME`, mantendo o default `PENDING` para `EXPENSE`; (2) no frontend, o formulario de novo lancamento passa a buscar as categorias filtradas por tipo (`GET /categories?type=...`) num signal local do componente — sem sobrescrever o signal global `CategoryService.categories`, que continua guardando o catalogo completo e e usado para exibir o nome da categoria na tabela de "Ultimos lancamentos" (lancamentos de despesa e receita misturados). O campo Status e ocultado via `*ngIf` quando `type = INCOME`, e a categoria selecionada e limpa se deixar de pertencer ao tipo escolhido.

## Arquivos a alterar

### Backend

- `backend/src/main/java/br/com/financeos/transactions/FinancialTransaction.java` — coluna `status`: remover `nullable = false` do `@Column` (fica nullable); manter o default `= TransactionStatus.PENDING` no campo Java (irrelevante em runtime pois `apply()` sempre sobrescreve, mas evita `null` acidental em outros pontos que instanciem a entidade sem passar por `apply()`).
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — metodo privado `apply(FinancialTransaction, TransactionRequest)`: quando `request.type() == TransactionType.INCOME`, gravar `transaction.status = null`; caso contrario, manter a logica atual (`request.status() == null ? PENDING : request.status()`). Como `apply()` e chamado tanto por `create()` (`POST`) quanto por `update()` (`PUT`), a regra vale para os dois automaticamente. O metodo `cancel()` (`DELETE`) nao muda — continua gravando `CANCELED` sempre.
- Nenhuma mudanca em `TransactionRequest`/`TransactionResponse` (o campo `status` ja e opcional/nullable nos dois) nem em `CategoryResource`/`Category`/`CategoryRequest`/`CategoryType` (o campo `type` obrigatorio e o filtro `?type=` ja existem e ja atendem os criterios 1/2 confirmados como "ja implementado" na spec).

### Frontend

- `frontend/src/app/core/models.ts` — `Transaction.status` passa de `TransactionStatus` para `TransactionStatus | null` (reflete que a API agora pode devolver `status: null` para receitas).
- `frontend/src/app/core/services/category.service.ts` — adicionar metodo `listByType(type: TransactionType): Promise<Category[]>` que chama `GET /categories?type=${type}` e **retorna** a lista sem mutar o signal `categories` (esse signal continua sendo o catalogo completo, carregado por `refresh()`, usado para lookup de nome na tabela de lancamentos).
- `frontend/src/app/features/transactions/transactions.ts`:
  - novo signal `filteredCategories = signal<Category[]>([])` para popular o dropdown do formulario.
  - `transactionForm.status` passa a aceitar `TransactionStatus | null`.
  - `ngOnInit`/`loadData` passam a tambem chamar `loadCategoriesForType(transactionForm.type)` (alem de `transactionService.refresh()` e `categoryService.refresh()`, que continuam existindo para a tabela).
  - novo metodo `protected async onTypeChange(): Promise<void>` (disparado por `(ngModelChange)` no `<select name="type">`): busca `categoryService.listByType(transactionForm.type)`, atualiza `filteredCategories`, e limpa `transactionForm.categoryId` se a categoria selecionada nao estiver na nova lista.
  - `saveTransaction()`: ao montar o payload, enviar `status: transactionForm.type === 'INCOME' ? null : transactionForm.status` (o backend e a fonte de verdade final, mas o frontend ja envia coerente com a UI oculta).
  - `categoryName()` continua usando `categories()` (catalogo completo do `CategoryService`), sem mudanca — garante que a tabela mostra o nome de categorias de qualquer tipo mesmo com o filtro aplicado no formulario.
- `frontend/src/app/features/transactions/transactions.html`:
  - `<select name="type">`: adicionar `(ngModelChange)="onTypeChange()"`.
  - campo Status: envolver em `*ngIf="transactionForm.type !== 'INCOME'"` (ou mover para dentro do `<label>` existente com `*ngIf`), preservando o layout `two-cols` (quando oculto, Tipo fica sozinho na linha — ajuste de CSS simples se necessario, sem exigir mudanca em `transactions.scss` a principio).
  - `<select name="categoryId">`: trocar `*ngFor="let category of categories()"` por `*ngFor="let category of filteredCategories()"`.

### Migration

- `backend/src/main/resources/db/migration/V8__make_transactions_status_nullable.sql` — proximo numero de versao livre (ultima migration existente e `V7__remove_transactions_account_and_card_columns.sql`). Conteudo: `alter table transactions alter column status drop not null;`. Nao e necessario alterar a `check (status in ('PENDING', 'PAID', 'CANCELED'))` existente — no Postgres, uma `CHECK` constraint e satisfeita quando a expressao avalia para `NULL` (nao e tratada como falha), entao linhas com `status IS NULL` passam pela constraint sem erro. Lancamentos de despesa existentes, todos com `status` preenchido, nao sao afetados por essa migration (ela so remove a restricao `NOT NULL`, nao reescreve dados).

## Sequencia de implementacao

1. Migration `V8__make_transactions_status_nullable.sql` (dropar `NOT NULL` de `transactions.status`).
2. `FinancialTransaction.java` — ajustar `@Column` de `status` para nullable.
3. `TransactionResource.apply()` — gravar `status = null` quando `type = INCOME`.
4. (Opcional, validar antes do frontend) rodar `./mvnw test` no backend para confirmar que testes existentes de `TransactionResource`/`FinancialTransaction` continuam passando e cobrir o caso `INCOME -> status null` se houver teste de integracao.
5. `models.ts` — `Transaction.status: TransactionStatus | null`.
6. `category.service.ts` — adicionar `listByType()`.
7. `transactions.ts` — signal `filteredCategories`, `onTypeChange()`, ajuste de `saveTransaction()` e carregamento inicial.
8. `transactions.html` — `*ngIf` no campo Status, `(ngModelChange)` no Tipo, `filteredCategories()` no dropdown de categoria.
9. Validar manualmente (ou via teste) o fluxo: trocar tipo Despesa -> Receita com categoria de despesa selecionada e confirmar que a selecao e limpa e o campo Status some; salvar um lancamento de receita e conferir no banco que `status` ficou `NULL`; cancelar um lancamento de receita (`DELETE`) e conferir que grava `CANCELED` normalmente.

## Riscos e pontos de atencao

- **Nao criar validacao server-side de compatibilidade `categoryId`/`type`** — a spec marca isso como fora de escopo (`knowledge/transactions.md` ja registra que hoje nao ha validacao de posse/consistencia de `categoryId`); o filtro e so de exibicao no frontend, o usuario ainda pode, em tese, montar uma requisicao manual com categoria incompativel.
- **Signal `CategoryService.categories` e compartilhado** — hoje so e consumido em `transactions.ts` (dropdown + `categoryName()` na tabela). E importante **nao** substituir esse signal pelo resultado filtrado por tipo (isso quebraria a exibicao de nomes de categoria de lancamentos do outro tipo na tabela "Ultimos lancamentos"); por isso o plano usa um metodo separado (`listByType`) que devolve a lista sem mutar o signal global.
- **`DELETE /transactions/{id}` (cancelamento) nao muda** — `cancel()` continua fazendo `transaction.status = TransactionStatus.CANCELED` incondicionalmente, inclusive para receitas, conforme decisao registrada na spec; nenhuma alteracao nesse metodo faz parte deste plano — cuidado para nao "consertar" isso por engano durante a implementacao.
- **Constraint CHECK de `status`** — confirmar em ambiente real (Postgres) que `check (status in (...))` de fato aceita `NULL` sem precisar de `DROP CONSTRAINT` / `ADD CONSTRAINT`; e o comportamento padrao do SQL (three-valued logic), mas vale validar com um teste de integracao ou insercao manual apos rodar a migration, ja que qualquer erro aqui bloqueia a criacao de receitas.
- **Campo `status` continua obrigatorio para despesas** — ao esconder o campo no formulario para `type = INCOME` e trocar de volta para `EXPENSE`, `transactionForm.status` precisa ter um valor valido (`PENDING` por default, ja e o valor inicial do form) para nao mandar `null` sem querer numa despesa.
- **Categorias "Extras"/"Investimentos"** — fora de escopo desta implementacao (usuario remove manualmente do banco); nenhum codigo ou migration deste plano deve tocar nelas.
- **Sem UI de edicao hoje** — o plano cobre `PUT` apenas no backend (via `apply()` compartilhado); nenhum componente novo de edicao e criado no frontend, conforme "Fora de escopo" da spec.
