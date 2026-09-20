# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior — ver `docker-report.md`).
Branch: `feature/issue-54-responsividade-mobile` — mudancas ainda **nao commitadas**.

**Rodada 2 — reverificacao apos a rodada de correcao 1.** A rodada 1 fechou com 45 VERIFICADO, 2 VALIDACAO MANUAL e **4 NAO ATENDIDO** (criterios 7, 14, 28 e 42, por 3 defeitos). Esta rodada remediu os 4 criterios com os mesmos metodos e as mesmas larguras, verificou a nao-regressao das tres correcoes (todas mexeram em algo global) e reconfirmou 42 e 44 coluna a coluna. **Os 4 criterios passaram; nenhum efeito colateral foi encontrado.**

Metodo: navegador real (Chrome headless via CDP, autenticado na aplicacao), bundle servido agora — `main-PO3IU6M4.js` / `styles-RRIGFJIJ.css` (hashes diferentes dos da rodada 1, confirmando que o codigo corrigido e o que esta no ar). Larguras: 1440, 1280, 900, 844x390, 480, 390x844, 390x400 e 320. Os valores citados sao `getComputedStyle`/`getBoundingClientRect`/amostragem de pixel, nao leitura de `.scss`.

O working tree continua com **exatamente** os arquivos de `implementation-notes.md` (26 modificados + `core/confirm-dialog/` novo + a propria pasta `specs/54-.../`); a rodada de correcao nao acrescentou nem removeu arquivo nenhum. Nao ha mudanca alheia a feature no diff.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Meta viewport com `viewport-fit=cover`, sem `user-scalable` | VERIFICADO | `frontend/src/index.html:7`; `grep user-scalable\|maximum-scale` sem saida; servido: `curl http://localhost/` traz a meta exata |
| 2 | Todo `100vh` com fallback `100dvh` no mesmo bloco | VERIFICADO | 4 pares consecutivos: `app.scss:3-4`, `login.scss:7-8`, `main-layout.scss:3-4` e `19-20`. Nenhum `100vh` solto |
| 3 | Shell ocupa a altura visivel em `/login` e `/dashboard` | VALIDACAO MANUAL | *(ressalva PA4: barra de URL dinamica do Safari nao reproduzida)*. Medido de novo: `/login` a 390x844 -> `.auth-shell` `min-height: 844px`, altura 844, `scrollHeight` 844, sobra 0; a 320x760 -> 760/760. Ver roteiro item 1 |
| 4 | Conjunto unico de breakpoints documentado e respeitado | VERIFICADO | Bloco de comentario em `styles.scss:22-35`. **No CSS realmente servido**: `styles-RRIGFJIJ.css` so tem `@media(max-width:1080px)`, `(max-width:680px)`, `(max-width:480px)` e `(hover:hover)`; os 6 `chunk-*.js` de componente so tem `1080px`, `680px` e `(hover:hover)` |
| 5 | Nenhum `!important` nos `.scss` | VERIFICADO | `grep -rn "!important" frontend/src --include=*.scss` sem saida; nos 6 chunks servidos, 0 ocorrencias (a unica do `main.js` e codigo do runtime do Angular, `setStyle(..., Important)`) |
| 6 | `env(safe-area-inset-*)` no topbar, na gaveta e nos toasts | VALIDACAO MANUAL | *(ressalva PA4: safe area real nao reproduzida — `Emulation.setSafeAreaInsets` nao existe neste Chrome)*. `env()` confirmado em `main-layout.scss:232-234` (topbar), `288-289` (gaveta), `322-324` (workspace), `toast-host.scss:113-115`, `login.scss:9-10`. Ver roteiro item 2 |
| 7 | Sem rolagem horizontal da pagina a 390x844 e 844x390 | **VERIFICADO (corrigido nesta rodada)** | **844x390: `/transactions` 844/844 e `/users` 844/844**, `window.scrollTo(9999,0)` -> `scrollX 0` nas 6 telas. 390x844 e 320x760 idem. Antes: 951/844 (107px) e 912/844 (68px). Ver "Defeitos corrigidos" |
| 8 | Nenhum texto cortado ou sobreposto no mobile | VERIFICADO | Varredura de todo elemento com texto em 6 telas x 3 larguras: nenhum `scrollWidth > clientWidth` sem `text-overflow: ellipsis`. Nome de 60 caracteres e descricao de 62 quebram em 2 linhas dentro do cartao; `.current-user` trunca com reticencias e tem `title` completo |
| 9 | 320px continua usavel nas 6 telas | VERIFICADO | 320x760: `scrollWidth == clientWidth == 320` nas 6 telas; acao primaria visivel em todas ("Entrar" 222x48, "Salvar" 250x44); gaveta resolve `--drawer-width` para **272px** deixando **48px** de scrim tocavel |
| 10 | `.workspace` sem `margin-left` no mobile, >= 90% da viewport | VERIFICADO | 390x844: `margin-left: 0px`, largura 390px = **100%** da viewport, `padding-top: 74px` |
| 11 | Cabecalho com botao "Menu" (44px, `aria-*`) abrindo gaveta + scrim | VERIFICADO (re-medido) | `.mobile-topbar` `position: fixed`, altura 56px; `.menu-button` **44x44**, `aria-label="Abrir menu"`, `aria-expanded` `false`->`true`, `aria-controls="app-drawer"`; ao abrir: `.sidebar.open` `position: fixed` `z-index 80` largura 280, scrim 390x844 `z-index 70` em `oklch(0.21 0.02 260 / 0.58)` |
| 12 | Gaveta fecha por scrim, item e `Esc`, sem depender de `hover` | VERIFICADO (re-medido) | Os tres caminhos no navegador **depois** da mudanca de `visibility`: scrim -> fecha; `Esc` -> fecha; item "Lançamentos" -> navega para `/transactions` **e** fecha. Nenhuma regra de `:hover` fora de `@media (hover: hover)` |
| 13 | Fundo nao rola com a gaveta aberta; lista rolavel em landscape | VERIFICADO (re-medido) | Gaveta aberta: `body.drawer-open` `overflow: hidden`, roda de rolagem nao move (`scrollY` 0); apos fechar volta a rolar (`scrollY` 600, `overflow: visible`). Landscape 844x390 com trilho expandido e grupo aberto: `overflow-y: auto`, `scrollHeight 521 > clientHeight 390`, "Sair" alcancado apos rolar 131px |
| 14 | Foco no primeiro item, `Tab` retido, retorno ao botao "Menu" | **VERIFICADO (corrigido nesta rodada)** | **Ao abrir, `document.activeElement` = `BUTTON.active` "Resumo", dentro de `#app-drawer`** — com clique real e com toque real, estavel em 50ms/300ms/1s/2s (antes ficava no `.menu-button` em todas as amostras). `Tab` 25x: **0 escapes**; `Shift+Tab` continua dentro; `Esc` e scrim devolvem o foco ao `.menu-button` |
| 15 | Nenhum item com `hover` preso apos o toque | VERIFICADO | *(ressalva PA4)*. Em emulacao de toque `matchMedia('(hover: hover)')` = **false** e `(pointer: coarse)` = true; apos tocar em "Lançamentos" e navegar, so o item ativo tem fundo. Todos os `:hover` de producao dentro de `@media (hover: hover)` |
| 16 | Visibilidade por permissao preservada na gaveta | VERIFICADO | `git diff` de `main-layout.spec.ts` nesta rodada tem **zero linhas removidas** — os 16 testes existentes, incluindo os de grupo "Cadastros"/"Configuracoes" por `VIEW`, seguem intactos e verdes nos 215 testes de `quality-report.md` |
| 17 | `font-size` >= 16px em campos ate 480px (inclui edicao inline) | VERIFICADO (re-medido) | 390px: **16px** em todo `input`/`select` do formulario **e** da linha em edicao nas 3 telas. 900px: 14px no formulario e 13.5px na edicao inline — tipografia de desktop intacta |
| 18 | Campo focado visivel e botao primario alcancavel com teclado aberto | VERIFICADO | *(ressalva PA4)*. A 390x400, nos 5 formularios e nas 3 edicoes inline: campo focado dentro da area visivel e botao primario/"Salvar" alcancavel por rolagem. `scroll-padding-block` 68px/96px aplicado |
| 19 | Grids em coluna unica, campos com >= 44px de altura | VERIFICADO (re-medido) | 390x844: `.content-grid` e `.profiles-grid` com **um unico valor** (`358px`); campos 44-48px nas 4 telas |
| 20 | `/login` cabe na altura visivel, com rodape e sem cobrir "Entrar" | VERIFICADO (re-medido) | 390x844: `scrollHeight 844 == innerHeight 844`; rodape `FinanceOS · v1.0.2-dev` visivel em y 604-622; botao "Entrar" 292x48 em y 513-561; com credencial errada o toast ocupa y 66-171 — **sem sobreposicao** |
| 21 | Registros como cards empilhados nas tres tabelas | VERIFICADO (re-medido) | 390x844 nas 3 telas: `table` `display: block` `min-width: 0px`, `thead` `display: none`, `td::before` com o texto do `<th>`, `.table-wrap` `overflow-x: visible` e `scrollWidth == clientWidth == 320` em todos os containers |
| 22 | Matriz de Perfis como bloco por tela, payload intacto | VERIFICADO | 390x844: `.permissions-table` `display: block` `min-width: 0px`, sem rolagem horizontal; **20 checkboxes** com `[(ngModel)]`/`name` intactos; `profiles.spec.ts` **nao aparece no `git status`** (inalterado) e esta verde |
| 23 | Edicao inline completa no formato card | VERIFICADO (re-medido) | 390x844 nas 3 telas: "Editar" abre o cartao com os demais "Editar" `disabled` (2/2, 45/45, 3/3), campos empilhados a 16px/44px, "Salvar" (70x44) e "Sair" (55x44) dentro da tela, `scrollWidth 390 == clientWidth 390` |
| 24 | 4 cards do Resumo em 1-2 colunas, valor completo | VERIFICADO | 390x844: `grid-template-columns: 358px`, ordem Receitas / Despesas / Pendentes / Saldo, valores completos, nenhum elemento truncado |
| 25 | Rotulos dos 12 meses sem colisao a 390px | VERIFICADO | 12 rotulos de 1 letra, **0 colisoes** entre caixas consecutivas; SVG 320px dentro do painel de 358px |
| 26 | Informativo do grafico por toque, contido no painel | VERIFICADO | `onMonthPointerDown` nao foi tocado pelo diff. `pointerdown` `touch` em Janeiro e Dezembro a 390px: `.chart-tooltip` abre completo e fica dentro do painel (x 35-355 vs painel 16-374) |
| 27 | Controles de periodo operaveis, uma unica `GET /summary` | VERIFICADO | 390px: Ano (358x46, 16px) e Mes (358x44, 16px) operaveis. Network: trocar Ano -> **1** `GET /api/dashboard/summary`; trocar Mes -> **1** |
| 28 | Alvos de toque >= 44x44 ate 480px | **VERIFICADO (corrigido nesta rodada)** | Auditoria completa de `button/a/input/select/textarea/[role=button]/label.perm-switch` a **390px, 320px e 480px** nas 6 telas: **lista de elementos abaixo de 44px vazia** em todas (unico resto: os `<input type=checkbox>` da matriz de Perfis, 38x22, cujo alvo real e o `label.perm-switch` de 44x44 que os envolve). "Salvar"/"Cancelar" de Lancamentos, Categorias e Usuarios agora medem **44px** (`min-height: 44px` computado) contra os 42px da rodada 1; idem em edicao inline nas 3 telas |
| 29 | >= 8px entre alvos adjacentes | VERIFICADO (re-medido) | 390px e 320px: `gap` computado de **10px** em `.row-actions`, `.modal-actions`, `.form-actions` e `.two-cols` (`--touch-gap`) |
| 30 | Contraste >= 4.5:1 / 3:1 nos pares alterados, com tabela de evidencia | VERIFICADO (**com decisao pendente do usuario**) | 27 pares re-medidos na rodada 1 a partir dos tokens servidos (canvas -> sRGB -> luminancia WCAG 2.x): `--text`/`--surface` 16.94, `--text-muted`/`--surface` 6.53, `--text-faint`/`--bg-app` 4.90, `--sidebar-text-dim`/`--sidebar-bg` 4.87, pills 6.02-7.58, `--expense`/`--surface` 4.67. Nenhum par **alterado** por esta feature fica abaixo do minimo. A rodada de correcao **nao tocou em token nenhum** (`--border-input` segue `oklch(88% .008 80)` no CSS servido). **Decisao pendente:** `--border-input` sobre `--surface` mede **1.44:1** contra os 3:1 pedidos para borda de controle de formulario — par **pre-existente, nao alterado** por esta issue. Ver roteiro item 6 |
| 31 | Nenhuma informacao so por cor (pills no cartao) | VERIFICADO | No cartao a 390px: "Pago"/"Pendente", "Ativo"; coluna Valor com `- R$ 540,25` / `+ R$ 9.800,00` — prefixo preservado alem da cor |
| 32 | Pilha de toasts no mobile nao cobre acao primaria nem topbar | VERIFICADO | `/transactions` a 390x844 com 400 de Bean Validation: `.toast-stack` em `top: 66px`, retangulo y 66-190; topbar y 0-56 e "Salvar" y 772-814 — **nao cobre**; "Fechar" 44x44 |
| 33 | `:focus-visible` global para `button` | VERIFICADO | 1280px, tabulando com `Tab` real: `outline: 2px solid oklch(0.56 0.16 262)` / `outline-offset: 1px` identico em item do menu, `.nav-parent`, `.logout-button`, `.primary-button`, `.ghost-button` e `.danger-button` |
| 34 | Estado desabilitado consistente nas tres variantes | VERIFICADO (re-medido) | 1440px e 1280px, com uma linha em edicao: os demais "Editar" (`.ghost-button:disabled`) com `opacity: 0.55` e `cursor: not-allowed` nas 3 telas (2/2, 45/45, 3/3). `cursor: wait` so no `.primary-button:disabled` |
| 35 | `hover` distinguivel de `active` no menu | VERIFICADO | 1280px com `:hover` forcado via CDP: ativo = `oklch(0.32 0.05 262)` + texto branco + `font-weight 700` + indicador `::before` de 3px; hover = `oklch(0.28 0.03 262)` + `oklch(0.85 0.02 260)` + `font-weight 400` + sem indicador |
| 36 | Coluna de acoes rotulada "Ações" com largura de token unico | VERIFICADO (**ressalva da rodada 1 removida**) | Os tres `<th>` tem nome acessivel "Ações" no DOM servido (`["Data","Descrição","Categoria","Status","Valor","Ações"]`, `["Nome","Tipo","Situação","Ações"]`, `["Nome","E-mail","Perfil","Status","Ações"]`); `col.col-actions` computa **200px** identicos nas 3 telas a 1440 e a 1280. O efeito colateral que o `.sr-only` causava (defeito A) **deixou de existir**: o span agora e recortado pelo `.table-wrap` |
| 37 | Tokens de entrelinha aplicados globalmente | VERIFICADO (re-medido) | 1280px e 1440px: `body` 21px/14px = **1.500**, `tbody td` 20.25px/13.5px = **1.500**; `.page-title` 1.200, `.panel-heading h3` 1.200, titulo do Resumo 1.100 |
| 38 | Indicador de carregamento; `.empty-state` so apos a resposta | VERIFICADO | Com `Network.emulateNetworkConditions` (2s / 50 kbps): `.loading-state` apareceu nas 5 telas de lista e **em nenhum momento** `.empty-state` conviveu com o indicador |
| 39 | Modal de confirmacao acessivel (papel, foco, `Esc`, retencao) | VERIFICADO (re-medido) | Nas 3 telas, a 1280px **e** a 390x844: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="confirm-dialog-message-1"`; `.modal-backdrop` `position: fixed` cobrindo **toda** a viewport (1280x800 / 390x844) com `z-index 200`, **fora** do `.table-wrap`; foco inicial em "Continuar editando"; `Esc` fecha mantendo a edicao |
| 40 | Rotulos "Continuar editando" / "Sair sem salvar" | VERIFICADO | Botoes medidos no navegador: "Continuar editando" (156x44) e "Sair sem salvar" (128x44), ambos `type="button"`; `confirm-dialog.spec.ts:101-102` verdes |
| 41 | Affordance de rolagem lateral da tabela entre 681 e 1080px | VERIFICADO (re-medido apos o defeito A) | `/transactions` a 900px (`.table-wrap` 1000/698): amostragem de pixel da captura real — `scrollLeft 0`: borda esquerda limpa (252,252,252), direita escurecendo (222 -> 105); `scrollLeft max`: esquerda escura (106 -> 155), **direita limpa** (229 -> 252). Identico a rodada 1: `position: relative` **nao** alterou o gradiente (e `background-image` do proprio `.table-wrap`, e `z-index` computa `auto`, sem novo contexto de empilhamento) |
| 42 | Desktop preservado a 1440px e 1280px | **VERIFICADO (corrigido nesta rodada)** | **Sem rolagem horizontal da pagina**: `/dashboard`, `/transactions`, `/categories`, `/users` e `/profiles` com `scrollWidth == clientWidth` e `scrollX 0` a **1280x800**, 1440x900 e 900x700 (antes: 1311/1280, 31px de arrasto). Tudo o que o criterio enumera segue preservado e re-medido: trilho 76px -> 236px com `.workspace` `margin-left: 76px` nos dois estados; `.content-grid` `340px 924px` (1440) / `340px 764px` (1280); `.profiles-grid` `784px 320px` / `738px 320px`; Resumo em 4 colunas; `table` `display: table` `table-layout: fixed`; `th` `0px 12px 12px` e `td` `14px 12px`. A troca de `two-cols` por `two-cols form-actions` **nao muda nada no desktop**: `.form-actions` so tem regra global dentro de `@media(max-width:480px)` no CSS servido, e os botoes medem 42px/142px e `gap 10px` a 1440 e 1280 — exatamente como `/profiles`, que ja usava a classe antes desta issue |
| 43 | Comportamento do menu no desktop intacto | VERIFICADO | 1280px: `.collapse-toggle` ausente do DOM; `grep sidebar:hover\|sidebar:focus-within` em `main-layout.scss` sem saida; trilho 76 -> 236 ao expandir com `.expanded`; abrir "Configuracoes" fecha "Cadastros"; acionar "Perfis" navega, recolhe e move o foco para `SECTION.workspace` |
| 44 | Edicao inline intacta no desktop (larguras de coluna) | VERIFICADO (re-medido entrando **e** saindo) | Medicao coluna a coluna **antes / em edicao / depois de sair**, a 1440px e a 1280px, nas 3 telas: `/transactions` `[140,160,170,200,130,200]` nos tres momentos; `/categories` `[388,140,150,200]` (1440) e `[270,140,150,200]` (1280) nos tres; `/users` `[230,230,160,140,200]` nos tres. Largura da tabela inalterada (1000 / 878 / 760 / 960); "Sair" sem alteracao sai **sem modal e sem requisicao**. A invariante da #31 — que nenhum teste cobre — continua de pe com `.table-wrap` `position: relative` |
| 45 | "Cancelar" continua `type="button"` e sem HTTP | VERIFICADO | `httpMock.expectNone(() => true)` presente e verde em `transactions.spec.ts`, `categories.spec.ts`, `users.spec.ts` e `profiles.spec.ts` (nos dois estagios); no navegador, "Sair" sem alteracao nao dispara requisicao |
| 46 | Toasts e legendas `field-error` preservados | VERIFICADO | 400 real de Bean Validation em `/transactions`: toast de **Alerta** "Informe os campos obrigatórios: Descrição, Categoria." convivendo com as 3 legendas `field-error` por campo |
| 47 | Zero alteracao no backend e nenhuma migration | VERIFICADO | `git status --porcelain` sem nenhuma linha sob `backend/` e sem nenhum `.sql` **tambem depois da rodada de correcao**; 51 testes de backend verdes sem alteracao de codigo |
| 48 | Nenhuma dependencia npm nova | VERIFICADO | `git diff --stat frontend/package.json frontend/package-lock.json` vazio |
| 49 | Design system preservado, medidas novas como custom property | VERIFICADO | `grep` de cor literal em `frontend/src/app --include=*.scss` sem saida; `grep` de URL externa em `frontend/src` sem saida; toda medida nova (`--touch-target`, `--touch-gap`, `--col-actions`, `--mobile-topbar-h`, `--drawer-width`, `--lh-*`, `--fs-input-mobile`, `--scrim`, `--scroll-shadow-*`, `--bp-*`) esta em `:root` no CSS servido |
| 50 | Portugues acentuado; so os textos dos criterios 11, 36 e 40 sao novos | VERIFICADO | A rodada de correcao **nao introduziu texto nenhum** (so a classe `form-actions`, que nao e texto). Os unicos textos novos seguem sendo `aria-label="Abrir menu"`, `<span class="sr-only">Ações</span>` x3 e "Continuar editando"/"Sair sem salvar". Acentuacao integra no DOM servido ("Lançamentos", "Situação", "Ações", "Usuários", "Configurações") |
| 51 | `npm test`, `npm run build` e `./mvnw test` verdes | VERIFICADO | `quality-report.md` da revalidacao: **215 testes de frontend** em 22 arquivos (mesmo total — o teste da gaveta foi reforcado, nao acrescentado), **51 de backend**, build sem **nenhum** warning de `anyComponentStyle` |

**Resumo desta rodada: 49 VERIFICADO, 2 VALIDACAO MANUAL, 0 NAO ATENDIDO.** (Rodada 1: 45 / 2 / 4.)

## Defeitos corrigidos — verificacao da correcao

### Defeito A (criterios 7 e 42) — rolagem horizontal causada pelo rotulo "Ações"

Correcao aplicada: `position: relative` no `.table-wrap` (`frontend/src/styles.scss:476`). Confirmado no CSS servido: `.table-wrap{position:relative;overflow-x:auto;...}`.

Medicao, nas mesmas telas e larguras da rodada 1 (`document.documentElement.scrollWidth` vs `clientWidth`, e arrasto real com `window.scrollTo(9999,0)`):

| Tela / largura | rodada 1 | **rodada 2** |
|---|---|---|
| `/transactions` 844x390 | 951 vs 844 — arrasta 107px | **844 vs 844 — arrasta 0** |
| `/users` 844x390 | 912 vs 844 — arrasta 68px | **844 vs 844 — arrasta 0** |
| `/transactions` **1280x800** | 1311 vs 1280 — arrasta 31px | **1280 vs 1280 — arrasta 0** |
| `/transactions` 900x700 | 951 vs 900 — arrasta 51px | **900 vs 900 — arrasta 0** |
| `/users` 900x700 | 911 vs 900 — arrasta 11px | **900 vs 900 — arrasta 0** |

Tambem sem rolagem a 1440x900, 390x844 e 320x760, nas 6 telas (`/login` incluso, medido deslogado).

### Defeito B (criterio 14) — foco ao abrir a gaveta

Correcao aplicada: `afterNextRender` em `main-layout.ts:56-61` mais `transition: transform 0.2s ease, visibility 0s linear 0s` no `.open` (fechado: `visibility 0s linear 0.2s`), em `main-layout.scss:293/299`.

Medido a 390x844 lendo `document.activeElement`:

| Momento | rodada 1 | **rodada 2** |
|---|---|---|
| clique real, 50ms / 300ms / 1s / 2s | `BUTTON.menu-button` em todas | **`BUTTON.active` "Resumo", dentro de `#app-drawer`, em todas** |
| toque real (`Input.dispatchTouchEvent`) | `BUTTON.menu-button` | **`BUTTON.active` "Resumo", dentro de `#app-drawer`** |

