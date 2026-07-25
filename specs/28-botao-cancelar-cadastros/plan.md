# Plano de implementacao

## Abordagem

Feature exclusivamente de frontend: nenhuma regra de negocio nova entra no sistema (nada e enviado ao servidor ao cancelar), entao nao ha validacao a impor no back-end nem mudanca de contrato/schema — o criterio de back-end aqui e o oposto (`backend/` intocado e `./mvnw test` verde). Nas tres telas com modo de edicao (Categorias, Usuarios, Perfis) o botao "Cancelar" deixa de ser condicionado a `editingId()` e ganha dois estagios, reaproveitando exatamente o padrao ja existente em Lancamentos: guardar um snapshot do registro como carregado no formulario (`editSnapshot`) e comparar com `JSON.stringify` (`isEditDirty()` de `transactions.ts:180-186`) — com alteracoes pendentes restaura o snapshot e mantem a edicao; sem alteracoes pendentes cai no `cancelEdit()` atual (`editingId.set(null)` + `resetForm()`). Em Lancamentos o formulario "Novo lancamento" ganha um botao de estagio unico que devolve `transactionForm` ao estado inicial, com o cuidado de repor o dropdown de categoria a partir de um cache local em vez de um novo `GET /categories?type=EXPENSE`, para nao violar o criterio de "nenhuma requisicao HTTP ao cancelar". Cada uma das quatro telas ganha o primeiro `*.spec.ts` de componente do projeto (hoje so existem specs de service e de `main-layout`).

## Arquivos a alterar

### Backend

- Nenhum. A issue nao cria regra de negocio, campo, endpoint nem validacao — nao ha o que impor no servidor (as regras existentes de Categorias/Usuarios/Perfis/Lancamentos continuam intactas em seus `*Resource`). `backend/` fica byte a byte igual e `./mvnw test` roda sem alteracoes.

### Frontend

