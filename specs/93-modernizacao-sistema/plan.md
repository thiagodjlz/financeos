# Plano de implementacao

## Abordagem

Base primeiro, telas depois: (1) `categoryColor` aditivo no back-end; (2) tokens do mockup em `:root` reaproveitando os **nomes** atuais (so troca valor; o que o mockup pede a mais vira token novo) e utilitarios globais em `styles.scss`, para as telas herdarem o visual e o budget de 8 kB por componente ficar de pe; (3) shell, componentes de listagem e cada tela com o seu spec logo em seguida; (4) Central, Novidades e varreduras. Sem migration (proximo livre seria `V16`).

## Arquivos a alterar

### Backend (`backend/src/main/java/br/com/financeos/`)
- `transactions/{FinancialTransaction,TransactionResponse,TransactionResource}.java` — `@Formula` + campo `categoryColor`; POST/PUT com a cor da `Category` validada.
- `dashboard/{CategoryBreakdownResponse,DashboardRepository}.java` — `c.color` no select e no `group by`.
- `documentation/content/*`, `releasenotes/content/ReleaseNotesContent.java` — texto (+ testes de conteudo).

### Frontend (`frontend/src/`)
- `styles.scss`, `app/core/toast/toast-host.scss`, `app/features/categories/categories.scss` (`.icon-button` vira global).
- `app/layout/main-layout/*`, `app/core/back-to-top/back-to-top.scss`.
- `app/core/{formatters.ts,paged-list.ts,models.ts}`, `app/core/{filter-panel,pagination}/*` (+ specs).
- `app/features/{transactions,dashboard,categories,users,profiles,auth/login}/*` (+ specs).

## Tarefas

- [x] **T1** — Expor `categoryColor` em `TransactionResponse` (lista, detalhe, POST, PUT) e testar cor igual a `color`, `null` sem categoria e com categoria sem cor (o helper `createCategory` ja cria sem cor)
  - Arquivos: `FinancialTransaction.java`, `TransactionResponse.java`, `TransactionResource.java`, `TransactionResourceTest.java`
  - Criterios: 6
- [x] **T2** — Expor `categoryColor` em `categoryBreakdown` e testar (categoria com cor, sem cor, "Sem categoria")
  - Arquivos: `CategoryBreakdownResponse.java`, `DashboardRepository.java`, `DashboardResourceTest.java`
  - Criterios: 6
- [x] **T3** — Trocar os valores de `:root` pela tabela "Tokens" da spec e criar os que faltam (primaria forte/suave, chip ativo, foco, `th`, card Saldo, scrim, cores do grafico do mockup); `body` Inter sobre `--bg-app`
  - Arquivos: `styles.scss`
  - Criterios: 1
- [x] **T4** — Reescrever utilitarios globais: botao 40px/raio 10 (48px ate 480px), campo 44px, `invalid` + `.field-error` com icone por pseudo-elemento, pill 24px com ponto, `th` 44/linha 56, `.icon-button` 36px, `.page-header` 26/700 + subtitulo, toast 360/raio 12, modal 400/raio 16
  - Arquivos: `styles.scss`, `toast-host.scss`, `categories.scss`
  - Criterios: 2, 3, 4, 12
- [x] **T5** — Login: card 420/raio 18, campos 48px, botao "Mostrar senha" (`type="button"`, signal alterna `type`), com spec provando alternancia sem HTTP
  - Arquivos: `login.{html,ts,scss,spec.ts}`
  - Criterios: 12
- [x] **T6** — Menu desktop 248px com secoes (rotulos Cadastros/Configuracoes/Sobre no lugar do acordeao), "Recolher menu" em trilho (signal), rodape com iniciais, nome, versao e Sair; cada `*ngIf` atual mantido
  - Arquivos: `main-layout.{html,ts,scss}`
  - Criterios: 9, 13
- [x] **T7** — Celular: barra inferior 76px (Resumo, Lancamentos, "+" so com `TRANSACTIONS/CREATE`, Cadastros, Mais) e paineis inferiores com os itens permitidos (Cadastros some sem `CATEGORIES/VIEW`); sai gaveta e `.mobile-topbar`; back-to-top acima da barra
  - Arquivos: `main-layout.{html,ts,scss}`, `back-to-top.scss`
  - Criterios: 9, 13
- [x] **T8** — Reescrever `main-layout.spec.ts` (secoes, recolher, paineis por permissao, "+", `Esc`/foco)
  - Arquivos: `main-layout.spec.ts`
  - Criterios: 9, 13
- [x] **T9** — `formatters.ts`: `shortDate` (dd/mm/aaaa por `split`, sem `Date`), `dayHeading(iso, hoje)` ("Hoje, 24 de setembro", "Ontem, ...", "22 de setembro"), `initials(nome)` + spec
  - Arquivos: `formatters.ts`, `formatters.spec.ts`
  - Criterios: 4, 11
