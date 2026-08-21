# Plano de implementacao

## Abordagem

A regra nasce toda no back-end: `CategoryRequest` ganha `@NotBlank` em `color` e `@NotNull` em `active` (e perde `icon`), `TransactionRequest` ganha `@NotNull` em `categoryId` e troca a mensagem do `@DecimalMin`, e o "status obrigatorio para despesa" (DEC-4) vira checagem no `TransactionResource`, ao lado das que ja existem la. O campo Icone sai da entidade, dos DTOs, do `FieldLabels`, do `models.ts`, da tela e do banco (migration nova `V12`, DEC-1). No front-end, em vez de copiar as ~50 linhas de mapeamento de `violations[]` que hoje vivem em `users.ts`, esse mecanismo e extraido para `core/field-errors.ts` (funcoes puras + um pequeno estado `FieldErrorState` com signal) e consumido pelas tres telas novas; Usuarios passa a importar as mesmas funcoes puras, sem mudar comportamento nem a API que seu template usa. Os estilos `input.invalid`/`select.invalid`/`.field-error` sobem de `users.scss` para `styles.scss` como utilitario global.

## Arquivos a alterar

### Backend

- `backend/src/main/java/br/com/financeos/categories/Category.java` — remover o atributo `public String icon` e o `@Column(length = 80)` dele.
- `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java` — remover o componente `icon` (e o `@Size` de 80); `color` passa a `@NotBlank(message = "A cor é obrigatória.")` mantendo o `@Size(max = 20, ...)`; `active` passa a `@NotNull(message = "A situação é obrigatória.") Boolean active`. `@NotBlank` cobre ausente, `null` e em branco de uma vez e entra na lista de "campo ausente" do `ValidationExceptionMapper`, alimentando a frase agregada.
- `backend/src/main/java/br/com/financeos/categories/CategoryResponse.java` — remover o componente `icon` do record e do `from(...)`.
- `backend/src/main/java/br/com/financeos/categories/CategoryResource.java` — em `apply()`: remover `category.icon = ...`; `category.color` passa a usar so o trim (o `blankToNull` deixa de ser alcancavel para `color`, mas continua existindo se ainda houver uso — senao remover junto); `category.active = request.active()` (o default `true` de `null` deixa de existir, consequencia assumida na spec). Nenhuma mudanca nos `accessControl.require(...)` nem em `validateParent`/`validateDuplicate`.
- `backend/src/main/java/br/com/financeos/shared/FieldLabels.java` — remover a entrada `icon -> Ícone`. As demais entradas e a ordem ficam como estao: elas ja produzem "Nome, Cor, Situação." e "Descrição, Valor, Data, Tipo, Categoria." exigidas pelos criterios.
- `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java` — `categoryId` passa a `@NotNull(message = "A categoria é obrigatória.") UUID categoryId` (DEC-2: mesmo DTO para POST e PUT, sem grupos de validacao); a mensagem do `@DecimalMin` de `amount` passa a "O valor deve ser maior que zero." (DEC-5), mantendo `value = "0.01"` e o `@NotNull` com "O valor é obrigatório.".
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — em `validateStatus(...)`, antes da checagem de `CANCELED`, recusar `request.type() == EXPENSE && request.status() == null` com `new WebApplicationException("O status é obrigatório.", BAD_REQUEST)` (DEC-4; para `INCOME` nada muda e `apply()` continua forcando `status = null`). Consequencia: o default `PENDING` de `apply()` fica inalcancavel para despesa vinda da API — manter o codigo como esta, apenas registrar no `sync-knowledge`. Nao inverter a ordem `validateStatus` -> `validateCategory`: os testes de nao-regressao de categoria dependem dela.

### Backend — testes