`visibility` computada da gaveta no instante do foco: `visible`. As outras duas clausulas continuam de pe: 25 tabulacoes com **0 escapes**, `Shift+Tab` retido, e o foco volta ao `.menu-button` ao fechar por `Esc` e por scrim.

### Defeito C (criterio 28) — "Salvar" e "Cancelar" com 42px

Correcao aplicada: `class="two-cols form-actions"` em `transactions.html`, `categories.html` e `users.html` (o padrao que `/profiles` ja usava). Confirmado no DOM servido: `className` = `"two-cols form-actions"` nas tres telas.

| Tela | Botao | rodada 1 | **rodada 2 (390px / 320px / 480px)** |
|---|---|---|---|
| `/transactions`, `/categories`, `/users` | "Salvar" | 42px | **44px** (`min-height: 44px`) |
| `/transactions`, `/categories`, `/users` | "Cancelar" | 42px | **44px** |
| `/profiles` | "Salvar" | 44px | 44px (inalterado) |

A auditoria completa de alvos < 44px nas 6 telas, nas tres larguras, agora retorna **lista vazia** (exceto os `input[type=checkbox]` de Perfis, 38x22, cujo alvo real e o `label.perm-switch` de 44x44 — mesma situacao aceita na rodada 1).

## Nao-regressao das correcoes

