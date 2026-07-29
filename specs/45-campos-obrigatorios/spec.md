---
issue: 45
url: https://github.com/thiagodjlz/financeos/issues/45
title: "Ajuste de campos obrigatórios"
domains: [auth, categories, transactions, users]
stage: validated
branch: feature/issue-45-campos-obrigatorios
created: 2026-07-28
---

# Ajuste de campos obrigatórios

## Historia

Como usuario com permissao de cadastrar em Perfis, Categorias e Lancamentos, quero que, ao tentar gravar sem preencher um campo obrigatorio, o sistema me diga por nome quais campos faltam e destaque cada um deles em vermelho na propria tela, para que eu corrija o cadastro sem adivinhar qual campo esta errado — do mesmo jeito que ja acontece na tela de Usuarios.

## Contexto

A issue pede duas coisas que andam juntas:

1. **Replicar o padrao de feedback de validacao da tela de Usuarios** nas telas de **Perfis**, **Categorias** e **Novo Lancamento**: "ao gravar sem alguma informacao obrigatoria e exibido o alerta com o nome(s) do(s) campo(s), e os campos na tela recebem um contorno em vermelho".
2. **Definir/alinhar quais campos sao obrigatorios** em cada uma dessas telas, **remover completamente o campo Icone de Categorias** e corrigir o texto da mensagem do campo **Valor**.

### O padrao de referencia (Usuarios, issues #22/#24/#26/#39)

Hoje o padrao e composto por quatro pecas, todas ja existentes no projeto:

- **Backend**: Bean Validation nos DTOs (`UserCreateRequest`/`UserUpdateRequest`), com `message` em portugues acentuado por annotation (`knowledge/users.md`). O 400 sai pelo `ValidationExceptionMapper` (`backend/src/main/java/br/com/financeos/shared/ValidationExceptionMapper.java`) com `violations[] = [{field, message}]` **e** uma `message` agregada em portugues que nomeia os campos faltantes: `"Informe os campos obrigatórios: Nome, E-mail, Senha, Perfil."`. Os rotulos e a ordem vem de `shared/FieldLabels` (`name -> Nome`, `amount -> Valor`, `active -> Situação`, ...).
- **Toast de Alerta**: a tela chama `toast.fromHttpError(err, '<fallback>')` e a `message` agregada aparece no toast (taxonomia da issue #39 em `knowledge/architecture.md`: erro de validacao e **Alerta**, nunca Falha). Esse pedaco **ja funciona nas tres telas** — o que falta e o destaque por campo.
- **Destaque por campo**: `frontend/src/app/features/users/users.ts` mapeia cada `violations[].field` (formato `metodo.request.campo`, usa o segmento apos o ultimo ponto) para um `Map<campo, mensagem>` em dois signals separados (`fieldErrors` para o formulario de criacao, `editFieldErrors` para a linha de edicao inline). No template, cada controle recebe `[class.invalid]="isFieldInvalid('x')"` + `(input)/(change)="clearFieldError('x')"` e uma legenda `<small class="field-error">` com a mensagem da violacao. O foco vai para o **primeiro campo invalido na ordem visual do formulario** (`FIELD_ORDER`), nao na ordem do array `violations`.
- **Estilo**: `input.invalid` / `select.invalid` (borda + `box-shadow` em `var(--expense)`) e `.field-error` estao hoje em `frontend/src/app/features/users/users.scss` — **escopo de componente**. Como a regra passa a valer para quatro telas, esses estilos precisam virar utilitario global em `frontend/src/styles.scss`, seguindo a convencao "utilitarios globais primeiro" de `knowledge/architecture.md` (o `td .field-error` de `table.fixed-layout` ja e global).

### Campos obrigatorios pedidos, versus o que o backend ja exige

| Tela | Issue exige | Situacao hoje no backend |
|---|---|---|
| Perfis | Nome | `ProfileRequest.name` ja `@NotBlank` ("O nome é obrigatório."); `permissions` tem `@NotEmpty` |
| Categorias | Nome, Tipo, Cor, Situacao | `CategoryRequest`: `name` `@NotBlank`, `type` `@NotNull`; **`color` e `active` sao opcionais hoje** |
| Novo Lancamento | Data, Descricao, Valor, Tipo, Status, Categoria | `TransactionRequest`: `transactionDate`/`amount`/`type` `@NotNull`, `description` `@NotBlank`; **`status` e `categoryId` sao opcionais hoje** |

Consequencias que a mudanca provoca em regras ja documentadas e que precisam ser assumidas de forma explicita:

- **`active` em Categorias**: `knowledge/categories.md` registra que `CategoryRequest.active` e opcional e que `null` vira `true` em `CategoryResource.apply()`. Tornando `active` obrigatorio, esse default deixa de ser alcancavel pela API; a UI ja envia sempre o valor (o `<select>` de Situacao usa `[ngValue]="true"/[ngValue]="false"` e nasce em "Ativo").
- **`status` em Lancamentos**: `knowledge/transactions.md` registra que lancamentos `INCOME` sao **sempre** gravados com `status = null` (forcado em `TransactionResource.apply()`) e que o campo Status some do formulario quando o tipo e Receita. Um `@NotNull` no DTO quebraria a criacao de toda receita. Por isso "Status obrigatorio" so pode ser imposto **quando `type = EXPENSE`**, como checagem no `TransactionResource` (padrao ja usado ali por `validateStatus`/`validateCategory`, com mensagem em portugues no corpo via `BusinessExceptionMapper`). Isso tambem torna inalcancavel o default `PENDING` de `apply()` para despesas vindas da API.
- **`categoryId` em Lancamentos**: o DTO e compartilhado entre `POST` e `PUT`, entao a obrigatoriedade vale tambem para a **edicao inline**. Lancamentos antigos gravados sem categoria (permitido ate hoje) so poderao ser salvos apos escolher uma categoria (decisao DEC-2, saneamento gradual do dado legado). A opcao `"Sem categoria"` sai do dropdown de criacao e da linha de edicao (vira um placeholder `"Selecione"` vazio, como o `"Selecione"` do select de Perfil em Usuarios, para que o estado vazio exista e a validacao seja observavel); ja o fallback de **exibicao** `categoryName(id) -> "Sem categoria"` na tabela continua, porque lancamentos legados sem categoria seguem existindo.
- **Mensagem do Valor**: hoje `TransactionRequest.amount` tem `@NotNull("O valor é obrigatório.")` + `@DecimalMin(0.01, "O valor deve ser maior ou igual a 0,01.")`. O texto pedido pela issue ("O valor deve ser maior que zero.") substitui o do `@DecimalMin` — que e justamente o que o usuario ve, ja que o formulario nasce com `amount = 0` e nunca envia o campo nulo. O `@NotNull` continua com "O valor é obrigatório.", que alimenta a frase agregada "Informe os campos obrigatórios: ... Valor ...".
- **Remocao do Icone**: o campo `icon` existe hoje em `Category.java`, `CategoryRequest`, `CategoryResponse`, `CategoryResource.apply()`, `shared/FieldLabels`, `frontend/src/app/core/models.ts`, no formulario e na linha de edicao de `categories.html`/`categories.ts`, nos fixtures de `categories.spec.ts`, `category.service.spec.ts` e `transactions.spec.ts`, no payload de `CategoryResourceTest` e na coluna `categories.icon` (`V1__init.sql`, semeada pela `V2`), que sai do banco por uma migration nova (decisao DEC-1). O campo nao e exibido na tabela nem usado em nenhuma outra tela.

Tudo isso respeita a convencao do projeto (CLAUDE.md): **a regra vive no back-end**; o `required`/placeholder do front e apenas espelho de UX.

## Criterios de aceite

### Backend — Categorias: remocao do campo Icone

- [x] `GET /api/categories` e `GET /api/categories/{id}` respondem 200 e **nenhum objeto do corpo tem a propriedade `icon`** (`CategoryResponse` sem o campo).
- [x] `POST /api/categories` com um `icon` no corpo JSON responde 201 e a categoria criada e retornada sem `icon` (propriedade desconhecida ignorada, sem 400).
- [x] A entidade `Category` nao tem mais o atributo `icon`, e a aplicacao sobe normalmente (`GET /api/health` responde 200 com a stack do `docker compose up -d --build`).
- [x] Existe a migration nova `backend/src/main/resources/db/migration/V12__<descricao>.sql` com o `drop column icon` da tabela `categories`, e nenhuma migration ja commitada (`V1`, `V2`) foi editada.
- [x] Apos `docker compose up -d --build`, o Flyway aplica a `V12` sem erro e `select column_name from information_schema.columns where table_name = 'categories'` nao retorna mais `icon`.
- [x] `rg -n "icon" backend/src/main/java frontend/src/app/core/models.ts frontend/src/app/features/categories` nao retorna nenhuma referencia ao campo icone de categoria (as ocorrencias de icone de UI — `toast-icon`, `metric-icon`, `--income-icon`, `--pending-icon`, `--radius-icon`, SVGs do menu — permanecem).
- [x] `shared/FieldLabels` nao mapeia mais `icon`, e os testes `CategoryResourceTest` e `categories.spec.ts`/`category.service.spec.ts`/`transactions.spec.ts` nao enviam nem esperam `icon` em nenhum payload/fixture.

### Backend — Categorias: campos obrigatorios

- [x] `POST /api/categories` com `name` em branco retorna 400 com `violations[]` contendo um item cujo `field` termina em `name` e `message` = "O nome é obrigatório.".
- [x] `POST /api/categories` sem `type` retorna 400 com violacao em `type` e `message` = "O tipo é obrigatório.".
- [x] `POST /api/categories` sem `color` (ausente, `null` ou em branco) retorna 400 com violacao em `color` e mensagem em portugues acentuado dizendo que a cor e obrigatoria.
- [x] `POST /api/categories` sem `active` retorna 400 com violacao em `active` e mensagem em portugues acentuado dizendo que a situacao e obrigatoria.
- [x] `POST /api/categories` com `name`, `color` e `active` todos ausentes retorna 400 cuja `message` agregada e exatamente "Informe os campos obrigatórios: Nome, Cor, Situação." (ordem definida por `FieldLabels`).
- [x] `PUT /api/categories/{id}` aplica as mesmas quatro obrigatoriedades (mesmo DTO), retornando 400 com o mesmo formato.
- [x] Nenhuma mensagem de validacao de `CategoryRequest` sai em ingles (nenhum texto default do Hibernate Validator no corpo do 400).

### Backend — Perfis

- [x] `POST /api/profiles` e `PUT /api/profiles/{id}` com `name` em branco retornam 400 com `violations[]` contendo `field` terminando em `name`, `message` = "O nome é obrigatório." e `message` agregada "Informe os campos obrigatórios: Nome.".

### Backend — Lancamentos

- [x] `POST /api/transactions` sem `categoryId` retorna 400 com violacao em `categoryId` e mensagem em portugues acentuado dizendo que a categoria e obrigatoria; a mesma regra vale para `PUT /api/transactions/{id}`.
- [x] `POST /api/transactions` com `type: "EXPENSE"` e `status` ausente/`null` retorna 400 com corpo `{"message": "..."}` em portugues dizendo que o status e obrigatorio (checagem no `TransactionResource`, nao `@NotNull` no DTO).
- [x] `POST /api/transactions` com `type: "INCOME"` e `status` ausente continua respondendo 201 e grava `status: null` (nao-regressao da regra "receita nunca tem status", `knowledge/transactions.md`).
- [x] `POST /api/transactions` com `amount: 0` retorna 400 cuja violacao de `amount` tem a mensagem **exatamente** "O valor deve ser maior que zero." (e a `message` agregada contem essa frase).
- [x] `POST /api/transactions` sem `amount` continua retornando 400 com a violacao "O valor é obrigatório." e o rotulo "Valor" na frase agregada.
- [x] `POST /api/transactions` sem `transactionDate`, `description`, `amount`, `type` e `categoryId` retorna 400 cuja `message` agregada e exatamente "Informe os campos obrigatórios: Descrição, Valor, Data, Tipo, Categoria." (ordem de `FieldLabels`).
- [x] Os 400 de regra de negocio ja existentes de Lancamentos continuam com o mesmo texto e status: categoria inexistente, categoria de tipo incompativel e `CANCELED` via POST/PUT (nao-regressao).

### Frontend — padrao de destaque replicado (Categorias, Perfis, Novo Lancamento)

- [x] Em cada uma das tres telas, um `POST`/`PUT` que responde 400 com `violations[]` faz aparecer um **toast de Alerta** com a `message` agregada do backend (ex.: "Informe os campos obrigatórios: Nome, Cor, Situação."), e nao o texto de fallback fixo da tela.
- [x] Em cada uma das tres telas, todo campo citado em `violations[]` recebe a classe `invalid` (contorno vermelho) **e** uma legenda `<small class="field-error">` abaixo dele com a `message` daquela violacao — verificavel no DOM apos um 400 simulado no spec de componente da tela.
- [x] Editar o valor de um campo destacado (evento `input` em `<input>` ou `change` em `<select>`) limpa o destaque e a legenda **daquele campo** sem afetar os demais.
- [x] Apos um 400 no formulario de criacao (Nova categoria / Novo perfil / Novo lancamento), o foco do navegador vai para o **primeiro campo invalido na ordem visual do formulario**, nao na ordem do array `violations`.
- [x] Em Categorias e Lancamentos, um 400 no **Salvar da linha de edicao inline** destaca os campos da propria linha (signal de erros separado do formulario de criacao, como `editFieldErrors` em Usuarios) e mantem a linha em edicao.
- [x] O botao "Cancelar" do formulario das tres telas limpa os destaques e as legendas junto com o reset do formulario, **sem disparar nenhuma requisicao HTTP e sem toast** (`httpMock.expectNone(() => true)` + pilha de toasts vazia).
- [x] Os estilos `input.invalid`, `select.invalid` e `.field-error` ficam definidos **uma unica vez** em `frontend/src/styles.scss` (removidos de `users.scss`), e a varredura `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` continua saindo vazia.
- [x] Nenhum texto novo de UI sem acento: `rg -n "Situacao|Icone|obrigatori[oa]|Descricao|Lancamento|\bnao\b" frontend/src --glob '!**/*.md'` continua vazia apos a mudanca.

### Frontend — Categorias

- [x] O formulario "Nova categoria" nao tem mais o campo "Ícone"; os campos exibidos sao Nome, Tipo, Cor e Situacao.
- [x] A linha de edicao inline de "Últimos registros" nao tem mais o input de icone na celula do Nome — restam o input de Nome, o seletor de cor, os selects de Tipo e Situacao e os botoes Salvar/Sair.
- [x] O `PUT /api/categories/{id}` do "Salvar" da linha de edicao envia o corpo sem a propriedade `icon`.
- [x] O snapshot de alteracao pendente (`JSON.stringify`) da linha de edicao deixa de considerar `icon`: entrar em edicao e clicar em "Sair" sem alterar nada continua saindo direto, sem modal e sem HTTP.

### Frontend — Lancamentos

- [x] O dropdown de Categoria do formulario "Novo lancamento" e o da linha de edicao nao oferecem mais a opcao "Sem categoria": a opcao vazia e um placeholder "Selecione" e todas as demais opcoes sao categorias reais.
- [x] Enviar o formulario com o placeholder "Selecione" ainda selecionado dispara o `POST` e o 400 do backend destaca o campo Categoria em vermelho com a legenda da violacao (a regra nao e bloqueada apenas no front).
- [x] A tabela "Últimos lancamentos" continua exibindo "Sem categoria" para lancamentos legados gravados sem categoria (nao-regressao de `categoryName(id)`).
- [x] A opcao fixada de categoria inativa na edicao inline (`"Nome (Inativo)"`, issue #20) continua funcionando: editar um lancamento cuja categoria esta inativa e salvar sem trocar de categoria responde 2xx.

### Regras existentes que precisam sobreviver (nao-regressao)

- [x] Todos os endpoints tocados continuam iniciando por `accessControl.require(Screen.X, Action.Y)`, e os formularios continuam envolvidos pelo `*ngIf="authService.can(...)"` correspondente — a visibilidade por permissao e o 403 generico ("Você não tem permissão para realizar esta ação.") nao mudam.
- [x] O 409 de duplicidade de Categoria ("Já existe uma categoria com esse nome e tipo.") continua chegando com corpo e sendo exibido como toast de Alerta, com a linha permanecendo em edicao.
- [x] Reativar uma categoria inativa pelo campo Situacao (`PUT` com `active: true`) continua funcionando.
- [x] O "Sair" da edicao inline (Categorias, Lancamentos, Usuarios) continua abrindo o modal "Deseja sair sem salvar?" com alteracao pendente e saindo sem HTTP quando nao ha alteracao.
- [x] O "Cancelar" de **dois estagios** de Perfis (issue #28: 1o clique restaura o snapshot em edicao, 2o sai da edicao) continua com o mesmo comportamento, sem HTTP.
- [x] Escritas com 2xx continuam disparando toast de **Sucesso** nas tres telas.
- [x] `cd backend && ./mvnw test` e `cd frontend && npm test` passam; `./mvnw -q package -DskipTests` e `npm run build` completam sem erro.

## Fora de escopo

- Alterar a tela de **Usuarios** em regra ou comportamento: ela e a referencia do padrao. A unica mudanca aceita ali e a migracao dos estilos `input.invalid`/`select.invalid`/`.field-error` de `users.scss` para `styles.scss`, sem mudanca visual.
- Validacao client-side antecipada que **impeca** o envio do formulario (bloquear o `submit` antes do HTTP): a regra e do back-end e o destaque nasce da resposta 400, como na issue #22.
- Reintroduzir subcategorias, categorias por usuario ou qualquer mudanca no catalogo global de categorias (`knowledge/categories.md`).
- Backfill/migracao de dados de lancamentos antigos sem categoria: o saneamento e gradual, feito pelo usuario ao editar cada lancamento (decisao DEC-2).
- Mudar a taxonomia de toasts, o layout das telas, o menu lateral ou o design system.
- Tornar `permissions` de Perfis opcional (decisao DEC-3: o `@NotEmpty` permanece).

## Anexo de design

O anexo da issue foi baixado em `specs/45-campos-obrigatorios/design/campos-categorias.png` pelo comando que gerou esta spec. **Nao e um mockup de redesign**: e um print da tela **Categorias** no estado atual, painel "Últimos registros", com a linha de edicao inline aberta (Nome "Bebe", seletor de cor, campo de texto "baby", selects Tipo/Situacao, botoes Salvar/Sair) e uma **anotacao vermelha "Remover" com uma seta apontando para o campo de texto "baby"** — o campo **Icone**. A descricao do conteudo do arquivo foi fornecida pelo comando chamador; nenhum valor visual novo foi extraido dele.

### Tokens extraidos do mockup

| Token | Valor | Origem no arquivo |
|---|---|---|
| — | — | Nao se aplica: o anexo e um print do app atual com uma anotacao de remocao, nao um redesign. Nenhuma cor, sombra, raio, tipografia ou densidade nova e introduzida por esta issue; tudo continua vindo dos tokens de `frontend/src/styles.scss`. |

### Telas do mockup -> arquivos do app

| Area do print | Arquivos |
|---|---|
| Tela "Categorias" (titulo + grid) | `frontend/src/app/features/categories/categories.html`, `categories.ts`, `categories.scss` |
| Painel "Últimos registros" / linha em edicao inline (Nome, cor, **icone**, Tipo, Situacao, Salvar/Sair) | `frontend/src/app/features/categories/categories.html` (bloco `<tr *ngIf="editingId() === category.id">`) e `categories.ts` (`editForm`, `startEdit`, `saveEdit`) |
| Campo apontado pela anotacao "Remover" | input `name="editIcon"` em `categories.html` + `form.icon`/`editForm.icon` em `categories.ts` + `CategoryRequest.icon`/`CategoryResponse.icon`/`Category.icon` no backend + `icon` em `core/models.ts` |
| Colunas da tabela (NOME, TIPO, SITUACAO, acoes) | `<colgroup>`/`<thead>` de `categories.html` (inalterados) |

### Divergencias entre o mockup e o app atual

| # | Divergencia | Como a spec resolve |
|---|---|---|
| D1 | O print mostra o campo de texto do **icone** na linha de edicao, com a anotacao "Remover" | **O mockup prevalece**: o campo Icone sai da linha de edicao, do formulario, dos DTOs, da entidade, do `models.ts` e dos fixtures. E o **mesmo** campo citado no texto da issue ("remover o campo ícone") — nao sao duas remocoes diferentes |
| D2 | A tabela do print nao exibe coluna de icone | **Nao ha divergencia**: a tabela ja nao exibe icone hoje; nenhuma coluna muda de largura ou de conteudo |
| D3 | O print nao desenha o formulario lateral "Nova categoria" | **O comportamento atual prevalece**: o formulario continua existindo com Nome, Tipo, Cor e Situacao. Com o Icone fora, o campo **Cor** deixa de dividir o `.two-cols` e passa a ocupar a linha inteira, na mesma posicao; Situacao continua abaixo. Nenhum outro campo e removido |
| D4 | O print nao desenha estados de erro (contorno vermelho, legenda, toast) | **O comportamento pedido pelo texto da issue prevalece**: a ausencia no print nao autoriza omitir o destaque; o visual do estado invalido e o mesmo ja usado em Usuarios (`var(--expense)`), sem token novo |
| D5 | O print nao desenha o modal "Deseja sair sem salvar?" nem os toasts | **O comportamento atual prevalece**: omissao no print nao remove estado existente |
| D6 | O print mostra a categoria "Bebe" sem acento | **Ignorado como dado**: o print e anterior a `V11__accent_seeded_category_names.sql` (issue #39), que corrigiu o nome para "Bebê". Nada a fazer |

## Decisoes

- **DEC-1 — Coluna `categories.icon` sai do banco** (2026-07-28): a remocao do campo Icone e completa tambem no schema, via migration nova `V12` com `alter table categories drop column icon`. O usuario aceitou explicitamente o carater destrutivo e irreversivel (perda dos icones semeados pela `V2`). A `V2__seed_default_categories.sql` **nao pode ser editada** (migration ja commitada): o `insert` com `icon` continua valido porque a `V12` roda depois dela.
- **DEC-2 — `categoryId` obrigatorio em `POST` e `PUT`** (2026-07-28): regra uniforme no DTO compartilhado, **sem grupos de validacao separados**. Editar um lancamento legado gravado sem categoria passa a exigir escolher uma antes de salvar — comportamento aceito como saneamento gradual do dado antigo.
- **DEC-3 — Perfis: `@NotEmpty` em `ProfileRequest.permissions` permanece** (2026-07-28): a frase "somente o nome e obrigatorio" da issue trata apenas de quais campos entram no alerta e no contorno vermelho; a matriz de permissoes nao entra no destaque de campos e continua obrigatoria na API (a UI sempre a envia completa).
- **DEC-4 — Status exigido apenas quando `type = EXPENSE`** (2026-07-28): checagem no `TransactionResource`, nao `@NotNull` no DTO. Receita continua sendo gravada com `status = null`, preservando a regra de `knowledge/transactions.md`.
- **DEC-5 — Texto do Valor substitui a mensagem do `@DecimalMin`** (2026-07-28): `@DecimalMin` passa a "O valor deve ser maior que zero." e o `@NotNull` mantem "O valor é obrigatório.", que alimenta a frase agregada de campos obrigatorios.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/45
- Anexo de design: `specs/45-campos-obrigatorios/design/campos-categorias.png`
- Spec de referencia do padrao: `specs/22-destaque-erro-validacao-usuario/spec.md`
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/auth-and-permissions.md`, `knowledge/users.md`, `knowledge/categories.md`, `knowledge/transactions.md`
- Codigo consultado: `frontend/src/app/features/users/{users.ts,users.html,users.scss}`, `frontend/src/app/features/categories/{categories.ts,categories.html}`, `frontend/src/app/features/profiles/profiles.html`, `frontend/src/app/features/transactions/transactions.html`, `frontend/src/styles.scss`, `frontend/src/app/core/models.ts`, `backend/src/main/java/br/com/financeos/shared/{FieldLabels.java,ValidationExceptionMapper.java}`, `backend/src/main/java/br/com/financeos/categories/{CategoryRequest.java,CategoryResource.java,CategoryResponse.java,Category.java}`, `backend/src/main/java/br/com/financeos/profiles/ProfileRequest.java`, `backend/src/main/java/br/com/financeos/transactions/{TransactionRequest.java,TransactionResource.java}`, `backend/src/main/resources/db/migration/`