- [x] **T10** — Filtros: campos sempre visiveis acima de 680px (aplica no `change`), faixa "Filtros ativos:" com rotulos e "Limpar filtros"; ate 680px botao "Filtros" abre painel inferior com "Aplicar"/"Fechar filtros". `PagedList` ganha rascunho enquanto o painel esta aberto (`change` nao aplica; "Aplicar" aplica; fechar descarta) + specs
  - Arquivos: `filter-panel.{html,ts,spec.ts}`, `paged-list.ts`, `paged-list.spec.ts`
  - Criterios: 4, 11
- [x] **T11** — Paginacao "Mostrando X–Y de N" (entradas `totalItems` e `PAGE_SIZE`) com icones + spec
  - Arquivos: `pagination.{html,ts,spec.ts}`
  - Criterios: 4
- [x] **T12** — Lancamentos: `.page-header` + "Novo lancamento"; busca com icone, selects-pilula Tipo/Categoria/Status, Data de/ate (D11); tabela com `shortDate`, bolinha `categoryColor` (omitida se `null`), pill, "—" `aria-label="Sem status"`, cancelado riscado, acoes-icone "Editar lancamento"/"Cancelar lancamento"; `tr.day-row` (oculta acima de 680px) para os cartoes por dia; `models.ts`
  - Arquivos: `transactions.{html,ts,scss}`, `models.ts`
  - Criterios: 3, 4, 6, 11, 13
- [x] **T13** — Atualizar `transactions.spec.ts`: helpers por `aria-label`, filtros sem `openFilters`, casos de data, "—", bolinha, cancelado, dia, gates e `DELETE`
  - Arquivos: `transactions.spec.ts`
  - Criterios: 3, 4, 6, 11, 13
- [x] **T14** — Cadastro de lancamento: card 720px, Tipo/Status em `radio` segmentado, Valor 60px com "R$", contador "N/255", bolinha da categoria selecionada ao lado do select, "Salvar lancamento"; no celular voltar = `requestCancel()` e "Salvar" fixo 52px
  - Arquivos: `transaction-form.{html,ts}`, `transaction-form.scss` (novo)
  - Criterios: 2, 5, 6, 11, 13
- [x] **T15** — Atualizar `transaction-form.spec.ts`: radios, Status some com Receita, payload inalterado, contador, bolinha, voltar sem HTTP nem toast
  - Arquivos: `transaction-form.spec.ts`
  - Criterios: 5, 6, 11, 13
- [x] **T16** — Resumo: saudacao em `h1` 26px + subline; passo de mes sobre a lista cronologica (`/periods` ∪ mes corrente; `[mes corrente]` se `/periods` falhar), botoes "Mes anterior"/"Proximo mes" desabilitados nas pontas, so `summary` na troca; cards Saldo (escuro), Receitas, Despesas, Pendentes com as linhas de apoio do criterio 7
  - Arquivos: `dashboard.{html,ts,scss}`
  - Criterios: 7, 8
- [x] **T17** — "Por categoria": alternancia Despesas/Receitas (`aria-pressed`), bolinha e barra na `categoryColor` (token neutro se `null`), barra relativa ao maior do tipo, rodape "N categorias" + total; grafico nos tokens novos; `models.ts`
  - Arquivos: `dashboard.{html,ts,scss}`, `models.ts`
  - Criterios: 6, 8
- [x] **T18** — Atualizar `dashboard.spec.ts` (passo de mes, pontas, sem `periods` na troca, cards, "Por categoria", bolinha)
  - Arquivos: `dashboard.spec.ts`
  - Criterios: 6, 7, 8
- [x] **T19** — Categorias: cabecalho + "Nova categoria", busca + pilulas, acoes "Editar categoria"/"Excluir categoria", pill Ativo/Inativo + spec
  - Arquivos: `categories.{html,ts,spec.ts}`
  - Criterios: 3, 4, 13
- [x] **T20** — Usuarios e Perfis no padrao de Categorias ("Novo usuario"/"Editar usuario"/"Desativar usuario"; "Novo perfil"/"Editar perfil"/"Excluir perfil") + specs
  - Arquivos: `users.{html,spec.ts}`, `profiles.{html,spec.ts}`
  - Criterios: 3, 4, 13
- [x] **T21** — Cadastros de Categoria e Usuario no layout do LancamentoForm (card 720, cabecalho, "Salvar categoria"/"Salvar usuario") + specs
  - Arquivos: `category-form.{html,spec.ts}`, `user-form.{html,spec.ts}`
  - Criterios: 2, 13
- [x] **T22** — Cadastro de Perfil no mesmo layout + spec
  - Arquivos: `profile-form.{html,scss,spec.ts}`
  - Criterios: 2, 13