- `frontend/src/app/features/categories/categories.ts` — adicionar `private editSnapshot: typeof this.form | null = null`; `edit()` passa a gravar `this.editSnapshot = { ...this.form }` depois de preencher o formulario; renomear `cancelEdit()` para `cancel()` com os dois estagios (se ha snapshot e `isDirty()`, faz `this.form = { ...this.editSnapshot }` e retorna mantendo `editingId`; senao `editingId.set(null)`, `editSnapshot = null`, `resetForm()`); adicionar `private isDirty(): boolean` comparando `JSON.stringify(this.form)` com o snapshot; `save()` limpa `editSnapshot` junto com `editingId.set(null)`.
- `frontend/src/app/features/categories/categories.html` — no botao da linha 40: remover `*ngIf="editingId()"` (botao sempre visivel dentro do `<form>`), manter `type="button"` e `class="ghost-button"`, trocar o handler para `(click)="cancel()"`, rotulo "Cancelar" inalterado.
- `frontend/src/app/features/users/users.ts` — mesmo tratamento de snapshot/`isDirty()`/`cancel()` de Categorias sobre `this.form` (o snapshot nasce com `password: ''`, porque `edit()` nunca carrega a senha — digitar qualquer coisa na senha ja conta como alteracao pendente e a restauracao devolve o campo vazio); `cancel()` chama `this.fieldErrors.set(new Map())` e `this.dismissError()` nos **dois** estagios (o `resetForm()` atual so limpa `fieldErrors`, nao a faixa do topo nem o `errorTimeout`); `save()` limpa `editSnapshot`.
- `frontend/src/app/features/users/users.html` — botao da linha 69: remover `*ngIf="editingId()"`, handler `(click)="cancel()"`, resto igual.
- `frontend/src/app/features/profiles/profiles.ts` — snapshot com **copia profunda** do estado do formulario: `private editSnapshot: { name: string; permissions: PermissionEntry[] } | null`, gravado em `edit()` como `{ name: this.name, permissions: this.permissions.map((p) => ({ ...p })) }`; `isDirty()` compara `JSON.stringify({ name: this.name, permissions: this.permissions })` com o snapshot serializado (a ordem das linhas e sempre a de `SCREENS`, entao a comparacao e estavel); `cancel()` no 1o estagio restaura `this.name` e `this.permissions = this.editSnapshot.permissions.map((p) => ({ ...p }))` (nova array/novos objetos, senao os checkboxes seguem mutando o snapshot) e no 2o estagio faz o `cancelEdit()` atual; `save()` limpa `editSnapshot`.
- `frontend/src/app/features/profiles/profiles.html` — botao da linha 38: remover `*ngIf="editingId()"`, handler `(click)="cancel()"`.
- `frontend/src/app/features/transactions/transactions.ts` — extrair `private newTransactionForm()` devolvendo o estado inicial (`transactionDate` com a mesma expressao `new Date().toISOString().slice(0, 10)` de hoje, `description: ''`, `amount: 0`, `type: 'EXPENSE'`, `status: 'PENDING'`, `categoryId: ''`) e usa-lo no inicializador de `transactionForm`; adicionar cache local `private readonly categoriesByType = new Map<TransactionType, Category[]>()` alimentado dentro de `loadCategoriesForType()` (e `loadCategoriesForEdit()`); adicionar `protected clearTransactionForm(): void` que faz `this.transactionForm = this.newTransactionForm()` e `this.filteredCategories.set(this.categoriesByType.get('EXPENSE') ?? this.filteredCategories())` — **sincrono, sem `await`/HTTP**. Nome distinto de `cancelTransaction(transaction)` (que cancela o lancamento, `DELETE`) e sem qualquer toque em `requestExit()`/`confirmExitYes()`/`exitEditDiscarding()` da edicao inline.
- `frontend/src/app/features/transactions/transactions.html` — envolver o botao "Salvar" da linha 43 num `<div class="two-cols">` (mesma marcacao das outras tres telas; `.two-cols` e global em `styles.scss:77`, o override `td .two-cols` de `transactions.scss:20` so vale dentro da tabela) e adicionar `<button class="ghost-button" type="button" (click)="clearTransactionForm()">Cancelar</button>` ao lado. Nao mexer no botao "Cancelar" da tabela (linha 87) nem no "Sair" da linha de edicao (linha 126).
- `frontend/src/app/features/categories/categories.spec.ts` — **novo**. Padrao de `main-layout.spec.ts` + `category.service.spec.ts`: `TestBed` com `provideHttpClient()`/`provideHttpClientTesting()`, `authService.superAdmin.set(true)` para renderizar o formulario, flush do `GET /api/categories` do `ngOnInit` e `httpMock.verify()` no `afterEach`. Testes dirigidos pelo DOM (os membros do componente sao `protected`): presenca/rotulo/`type` do botao, limpeza em modo de criacao, restauracao no 1o clique, saida da edicao no 2o clique, `expectNone` de qualquer request apos o clique e `PUT`/`POST` corretos no "Salvar" seguinte.
- `frontend/src/app/features/users/users.spec.ts` — **novo**. Idem, com flush de `GET /api/users` + `GET /api/profiles`; cobre senha como unica alteracao pendente e limpeza de `fieldErrors`/faixa do topo apos um `POST`/`PUT` respondido com 400 + `violations[]`.
- `frontend/src/app/features/profiles/profiles.spec.ts` — **novo**. Idem, com foco na matriz: um unico checkbox marcado ja e alteracao pendente, restauracao devolve cada checkbox ao estado do perfil carregado, 2o clique zera a matriz inteira.
- `frontend/src/app/features/transactions/transactions.spec.ts` — **novo**. Idem, com flush de `GET /api/transactions`, `GET /api/categories` e `GET /api/categories?type=EXPENSE`; cobre o estagio unico (limpeza), o retorno do dropdown para as categorias de Despesa apos ter trocado o tipo para Receita e a ausencia de qualquer request no clique.

### Migration (se houver mudanca de schema)

- Nao ha mudanca de schema — nenhuma migration. (Para referencia, o proximo numero de versao livre em `backend/src/main/resources/db/migration` e **V10**, ja que a ultima e `V9__remove_accounts_and_cards.sql`.)

## Ordem geral

