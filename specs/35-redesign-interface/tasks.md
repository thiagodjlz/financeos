# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Feature 100% de frontend: **nenhuma tarefa de backend e nenhuma migration** (criterio 30 exige `git status --porcelain` sem nada sob `backend/`). Os `.woff2` da Inter ja estao versionados em `frontend/src/assets/fonts/` — nao ha tarefa de obtencao de fonte, so de declaracao.

## Frontend — fundacao

- [x] **T1** — Declarar em `styles.scss` os 2 blocos `@font-face` da Inter variavel (um por subset, `font-family: 'Inter'`, `font-weight: 400 800`, `font-display: swap`, `src: url('/assets/fonts/inter-<subset>.woff2') format('woff2')` e o `unicode-range` copiado da tabela de `frontend/src/assets/fonts/README.md`), o bloco `:root` com um token por linha da tabela "Tokens extraidos do mockup" e a base `html, body` (`font-family: var(--font-sans)`, `background: var(--bg-app)`, `color: var(--text)`).
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 1, 3, 5, 37
- [x] **T2** — Adicionar em `build.options.assets` a entrada `{ "glob": "**/*", "input": "src/assets", "output": "assets" }`, mantendo a entrada `public` existente.
  - Arquivos: `frontend/angular.json`
  - Criterios: 3
- [x] **T3** — Reescrever os utilitarios globais de `styles.scss` sobre os tokens: `.primary-button`/`.ghost-button`/`.danger-button` (42px, radius 10, 14px/700), botoes de `.row-actions` (32px, radius 8, padding `0 12px`, 12.5px/600), `.status-pill` + modificadores (radius 999, `4px 10px`, 12px/700), `.status-bar`, `.modal-backdrop`/`.modal-card`/`.modal-actions` (superficie, radius 14, sombra do tema e `z-index` acima do trilho fixo), `table`/`th` (`0 12px 12px`, 11.5px/700 uppercase) / `td` (`14px 12px`, 13.5px), `.panel`/`.panel-heading`/`.form-panel`/`.content-grid` (`340px minmax(0,1fr)` gap 20px) / `.compact-list` / `.empty-state`, e os breakpoints 1080px e 680px.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 22, 29, 36
- [x] **T4** — Limpar `app.scss`: remover `#202422`, `#f4f1ea` e a stack de fonte hardcoded, deixando fundo/cor/fonte virem do `body` (ou referenciando `var(--...)`).
  - Arquivos: `frontend/src/app/app.scss`
  - Criterios: 2, 5

## Frontend — shell e menu lateral

- [x] **T5** — Trocar o estado do shell de `collapsed` para `expanded = signal(false)` em `main-layout.ts`: remover `toggleCollapsed`, `registersExpanded`, `toggleRegisters` e `isRegistersActive`; adicionar `expand()`/`collapse()` ligados a mouse/foco, com o `collapse()` do `focusout` so disparando quando o `relatedTarget` esta fora do `aside`; `toggleSettings()` com o trilho recolhido expande o trilho e abre o grupo **sem navegar**. `canSeeSettings()`, `isSettingsActive()` e `logout()` inalterados.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`
  - Criterios: 8, 10, 11, 13
- [x] **T6** — Reescrever `main-layout.html` como trilho: marca "F", navegacao plana (Resumo, Lancamentos, **Categorias** de primeiro nivel; grupo "Cadastros" removido) + grupo "Configuracoes" com Usuarios/Perfis, SVG inline de 20px (`stroke="currentColor"`, `stroke-width="1.8"`) por item e no "Sair", `<span class="nav-label">` sempre presente no DOM (fade de opacidade, sem `*ngIf`), `[attr.title]`/`[attr.aria-label]` em portugues so quando recolhido, rodape com nome do usuario + `FinanceOS · v<versao>`. **Remover o `button.collapse-toggle`.**
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 8, 9, 10, 12, 13, 14
- [x] **T7** — Reescrever `main-layout.scss`: `.sidebar` `position: fixed`, 76px, `z-index: 50`, padding `24px 18px`, `transition: width .18s ease`; expansao pela uniao `.sidebar.expanded, .sidebar:hover, .sidebar:focus-within { width: 236px; box-shadow: var(--shadow-sidebar) }`; itens radius 10px, padding `11px 13px`, gap 14px, ativo `--sidebar-item-active` + branco; `.workspace { margin-left: 76px }` **fixo em todos os estados**; remover a conversao da sidebar em topbar do breakpoint 1080px e reduzir o padding do workspace em 680px.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.scss`
  - Criterios: 6, 7, 9, 13, 14, 36