Cada correcao mexeu em algo global. Verificado no navegador, nesta rodada:

**1. `position: relative` no `.table-wrap` (muda o containing block dos `position: absolute` internos).**

- **Inventario dos absolutos dentro do `.table-wrap`**, nas 4 telas com tabela, a 1280px e a 390x844, em repouso e em edicao inline: **so existem dois**, ambos visualmente escondidos de 1x1 px — o `span.sr-only` "Ações" e os 20 `span.perm-switch-label` de Perfis (`position: absolute; width: 1px; height: 1px; clip-path: inset(50%)`, `profiles.scss:77-84`). Nenhum modal, dropdown, tooltip ou popover abre de dentro do `.table-wrap`.
- **Modal de confirmacao**: `.modal-backdrop` e `position: fixed`, `z-index 200`, **nao e descendente do `.table-wrap`** (`dentroDoTableWrap: false` nas 3 telas) e cobre a viewport inteira (1280x800 e 390x844); `elementFromPoint` no centro da tela devolve o botao do dialogo. Foco inicial, `Esc` e retencao de `Tab` continuam como na rodada 1.
- **Sombra de rolagem (criterio 41)**: amostragem de pixel da captura real a 900px reproduz exatamente os mesmos valores da rodada 1. `z-index` do `.table-wrap` computa `auto` — `position: relative` sem `z-index` nao cria contexto de empilhamento.
- **Sem overflow interno novo**: onde a tabela ja cabia no painel, `scrollWidth - clientWidth` continua **0** (`/categories` a 1440: 878/878; `/profiles` a 1440/1280/900: 898/898, 738/738, 698/698). O `.sr-only` nao acrescentou nem 1px de rolagem interna.
- **Edicao inline nas tres telas**: larguras de coluna identicas antes / durante / depois (ver criterio 44).