Nao ha dependencia entre camadas (backend intocado), so entre logica e template dentro de cada tela: primeiro o componente `.ts` (snapshot, `isDirty()`, `cancel()` / `clearTransactionForm()`), depois o `.html` que passa a chamar o novo handler — trocar o template antes quebra a compilacao do Angular por metodo inexistente. Em Lancamentos, o cache `categoriesByType` precisa existir antes do `clearTransactionForm()` que o consome, senao o reset do dropdown vira um `GET` e derruba o criterio de "nenhuma requisicao HTTP". As quatro telas sao independentes entre si e podem ser feitas na ordem Categorias -> Usuarios -> Perfis -> Lancamentos (a mais simples primeiro fixa o padrao que as outras copiam); cada `*.spec.ts` vem logo depois da sua tela.

## Superficie de validacao

Numeracao seguindo a ordem dos criterios de aceite da spec.

**Presenca do botao**

- Criterio 1 (Cancelar em Categorias em modo de criacao) — teste `Categories#exibe o botao Cancelar em modo de criacao` (`categories.spec.ts`) + validacao na tela: menu Cadastros > Categoria, formulario "Nova categoria", conferir "Cancelar" ao lado de "Salvar".
- Criterio 2 (Cancelar em Usuarios em modo de criacao) — teste `Users#exibe o botao Cancelar em modo de criacao` + tela Usuarios, formulario "Novo usuario".
- Criterio 3 (Cancelar em Perfis em modo de criacao) — teste `Profiles#exibe o botao Cancelar em modo de criacao` + tela Perfis, formulario "Novo perfil".
- Criterio 4 (Cancelar em "Novo lancamento") — teste `Transactions#exibe o botao Cancelar no formulario de novo lancamento` + tela Lancamentos.
- Criterio 5 (rotulo "Cancelar" nas 4 telas e nos 2 estagios) — assert de `textContent` do botao nos 4 specs, inclusive apos o 1o clique em modo de edicao nos tres com edicao.
- Criterio 6 (`type="button"`) — assert de `button.getAttribute('type') === 'button'` nos 4 specs; na tela, confirmar que o clique nao dispara `save()` (nenhum registro criado).
- Criterio 7 (usuario sem permissao nao ve o botao) — validacao na tela: logar com um usuario cujo perfil tenha VIEW mas nao CREATE/EDIT em Categorias (tela Perfis > desmarcar Incluir/Alterar), abrir Categorias e conferir que o formulario inteiro (e portanto o botao) nao e renderizado; complementado por teste de componente sem `superAdmin` (formulario ausente), no padrao de `main-layout.spec.ts`.

**Modo de criacao**

- Criterio 8 (Categorias volta ao estado inicial) — teste `Categories#limpa o formulario em modo de criacao` (nome vazio, `EXPENSE`, `#2f7d62`, icone vazio, `active=true`) + tela: preencher tudo, clicar Cancelar, conferir campo a campo.
- Criterio 9 (Usuarios volta ao estado inicial) — teste `Users#limpa o formulario em modo de criacao` + tela: nome/e-mail/senha vazios, Perfil em "Selecione".
- Criterio 10 (Perfis: nome vazio e matriz toda desmarcada) — teste `Profiles#limpa nome e toda a matriz em modo de criacao` (assert em todos os 20 checkboxes) + tela.
- Criterio 11 (Lancamentos volta ao estado inicial, dropdown de volta em Despesa) — teste `Transactions#limpa o formulario e repoe o dropdown de Despesa` (trocar tipo para Receita, cancelar, conferir `type=EXPENSE` e as opcoes de despesa sem novo request) + tela: preencher tudo com tipo Receita, clicar Cancelar, conferir data de hoje, descricao vazia, valor 0, Despesa/Pendente/Sem categoria e as opcoes do dropdown.
- Criterio 12 (Usuarios: Cancelar limpa mensagens de validacao do backend) — teste `Users#limpa mensagens de validacao ao cancelar em modo de criacao` (flush de 400 com `violations[]`, clicar Cancelar, esperar zero `.field-error` e nenhuma `.status-bar`) + tela: salvar com e-mail invalido/senha curta, ver as legendas vermelhas, clicar Cancelar e conferir que somem.

