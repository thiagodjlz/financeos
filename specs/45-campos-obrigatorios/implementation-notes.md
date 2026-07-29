# Notas de implementacao

Branch: `feature/issue-45-campos-obrigatorios` (mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 27 de 27 concluidas (ver `tasks.md`)

## Arquivos alterados

### Backend

- `backend/src/main/resources/db/migration/V12__drop_categories_icon.sql` (novo) — `alter table categories drop column icon;` (DEC-1). `V1`/`V2` intactas; o Flyway aplicou a `V12` sem erro na suite (`Successfully applied 12 migrations ... now at version v12`).
- `backend/src/main/java/br/com/financeos/categories/Category.java` — removido o atributo `icon` e o `@Column(length = 80)` dele.
- `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java` — removido o componente `icon`; `color` passou a `@NotBlank(message = "A cor é obrigatória.")` mantendo o `@Size(max = 20, ...)`; `active` passou a `@NotNull(message = "A situação é obrigatória.") Boolean active`.
- `backend/src/main/java/br/com/financeos/categories/CategoryResponse.java` — removido o componente `icon` do record e do `from(...)`.
- `backend/src/main/java/br/com/financeos/categories/CategoryResource.java` — `apply()` sem `icon`, `color` com trim direto e `active = request.active()` (fim do default `true`); o helper `blankToNull` ficou sem uso e foi removido. `accessControl.require(...)`, `validateParent` e `validateDuplicate` intocados.
- `backend/src/main/java/br/com/financeos/shared/FieldLabels.java` — removida a entrada `icon -> Ícone`; as demais entradas e a ordem ficaram como estavam.
- `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java` — `categoryId` passou a `@NotNull(message = "A categoria é obrigatória.")` (DEC-2) e a mensagem do `@DecimalMin` de `amount` passou a "O valor deve ser maior que zero." (DEC-5), com `value = "0.01"` e o `@NotNull` preservados.
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — `validateStatus(...)` recusa `type = EXPENSE` + `status = null` com 400 "O status é obrigatório." (DEC-4), antes da checagem de `CANCELED`; ordem `validateStatus` -> `validateCategory` preservada.

### Backend — testes

- `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java` — `color`/`active` acrescentados a todos os payloads que esperam 2xx/409; `shouldReturnMessageNamingTheFieldWhenNameIsMissing` adaptado para "Informe os campos obrigatórios: Nome, Cor, Situação."; novos `shouldNotExposeIconInResponses`, `shouldIgnoreUnknownIconProperty`, `shouldRequireType`, `shouldRequireColor` (ausente, `null` e em branco), `shouldRequireActive`, `shouldApplyRequiredFieldsOnUpdate` e `shouldReturnOnlyPortugueseValidationMessages`.
- `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java` — `categoryId`/`status` acrescentados aos payloads que precisam passar da validacao; `shouldReturnAggregatedMessageNamingMissingFields` e `shouldReturnLimitMessageForAmountBelowMinimum` adaptados; novos `shouldRequireCategoryOnCreateAndUpdate`, `shouldRequireStatusForExpense`, `shouldKeepNullStatusForIncome` e `shouldNameAllMissingFields`.
- `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java` — novo `shouldRequireNameOnCreateAndUpdate` (POST com `name: ""` e PUT com `name: "   "`).
- `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java` — o helper `createTransaction` passou a persistir direto pelo `TransactionRepository` via `QuarkusTransaction.requiringNew()`, mantendo `categoryId = null` (e `status = null` para `INCOME`, espelhando o `apply()`); `cancelTransaction` continua usando o `DELETE` da API.

### Frontend — base compartilhada

- `frontend/src/app/core/field-errors.ts` (novo) — `Violation`, `extractViolations`, `collectFieldErrors(err, knownFields)`, `focusFirstInvalidField(form, errors)` (ordem do DOM) e `class FieldErrorState` (`invalid`/`message`/`clear`/`reset`/`apply`).
- `frontend/src/app/core/field-errors.spec.ts` (novo) — testes unitarios das funcoes puras e do `FieldErrorState`.
- `frontend/src/styles.scss` — `input.invalid`, `select.invalid`, `input.invalid:focus`/`select.invalid:focus` e `.field-error` acrescentados ao bloco global de `input, select`, sem mudanca de valor.
- `frontend/src/app/features/users/users.scss` — as tres regras migradas foram removidas.
- `frontend/src/app/features/users/users.ts` — os helpers privados `extractViolations`/`collectFieldErrors` foram substituidos pela funcao `collectFieldErrors` de `core/field-errors`; `FIELD_LABELS`/`FIELD_ORDER`, os `@ViewChild` e a API do template ficaram como estavam.
- `frontend/src/app/core/models.ts` — removido `icon: string | null` de `Category`.

### Frontend — telas

- `frontend/src/app/features/categories/categories.ts` — `icon` removido de `newCategoryForm()`, `save()`, `startEdit()` e `saveEdit()`; `fieldErrors`/`editFieldErrors` (`FieldErrorState` com `name`, `type`, `color`, `active`) alimentados nos `catch`, foco no primeiro invalido em `save()`, reset em `cancel()`/`startEdit()`/`exitEditDiscarding()`.
- `frontend/src/app/features/categories/categories.html` — campo Ícone removido do formulario (Cor passou a ocupar a linha inteira) e da linha de edicao; `[class.invalid]`, `(input)`/`(change)` de limpeza e `<small class="field-error">` nos quatro campos das duas areas; ref `#createForm`.
- `frontend/src/app/features/categories/categories.scss` — `.inline-name-fields` passou de tres para duas colunas (a coluna do icone saiu).
- `frontend/src/app/features/profiles/profiles.ts` — `FieldErrorState(['name'])` alimentado no `catch` de `save()` com foco no primeiro invalido; reset nos dois estagios do `cancel()` e no `edit()`.
- `frontend/src/app/features/profiles/profiles.html` — `[class.invalid]`/`(input)`/`<small class="field-error">` no `<input name="name">` e ref `#profileForm`; matriz de permissoes sem destaque (DEC-3).
- `frontend/src/app/features/transactions/transactions.ts` — `fieldErrors`/`editFieldErrors` (`transactionDate`, `description`, `amount`, `type`, `status`, `categoryId`) alimentados nos `catch` de `saveTransaction()`/`saveEdit()`, foco no primeiro invalido, reset em `clearTransactionForm()`/`startEdit()`/`exitEditDiscarding()`; `categoryName(id)` e `emptyToNull(categoryId)` intocados.
- `frontend/src/app/features/transactions/transactions.html` — `<option value="">Sem categoria</option>` virou `<option value="">Selecione</option>` no formulario e na linha de edicao (a `<option>` fixada "Nome (Inativo)" continua), `required` no select de Categoria como espelho de UX, destaque + legenda em todos os campos das duas areas e ref `#createForm`.

### Frontend — testes

- `frontend/src/app/features/categories/categories.spec.ts` — `icon` fora dos fixtures e das assercoes; novos testes de 400 (destaque + legenda, limpeza por campo, linha de edicao com estado proprio, Cancelar limpando sem HTTP).
- `frontend/src/app/features/transactions/transactions.spec.ts` — `icon` fora dos fixtures; `expectInitialForm` esperando `['Selecione', 'Mercado']`; novos testes de placeholder nos dois dropdowns, POST disparado com o placeholder, destaque/limpeza por campo, foco na ordem visual, linha de edicao com estado proprio, Cancelar limpando e "Sem categoria" para lancamento legado.
- `frontend/src/app/features/profiles/profiles.spec.ts` — novos testes de destaque do campo Nome com foco, violacao de `permissions[0].screen` so no toast, limpeza ao digitar e limpeza nos dois estagios do Cancelar.
- `frontend/src/app/core/services/category.service.spec.ts` — `icon` fora dos tres fixtures.

## Decisoes

- **`blankToNull` de `CategoryResource` removido em vez de mantido**: com `color` `@NotBlank` e `icon` fora do DTO, o helper ficou sem nenhum chamador. Manter codigo morto contraria a convencao do projeto; o `blankToNull` de `TransactionResource` (usado por `notes`) continua.
- **`shouldReturnOnlyPortugueseValidationMessages` acrescentado ao `CategoryResourceTest`** para dar evidencia automatizada ao criterio 14 (nenhuma mensagem em ingles), alem da varredura `rg -n "must not be|must be" backend/src/main/java` (vazia).
- **`FieldErrorState` recebe os campos conhecidos no construtor** em vez de a tela filtrar depois: e o filtro que mantem a violacao de `permissions[0].screen` de Perfis apenas no toast (risco apontado no plano), coberto por teste em `profiles.spec.ts`.
- **Assercoes de ausencia do icone no frontend por lista de campos**, nao por seletor `input[name="icon"]`: `expectBlankForm` compara os nomes dos controles do formulario com `['name','type','color','active']` e o corpo do `PUT` com `['active','color','name','type']`. Cobre os criterios 31/32/33 de forma mais forte e mantem a varredura `rg -n "icon" ... frontend/src/app/features/categories` vazia.
- **`DashboardResourceTest` grava `status = null` para `INCOME`** ao persistir direto pelo repositorio, espelhando o que o `TransactionResource.apply()` faria — sem isso o `total_income` do `DashboardRepository` continuaria certo, mas o dado do teste divergiria da regra de `knowledge/transactions.md`.
- **`required` no select de Categoria e seguro para o criterio 36**: o teste existente `exibe o 400 agregado do backend como alerta` ja submetia o formulario com `description` vazio (tambem `required`) e o POST era disparado, provando que a validacao nativa do navegador nao bloqueia o submit neste app. O novo teste `dispara o POST com o placeholder selecionado ...` confirma `categoryId: null` no corpo.

## Desvios em relacao ao plano e as tarefas

- **T15 mantida (sem rollback)**: `users.spec.ts` passou sem nenhum ajuste apos a delegacao de `users.ts` para `core/field-errors.ts` (161 testes verdes, incluindo os 20 de Usuarios). A condicao de rollback combinada com o usuario nao foi acionada. O `focusFirstInvalidField` do modulo novo **nao** foi adotado em Usuarios: a tela continua com os `@ViewChild` + `FIELD_ORDER` de sempre, para nao mexer no comportamento de foco que a spec poe fora de escopo.
- **Tensao entre o criterio 7 e o criterio 2 no backend**: o criterio 7 pede que `backend/src/test` nao cite `icon`, mas o criterio 2 exige um teste que **envie** `"icon"` no corpo do POST e prove o 201. Os dois testes que citam `icon` em `CategoryResourceTest` (`shouldNotExposeIconInResponses` e `shouldIgnoreUnknownIconProperty`) sao exatamente os nomeados pela "Superficie de validacao" do plano para os criterios 1 e 2 — sao assercoes de **ausencia** do campo, nao fixtures que o carregam. Nenhum outro payload de teste do backend tem `icon`. No frontend a varredura ficou totalmente vazia.
- **Criterio 28 verificado como "Cancelar nao acrescenta toast"**: apos um 400 o toast de Alerta ja esta na pilha e nao e o "Cancelar" que o remove. Os testes novos comparam o tamanho da pilha antes e depois do Cancelar (inalterado) e os testes ja existentes de Cancelar sem erro previo continuam assertando `toasts()` vazia.
- **Duas tarefas do spec de transacoes precisaram de um `settle()` extra** (`oferece o placeholder Selecione ...`): o `settle()` desse spec nao faz `detectChanges` final, entao a lista de opcoes so aparece no ciclo seguinte. Ajuste de teste, sem efeito no codigo de producao.
- **`categories.scss` nao estava listado no plano** e precisou de uma linha (`.inline-name-fields` de tres para duas colunas), senao a celula do Nome na linha de edicao ficaria com uma coluna vazia de 90px onde estava o icone.

## Verificacao executada

- `cd backend && ./mvnw test` — verde (Flyway aplicou `V12`, `now at version v12`).
- `cd backend && ./mvnw -q package -DskipTests` — sem erro.
- `cd frontend && npm test` — 161 testes, 20 arquivos, todos verdes.
- `cd frontend && npm run build` — sem erro.
- `rg -n "icon" backend/src/main/java frontend/src/app/core/models.ts frontend/src/app/features/categories` — vazia.
- `rg -n "input\.invalid|select\.invalid|\.field-error" frontend/src --glob "*.scss"` — so `styles.scss` (as tres regras novas + o `td .field-error` que ja existia).
- `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` — vazia.
- `rg -n "Situacao|Icone|obrigatori[oa]|Descricao|Lancamento|\bnao\b" frontend/src --glob '!**/*.md'` — vazia.
- `rg -n "must not be|must be" backend/src/main/java` — vazia.
- `rg -n "accessControl.require"` em `categories`, `transactions` e `profiles` — os 14 metodos seguem cobertos.

Criterios que so podem ser fechados na tela (etapa `/pipeline:verify`): 3 e 5 (subida da stack, `flyway_schema_history` e `information_schema.columns`), 29 (o CSS global nao e coberto por teste de componente) e 38 (a `<option>` fixada de categoria inativa nao tem spec de componente; o lado backend esta em `TransactionResourceTest#shouldKeepInactiveCategoryAlreadyLinkedOnUpdate`).