**2. Mudanca da transicao de `visibility` da gaveta.** Amostrada quadro a quadro a 390x844:

- **Abrindo**: `visibility` vira `visible` no instante 0 e o `transform` **desliza** de `-280px` para `0` ao longo de ~200ms (`-218` em 30ms, `-119` em 80ms, `-35` em 150ms, `0` no fim). A animacao esta preservada.
- **Fechando**: o `transform` desliza de volta (`-20` -> `-198` -> `-259` -> `-279` -> `-280`) com a gaveta **visivel durante todo o deslizamento**, e `visibility` so vira `hidden` **depois** dos 200ms. Nao ha gaveta invisivel-mas-clicavel: com a gaveta fechada, `elementFromPoint` na faixa onde ela estaria devolve o conteudo da pagina (`DIV.metric-card`, `SELECT`), nunca um descendente de `#app-drawer`.
- Criterios **11, 12, 13, 15 e 16** re-medidos e todos de pe (linhas da tabela acima). No desktop (1280px) a sidebar segue `visibility: visible`, `position: fixed`, 76px e `transition: width 0.18s` — a regra nova so existe dentro do `@media (max-width: 680px)`.

**3. `form-actions` nos tres templates.**

- **Mobile**: 44px a 390, 320 e 480px (defeito C acima).
- **Desktop 1440px e 1280px**: `.form-actions` das 3 telas computa `grid-template-columns: 142px 142px`, `gap: 10px` e botoes de **42px** — **identico a `/profiles`**, que ja tinha a classe antes desta issue, e identico ao que `.two-cols` sozinho produzia. No CSS servido as duas unicas regras globais de `.form-actions` (`gap` e `min-height`) estao **dentro do `@media(max-width:480px)`**. Zero efeito no desktop (criterio 42).

