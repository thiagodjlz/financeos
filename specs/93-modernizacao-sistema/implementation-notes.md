# Notas de implementacao

Branch: `feature/issue-93-modernizacao-sistema` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 35 de 35 concluidas (ver `plan.md`; T30–T31 da correção 1, T32–T35 dos ajustes pós-validação)

## Arquivos alterados

- `backend/.../transactions/{FinancialTransaction,TransactionResponse,TransactionResource}.java` — `categoryColor` por `@Formula`; POST/PUT com a cor da `Category` validada
- `backend/.../dashboard/{CategoryBreakdownResponse,DashboardRepository}.java` — `c.color` no select e no `group by`
- `backend/.../documentation/content/{Overview,Summary,Transactions,Categories,Users,Profiles}*Content.java` — textos da interface nova
- `backend/.../releasenotes/content/ReleaseNotesContent.java` — bloco 1.0.2 reescrito
- `backend/src/test/.../{TransactionResourceTest,DashboardResourceTest,DocumentationContentTest,ReleaseNotesContentTest}.java` — cor da categoria; vocabulário novo
- `frontend/src/styles.scss` — tokens do mockup e utilitários globais
- `frontend/src/app/layout/main-layout/main-layout.{html,ts,scss,spec.ts}` — menu 248 com seções e trilho; barra inferior e painéis Cadastros/Mais; sem barra nos cadastros
- `frontend/src/app/core/back-to-top/back-to-top.scss` — acima da barra inferior
- `frontend/src/app/core/toast/toast-host.{html,scss,spec.ts}` — 360/raio 12, "Fechar aviso"
- `frontend/src/app/core/{formatters,formatters.spec}.ts` — `shortDate`, `isoDate`, `dayHeading`, `initials`
- `frontend/src/app/core/{paged-list,paged-list.spec}.ts` — rascunho do painel e `FilterControls`
- `frontend/src/app/core/filter-panel/filter-panel.{html,ts,spec.ts}` — filtros visíveis e painel inferior
- `frontend/src/app/core/pagination/pagination.{html,ts,spec.ts}` — "Mostrando X–Y de N" e ícones
- `frontend/src/app/core/list-feedback/list-feedback.html` — estados com ícone
- `frontend/src/app/core/models.ts` — `categoryColor` em `Transaction` e `CategoryBreakdown`
- `frontend/src/app/features/auth/login/login.{html,ts,scss,spec.ts}` — card 420/18, campos 48, "Mostrar senha"
- `frontend/src/app/features/transactions/transactions.{html,ts,scss,spec.ts}` — listagem nova e cartões por dia
- `frontend/src/app/features/transactions/transaction-form.{html,ts,spec.ts}` e `transaction-form.scss` (novo) — cadastro novo
- `frontend/src/app/features/dashboard/dashboard.{html,ts,scss,spec.ts}` — saudação h1, passo de mês, cards novos, "Por categoria"
- `frontend/src/app/features/categories/{categories,category-form}.{html,scss,spec.ts}` — padrão novo de listagem/cadastro
- `frontend/src/app/features/users/{users.html,users.scss,users.spec.ts,user-form.html,user-form.spec.ts}` — idem
- `frontend/src/app/features/profiles/{profiles.html,profiles.scss,profiles.spec.ts,profile-form.html,profile-form.scss,profile-form.spec.ts}` — idem
- `frontend/src/app/features/{documentation/documentation,release-notes/release-notes,no-access/no-access}.html` — título em `h1`
- `specs/93-modernizacao-sistema/{plan.md,spec.md,implementation-notes.md}` e `evidence/{medicoes-correcao-1,medicoes-ajustes-validacao}.md` — tarefas, estágio, medições

## Decisoes

