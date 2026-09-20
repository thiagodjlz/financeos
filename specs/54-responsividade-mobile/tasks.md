# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Feature 100% de frontend: **nenhuma tarefa de backend e nenhuma migration** (criterio 47 exige `git status --porcelain` sem nada sob `backend/`, e o criterio 48 proibe dependencia npm nova). As secoes seguem as fases do `plan.md` — a numeracao `T1..T45` e continua (T42-T45 nasceram na rodada de correcao dos defeitos da etapa 8) e independe do agrupamento.

Dois pre-requisitos tecnicos valem para a feature inteira e estao repetidos nas tarefas onde podem ser esquecidos:

- **A suite roda em jsdom** (sem `matchMedia`, sem `ResizeObserver`, toda medida `0`). Quem decide o modo mobile e o **CSS**; o TS so guarda um signal booleano. Nenhuma tarefa pode introduzir `window.matchMedia` nem medicao de DOM sem guarda — isso derrubaria os 16 testes de `main-layout.spec.ts` de uma vez (decisao tecnica 3 do plano).
- **`@media (max-width: var(--token))` nao funciona em CSS.** Os tokens `--bp-desktop`/`--bp-mobile`/`--bp-compact` sao **documentacao e inspecao** (criterio 49); toda `@media` escreve o literal `1080px`/`680px`/`480px` (criterio 4). Errar isso compila sem erro e produz media query que nunca casa.

E uma restricao que vale para todas as tarefas: **nenhuma delas pode esconder campo, botao ou opcao "porque nao cabe" no mobile.** Isso seria mudanca funcional (fora de escopo) e, se algum dia for necessario, teria de ser imposto no backend (`accessControl.require` + Bean Validation) — nunca so no front. Se a implementacao chegar nesse ponto, volta como pergunta, nao vira `*ngIf`.

## F0 — Fundacao invisivel (nada muda acima de 680px)

- [x] **T1** — Trocar a meta viewport para `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, sem introduzir `user-scalable` nem `maximum-scale` (o zoom manual continua permitido).
  - Arquivos: `frontend/src/index.html`
  - Criterios: 1
- [x] **T2** — Declarar em `styles.scss` o bloco de comentario com o **conjunto unico de breakpoints** (1080px desktop, 680px modo mobile, 480px toque/tipografia, mais a nota de que `@media (hover: hover)` nao tem largura e nao viola o conjunto) e os tokens novos em `:root`: `--bp-desktop`/`--bp-mobile`/`--bp-compact` (documentacao, **nunca usados dentro de `@media`**), `--touch-target: 44px`, `--fs-input-mobile: 16px`, `--lh-body`/`--lh-title`, `--col-actions: 200px`, `--mobile-topbar-h`, `--drawer-width`, `--scrim` e `--scroll-shadow-*`. Nenhuma cor literal fora deste arquivo e nenhum `!important`.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 4, 30, 37, 49
- [x] **T3** — Corrigir os 4 pontos de altura de tela para `100vh` **imediatamente seguido** da mesma propriedade em `100dvh` no mesmo bloco: `app.scss:3` (`min-height`), `login.scss:7` (`min-height`), `main-layout.scss:3` (`.app-shell`) e `main-layout.scss:14` (`.sidebar`, `height`).
  - Arquivos: `frontend/src/app/app.scss`, `frontend/src/app/features/auth/login/login.scss`, `frontend/src/app/layout/main-layout/main-layout.scss`
  - Criterios: 2, 3, 18

## F1 — Shell mobile: cabecalho, gaveta e scrim

- [x] **T4** — Acrescentar em `main-layout.ts` o signal `drawerOpen`, `toggleDrawer()` e `closeDrawer(returnFocus: boolean)`, `@HostListener('document:keydown.escape')`, foco no primeiro item ao abrir, devolucao do foco ao botao "Menu" ao fechar por scrim/`Esc`/botao, retencao de `Tab`/`Shift+Tab` dentro do `<aside>` enquanto aberta e trava de rolagem do `<body>` por classe — **com limpeza em `closeDrawer()`, em `onNavigate()` e em `ngOnDestroy()`** (vazar a trava deixa o app inteiro sem rolagem). `expand()`, `collapse()`, `toggleGroup()`, `onNavigate()` (que segue recolhendo e movendo o foco para `.workspace`) e os helpers de permissao **nao mudam de assinatura nem de efeito**. Sem `matchMedia` e sem medicao de DOM.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`
  - Criterios: 11, 12, 13, 14, 43
