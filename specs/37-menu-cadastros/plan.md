# Plano de implementacao

## Abordagem

Mudanca 100% frontend, concentrada nos 4 arquivos de `frontend/src/app/layout/main-layout/`. A expansao da sidebar deixa de ser hibrida (CSS `:hover`/`:focus-within` + signal) e passa a ser controlada **exclusivamente pelo signal `expanded`** via classe `.sidebar.expanded` — os eventos `(mouseenter)`/`(focusin)` ja existentes continuam sendo os gatilhos de abertura, o que faz o recolhimento automatico pos-navegacao funcionar de graca: `mouseenter` so re-dispara quando o ponteiro sai e reentra no `<aside>` (decisao 1), entao basta zerar o signal no clique. O estado dos grupos vira um unico signal `openGroup: 'registers' | 'settings' | null` (acordeao por construcao, decisao 2), e todo botao que navega ganha um handler `onNavigate()` que recolhe o trilho, fecha o grupo aberto e move o foco para a `<section class="workspace">` (com `tabindex="-1"`), cumprindo a decisao 4 e destravando o `focusout`/`onMouseLeave` que hoje segurariam o trilho aberto.

## Arquivos a alterar

### Backend

- **Nenhum** — criterio 4 exige `git diff --stat` sem arquivos de `backend/` (grupo de menu e agrupador visual sem `Screen`, por convencao em `knowledge/auth-and-permissions.md`).

### Frontend

- `frontend/src/app/layout/main-layout/main-layout.ts` —
  - Substituir `settingsExpanded = signal(false)` por `openGroup = signal<'registers' | 'settings' | null>(null)` e trocar `toggleSettings()` por `toggleGroup(group)`: com o trilho recolhido, expande e abre o grupo (criterio 11); expandido, alterna o grupo clicado — abrindo um, o outro fecha sozinho porque so existe um slot (criterios 9 e 10).
  - Novo `onNavigate()`: `expanded.set(false)`, `openGroup.set(null)` e `focus()` no elemento da workspace (via `viewChild` de um `#workspace` com `tabindex="-1"`), cobrindo criterios 12 e 13. Mouse e Enter caem no mesmo `(click)` do `<button>`, entao um handler serve para os dois.
  - Novos helpers `isRegistersActive()` (`router.url.startsWith('/categories')`, criterio 7) e `canSeeRegisters()` (`authService.can('CATEGORIES', 'VIEW')`, criterio 3). `isSettingsActive()`, `canSeeSettings()`, `expand()`, `onMouseLeave()` e `onFocusOut()` permanecem como estao (nao-regressao de hover/teclado — `(focusin)` continua expandindo ao percorrer por Tab, criterio 14 parte final).
- `frontend/src/app/layout/main-layout/main-layout.html` —
  - Remover o botao "Categorias" de primeiro nivel e criar o `.nav-group` "Cadastros" **entre Lancamentos e Configuracoes** (criterios 1 e 8), com `*ngIf="canSeeRegisters()"`, botao pai no padrao da issue #35 (SVG inline 20px `viewBox="0 0 24 24"` `stroke="currentColor"` `stroke-width="1.8"`, `<span class="nav-label">Cadastros</span>` sempre no DOM, `[attr.title]`/`[attr.aria-label]` so quando recolhido — criterio 5), `[class.active]="isRegistersActive()"` e `(click)="toggleGroup('registers')"`. Subitem "Categorias" dentro de `.nav-children` com `*ngIf` de renderizacao `openGroup() === 'registers' && expanded()` (criterio 6), mantendo o `authService.can('CATEGORIES','VIEW')` no proprio botao, o mesmo SVG de dois circulos e o `routerLink="/categories"` (criterio 2 — rota, guard e componente intactos).
  - Grupo "Configuracoes": trocar `(click)="toggleSettings()"` por `toggleGroup('settings')` e o `*ngIf` dos filhos para `openGroup() === 'settings' && expanded()`.
  - Adicionar `(click)="onNavigate()"` aos 5 botoes que navegam (Resumo, Lancamentos, Categorias, Usuarios, Perfis) — o `routerLink` continua fazendo a navegacao.
  - `<section class="workspace" #workspace tabindex="-1">` para receber o foco pos-navegacao.
