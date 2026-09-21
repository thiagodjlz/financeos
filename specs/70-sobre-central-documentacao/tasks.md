# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Quatro frentes encadeadas, na ordem do plano: **(1)** privilegio, migration e contrato no back-end (T1 a T18) — precisa vir inteira antes, porque a migration tem de existir antes de qualquer subida da stack com o valor novo de `Screen` e o contrato JSON precisa estar fechado antes de o front tipar qualquer coisa; **(2)** tela de Perfis (T19 a T21), que so depende do enum; **(3)** menu e Central (T22 a T31), na dependencia `models` -> `service` -> `ts` -> `html` -> `scss` -> rota -> menu; **(4)** porta de entrada (T32 a T40), a ultima e a de maior risco de regressao, feita de uma vez so e com `npm test` rodado **antes** de tocar no guard e no login. As varreduras, os testes finais e a evidencia de `implementation-notes.md` fecham em T41 a T44.

A redacao do conteudo e uma tarefa por area (T6, T8 a T12), como manda o plano. Cada uma dessas tarefas **acrescenta uma linha ao indice `DocumentationContent`**, de modo que o modulo compile e o endpoint responda a cada passo — e esse mesmo desenho e a prova do criterio 47.

## Backend — privilegio, migration e contrato

- [x] **T1** — Acrescentar o valor `DOCUMENTATION` ao enum `Screen`, como sexto e unico valor novo. Efeito automatico e desejado: `AccessControl.effectivePermissions()` e `ProfileResource.resolvePermissions()` percorrem `Screen.values()` e passam a devolver **6** entradas em `GET /auth/me` e em `GET /api/profiles`. Nenhum valor "ABOUT"/"SOBRE" e criado — o grupo do menu e agrupador visual sem `Screen` propria.
  - Arquivos: `backend/src/main/java/br/com/financeos/profiles/Screen.java`
  - Criterios: 1, 17

