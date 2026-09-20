# Notas de implementacao

Branch: `feature/issue-54-responsividade-mobile` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 45 de 45 concluidas (ver `tasks.md`; T42-T45 nasceram na rodada de correcao dos defeitos da etapa 8)

Resultado das verificacoes automatizadas rodadas ao final (T41):

- `cd frontend && npm test` -> 22 arquivos, **215 testes verdes** (199 existentes + 16 novos: 6 da gaveta, 3 do rotulo de mes, 7 do `ConfirmDialog`).
- `cd frontend && npm run build` -> verde, **sem nenhum warning de orcamento** (`anyComponentStyle`). `styles.css` final: 12,29 kB bruto / 2,97 kB transferido.
- `cd backend && ./mvnw test` -> **51 testes verdes**, sem nenhum arquivo de `backend/` alterado.

## Arquivos alterados

### Fundacao (F0)

- `frontend/src/index.html` — meta viewport com `viewport-fit=cover`; sem `user-scalable`/`maximum-scale` (T1).
- `frontend/src/styles.scss` — **arquivo central da feature**. Bloco de comentario declarando o conjunto unico de breakpoints (1080/680/480 + a nota de que `@media (hover: hover)` nao tem largura e de que custom property nao e avaliada dentro de `@media`); tokens novos `--bp-desktop/--bp-mobile/--bp-compact`, `--touch-target`, `--touch-gap`, `--fs-input-mobile`, `--fs-card-label`, `--lh-body`/`--lh-title`, `--col-actions`, `--mobile-topbar-h`, `--drawer-width`, `--scrim`, `--shadow-drawer`, `--shadow-topbar`, `--scroll-shadow-*`, `--surface-fade`, `--card-row-bg`, `--sidebar-item-hover` (T2, T6, T8-T11, T24-T32).
- `frontend/src/app/app.scss`, `frontend/src/app/features/auth/login/login.scss`, `frontend/src/app/layout/main-layout/main-layout.scss` — os 4 pontos de altura de tela agora tem `100vh` seguido imediatamente de `100dvh` no mesmo bloco (T3).

### Shell e navegacao (F1)

- `frontend/src/app/layout/main-layout/main-layout.ts` — signal `drawerOpen`, `toggleDrawer()`, `closeDrawer(returnFocus)`, `@HostListener('document:keydown.escape')`, retencao de `Tab`/`Shift+Tab` dentro do `<aside>`, foco no primeiro item ao abrir, devolucao ao botao "Menu" ao fechar por scrim/`Esc`/botao, e trava de rolagem do `<body>` por classe com limpeza em `closeDrawer()`, `onNavigate()` e `ngOnDestroy()`. `expand()`, `collapse()`, `toggleGroup()`, `onNavigate()` e os helpers de permissao mantiveram assinatura e efeito. **Sem `matchMedia` e sem medicao de DOM** (T4).
- `frontend/src/app/layout/main-layout/main-layout.html` — `<header class="mobile-topbar">` com marca reduzida e `<button class="menu-button" aria-label="Abrir menu" [attr.aria-expanded] aria-controls="app-drawer">`, `<div class="drawer-scrim">` condicionado a `drawerOpen()`, `id="app-drawer"` + `[class.open]` no `<aside>`, e `[attr.title]` com o nome completo do usuario no rodape da gaveta. Nenhum item, rotulo ou `*ngIf` de permissao da navegacao mudou (T5, T9).
- `frontend/src/app/layout/main-layout/main-layout.scss` — `.sidebar` com `overflow-x: hidden`/`overflow-y: auto` e `.nav-list` em `flex: 1 0 auto` (corrige C2: em 844x390 o conteudo rola ate o "Sair" em vez de ser cortado); bloco de 680px com topbar fixa + safe area, gaveta (`translateX(-100%)` -> `0`, `visibility` para nao deixar a gaveta fechada tabulavel, `--drawer-width`, rotulos sempre visiveis), scrim, `.workspace` sem `margin-left`; hovers dentro de `@media (hover: hover)`; nome/versao do rodape truncando com reticencias. **Nao ha `.sidebar:hover` nem `.sidebar:focus-within`** (T6, T9, T27).
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — 6 testes novos da gaveta (abrir/`aria-*`/scrim, fechar por scrim, por `Esc`, por item de navegacao, foco inicial e retorno, retencao de `Tab`). Os 16 testes existentes ficaram **inalterados** (T7).