- [x] **T5** — Acrescentar em `main-layout.html` o `<header class="mobile-topbar">` com a marca reduzida e o `<button class="menu-button" type="button" aria-label="Abrir menu" [attr.aria-expanded]="drawerOpen()" aria-controls="app-drawer">`, o `<div class="drawer-scrim">` condicionado a `drawerOpen()` e o `id="app-drawer"` + `[class.open]="drawerOpen()"` no `<aside>`. O botao "Menu" fica **fora** de `.nav-list` (os specs contam `.nav-list button`); nenhum item, rotulo ou `*ngIf` de permissao da navegacao atual muda.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 11, 12, 16, 50
- [x] **T6** — Reescrever o layout do shell em `main-layout.scss`: `.sidebar` com `overflow-y: auto` e `.nav-list` rolavel nos dois modos (corrige C2 — em 844x390 os ultimos itens, incluindo "Sair", ficam cortados hoje); bloco `@media (max-width: 680px)` com `.mobile-topbar` fixa somando `env(safe-area-inset-top)`, `.sidebar` como gaveta (`transform: translateX(-100%)` -> `0` com `.open`, rotulos sempre visiveis independentemente de `.expanded`, safe area lateral/inferior, `z-index` acima do scrim), `.drawer-scrim` com `--scrim`, e `.workspace` **sem `margin-left`** e com `padding-top` do cabecalho; hovers de item dentro de `@media (hover: hover)`. Fixar o token da gaveta em **`--drawer-width: min(280px, calc(100vw - 48px))`** — limitado pela viewport, para a gaveta nunca sangrar a 320px e sempre sobrar faixa de scrim tocavel para fechar (a 320px resolve para 272px; a 390px, para 280px). Acrescentar em `styles.scss` a regra `body.drawer-open { overflow: hidden }`. **Nao reintroduzir `.sidebar:hover` nem `.sidebar:focus-within`** (o criterio 43 varre este arquivo).
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.scss`, `frontend/src/styles.scss`
  - Criterios: 6, 7, 9, 10, 12, 13, 15, 28, 30, 43
- [x] **T7** — Acrescentar em `main-layout.spec.ts` os testes da gaveta: abrir pelo botao "Menu" refletindo `aria-expanded`/`aria-controls` e renderizando o scrim; fechar por scrim, por `Esc` e por item de navegacao; foco no primeiro item ao abrir e retorno ao botao "Menu" ao fechar; `Tab` nao alcancando o conteudo atras. Os testes existentes de permissao, acordeao, `onNavigate` e ausencia de `.collapse-toggle` ficam **inalterados** — nenhuma assercao afrouxada.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 11, 12, 14, 16, 43, 51

## F2 — Padroes globais de mobile (cards, texto, toque, tipografia, toasts, contraste)

- [x] **T8** — Escrever em `styles.scss` o bloco `@media (max-width: 680px)` do **modo card**: `table { min-width: 0 }`, `.table-wrap { overflow-x: visible }`, `thead` oculto, `tbody`/`tr`/`td` em `display: block`, `td::before { content: attr(data-label) }` como rotulo do campo, `tr` como cartao (borda, raio, espacamento, quebra de texto preservada por `overflow-wrap: anywhere`), `.row-actions` agrupada no fim do cartao, e colapso de `.content-grid` e `.two-cols` para coluna unica.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 7, 8, 9, 18, 19, 21, 23
- [x] **T9** — Resolver **na origem** o corte/sobreposicao de texto **fora das tabelas** (hoje `overflow-wrap: anywhere` so existe dentro de `table.fixed-layout`, e nenhum container flex/grid solta o `min-width: auto` padrao, que e o que de fato impede o texto de quebrar). Em `styles.scss`: `min-width: 0` nos filhos de flex/grid que hoje travam a quebra (`.page-header`/`.page-title`, `.panel-heading` e seu `h3`, `.form-panel label`, `.metric-card` e seus rotulo/valor, `.compact-list` e `.empty-state`); `overflow-wrap: anywhere` como regra de texto do `body` (nao so da tabela); `select { max-width: 100% }` com `text-overflow: ellipsis` — o truncamento util vem do `select`, nao da `<option>`, que o iOS nao estiliza; e `.status-pill`/badges mantendo `white-space: nowrap` mas com o container ao redor livre para quebrar. Em `main-layout.scss`: nome e e-mail do usuario no rodape da sidebar truncando em uma linha com reticencias e `[attr.title]` com o texto completo (dado do usuario, nao rotulo novo — o criterio 50 continua valendo). **Nenhum texto pode ser removido para caber**; a saida e quebrar ou truncar com reticencias dentro do container.
  - Arquivos: `frontend/src/styles.scss`, `frontend/src/app/layout/main-layout/main-layout.scss`
  - Criterios: 8
- [x] **T10** — Escrever em `styles.scss` o bloco `@media (max-width: 480px)`: `input, select, textarea { font-size: var(--fs-input-mobile) }` **incluindo o override de `table.fixed-layout td input, td select`, que hoje forca `--fs-table` (13,5px) em `styles.scss:412-416`** — sem isso todo campo da edicao inline continua disparando o zoom do Safari; `min-height: var(--touch-target)` nos botoes de `.row-actions`, `.modal-actions` e `.form-actions` e nos campos de formulario, com `gap` >= 8px entre alvos adjacentes. Nada disso vale acima de 480px (o desktop mantem a densidade atual — criterios 42 e 44).
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 9, 17, 19, 28, 29
- [x] **T11** — Envolver em `@media (hover: hover)` as regras globais de `:hover` de `styles.scss` (botoes primario/ghost/danger e botoes de `.row-actions`), causa-raiz de C10 (hover preso apos o toque no iOS). A media query nao tem largura e por isso nao entra em conflito com o conjunto de breakpoints do criterio 4.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 15
- [x] **T12** — Ajustar `toast-host.scss` para o mobile: pilha ocupando a largura util com `top` somando `env(safe-area-inset-top)` **mais** `--mobile-topbar-h` (sem isso o toast cobre o botao "Menu"), offset proprio em `/login`, que **nao tem cabecalho mobile** e onde o toast nao pode cobrir o botao "Entrar", e botao de fechar com area de toque de `var(--touch-target)` ate 480px. O `.html` nao muda.
  - Arquivos: `frontend/src/app/core/toast/toast-host.scss`
  - Criterios: 6, 20, 28, 30, 32
- [x] **T13** — Acrescentar `data-label` com o texto do `<th>` correspondente em cada `<td>` de `transactions.html` — **na linha de leitura e na linha de edicao** — e restringir `table { min-width: 1000px }` a acima de 680px em `transactions.scss`, com os ajustes de cartao (alinhamento do valor com sinal, `status-pill` visivel no cartao). A `status-pill` e o `signedMoney()` continuam sendo o rotulo textual do tipo/status, alem da cor.
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`, `frontend/src/app/features/transactions/transactions.scss`
  - Criterios: 7, 8, 21, 23, 31
- [x] **T14** — Mesmo tratamento em Categorias: `data-label` nos `<td>` de leitura e de edicao, `min-width` da tabela restrito a acima de 680px e o `input[type="color"]` da edicao inline subindo de 34px para `var(--touch-target)` ate 480px — **sem mexer nos 42px do campo de cor do formulario no desktop**. A bolinha de 10px e a pill de Situacao continuam no cartao.
  - Arquivos: `frontend/src/app/features/categories/categories.html`, `frontend/src/app/features/categories/categories.scss`
  - Criterios: 7, 8, 21, 23, 28, 31
