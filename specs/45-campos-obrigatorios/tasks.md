# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

A numeracao dos criterios segue a ordem em que eles aparecem em `spec.md` (1 a 45), a mesma usada pela secao "Superficie de validacao" do `plan.md`.

## Migration

- [x] **T1** — Criar a migration que remove a coluna `icon` da tabela `categories`
  - Arquivos: `backend/src/main/resources/db/migration/V12__drop_categories_icon.sql`
  - Criterios: 3, 4, 5

## Backend

- [x] **T2** — Remover o campo `icon` da entidade, dos DTOs e do `apply()` de Categorias
  - Arquivos: `backend/src/main/java/br/com/financeos/categories/Category.java`, `CategoryRequest.java`, `CategoryResponse.java`, `CategoryResource.java`
  - Criterios: 1, 2, 3, 6
- [x] **T3** — Remover a entrada `icon -> Ícone` do mapa de rotulos
  - Arquivos: `backend/src/main/java/br/com/financeos/shared/FieldLabels.java`
  - Criterios: 6, 7, 12
- [x] **T4** — Tornar `color` (`@NotBlank`) e `active` (`@NotNull`) obrigatorios em `CategoryRequest` e ajustar `CategoryResource.apply()` (fim do default `active = true` e do `blankToNull` de `color`)
  - Arquivos: `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java`, `CategoryResource.java`
  - Criterios: 10, 11, 12, 13, 14
- [x] **T5** — Tornar `categoryId` obrigatorio (`@NotNull`, DEC-2) e trocar a mensagem do `@DecimalMin` de `amount` para "O valor deve ser maior que zero." (DEC-5)
  - Arquivos: `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java`
  - Criterios: 16, 19, 20, 21
- [x] **T6** — Recusar em `validateStatus(...)` o par `type = EXPENSE` + `status = null` com 400 "O status é obrigatório." (DEC-4), antes da checagem de `CANCELED` e sem inverter a ordem `validateStatus` -> `validateCategory`
  - Arquivos: `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java`
  - Criterios: 17, 18, 22
- [x] **T7** — Inventariar as `message` de Bean Validation dos DTOs cujos textos passam a virar legenda de campo, confirmando portugues acentuado e ausencia de identificador de codigo (`rg -n "message = \"" backend/src/main/java`)
  - Arquivos: `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java`, `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java`, `backend/src/main/java/br/com/financeos/profiles/ProfileRequest.java`
  - Criterios: 14

## Backend — testes

- [x] **T8** — Ajustar `CategoryResourceTest`: tirar `icon` dos payloads, acrescentar `color`/`active` a todos os payloads que esperam 2xx/409, adaptar `shouldReturnMessageNamingTheFieldWhenNameIsMissing` para "Informe os campos obrigatórios: Nome, Cor, Situação." e criar `shouldNotExposeIconInResponses`, `shouldIgnoreUnknownIconProperty`, `shouldRequireType`, `shouldRequireColor`, `shouldRequireActive`, `shouldApplyRequiredFieldsOnUpdate`
  - Arquivos: `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java`
  - Criterios: 1, 2, 7, 8, 9, 10, 11, 12, 13, 14, 40, 41
- [x] **T9** — Ajustar `TransactionResourceTest`: acrescentar `categoryId`/`status` aos payloads que precisam passar da validacao, adaptar `shouldReturnAggregatedMessageNamingMissingFields` e `shouldReturnLimitMessageForAmountBelowMinimum`, e criar `shouldRequireCategoryOnCreateAndUpdate`, `shouldRequireStatusForExpense`, `shouldKeepNullStatusForIncome`, `shouldNameAllMissingFields`
  - Arquivos: `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java`
  - Criterios: 16, 17, 18, 19, 20, 21, 22, 38
- [x] **T10** — Criar `ProfileResourceTest#shouldRequireNameOnCreateAndUpdate` (400 com violacao em `name` = "O nome é obrigatório." e `message` = "Informe os campos obrigatórios: Nome.")
  - Arquivos: `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java`
  - Criterios: 15
- [x] **T11** — Passar o helper `createTransaction` do `DashboardResourceTest` a persistir direto pelo `TransactionRepository` (`QuarkusTransaction.requiringNew()`), mantendo `categoryId = null` para preservar a cobertura do `coalesce(c.name, 'Sem categoria')`
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
  - Criterios: — (adaptacao obrigatoria ao contrato novo de T5; sem ela a suite quebra e o agrupamento "Sem categoria" fica sem cobertura)