**Modo de edicao, 1o estagio**

- Criterio 13 (Categorias restaura os valores originais) — teste `Categories#restaura os valores originais no primeiro clique` + tela: Editar numa categoria, alterar tudo, Cancelar, conferir que os campos voltaram ao valor de logo apos "Editar".
- Criterio 14 (Usuarios restaura, senha vazia) — teste `Users#restaura os valores do registro e esvazia a senha`.
- Criterio 15 (Usuarios: so senha digitada conta como alteracao) — teste `Users#trata senha digitada como alteracao pendente` (assert de que o titulo continua "Editar usuario") + tela.
- Criterio 16 (Perfis restaura nome e matriz) — teste `Profiles#restaura nome e matriz de permissoes no primeiro clique` (marcar e desmarcar checkboxes diferentes e conferir os dois sentidos).
- Criterio 17 (Perfis: um unico checkbox ja e alteracao pendente) — teste `Profiles#trata um unico checkbox como alteracao pendente` (titulo continua "Editar perfil") + tela.
- Criterio 18 (as tres telas continuam em edicao apos o 1o clique) — assert do `<h3>` do formulario nos tres specs + validacao na tela nas tres telas (titulo continua "Editar ...", formulario nao fica vazio).
- Criterio 19 (Cancelar + Salvar envia `PUT /api/{recurso}/{id}` do mesmo id) — nos tres specs, `httpMock.expectOne` apos clicar em "Salvar" conferindo `method === 'PUT'` e a URL com o id em edicao; na tela, aba Network do navegador em uma das tres.
- Criterio 20 (Usuarios: restaurar limpa mensagens de validacao) — teste `Users#limpa mensagens de validacao ao restaurar em modo de edicao` + tela.

**Modo de edicao, 2o estagio**

- Criterio 21 (Cancelar sem ter alterado nada sai da edicao no 1o clique) — teste `#sai da edicao quando nao ha alteracao pendente` nos tres specs + tela nas tres.
- Criterio 22 (Categorias: dois cliques) — teste `Categories#dois cliques restauram e depois saem da edicao` + tela (roteiro do criterio, conferindo os valores iniciais no 2o clique).
- Criterio 23 (Usuarios: dois cliques) — teste `Users#dois cliques restauram e depois saem da edicao` + tela.
- Criterio 24 (Perfis: dois cliques) — teste `Profiles#dois cliques restauram e depois saem da edicao` (matriz toda desmarcada no 2o) + tela.
- Criterio 25 (apos sair da edicao, Salvar envia `POST`) — nos tres specs, `httpMock.expectOne` com `method === 'POST'` na URL da colecao; na tela, aba Network.
- Criterio 26 (Usuarios: mensagens limpas apos sair da edicao) — coberto no mesmo teste do criterio 20, no 2o clique; conferir na tela.
- Criterio 27 (Lancamentos permanece de estagio unico) — revisao do diff de `transactions.ts`/`transactions.html` (nenhum `editingId` novo no formulario de criacao) + validacao na tela: em Lancamentos, clicar Cancelar duas vezes seguidas com o formulario ja limpo nao muda nada, e o titulo continua "Novo lancamento"; a edicao inline continua com "Salvar"/"Sair" e o modal "Deseja sair sem salvar?" funcionando.

**Efeitos colaterais proibidos**

- Criterio 28 (nenhuma requisicao HTTP no clique) — `httpMock.expectNone(...)` logo apos cada clique em "Cancelar" nos quatro specs, com `httpMock.verify()` no `afterEach` (qualquer request nao esperada quebra o teste); na tela, abrir a aba Network do navegador, limpar, clicar em "Cancelar" nas quatro telas e confirmar zero chamadas a `/api`.
- Criterio 29 (tabela lateral inalterada) — validacao na tela: nas quatro telas, anotar a contagem exibida no cabecalho do painel ("Ultimos registros" / "Usuarios" / "Perfis" / "Ultimos lancamentos"), clicar em "Cancelar" e confirmar mesma contagem e mesmas linhas.
- Criterio 30 (backend intocado, `./mvnw test` verde) — `git status`/`git diff --name-only` sem nenhum caminho sob `backend/` e execucao de `cd backend && ./mvnw test` na etapa de build.