### Padroes globais de mobile (F2)

- `frontend/src/styles.scss` — bloco `@media (max-width: 680px)` com o modo card (`table { display: block; min-width: 0 }`, `thead` oculto, `tbody`/`tr`/`td` em bloco, `td::before { content: attr(data-label) }`, `tr` como cartao, `.table-wrap` sem rolagem lateral), colapso de `.content-grid`/`.two-cols`/`.list-row`, `scroll-padding-block` no `html` e `scroll-margin-block` nos campos (teclado virtual), `body.drawer-open { overflow: hidden }`; bloco `@media (max-width: 480px)` com `font-size: var(--fs-input-mobile)` em campos **incluindo o override de `table.fixed-layout td input, td select`** e alvos de `var(--touch-target)` com `gap` de 10px; `min-width: 0` nos filhos de flex/grid que travavam a quebra e `overflow-wrap: anywhere` no `body`; `:hover` global dentro de `@media (hover: hover)` (T8-T11, T24).
- `frontend/src/app/core/toast/toast-host.scss` — no mobile a pilha ocupa a largura util com `top` somando `env(safe-area-inset-top)` **mais** `--mobile-topbar-h`, lateral com safe area, e o botao de fechar com area de `var(--touch-target)` ate 480px (T12).
- `frontend/src/app/features/transactions/transactions.{html,scss}`, `categories/categories.{html,scss}`, `users/users.{html,scss}` — `data-label` em cada `<td>` de leitura **e** de edicao com o mesmo texto do `<th>` correspondente; `min-width` das tabelas neutralizado abaixo de 680px; valor alinhado a esquerda no cartao; seletor de cor da edicao inline de Categorias subindo para `var(--touch-target)` ate 480px sem mexer nos 42px do formulario (T13-T15).

### Telas especificas (F3)

- `frontend/src/app/features/dashboard/dashboard.ts` — funcao **pura e exportada** `monthAxisLabel(month, groupWidth)` (3 letras -> 1 letra abaixo de 30px por faixa), consumida pelo `computed` `chart()` a partir do `groupWidth` ja medido. `typeof ResizeObserver === 'undefined'`, `MIN_CHART_WIDTH` e `DEFAULT_CHART_WIDTH` intactos (T17).
- `frontend/src/app/features/dashboard/dashboard.scss` — cards de metrica e controles de periodo utilizaveis a 390px, titulo do periodo menor, e o informativo do grafico passando a `position: static` dentro da camada absoluta no mobile, o que o contem nas bordas do painel com qualquer mes selecionado (T19).
- `frontend/src/app/features/dashboard/dashboard.spec.ts` — 3 testes da funcao pura, sem DOM e sem `ResizeObserver` (T20).
- `frontend/src/app/features/auth/login/login.scss` — centralizacao por `margin: auto` em vez de `justify-content: center` (com a viewport reduzida o card deixa de ser cortado no topo e passa a ser alcancavel por rolagem), safe area nas quatro bordas, `scroll-margin-block` nos campos e card mais compacto ate 480px (T21).
- `frontend/src/app/features/profiles/profiles.{html,scss}` — `data-label` Ver/Incluir/Alterar/Excluir nos `<td>` da matriz e `.screen-cell` promovida a titulo do bloco; abaixo de 680px a matriz vira **um bloco por tela** sem `min-width: 520px` e sem rolagem horizontal, com area de toque de 44px no `.perm-switch` mantendo o trilho 38x22 como aparencia. O `<input type="checkbox">` com `[(ngModel)]` e `name` **nao mudou** (T22, T23).

### Revisao de UX/UI do desktop (F4)