## Frontend — telas

- [x] **T8** — Aplicar o tema do mockup no Login: card `min(380px, 100%)` radius 16 / padding 32 / `--surface-login` / `--shadow-login`, marca "F" de 44px radius 12 acento, campos radius 10 com `--surface-login-input`, botao "Entrar" acento em largura total (14.5px/700), rodape `FinanceOS · v<versao>` em 12px e faixa de erro legivel. Estrutura de `<form>`/`[(ngModel)]`/`(ngSubmit)` inalterada.
  - Arquivos: `frontend/src/app/features/auth/login/login.html`, `frontend/src/app/features/auth/login/login.scss`
  - Criterios: 15
- [x] **T9** — Adicionar em `dashboard.ts` o `computed` `chart()` derivado de `summary()?.monthlyEvolution` (barras receita/despesa, `polyline` e pontos de saldo, rotulos de mes, geometria do mockup: `chartTop=15`, `chartBottom=185`, `groupW=840/12`, `barW=13`, `barGap=3`) com guardas de divisao por zero (`maxVal || 1`, `balRange || 1`), o helper `maxAmount(type)` para as barras do Detalhamento e o rotulo curto do mes reaproveitando `monthName()`. Nenhuma chamada de API nova.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 18, 19
- [x] **T10** — Reescrever `dashboard.html`: cabecalho (eyebrow 12.5px/700 uppercase, titulo `<mes> <ano>` 30px/800, controles Ano/Mes com o `(change)="load()"` **preservado**), 4 cards na ordem Receitas/Despesas/Pendente/Saldo com quadro tonal de 34px, painel "Evolucao anual" com legenda e `<svg viewBox="0 0 840 210">` alimentado por `chart()`, painel "Detalhamento" com cabecalhos tonais empilhados, barra proporcional por categoria, estado vazio "Sem dados no periodo" e rodape "Total".
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 16, 17, 18, 19, 20
- [x] **T11** — Reescrever `dashboard.scss` com os tokens: grid `repeat(4, minmax(0,1fr))` gap 18px, cards `--surface`/`--border-card`/`--radius-lg`/`--shadow-card`, secao `minmax(0,1fr) 360px`, classes tonais por metrica e colapso em 1080px/680px.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss`
  - Criterios: 17, 20, 36
- [x] **T12** — Adicionar em `transactions.ts` os helpers de apresentacao `statusPillClass(status)` e `signedMoney(transaction)` (prefixo `+ `/`- `). Nenhuma mudanca de fluxo ou de HTTP.
  - Arquivos: `frontend/src/app/features/transactions/transactions.ts`
  - Criterios: 22
- [x] **T13** — Reescrever `transactions.html` no padrao do mockup: grid 340px + tabela em cards brancos, "Cancelar" do formulario de `.danger-button` para **`.ghost-button`** mantendo `type="button"` e sem HTTP, Status como `.status-pill` (verde Pago / amarelo Pendente), Valor a direita com sinal e cor semantica, "Editar" ghost small e "Cancelar" de linha tonal vermelho. Preservar `colgroup`, `table.fixed-layout`, `.row-actions`, toda a estrutura de edicao inline e o modal.
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`
  - Criterios: 21, 22, 23
- [x] **T14** — Reescrever `transactions.scss` com tokens (remover `#b84a3f`), classes `.amount-cell.income/.expense` e larguras de coluna mantidas.
  - Arquivos: `frontend/src/app/features/transactions/transactions.scss`
  - Criterios: 2, 22
