# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

## Frontend

- [x] **T1** — Substituir o estado de grupo unico por acordeao no componente: trocar `settingsExpanded = signal(false)` por `openGroup = signal<'registers' | 'settings' | null>(null)`, trocar `toggleSettings()` por `toggleGroup(group)` (trilho recolhido: expande e abre o grupo; expandido: alterna o grupo clicado, fechando o outro por construcao) e adicionar os helpers `isRegistersActive()` (`router.url.startsWith('/categories')`) e `canSeeRegisters()` (`authService.can('CATEGORIES', 'VIEW')`), mantendo `isSettingsActive()`, `canSeeSettings()`, `expand()`, `onMouseLeave()` e `onFocusOut()` como estao.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`
  - Criterios: 3, 7, 9, 10, 11
- [x] **T2** — Criar `onNavigate()` no componente: `expanded.set(false)`, `openGroup.set(null)` e foco programatico na section da workspace via `viewChild` de `#workspace` (mesmo handler serve mouse e Enter, pois ambos disparam o `(click)` do `<button>`); e o que destrava `onMouseLeave`/`onFocusOut` (que hoje segurariam o trilho aberto com o foco dentro do `<aside>`) e garante que so um novo `mouseenter`/`focusin` reexpande.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`
  - Criterios: 12, 13, 14