- `frontend/src/styles.scss` — `button:focus-visible` com o mesmo anel de `input`/`select`; `.ghost-button:disabled` alinhado a `.primary-button`/`.danger-button` (mesma opacidade + `cursor: not-allowed`), com `cursor: wait` reservado ao `.primary-button:disabled`, que e sempre o botao em salvamento; `col.col-actions { width: var(--col-actions) }`; entrelinha global (`--lh-body` no `body`, `--lh-title` em `.page-title` e `.panel-heading h3`); utilitario `.loading-state`; affordance de rolagem lateral do `.table-wrap` por gradientes com `background-attachment: local, local, scroll, scroll` (sem JS), desligada no modo card (T25, T26, T28, T30, T31, T32).
- `frontend/src/app/layout/main-layout/main-layout.scss` — `.nav-list button.active` ganhou peso 700 e um indicador proprio de 3px, e o `:hover` passou a usar `--sidebar-item-hover` com `--sidebar-text-strong` (antes hover e ativo eram identicos) (T27).
- `frontend/src/app/features/{transactions,categories,users}/*.html` — `<th><span class="sr-only">Ações</span></th>` nas tres colunas de acoes; `[attr.aria-busy]` no container da lista; `.loading-state` na carga e `.empty-state` condicionado a `!loading()`; modal substituido por `<app-confirm-dialog>` (T29, T33, T36).
- `frontend/src/app/features/{dashboard,profiles}/*.html` — mesmo tratamento de carregamento; o `.empty-state` "Sem dados no período" continua inline (T34).
- `frontend/src/app/core/confirm-dialog/confirm-dialog.ts` **(novo)** e `confirm-dialog.html` **(novo)** — componente standalone, **sem `.scss` proprio** (consome `.modal-backdrop`/`.modal-card`/`.modal-actions` globais, protegendo o orcamento de 8 kB): `role="dialog"`, `aria-modal="true"`, `aria-labelledby` na pergunta, foco no primeiro botao ao abrir, `Esc` = continuar editando, retencao de `Tab`, devolucao do foco ao elemento que abriu e clique no backdrop fechando sem HTTP (T35).
- `frontend/src/app/core/confirm-dialog/confirm-dialog.spec.ts` **(novo)** — 7 testes cobrindo papel/rotulo, rotulos "Continuar editando"/"Sair sem salvar", foco inicial e retorno, `Esc`, retencao de `Tab` e backdrop com `httpMock.expectNone(() => true)` (T37).
- `frontend/src/app/features/{transactions,categories,users}/*.ts` — apenas o `imports` do `ConfirmDialog` (T36).
- `frontend/src/app/features/{categories,users}/*.spec.ts` — **apenas o titulo** de dois testes em cada arquivo, onde se lia "Não"/"Sim". Nenhuma assercao alterada (T38).

## Tabela de contraste medido (T16, completada por T27, T31 e T32)

Medicao calculada a partir dos proprios tokens `oklch` de `styles.scss` (conversao OKLab -> sRGB linear -> luminancia relativa WCAG 2.x), o que e mais preciso do que a leitura visual do DevTools e reproduzivel. Minimos: **4.5:1** texto normal, **3:1** texto >= 18.66px/700, elemento de interface e borda de controle de formulario.