- [x] **T15** — Reescrever `categories.html`: formulario de 340px com Nome, Tipo, Cor, **Icone (preservado, D5)** e Situacao, "Cancelar" ghost, bolinha de 10px antes do nome **omitida quando `color` e nulo (D6)**, pill de Situacao (verde "Ativo" / neutro "Inativo") e "Editar" ghost small. Edicao inline e modal preservados.
  - Arquivos: `frontend/src/app/features/categories/categories.html`
  - Criterios: 23, 24
- [x] **T16** — Reescrever `categories.scss` com tokens: `.category-dot`, ajuste do `input[type=color]` (height 42px, padding 4px) e larguras de coluna.
  - Arquivos: `frontend/src/app/features/categories/categories.scss`
  - Criterios: 2, 24
- [x] **T17** — Reescrever `users.html`: "Cancelar" do formulario ghost, Status como pill, "Editar"/"Desativar" ghost small, preservando `field-error`, `.invalid`, a `status-bar dismissible` e a edicao inline com erro por campo na linha.
  - Arquivos: `frontend/src/app/features/users/users.html`
  - Criterios: 23, 25
- [x] **T18** — Reescrever `users.scss` com tokens (remover `#c0392b`), garantindo legibilidade das mensagens de validacao no tema novo.
  - Arquivos: `frontend/src/app/features/users/users.scss`
  - Criterios: 2, 25
- [x] **T19** — Reescrever `profiles.html` no layout do mockup (D10): `.profiles-grid` em `minmax(0,1fr) 320px` com o formulario a esquerda (input Nome `max-width: 320px`) e a lista de perfis a direita, colunas Ver/Incluir/Alterar/Excluir centralizadas, "Editar"/"Excluir" ghost small e cada checkbox envolvido em `<label class="perm-switch">` com rotulo acessivel visualmente oculto — o `<input type="checkbox" [(ngModel)]="permission.canX">` **continua sendo o controle real** (D8). O Cancelar de dois estagios e o `.compact-list button.ghost-button` permanecem.
  - Arquivos: `frontend/src/app/features/profiles/profiles.html`
  - Criterios: 26, 27, 28
- [x] **T20** — Reescrever `profiles.scss`: `.profiles-grid` com as duas colunas e colapso em 1080px; `.perm-switch` desenhando o trilho 38x22 radius 999 (`--accent` ligado / `--switch-off` desligado) e o knob branco de 16px com `--shadow-knob`, transicao 0.15s e `:focus-visible` com anel visivel.
  - Arquivos: `frontend/src/app/features/profiles/profiles.scss`
  - Criterios: 26, 27

## Testes

- [x] **T21** — Ajustar em `main-layout.spec.ts` apenas os 2 testes que dependiam de `.collapse-toggle`: "renders an identifier..." passa a assertar `button.querySelector('svg')` + `title`/`aria-label` em portugues nos botoes recolhidos; "expands the sidebar and opens the group..." remove o clique no toggle (o trilho ja nasce recolhido), continua achando o pai por `aria-label === 'Configuracoes'`, checando que `router.url` nao mudou e trocando a assercao de `.sidebar.collapsed` por `.sidebar.expanded`. Os testes de permissao e de contagem (`navButtons` = 4) ficam como estao.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 8, 9, 10, 11, 12, 33
- [x] **T22** — Trocar o seletor do helper `cancelButton()` de `form button.danger-button` para `form button.ghost-button` nos 3 specs de tela e confirmar que os testes de edicao inline e os `expectNone(() => true)`/`httpMock.verify()` seguem verdes **sem afrouxar nenhuma assercao**. `profiles.spec.ts` nao muda.
  - Arquivos: `frontend/src/app/features/categories/categories.spec.ts`, `frontend/src/app/features/users/users.spec.ts`, `frontend/src/app/features/transactions/transactions.spec.ts`
  - Criterios: 21, 23, 33

