# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reiniciada na etapa anterior — ver `docker-report.md`; containers `financeos-frontend`/`financeos-backend` recem recriados a partir do working tree).
Branch: `feature/issue-37-menu-cadastros` — mudancas ainda **nao commitadas**.

Verificacao do CSS efetivo: o bundle servido (`chunk-B_rNdM0w.js`, referenciado por `http://localhost/`) foi inspecionado e corresponde ao working tree — contem `toggleGroup`/`onNavigate`/`registers`, `.sidebar.expanded{width:236px}`, `.workspace{margin-left:76px}` (unica ocorrencia de `margin-left` no chunk), `.workspace:focus{outline:none}` e **nenhuma** regra `.sidebar:hover`/`.sidebar:focus-within`. O `styles-TER4PDDF.css` global nao tem regra alguma sobre `.sidebar`/`.workspace`/`.nav-*` (so variaveis de cor) — sem sobrescrita silenciosa.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Grupo "Cadastros" com subitem "Categorias"; item de primeiro nivel some | VERIFICADO | `main-layout.spec.ts` — "should render the FinanceOS shell..." (linhas 52-65: `Cadastros` presente, `Categorias` ausente do nivel superior), "shows the Cadastros group..." (73-79) e "renders the Categorias child only while the group is open..." (193-207); suite verde em `quality-report.md` |
| 2 | Subitem navega para `/categories`; tela abre como hoje (rota/guard/componente intactos) | VALIDACAO MANUAL | rota/guard intactos confirmados: `app.routes.ts:27-29` fora do diff (`permissionGuard('CATEGORIES','VIEW')` preservado) e `features/categories/` sem alteracao; `routerLink="/categories"` no subitem (`main-layout.html`). A abertura real da tela: ver roteiro item 5 |
| 3 | Sem `CATEGORIES/VIEW`, grupo "Cadastros" inteiro nao renderiza | VERIFICADO | `main-layout.spec.ts` — "hides the Cadastros group when the user cannot view categories" (81-87); `*ngIf="canSeeRegisters()"` no `.nav-group` inteiro (`main-layout.html`), `canSeeRegisters()` = `can('CATEGORIES','VIEW')` (`main-layout.ts:74-76`) |
| 4 | Nenhum arquivo de `backend/` alterado | VERIFICADO | `git diff --stat`: apenas 4 arquivos, todos em `frontend/src/app/layout/main-layout/` (html, scss, spec.ts, ts) |
| 5 | Pai "Cadastros" no padrao visual do trilho (SVG 20px, `nav-label`, `title`/`aria-label` so recolhido) | VERIFICADO | diff de `main-layout.html`: SVG `width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"`, `<span class="nav-label">Cadastros</span>` sempre no DOM, `[attr.title]`/`[attr.aria-label]` condicionados a `expanded()`; `main-layout.spec.ts` "renders an svg icon and an accessible label..." (137-158) cobre "Cadastros"; sem override de tamanho de svg no `.scss` do componente (so `flex-shrink:0`) nem no `styles.scss` global |
| 6 | Subitens so renderizam com grupo aberto + trilho expandido | VERIFICADO | `*ngIf="openGroup() === 'registers' && expanded()"` no `.nav-children`; `main-layout.spec.ts` (193-207): "Categorias" ausente por padrao, presente apos abrir o grupo, some no `mouseleave` |
| 7 | Pai "Cadastros" com classe `active` quando URL comeca com `/categories` | VALIDACAO MANUAL | binding `[class.active]="isRegistersActive()"` e `isRegistersActive()` = `router.url.startsWith('/categories')` (`main-layout.ts:70-72`) confirmados no diff; regra `.nav-list button.active` presente no chunk servido. Porem o app roda **sem zone.js** e o helper le `router.url` (nao-reativo) — a atualizacao do destaque em runtime precisa ser vista na tela (mesmo padrao ja usado por "Configuracoes" desde a #35): roteiro item 6 |
| 8 | Ordem: Resumo, Lancamentos, Cadastros, Configuracoes | VERIFICADO | `main-layout.spec.ts` (152-157): asserção da lista de `aria-label` exatamente nessa ordem; ordem confirmada no template |
| 9 | Clique no pai com trilho expandido alterna grupo, mantem 236px, sem navegar | VERIFICADO | `main-layout.spec.ts` — "toggles the group and keeps the sidebar expanded..." (209-232, inclui `router.url` inalterada); `.sidebar.expanded{width:236px}` confirmado no chunk servido |
| 10 | Acordeao: no maximo um grupo aberto por vez | VERIFICADO | `main-layout.spec.ts` — "closes the other group when a group is opened..." (234-253, nos dois sentidos, partindo do trilho recolhido); por construcao o estado e um unico signal `openGroup: 'registers' \| 'settings' \| null` (`main-layout.ts:23`) — dois grupos abertos e impossivel |
| 11 | Clique no pai com trilho recolhido expande e abre o grupo, sem navegar | VERIFICADO | `main-layout.spec.ts` — dois testes "expands the sidebar and opens the group when the collapsed ... parent is clicked, without navigating" (160-191), um por grupo |
| 12 | Clique em item que navega recolhe o trilho para 76px mesmo com o ponteiro sobre a sidebar | VERIFICADO | `main-layout.spec.ts` — "collapses the sidebar and moves focus to the workspace..." (255-283, apos `mouseenter`+`focusin`); a parte "mesmo com o ponteiro sobre": as regras `.sidebar:hover`/`.sidebar:focus-within` foram removidas do SCSS **e** estao ausentes do CSS efetivamente servido — a largura agora depende exclusivamente da classe `expanded` |
| 13 | Enter em item que navega recolhe o trilho e move o foco para fora do `<aside>` | VERIFICADO | mesmo teste (255-283) asserta `aside.contains(document.activeElement) === false` e foco dentro de `.workspace`; Enter num `<button>` nativo dispara o mesmo evento `click` testado; `<section class="workspace" #workspace tabindex="-1">` + `onNavigate()` focando o workspace (`main-layout.ts:64-68`). Reconfirmado no navegador pelo roteiro item 8 |
| 14 | Trilho permanece recolhido ate o ponteiro sair e reentrar (ou novo foco de teclado) | VALIDACAO MANUAL | estaticamente favoravel (unicos gatilhos de expansao sao `(mouseenter)` e `(focusin)` do `<aside>`; `:hover` CSS removido), mas o comportamento real do ponteiro — o recolhimento muda a geometria sob o cursor — so e observavel no navegador: roteiro itens 7 e 8 |
| 15 | Nao-regressao de permissao (Configuracoes, Usuarios/Perfis, Resumo, Lancamentos) | VERIFICADO | `main-layout.spec.ts` (67-71, 89-135): grupo Configuracoes com so USERS / so PROFILES / nenhum; filhos por permissao; zero botoes sem permissao alguma. Diff do template nao toca nos `*ngIf` de permissao de Resumo/Lancamentos/Usuarios/Perfis (so adiciona `(click)="onNavigate()"`) |
| 16 | `.workspace` mantem `margin-left: 76px` nos dois estados (expansao sobrepoe, nao empurra) | VERIFICADO | CSS efetivo no chunk servido: `.workspace{...margin-left:76px...}` e a **unica** ocorrencia de `margin-left` no componente; `.sidebar{position:fixed;z-index:50}` intacto; nenhuma regra global sobre `.workspace` em `styles-TER4PDDF.css`; nenhuma regra condicionada a `.expanded` altera a margem |
| 17 | `npm test` verde com `main-layout.spec.ts` atualizado | VERIFICADO | `quality-report.md`: 73 testes em 12 arquivos, todos verdes; os testes novos exigidos (visibilidade de "Cadastros", acordeao, recolhimento ao navegar) existem de fato no spec (confirmado por leitura do arquivo) |

## Roteiro de validacao manual

1. Abra `http://localhost` e entre com o usuario de desenvolvimento `dev@financeos.local` (perfil Administrador) e a senha atual do seu ambiente. Esperado: a tela "Resumo" abre e a barra lateral aparece **recolhida** (trilho estreito, so icones).
2. Passe o mouse sobre a barra lateral. Esperado: ela expande mostrando os rotulos na ordem **Resumo, Lancamentos, Cadastros, Configuracoes** — "Categorias" **nao** aparece mais no primeiro nivel. (confirmacao visual dos criterios 1 e 8, ja verificados por teste)
3. Com a barra expandida, clique em **"Cadastros"**. Esperado: o subitem **"Categorias"** aparece indentado logo abaixo; a barra continua expandida e **nenhuma tela muda**. (criterios 6, 9 e 11)
4. Clique em **"Configuracoes"**. Esperado: "Usuarios" e "Perfis" aparecem e o grupo "Cadastros" **fecha sozinho** (acordeao). Clique de novo em "Cadastros" e confirme o movimento inverso. (criterio 10)
5. Com "Cadastros" aberto, clique no subitem **"Categorias"**. Esperado: a tela de Categorias abre **exatamente como antes** (lista + formulario, URL `/categories`) **e** a barra lateral **recolhe imediatamente** para o trilho estreito, mesmo com o mouse ainda parado sobre ela. (criterios **2** e 12)
6. Ainda em `/categories`, com a barra recolhida, observe o icone de pasta ("Cadastros") no trilho. Esperado: ele esta **destacado como ativo** (fundo mais claro), do mesmo jeito que "Configuracoes" fica ao estar em `/users`. Passe o mouse para expandir e confirme que o destaque continua no item "Cadastros". (criterio **7**)
7. Repita o clique do passo 5 (expanda, abra "Cadastros", clique em "Categorias") e, logo apos o recolhimento, **mantenha o ponteiro sobre a coluna estreita de icones** e mova-o para cima e para baixo **sem sair da barra**. Esperado: a barra **nao reexpande**. Depois tire o ponteiro da barra (leve-o para a area de conteudo) e traga-o de volta sobre o trilho. Esperado: **so agora** ela expande de novo. (criterio **14**)
8. Teclado: com a barra recolhida, pressione **Tab** ate o foco entrar na barra lateral (ela deve expandir ao receber o foco). Tab ate **"Cadastros"**, **Enter** para abrir o grupo, Tab ate **"Categorias"** e **Enter**. Esperado: a tela abre, a barra **recolhe** mesmo com o foco que estava dentro dela, e o **foco vai para a area de conteudo** — o proximo Tab deve focar um elemento da tela aberta, nao do menu. Em seguida, Tab/Shift+Tab de volta ate a barra deve reexpandi-la (novo foco de teclado e um gatilho valido). (parte de teclado do criterio **14**; reconfirma o 13 no navegador real)
9. Nao-regressao de permissao (opcional — so se voce ja tiver um usuario de teste **sem** acesso a Categorias; nao crie dados so para isso): entre com esse usuario. Esperado: o grupo "Cadastros" **nem aparece** no menu, e "Resumo"/"Lancamentos"/"Configuracoes" seguem a permissao de cada um; acessar `http://localhost/categories` direto pela URL continua bloqueado pelo guard. (criterios 3 e 15, ja verificados por teste)

## Dados de teste criados

Nenhum.

## Achado fora dos criterios

- O working tree contem a pasta **untracked `specs/39-ajustes-alertas/`**, que nao pertence a esta feature (artefato de outra issue em andamento). Nao e defeito da implementacao e nao reprova o criterio 4 (que trata de `backend/`); a etapa `open-pr` comita seletivamente pelos arquivos de `implementation-notes.md`, entao essa pasta nao deve entrar no commit da issue 37.
- A pasta untracked `specs/37-menu-cadastros/` sao os artefatos da propria esteira desta feature (esperado).

## Conclusao

14 de 17 criterios verificados automaticamente; 3 dependem de validacao manual do usuario (criterios 2, 7 e 14 — roteiro itens 5, 6, 7 e 8). Nenhum criterio NAO ATENDIDO. Apos o OK do usuario no roteiro acima, a feature esta pronta para `/pipeline:open-pr`.

Validado pelo usuario em 2026-07-27.