- [x] **T3** — No template, remover o botao "Categorias" de primeiro nivel e criar o `.nav-group` "Cadastros" entre "Lancamentos" e "Configuracoes": `*ngIf="canSeeRegisters()"`, botao pai no padrao da issue #35 (SVG inline 20px `viewBox="0 0 24 24"` `stroke="currentColor"` `stroke-width="1.8"`, `<span class="nav-label">Cadastros</span>` sempre no DOM, `[attr.title]`/`[attr.aria-label]` "Cadastros" so quando recolhido), `[class.active]="isRegistersActive()"`, `(click)="toggleGroup('registers')"`; subitem "Categorias" em `.nav-children` com `*ngIf="openGroup() === 'registers' && expanded()"`, mantendo o `authService.can('CATEGORIES','VIEW')` no botao, o SVG atual de dois circulos e o `routerLink="/categories"` (rota, guard e componente intactos).
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 1, 2, 3, 5, 6, 7, 8
- [x] **T4** — Ainda no template, adaptar o restante ao modelo novo: grupo "Configuracoes" passa a usar `toggleGroup('settings')` e `*ngIf="openGroup() === 'settings' && expanded()"` nos filhos (sem tocar nos `can` de "Usuarios"/"Perfis" nem nas condicoes de "Resumo"/"Lancamentos"); adicionar `(click)="onNavigate()"` aos 5 botoes que navegam (Resumo, Lancamentos, Categorias, Usuarios, Perfis), mantendo o `routerLink`; e marcar `<section class="workspace" #workspace tabindex="-1">` para receber o foco pos-navegacao.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 10, 12, 13, 15
- [x] **T5** — No SCSS, tornar a expansao 100% controlada pelo signal: remover `.sidebar:hover` e `.sidebar:focus-within` dos dois blocos que aplicam o estado expandido (largura 236px/sombra, ~linhas 22-27; opacidade de `.brand-text`/`.nav-label`/`.sidebar-footer`, ~linhas 173-185), deixando apenas `.sidebar.expanded`; adicionar `.workspace:focus { outline: none; }`. `margin-left: 76px` da `.workspace` e o resto do arquivo permanecem intactos.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.scss`
  - Criterios: 12, 14, 16

## Testes

- [x] **T6** — Ajustar os testes existentes de `main-layout.spec.ts` ao menu novo: lista de `aria-label` no estado recolhido vira `['Resumo', 'Lancamentos', 'Cadastros', 'Configuracoes']` (ordem = criterio 8), contagem de botoes de nivel superior segue 4, o spec existente de SVG + `title`/`aria-label` no estado recolhido passa a cobrir "Cadastros" automaticamente, e os testes de permissao de "Configuracoes"/"Resumo"/"Lancamentos" continuam verdes (nao-regressao).
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 1, 5, 8, 15, 17
- [x] **T7** — Adicionar os testes novos em `main-layout.spec.ts`, dirigidos pelo DOM (`click()`, `dispatchEvent`, sem acessar membros `protected`): grupo "Cadastros" visivel com `CATEGORIES/VIEW` e ausente sem (nenhum botao "Cadastros" no DOM); subitem "Categorias" so renderiza com grupo aberto + trilho expandido; clique no pai recolhido expande e abre o grupo sem navegar (adaptacao do teste existente, repetida para "Cadastros"); clique no pai com trilho expandido mantem `.sidebar.expanded` e `router.url` inalterada; acordeao nos dois sentidos, inclusive partindo do trilho recolhido; clique num item que navega remove `.sidebar.expanded` mesmo apos `mouseenter`/`focusin` previos e move o foco para fora do `<aside>` (`document.activeElement` dentro de `.workspace`).
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 1, 3, 6, 9, 10, 11, 12, 13, 17

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Grupo "Cadastros" com subitem "Categorias"; item de primeiro nivel some | T3, T6, T7 |
| 2 | Subitem navega para `/categories` com rota/guard/componente intactos | T3 |
| 3 | Sem `CATEGORIES/VIEW`, grupo "Cadastros" inteiro nao renderiza | T1, T3, T7 |
| 4 | Nenhum arquivo de `backend/` alterado | — (criterio negativo: atendido pela ausencia de tarefas de backend; conferido por `git diff --stat` em quality-check/verify) |
| 5 | Pai "Cadastros" no padrao visual do trilho (SVG 20px, `nav-label`, `title`/`aria-label` so recolhido) | T3, T6 |
| 6 | Subitens so renderizam com grupo aberto + trilho expandido | T3, T7 |
| 7 | Pai "Cadastros" ativo quando URL comeca com `/categories` | T1, T3 |
| 8 | Ordem: Resumo, Lancamentos, Cadastros, Configuracoes | T3, T6 |
| 9 | Clique no pai com trilho expandido alterna grupo e mantem 236px, sem navegar | T1, T7 |
| 10 | Acordeao: no maximo um grupo aberto por vez | T1, T4, T7 |
| 11 | Clique no pai com trilho recolhido expande e abre o grupo, sem navegar | T1, T7 |
| 12 | Clique em item que navega recolhe o trilho para 76px mesmo com o ponteiro sobre a sidebar | T2, T4, T5, T7 |
| 13 | Enter em item que navega recolhe o trilho e move o foco para a area de conteudo | T2, T4, T5, T7 |
| 14 | Trilho permanece recolhido ate o ponteiro sair e reentrar (ou novo foco de teclado) | T2, T5 |
| 15 | Nao-regressao de permissao dos demais itens/grupos | T4, T6 |
| 16 | `.workspace` mantem `margin-left: 76px` nos dois estados | T5 |
| 17 | `npm test` verde com `main-layout.spec.ts` atualizado | T6, T7 |

## Lacunas

- Nenhuma — todos os criterios de aceite estao cobertos por ao menos uma tarefa, com duas observacoes (nenhuma exige replanejar):
  - **Criterio 4 e negativo por natureza** (nao alterar `backend/`): nao ha tarefa que o "execute" — ele e atendido pela ausencia de tarefas de backend nesta lista e verificado por `git diff --stat` nas etapas de quality-check/verify, como o proprio plano preve.
  - Os criterios 2 (navegacao real ate a tela), 7 (estado `active` visual), 14 (movimento continuo do ponteiro) e 16 (`margin-left` nos dois estados) tem cobertura de tarefa mas validacao final **manual na tela**, conforme a superficie de validacao do plano — o teste automatizado nao simula esses cenarios. Nao e regra de negocio no frontend: a autorizacao real de `/categories` segue no `permissionGuard` e no `AccessControl` do backend, ambos inalterados.