## Fechamento e validacao

- [x] **T23** — Revalidar, uma a uma, as larguras de `<colgroup>` e da coluna de acoes das 3 tabelas com a densidade nova (`td` `14px 12px`, 13.5px, botoes de 32px), medindo no DevTools que entrar em modo de edicao nao altera a largura de nenhuma coluna nem a altura da coluna de acoes. Risco principal do plano.
  - Arquivos: `frontend/src/app/features/transactions/transactions.scss`, `frontend/src/app/features/categories/categories.scss`, `frontend/src/app/features/users/users.scss`
  - Criterios: 23
- [x] **T24** — Varredura final de conformidade: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` sem saida; `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` sem `<link>`/`@import`/CDN; `git diff frontend/package.json` vazio; `git status --porcelain` sem nenhuma linha sob `backend/`; revisao do diff dos `.html` confirmando que nenhum texto existente mudou de grafia (D7) e que nenhum texto fora do portugues entrou.
  - Arquivos: — (verificacao; sem edicao propria, correcoes voltam ao arquivo culpado)
  - Criterios: 2, 4, 30, 31, 35
- [x] **T25** — Rodar `cd frontend && npm test` e `npm run build` (conferindo o budget `anyComponentStyle` de 8kB por `.scss` de componente, especialmente `main-layout.scss` e `dashboard.scss`) e `cd backend && ./mvnw test`.
  - Arquivos: — (verificacao)
  - Criterios: 33, 34
- [ ] **T26** — Validacao manual em `http://localhost`: roteiro funcional (a)..(g) do criterio 32 com a aba Network aberta; responsividade em 1440px, 1080px e 680px nas 6 telas (sem rolagem horizontal da pagina, sem texto cortado, grids colapsando, conteudo apos os 76px do trilho); contraste >= 4.5:1 no texto principal/secundario sobre branco, no texto branco do botao primario, nos itens da sidebar e no texto de cada status pill.
  - Arquivos: — (validacao no ambiente local, etapa `/pipeline:verify`)
  - Criterios: 32, 36, 37

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Token CSS em `:root` para cada valor da tabela do mockup | T1 |
| 2 | Nenhuma cor literal nos `.scss` de `frontend/src/app` | T4, T14, T16, T18, T24 |
| 3 | Inter self-hosted: 2 `@font-face` por subset + `assets` no `angular.json` | T1, T2 |
| 4 | Nenhum recurso externo (Google Fonts / CDN) carregado | T24 |
| 5 | Fonte realmente aplicada (`document.fonts.check`, `body` em Inter) | T1, T4 |
| 6 | Sidebar como trilho fixo 76px -> 236px, sombra e transicao 0.18s | T7 |
| 7 | Sidebar sobrepoe o conteudo (`margin-left` fixo em 76px) | T7 |
| 8 | Toggle de minimizar deixa de existir | T5, T6, T21 |
| 9 | SVG inline de 20px por item + cores de item ativo/inativo | T6, T7, T21 |
| 10 | Nav final: Resumo, Lancamentos, Categorias, grupo Configuracoes | T5, T6, T21 |
| 11 | Grupo Configuracoes: recolhido expande e abre sem navegar | T5, T21 |
| 12 | Visibilidade do menu por permissao preservada | T6, T21 |
| 13 | Trilho acessivel por teclado (`:focus-within`, `title`/`aria-label`) | T5, T6, T7 |
| 14 | Rodape/rotulos so com a sidebar expandida; "Sair" continua deslogando | T6, T7 |
| 15 | Tela de Login no tema do mockup | T8 |
| 16 | Resumo — cabecalho e controles Ano/Mes com `(change)` preservado | T10 |
| 17 | Resumo — 4 cards na ordem atual, grid de 4 colunas, icone tonal | T10, T11 |
| 18 | Resumo — `<svg viewBox="0 0 840 210">` de evolucao anual + legenda | T9, T10 |
| 19 | Grafico com dados reais de `monthlyEvolution`, ano vazio sem erro | T9, T10 |
| 20 | Resumo — painel "Detalhamento" de 360px com barras proporcionais | T10, T11 |
| 21 | Lancamentos — grid 340px e "Cancelar" ghost sem HTTP | T13, T22 |
| 22 | Lancamentos — tabela, pill de Status e coluna Valor com sinal/cor | T3, T12, T13, T14 |
| 23 | Edicao inline preservada nas 3 telas, sem mudar largura de coluna | T13, T15, T17, T22, T23 |
| 24 | Categorias — formulario com Icone, bolinha condicional, pill | T15, T16 |
| 25 | Usuarios — formulario, pills, acoes e mensagens de validacao | T17, T18 |
| 26 | Perfis — layout invertido (formulario a esquerda, lista 320px) | T19, T20 |
| 27 | Perfis — checkboxes viram switches, mesma semantica e payload | T19, T20 |
| 28 | Perfis — "Cancelar" de dois estagios continua funcionando | T19 |
| 29 | Componentes globais consistentes (botoes, pills, status-bar, modal) | T3 |
| 30 | Nenhum arquivo de backend alterado, nenhuma migration nova | T24 |
| 31 | Nenhuma dependencia npm nova | T24 |
| 32 | Roteiro funcional manual (a)..(g) verde | T26 |
| 33 | `npm test` verde com ajuste so de seletor | T21, T22, T25 |
| 34 | `npm run build` sem warning novo de budget e `./mvnw test` verde | T25 |
| 35 | Texto continua em portugues e nenhum rotulo muda de grafia | T24 |
| 36 | Responsividade em 1440/1080/680 sem rolagem horizontal | T3, T7, T11, T26 |
| 37 | Contraste minimo de 4.5:1 nos pares do criterio | T1, T26 |