## Achado fora dos criterios

- **A sombra de rolagem lateral e bastante marcada no desktop.** A 1440px em `/transactions` a tabela ainda excede o painel (1000px de `min-width` em 878px uteis), entao a affordance do criterio 41 aparece tambem ali e a faixa de 26px a 75% de opacidade cobre parcialmente os botoes "Editar"/"Cancelar" da ultima coluna. Nao reprova nada — e mudanca autorizada pelo criterio 41 —, mas e a mudanca visual de desktop mais visivel da feature (roteiro item 5). Inalterado em relacao a rodada 1.
- **Mudancas globais de desktop vindas dos criterios 8 e 30, nao dos 33-41.** `--text-faint` 55%->53%, `--sidebar-text-dim` 58%->62%, `::placeholder` passando a `--text-muted`, `overflow-wrap: anywhere` no `body`, `min-width: 0` em varios containers e `flex-wrap: wrap` no `.panel-heading`. O criterio 42 diz que as unicas mudancas visuais de desktop sao as dos criterios 33 a 41; estas vem dos criterios 30 (que **exige** corrigir contraste no token) e 8. Medi de novo que nenhuma delas altera largura de coluna, `content-grid`, `profiles-grid` ou densidade de `th`/`td` a 1440 e a 1280 — por isso o criterio 42 nao e reprovado por elas. Fica registrado porque a spec pede que toda mudanca visual de desktop seja atribuivel.
- **Nada alheio a feature no working tree.** O `git status` desta rodada lista os mesmos 26 arquivos modificados + `frontend/src/app/core/confirm-dialog/` + `specs/54-responsividade-mobile/` de `implementation-notes.md`. Nenhum arquivo de terceiros a separar no commit seletivo da etapa `open-pr`.