- [x] **T2** — Antes de escrever a migration, confirmar na base local os nomes reais das constraints de `profile_permissions` (`select conname, contype from pg_constraint where conrelid = 'profile_permissions'::regclass;`, via `docker compose exec postgres psql`) e guardar a saida crua para a T44. O plano ja conferiu no repositorio que a `V9` nomeou o check como `profile_permissions_screen_check` e a `V5` a unique como `profile_permissions_profile_screen_uk`, mas **um `drop constraint` com nome errado quebra o Flyway e o backend nao sobe** (pegadinha da issue #20) — por isso a confirmacao e tarefa propria e vem antes da T3.
  - Arquivos: — (consulta no container; a saida vai para `implementation-notes.md` na T44)
  - Criterios: 2

- [x] **T3** — Criar a migration `V13__add_documentation_screen.sql` fazendo **duas coisas e nada alem**: (a) `drop constraint` + `add constraint` do check de `profile_permissions.screen` com os 6 valores incluindo `'DOCUMENTATION'` (nomes confirmados na T2); (b) `insert into profile_permissions (profile_id, screen, can_view, can_create, can_edit, can_delete) select p.id, 'DOCUMENTATION', true, false, false, false from profiles p on conflict on constraint profile_permissions_profile_screen_uk do nothing;` (Decisao PA1 — seed para **todo** perfil existente, idempotente pela unique). **Nenhum `update`** em linha preexistente de outra tela e **nenhuma** migration ja commitada e editada.
  - Arquivos: `backend/src/main/resources/db/migration/V13__add_documentation_screen.sql`
  - Criterios: 2, 3, 48

- [x] **T4** — No `ProfileResource`, fazer `savePermissions(...)` persistir a entrada cuja `screen` e `DOCUMENTATION` com `canView` **como enviado** e `canCreate/canEdit/canDelete` forcados a `false` (Decisao PA2). E a **unica** regra de negocio nova fora do uso do `AccessControl`: o payload "errado" e aceito e saneado (2xx), sem excecao nova e sem mensagem nova. As outras cinco telas continuam gravando os quatro flags como enviados. Esta e a razao pela qual as celulas ausentes na tela de Perfis (T20) sao so espelho, e nao a regra.
  - Arquivos: `backend/src/main/java/br/com/financeos/profiles/ProfileResource.java`
  - Criterios: 8, 14, 50

- [x] **T5** — Criar os records do contrato tipado no pacote novo `documentation`: `DocumentationResponse(title, introduction, areas)` — com a introducao em **campo proprio**, separada de `areas`, para que "exatamente 5 areas" seja afirmacao testavel —, `DocumentationArea(id, title, summary, sections)` (o `id` e slug, nunca exibido), `DocumentationSection(title, blocks)`, `DocumentationBlock(kind, text, items, table)` com `enum Kind { PARAGRAPH, LIST, TABLE, HIGHLIGHT }` aninhado e as fabricas `paragraph/list/highlight/table`, e `DocumentationTable(columns, rows)`. As fabricas existem para que os arquivos de conteudo nao precisem citar o nome do enum (criterio 38) e as `columns` sao o que vira `data-label` de cada `<td>` no front (criterio 45).
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/{DocumentationResponse,DocumentationArea,DocumentationSection,DocumentationBlock,DocumentationTable}.java`
  - Criterios: — (contrato de infraestrutura; nao publica regra nem texto proprio, mas e o que torna verificaveis os criterios 29, 38, 40, 44 e 45)

- [x] **T6** — Criar `content/DocumentationContent.java` (indice que monta o `DocumentationResponse`) e `content/OverviewContent.java` (bloco introdutorio "Como utilizar o sistema": finalidade do sistema, conceitos gerais — lancamento, categoria, perfil/permissao, periodo — e como navegar). Neste passo a lista de areas nasce **vazia** e cresce uma linha por tarefa de area (T8 a T12): e esse desenho que faz "acrescentar uma area = um arquivo novo em `content/` + uma linha no indice", exercicio do criterio 47. Fonte da redacao: `knowledge/README.md` + `knowledge/auth-and-permissions.md`. Enquanto escreve, preencher as linhas correspondentes da tabela de rastreamento e da secao de inconsistencias da T44 — nunca depois.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/DocumentationContent.java`, `.../content/OverviewContent.java`
  - Criterios: 36, 37, 38, 40, 47

- [x] **T7** — Criar `DocumentationResource`: `@Path("/documentation")`, `@Produces(APPLICATION_JSON)`, `@Authenticated`, com **um unico** metodo `@GET` cuja **primeira linha** e `accessControl.require(Screen.DOCUMENTATION, Action.VIEW)`, devolvendo `DocumentationContent.build()`. Sem repositorio, sem tabela, sem estado e **sem nenhum** `@POST/@PUT/@DELETE/@PATCH` no pacote. O 403 e o 401 vem do `AccessControl` ja existente — nenhuma mensagem nova nasce.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/DocumentationResource.java`
  - Criterios: 4, 7, 8

- [x] **T8** — Redigir a area **Resumo** (`SummaryAreaContent`) e acrescentar a linha correspondente no indice. Secoes minimas Descricao, Funcionalidades, Campos, Regras de negocio e Acoes, mais Filtros / Indicadores e calculos / Comportamentos e particularidades **so quando aplicaveis** e nunca com titulo sem conteudo. Fatos obrigatorios: Saldo = Receitas menos Despesas **pagas**; despesa pendente aparece so no indicador "Pendente"; a selecao de Ano/Mes oferece os periodos do proprio usuario; mes sem dados mostra a tela zerada e ano sem lancamentos e recusado com "Não há lançamentos no ano informado.". Fonte: `knowledge/dashboard.md` (ver a **Lacuna 1**: a redacao precisa cobrir as excecoes de ano/mes corrente, senao publica regra que o codigo nao aplica). Paragrafo <= 600 caracteres, so rotulos em portugues da UI, nada de Contas/Cartoes/Relatorios/Excel/recorrencia/subcategoria.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/SummaryAreaContent.java`, `.../content/DocumentationContent.java`
  - Criterios: 30, 31, 35, 36, 37, 38, 40

- [x] **T9** — Redigir a area **Lancamentos** (`TransactionsAreaContent`) e acrescentar a linha no indice, com as mesmas regras de estrutura e redacao da T8. Fatos obrigatorios: excluir um lancamento e **cancelar** (passa a "Cancelado", continua consultavel e nunca e removido); categoria obrigatoria e do mesmo tipo do lancamento; campo de situacao/status so existe para despesa; valor maior que zero. Fonte: `knowledge/transactions.md`.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/TransactionsAreaContent.java`, `.../content/DocumentationContent.java`
  - Criterios: 30, 32, 35, 36, 37, 38, 40

- [x] **T10** — Redigir a area **Categorias** (`CategoriesAreaContent`) e acrescentar a linha no indice. Fatos obrigatorios: catalogo **compartilhado** (nao ha categoria por usuario hoje); excluir torna **Inativa** e o campo Situacao reativa; nome + tipo nao se repetem ("Já existe uma categoria com esse nome e tipo."); categoria inativa some do seletor de novos lancamentos mas continua aparecendo nos lancamentos que ja a usavam. Fonte: `knowledge/categories.md`.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/CategoriesAreaContent.java`, `.../content/DocumentationContent.java`
  - Criterios: 30, 33, 35, 36, 37, 38, 40

- [x] **T11** — Redigir a area **Usuarios** (`UsersAreaContent`) e acrescentar a linha no indice. Fatos obrigatorios: e-mail unico; senha de 8 a 72 caracteres e campo em branco na edicao mantem a senha atual; perfil obrigatorio; "excluir" apenas desativa; o usuario **nao pode desativar a propria conta**. Fonte: `knowledge/users.md` (atencao ao registrar na T44 que a trava da propria conta existe **so no `DELETE`** — o `PUT` com `active: false` e aceito hoje; divergencia se registra, nao se resolve aqui).
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java`, `.../content/DocumentationContent.java`
  - Criterios: 30, 34, 35, 36, 37, 38, 40

- [x] **T12** — Redigir a area **Perfis** (`ProfilesAreaContent`) e acrescentar a **quinta e ultima** linha do indice, fechando a Central em introducao + 5 areas na ordem do menu. Fatos obrigatorios: o perfil e um conjunto de permissoes por tela e acao (Ver/Incluir/Alterar/Excluir); salvar substitui a matriz inteira; perfil **em uso por usuarios nao pode ser excluido**; sem a permissao de Ver, a tela nao aparece no menu nem pode ser aberta pela URL. Fonte: `knowledge/auth-and-permissions.md`.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java`, `.../content/DocumentationContent.java`
  - Criterios: 29, 30, 34, 35, 36, 37, 38, 40

## Testes de backend

- [x] **T13** — Criar `DocumentationResourceTest`, com `@TestSecurity(user = "dev@financeos.local")` + `@JwtSecurity(sub = "00000000-0000-0000-0000-000000000001")` de classe (padrao das suites de dominio): `shouldReturnDocumentationForAllowedUser` — 200, `areas.size() == 5`, titulos `Resumo, Lançamentos, Categorias, Usuários, Perfis` **na ordem** e `introduction.title` presente.
  - Arquivos: `backend/src/test/java/br/com/financeos/documentation/DocumentationResourceTest.java`
  - Criterios: 4, 29

- [x] **T14** — Criar `DocumentationSecurityTest`, classe **sem `@TestSecurity` de classe**, no padrao de `AuthResourceTest`/`DashboardPeriodsSecurityTest` (usuario e perfil inseridos por SQL nativo com UUID constante no `@BeforeEach`, removidos no `@AfterEach`): `shouldRequireAuthentication` (sem `Authorization` -> 401); `shouldDenyProfileWithoutDocumentationRow` (perfil sem nenhuma `profile_permissions` -> 403 com `message` exatamente `"Você não tem permissão para realizar esta ação."`); `shouldDenyProfileWithDocumentationViewFalse` (linha `DOCUMENTATION` com `can_view = false` -> 403; e tambem a prova no back-end de que remover o privilegio funciona); `shouldAllowHiddenSuperAdmin` (`owner@financeos.internal`, semeado na V6 sem `profileId` -> 200).
  - Arquivos: `backend/src/test/java/br/com/financeos/documentation/DocumentationSecurityTest.java`
  - Criterios: 5, 6, 7, 12

- [x] **T15** — Criar `DocumentationContentTest`, **JUnit puro** sobre `DocumentationContent.build()` (conteudo estatico; nao precisa de `@QuarkusTest`), varrendo a arvore inteira: introducao + exatamente 5 areas; toda secao com ao menos um bloco e todo bloco com conteudo nao vazio; nenhum titulo de area/secao casando `Contas|Cartões|Cartoes|Relatórios|Relatorios|Excel|Recorrência|Subcategoria`; nenhum texto exibido casando a lista de identificadores tecnicos do criterio 38; nenhum paragrafo acima de **600** caracteres; toda tabela com o mesmo numero de celulas por linha que de colunas (pre-requisito do `data-label` da T25).
  - Arquivos: `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`
  - Criterios: 29, 30, 35, 38, 40, 45

- [x] **T16** — Acrescentar a `AuthResourceTest` o metodo `shouldListEveryScreenInEffectivePermissions` (a classe nao tem `@TestSecurity` de classe — anotar no metodo, usuario dev): `GET /auth/me` -> `permissions.size() == 6`, contendo `DOCUMENTATION`. Os testes existentes nao sao tocados.
  - Arquivos: `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java`
  - Criterios: 1

- [x] **T17** — Acrescentar a `ProfileResourceTest`, reaproveitando o `cleanup()` por `name like 'Teste Perfil%'`: `shouldForceDocumentationPermissionToViewOnlyOnCreate` (`POST /profiles` com os quatro flags `true` em `DOCUMENTATION` -> 201 com `canView = true` e os outros tres `false`), `shouldForceDocumentationPermissionToViewOnlyOnUpdate` (mesmo corpo no `PUT` -> 200 com o mesmo resultado) e `shouldKeepWriteFlagsForOtherScreens` (mesma chamada com `TRANSACTIONS` -> os quatro flags gravados como enviados). Nenhum teste deve assertar `canCreate = false` de `DOCUMENTATION` para o **super_admin**: `PermissionEntry.allowAll(...)` continua devolvendo os quatro `true` para ele, que ignora perfis por construcao.
  - Arquivos: `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java`
  - Criterios: 14, 48, 50

- [x] **T18** — Rodar `./mvnw test` no `backend/` e conferir no diff que as suites de `dashboard`, `transactions`, `categories` e `users` continuam verdes **sem uma linha alterada**, e que `git status --porcelain backend/src/main/java/br/com/financeos/{dashboard,transactions,categories,users}` sai vazio.
  - Arquivos: — (execucao e conferencia de diff)
  - Criterios: 48, 50

## Frontend — tela de Perfis

- [x] **T19** — Em `profiles.ts`, acrescentar `{ code: 'DOCUMENTATION', label: 'Documentação', viewOnly: true }` como **sexto** item da constante `SCREENS` (o tipo passa a `{ code: Screen; label: string; viewOnly?: boolean }`) e expor `isViewOnly(screen: Screen): boolean` lendo esse metadado. `blankPermissions()`, `edit()`, o snapshot de copia profunda e o payload continuam sem mais nenhuma mudanca.
  - Arquivos: `frontend/src/app/features/profiles/profiles.ts`
  - Criterios: 10

- [x] **T20** — Em `profiles.html`, renderizar na linha da matriz **apenas a celula "Ver"** quando `isViewOnly(permission.screen)`, com as tres celulas de escrita substituidas por `<td class="checkbox-cell">` vazios — mantendo **5 `<td>` em toda linha** para o alinhamento das colunas Ver/Incluir/Alterar/Excluir no desktop. As celulas vazias saem **sem `data-label`** de proposito: no modo cartao de 680px o `td::before { content: attr(data-label) }` global geraria os rotulos "Incluir/Alterar/Excluir" sem nenhum controle embaixo. A celula "Ver" segue o padrao das demais (`<input type="checkbox" [(ngModel)]>` dentro de `<label class="perm-switch">`, com rotulo acessivel).
  - Arquivos: `frontend/src/app/features/profiles/profiles.html`
  - Criterios: 10

- [x] **T21** — Atualizar `profiles.spec.ts` **sem afrouxar nenhuma assercao existente**: `SCREEN_ROWS` passa a `['Resumo', 'Lançamentos', 'Categorias', 'Usuários', 'Perfis', 'Documentação']` e a contagem total de checkboxes de `20` para **21** (assercoes continuam exatas). Testes novos: a linha Documentação tem exatamente **1** checkbox, as outras cinco continuam com **4** e toda linha tem **5 `<td>`**; alternar **so** o switch de Documentação em edicao conta como alteracao pendente, o 1o "Cancelar" restaura o estado salvo mantendo a edicao com `httpMock.expectNone(() => true)` e o 2o sai da edicao; salvar com o switch marcado envia `{"screen":"DOCUMENTATION","canView":true,...}` no `PUT`. O helper `checkbox('<Tela>.<acao>')` indexa por posicao — para a linha Documentação so `'.view'` e valido.
  - Arquivos: `frontend/src/app/features/profiles/profiles.spec.ts`
  - Criterios: 10, 11, 13, 48

## Frontend — menu e Central

- [x] **T22** — Em `core/models.ts`, levar `type Screen` a **6** valores (espelho exato do enum da T1) e declarar as interfaces do contrato: `DocumentationContent`, `DocumentationArea`, `DocumentationSection`, `DocumentationBlock` (`kind: 'PARAGRAPH' | 'LIST' | 'TABLE' | 'HIGHLIGHT'`) e `DocumentationTable`. Nenhum tipo existente muda.
  - Arquivos: `frontend/src/app/core/models.ts`
  - Criterios: 1

- [x] **T23** — Criar `DocumentationService` no padrao dos demais services (`inject(HttpClient)` + `firstValueFrom`): `readonly content = signal<DocumentationContent | null>(null)` e `async load(): Promise<void>` chamando `GET ${API_BASE}/documentation`. Criar junto o spec minimo conferindo a URL e o preenchimento do signal.
  - Arquivos: `frontend/src/app/core/services/documentation.service.ts`, `frontend/src/app/core/services/documentation.service.spec.ts`
  - Criterios: 23

- [x] **T24** — Criar o componente standalone da Central: `ngOnInit` dispara **uma** `load()` por vida do componente; signals `loading`, `search` e `selectedAreaId`; `computed` `visibleAreas()` filtrando por titulo de area, titulo de secao e texto dos blocos (comparacao em minusculas, **sem HTTP**) e `activeArea()` resolvendo a area selecionada ou a primeira com correspondencia; erro da API tratado com `toast.fromHttpError(err, 'Não foi possível carregar a documentação.')`, sem classificacao propria por status. A navegacao entre areas e **troca de estado**, nunca geometria: `scrollIntoView`, `matchMedia` e `ResizeObserver` nao existem/nao funcionam em jsdom e derrubariam a suite inteira do componente; se um `scrollIntoView` entrar como refinamento, so com optional chaining e sem que o comportamento dependa dele. O componente **nao pode** ter nenhum `if` por nome/id de area (criterio 47).
  - Arquivos: `frontend/src/app/features/documentation/documentation.ts`
  - Criterios: 23, 41, 42, 43, 47

- [x] **T25** — Criar o template: `<h2 class="page-title">Documentação</h2>`, campo de busca unico com `<label>` e placeholder em portugues, e um `.content-grid` global com o indice das areas numa coluna (`.panel`, botoes) e o conteudo na outra. Cada area renderiza `<h3>` e, por secao, `<h4>` + os blocos por `*ngSwitch` em `block.kind` (`<p>`, `<ul>`, `<table>` com **`data-label` em cada `<td>` vindo de `columns`**, bloco de destaque). `.loading-state` global + `[attr.aria-busy]` no container enquanto carrega, `.empty-state` so **depois** da resposta (inclusive o de busca sem correspondencia, com texto em portugues). **Sem `[innerHTML]`**.
  - Arquivos: `frontend/src/app/features/documentation/documentation.html`
  - Criterios: 39, 41, 42, 43, 44, 45

- [x] **T26** — Criar o `.scss` da tela **so** com hierarquia e espacamento: degraus de `font-size` por token de modo que titulo de area > titulo de secao >= texto corrido, cor de texto por token e `overflow-wrap: anywhere`. Sem cor literal, sem `!important`, sem media query propria (o `.content-grid` global ja colapsa em 1080px e a tabela ja vira cartao em 680px). Se faltar um degrau tipografico, ele nasce como **token novo** em `frontend/src/styles.scss` (ex.: `--fs-doc-area-title`), nunca como valor de cor. Manter o arquivo enxuto por causa do budget de 8 kB por `.scss` de componente.
  - Arquivos: `frontend/src/app/features/documentation/documentation.scss`, `frontend/src/styles.scss` (so se faltar degrau tipografico)
  - Criterios: 39, 44, 45

- [x] **T27** — Acrescentar em `app.routes.ts` a rota `{ path: 'documentation', canActivate: [permissionGuard('DOCUMENTATION','VIEW')], loadComponent: ... }` como **filha do shell**, no padrao exato das cinco rotas existentes. O `redirectTo: 'dashboard'` do path vazio e a rota coringa `**` **nao mudam**.
  - Arquivos: `frontend/src/app/app.routes.ts`
  - Criterios: 21

- [x] **T28** — Em `main-layout.ts`, estender `type NavGroup` para `'registers' | 'settings' | 'about'` (mesmo signal `openGroup`, mesmo `toggleGroup()`, **sem segundo mecanismo de estado**) e criar `canSeeAbout()` (`authService.can('DOCUMENTATION','VIEW')`) e `isAboutActive()` (`router.url.startsWith('/documentation')`), no molde exato dos dois pares existentes.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`
  - Criterios: 16, 17, 18, 19

- [x] **T29** — Em `main-layout.html`, acrescentar o terceiro `.nav-group` **depois** de "Configuracoes" e como ultimo do `<nav>`: pai "Sobre" com SVG inline de 20px (`viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.8"`, sem biblioteca de icones), `<span class="nav-label">Sobre</span>`, `[attr.title]`/`[attr.aria-label]` so no estado recolhido e `(click)="toggleGroup('about')"`; filho "Documentação" com `*ngIf="authService.can('DOCUMENTATION','VIEW')"`, `routerLink="/documentation"`, `routerLinkActive="active"` e **`(click)="onNavigate()"`** alem do `routerLink`. Nenhum item existente muda de posicao, nenhum `*ngIf` por largura e nenhum template alternativo para o mobile.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 15, 16, 18, 19, 20, 49

- [x] **T30** — Criar `documentation.spec.ts`: carrega o conteudo **uma unica vez** (`expectOne`; digitar na busca e trocar de area seguidos de `httpMock.expectNone(() => true)`); a busca filtra areas/secoes, sem correspondencia mostra `.empty-state` em portugues e limpar o campo restaura tudo; o indice navega entre areas sem HTTP e, com filtro ativo, lista so as areas com correspondencia; `.loading-state` presente e `.empty-state` ausente antes do flush; 500 -> um toast de Falha via `fromHttpError` e 403 -> Alerta; e o caso do criterio 22 — sem a permissao a tela nao e montada e **nenhuma** `GET /api/documentation` sai.
  - Arquivos: `frontend/src/app/features/documentation/documentation.spec.ts`
  - Criterios: 22, 23, 41, 42, 43

- [x] **T31** — Atualizar `main-layout.spec.ts` **sem afrouxar assercao**: `expect(navButtons(fixture)).toHaveLength(4)` do teste de superAdmin passa a **5** (continua exato). Testes novos: "Sobre" existe e e o **ultimo** botao de primeiro nivel do `nav`, com `<svg width="20">` e `.nav-label`; com `me()` sem `DOCUMENTATION/VIEW` o `textContent` do `nav` **nao contem** "Sobre" nem "Documentação"; abrir "Sobre" com "Configuracoes" aberto fecha o anterior (e vice-versa); clicar em "Documentação" recolhe o trilho, zera `openGroup` e move o foco para a `.workspace`, no molde do teste existente de recolhimento ao navegar.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 15, 16, 18, 19, 48, 49

## Frontend — porta de entrada (frente de maior risco de regressao)

- [x] **T32** — **Antes de tocar em `permission.guard.ts` e `login.ts`**, rodar `npm test` inteiro e registrar o estado verde. A frente 4 e atravessada por **todo** login e **toda** negativa de rota: sem esse ponto de referencia, uma quebra em `permission.guard.spec.ts`, `login.spec.ts`, `main-layout.spec.ts` ou `profiles.spec.ts` fica indistinguivel de regressao trazida pelas frentes 2 e 3.
  - Arquivos: — (execucao; nenhuma alteracao)
  - Criterios: 25, 48

- [x] **T33** — Criar `core/entry-route.ts`, **unico lugar do projeto que sabe a ordem do menu**: `const ENTRY_ROUTES: { screen: Screen; path: string }[]` na ordem `DASHBOARD -> /dashboard`, `TRANSACTIONS -> /transactions`, `CATEGORIES -> /categories`, `USERS -> /users`, `PROFILES -> /profiles`, `DOCUMENTATION -> /documentation`; `export const NO_ACCESS_ROUTE = '/no-access'`; e `export function resolveEntryRoute(auth: Pick<AuthService, 'can'>): string` devolvendo o `path` da primeira entrada com `can(screen, 'VIEW')` ou `NO_ACCESS_ROUTE`. A funcao le **so** o signal de permissoes ja carregado e **nunca** chama `ensureProfileLoaded()`/`fetchMe()`: uma requisicao a mais aqui reprova o `httpMock.verify()` das suites inteiras de guard e de login, nao so os testes novos. Nenhum guard, interceptor ou servico de autorizacao novo e criado.
  - Arquivos: `frontend/src/app/core/entry-route.ts`
  - Criterios: 9, 24

- [x] **T34** — Criar `entry-route.spec.ts` com, no minimo: todas as permissoes -> `/dashboard`; so `TRANSACTIONS/VIEW` -> `/transactions`; so `DOCUMENTATION/VIEW` -> `/documentation`; nenhuma -> `/no-access`; `superAdmin` -> `/dashboard`.
  - Arquivos: `frontend/src/app/core/entry-route.spec.ts`
  - Criterios: 24

- [x] **T35** — No `permission.guard.ts`, trocar **apenas** o `router.navigate(['/dashboard'])` da negativa por `router.navigate([resolveEntryRoute(authService)])`. O toast de Alerta "Você não tem permissão para acessar esta tela.", a ordem das checagens, o `ensureProfileLoaded()` e o retorno `false` ficam identicos — nenhuma copia da ordem das rotas entra aqui.
  - Arquivos: `frontend/src/app/core/guards/permission.guard.ts`
  - Criterios: 9, 22, 25, 26, 27, 28

- [x] **T36** — No `login.ts`, trocar **apenas** o `await this.router.navigate(['/dashboard'])` por `await this.router.navigate([resolveEntryRoute(this.authService)])`, depois do `login()` (que ja resolveu `/auth/me`) — sem requisicao nova e sem repetir a ordem das rotas.
  - Arquivos: `frontend/src/app/features/auth/login/login.ts`
  - Criterios: 9, 25, 26, 27, 28

- [x] **T37** — Criar o componente `no-access` (standalone, **sem `.scss` proprio** — consome `.page-title` e `.empty-state` globais, como o `core/confirm-dialog`, e assim nao entra no budget de 8 kB), com titulo curto e a mensagem em portugues acentuado "Seu perfil não tem acesso a nenhuma tela. Fale com o administrador."; e registrar em `app.routes.ts` a rota `{ path: 'no-access', loadComponent: ... }` **filha do shell e sem `canActivate` proprio** — a protecao vem do `authGuard` do pai, e e justamente a ausencia do `permissionGuard` que impede qualquer laco. O componente nao faz nenhuma requisicao, e o botao "Sair" do shell continua acessivel.
  - Arquivos: `frontend/src/app/features/no-access/no-access.ts`, `frontend/src/app/features/no-access/no-access.html`, `frontend/src/app/app.routes.ts`
  - Criterios: 28, 46

- [x] **T38** — Criar `no-access.spec.ts`: renderiza o texto acentuado e prova `httpMock.expectNone(() => true)`.
  - Arquivos: `frontend/src/app/features/no-access/no-access.spec.ts`
  - Criterios: 28

- [x] **T39** — Acrescentar testes a `permission.guard.spec.ts` **mantendo os tres existentes intactos** (o caso `DASHBOARD_ONLY` continua exigindo `navigate(['/dashboard'])`): so `USERS/VIEW` -> `navigate(['/users'])` com **exatamente um** toast de Alerta e nenhum segundo redirect; so `DOCUMENTATION/VIEW` -> `navigate(['/documentation'])`; sem nenhuma permissao -> `navigate(['/no-access'])`.
  - Arquivos: `frontend/src/app/core/guards/permission.guard.spec.ts`
  - Criterios: 25, 26, 27, 28

- [x] **T40** — Acrescentar testes a `login.spec.ts` **sem tocar nos tres existentes** (`vi.spyOn(router, 'navigate').mockResolvedValue(true)`, flush de `POST /auth/login` e de `GET /auth/me` com a matriz do caso): com `DASHBOARD/VIEW` -> `['/dashboard']`; so `USERS/VIEW` -> `['/users']`; so `DOCUMENTATION/VIEW` -> `['/documentation']` **sem nenhum toast**; matriz sem nenhum `VIEW` -> `['/no-access']`.
  - Arquivos: `frontend/src/app/features/auth/login/login.spec.ts`
  - Criterios: 25, 26, 27, 28

## Verificacao por comando e evidencia

- [x] **T41** — Rodar as varreduras e conferencias de diff que sao criterio de aceite, ajustando o codigo (nao a varredura) quando acusarem:
  `rg -n "@POST|@PUT|@DELETE|@PATCH" backend/src/main/java/br/com/financeos/documentation` sem saida; `git status --porcelain backend/src/main/resources/db/migration/` listando **so** a `V13`;
  `rg -n "ABOUT|'SOBRE'" frontend/src backend/src/main/java` sem saida e `Screen.java` com exatamente um valor a mais no diff;
  `rg -n "'/dashboard'|'/transactions'|'/categories'|'/users'|'/profiles'|'/documentation'" frontend/src/app/core frontend/src/app/features/auth` mostrando a ordem declarada **so** em `core/entry-route.ts`, e `git diff frontend/src/app/core/guards/permission.guard.ts frontend/src/app/features/auth/login/login.ts` contendo **apenas** a troca do destino do `navigate`;
  `rg -n "INCOME|EXPENSE|PENDING|PAID|CANCELED|Screen\.|Action\.|accessControl|@NotNull|@NotBlank|Panache|Flyway|ProfilePermission|localStorage|JWT" backend/src/main/java/br/com/financeos/documentation/content` sem saida;
  `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app/features/documentation --glob "*.scss"` e `rg -n "!important|innerHTML" frontend/src/app/features/documentation` sem saida; `git diff frontend/package.json backend/pom.xml` vazio; `npm run build` **sem warning novo** de `anyComponentStyle`;
  as duas varreduras de acentuacao do projeto (front e `backend/src/main/java`) **comparadas com o baseline atual** — hoje elas ja retornam 6 linhas de comentario em `ProductionBootstrap`/`DashboardResource` e 2 em `styles.scss`; o exigido e **nenhuma ocorrencia nova**, e ver a Lacuna 2 sobre os slugs de `DocumentationArea`;
  `git status --porcelain knowledge/` vazio e `git status --porcelain backend/src/main/java/br/com/financeos/{dashboard,transactions,categories,users}` vazio.
  - Arquivos: — (varreduras; so altera arquivo se alguma acusar)
  - Criterios: 8, 9, 17, 24, 35, 37, 38, 44, 46, 50

- [x] **T42** — Rodar `./mvnw test` e `npm test` completos e conferir no diff dos specs que nenhuma assercao foi removida ou enfraquecida — as unicas mudancas admitidas em teste existente sao `20 -> 21` e a sexta linha de `SCREEN_ROWS` em `profiles.spec.ts` e `4 -> 5` em `main-layout.spec.ts`.
  - Arquivos: — (execucao e conferencia de diff)
  - Criterios: 48

- [x] **T43** — Depois de `docker compose up -d --build`, conferir no banco: `docker compose logs backend | rg -i flyway` sem erro; `select p.id, pp.can_view, pp.can_create, pp.can_edit, pp.can_delete from profiles p left join profile_permissions pp on pp.profile_id = p.id and pp.screen = 'DOCUMENTATION';` -> **uma linha por perfil**, `can_view = true`, os outros tres `false`, nenhum `pp` nulo; `insert ... 'DOCUMENTATION'` aceito e o mesmo com `'FOO'` recusado pelo check; reexecutar o `insert` do seed nao duplica linha; e `select screen, can_view, count(*) from profile_permissions group by 1, 2 order by 1, 2;` **identico ao de antes da subida** para as cinco telas antigas (capturar a contagem antes de subir).
  - Arquivos: — (conferencia na stack local)
  - Criterios: 2, 3, 48

- [x] **T44** — Escrever `implementation-notes.md` com as quatro evidencias que sao criterio de aceite: (a) a saida crua de `select conname from pg_constraint ...` da T2, com o nome real do check usado na `V13`; (b) a **tabela de rastreamento**, uma linha por afirmacao de regra publicada na Central, com a origem (`knowledge/<arquivo>.md` + secao, ou arquivo/linha do codigo) — **toda** linha com origem preenchida e **nenhuma** com "inferido"; (c) a secao de **inconsistencias e lacunas** (arquivo, trecho, divergencia) encontradas entre `knowledge/*.md` e o codigo, registradas e **nao** resolvidas, sem alterar nenhum `knowledge/*.md`; (d) a lista exata dos arquivos que mudariam para acrescentar uma sexta area (`content/<NovaArea>Content.java` novo + uma linha em `content/DocumentationContent.java`, e nada mais). Os itens (b) e (c) sao preenchidos **durante** T6 e T8 a T12, nao depois.
  - Arquivos: `specs/70-sobre-central-documentacao/implementation-notes.md`
  - Criterios: 2, 36, 37, 47

## Validacao manual (etapa 8)

Criterios que nao ficam verdes por `npm test`/`./mvnw test` — jsdom nao aplica CSS (toda medida vem `0`), nao tem `matchMedia`/`ResizeObserver`, e leitura de texto de manual e julgamento humano. A confirmacao e em `http://localhost` depois do `docker compose up -d --build`.

- **Criterio 3** (T43) — entrar com `dev@financeos.local` logo apos a subida e ver "Sobre -> Documentação" no menu **sem nenhum passo manual** de concessao.
- **Criterio 10** (T20) — em `/profiles`, conferir o rotulo "Documentação" acentuado, a linha com um unico switch na coluna "Ver" e as colunas Ver/Incluir/Alterar/Excluir ainda alinhadas; abaixo de 680px, o cartao da linha **nao** deve exibir "Incluir/Alterar/Excluir" sem controle.
- **Criterio 11** (T21) — marcar "Ver" da linha Documentação num perfil, salvar, ver o toast de Sucesso e recarregar a tela com o switch marcado.
- **Criterio 12** (T14, T21) — desmarcar o switch de um perfil de teste, entrar com um usuario desse perfil e confirmar que "Sobre" sumiu do menu e que `/documentation` na URL exibe o Alerta e redireciona.
- **Criterio 15** (T29) — trilho recolhido com tooltip "Sobre" no hover, trilho expandido sem `title`, grupo como ultimo item do menu.
- **Criterio 16** (T29) — com um perfil sem o privilegio, nem o grupo nem o subitem aparecem.
- **Criterio 18** (T29) — abrir "Cadastros", "Configuracoes" e "Sobre" em sequencia: no maximo um aberto por vez.
- **Criterio 19** (T29) — clicar em "Documentação": trilho volta a 76px, grupo fecha, foco no conteudo.
- **Criterio 20** (T29) — a 390x844: abrir a gaveta pelo botao "Menu", abrir "Sobre", acionar "Documentação" (fecha e navega), reabrir e fechar com `Esc`. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- **Criterio 22** (T30) — digitar `http://localhost/documentation` sem o privilegio: toast de Alerta, redirect e aba Network **sem** `GET /api/documentation`.
- **Criterio 23** (T30) — Network com **uma** `GET /api/documentation` no carregamento e nenhuma ao digitar na busca ou trocar de area.
- **Criterios 26 e 27** (T39, T40) — perfil so de Usuarios entrando direto em `/users`; perfil so com "Ver" em Documentação entrando direto na Central, sem toast pelo caminho, e `/dashboard` na URL devolvendo o Alerta e trazendo de volta — sem segundo redirect e sem segundo toast.
- **Criterio 28** (T37, T38) — perfil sem nenhum "Ver": login terminando em `/no-access` apos **uma unica** navegacao, F5 na rota sem novo toast, botao "Sair" acessivel, e uma URL inexistente resolvendo com **no maximo um** redirect adicional (o `''` e o `**` continuam apontando para `/dashboard` de proposito).
- **Criterios 29 a 35** (T6, T8 a T12) — percorrer a Central lendo: indice com a introducao + exatamente 5 areas e nenhuma outra; nenhuma secao com titulo e sem conteudo; as quatro afirmacoes obrigatorias de cada area presentes e corretas; nenhuma mencao a Contas, Cartoes, Relatorios, importacao de Excel, recorrencia ou subcategoria como recurso disponivel; nenhum identificador tecnico na tela.
- **Criterio 39** (T25, T26) — a 1440x900, DevTools > Computed: `.page-title` no titulo da tela, `font-size` do titulo de area > titulo de secao >= texto corrido, e `color` do texto resolvendo a partir de token (formato `oklch(...)`).
- **Criterio 42** (T30) — acionar uma area do indice sem recarregar a pagina e sem nova requisicao; com busca ativa, o indice lista so as areas com correspondencia.
- **Criterio 43** (T30) — com throttling no DevTools, ver o `.loading-state` sem `.empty-state` antes da resposta; derrubar o backend e ver o toast de Falha.
- **Criterio 45** (T25, T26) — em 1440x900, 1024x768, 768x1024, 390x844 e 320px: `document.documentElement.scrollWidth <= window.innerWidth` no console, nenhum texto cortado, tabelas em modo cartao abaixo de 680px com os rotulos certos, e no campo de busca `font-size >= 16px` e alvo `>= 44px` ate 480px. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- **Criterio 49** (T29, T31) — ordem Resumo, Lancamentos, Cadastros, Configuracoes, Sobre; expansao do trilho, acordeao e gaveta inalterados.

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | `Screen` com `DOCUMENTATION` e espelho no front; `/auth/me` com 6 entradas | T1, T16, T22 |
| 2 | Migration `V13` (check + seed), nome da constraint confirmado | T2, T3, T43, T44 |
| 3 | Uma linha `DOCUMENTATION` por perfil apos a subida | T3, T43 |
| 4 | `GET /api/documentation` com `require` na primeira linha -> 200 | T7, T13 |
| 5 | 403 com a mensagem generica sem o privilegio | T14 |
| 6 | 401 sem `Authorization` | T14 |
| 7 | `super_admin` oculto recebe 200 | T7, T14 |
| 8 | Privilegio so de leitura, imposto no back-end | T4, T7, T41 |
| 9 | Mecanismo de autorizacao ajustado, nunca duplicado | T33, T35, T36, T41 |
| 10 | Matriz de Perfis com 6 linhas e Documentação so com "Ver" | T19, T20, T21 |
| 11 | Conceder o privilegio funciona (`PUT` + persistencia) | T21 |
| 12 | Remover o privilegio funciona (menu, rota e API) | T14, T21 |
| 13 | "Cancelar" de dois estagios vale para a linha nova | T21 |
| 14 | Back-end zera as tres acoes de escrita de `DOCUMENTATION` | T4, T17 |
| 15 | Grupo "Sobre" no padrao dos demais, ultimo do menu | T29, T31 |
| 16 | Sem a permissao, grupo e subitem somem do DOM | T28, T29, T31 |
| 17 | Agrupador sem `Screen` propria; um unico valor novo no enum | T1, T28, T41 |
| 18 | Acordeao com no maximo um grupo aberto, agora com tres | T28, T29, T31 |
| 19 | "Documentação" navega e chama `onNavigate()` | T28, T29, T31 |
| 20 | Item novo na gaveta abaixo de 680px, sem template alternativo | T29 |
| 21 | Rota filha do shell com `permissionGuard` e `loadComponent` | T27 |
| 22 | URL direta sem privilegio: Alerta, redirect e nenhuma `GET` | T30, T35 |
| 23 | Com privilegio: exatamente uma `GET /api/documentation` | T23, T24, T30 |
| 24 | `resolveEntryRoute` unica, ordem declarada num lugar so | T33, T34, T41 |
| 25 | Nao regressao do caso comum (`/dashboard`) | T32, T35, T36, T39, T40 |
| 26 | Sem `DASHBOARD/VIEW`, vai para a primeira tela permitida | T33, T35, T36, T39, T40 |
| 27 | Perfil so de Documentação entra na Central e volta para ela | T35, T36, T39, T40 |
| 28 | `/no-access` sem `permissionGuard`, sem loop | T35, T36, T37, T38, T39, T40 |
| 29 | Introducao + exatamente 5 areas | T12, T13, T15 |
| 30 | Secoes minimas por area, nenhuma vazia | T8, T9, T10, T11, T12, T15 |
| 31 | Conteudo obrigatorio da area Resumo | T8 |
| 32 | Conteudo obrigatorio da area Lancamentos | T9 |
| 33 | Conteudo obrigatorio da area Categorias | T10 |
| 34 | Conteudo obrigatorio das areas Usuarios e Perfis | T11, T12 |
| 35 | Nada de funcionalidade inexistente ou removida | T8, T9, T10, T11, T12, T15, T41 |
| 36 | Tabela de rastreamento com origem de cada regra | T6, T8, T9, T10, T11, T12, T44 |
| 37 | Inconsistencias registradas, nao resolvidas | T6, T8, T9, T10, T11, T12, T41, T44 |
| 38 | Linguagem de usuario, sem identificador tecnico | T5, T8, T9, T10, T11, T12, T15, T41 |
| 39 | Hierarquia visual medivel | T25, T26 |
| 40 | Blocos estruturados, paragrafo <= 600 caracteres | T6, T8, T9, T10, T11, T12, T15 |
| 41 | Busca filtrando sem HTTP, com `.empty-state` proprio | T24, T25, T30 |
| 42 | Indice navegando entre areas, sem requisicao | T24, T25, T30 |
| 43 | `.loading-state`/`aria-busy` e erro por `fromHttpError` | T24, T25, T30 |
| 44 | Design system: sem cor literal, sem dependencia, sem budget novo | T25, T26, T41 |
| 45 | Responsividade e `data-label` nas tabelas do conteudo | T15, T25, T26 |
| 46 | Portugues acentuado, varreduras sem ocorrencia nova | T37, T41 |
| 47 | Area nova = um arquivo em `content/` + uma linha no indice | T6, T24, T44 |
| 48 | Nao regressao de permissoes; suites verdes sem afrouxar | T3, T17, T21, T31, T32, T42, T43 |
| 49 | Nao regressao de navegacao | T29, T31 |
| 50 | Nenhuma regra existente muda, fora as duas decididas | T4, T17, T18, T41 |

## Lacunas

> **Resolvidas em 2026-09-21 (decisao do usuario).** As Lacunas 1 e 2 abaixo ficam registradas como levantadas, mas **ja foram tratadas na spec** e nao bloqueiam a implementacao:
> - **Lacuna 1** — o criterio 31 da spec foi **reescrito**: agora exige que a area Resumo documente a selecao de Ano/Mes **com as tres excecoes reais** (ano corrente sempre presente, mes corrente sempre na lista do ano corrente, cancelado conta como periodo). A T8 continua valida como esta; o criterio e o texto agora batem.
> - **Lacuna 2** — o criterio 46 da spec virou **criterio de baseline**: nao exige mais varredura vazia, e sim nenhuma ocorrencia **nova** alem das 8 pre-existentes (6 no backend, 2 no frontend, todas comentario), que estao listadas no proprio criterio. Os comentarios **nao** devem ser acentuados por esta feature. Alem disso, a segunda parte do alerta **nao procede**: o regex e sensivel a maiusculas (`Lancamento`), entao o slug `"lancamentos"` em minuscula **nao casa** a varredura — verificado. O slug previsto no plano pode ser mantido.

- **Nenhum criterio de aceite ficou sem tarefa** — os 50 estao cobertos por ao menos uma, e a unica tarefa sem criterio proprio e a **T5** (records do contrato), infraestrutura declarada: ela nao publica regra nem texto, mas e o que torna verificaveis os criterios 29, 38, 40, 44 e 45.

- **Lacuna 1 — o criterio 31, escrito ao pe da letra, publica uma regra que o codigo nao aplica.** O criterio manda a area Resumo documentar que "a selecao de Ano/Mes oferece apenas periodos com lancamentos do proprio usuario". `knowledge/dashboard.md` (regras da issue #69) diz outra coisa em tres pontos: o **ano corrente sempre aparece**, mesmo sem nenhum lancamento (`months: []`); no ano corrente a lista de meses inclui **sempre o mes corrente**, tenha ele dados ou nao; e **lancamento cancelado conta** como periodo disponivel (a consulta nao filtra `status`). Publicar a frase do criterio sem essas excecoes seria exatamente o que o criterio 36 proibe — regra na Central sem origem que a sustente — e o que o criterio 37 manda registrar. A T8 ja instrui a redigir com as excecoes e a anotar a origem; **fica para decisao de quem chamou** se a redacao do criterio 31 na spec tambem deve ser ajustada (preferivel) ou se basta o texto da Central cobrir as excecoes com a divergencia registrada em `implementation-notes.md`.

- **Lacuna 2 — o criterio 46 exige varreduras "vazias", e elas nao estao vazias hoje; alem disso o slug de area previsto no plano acrescentaria uma ocorrencia nova.** Medido agora na `main`: a varredura de acentuacao do backend retorna **6 linhas** (comentarios de `ProductionBootstrap.java` e `DashboardResource.java`) e a do front retorna **2** (comentarios de `styles.scss`) — todas comentario de codigo, nenhuma texto exibido. O criterio, lido literalmente, ja e falso antes desta feature; a T41 por isso compara com esse baseline e cobra **nenhuma ocorrencia nova**. O ponto concreto que a feature acrescenta: o plano fixa os `id` de `DocumentationArea` como slugs em minusculas (`"resumo"`, `"lancamentos"`, ...), e `"lancamentos"` **casa** o regex da varredura do backend (`lancamento`). Ele e identificador, nunca exibido — mas para o criterio 46 continuar verificavel por comando, ou o slug nasce fora do regex (ex.: `"transactions"`, alinhado a rota, ja que ele so serve de chave de indice e `trackBy`) ou a excecao precisa ser decidida e registrada. **Nao inventei tarefa para isso**: e escolha de contrato, e a T41 vai acusar.

- **Regra de negocio no back-end (conferido, nao e lacuna).** As tres regras que a feature cria vivem no servidor e tem teste de backend: a autorizacao da Central (`accessControl.require` no `DocumentationResource`, T7/T13/T14), o privilegio ser so de leitura (`ProfileResource`, T4/T17) e o conteudo publicado (dado de producao em `content/`, servido pela API, T6 a T12/T15). O que fica so no Angular — visibilidade do grupo "Sobre", celulas ausentes na matriz de Perfis, filtro da busca e **destino do redirect** (criterios 24 a 28) — e espelho de UX e navegacao, nao autorizacao: sem o privilegio a API responde 403 mesmo que o front seja contornado, e o `permissionGuard` continua sendo gate de rota, nao de dado.

- **Aviso, nao lacuna (criterios 39, 45 e 20).** Nao ha como ter tarefa de teste automatizado: jsdom nao aplica CSS (toda medida computada vem `0`), nao tem `matchMedia`, `ResizeObserver` nem `scrollIntoView`, e teste de visibilidade ali **aprova falsamente**. Os tres tem tarefa de implementacao (T25, T26, T29) e estao antecipados na secao "Validacao manual (etapa 8)"; os criterios 20 e 45 ja trazem da spec a ressalva de que nao reprovam a feature quando so forem verificaveis por emulacao.

- **Aviso sobre o criterio 47 (exercicio da sexta area).** Ele exige que acrescentar uma area mude **apenas a fonte de conteudo**. O desenho escolhido — indice `content/DocumentationContent.java` + um arquivo por area no mesmo pacote `content/` — cumpre isso porque **os dois arquivos sao fonte de conteudo**, mas so continua verdadeiro se o componente da Central nao tiver nenhum `if` por nome/id de area (escrito na T24) e se o `.scss` estilizar por **tipo de bloco**, nunca por area (T26). Se durante a implementacao aparecer um estilo especifico de uma area, o criterio 47 cai — e isso volta como decisao, nao como ajuste silencioso.

- **Aviso sobre o volume da frente 3 e o budget de 8 kB.** A Central e a maior tela nova do projeto (indice, busca, tabelas e quatro tipos de bloco) e o `.scss` de componente tem warning de budget em 8 kB. A T26 manda privilegiar os utilitarios globais e, se o `npm run build` acusar (T41), a saida e enxugar ou promover regra estrutural para `styles.scss` — **nunca** aumentar o budget no `angular.json`.