## Lacunas

- **Nenhum criterio de aceite ficou sem tarefa** — os 37 estao cobertos por ao menos uma das 26 tarefas, e nenhuma tarefa existe sem criterio associado.
- **Regra de negocio so no frontend: nao se aplica.** Nenhum dos 37 criterios descreve regra de negocio — a issue e exclusivamente de apresentacao e o criterio 30 proibe tocar `backend/`. Os criterios que preservam comportamento (21, 23, 27, 28) sao de nao-regressao de UX; a validacao e a autorizacao correspondentes continuam no backend (`accessControl.require` + Bean Validation), intocadas.
- **Icone do grupo "Configuracoes" nao existe no mockup.** O criterio 9 exige o SVG "exatamente com os `path`/`rect`/`circle` do mockup" para Resumo, Lancamentos, Categorias, Usuarios, Perfis e "Sair" — mas o mockup tem navegacao plana (D1) e, portanto, **nao desenha icone para o pai "Configuracoes"**, que so existe no app por causa da excecao da Decisao 2. O plano resolve reutilizando o SVG da tela "Notas de design" do mockup. Nao ha valor visual inventado, mas o criterio 9 nao cobre esse item — vale registrar que a verificacao dele nao pode exigir correspondencia exata para o pai do grupo.
- **`z-index` do modal vs. trilho fixo.** O criterio 29 pede o `.modal-card` "acima do conteudo" e o criterio 6 poe a sidebar em `z-index: 50` com `position: fixed`. O plano nao fixa o `z-index` do `.modal-backdrop`/`.modal-card`; se ele ficar abaixo de 50, o trilho aparece por cima do backdrop e o criterio 29 reprova silenciosamente (nenhum teste automatizado pega). Tratado como parte de T3, mas nao estava explicito no plano.
- **Criterios 13 e 27 dependem so de validacao manual na parte de teclado.** A expansao por `:focus-within` (13) e o acionamento do switch por Espaco/Enter com foco visivel (27) nao tem teste automatizado previsto no plano — a evidencia sera manual na etapa `/pipeline:verify`. Nao e criterio descoberto, mas a cobertura e mais fraca que a dos demais.
