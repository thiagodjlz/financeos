# Plano de implementacao

## Abordagem

Remocao "de ponta a ponta" dos campos `accountId`/`cardId` de lancamentos: primeiro o frontend (formulario, tabela, `transactionForm`, injecoes de `AccountService`/`CardService` no componente Lancamentos), depois os DTOs e a entidade no backend, e por fim uma migration Flyway que dropa as colunas `account_id`/`card_id` da tabela `transactions`. `TransactionRepository` ja nao referencia esses campos (filtros sao so `type/status/startDate/endDate/categoryId`), entao nao precisa mudar. As telas de Contas, Cartoes e o componente Registers (que usa `AccountService`/`CardService` para o cadastro de Cartao, nao de Lancamentos) ficam intocados.

## Arquivos a alterar

### Backend

- `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java` — remover os campos `accountId`/`cardId` do record.
- `backend/src/main/java/br/com/financeos/transactions/TransactionResponse.java` — remover os campos `accountId`/`cardId` do record e do metodo estatico `from(FinancialTransaction)`.
- `backend/src/main/java/br/com/financeos/transactions/FinancialTransaction.java` — remover os atributos `accountId`/`cardId` (e suas anotacoes `@Column(name = "account_id")`/`@Column(name = "card_id")`).
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — remover as duas linhas em `apply(...)` que copiam `request.accountId()`/`request.cardId()` para a entidade.
- `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java` — nao referencia `accountId`/`cardId` hoje nos payloads JSON nem nas asserções; conferir apos a mudanca que os testes existentes (`shouldCreateListUpdateAndCancelTransaction`, `shouldRejectInvalidTransaction`) continuam passando sem alteracao (nenhuma mudanca de codigo esperada, so validacao).

### Frontend

- `frontend/src/app/features/transactions/transactions.html` — remover o bloco `<div class="two-cols">` com os `<select name="accountId">`/`<select name="cardId">` do formulario "Novo lancamento", e remover as colunas `<th>Conta</th>`/`<th>Cartao</th>` e as celulas `<td>{{ accountName(...) }}</td>`/`<td>{{ cardName(...) }}</td>` da tabela "Ultimos lancamentos".
- `frontend/src/app/features/transactions/transactions.ts` — remover: import e injecao de `AccountService`/`CardService`; os signals `accounts`/`cards`; as chaves `accountId`/`cardId` de `transactionForm`; as linhas `accountId`/`cardId` no payload de `saveTransaction()` (incluindo as chamadas a `emptyToNull`); as chamadas `this.accountService.refresh()`/`this.cardService.refresh()` em `loadData()`; os metodos `accountName(id)`/`cardName(id)` (nao usados mais na tabela).
- `frontend/src/app/core/models.ts` — remover `accountId: string | null;` e `cardId: string | null;` da interface `Transaction`.
- `frontend/src/app/core/services/transaction.service.spec.ts` — remover `accountId`/`cardId` dos objetos mockados em `req.flush(...)` (fixtures de GET e POST) para bater com a interface `Transaction` sem esses campos (excess property checking do TypeScript quebraria o build/teste se mantidos).

### Migration

- `backend/src/main/resources/db/migration/V7__remove_transactions_account_and_card_columns.sql` — `alter table transactions drop column account_id; alter table transactions drop column card_id;` (proximo numero de versao livre: V7, ja que a ultima migration existente e `V6__seed_profiles_and_admin.sql`).

## Sequencia de implementacao

1. Frontend: ajustar `transactions.html` removendo os campos do formulario e as colunas da tabela.
2. Frontend: ajustar `transactions.ts` removendo `AccountService`/`CardService`, os signals `accounts`/`cards`, os campos do `transactionForm`, o payload de `saveTransaction()`, as chamadas de `refresh()` e os metodos `accountName`/`cardName`.
3. Frontend: remover `accountId`/`cardId` de `Transaction` em `models.ts`.
4. Frontend: atualizar `transaction.service.spec.ts` para nao usar mais `accountId`/`cardId` nas fixtures.
5. Backend: remover `accountId`/`cardId` de `TransactionRequest` e `TransactionResponse`.
6. Backend: remover as colunas mapeadas `accountId`/`cardId` de `FinancialTransaction`.
7. Backend: remover as duas atribuicoes correspondentes em `TransactionResource.apply(...)`.
8. Criar a migration `V7__remove_transactions_account_and_card_columns.sql` dropando `account_id` e `card_id` de `transactions`.
9. Rodar `./mvnw test` no backend e `npm test`/`npm run build` no frontend para validar que nada mais referencia os campos removidos.

## Riscos e pontos de atencao

- **Perda de dado historico intencional**: conforme `knowledge/transactions.md` e a secao "Decisoes" da spec, lancamentos que ja tinham `account_id`/`card_id` preenchidos perdem esse vinculo de forma definitiva ao rodar a migration (drop column). Isso e aceito pela decisao, mas vale confirmar que nao ha ambiente de producao com dado relevante antes de aplicar em prod.
- **Migration ja commitada nunca deve ser editada** (`knowledge/architecture.md`): a remocao de coluna tem que ser uma migration nova (`V7`), nunca uma alteracao em `V1__init.sql`.
- **Sem validacao de posse cruzada** hoje em `TransactionResource` (`knowledge/transactions.md`) — irrelevante apos a remocao, ja que o campo deixa de existir, mas reforca que nao havia integracao forte com Contas/Cartoes que pudesse quebrar.
- **`TransactionRepository.listByFilters`** ja nao usa `accountId`/`cardId` — confirmar durante a implementacao que nenhum outro metodo do repository ou de outro Resource (ex.: dashboard) foi perdido nessa leitura.
- **Excess property checking no TypeScript**: como `transaction.service.spec.ts` faz `req.flush({...})` com objeto literal, remover `accountId`/`cardId` de `Transaction` sem atualizar esse spec quebra a compilacao dos testes do frontend.
- **Registers (`frontend/src/app/features/registers/`)** usa `AccountService`/`CardService` para o cadastro de Cartao (`cardForm.accountId`, campo proprio da entidade `Card`, nao de `Transaction`) — nao deve ser tocado por esta issue; confirmar durante o code review que a remocao ficou restrita a `features/transactions/`.