- `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java` — tirar `icon` dos dois payloads; acrescentar `color` e `active` a **todos** os payloads que hoje esperam 201/200/409 (`shouldCreateUpdateAndDeactivateCategory`, `shouldRejectDuplicateNameAndType`, `shouldAllowSameNameWithDifferentType`, `shouldRejectNonexistentParent`, `shouldRejectCategoryAsItsOwnParent`, `shouldCreateInactiveCategoryWhenActiveIsFalse`, `shouldReactivateCategoryViaUpdate`, `shouldExcludeInactiveCategoryFromTypeFilterButIncludeInFullList`) — sem isso eles passam a receber 400. Adaptar `shouldReturnMessageNamingTheFieldWhenNameIsMissing` para a frase nova ("Informe os campos obrigatórios: Nome, Cor, Situação.") e criar os testes novos listados na "Superficie de validacao".
- `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java` — acrescentar `categoryId` (categoria de teste criada pelo helper `createCategory`) e `status` a todos os payloads que precisam passar da validacao (`shouldCreateListUpdateAndCancelTransaction`, `shouldRejectCanceledStatusOnCreate`, `shouldRejectNonexistentCategory`/`shouldRejectCategoryOfDifferentType`/`shouldRejectInactiveCategoryOnCreate`/`shouldKeepInactiveCategoryAlreadyLinkedOnUpdate` — estes tres ultimos passam a precisar de `status` porque `validateStatus` roda antes de `validateCategory`); atualizar `shouldReturnAggregatedMessageNamingMissingFields` e `shouldReturnLimitMessageForAmountBelowMinimum` (texto novo do `@DecimalMin` e `categoryId` preenchido para isolar a violacao de `amount`); criar os testes novos da "Superficie de validacao".
- `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java` — o helper `createTransaction` posta sem `categoryId` e as assercoes dependem do agrupamento `categoryName == 'Sem categoria'`. Persistir as transacoes do teste **direto pelo `TransactionRepository`** (padrao `QuarkusTransaction.requiringNew()` ja usado em `TransactionResourceTest.createCategory`), mantendo `categoryId = null`: preserva a cobertura do `coalesce(c.name, 'Sem categoria')` do `DashboardRepository`, que continua valendo para o dado legado. O `cancelTransaction` continua usando o `DELETE` da API.

### Migration (mudanca de schema)

- `backend/src/main/resources/db/migration/V12__drop_categories_icon.sql` — `alter table categories drop column icon;` (proximo numero de versao livre: **V12**; a ultima commitada e `V11__accent_seeded_category_names.sql`). A coluna e criada na `V1` sem indice, constraint nomeada ou FK, entao o drop e direto — nao ha `DROP CONSTRAINT` a adivinhar (armadilha da `V9`). `V1` e `V2` **nao sao editadas**: o `insert ... (name, type, color, icon)` da `V2` continua valido porque a `V12` roda depois.

### Frontend

- `frontend/src/app/core/field-errors.ts` (**novo**) — o mecanismo compartilhado, extraido de `users.ts`:
  - `interface Violation { field: string; message: string }`;
  - `extractViolations(err: unknown): Violation[]` — `[]` se nao for `HttpErrorResponse` ou se o corpo nao tiver `violations` array (identico ao de hoje);
  - `collectFieldErrors(err, knownFields): Map<string, string>` — usa o segmento apos o ultimo ponto de `field` e so aceita campos que a tela tem (violacao de `permissions`/`screen` em Perfis, por exemplo, fica so no toast);
  - `focusFirstInvalidField(form: HTMLElement, errors: Map<string, string>)` — percorre `form.querySelectorAll('[name]')` **na ordem do DOM** (que e a ordem visual do formulario) e foca o primeiro cujo `name` esta no mapa; evita replicar os `@ViewChild` + `switch` de Usuarios em cada tela;
  - `class FieldErrorState` — encapsula `signal<Map<string,string>>` com `invalid(field)`, `message(field)`, `clear(field)`, `reset()` e `apply(err, knownFields)`; instanciado duas vezes por tela (formulario e linha de edicao), no lugar dos pares de signals soltos.