| Par (texto / fundo) | Contexto | Razao | Minimo | Veredito |
|---|---|---|---|---|
| `--text` / `--surface` | corpo em painel, cabecalho mobile, botao "Menu" | 16.90:1 | 4.5 | OK |
| `--text` / `--bg-app` | corpo sobre o fundo da aplicacao | 15.63:1 | 4.5 | OK |
| `--text-muted` / `--surface` | secundario, mensagem de toast, `.loading-state` | 6.54:1 | 4.5 | OK |
| `--text-muted` / `--card-row-bg` | **rotulo do cartao (`td::before`)** no modo card | 6.05:1 | 4.5 | OK |
| `--text-label` / `--surface` | rotulo de campo | 9.22:1 | 4.5 | OK |
| `--text-faint` / `--bg-app` | rodape do login, rotulos do eixo do grafico | **4.89:1** | 4.5 | OK **apos correcao** (era 4.49:1) |
| `--surface` / `--accent` | `.primary-button`, marca do cabecalho mobile | 4.76:1 | 4.5 | OK |
| `--surface` / `--accent-hover` | `.primary-button:hover` | 7.34:1 | 4.5 | OK |
| `--sidebar-text` / `--sidebar-bg` | item de menu normal (trilho e gaveta) | 9.49:1 | 4.5 | OK |
| `--surface` / `--sidebar-item-active` | item de menu ativo | 12.72:1 | 4.5 | OK |
| `--surface` / `--sidebar-item-active` | **indicador de 3px do item ativo** (T27) | 12.72:1 | 3 | OK |
| `--sidebar-text-strong` / `--sidebar-item-hover` | **item de menu em hover** (T27, par novo) | 9.24:1 | 4.5 | OK |
| `--sidebar-text-strong` / `--sidebar-bg` | nome do usuario na gaveta | 11.21:1 | 4.5 | OK |
| `--sidebar-text-dim` / `--sidebar-bg` | versao na gaveta (sempre visivel no mobile) | **4.87:1** | 4.5 | OK **apos correcao** (era 4.14:1) |
| `--income-on-soft` / `--income-soft` | `status-pill.pill-income` | 7.63:1 | 4.5 | OK |
| `--pending-on-soft` / `--pending-soft` | `status-pill.pill-pending` | 6.26:1 | 4.5 | OK |
| `--expense-on-soft` / `--expense-soft` | `status-pill.pill-expense` | 7.28:1 | 4.5 | OK |
| `--neutral-on-soft` / `--neutral-soft` | `status-pill.pill-neutral` | 6.06:1 | 4.5 | OK |
| `--income-amount` / `--card-row-bg` | valor de receita no cartao | 7.26:1 | 4.5 | OK |
| `--expense-amount` / `--card-row-bg` | valor de despesa no cartao | 6.57:1 | 4.5 | OK |
| `--income-icon` / `--income-soft` | icone do toast de Sucesso | 6.95:1 | 3 | OK |
| `--pending-icon` / `--pending-soft` | icone do toast de Alerta | 5.51:1 | 3 | OK |
| `--expense-on-soft` / `--expense-soft` | icone do toast de Falha | 7.28:1 | 3 | OK |
| `--text-faint` / `--surface` | botao "Fechar" do toast (icone) | 5.28:1 | 3 | OK |
| `--expense-on-soft` / `--surface` | legenda `.field-error` | 9.25:1 | 4.5 | OK |
| `--expense` / `--surface` | borda de `input.invalid` | 4.66:1 | 3 | OK |
| `--text-muted` / `--surface` | **placeholder** (antes: `currentColor` a 54% = 2.03:1) | **6.54:1** | 4.5 | OK **apos correcao** |
| `--accent` / `--surface` | anel do `.loading-state` (T31, par novo) | 4.76:1 | 3 | OK |
| `--scroll-shadow-edge` 75% / `--surface` | sombra de rolagem do `.table-wrap` (T32, par novo) | **3.28:1** | 3 | OK **apos correcao** (a 22% dava 1.26:1) |
| `--scrim` 58% sobre `--surface` | escurecimento do fundo com a gaveta aberta | 2.21:1 de escurecimento | — | Nao e par texto/fundo: o scrim nao recebe texto. Registrado como medida do efeito (o padrao de mercado fica entre 1.5:1 e 2:1). |
| `--border-card` / `--card-row-bg` | borda do cartao de registro no mobile | 1.21:1 | — | Nao e borda de controle de formulario nem texto; a separacao do cartao vem do fundo tonal **mais** a borda. Ver "Pendencias". |
| `--border-input` / `--surface` | **borda de controle de formulario** | **1.44:1** | 3 | **FALHA pre-existente, nao alterada por esta feature.** Ver "Pendencias". |
| `.ghost-button:disabled` (opacidade 0.55) | "Editar" das demais linhas em edicao inline | 1.96:1 | — | Isento: WCAG 1.4.3 dispensa contraste de componente inativo. |
| `.primary-button:disabled` (opacidade 0.55) | "Salvar" durante o `PUT` | 1.77:1 | — | Isento pelo mesmo motivo; opacidade **nao** foi alterada (era e continua 0.55). |
| `.danger-button:disabled` (opacidade 0.55) | — | 1.73:1 | — | Isento pelo mesmo motivo. |