- [x] **T15** — Mesmo tratamento em Usuarios: `data-label` nos `<td>` de leitura e de edicao (incluindo o campo compacto de Senha, que divide a celula do E-mail) e `table { min-width: 960px }` restrito a acima de 680px. A pill de Status continua com rotulo textual no cartao.
  - Arquivos: `frontend/src/app/features/users/users.html`, `frontend/src/app/features/users/users.scss`
  - Criterios: 7, 8, 21, 23, 31
- [x] **T16** — **Auditoria de contraste e de dependencia de cor, com evidencia registrada.** Medir (DevTools > Accessibility ou Lighthouse) e **listar numa tabela em `implementation-notes.md`** — par, contexto, razao medida, veredito — todos os pares texto/fundo do tema e os alterados por esta feature: texto de corpo e secundario sobre `--surface`/`--bg-app`; texto branco do `.primary-button`; itens da sidebar (normal, hover e ativo); as quatro `status-pill` (`pill-income`/`pill-pending`/`pill-expense`/`pill-neutral`); os tres estados de toast; `input.invalid` + legenda `.field-error`; **placeholder** de campo; **estado desabilitado** dos tres botoes; rotulo de cartao (`td::before`) no modo card; cabecalho mobile; texto sobre o `--scrim`; e as bordas de controle de formulario (minimo 3:1). Corrigir no **token** (`styles.scss`) todo par abaixo de 4.5:1 para texto normal, 3:1 para texto >= 18.66px/700 e 3:1 para elemento de interface — nunca com cor literal na tela. Onde a informacao hoje so exista por cor, acrescentar rotulo ou icone (conferir que tipo/status de lancamento e situacao de categoria/usuario continuam com o texto da pill, inclusive no cartao, e que a coluna Valor mantem o prefixo `+ `/`- ` de `signedMoney()`). Os pares que **so nascem na F4** — `.loading-state`, sombra de rolagem do `.table-wrap` e o novo par hover vs. ativo do menu — sao acrescentados a esta mesma tabela pelas tarefas T27, T31 e T32.
  - Arquivos: `frontend/src/styles.scss` (evidencia em `specs/54-responsividade-mobile/implementation-notes.md`)
  - Criterios: 30, 31

## F3 — Telas especificas (Resumo, Login, Perfis, teclado virtual)

- [x] **T17** — Acrescentar em `dashboard.ts` uma funcao **pura e exportada** de rotulo de mes (3 letras -> 1 letra conforme a faixa por mes fica estreita), recebendo a largura ja medida e consumida pelo `computed` `chart()` a partir do `groupWidth`. Manter intactas a guarda `typeof ResizeObserver === 'undefined'` e as constantes `MIN_CHART_WIDTH`/`DEFAULT_CHART_WIDTH` — sao pre-requisito da suite em jsdom, nao detalhe. Nenhuma chamada de API nova.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 25
- [x] **T18** — Consumir o rotulo compacto nos rotulos de mes do eixo X em `dashboard.html`, sem tocar no `(change)` dos controles de Ano/Mes (que continua sendo a unica origem da recarga) nem no `rect.month-hit`/`pointerdown` do informativo.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 25, 27
- [x] **T19** — Ajustar `dashboard.scss` no bloco de 680px: 4 cards de metrica em 1 ou 2 colunas na ordem atual (Receitas, Despesas, Pendentes, Saldo) com valor completo sem truncar, controles de periodo visiveis e operaveis a 390px, e o card do informativo do grafico contido nas bordas do painel com o primeiro e o ultimo mes selecionados.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss`
  - Criterios: 8, 24, 26, 27
- [x] **T20** — Acrescentar em `dashboard.spec.ts` o teste da funcao pura de rotulo de mes (rotulo de 3 letras na largura padrao, rotulo de 1 letra na faixa estreita), sem DOM e sem `ResizeObserver`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 25, 51
- [x] **T21** — Ajustar `login.scss` para o card e o rodape `FinanceOS · v<versao>` caberem na altura visivel a 390x844 sem rolagem, com o campo focado permanecendo visivel e o botao "Entrar" alcancavel com a viewport reduzida (~390x400, teclado emulado). O `.html` nao muda.
  - Arquivos: `frontend/src/app/features/auth/login/login.scss`
  - Criterios: 3, 18, 20
- [x] **T22** — Acrescentar `data-label` (Ver, Incluir, Alterar, Excluir) nos `<td>` da matriz de permissoes de `profiles.html` e promover `.screen-cell` a titulo do bloco. O `<input type="checkbox" [(ngModel)]="permission.canX">` dentro do `<label class="perm-switch">` **nao muda** — `profiles.spec.ts` depende de 20 checkboxes por indice dentro de `form tbody tr` e o `clonePermissions()` depende dos mesmos objetos; o payload `canView/canCreate/canEdit/canDelete` fica identico.
  - Arquivos: `frontend/src/app/features/profiles/profiles.html`
  - Criterios: 22
- [x] **T23** — Ajustar `profiles.scss`: `.permissions-table { min-width: 520px }` restrito a acima de 680px, **um bloco por tela** no mobile (nome da tela + os quatro controles rotulados) sem rolagem horizontal, e area de toque de `var(--touch-target)` no `.perm-switch` mantendo o trilho 38x22 como aparencia. `.profiles-grid` ja colapsa em 1080px.
  - Arquivos: `frontend/src/app/features/profiles/profiles.scss`
  - Criterios: 7, 9, 19, 22, 28
- [x] **T24** — **Teclado virtual nos quatro formularios nao-login**, resolvido na origem no bloco de 680px de `styles.scss` (o login ja foi tratado em T21): garantir que `.form-panel` nao tenha altura fixa nem `position: sticky` que prenda os `.form-actions` fora da area util; `scroll-margin-block` nos campos, para que o `:focus` role o campo para uma posicao visivel em vez de deixa-lo colado na borda inferior; e `.form-actions` permanecendo no fluxo, alcancavel por rolagem. Revalidar com a viewport util reduzida a ~390x400 nos quatro formularios — **novo lancamento, nova categoria, novo usuario e perfil (nome + matriz)** — e tambem na **linha/cartao em edicao inline** das tres telas, que e onde o campo focado fica mais ao fundo da pagina. Correcao especifica que sobrar volta ao `.scss` da tela culpada. **Nenhum campo ou botao pode ser escondido para caber** (seria mudanca funcional).
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 18

## F4 — Revisao de UX/UI do desktop (criterios 33-41)

Unica fase que muda pixel acima de 1080px. Ela vem **depois** de todo o mobile de proposito: qualquer regressao encontrada pelos criterios 42-51 fica atribuivel a esta fase.

- [x] **T25** — Acrescentar em `styles.scss` a regra global `button:focus-visible` com o mesmo anel de 2px do acento e `outline-offset` ja usados por `input`/`select` (`styles.scss:206-209`), alcancando botao primario, ghost, danger, acoes de linha, itens do menu e o fechar do toast.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 33
- [x] **T26** — Alinhar `.ghost-button:disabled` ao tratamento ja existente de `.primary-button:disabled`/`.danger-button:disabled` (mesma opacidade + `cursor: not-allowed`), reservando `cursor: wait` ao botao em operacao de salvamento. E o `.ghost-button` que fica `disabled` nos demais "Editar" durante a edicao inline e hoje nao tem estilo nenhum. O par de contraste do estado desabilitado ja esta na tabela de T16 — conferir que a opacidade escolhida nao o derruba abaixo de 4.5:1.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 34
- [x] **T27** — Distinguir visualmente `.nav-list button.active` de `.nav-list button:hover` em `main-layout.scss` (hoje os dois compartilham `--sidebar-item-active` + texto branco), mantendo o ativo com o destaque mais forte — indicador proprio ou fundo mais solido — e o hover dentro de `@media (hover: hover)`. Acrescentar o par novo (texto sobre o fundo de hover) a tabela de contraste de T16.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.scss`
  - Criterios: 30, 35