## Frontend — base compartilhada

- [x] **T12** — Criar o mecanismo compartilhado de erros por campo extraido de `users.ts`: `Violation`, `extractViolations`, `collectFieldErrors(err, knownFields)`, `focusFirstInvalidField(form, errors)` (ordem do DOM) e `class FieldErrorState`
  - Arquivos: `frontend/src/app/core/field-errors.ts` (novo)
  - Criterios: — (base consumida por T15, T18, T19 e T21; o comportamento so e observavel nas telas)
- [x] **T13** — Criar os testes unitarios das funcoes puras (extracao, filtro por `knownFields`, limpeza por campo, ordem de foco pelo DOM)
  - Arquivos: `frontend/src/app/core/field-errors.spec.ts` (novo)
  - Criterios: — (teste da base de T12; a evidencia dos criterios 24-26 esta nos specs de tela)
- [x] **T14** — Mover `input.invalid`, `select.invalid`, `input.invalid:focus`/`select.invalid:focus` e `.field-error` de `users.scss` para o bloco global de `input, select` em `styles.scss`, sem mudanca de valor
  - Arquivos: `frontend/src/styles.scss`, `frontend/src/app/features/users/users.scss`
  - Criterios: 29
- [x] **T15** — Substituir os helpers privados `extractViolations`/`collectFieldErrors` de Usuarios pelas funcoes de `core/field-errors`, mantendo `FIELD_LABELS`/`FIELD_ORDER`, os `@ViewChild` e a API usada pelo template; rodar `users.spec.ts` para provar a nao-regressao
  - Arquivos: `frontend/src/app/features/users/users.ts`
  - Criterios: 42 (nao-regressao do "Sair" em Usuarios) — ver Lacunas: refatoracao sem criterio proprio
- [x] **T16** — Remover `icon: string | null` do modelo `Category`
  - Arquivos: `frontend/src/app/core/models.ts`
  - Criterios: 6

## Frontend — Categorias

- [x] **T17** — Remover o campo Ícone do formulario "Nova categoria" (Cor passa a ocupar a linha inteira) e da linha de edicao inline, junto com `icon` em `newCategoryForm()`, `save()`, `startEdit()` e `saveEdit()`
  - Arquivos: `frontend/src/app/features/categories/categories.html`, `categories.ts`
  - Criterios: 6, 31, 32, 33, 34
- [x] **T18** — Adicionar `fieldErrors`/`editFieldErrors` (`FieldErrorState` com `name`, `type`, `color`, `active`) alimentados nos `catch` de `save()`/`saveEdit()`, foco no primeiro invalido, reset em `cancel()`/`startEdit()`/`exitEditDiscarding()`, e no template `[class.invalid]`, `(input)`/`(change)` de limpeza, `<small class="field-error">` e ref `#createForm`
  - Arquivos: `frontend/src/app/features/categories/categories.ts`, `categories.html`
  - Criterios: 23, 24, 25, 26, 27, 28

## Frontend — Perfis

- [x] **T19** — Adicionar um `FieldErrorState` com o campo `name` alimentado no `catch` de `save()`, limpo nos **dois** estagios do Cancelar e ao carregar outro perfil em `edit()`; no template, `[class.invalid]`/`(input)`/`<small class="field-error">` no `<input name="name">` e ref `#profileForm` (a matriz de permissoes nao recebe destaque, DEC-3)
  - Arquivos: `frontend/src/app/features/profiles/profiles.ts`, `profiles.html`
  - Criterios: 23, 24, 25, 26, 28, 43

## Frontend — Lancamentos

- [x] **T20** — Trocar `<option value="">Sem categoria</option>` por `<option value="">Selecione</option>` no select de Categoria do formulario e da linha de edicao, com `required` como espelho de UX, mantendo a `<option>` fixada "Nome (Inativo)" e o `categoryName(id) -> "Sem categoria"` da tabela
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`, `transactions.ts`
  - Criterios: 35, 36, 37, 38
- [x] **T21** — Adicionar `fieldErrors`/`editFieldErrors` (`transactionDate`, `description`, `amount`, `type`, `status`, `categoryId`) alimentados nos `catch` de `saveTransaction()`/`saveEdit()`, foco no primeiro invalido, reset em `clearTransactionForm()`/`startEdit()`/`exitEditDiscarding()`, e no template `[class.invalid]`, limpeza por evento, `<small class="field-error">` e ref `#createForm`
  - Arquivos: `frontend/src/app/features/transactions/transactions.ts`, `transactions.html`
  - Criterios: 23, 24, 25, 26, 27, 28, 36