**Informacao que nao depende de cor (criterio 31):** conferido no modo card que tipo e status de lancamento continuam com o texto da `status-pill` ("Pendente"/"Pago"), que a situacao de categoria e o status de usuario continuam com "Ativo"/"Inativo" na pill, e que a coluna Valor mantem o prefixo `+ `/`- ` de `signedMoney()` alem da cor. Nenhum rotulo foi removido.

## Decisoes

- **D1 — O modo mobile e decidido 100% pelo CSS.** O TS guarda apenas o booleano `drawerOpen`; o botao "Menu" e `display: none` acima de 680px. Nenhum `window.matchMedia` e nenhuma medicao de DOM entrou na logica da gaveta — em jsdom `matchMedia` nao existe e toda medida vem `0`, e isso derrubaria os 16 testes de `main-layout.spec.ts` de uma vez.
- **D2 — Os tokens `--bp-*` sao documentacao.** Toda `@media` escreve o literal (1080/680/480), porque custom property nao e avaliada dentro de media query. Registrado no comentario de `styles.scss`.
- **D3 — Faixa "acima de 680px" implementada por override, nao por `min-width`.** `@media (min-width: 681px)` violaria o conjunto unico de breakpoints do criterio 4, entao as larguras minimas das tabelas (1000px/960px/520px) sao neutralizadas dentro do proprio bloco de 680px com `min-width: 0`.
- **D4 — Gaveta fechada fica `visibility: hidden`.** Sem isso a gaveta, apenas deslocada por `transform`, continuaria tabulavel fora da tela no mobile.
- **D5 — Login centralizado por `margin: auto` em vez de `justify-content: center`.** Com a viewport reduzida pelo teclado, `justify-content: center` corta o topo do conteudo de forma irrecuperavel (nao ha como rolar para cima); com auto-margins o conteudo continua centralizado quando sobra espaco e encosta no topo quando falta.
- **D6 — O informativo do grafico vira `position: static` no mobile.** O `left` inline e calculado em unidades do `viewBox` (minimo 320) e, numa viewport menor que isso, o SVG e reduzido mas o informativo (HTML) nao — o `left` passaria das bordas. Em `static` o `left` deixa de se aplicar e o informativo ocupa a largura do painel.
- **D7 — O indicador de carregamento nao exibe texto.** E um anel animado puro (`.loading-state` + `[attr.aria-busy]` no container da lista). Isso atende ao criterio 38 sem criar rotulo novo, que o criterio 50 nao permite.
- **D8 — Correcoes de contraste feitas no token, nunca na tela.** `--text-faint` 55% -> 53%, `--sidebar-text-dim` 58% -> 62%, `--scroll-shadow-edge` 22% -> 75% e `::placeholder` passando a `var(--text-muted)`. As duas primeiras mudam levemente o desktop (rodape do login, rotulos do eixo do grafico, versao na sidebar) — autorizado pelo criterio 30, que exige o contraste medido, e registrado aqui porque o criterio 42 pede que toda mudanca visual de desktop seja atribuivel.
- **D9 — `cursor: wait` ficou so no `.primary-button:disabled`.** Todo `.primary-button` desabilitado no projeto e desabilitado por `[disabled]="saving()"`, ou seja, e literalmente "o botao em operacao de salvamento" do criterio 34. `.ghost-button`/`.danger-button` desabilitados usam `not-allowed`.
- **D10 — A `status-pill` ganhou `white-space: nowrap` com `max-width: 100%`.** O rotulo da pill nao quebra no meio; quem quebra e o container ao redor, conforme T9.