- `frontend/src/app/layout/main-layout/main-layout.scss` —
  - Remover `.sidebar:hover` e `.sidebar:focus-within` dos dois blocos que aplicam o estado expandido (largura 236px/sombra, ~linhas 22-27, e opacidade de `.brand-text`/`.nav-label`/`.sidebar-footer`, ~linhas 173-185), deixando apenas `.sidebar.expanded` — sem isso, o `:hover` do CSS mantem 236px mesmo com o signal zerado e os criterios 12/14 nao funcionam.
  - `.workspace:focus { outline: none; }` (foco programatico de container, nao deve exibir anel de foco). `margin-left: 76px` e todo o resto do arquivo ficam como estao (criterio 16).
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` —
  - Ajustar os testes existentes: "Categorias" deixa de aparecer no primeiro nivel (a lista de `aria-label` no estado recolhido vira `['Resumo', 'Lancamentos', 'Cadastros', 'Configuracoes']`; contagem de botoes de nivel superior segue 4); o teste de clique no pai recolhido continua valendo para Configuracoes.
  - Novos testes (criterio 17): grupo "Cadastros" visivel com `CATEGORIES/VIEW` e ausente sem (criterios 1 e 3); subitem "Categorias" renderiza so com grupo aberto + trilho expandido (criterio 6); acordeao — abrir "Cadastros" com "Configuracoes" aberto fecha "Configuracoes" e vice-versa, inclusive partindo do trilho recolhido (criterio 10); clique no pai com trilho expandido mantem `.sidebar.expanded` e nao navega (criterio 9); clique num item que navega remove `.sidebar.expanded` mesmo apos `mouseenter`/`focusin` previos (criterio 12) e move o foco para fora do `<aside>` (`document.activeElement` dentro de `.workspace`, criterio 13). Seguir o padrao existente do spec: tudo dirigido pelo DOM (`click()`, `dispatchEvent`), sem acessar membros `protected`.

### Migration

- Nenhuma (sem mudanca de schema).

## Ordem geral

Tudo numa camada so. Comecar pelo `.ts` (novo modelo de estado `openGroup` + `onNavigate`), depois o `.html` (que depende dos novos membros) e o `.scss` (remocao do `:hover`/`:focus-within`, que so faz sentido com o `onNavigate` no lugar — remover antes deixaria o hover quebrado); por fim o `.spec.ts`, atualizado contra o comportamento novo. A quebra em tarefas executaveis fica para `/pipeline:tasks`.

## Superficie de validacao

- Criterio 1 — teste automatizado (`main-layout.spec.ts`: "Cadastros" presente e "Categorias" ausente do primeiro nivel; "Categorias" aparece apos abrir o grupo) + validacao na tela: em `http://localhost`, logar com usuario com `CATEGORIES/VIEW`, expandir a sidebar (hover) e conferir "Cadastros" com subitem "Categorias".
- Criterio 2 — validacao na tela: clicar em "Categorias" dentro de "Cadastros" e conferir que `/categories` abre com a tela atual de Categorias (formulario "Nova categoria" + tabela).
- Criterio 3 — teste automatizado (`main-layout.spec.ts`: sem `CATEGORIES/VIEW`, nenhum botao "Cadastros" no DOM).
- Criterio 4 — `git diff --stat` na branch: nenhuma linha em `backend/`.
- Criterio 5 — teste automatizado (spec existente de svg + `title`/`aria-label` no estado recolhido, que itera todos os botoes de nivel superior, passa a cobrir "Cadastros" automaticamente).
- Criterio 6 — teste automatizado ("Categorias" indefinido com trilho recolhido mesmo com grupo aberto) + tela: no estado 76px nenhum subitem visivel.
- Criterio 7 — validacao na tela: estando em `/categories`, o pai "Cadastros" exibe o fundo de item ativo (classe `active`), como "Configuracoes" em `/users`.
- Criterio 8 — teste automatizado (ordem dos `aria-label`: Resumo, Lancamentos, Cadastros, Configuracoes).
- Criterio 9 — teste automatizado (apos `mouseenter`, clicar no pai mantem `.sidebar.expanded` e `router.url` inalterada).
- Criterio 10 — teste automatizado (abrir "Configuracoes", clicar "Cadastros": "Usuarios"/"Perfis" somem e "Categorias" aparece; e o inverso; tambem partindo do clique com trilho recolhido).
- Criterio 11 — teste automatizado (adaptacao do teste existente "expands the sidebar and opens the group...", repetido para "Cadastros").
- Criterio 12 — teste automatizado (apos `mouseenter` + abrir grupo, clicar "Categorias" remove `.sidebar.expanded`) + validacao na tela para a parte que o teste nao cobre (ponteiro parado sobre a sidebar apos o clique: o trilho fica em 76px — e o que a remocao do `:hover` do CSS garante).
- Criterio 13 — teste automatizado (apos o clique, `document.activeElement` esta fora do `<aside>`/dentro de `.workspace`) + tela: navegar por Tab ate "Lancamentos", Enter, conferir trilho recolhido e foco no conteudo.
- Criterio 14 — validacao na tela (nao ha como simular movimento continuo de ponteiro em teste): apos clicar num item, mover o mouse dentro da sidebar sem sair — nao reexpande; sair e reentrar — expande; com o trilho recolhido, Tab para dentro da sidebar — expande.
- Criterio 15 — testes automatizados existentes de permissao do grupo "Configuracoes" (mantidos verdes) + tela com usuario restrito.
- Criterio 16 — validacao na tela: com a sidebar expandida, o conteudo nao desloca (DevTools: `.workspace` com `margin-left: 76px` nos dois estados).
- Criterio 17 — `cd frontend && npm test` verde.