## Frontend — testes

- [x] **T22** — Ajustar `categories.spec.ts`: tirar `icon` de fixtures/assercoes (`expectBlankForm`, edicao inline, corpo do `PUT`) e do titulo do teste que o cita; acrescentar os testes de 400 com `violations[]` (classe `invalid` + legenda, limpeza por campo, linha de edicao com estado proprio, Cancelar limpando sem HTTP e sem toast)
  - Arquivos: `frontend/src/app/features/categories/categories.spec.ts`
  - Criterios: 7, 23, 24, 25, 27, 28, 31, 32, 33, 34, 39, 40, 42, 44
- [x] **T23** — Ajustar `transactions.spec.ts`: tirar `icon` dos fixtures, `expectInitialForm` esperando `['Selecione', 'Mercado']`, testes de destaque no formulario e na linha de edicao, foco no primeiro invalido na ordem visual, POST disparado com o placeholder selecionado e tabela exibindo "Sem categoria" para `categoryId: null`
  - Arquivos: `frontend/src/app/features/transactions/transactions.spec.ts`
  - Criterios: 7, 23, 24, 25, 26, 27, 28, 35, 36, 37, 39, 42, 44
- [x] **T24** — Acrescentar a `profiles.spec.ts` o teste de 400 destacando o campo Nome e o de Cancelar limpando o destaque nos dois estagios
  - Arquivos: `frontend/src/app/features/profiles/profiles.spec.ts`
  - Criterios: 23, 24, 25, 26, 28, 39, 43, 44
- [x] **T25** — Remover `icon` dos tres fixtures do spec do service de categorias
  - Arquivos: `frontend/src/app/core/services/category.service.spec.ts`
  - Criterios: 7

## Verificacao final

- [x] **T26** — Rodar as varreduras de fechamento: `rg -n "icon"` (backend/`models.ts`/Categorias/fixtures), `rg -n "input.invalid|select.invalid|\.field-error" frontend/src` (definicao unica em `styles.scss`), `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"`, a varredura de acentuacao de `knowledge/architecture.md` e `rg -n "accessControl.require"` nos resources tocados
  - Arquivos: — (verificacao; correcoes voltam aos arquivos das tarefas correspondentes)
  - Criterios: 6, 7, 29, 30, 39