## Roteiro de validacao manual

Ambiente: `http://localhost`, DevTools > Device toolbar. Faca na ordem. **Os itens 3, 4, 5, 6 e 14 do roteiro da rodada anterior sairam** — eram os defeitos A, B e C, agora medidos como corrigidos, e a nao-regressao do desktop, re-medida coluna a coluna.

1. **Altura da tela com a barra de navegador dinamica (criterio 3).** No celular de verdade (ou no DevTools com "Dimensions: iPhone 12 Pro" e a simulacao de barra dinamica ativa), abra `http://localhost/login` e depois `/dashboard`. Role ate o fim em cada uma. Esperado: o conteudo termina exatamente no fim da area visivel, sem faixa vazia abaixo e sem o rodape `FinanceOS · v1.0.2-dev` ficar cortado ao mostrar/esconder a barra de URL. *(Aqui so consegui medir que a 390x844 o `/login` ocupa exatamente 844px sem sobra; a barra dinamica do Safari nao e reproduzivel.)*

2. **Safe area / notch (criterio 6).** Ainda em 390x844 com notch simulado (ou no iPhone), em `/dashboard`: toque no botao "Menu" e observe o cabecalho, o primeiro item da gaveta e, disparando um toast, o botao "Fechar" dele. Esperado: nenhum dos tres fica sob a Dynamic Island nem sob a barra inferior de gestos. *(O Chrome desta maquina nao tem emulacao de safe area; conferi que `env(safe-area-inset-*)` esta aplicado no cabecalho, na gaveta, na workspace, nos toasts e no login.)*