- [x] **T28** — Mover a largura da coluna de acoes para o token unico: `col.col-actions { width: var(--col-actions) }` em `styles.scss` e remocao dos valores soltos de hoje (200px em `transactions.scss`, 200px em `categories.scss`, **210px em `users.scss`**).
  - Arquivos: `frontend/src/styles.scss`, `frontend/src/app/features/transactions/transactions.scss`, `frontend/src/app/features/categories/categories.scss`, `frontend/src/app/features/users/users.scss`
  - Criterios: 36
- [x] **T29** — Rotular os tres `<th></th>` vazios da coluna de acoes com `<span class="sr-only">Ações</span>` (`transactions.html:128`, `categories.html:80`, `users.html:87`). Nenhum outro texto de template muda.
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`, `frontend/src/app/features/categories/categories.html`, `frontend/src/app/features/users/users.html`
  - Criterios: 36, 50
- [x] **T30** — Aplicar globalmente em `styles.scss` a entrelinha dos tokens de T2: `--lh-body` (>= 1.45) no `body`/texto de tabela e `--lh-title` (<= 1.3) nos titulos de pagina e de painel. Hoje `line-height` nao e declarado em lugar nenhum e o texto herda o default do navegador.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 37
- [x] **T31** — Criar o utilitario global `.loading-state` em `styles.scss` (indicador de carregamento das telas de lista), mantendo-o no CSS global para nao pesar no budget `anyComponentStyle` de 8 kB por componente. Acrescentar o par texto/fundo do indicador a tabela de contraste de T16.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 30, 38
- [x] **T32** — Dar affordance de rolagem lateral ao `.table-wrap` em `styles.scss` (sombra/gradiente nas bordas via `background-attachment: local, scroll`, sem JS, sumindo ao chegar ao fim da rolagem), visivel na faixa entre 681px e 1080px, onde a tabela ainda excede o painel por causa do `min-width: 760px` global. Acrescentar o par da sombra sobre a superficie a tabela de contraste de T16 (elemento de interface, minimo 3:1).
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 30, 41
- [x] **T33** — Consumir o signal `loading` nos templates de Lancamentos, Categorias e Usuarios: indicador `.loading-state` enquanto a requisicao inicial nao responde e `.empty-state` ("Sem lançamentos cadastrados", "Nenhuma categoria cadastrada", "Nenhum usuário cadastrado") condicionado a `!loading()`, para parar de piscar durante a carga.
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`, `frontend/src/app/features/categories/categories.html`, `frontend/src/app/features/users/users.html`
  - Criterios: 38