- [x] **T23** — Central: `OverviewContent` (menu por secoes, recolhivel, barra inferior) e `SummaryAreaContent` (passo de mes, cards, "Por categoria")
  - Arquivos: `OverviewContent.java`, `SummaryAreaContent.java`
  - Criterios: — (consumidor obrigatorio, `knowledge/documentation.md`)
- [x] **T24** — Central: areas de cadastro com "Novo ...", filtros visiveis e acoes por icone + `DocumentationContentTest` (expectativa "Incluir"/"Filtros")
  - Arquivos: `{Transactions,Categories,Users,Profiles}AreaContent.java`, `DocumentationContentTest.java`
  - Criterios: — (idem)
- [x] **T25** — Novidades 1.0.2: reescrever itens que ficaram falsos ("menu em gaveta", "ano e mes", "botao Filtros") e acrescentar o visual novo + `ReleaseNotesContentTest`
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: — (idem)
- [x] **T26** — Remover tokens mortos (`--sidebar-*`, `--mobile-topbar-h`, `--drawer-width`), rodar as 4 varreduras do briefing, `npm run build` (budget), `npm test`, `./mvnw test`
  - Arquivos: `styles.scss`
  - Criterios: 1, 14
- [x] **T27** — `FilterPanel` ganha `hasFields`: tela só com busca (Perfis) não mostra o botão "Filtros" no celular, que abriria um painel vazio
  - Arquivos: `filter-panel.{html,ts}`, `profiles.{html,spec.ts}`
  - Criterios: 4, 11
- [x] **T28** — Estados de lista do mockup (`Componentes`): erro de carga e "Nenhum registro encontrado." com ícone em círculo, vazio da tela com título e frase
  - Arquivos: `list-feedback.html`, `styles.scss`, `{transactions,categories,users,profiles}.html`
  - Criterios: 4
- [x] **T29** — Documentação, Novidades e Sem acesso com o título em `h1` (o shell deixou de ter `h1`)
  - Arquivos: `documentation.html`, `release-notes.html`, `no-access.html`
  - Criterios: 1
- [x] **T30** — (correção 1) Cadastros sem barra inferior, como o `MobileForm`: `formRoute` (signal da URL de novo/editar dos 4 cadastros) tira a `.bottom-bar` do DOM e troca a folga do `workspace` pela do "Salvar" fixo + specs
  - Arquivos: `main-layout.{ts,html,scss,spec.ts}`
  - Criterios: 9, 11
- [x] **T31** — (correção 1) Especificidade dos campos: reset `font: inherit` dos campos em `:where` (perdia o `:where` dos utilitários), 16px a ≤680px também no painel de filtros; campos do desktop voltam a 14px
  - Arquivos: `styles.scss`
  - Criterios: 2, 11, 12
- [x] **T32** — (ajustes pós-validação, DEC-11) Cabeçalho do painel de filtros (alça, "Filtros", fechar) escondido no desktop por seletor `.filter-sheet > ...` (0,2,0), que `.sheet-handle`/`.sheet-head` (mais abaixo no arquivo) não vencem; spec prende a estrutura de que o CSS depende
  - Arquivos: `styles.scss`, `filter-panel.spec.ts`
  - Criterios: 10
- [x] **T33** — (DEC-12) Card dos cadastros até 960px (`--form-width`) com a grade do `LancamentoForm`: lançamento com Tipo/Valor/Descrição/Categoria na largura toda e Data|Status lado a lado (Data ocupa a linha quando Status some); Categoria, Usuário e Perfil em `.form-grid` de 2 colunas (1 a ≤680px); "R$" `nowrap` + `flex-shrink: 0`
  - Arquivos: `styles.scss`, `category-form.html`, `user-form.html`, `profile-form.{html,scss}`
  - Criterios: 2, 5
- [x] **T34** — (DEC-13/14) Barra inferior sem "Cadastros" (Resumo, Lançamentos, +, Mais) e Categorias no painel "Mais" (seção Cadastros, mesma permissão); itens de largura igual, rótulo `nowrap`; destaque de "Mais" por `computed` sobre o signal de navegação (sai `router.url`) + specs
  - Arquivos: `main-layout.{html,ts,scss,spec.ts}`
  - Criterios: 9, 13