- Tokens: nomes atuais com os valores do mockup; os novos só em `:root`. Chevron do `<select>` com gradientes (`url(data:...)` casaria a varredura 2).
- Utilitários de campo em `:where(...)` (especificidade 0) para `.input-affix`, `.filter-field` e o switch de Perfis sobrescreverem sem `!important` (o reset também, ver Correção 1).
- Menu: `<button routerLink>` + `onNavigate()`, cada `*ngIf` de permissão mantido item a item, também nos painéis. `body.overlay-open` serve aos painéis de menu e de filtros.
- Painel "Mais" com iniciais, nome e versão antes do "Sair" (o rodapé do menu não existe no celular).
- Filtros no celular: rascunho enquanto o painel está aberto (estado, não largura); "Limpar filtros" do painel limpa só o rascunho; X, scrim ou Esc descartam (DEC-10).
- Resumo: cards na ordem do mockup; sem `categoryColor` some a bolinha e a barra usa `--category-fallback`; `/periods` em falha = só o mês corrente. Celular com o mesmo template (o `MobileResumo` não foi reproduzido: sem template por largura).
- Despesa com sinal "−" (U+2212, no `unicode-range` da Inter), como no mockup.
- `confirm-dialog` só ganhou o visual (400/16), por ser genérico.
- Subtítulos fixos por tela; no celular o "Novo lançamento" do cabeçalho some (o "+" da barra tem a mesma permissão).

## Desvios em relacao ao plano

- T26: tokens mortos removidos (e `--balance*`, `--text-faint`), varreduras vazias, build sem aviso de budget; o `./mvnw test` completo ficou para o `quality-check` (163/0), e só então marquei a tarefa.
- T27 acrescentada: Perfis só tem busca; sem `hasFields` o botão "Filtros" abriria um painel vazio no celular.
- T28 acrescentada: `list-feedback` não estava no plano, mas os estados de lista do `Componentes` pediam ícone e título.
- T29 acrescentada: o shell perdeu o `h1` (marca virou `strong`), então as três telas não redesenhadas passaram a `h1`.
- T4: além do `.scss`, o toast mudou o `aria-label` do fechar para "Fechar aviso" (mockup), com o spec ajustado.

## Correção 1 (verificação: critério 10)

- "Salvar" sob a barra inferior: como no `MobileForm`, cadastro não tem barra. `formRoute` (`computed` sobre `toSignal` do `NavigationEnd`, regex de novo/editar dos 4 cadastros) tira a `.bottom-bar` do DOM e `.app-shell.form-route` troca a folga do `workspace` pela do rodapé fixo. Signal, e não `router.url` num método: o layout é OnPush (padrão do Angular 22) e sem ele a barra não voltava ao sair do cadastro.
- Campos a 13.5/13px: o reset `input, select, textarea { font: inherit }` (0,0,1) vencia o `:where` dos utilitários. O reset dos campos foi para `:where` (o de `button` ficou); desktop volta a 14px. O 16px subiu de ≤480 para ≤680 (layout de celular), explícito no painel de filtros; 48px de altura segue só a ≤480, como na `main`.
- Testes: `main-layout.spec` +16 casos; `npm test` 405/0; build sem aviso de budget. Medições (2, 4, 9, 10, 11) em `evidence/medicoes-correcao-1.md`.

## Ajustes pos-validacao (2026-09-28)

Pedido (DEC-11 a 14): desktop sem o cabeçalho do painel de filtros e cadastro ocupando melhor o espaço ("R$" quebrava); celular sem "Cadastros" na barra e itens redimensionados.

- T32: cascata — `.sheet-handle`/`.sheet-head` (depois no arquivo) venciam o `display: none` de mesma especificidade; seletores do painel viraram `.filter-sheet > ...`.
- T33: `--form-width` 960; lançamento na grade do protótipo (Data|Status; `.two-cols > :only-child` põe a Data na linha toda com Receita); `.form-grid` de 2 colunas em Categoria/Usuário/Perfil; "R$" `nowrap` + `flex-shrink: 0`.
- T34: Categorias no painel Mais (seção Cadastros, mesma permissão); itens sem padding e rótulo `nowrap` (-0.01em, 11,5px); destaque de Mais por `computed` sobre `currentUrl`.
- T35: `OverviewContent` + teste sem "Cadastros" na barra. Matriz do `plan.md` renumerada (critério novo na posição 10).
- `npm test` 416/0; `DocumentationContentTest` 17/0; medições em `evidence/medicoes-ajustes-validacao.md`.
