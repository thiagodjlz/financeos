# Notas de implementacao

Branch: `feature/issue-89-listagem-sem-permissao-catalogo` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 13 de 14 concluidas (ver `plan.md`; T14 aberta, ver Desvios)

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/transactions/FinancialTransaction.java` — `categoryName` so leitura via `@Formula` (subselect em `categories`).
- `backend/src/main/java/br/com/financeos/transactions/TransactionResponse.java` — campo `categoryName`; sobrecarga `from(transaction, categoryName)`.
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — `validateCategory` devolve a `Category`; POST/PUT respondem com o nome dela.
- `backend/src/main/java/br/com/financeos/users/AppUser.java` — `profileName` so leitura via `@Formula` (subselect em `profiles`).
- `backend/src/main/java/br/com/financeos/users/UserResponse.java` — campo `profileName`; sobrecarga `from(user, profileName)`.
- `backend/src/main/java/br/com/financeos/users/UserResource.java` — `requireProfileExists` devolve o `Profile`; POST/PUT respondem com o nome dele.
- `backend/src/main/java/br/com/financeos/documentation/content/TransactionsAreaContent.java` — linha Categoria de Campos (aviso sem permissao) + particularidade do filtro oculto.
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — idem para Perfil.
- `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java` — `createTransaction` devolve o id; casos de `categoryName` (ativa, inativa, legado nulo, POST/PUT com troca de categoria).
- `backend/src/test/java/br/com/financeos/users/UserResourceTest.java` — casos de `profileName` (com perfil, usuario sem perfil persistido pelo repositorio, PUT trocando perfil).
- `frontend/src/app/core/models.ts` — `Transaction.categoryName`, `AppUserSummary.profileName`.
- `frontend/src/app/features/transactions/transactions.ts` / `.html` — catalogo fora do `fetch`, so com `CATEGORIES/VIEW`; coluna usa `categoryName`; campo Categoria do filtro com `*ngIf`; rotulo "…"/nome/"indisponível".
- `frontend/src/app/features/transactions/transactions.spec.ts` — helpers com permissao antes do `createComponent`; os dois casos da #87 substituidos pelos novos (CA1, CA4-CA8).
- `frontend/src/app/features/users/users.ts` / `.html` / `.spec.ts` — o mesmo para Perfis (CA2, CA4-CA8).
- `frontend/src/app/features/transactions/transaction-form.ts` / `.html` / `.spec.ts` — sem `CATEGORIES/VIEW` ou com 403 do `/options`: aviso no lugar do select, sem toast, sem `/categories/{id}` (CA9, CA10).
- `frontend/src/app/features/users/user-form.ts` / `.html` / `.spec.ts` — o mesmo para Perfis.
- `frontend/src/styles.scss` — classe global `.field-notice` (so `var(--token)`).

## Decisoes

- **`@Formula` + sobrecarga `from(entidade, nome)`**: a formula nao e recalculada apos `persist`/alteracao no contexto; POST/PUT respondem com o nome da entidade ja validada (`Category`/`Profile`).
- **Catalogo da listagem como carga paralela** (`void`, sem entrar no `Promise.all`), disparado de dentro do `fetch` para que a falha seja tentada de novo na proxima carga; estado `idle|loading|loaded|failed` num signal. Sucesso memoriza (nao repete o `/options` nas cargas seguintes, como na #87).
- **403 do `/options` na listagem** (permissao retirada durante a sessao): tratado como sem permissao — filtro some, rotulo "indisponível", sem toast e sem nova tentativa. O plano so previa esse tratamento nos formularios (CA9); estendido as listagens por coerencia, com um caso de teste em cada spec.
- **Falha 5xx/rede do catalogo**: `toast.fromHttpError` com fallback proprio; como a classificacao de 5xx/rede gera o mesmo texto da falha da lista, a de-duplicacao do `ToastService` segura um card so (caso "API fora" nos dois specs).
- **Formularios**: `categoryUnavailable`/`profileUnavailable` = `computed` de `!can(...VIEW) || negado(403)`. O aviso fica num `<label>` (mesmo layout de grade do campo) com `<span class="field-notice">`, e a legenda `field-error` do 400 continua exibivel ali. Na troca de Tipo sem permissao, a lista vazia faz o `categoryId` ser limpo (comportamento que ja existia): o back-end responde 400 "A categoria é obrigatória.". A Central diz "mantida enquanto o Tipo nao for trocado".
- Coluna usa `categoryName ?? 'Sem categoria'` / `profileName ?? '-'`: com FK e bloqueio de exclusao de categoria em uso, nome nulo so ocorre sem id.

## Desvios em relacao ao plano

- **T14 desmarcada**: varreduras de acentuacao e de cor literal saem vazias, `ListingSecurityTest` sem diff e verde (rodado escopado junto com `TransactionResourceTest`/`UserResourceTest`), nenhum `@Path` novo, `npm test` completo verde (40 arquivos, 367 testes). Falta so o `./mvnw test` **completo**, que pela regra da esteira e o portao do `/pipeline:quality-check`, nao desta etapa.
- Classes backend rodadas nesta etapa: `TransactionResourceTest`, `UserResourceTest`, `ListingSecurityTest`, `DocumentationContentTest`, `DocumentationResourceTest` — todas verdes.
- 403 do catalogo nas listagens (ver Decisoes) e o caso "API fora = um toast" foram acrescentados aos specs de listagem alem do que T6/T8 listavam.