- [x] **T35** — (consumidor) Central: "Como navegar" e regra de acesso sem o item Cadastros na barra + `DocumentationContentTest`
  - Arquivos: `OverviewContent.java`, `DocumentationContentTest.java`
  - Criterios: 9

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | tokens, varreduras, body | T3, T26 |
| 2 | botao, card, campo, 400 | T4, T14, T21, T22, T33 |
| 3 | pills, "—" | T4, T12, T13, T19, T20 |
| 4 | listagens | T4, T9, T10, T11, T12, T13, T19, T20 |
| 5 | cadastro de lancamento (DEC-12) | T14, T15, T33 |
| 6 | `categoryColor` + bolinha | T1, T2, T12, T13, T14, T15, T17, T18 |
| 7 | cards do Resumo | T16, T18 |
| 8 | "Por categoria" + passo | T16, T17, T18 |
| 9 | menu e barra inferior (DEC-13/14) | T6, T7, T8, T34, T35 |
| 10 | desktop sem cabeçalho do painel de filtros (DEC-11) | T32 |
| 11 | celular | T7, T9, T10, T12, T13, T14, T15, T30, T31 |
| 12 | login, toast, modal | T4, T5 |
| 13 | nao-regressao | T6, T7, T8, T12, T13, T14, T15, T19, T20, T21, T22, T34 |
| 14 | testes e acentuacao | T26 |

## Superficie de validacao

- 6 — `TransactionResourceTest#shouldReturnCategoryColor...`, `DashboardResourceTest#shouldReturnCategoryColorInBreakdown`; tela: bolinha em Lancamentos/Resumo/cadastro.
- 3, 4, 13 — `transactions.spec`/`categories.spec`/`users.spec`/`profiles.spec`: `aria-label` das acoes, "Mostrando", gates, `DELETE /api/transactions/{id}`.
- 5, 11 — `transaction-form.spec` (radios, payload, voltar sem HTTP); `paged-list.spec` (rascunho + "Aplicar"); `formatters.spec`.
- 7, 8 — `dashboard.spec` (pontas desabilitadas, so `summary`, rotulos dos cards).
- 9 — `main-layout.spec` (itens por permissao, "+", painel Mais com Categorias, destaque do grupo).
- 10 — `filter-panel.spec` (estrutura); tela: medição a 1440/2000 em `evidence/medicoes-ajustes-validacao.md`.
- 12 — `login.spec` (`type` alterna, `httpMock.expectNone`); `toast.service.spec` (duracoes).
- 1, 14 — varreduras literais do briefing + suites.

## Validacao manual (etapa 7)

- 1 — DevTools Computed do `body`: Inter, `rgb(246, 245, 242)`.
- 2, 3, 4, 5 — alturas/raios/cores (botao 40, card 14, campo 44, pill 24, `th` 44, linha 56, acao 36, card 960 com grade de 2 colunas, Valor 60); 400 no cadastro com borda `rgb(185, 58, 46)`.
- 7 — card Saldo `#1D2440`; 9 — menu 248 e trilho; a 390px barra inferior e paineis.
- 9 — a 320/390px: 4 itens (ou 3 sem `CREATE`) de largura igual, rótulos numa linha; Categorias no painel Mais. 10 — a 1440/2000px, barra de filtros sem alça, "Filtros" nem fechar.
- 11 — a 390px: painel de filtros, cartoes por dia, "Salvar" 52px fixo, campo 16px (emulacao).
- 12 — login 420/18, toast 360/12, modal 400/16.
- 6 — API autenticada exige credencial do usuario (`architecture.md`).

## Riscos e pontos de atencao

- **Principal**: o shell. T6–T8 trocam trilho, acordeao e gaveta (e as regras de foco, `Esc`, `visibility`, `body` travado, camadas) por menu fixo, barra e paineis; `main-layout.spec` reescrito inteiro e cada condicao de permissao do menu tem de sobreviver (`knowledge/auth-and-permissions.md`). Barra inferior entra como camada 60 e o painel como 70/80.
- "Aplicar" no celular sem `matchMedia`: o rascunho vale enquanto o painel esta aberto (estado, nao largura). Fechar sem aplicar descarta o rascunho — confirmado pelo usuario (DEC-10).
- Cartoes por dia x "sem template por largura": `tr.day-row` no mesmo `tbody`; specs que contam `tbody tr` mudam.
- Specs acham botoes por texto ("Incluir", "Editar", "Salvar") em 9 arquivos: helpers passam a aceitar `aria-label`.
- Budget 8 kB: `dashboard.scss` (361 linhas) e `main-layout.scss` crescem; o comum vai para `styles.scss`.
- `<option>` nao mostra bolinha: ela fica ao lado do select, na cor da categoria escolhida.
- Mockup: rotulo do mes com seta (sem seletor, DEC-5 so passo); cartao mobile com "Acoes do lancamento" nao desenhado — ficam os dois botoes-icone.
- Subtitulos das listagens nao estao na spec: fixos (Categorias do mockup; os demais no mesmo tom), sem "no periodo filtrado".

## Lacunas

- T23–T25 sem criterio: consumidores obrigatorios (Central/Novidades), nao escopo extra.
- Nenhuma regra fica so no front: `categoryColor` vem do back-end e o passo de mes so percorre `/periods`.