## Riscos e pontos de atencao

- **Principal risco — remover `:hover`/`:focus-within` do CSS muda o mecanismo de expansao para 100% eventos JS**: qualquer caminho de expansao que hoje dependa so do CSS (ex.: `:focus-within` cobria casos em que `focusin` nao bastasse) precisa continuar funcionando via `(mouseenter)`/`(focusin)`. Atencao especial a sequencia de eventos do clique (mousedown foca o botao → `focusin` expande → `click` recolhe): o `onNavigate()` roda por ultimo, entao o estado final e recolhido, mas os testes devem provar isso explicitamente.
- **Foco programatico na workspace**: o componente da rota e lazy (`loadComponent`), entao o foco deve ir para a `<section class="workspace">` (`tabindex="-1"`), que existe imediatamente — nao para um elemento interno da tela carregada. `tabindex="-1"` mantem a section fora da ordem de Tab (nao-regressao de navegacao por teclado).
- **`onMouseLeave` nao recolhe com foco dentro do `<aside>`** (protecao da issue #35 para subitens abertos por teclado): esse comportamento deve permanecer; ele nao conflita com o recolhimento automatico porque `onNavigate()` tira o foco da sidebar antes.
- **Nao-regressao dos utilitarios visuais** (`knowledge/architecture.md`, issue #35): `<span class="nav-label">` sempre no DOM (os testes usam `textContent`), icone do subitem em 20px (nunca reduzir), modais seguem em `z-index` 200/201 sobre o trilho (`z-index: 50`) — nada disso e tocado, mas conferir no diff.
- **Categorias continua catalogo global e a autorizacao real segue no backend** (`knowledge/categories.md`, `knowledge/auth-and-permissions.md`): o `*ngIf` do grupo e so UX; guard `permissionGuard('CATEGORIES','VIEW')` e `AccessControl` nao mudam.