## Desvios em relacao ao plano e as tarefas

- **T9 — `.metric-card` tratado em `dashboard.scss`, nao em `styles.scss`.** A tarefa listava `.metric-card` e seus rotulo/valor entre os pontos de `min-width: 0` de T9 (arquivo `styles.scss`), mas a classe e exclusiva do Resumo e colocar uma regra dela no CSS global poluiria o tema. O `min-width: 0` foi aplicado no `dashboard.scss`, que ja e o arquivo de T19 e ja consta na cobertura do criterio 8. Efeito identico.
- **T12 — offset unico do toast, sem deteccao de `/login`.** A tarefa pedia "offset proprio em `/login`", que nao tem cabecalho mobile. O `toast-host` e irmao do `router-outlet` na raiz e nao tem como saber a rota sem `:host-context` com `:has()` (fragil) ou entrada nova de estado. Foi adotado o mesmo offset (`--mobile-topbar-h` + safe area) nos dois contextos: no login ele apenas desce a pilha 56px, e o card do login fica verticalmente centralizado bem abaixo disso, entao o toast de Alerta continua sem cobrir o botao "Entrar" (criterio 20). **Ponto a conferir na validacao manual.**
- **T18 — nenhuma linha de `dashboard.html` precisou mudar.** O template ja vinculava `{{ month.label }}`; trocar a origem do rotulo em `chart()` (T17) ja faz o eixo consumir o rotulo compacto. Cheguei a acrescentar um `<title>` com o nome longo do mes dentro do `<text>`, mas isso quebrava a assercao existente `all('text.chart-month').map(label)` de `dashboard.spec.ts`, e afrouxar/reescrever aquela assercao contraria o criterio 51 — o `<title>` foi removido. O nome completo do mes continua disponivel pelo informativo por toque. Tarefa marcada como concluida porque o resultado observavel (rotulo compacto no eixo) esta entregue e as instrucoes de "nao tocar" (`(change)` de Ano/Mes, `rect.month-hit`/`pointerdown`) foram respeitadas.
- **T31 — `.loading-state` ficou so com o anel, sem a barra de esqueleto.** A barra usava `--neutral-soft` sobre `--surface` (1.23:1) e entraria na tabela de contraste como elemento de interface abaixo de 3:1. Removida; o anel em `--accent` (4.76:1) e o indicador.
- **T25/T26 — nenhum estilo de `:hover` novo foi criado.** Cheguei a adicionar `:hover` para `.ghost-button`/`.danger-button` (que hoje nao tem nenhum) e revertei: seria mudanca visual de desktop fora dos criterios 33-41, proibida pelo criterio 42. Apenas o `:hover` ja existente do `.primary-button` foi envolvido em `@media (hover: hover)` (T11).
- **T39 — revalidacao do desktop feita por revisao de codigo, nao por medicao em navegador.** A medicao pixel a pixel a 1440px e 1280px e da etapa 8 (esta na secao "Validacao manual" de `tasks.md`). O que foi conferido no codigo: (a) `table-layout: fixed` + `<colgroup>` continuam sendo a unica origem das larguras, logo entrar em edicao inline nao muda coluna nenhuma; (b) com `--col-actions: 200px`, "Editar" (~66px) + "Desativar" (~84px) + `gap` 8px = ~158px cabem nos 176px uteis da coluna de Usuarios, que caiu de 210px para 200px; (c) `td`/`th` globais continuam `white-space: nowrap`, entao o `overflow-wrap: anywhere` do `body` nao altera a largura intrinseca de nenhuma coluna; (d) a densidade `th` `0 12px 12px` / `td` `14px 12px` nao foi tocada — o que muda a altura de linha e so a entrelinha global do criterio 37.

## Pendencias e duvidas para a validacao