## Riscos e pontos de atencao

- **Mudanca de comportamento existente**: hoje um unico clique em "Cancelar" sai da edicao nas tres telas; a partir daqui, com alteracoes pendentes, o 1o clique so restaura. E decisao registrada na spec, mas e uma regressao de expectativa para quem ja usa o sistema — deve entrar no `sync-knowledge` (`knowledge/categories.md`, `knowledge/users.md`, `knowledge/auth-and-permissions.md` na parte de Perfis).
- **Perfis, mutacao no lugar**: os checkboxes usam `[(ngModel)]="permission.canView"`, que **muta os objetos dentro de `this.permissions`**. Se o snapshot guardar as mesmas referencias, ele muda junto com o formulario, `isDirty()` sempre devolve `false` e a restauracao nao faz nada. Copia profunda obrigatoria na captura **e** na restauracao. Maior risco tecnico do plano.
- **Lancamentos e o `GET` escondido**: `filteredCategories` vem de `CategoryService.listByType()`, que e uma chamada HTTP (`category.service.ts:16-18`). Reusar `onTypeChange()` no reset parece natural e viola o criterio 28. Dai o cache `categoriesByType`; ele e por instancia da tela e reescrito a cada `loadCategoriesForType`, entao nao fica defasado em relacao ao que o dropdown mostra.
- **Usuarios, faixa de erro do topo**: `resetForm()` limpa `fieldErrors` mas nao `error()` nem o `errorTimeout` (`users.ts:171-187`). Sem chamar `dismissError()` explicitamente no `cancel()`, os criterios 12/20/26 falham mesmo com os campos limpos.
- **Colisao de nomes em Lancamentos**: `cancelTransaction()` ja existe e faz `DELETE /transactions/{id}` (cancelar o lancamento, ver `knowledge/transactions.md`) e a tabela ja tem um botao "Cancelar" com esse significado. O handler novo precisa de nome proprio (`clearTransactionForm`) e o botao novo vive dentro do `<form>` "Novo lancamento" — trocar um pelo outro cancelaria lancamentos de verdade.
- **Fluxo inline de Lancamentos intocado**: `requestExit()` + modal "Deseja sair sem salvar?" (que faz `transactionService.refresh()` ao confirmar, ou seja, **dispara HTTP**) esta explicitamente fora de escopo e nao deve ser unificado com o botao novo, apesar da semelhanca conceitual.
- **Gate de permissao**: o botao so pode herdar o `*ngIf` do `<form>` (`authService.can(...)`, ver `knowledge/auth-and-permissions.md`); nao adicionar `*ngIf` proprio nem move-lo para fora do formulario, sob pena de exibi-lo a quem nao pode criar/editar (criterio 7).
- **Primeiros testes de componente do projeto**: hoje so ha specs de service, de `app` e de `main-layout`. Os componentes disparam GETs no `ngOnInit` que precisam ser flushados antes de qualquer assert de "nenhuma requisicao", e os membros sao `protected` — os testes devem dirigir pelo DOM (setar `value` + `dispatchEvent(new Event('input'/'change'))`, clicar no botao, `fixture.detectChanges()`), nao acessar o componente diretamente.
- **Convencao do CLAUDE.md sobre regras no back-end**: nao ha regra nova a impor aqui e o criterio 30 exige `backend/` inalterado. Se durante a implementacao surgir necessidade de mexer no servidor, e sinal de que o escopo mudou e a etapa deve parar e perguntar.
- **Data de hoje em Lancamentos**: manter a expressao `new Date().toISOString().slice(0, 10)` ja usada (base UTC, com a defasagem de fuso que ela ja tem hoje) — trocar por data local no reset criaria divergencia entre o estado inicial e o estado pos-cancelamento.
- **Faixa de erro de Lancamentos/Categorias/Perfis**: limpar `error()` ao cancelar nao esta nos criterios (so em Usuarios); manter como esta para nao ampliar o escopo.