3. **Gaveta: animacao e navegacao no mobile (criterios 11, 12, 13, 14).** A 390x844 em `/dashboard`: toque em "Menu". Esperado: a gaveta **desliza** da esquerda (nao aparece de estalo), cobre o conteudo com o fundo escurecido, e o primeiro item ("Resumo") ja fica com o anel de foco. Tente rolar o conteudo atras (nao deve rolar). Feche tocando no scrim: a gaveta deve **deslizar de volta** e sumir por completo — toque na faixa onde ela estava e confirme que voce atinge o conteudo da pagina, nunca um item de menu invisivel. Reabra e feche com `Esc`; reabra e toque em "Lançamentos" (deve navegar **e** fechar). Depois confirme que a pagina voltou a rolar normalmente. *(Esta e a parte que mais mudou na rodada de correcao — a transicao de `visibility` da gaveta foi alterada; medi que desliza e some de fato, mas o olho e o juiz final da suavidade.)*

4. **Cards e edicao inline no mobile (criterios 21, 23, 28).** A 390x844 em `/transactions`, `/categories` e `/users`: cada registro aparece como cartao com rotulo por campo. Confirme que "Salvar" e "Cancelar" do formulario (painel de cima) tem a **mesma altura confortavel** do "Salvar" de `/profiles` — era a diferenca de 42 vs 44px da rodada anterior. Toque em "Editar" num registro: os demais "Editar" ficam atenuados; altere um campo e toque em "Sair" — deve abrir o modal "Deseja sair sem salvar?" com **"Continuar editando"** e **"Sair sem salvar"**.

5. **Desktop — sombra de rolagem da tabela (criterio 41 e achado fora dos criterios).** A **900px** em `/transactions`: deve haver um gradiente na borda direita do painel da tabela que some ao rolar ate o fim. Depois olhe a **mesma tela a 1440px**: a tabela ainda excede o painel, entao o gradiente aparece tambem ali e cobre parte dos botoes "Editar"/"Cancelar". **Diga se esse peso visual esta bom** ou se prefere a sombra mais fraca.

6. **Decisao pendente — borda dos campos de formulario (criterio 30).** A borda `--border-input` sobre `--surface` mede **1.44:1**, abaixo dos 3:1 que o criterio pede para borda de controle de formulario. **Nao e defeito desta feature**: e par pre-existente e nao foi alterado aqui (nem pela rodada de correcao). Escolha uma saida:
    - **(a) Deixar como esta.** O criterio 30 fala em "pares alterados", e a borda nao foi alterada. Nada muda no desktop; a divida de acessibilidade vira uma issue propria.
    - **(b) Corrigir agora.** Uma linha em `frontend/src/styles.scss` (`--border-input` por volta de `oklch(72% 0.008 80)`) fecha os 3:1, mas **escurece visivelmente a borda de todo campo do sistema no desktop** — o que tensiona o criterio 42 ("as unicas mudancas visuais de desktop sao as dos criterios 33 a 41") e a secao "Fora de escopo" da spec ("a paleta `oklch` ... permanece"). Exige nova passagem por `quality-check` / `build` / `docker-restart`.