- **Borda de controle de formulario a 1.44:1 (`--border-input` sobre `--surface`).** E o unico item da auditoria que falha o minimo de 3:1 e **nao foi corrigido de proposito**: a borda nao e alterada por esta feature (o criterio 30 fala em "pares alterados") e escurecer `--border-input` mudaria a aparencia de todo campo do sistema em desktop, o que o criterio 42 restringe aos criterios 33-41 e a secao "Fora de escopo" da spec protege ("a paleta `oklch` ... permanece"). Fica registrado como divida de acessibilidade: se voce quiser corrigir, e uma linha em `styles.scss` (`--border-input` por volta de `oklch(72% 0.008 80)`), mas e mudanca visual global e merece ser uma issue propria.
- **Formato do bloco por tela em Perfis (criterio 22).** Implementado como a spec derivou (nome da tela como titulo do bloco + quatro linhas "rotulo a esquerda / interruptor a direita"). Se preferir acordeao, e o ponto a ajustar — o payload `canView/canCreate/canEdit/canDelete` e independente do formato e nao mudou.
- **Rotulo de mes de 1 letra a 390px.** J/F/M/A/M/J/J/A/S/O/N/D repete iniciais; a desambiguacao vem do informativo por toque, que mostra o nome completo. Se voce preferir rotacionar os rotulos de 3 letras ou exibir mes sim/mes nao, o corte esta isolado em `monthAxisLabel()` (`COMPACT_MONTH_LABEL_WIDTH = 30`).

## Rodada de correcao 1 (2026-09-20) — defeitos A, B e C de `verification-report.md`

Correcao dos 4 criterios reprovados na etapa 8 (7, 14, 28 e 42), por 3 defeitos. Nada fora deles foi tocado — em especial o par `--border-input` **continua como estava**, por ser decisao pendente do usuario e nao defeito.

### Defeito A (criterios 7 e 42) — rolagem horizontal causada pelo rotulo "Ações"

- `frontend/src/styles.scss` — `.table-wrap` ganhou `position: relative` (uma linha). Foi a correcao apontada pelo verificador e e de fato a menor correta: o `.sr-only` e `position: absolute`, e com o `.table-wrap` estatico o bloco de contencao dele virava o bloco inicial do documento, escapando do recorte do container rolavel e parando na borda direita da tabela (`min-width` 1000px/960px). Com `position: relative`, o containing block passa a ser o proprio `.table-wrap`, que e scroll container (`overflow-x: auto`, com `overflow-y` computando `auto`) e portanto o recorta — o span vira 1px de scroll **interno** da tabela, que ja existia, em vez de largura de documento.
- Conferi as duas ressalvas pedidas: (a) `position: relative` **sem `z-index`** nao cria contexto de empilhamento, entao nada muda para a sombra de rolagem (que sao `background-image`s do proprio `.table-wrap`, nao camadas posicionadas) nem para a edicao inline (que nao usa posicionamento); (b) o unico elemento `position: fixed` que poderia ser afetado e o `.modal-backdrop`, e o `<app-confirm-dialog>` fica **fora** do `.table-wrap` nos tres templates (`transactions.html:270`, `categories.html:180`, `users.html:186`). Como brinde, o `.perm-switch-label` (tambem `position: absolute`) da matriz de Perfis passa a ser recortado pelo mesmo mecanismo.
- No modo card (ate 680px) o `.table-wrap` volta a `overflow-x: visible`, mas ali a `thead` e `display: none` e o span nem e renderizado.

### Defeito B (criterio 14) — foco ao abrir a gaveta