- [x] **T34** — Mesmo tratamento no Resumo e em Perfis: `.loading-state` na carga inicial e `.empty-state` ("Sem dados no período", "Nenhum perfil cadastrado") so depois da resposta. O `.empty-state` do Resumo continua inline, nunca vira toast.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`, `frontend/src/app/features/profiles/profiles.html`
  - Criterios: 38
- [x] **T35** — Criar o componente standalone `core/confirm-dialog` (`.ts` + `.html`, **sem `.scss` proprio**, consumindo os utilitarios globais `.modal-backdrop`/`.modal-card`/`.modal-actions`): entradas `message`, `confirmLabel`, `cancelLabel`, saidas `confirm`/`cancel`; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para a pergunta, foco no primeiro botao ao abrir, `Esc` equivalendo a continuar editando, retencao de foco enquanto aberto, devolucao do foco ao botao que abriu e clique no backdrop fechando **sem nenhuma requisicao HTTP**. Markup identico ao de hoje (mesmas classes, mesma hierarquia).
  - Arquivos: `frontend/src/app/core/confirm-dialog/confirm-dialog.ts`, `frontend/src/app/core/confirm-dialog/confirm-dialog.html`
  - Criterios: 39, 40
- [x] **T36** — Substituir o modal "Deseja sair sem salvar?" copiado nos tres templates pelo `<app-confirm-dialog>` com os rotulos novos **"Continuar editando"** e **"Sair sem salvar"** (no lugar de "Não"/"Sim"), acrescentando so o `imports` do componente nos tres `.ts`. Os handlers `confirmExitNo()`/`confirmExitYes()` e o efeito de cada botao **nao mudam**. As tres telas entram **de uma vez**, para nao conviverem dois modais diferentes (dependencia registrada no plano).
  - Arquivos: `frontend/src/app/features/transactions/transactions.{html,ts}`, `frontend/src/app/features/categories/categories.{html,ts}`, `frontend/src/app/features/users/users.{html,ts}`
  - Criterios: 39, 40, 44, 50
- [x] **T37** — Criar `confirm-dialog.spec.ts`: `role`/`aria-modal`/`aria-labelledby`, foco inicial no primeiro botao, `Esc` = cancelar, retencao de `Tab`, retorno de foco ao elemento que abriu, clique no backdrop com `httpMock.expectNone(() => true)`, e os rotulos "Continuar editando"/"Sair sem salvar".
  - Arquivos: `frontend/src/app/core/confirm-dialog/confirm-dialog.spec.ts`
  - Criterios: 39, 40, 51
- [x] **T38** — Ajustar **apenas o titulo** dos testes de `transactions.spec.ts`, `categories.spec.ts` e `users.spec.ts` onde hoje se le "Não"/"Sim" (as assercoes sao por classe, nao por texto). Nenhuma assercao afrouxada; `httpMock.verify()` e `expectNone(() => true)` preservados.
  - Arquivos: `frontend/src/app/features/transactions/transactions.spec.ts`, `frontend/src/app/features/categories/categories.spec.ts`, `frontend/src/app/features/users/users.spec.ts`
  - Criterios: 40, 45, 51
- [x] **T39** — Revalidar o desktop a 1440px e a 1280px depois de F4, coluna a coluna nas tres tabelas: entrar em edicao inline **nao pode alterar a largura de nenhuma coluna** (`table.fixed-layout` + `<colgroup>`) apos o token unico de `col-actions` (Usuarios cai de 210px para 200px — conferir que "Editar" + "Desativar" continuam na mesma linha a 1280px) e apos a entrelinha global, que muda a altura de linha e pode mudar onde o texto quebra. Conferir tambem trilho 76px -> 236px com `.workspace` em `margin-left: 76px` nos dois estados, `.content-grid` `340px minmax(0, 1fr)`, `.profiles-grid` `minmax(0, 1fr) 320px`, 4 cards do Resumo em 4 colunas, tabelas como tabelas e densidade `th` `0 12px 12px` / `td` `14px 12px`. Conferir por fim que o `min-width: 0` global de T9 nao mudou nenhuma largura de coluna no desktop. Correcoes voltam ao `.scss` culpado. **Risco principal do plano; nenhum teste automatizado pega isso.**
  - Arquivos: `frontend/src/app/features/transactions/transactions.scss`, `frontend/src/app/features/categories/categories.scss`, `frontend/src/app/features/users/users.scss`
  - Criterios: 42, 44

## F5 — Fechamento

- [x] **T40** — Varredura final de conformidade: `rg -n "100vh|100dvh|100svh" frontend/src --glob "*.scss"` com cada `100vh` seguido de `100dvh` no mesmo bloco; `rg -n "@media" frontend/src --glob "*.scss"` so com `1080px`, `680px`, `480px` e `(hover: hover)`; `rg -n "!important" frontend/src --glob "*.scss"` sem saida; `rg -n "sidebar:hover|sidebar:focus-within" frontend/src/app/layout/main-layout/main-layout.scss` sem saida; `git status --porcelain` sem nenhuma linha sob `backend/` e sem migration nova; `git diff frontend/package.json` vazio; `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` e `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/*.md'` sem saida; varreduras de acentuacao de `knowledge/architecture.md` sem saida, e revisao do `git diff` dos `.html` confirmando que os **unicos** textos novos sao os dos criterios 11, 36 e 40.
  - Arquivos: — (verificacao; correcoes voltam ao arquivo culpado)
  - Criterios: 2, 4, 5, 43, 47, 48, 49, 50
- [x] **T41** — Rodar `cd frontend && npm test` e `npm run build` (sem warning novo de `anyComponentStyle`, atencao a `main-layout.scss`, que cresce com trilho + gaveta + scrim) e `cd backend && ./mvnw test`. Conferir que continuam verdes, sem afrouxar assercao: edicao inline das tres telas, "Cancelar" com `expectNone(() => true)` nas quatro telas com formulario (incluindo os dois estagios de `profiles.spec.ts`), `profiles.spec.ts` inteiro sem alteracao, `toast.service.spec.ts`/`toast-host.spec.ts` e os testes de `field-error`.
  - Arquivos: — (verificacao)
  - Criterios: 22, 42, 44, 45, 46, 51

## F6 — Correcoes da rodada de verificacao (etapa 8, defeitos A, B e C)

- [x] **T42** — Dar `position: relative` ao `.table-wrap`, para que o `<span class="sr-only">Ações</span>` dos tres `<th>` de acoes seja recortado pelo proprio container rolavel em vez de escapar para a borda direita da tabela (`min-width` 1000px/960px) e esticar o documento. Fecha os 107px de rolagem horizontal de `/transactions` e os 68px de `/users` a 844x390 **e** os 31px de regressao de `/transactions` a 1280px. `position: relative` sem `z-index` nao cria contexto de empilhamento: a sombra de rolagem (que e `background` do proprio elemento) e o `.modal-backdrop`/`.confirm-dialog` (que ficam fora do `.table-wrap`) seguem intactos.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 7, 36, 42
- [x] **T43** — Adiar o foco do primeiro item da gaveta para depois da renderizacao (`afterNextRender` com o `Injector` do componente) e fazer a `visibility` da gaveta virar `visible` **no inicio** da abertura (`transition: ... visibility 0s linear 0s` em `.open`, com `0s linear 0.2s` no estado fechado para o fechamento continuar animado), de modo que o elemento ja esteja visivel — e portanto focavel — quando o `.focus()` roda. Reforcar o teste da gaveta para registrar se o `<aside>` ja tinha a classe `.open` no momento do `.focus()`, o que o faz falhar de verdade sem a correcao mesmo em jsdom (confirmado: "expected false to be true"). Retencao de `Tab`/`Shift+Tab` e retorno do foco ao botao "Menu" nao foram tocados.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`, `frontend/src/app/layout/main-layout/main-layout.scss`, `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 14, 51
- [x] **T44** — Acrescentar a classe `form-actions` a linha de botoes dos formularios de Lancamentos, Categorias e Usuarios (que usavam so `two-cols`), alinhando os tres ao padrao ja existente em Perfis (`two-cols form-actions`) e fazendo a regra de `min-height: var(--touch-target)` ate 480px alcancar "Salvar" e "Cancelar" (42px -> 44px).
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`, `frontend/src/app/features/categories/categories.html`, `frontend/src/app/features/users/users.html`
  - Criterios: 28
- [x] **T45** — Rerodar `npm test`, `npm run build` e `./mvnw test` apos as correcoes: 215 testes de frontend, 51 de backend, build sem warning de `anyComponentStyle`.
  - Arquivos: — (verificacao)
  - Criterios: 51

## Validacao manual (etapa 8)

Criterios que nao ficam verdes por `npm test`/`npm run build`. Ambiente: `http://localhost`, DevTools > Device toolbar em **390x844** (portrait), **844x390** (landscape), **320px** e **390x400** (teclado emulado), mais **900px**, **1280px** e **1440px** no desktop.

- **3** — `/login` e `/dashboard` a 390x844 com barra de navegador dinamica: rolar ate o fim e confirmar que nao sobra faixa vazia abaixo do conteudo nem o rodape fica cortado. *(Ressalva de emulacao da spec: comportamento nativo do Safari nao reproduzido.)*
- **6** — 390x844 com notch simulado: botao "Menu", primeiro item da gaveta e "Fechar" do toast fora da Dynamic Island e da barra inferior. *(Ressalva de emulacao.)*
- **7** — Console em cada uma das 6 telas, a 390x844 e a 844x390: `document.documentElement.scrollWidth <= window.innerWidth` -> `true`.
- **8** — Nas 6 telas/larguras, conferindo os pontos que T9 trata: titulo de pagina, rotulos de formulario, uma `<option>` longa no `select` de Categoria, nome/e-mail no rodape da sidebar, `status-pill`, titulo de card do Resumo e um valor `- R$ 12.480,00`. Criar um registro descartavel com nome de ~60 caracteres (categoria e usuario) e confirmar quebra de linha ou reticencias **dentro** do container, sem sobreposicao.
- **9** — 320px nas 6 telas: sem rolagem horizontal e com Entrar/Salvar/Editar visiveis sem zoom. Medir a gaveta aberta: com `--drawer-width: min(280px, calc(100vw - 48px))` ela deve resolver para 272px e deixar 48px de scrim tocavel.
- **10** — Computed de `.workspace` a 390x844: `margin-left: 0px` e largura >= 351px (90% de 390).
- **13** — 390x844 com a gaveta aberta: o fundo nao rola; a 844x390, a lista da navegacao rola ate o "Sair". Depois de navegar com a gaveta aberta, conferir que o `body` voltou a rolar (trava vazada e falha muito visivel).
- **15** — Emulacao de toque: tocar num item, navegar e observar que nenhum item fica com destaque residual. *(Ressalva de emulacao.)*
- **17** — Computed de `font-size` a 390px num `input` do formulario, num `select` e num `input` **da linha em edicao** (o caso que `table.fixed-layout` sobrescreve) -> `16px`; a 900px -> `14px`/`13.5px`. *(O zoom em si e nativo do Safari, nao reproduzido.)*
- **18** — 390x400 (teclado emulado), roteiro de T24: focar cada campo em `/login`, no formulario de novo lancamento, de nova categoria, de novo usuario e de perfil (nome + matriz) **e tambem na linha/cartao em edicao inline das tres telas**, confirmando campo focado visivel, botoes de acao alcancaveis por rolagem e nada preso atras do teclado. *(Ressalva de emulacao — teclado nativo do iOS nao reproduzido.)*
- **19** — 390x844: `grid-template-columns` de `.content-grid` e `.profiles-grid` com um unico valor; campos com altura >= 44px.
- **20** — `/login` a 390x844 sem rolagem, com o rodape `FinanceOS · v<versao>` visivel; errar a senha e confirmar que o toast de Alerta nao cobre o botao "Entrar".
- **21** — 390x844 em `/transactions`, `/categories` e `/users`: cada registro como cartao com rotulo por campo e acoes ao fim; Computed do `table` com `min-width: 0px`; nenhum container rolando na horizontal.
- **22** — `/profiles` a 390x844: um bloco por tela com Ver/Incluir/Alterar/Excluir rotulados, sem rolagem horizontal.
- **23** — 390x844 nas tres telas: "Editar" abre o cartao em edicao com os demais "Editar" desabilitados; "Salvar" envia `PUT` e recarrega (aba Network); "Sair" com alteracao pendente abre o modal.
- **24** — `/dashboard` a 390x844: 4 cards em 1-2 colunas, ordem Receitas, Despesas, Pendentes, Saldo, valor completo.
- **25** — `/dashboard` a 390px: rotulos dos 12 meses sem colisao, barras e linha de saldo distinguiveis.
- **26** — `/dashboard` a 390px: tocar no primeiro e no ultimo mes; o informativo abre e nao ultrapassa as bordas do painel.
- **27** — `/dashboard` a 390px com a aba Network: trocar Ano e trocar Mes geram **uma** `GET /api/dashboard/summary` cada.
- **28** — Box model a 390px: acoes do cartao, itens da gaveta, botao "Menu", fechar do toast, seletor de cor da edicao inline de Categorias, controles da matriz de Perfis e botoes dos modais -> todos >= 44x44.
- **29** — 390px: espacamento entre botoes adjacentes em `.row-actions`, `.modal-actions` e `.form-actions` >= 8px.
- **30** — **Conferir a tabela de pares medidos produzida por T16** (em `implementation-notes.md`), completada por T27, T31 e T32, e re-medir por amostragem os pares mais apertados. A evidencia deste criterio e a tabela, nao uma impressao visual.
- **31** — 390x844: tipo/status de lancamento e situacao de categoria/usuario com o texto da pill no cartao, e a coluna Valor com o prefixo `+ `/`- ` — nenhuma informacao so pela cor (item ja auditado em T16).
- **32** — Disparar um toast em `/transactions` a 390x844: nao cobre o botao primario nem o cabecalho mobile, respeita a safe area superior e tem o "Fechar" com 44px.
- **33** — 1440px: navegar por `Tab` e confirmar o mesmo anel em botao primario, ghost, danger, acao de linha, item do menu e fechar do toast.
- **34** — 1440px com uma linha em edicao em `/categories`: os demais "Editar" visivelmente atenuados, com `cursor: not-allowed` no Computed.
- **35** — `/dashboard` a 1440px: com o ponteiro sobre "Lançamentos", da para dizer qual dos dois itens e a tela atual.
- **36** — 1440px: coluna de acoes com a mesma largura nas tres telas e o `<th>` anunciado como "Ações" pelo leitor de tela.
- **37** — Computed a 1440px: `line-height` de corpo/celula >= 1.45 e de `.page-title`/`.panel-heading h3` <= 1.3.
- **38** — Com throttling "Slow 3G": abrir Resumo, Lancamentos, Categorias, Usuarios e Perfis e confirmar indicador durante a carga e `.empty-state` so apos a resposta.
- **41** — `/transactions` a 900px: sombra/gradiente na borda do `.table-wrap`, sumindo ao chegar ao fim da rolagem.
- **42** e **44** — Roteiro completo de nao regressao a 1440px e 1280px nas 6 telas (o mesmo de T39), incluindo a medicao das larguras de coluna antes e depois de entrar em edicao inline.
- **43** — 1440px: clicar num grupo com o trilho recolhido expande e abre **sem mudar a URL**; acionar um item recolhe o trilho e move o foco para `.workspace` (o destaque `active` dos pais e leitura nao-reativa e o app roda sem zone.js, entao so e observavel na tela).
- **46** — Forcar um 400 de Bean Validation e ver o toast de Alerta convivendo com a legenda `field-error` por campo.

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Meta viewport com `viewport-fit=cover`, sem `user-scalable` | T1 |
| 2 | Todo `100vh` com fallback `100dvh` no mesmo bloco | T3, T40 |
| 3 | Shell ocupa a altura visivel em `/login` e `/dashboard` | T3, T21 |
| 4 | Conjunto unico de breakpoints documentado e respeitado | T2, T40 |
| 5 | Nenhum `!important` nos `.scss` | T40 |
| 6 | `env(safe-area-inset-*)` no topbar, na gaveta e nos toasts | T6, T12 |
| 7 | Sem rolagem horizontal da pagina a 390x844 e 844x390 | T6, T8, T13, T14, T15, T23, T42 |
| 8 | Nenhum texto cortado ou sobreposto no mobile | T8, **T9**, T13, T14, T15, T19 |
| 9 | 320px continua usavel nas 6 telas (inclui `--drawer-width` limitado) | T6, T8, T10, T23 |
| 10 | `.workspace` sem `margin-left` no mobile, >= 90% da viewport | T6 |
| 11 | Cabecalho com botao "Menu" (44px, `aria-*`) abrindo gaveta + scrim | T4, T5, T6, T7 |
| 12 | Gaveta fecha por scrim, item e `Esc`, sem depender de `hover` | T4, T5, T6, T7 |
| 13 | Fundo nao rola com a gaveta aberta; lista rolavel em landscape | T4, T6 |
| 14 | Foco no primeiro item, `Tab` retido, retorno ao botao "Menu" | T4, T7, T43 |
| 15 | Nenhum item com `hover` preso apos o toque | T6, T11 |
| 16 | Visibilidade por permissao preservada na gaveta | T5, T7 |
| 17 | `font-size` >= 16px em campos ate 480px (inclui edicao inline) | T10 |
| 18 | Campo focado visivel e botao primario alcancavel com teclado aberto | T3, T8, T21, **T24** |
| 19 | Grids em coluna unica, campos com >= 44px de altura | T8, T10, T23 |
| 20 | `/login` cabe na altura visivel, com rodape e sem cobrir "Entrar" | T12, T21 |
| 21 | Registros como cards empilhados nas tres tabelas | T8, T13, T14, T15 |
| 22 | Matriz de Perfis como bloco por tela, payload intacto | T22, T23, T41 |
| 23 | Edicao inline completa no formato card | T8, T13, T14, T15 |
| 24 | 4 cards do Resumo em 1-2 colunas, valor completo | T19 |
| 25 | Rotulos dos 12 meses sem colisao a 390px | T17, T18, T20 |
| 26 | Informativo do grafico por toque, contido no painel | T19 |
| 27 | Controles de periodo operaveis, uma unica `GET /summary` | T18, T19 |
| 28 | Alvos de toque >= 44x44 ate 480px | T6, T10, T12, T14, T23, T44 |
| 29 | >= 8px entre alvos adjacentes | T10 |
| 30 | Contraste >= 4.5:1 / 3:1 nos pares alterados, com tabela de evidencia | **T16**, T2, T6, T12, T27, T31, T32 |
| 31 | Nenhuma informacao so por cor (pills no cartao) | T13, T14, T15, **T16** |
| 32 | Pilha de toasts no mobile nao cobre acao primaria nem topbar | T12 |
| 33 | `:focus-visible` global para `button` | T25 |
| 34 | Estado desabilitado consistente nas tres variantes | T26 |
| 35 | `hover` distinguivel de `active` no menu | T27 |
| 36 | Coluna de acoes rotulada "Ações" com largura de token unico | T28, T29, T42 |
| 37 | Tokens de entrelinha aplicados globalmente | T2, T30 |
| 38 | Indicador de carregamento; `.empty-state` so apos a resposta | T31, T33, T34 |
| 39 | Modal de confirmacao acessivel (papel, foco, `Esc`, retencao) | T35, T36, T37 |
| 40 | Rotulos "Continuar editando" / "Sair sem salvar" | T35, T36, T37, T38 |
| 41 | Affordance de rolagem lateral da tabela entre 681 e 1080px | T32 |
| 42 | Desktop preservado a 1440px e 1280px | T39, T41, T42 |
| 43 | Comportamento do menu no desktop intacto | T4, T6, T7, T40 |
| 44 | Edicao inline intacta no desktop (larguras de coluna) | T36, T39, T41 |
| 45 | "Cancelar" continua `type="button"` e sem HTTP | T38, T41 |
| 46 | Toasts e legendas `field-error` preservados | T41 |
| 47 | Zero alteracao no backend e nenhuma migration | T40 |
| 48 | Nenhuma dependencia npm nova | T40 |
| 49 | Design system preservado, medidas novas como custom property | T2, T40 |
| 50 | Portugues acentuado; so os textos dos criterios 11, 36 e 40 sao novos | T5, T29, T36, T40 |
| 51 | `npm test`, `npm run build` e `./mvnw test` verdes | T7, T20, T37, T38, T41, T43, T45 |

## Lacunas

- **Nenhum criterio de aceite ficou sem tarefa** — os 51 estao cobertos por ao menos uma das 41 tarefas, e nenhuma tarefa existe sem criterio associado (nao ha tarefa de infraestrutura pura: mesmo o componente novo `core/confirm-dialog` nasce amarrado aos criterios 39 e 40).
- **Os quatro pontos de cobertura fraca da primeira versao deste arquivo foram fechados**, e nenhum deles depende mais de consequencia de outra tarefa:
  - **Criterio 8** (texto fora das tabelas) passou a ter a tarefa propria **T9**, que ataca a causa — `min-width: auto` herdado em filhos de flex/grid e `overflow-wrap` restrito a `table.fixed-layout` — em vez de item por item.
  - **Criterio 18** (teclado virtual nos formularios nao-login) passou a ter a tarefa propria **T24**, com regra na origem em `styles.scss` e roteiro de revalidacao nos quatro formularios **e** na edicao inline das tres telas.
  - **Criterio 30** (contraste) passou a ter a tarefa propria **T16**, que produz uma **tabela de pares medidos** em `implementation-notes.md` — a etapa 8 passa a ter evidencia em vez de impressao visual. Ela tambem absorveu o criterio 31 (informacao que nao pode depender so de cor).
  - **Criterio 9** teve o `--drawer-width` fixado em **T6** como `min(280px, calc(100vw - 48px))`, limitado pela viewport: a gaveta nao sangra a 320px e sempre sobra scrim tocavel.
- **Ponto de coordenacao residual da auditoria de contraste.** T16 roda na F2, mas tres pares so nascem na F4 (`.loading-state`, sombra de rolagem do `.table-wrap` e o par hover vs. ativo do menu). Isso esta resolvido por instrucao explicita em T27, T31 e T32, que devem **acrescentar seus pares a mesma tabela** — mas e uma dependencia entre fases que depende de disciplina, nao de ferramenta: se a F4 for implementada sem atualizar a tabela, o criterio 30 fica com evidencia incompleta.
- **Regra de negocio so no frontend: nao se aplica, e isso e uma restricao ativa.** Nenhum dos 51 criterios descreve regra de negocio — a issue e exclusivamente de apresentacao, e os criterios 47 e 22 travam backend e payload. As tres tarefas novas sao justamente as mais tentadoras nesse sentido (texto que nao cabe, formulario apertado pelo teclado, contraste que nao fecha): **nenhuma delas pode esconder campo, botao ou opcao**; a saida e quebrar/truncar, rolar ou corrigir o token. Se isso aparecer na implementacao, volta como pergunta.
- **Criterios 3, 6, 15, 17 e 18 so fecham por emulacao, por decisao da spec (PA4).** Nao e lacuna de cobertura: cada um tem tarefa de implementacao (T3/T21, T6/T12, T6/T11, T10, T24). A ressalva vale para a **verificacao** — barra de URL dinamica, safe area real, hover preso apos toque, zoom automatico ao focar campo e teclado nativo do iOS nao sao reproduzidos no DevTools e, conforme a Decisao 4 da spec, nao sao motivo para reprovar a feature na etapa 8.
- **30 dos 51 criterios so fecham na tela**, mas agora com roteiro e — nos casos criticos — com evidencia registrada. E consequencia da natureza da issue: responsividade nao tem assercao em jsdom, que nao tem viewport nem layout. A suite automatizada cobre de fato 11, 12, 14, 16, 22, 25, 39, 40, 43, 44, 45, 46 e 51; o criterio 30 deixou de ser "olho humano" e passou a ser medicao com tabela (T16); o resto esta na secao "Validacao manual (etapa 8)" acima, ja pronta para a etapa `/pipeline:verify`.
- **T36 toca 6 arquivos, acima do limite usual de 3 ou 4.** Foi mantida inteira de proposito: o plano registra explicitamente que o `ConfirmDialog` precisa entrar nas tres telas **de uma vez**, para nao conviverem dois modais diferentes no mesmo working tree. Quebra-la em tres tarefas criaria um estado intermediario que nenhum criterio aceita.