7. **Perfis no mobile (criterio 22).** A 390x844 em `/profiles`: um bloco por tela, com os quatro interruptores rotulados VER / INCLUIR / ALTERAR / EXCLUIR, sem rolagem lateral. Marque um e salve para confirmar que o perfil grava normalmente.

8. **Resumo no mobile (criterios 24, 25, 26).** A 390x844 em `/dashboard`: 4 cards empilhados na ordem Receitas, Despesas, Pendentes, Saldo com valores completos; no grafico "Evolução anual" os 12 meses aparecem como **uma letra cada** (J F M A M J J A S O N D). Toque no primeiro e no ultimo mes: o informativo abre com o nome completo do mes e nao passa das bordas do painel. **Diga se o rotulo de uma letra e aceitavel** — as iniciais repetem (Janeiro/Junho/Julho, Marco/Maio, Abril/Agosto) e a desambiguacao so vem do toque; a alternativa (rotacionar os rotulos de 3 letras ou exibir mes sim/mes nao) esta isolada em `monthAxisLabel()`.

9. **Desktop — estados novos (criterios 33, 34, 35).** A 1440px: navegue com `Tab` e confirme o mesmo anel azul em todos os botoes; em `/categories`, entre em edicao numa linha e veja os demais "Editar" atenuados; em `/dashboard`, passe o ponteiro sobre "Lançamentos" e confirme que da para dizer qual dos dois itens e a tela atual (o ativo tem a barrinha branca de 3px e negrito).

10. **Desktop — olhada final de nao regressao (criterios 42 e 44).** A 1440px e a 1280px, passe pelas 6 telas: trilho de 76px que expande para 236px por cima do conteudo, formularios a esquerda com 340px, 4 cards do Resumo em 4 colunas, tabelas como tabelas, **e nenhuma barra de rolagem horizontal na janela** (era o defeito A, a 1280px em `/transactions`). Em `/transactions`, `/categories` e `/users`, entre e saia da edicao inline e confirme que nenhuma coluna muda de largura (medi coluna a coluna nos tres momentos e nenhuma muda; vale o seu olho).

## Dados de teste criados

**Nenhum dado novo nesta rodada.** Foi reutilizado o usuario descartavel da rodada 1, que continua no banco local (conferido por `psql`, somente leitura):

- Usuario descartavel `verify-temp-54@financeos.local` (id `d3660922-997c-4ba5-b8a2-dededb8ef67d`), perfil **Administrador**, nome longo de 60 caracteres.
- Tres lancamentos **pertencentes a esse usuario** (nao aos seus dados). Nesta rodada as edicoes inline exercitadas foram sempre **abandonadas** (`Sair` / `Esc`), sem `PUT`: o nome do usuario e a contagem de lancamentos (3) seguem como estavam.

Nenhum dado seu foi criado, alterado ou apagado. Para limpar tudo de uma vez (os lancamentos caem por `ON DELETE CASCADE`):

```
docker compose exec -T postgres psql -U financeos -d financeos -c "delete from app_users where email = 'verify-temp-54@financeos.local';"
```

## Conclusao

**49 dos 51 criterios foram verificados automaticamente; 2 dependem de validacao manual sua (3 e 6, por dependerem de comportamento nativo do Safari que a emulacao nao reproduz — ressalva PA4 da spec); nenhum criterio esta NAO ATENDIDO.**

Os 4 criterios que reprovaram na rodada 1 foram re-medidos na tela, com os mesmos metodos e as mesmas larguras, e **os tres defeitos estao fechados**:

- **Criterio 7** — 844x390 sem rolagem horizontal nas 6 telas (era 107px em `/transactions` e 68px em `/users`).
- **Criterio 14** — o foco vai para "Resumo" ao abrir a gaveta, com clique e com toque, estavel ate 2s (antes ficava no botao "Menu").
- **Criterio 28** — "Salvar"/"Cancelar" dos tres formularios com 44px a 390, 320 e 480px (eram 42px); auditoria de alvos < 44px vazia nas 6 telas.
- **Criterio 42** — 1280px sem barra de rolagem horizontal (eram 31px de arrasto), com todas as medidas de desktop enumeradas pelo criterio re-conferidas.

**Nenhum efeito colateral foi encontrado** nas tres mudancas globais (containing block do `.table-wrap`, transicao de `visibility` da gaveta e `form-actions` nos templates) — ver a secao "Nao-regressao das correcoes".

A feature esta pronta para a sua validacao manual. Depois do seu OK (e da sua escolha no item 6 do roteiro, sobre `--border-input`), a spec pode ir para `stage: validated` e seguir para `/pipeline:open-pr`.

Validado pelo usuario em 2026-09-20.
Decisao do usuario sobre o criterio 30 (`--border-input`, 1.44:1): **deixar como esta** — par pre-existente, nao alterado por esta feature; a divida de acessibilidade fica para issue propria.