- [x] **T27** — Rodar `cd backend && ./mvnw test`, `./mvnw -q package -DskipTests`, `cd frontend && npm test` e `npm run build`
  - Arquivos: — (verificacao; etapas `quality-check` e `build` da esteira)
  - Criterios: 45

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | `GET /categories` sem a propriedade `icon` | T2, T8 |
| 2 | `POST` com `icon` no corpo responde 201 ignorando o campo | T2, T8 |
| 3 | Entidade sem `icon` e aplicacao sobe (`/api/health` 200) | T1, T2 |
| 4 | Migration `V12` existe e `V1`/`V2` intactas | T1 |
| 5 | Flyway aplica a `V12` e a coluna some do banco | T1 |
| 6 | `rg "icon"` sem referencia ao campo de categoria | T2, T3, T16, T17, T26 |
| 7 | `FieldLabels` e fixtures sem `icon` | T3, T8, T22, T23, T25, T26 |
| 8 | `name` em branco -> 400 "O nome é obrigatório." | T8 |
| 9 | Sem `type` -> 400 "O tipo é obrigatório." | T8 |
| 10 | Sem `color` -> 400 com mensagem de cor obrigatoria | T4, T8 |
| 11 | Sem `active` -> 400 com mensagem de situacao obrigatoria | T4, T8 |
| 12 | Frase agregada "Informe os campos obrigatórios: Nome, Cor, Situação." | T3, T4, T8 |
| 13 | `PUT /categories/{id}` com as mesmas quatro obrigatoriedades | T4, T8 |
| 14 | Nenhuma mensagem de `CategoryRequest` em ingles | T4, T7, T8 |
| 15 | Perfis: `name` em branco -> 400 com violacao e frase agregada | T10 |
| 16 | `categoryId` obrigatorio no POST e no PUT | T5, T9 |
| 17 | `EXPENSE` sem `status` -> 400 no `TransactionResource` | T6, T9 |
| 18 | `INCOME` sem `status` -> 201 com `status: null` | T6, T9 |
| 19 | `amount: 0` -> "O valor deve ser maior que zero." | T5, T9 |
| 20 | Sem `amount` -> "O valor é obrigatório." + rotulo "Valor" | T5, T9 |
| 21 | Frase agregada com os cinco campos ausentes | T5, T9 |
| 22 | 400 de regra de negocio de Lancamentos preservados | T6, T9 |
| 23 | Toast de Alerta com a `message` agregada nas tres telas | T18, T19, T21, T22, T23, T24 |
| 24 | Classe `invalid` + legenda `field-error` por campo violado | T18, T19, T21, T22, T23, T24 |
| 25 | Editar o campo limpa so o destaque daquele campo | T18, T19, T21, T22, T23, T24 |
| 26 | Foco no primeiro invalido na ordem visual do formulario | T12, T18, T19, T21, T23, T24 |
| 27 | Edicao inline com estado de erros proprio (Categorias/Lancamentos) | T18, T21, T22, T23 |
| 28 | "Cancelar" limpa destaques sem HTTP e sem toast | T18, T19, T21, T22, T23, T24 |
| 29 | Estilos definidos uma unica vez em `styles.scss` | T14, T26 |
| 30 | Nenhum texto novo de UI sem acento | T26 |
| 31 | Formulario "Nova categoria" sem o campo Ícone | T17, T22 |
| 32 | Linha de edicao inline sem o input de icone | T17, T22 |
| 33 | `PUT /categories/{id}` sem a propriedade `icon` | T17, T22 |
| 34 | Snapshot de alteracao pendente sem `icon` | T17, T22 |
| 35 | Dropdown de Categoria com placeholder "Selecione" | T20, T23 |
| 36 | Envio com o placeholder dispara o POST e o 400 destaca o campo | T20, T21, T23 |
| 37 | Tabela continua exibindo "Sem categoria" para legados | T20, T23 |
| 38 | Opcao fixada de categoria inativa continua funcionando | T9, T20 |
| 39 | `accessControl.require` e `*ngIf="authService.can(...)"` preservados | T22, T23, T24, T26 |
| 40 | 409 de duplicidade de Categoria preservado | T8, T22 |
| 41 | Reativar categoria inativa pelo campo Situacao | T8 |
| 42 | Modal "Deseja sair sem salvar?" preservado | T15, T22, T23 |
| 43 | "Cancelar" de dois estagios de Perfis preservado | T19, T24 |
| 44 | Toast de Sucesso em escritas 2xx nas tres telas | T22, T23, T24 |
| 45 | Suites e builds de backend e frontend verdes | T27 |

## Lacunas

- **Tarefa sem criterio de aceite proprio (escopo alem da spec): T15, a delegacao de `users.ts` para `core/field-errors.ts`.** A spec poe Usuarios explicitamente em "Fora de escopo" e admite ali apenas a migracao dos estilos (T14). O plano assumiu a refatoracao como decisao de implementacao e ja prescreve o rollback no bloco de riscos ("se `users.spec.ts` precisar de qualquer ajuste, ... reverter a delegacao em Usuarios"). Fica registrado para revisao: T15 e opcional em relacao aos criterios e deve ser revertida ao primeiro sinal de mudanca de comportamento em Usuarios.
- **`ProfileResourceTest.java` nao aparece em "Arquivos a alterar" do plano** — so na "Superficie de validacao" (criterio 15). T10 foi derivada dali. Nao ha lacuna de regra: `ProfileRequest.name` ja e `@NotBlank` com a mensagem correta, entao o criterio 15 e satisfeito por codigo existente e precisa apenas do teste que o comprove.
- **Criterios cuja evidencia nao vem de teste automatizado**, dependendo da validacao manual da etapa `/pipeline:verify`: 3 e 5 (subida da stack, `flyway_schema_history` e `information_schema.columns`), 29 (CSS global nao e coberto por teste de componente) e 38 (nao ha spec de componente cobrindo a `<option>` fixada de categoria inativa; o lado backend fica em T9). Todos tem tarefa, mas a conferencia final e na tela.
- **Nenhuma regra de negocio ficaria apenas no frontend.** Conferido nos pontos de risco: o placeholder "Selecione" (T20) e o `required` do select sao espelho de UX da regra imposta por T5 (`@NotNull` em `categoryId`), e o sumico do campo Status para receita continua espelhando a regra de T6 (`EXPENSE` sem status recusado no `TransactionResource`, `INCOME` forcado a `null` no `apply()`).