- `frontend/src/app/core/field-errors.spec.ts` (**novo**) — testes unitarios das funcoes puras (extracao, filtro por campo conhecido, limpeza por campo, ordem de foco pelo DOM).
- `frontend/src/app/core/models.ts` — remover `icon: string | null` de `Category`.
- `frontend/src/styles.scss` — acrescentar, junto do bloco global de `input, select` (~linha 187), as regras `input.invalid, select.invalid` (borda + `box-shadow` em `var(--expense)`), `input.invalid:focus, select.invalid:focus` e `.field-error` (`var(--expense-on-soft)`, `--fs-pill`), copiadas de `users.scss` sem mudanca de valor; o `td .field-error` de `table.fixed-layout` ja existe e permanece.
- `frontend/src/app/features/users/users.scss` — remover as tres regras migradas (fica so o `label span`). Sem outra mudanca em Usuarios.
- `frontend/src/app/features/users/users.ts` — substituir os privados `extractViolations`/`collectFieldErrors` pelas funcoes importadas de `core/field-errors`; `FIELD_LABELS`/`FIELD_ORDER`, os `@ViewChild` e os metodos `isFieldInvalid`/`fieldError`/`clearFieldError` do template ficam como estao (refatoracao sem mudanca de comportamento — "fora de escopo" da spec).
- `frontend/src/app/features/categories/categories.ts` — remover `icon` de `newCategoryForm()`, de `save()`, de `startEdit()` e de `saveEdit()` (o snapshot do `JSON.stringify` deixa de considerar icone por consequencia); adicionar `fieldErrors`/`editFieldErrors` (`FieldErrorState` com os campos `name`, `type`, `color`, `active`), alimentados no `catch` de `save()`/`saveEdit()` junto do `toast.fromHttpError` ja existente; `save()` chama `focusFirstInvalidField` com o `<form>`; `cancel()`, `startEdit()` e `exitEditDiscarding()` resetam o estado correspondente.
- `frontend/src/app/features/categories/categories.html` — remover o `<label>Ícone` do formulario (Cor deixa de dividir o `.two-cols` e ocupa a linha inteira, D3 do anexo) e o `<input name="editIcon">` da linha de edicao; adicionar em Nome/Tipo/Cor/Situacao (formulario) e nos controles da linha de edicao o `[class.invalid]`, o `(input)`/`(change)` de limpeza e o `<small class="field-error">`, no mesmo formato de `users.html`; template ref `#createForm` no `<form>` para o foco.
- `frontend/src/app/features/profiles/profiles.ts` — adicionar um `FieldErrorState` com o campo `name` (a tela tem um unico formulario, usado para criacao e edicao), alimentado no `catch` de `save()`; `cancel()` limpa o estado nos **dois** estagios; `edit()` tambem limpa ao carregar outro perfil.
- `frontend/src/app/features/profiles/profiles.html` — `[class.invalid]`/`(input)`/`<small class="field-error">` no `<input name="name">` e ref `#profileForm` no `<form>`. A matriz de permissoes **nao** recebe destaque (DEC-3: continua obrigatoria na API, o erro dela aparece so no toast).
- `frontend/src/app/features/transactions/transactions.ts` — adicionar `fieldErrors`/`editFieldErrors` (campos `transactionDate`, `description`, `amount`, `type`, `status`, `categoryId`) alimentados no `catch` de `saveTransaction()`/`saveEdit()`; `clearTransactionForm()`, `startEdit()` e `exitEditDiscarding()` resetam; `saveTransaction()` foca o primeiro invalido. `categoryName(id)` e o fallback "Sem categoria" da tabela **nao mudam**; `emptyToNull(categoryId)` continua, para o `null` chegar ao backend e a validacao ser observavel.
- `frontend/src/app/features/transactions/transactions.html` — trocar `<option value="">Sem categoria</option>` por `<option value="">Selecione</option>` no select do formulario **e** no da linha de edicao (a `<option>` fixada `"Nome (Inativo)"` da issue #20 continua); adicionar `[class.invalid]`, limpeza por evento e `<small class="field-error">` nos campos das duas areas; `required` no select de Categoria como espelho de UX; ref `#createForm` no `<form>`.

### Frontend — testes

- `frontend/src/app/features/categories/categories.spec.ts` — tirar `icon` dos fixtures e das assercoes (`expectBlankForm`, edicao inline, corpo do `PUT`); ajustar o titulo do teste de edicao inline que cita "ícone"; acrescentar testes de 400 com `violations[]` (classe `invalid` + legenda, limpeza por campo, foco, linha de edicao, Cancelar limpando sem HTTP/toast).
- `frontend/src/app/features/transactions/transactions.spec.ts` — tirar `icon` dos fixtures; `expectInitialForm` passa a esperar `['Selecione', 'Mercado']`; acrescentar os testes de destaque por campo (formulario e linha de edicao) e do POST disparado com o placeholder selecionado.
- `frontend/src/app/features/profiles/profiles.spec.ts` — acrescentar o teste de 400 destacando o campo Nome e o de Cancelar limpando o destaque nos dois estagios.
- `frontend/src/app/core/services/category.service.spec.ts` — remover `icon` dos tres fixtures.
- `frontend/src/app/features/users/users.spec.ts` — sem mudanca esperada (os testes dirigem o DOM; a refatoracao e interna). Rodar para provar a nao-regressao.

## Ordem geral

Comecar pelo back-end na ordem migration -> entidade/DTOs/resources -> testes de API, porque a remocao da coluna e a obrigatoriedade dos campos definem os contratos que o front espelha; a `V12` precisa existir antes do `docker compose up -d --build` da etapa 7, mas o codigo Java ja pode ser escrito sem ela (Hibernate valida schema so na subida). Em seguida `core/field-errors.ts` + `styles.scss` + `models.ts` (base compartilhada), depois as tres telas em qualquer ordem — cada uma consome a base pronta —, e por ultimo os specs de componente, que dependem dos seletores e textos finais dos templates. A limpeza do `icon` deve ser feita de ponta a ponta numa passada so (entidade, DTOs, `FieldLabels`, `models.ts`, tela, fixtures), senao o `npm run build` quebra por tipo faltando.

## Superficie de validacao

**Backend — Categorias: remocao do Icone**

- Criterio 1 (GET sem `icon`) — `CategoryResourceTest#shouldNotExposeIconInResponses`: `GET /categories` e `GET /categories/{id}` com `body("[0]", not(hasKey("icon")))` / `body("$", not(hasKey("icon")))`.
- Criterio 2 (POST com `icon` no corpo → 201) — `CategoryResourceTest#shouldIgnoreUnknownIconProperty`: `POST /api/categories` com `"icon": "x"` responde 201 e o corpo nao tem `icon` (o Quarkus desliga `FAIL_ON_UNKNOWN_PROPERTIES` por padrao e nao ha `ObjectMapperCustomizer` no projeto — confirmar no teste, nao no pressuposto).
- Criterio 3 (entidade sem `icon`, app sobe) — `GET http://localhost:8080/api/health` respondendo 200 depois do `docker compose up -d --build` (etapa `docker-restart`), mais a suite `./mvnw test` (que so roda com o schema valido).
- Criterio 4 (migration nova, V1/V2 intactas) — inspecao do `git status`/diff: existe `V12__drop_categories_icon.sql` e nenhum arquivo `V1`/`V2` aparece como modificado.
- Criterio 5 (Flyway aplica a V12) — na stack local: `docker compose exec postgres psql -U <user> -d financeos -c "select column_name from information_schema.columns where table_name = 'categories';"` sem `icon`, e `select version, success from flyway_schema_history order by installed_rank desc limit 1;` com `12`/`t`.
- Criterio 6 (varredura de referencias) — `rg -n "icon" backend/src/main/java frontend/src/app/core/models.ts frontend/src/app/features/categories` sem saida.
- Criterio 7 (`FieldLabels` e fixtures sem `icon`) — `rg -n "icon" backend/src/main/java/br/com/financeos/shared/FieldLabels.java backend/src/test frontend/src/app/features/categories/categories.spec.ts frontend/src/app/core/services/category.service.spec.ts frontend/src/app/features/transactions/transactions.spec.ts` sem saida, com `./mvnw test` e `npm test` verdes.

**Backend — Categorias: campos obrigatorios**

- Criterio 8 (`name` em branco) — `CategoryResourceTest#shouldReturnMessageNamingTheFieldWhenNameIsMissing` (adaptado): violacao com `field` terminando em `name` e mensagem "O nome é obrigatório.".
- Criterio 9 (sem `type`) — `CategoryResourceTest#shouldRequireType`: violacao em `type` com "O tipo é obrigatório.".
- Criterio 10 (sem `color`) — `CategoryResourceTest#shouldRequireColor`, exercitando os tres casos (ausente, `null`, `"  "`) com "A cor é obrigatória.".
- Criterio 11 (sem `active`) — `CategoryResourceTest#shouldRequireActive`: violacao em `active` com "A situação é obrigatória.".
- Criterio 12 (frase agregada) — `CategoryResourceTest#shouldReturnMessageNamingTheFieldWhenNameIsMissing`: `message` exatamente "Informe os campos obrigatórios: Nome, Cor, Situação.".
- Criterio 13 (mesmas regras no PUT) — `CategoryResourceTest#shouldApplyRequiredFieldsOnUpdate`: `PUT /categories/{id}` com corpo so de `type` retornando 400 com o mesmo `violations[]` e a mesma `message`.
- Criterio 14 (nada em ingles) — assercao nos testes acima sobre cada `violations[].message` (todas comecam por texto pt-BR conhecido) + `rg -n "must not be|must be" backend/src/main/java` sem saida.

**Backend — Perfis**

- Criterio 15 (`name` em branco) — `ProfileResourceTest#shouldRequireNameOnCreateAndUpdate`: `POST`/`PUT /api/profiles` com `name: ""` e matriz completa retornando 400, violacao em `name` = "O nome é obrigatório." e `message` = "Informe os campos obrigatórios: Nome.".

**Backend — Lancamentos**

- Criterio 16 (`categoryId` obrigatorio) — `TransactionResourceTest#shouldRequireCategoryOnCreateAndUpdate`: violacao em `categoryId` com "A categoria é obrigatória." no POST e no PUT.
- Criterio 17 (status obrigatorio em despesa) — `TransactionResourceTest#shouldRequireStatusForExpense`: `type: "EXPENSE"` sem `status` (com `categoryId` valido) → 400 com corpo `{"message": "O status é obrigatório."}`.
- Criterio 18 (receita sem status) — `TransactionResourceTest#shouldKeepNullStatusForIncome`: `type: "INCOME"` sem `status` → 201 com `status` nulo no corpo.
- Criterio 19 (`amount: 0`) — `TransactionResourceTest#shouldReturnLimitMessageForAmountBelowMinimum` (adaptado): violacao de `amount` = "O valor deve ser maior que zero." e `message` contendo a frase.
- Criterio 20 (sem `amount`) — `TransactionResourceTest#shouldReturnAggregatedMessageNamingMissingFields` (adaptado): violacao "O valor é obrigatório." e rotulo "Valor" na frase.
- Criterio 21 (cinco campos ausentes) — `TransactionResourceTest#shouldNameAllMissingFields`: corpo `{}` → `message` exatamente "Informe os campos obrigatórios: Descrição, Valor, Data, Tipo, Categoria.".
- Criterio 22 (400 de negocio preservados) — `TransactionResourceTest#shouldRejectNonexistentCategory`, `#shouldRejectCategoryOfDifferentType`, `#shouldRejectCanceledStatusOnCreate` e `#shouldKeepInactiveCategoryAlreadyLinkedOnUpdate` continuam verdes com os mesmos textos e status.

**Frontend — padrao de destaque**

- Criterio 23 (toast com a `message` agregada nas 3 telas) — `categories.spec.ts`, `profiles.spec.ts` e `transactions.spec.ts`: apos um 400 simulado, `toasts()[0].title === 'Alerta'` e `message` igual a do corpo (nao ao fallback da tela).
- Criterio 24 (classe `invalid` + legenda) — nos mesmos tres specs: `query('form input[name="..."]').classList.contains('invalid')` e o `textContent` do `small.field-error` correspondente.
- Criterio 25 (limpeza por campo) — nos mesmos specs: disparar `input`/`change` num campo destacado e conferir que so ele perde `invalid` e a legenda.
- Criterio 26 (foco no primeiro invalido na ordem visual) — `transactions.spec.ts` (o caso com mais campos): 400 com `violations[]` fora da ordem visual e `document.activeElement` igual ao primeiro campo do formulario com erro.
- Criterio 27 (edicao inline com estado proprio) — `categories.spec.ts` e `transactions.spec.ts`: 400 no Salvar da linha destaca os campos da linha, o formulario lateral segue limpo e a linha continua em edicao.
- Criterio 28 (Cancelar limpa) — nos tres specs: apos um 400, clicar em "Cancelar" e assertar ausencia de `.invalid`/`.field-error`, `httpMock.expectNone(() => true)` e pilha de toasts vazia (em Perfis, cobrindo os dois estagios).
- Criterio 29 (estilo unico) — `rg -n "input.invalid|select.invalid|\.field-error" frontend/src` mostrando as definicoes so em `styles.scss`, mais `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` vazia. **Validacao na tela** (o CSS global nao e coberto por teste de componente): em `http://localhost`, Categorias → salvar o formulario vazio e conferir que os campos ficam com contorno vermelho e a legenda aparece; repetir em Perfis e Novo lancamento; abrir Usuarios e confirmar que o destaque continua identico ao de antes.
- Criterio 30 (acentuacao) — `rg -n "Situacao|Icone|obrigatori[oa]|Descricao|Lancamento|\bnao\b" frontend/src --glob '!**/*.md'` sem saida (inclui titulos de teste novos).

**Frontend — Categorias**

- Criterio 31 (formulario sem Ícone) — `categories.spec.ts`: `query('form input[name="icon"]')` nulo e os quatro campos restantes presentes. **Validacao na tela**: menu Cadastros → Categorias, painel "Nova categoria" com apenas Nome, Tipo, Cor e Situacao, Cor ocupando a linha inteira.
- Criterio 32 (linha de edicao sem icone) — `categories.spec.ts`: `query('tbody input[name="editIcon"]')` nulo com a linha em edicao. **Validacao na tela**: em "Últimos registros", clicar "Editar" e conferir que a celula do Nome tem so o input de nome e o seletor de cor.
- Criterio 33 (PUT sem `icon`) — `categories.spec.ts`: `expect(request.request.body).not.toHaveProperty('icon')` no Salvar da linha.
- Criterio 34 (snapshot sem `icon`) — `categories.spec.ts` (teste existente "sai direto sem modal e sem HTTP"): continua verde apos a remocao do campo.

**Frontend — Lancamentos**

- Criterio 35 (dropdown sem "Sem categoria") — `transactions.spec.ts`: `categoryOptions()` = `['Selecione', 'Mercado']` no formulario e lista equivalente na linha de edicao.
- Criterio 36 (envio com o placeholder) — `transactions.spec.ts`: submeter com `categoryId` vazio dispara o `POST` (com `categoryId: null`) e o 400 simulado destaca o select de Categoria com a legenda. **Validacao na tela**: Lançamentos → preencher Data/Descricao/Valor, deixar Categoria em "Selecione", clicar "Salvar" e observar o toast de Alerta citando Categoria, o contorno vermelho e a legenda no campo.
- Criterio 37 (tabela com "Sem categoria" para legados) — `transactions.spec.ts`: fixture com `categoryId: null` renderizando "Sem categoria" na coluna Categoria.
- Criterio 38 (categoria inativa fixada) — **validacao na tela**: Lançamentos → editar um lancamento cuja categoria esta inativa, confirmar a opcao "Nome (Inativo)" selecionada e salvar sem trocar nada, obtendo o toast de Sucesso (nao ha spec de componente cobrindo o pin hoje; o backend correspondente fica coberto por `TransactionResourceTest#shouldKeepInactiveCategoryAlreadyLinkedOnUpdate`).

**Nao-regressao**

- Criterio 39 (permissoes) — `rg -n "accessControl.require" backend/src/main/java/br/com/financeos/{categories,transactions,profiles}` cobrindo todos os metodos tocados + `categories.spec.ts`/`transactions.spec.ts`/`profiles.spec.ts` no caso "sem permissao nao renderiza o formulario".
- Criterio 40 (409 de duplicidade) — `CategoryResourceTest#shouldRejectDuplicateNameAndType` e o teste de toast de duplicidade em `categories.spec.ts`, ambos ja existentes.
- Criterio 41 (reativar categoria) — `CategoryResourceTest#shouldReactivateCategoryViaUpdate` (com `color`/`active` no payload).
- Criterio 42 (modal do "Sair") — testes existentes de `categories.spec.ts`, `transactions.spec.ts` e `users.spec.ts`.
- Criterio 43 (Cancelar de dois estagios em Perfis) — testes existentes de `profiles.spec.ts`, que devem continuar verdes com o reset de `FieldErrorState` adicionado.
- Criterio 44 (toasts de Sucesso) — testes existentes de sucesso nas tres telas.
- Criterio 45 (suites e build) — `cd backend && ./mvnw test`, `./mvnw -q package -DskipTests`, `cd frontend && npm test`, `npm run build` (etapas `quality-check` e `build` da esteira).

## Riscos e pontos de atencao

- **Canal novo: mensagens de validacao viram legenda de campo em tres telas.** Ate hoje as `violations[].message` de `CategoryRequest`, `ProfileRequest`/`PermissionEntry` e `TransactionRequest` so apareciam agregadas no toast; a partir daqui cada uma vira texto fixo abaixo de um campo. Antes de fechar a implementacao, varrer `rg -n "message = \"" backend/src/main/java` e conferir que **toda** mensagem desses tres DTOs esta em portugues acentuado e sem identificador de codigo (a leitura feita no planejamento nao apontou nenhuma pendencia, mas a conferencia precisa ser refeita apos as annotations novas). O acidente da issue #39 ("Sem permissão de CREATE em CATEGORIES") veio exatamente de nao inventariar os produtores de um canal recem-aberto. Ponto especifico: `PermissionEntry.screen` produz `field = "...permissions[0].screen"`, cujo ultimo segmento (`screen`) **nao** e um campo da tela de Perfis — o filtro por `knownFields` precisa manter esse caso apenas no toast, senao a legenda apareceria colada em nenhum campo (ou no campo errado).
- **Quebra em cascata dos testes de backend existentes.** `categoryId` obrigatorio e status obrigatorio para despesa invalidam payloads de `TransactionResourceTest` e de `DashboardResourceTest`, e `color`/`active` obrigatorios invalidam quase todos os payloads de `CategoryResourceTest`. Sao falhas legitimas de contrato, nao bug de implementacao — resistir a "consertar" relaxando a validacao.
- **`DashboardResourceTest` e o agrupamento "Sem categoria"**: se as transacoes do teste passarem a ter categoria, a assercao de `categoryBreakdown` muda de significado e o `coalesce(c.name, 'Sem categoria')` do `DashboardRepository` fica sem cobertura. Por isso o plano persiste as transacoes do dashboard direto pelo repositorio.
- **Defaults que se tornam inalcancaveis pela API** (`active = true` em `CategoryResource.apply()` e `status = PENDING` para despesa): sao regras documentadas em `knowledge/categories.md` e `knowledge/transactions.md` que deixam de valer na pratica. Nao remover o codigo (ele ainda protege escrita fora da API), mas registrar a mudanca no `sync-knowledge`.
- **Edicao de lancamento legado sem categoria** (DEC-2): salvar a linha passa a exigir escolher uma categoria. Um usuario com muitos lancamentos antigos vai encontrar 400 ao editar qualquer um deles — comportamento aceito, mas e o ponto mais provavel de estranheza na validacao manual.
- **`V12` e destrutiva e irreversivel** (DEC-1): os icones semeados pela `V2` somem do banco local do usuario ao subir a stack. Nao ha rollback previsto.
- **Refatoracao de `users.ts`**: a spec poe Usuarios fora de escopo exceto pelos estilos. A troca dos helpers privados pelas funcoes de `core/field-errors.ts` e deliberadamente uma refatoracao sem mudanca de comportamento — se `users.spec.ts` precisar de qualquer ajuste, isso e sinal de que o comportamento mudou e o certo e reverter a delegacao em Usuarios (deixando so as tres telas novas usando a base compartilhada).
- **Estilos globais x budget de componente**: mover `.field-error` para `styles.scss` faz a classe valer para qualquer `<small>` do app; conferir na tela que nenhum outro componente ja usa esse nome de classe com outro proposito (`rg -n "field-error" frontend/src/app` hoje aponta so Usuarios e o utilitario de tabela).
- **Varreduras de acentuacao e de cor** (`knowledge/architecture.md`) valem para os arquivos novos: nenhuma cor literal em `.scss` de componente (as regras novas usam `var(--expense)`/`var(--expense-on-soft)` e vao para `styles.scss`) e nenhum titulo de teste novo com "obrigatorio"/"Situacao"/"Descricao" sem acento.