- `frontend/src/app/layout/main-layout/main-layout.ts` — `toggleDrawer()` passou a adiar o foco com `afterNextRender(() => this.drawerFocusables()[0]?.focus(), { injector: this.injector })`, que e a forma idiomatica do Angular 22 para "depois que o DOM desta mudanca foi escrito". `closeDrawer()`, a retencao de `Tab`/`Shift+Tab` e o retorno do foco ao botao "Menu" **nao foram tocados**.
- `frontend/src/app/layout/main-layout/main-layout.scss` — **correcao adicional, nao prevista pelo verificador**: so adiar o `.focus()` nao bastava com seguranca, porque a gaveta declarava `transition: transform 0.2s ease, visibility 0.2s ease`. Numa transicao de `visibility`, o valor no progresso 0 ainda e o inicial (`hidden`), e o `afterNextRender` roda exatamente nesse instante (depois da escrita do DOM, antes da pintura) — o foco poderia continuar sendo descartado por elemento invisivel. O estado `.open` passou a `transition: transform 0.2s ease, visibility 0s linear 0s` (visivel imediatamente ao abrir) e o estado fechado a `visibility 0s linear 0.2s` (continua visivel ate o fim do deslizamento ao fechar). A animacao de abrir/fechar e identica na tela; so a `visibility` deixou de ficar ambigua no primeiro frame.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — o teste da gaveta foi reescrito para **registrar se o `<aside>` ja tinha a classe `.open` no momento em que o `.focus()` do primeiro item foi chamado** (envelopando o `focus` do proprio elemento), e so entao conferir o `document.activeElement`. Isso o torna sensivel ao defeito mesmo em jsdom, onde nao ha CSS: **confirmado empiricamente** — revertendo temporariamente o `afterNextRender` o teste falha com `expected false to be true`, e com a correcao passa. As assercoes de fechamento pelo scrim e de retorno do foco no mesmo teste ficaram intactas.

### Defeito C (criterio 28) — "Salvar"/"Cancelar" com 42px

- `frontend/src/app/features/transactions/transactions.html`, `categories/categories.html`, `users/users.html` — a linha de botoes passou de `class="two-cols"` para `class="two-cols form-actions"`.
- **Caminho escolhido: acrescentar `form-actions` aos tres templates, e nao `.two-cols` a lista de seletores de `styles.scss`.** Motivo: `two-cols form-actions` **ja e o padrao do projeto** para linha de acao de formulario — e o que Perfis usa (`profiles.html:68`), e e justamente por isso que la o botao mede 44px. Os tres templates simplesmente esqueceram a classe. Alem disso, `.two-cols` e um utilitario generico de duas colunas usado tambem para **pares de campos** (`transactions.html:55` e o `<td>` de Status da edicao inline em `transactions.html:211`): colocar `min-height` de alvo de toque em "qualquer botao dentro de `.two-cols`" acoplaria uma regra de toque a uma classe de layout e alcancaria contextos que nao sao linha de acao. Nenhum seletor global mudou, e nenhum texto novo entrou (o criterio 50 continua valido: classe nao e texto).
- Sem efeito no desktop: `.form-actions` so tem regra global dentro de `@media (max-width: 480px)` (gap, que `.two-cols` ja tinha, e `min-height`), e a regra `.form-actions` de `profiles.scss` e encapsulada no componente de Perfis.

### Verificacoes desta rodada

- `cd frontend && npm test` -> 22 arquivos, **215 testes verdes** (mesmo total de antes; o teste da gaveta foi reforcado, nao acrescentado).
- `cd frontend && npm run build` -> verde, **sem nenhum warning** (`anyComponentStyle` incluso). `styles.css`: 12,16 kB bruto / 2,96 kB transferido.
- `cd backend && ./mvnw test` -> **51 testes verdes**, `backend/` sem nenhum arquivo alterado.
- CSS servido conferido no bundle gerado: `.table-wrap{position:relative;...}` e `.form-actions .ghost-button,.form-actions .primary-button,.form-actions .danger-button{min-height:var(--touch-target)}`.

### Desvios desta rodada

- **Defeito B exigiu uma correcao a mais do que a apontada** (a `transition` de `visibility` da gaveta, em `main-layout.scss`), pelo motivo descrito acima. Os defeitos A e C foram corrigidos exatamente na origem apontada; no C, entre as duas saidas oferecidas pelo verificador, foi escolhida a do template, com a justificativa acima.
- As correcoes viraram as tarefas **T42 a T45** no fim de `tasks.md`, ja marcadas como concluidas, e entraram na matriz de cobertura dos criterios 7, 14, 28, 36, 42 e 51. Nenhuma tarefa anterior foi desmarcada.
