# Notas de implementacao

Branch: `feature/issue-35-redesign-interface` (mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 25 de 26 concluidas (ver `tasks.md`). Aberta: **T26** (validacao manual em `http://localhost` — roteiro funcional, responsividade e contraste), que e por definicao da etapa `/pipeline:verify`.

Verificacoes ja rodadas:

- `cd frontend && npm test` -> 12 arquivos / **66 testes verdes**.
- `cd frontend && npm run build` -> sucesso, **sem nenhum warning de budget** (`styles.css` 7.73 kB; maior `.scss` de componente bem abaixo dos 8 kB de `anyComponentStyle`); `dist/frontend/browser/assets/fonts/` sai com os dois `.woff2` e o `@font-face` compilado mantem `src:url(/assets/fonts/inter-latin.woff2)` (caminho absoluto, sem reprocessamento do bundler).
- `cd backend && ./mvnw test` -> **30 testes verdes** (nenhum arquivo de backend tocado).
- `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` -> **sem saida** (criterio 2).
- `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` -> **sem saida** (criterio 4).
- `git diff frontend/package.json frontend/package-lock.json` -> **vazio** (criterio 31); `git status --porcelain` -> **nenhuma linha sob `backend/`** e nenhuma migration nova (criterio 30).

## Arquivos alterados

### Fundacao

- `frontend/src/styles.scss` — reescrito: 2 blocos `@font-face` da Inter variavel (um por subset, `font-weight: 400 800`, `font-display: swap`, `unicode-range` copiado de `frontend/src/assets/fonts/README.md`), bloco `:root` com todos os tokens do mockup (superficies, sidebar, acento, textos, bordas, semanticas com variantes tonais, neutro, sombras, raios 8/9/10/12/14/16/999 e degraus de tipografia), base `html, body` (`var(--font-sans)`, `var(--bg-app)`, `var(--text)`) e restyle de todos os utilitarios globais: botoes 42px/radius 10/14px-700, botoes de `.row-actions` 32px/radius 8/`0 12px`/12.5px-600, `.status-pill` + modificadores `pill-income`/`pill-pending`/`pill-expense`/`pill-neutral`, `.status-bar`, `th` (`0 12px 12px`, 11.5px/700 uppercase) / `td` (`14px 12px`, 13.5px), `.panel`/`.panel-heading`/`.form-panel`/`.content-grid` (`340px minmax(0,1fr)` gap 20px), `.compact-list`/`.list-row`, `.empty-state`, `.page-title`, `.modal-backdrop`/`.modal-card` e breakpoints 1080px/680px.
- `frontend/angular.json` — segunda entrada em `build.options.assets` (`src/assets` -> `assets`), mantendo `public`.
- `frontend/src/app/app.scss` — so `display: block; min-height: 100vh`; fundo, cor e fonte passam a vir do `body`.

### Shell / menu lateral

- `frontend/src/app/layout/main-layout/main-layout.ts` — `collapsed` vira `expanded = signal(false)`; removidos `toggleCollapsed`, `registersExpanded`, `toggleRegisters` e `isRegistersActive`; adicionados `expand()`, `collapse()`, `onMouseLeave()` e `onFocusOut()`; `toggleSettings()` com o trilho recolhido expande e abre o grupo sem navegar. `canSeeSettings()`, `isSettingsActive()` e `logout()` inalterados.
- `frontend/src/app/layout/main-layout/main-layout.html` — trilho: marca "F" de 38px, navegacao plana (Resumo, Lancamentos, **Categorias** no primeiro nivel; "Cadastros" removido) + grupo "Configuracoes" com Usuarios/Perfis, SVG inline de 20px por item e no "Sair" (copiados do mockup), `<span class="nav-label">` sempre no DOM (fade), `title`/`aria-label` em portugues so quando recolhido, rodape com nome do usuario + `FinanceOS · v<versao>`. `button.collapse-toggle` **removido**.
- `frontend/src/app/layout/main-layout/main-layout.scss` — `.sidebar` fixa 76px, `z-index: 50`, padding `24px 18px`, `transition: width .18s ease`; expansao pela uniao `.expanded, :hover, :focus-within` (236px + `--shadow-sidebar`); itens radius 10/padding `11px 13px`/gap 14; `.workspace { margin-left: 76px }` fixo; conversao em topbar do breakpoint 1080px removida.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — 2 testes ajustados (icone SVG + `title`/`aria-label` no lugar do `nav-abbr`; clique no grupo recolhido sem passar pelo `.collapse-toggle`, assertando `.sidebar.expanded` e `router.url` inalterado). Os testes de permissao e de contagem seguem intactos.

### Telas

- `frontend/src/app/features/auth/login/login.html` — so a classe do `<form>` (sai `panel`, fica `form-panel auth-card`, para o card de login nao herdar a superficie/sombra do `.panel`). Estrutura de `ngModel`/`ngSubmit` intacta.
- `frontend/src/app/features/auth/login/login.scss` — card `min(380px,100%)`, radius 16, padding 32, `--surface-login`, borda `--border-card`, `--shadow-login`; marca "F" 44px/radius 12/acento; inputs `12px 14px` com `--surface-login-input`; "Entrar" acento em largura total 14.5px/700; rodape 12px.
- `frontend/src/app/features/dashboard/dashboard.ts` — `computed` `chart()` sobre `summary()?.monthlyEvolution` com a geometria do mockup (`chartTop=15`, `chartBottom=185`, `groupW=840/12`, `barW=13`, `barGap=3`) e guardas `maxValue || 1` / `balanceRange || 1`; helper `maxAmount(type)`; `shortMonthLabel()` reaproveitando `monthName()`. Nenhuma chamada de API nova.
- `frontend/src/app/features/dashboard/dashboard.html` — cabecalho (eyebrow, titulo `<mes> <ano>`, controles Ano/Mes com `(change)="load()"` preservado), 4 cards na ordem Receitas/Despesas/Pendentes/Saldo com quadro tonal de 34px e SVG de 17px, painel "Evolucao anual" com legenda e `<svg viewBox="0 0 840 210">` (barras, `polyline`, pontos e rotulos em `y=205`), painel "Detalhamento" com cabecalhos tonais, barra de 6px proporcional por categoria, "Sem dados no periodo" e rodape "Total".
- `frontend/src/app/features/dashboard/dashboard.scss` — grid `repeat(4, minmax(0,1fr))` gap 18px, cards com tokens, secao `minmax(0,1fr) 360px`, classes tonais por metrica, cores do SVG por token (`fill`/`stroke`), colapso em 1080px (2 colunas de card) e 680px (1 coluna).
- `frontend/src/app/features/transactions/transactions.ts` — helpers `statusPillClass(status)` e `signedMoney(transaction)`.
- `frontend/src/app/features/transactions/transactions.html` — titulo de pagina, "Cancelar" do formulario de `danger` para **ghost** (segue `type="button"`, sem HTTP), Status como pill (verde Pago / amarelo Pendente / neutro nos demais), coluna Valor a direita com sinal e cor semantica. `colgroup`, `fixed-layout`, `.row-actions`, edicao inline e modal preservados.
- `frontend/src/app/features/transactions/transactions.scss` — `#b84a3f` removido; `.amount-cell.income/.expense`; larguras de coluna revalidadas.
- `frontend/src/app/features/categories/categories.html` — titulo de pagina; Cor e Icone lado a lado em `.two-cols` (Icone preservado, D5) e Situacao abaixo; "Cancelar" ghost; bolinha de 10px antes do nome so quando `category.color` existe (D6); pill de Situacao verde/neutro.
- `frontend/src/app/features/categories/categories.scss` — `.category-dot`, `.category-name`, `input[type=color]` 42px/padding 4px, larguras de coluna.
- `frontend/src/app/features/users/users.html` — titulo de pagina; "Cancelar" ghost; pill de Status; `field-error`, `.invalid`, `status-bar dismissible` e edicao inline com erro por campo preservados.
- `frontend/src/app/features/users/users.scss` — `#c0392b` trocado por `var(--expense)` / `var(--expense-on-soft)` (legenda de validacao em 12px/600, legivel sobre branco).
- `frontend/src/app/features/profiles/profiles.html` — layout invertido do mockup (D10): formulario a esquerda (Nome com `max-width: 320px`), lista de perfis em coluna de 320px a direita com acoes em `.row-actions` (ghost small); colunas Ver/Incluir/Alterar/Excluir centralizadas; cada checkbox envolvido em `<label class="perm-switch">` com rotulo visualmente oculto — o `<input type="checkbox" [(ngModel)]="permission.canX">` continua sendo o controle real (D8).
- `frontend/src/app/features/profiles/profiles.scss` — `.profiles-grid` `minmax(0,1fr) 320px` com colapso em 1080px; `.perm-switch` desenhando o trilho 38x22 radius 999 (`--accent` / `--switch-off`) e o knob branco de 16px com `--shadow-knob`, transicao 0.15s e `:focus-visible` com anel visivel.
- `frontend/src/app/features/{categories,users,transactions}/*.spec.ts` — apenas o seletor do helper `cancelButton()` (`form button.danger-button` -> `form button.ghost-button`). Nenhuma assercao afrouxada; `httpMock.verify()` e `expectNone(() => true)` intactos. `profiles.spec.ts` nao mudou.

### Ja versionados antes desta rodada (nao alterados)

- `frontend/src/assets/fonts/inter-latin.woff2`, `inter-latin-ext.woff2`, `README.md` — entram no commit como novos (a pasta estava untracked).

## Decisoes

- **Icone do pai "Configuracoes"**: o mockup tem navegacao plana e nao desenha icone para pai de grupo. Conforme o plano, foi reutilizado o SVG da tela "Notas de design" do mockup (`rect x=5 y=3 w=14 h=18 rx=2` + 3 `path` de linhas). Nenhum desenho novo foi inventado — mas a verificacao do criterio 9 nao pode exigir correspondencia exata para esse item, ja que ele nao existe no mockup.
- **`z-index` do modal acima do trilho**: `.modal-backdrop` recebeu `z-index: 200` e `.modal-card` `z-index: 201`, explicitamente acima do `z-index: 50` da sidebar fixa (lacuna apontada em `tasks.md`; nenhum teste automatizado pegaria isso).
- **Backdrop e sombra do modal**: o mockup nao desenha modal (D4). Em vez de inventar valores, `--backdrop` e derivado do token da sidebar (`oklch(21% 0.02 260 / 45%)`, mantendo os 45% de opacidade do backdrop atual) e `--shadow-modal` e um alias de `--shadow-login`.
- **`.status-bar` e mensagens de validacao**: tambem sem contraparte no mockup — adotam o par tonal de despesa (`--expense-soft` / `--expense-on-soft`), que ja vem do mockup e tem contraste folgado.
- **`.danger-button`** deixou de ser vermelho solido e passou a ser o tonal `dangerSmBtnStyle` do mockup (`--expense-soft` / `--expense-on-soft`). Ele agora so aparece nos botoes de linha ("Cancelar" da tabela de Lancamentos e "Sair" da edicao inline) — nos formularios o "Cancelar" virou ghost, conforme a decisao "o design prevalece". **Nenhum handler mudou**: continua `type="button"` e sem HTTP.
- **Colapso do `mouseleave` com foco dentro do trilho**: `onMouseLeave()` nao recolhe se `document.activeElement` estiver dentro do `aside`. Sem isso, tirar o mouse depois de abrir o grupo "Configuracoes" pelo teclado esconderia os subitens (que dependem de `expanded()`) enquanto o CSS mantinha o trilho aberto por `:focus-within`. E a mesma protecao que o plano ja pedia para o `focusout`, aplicada tambem ao mouse.
- **Ordem dos campos de Categorias**: o mockup pareia "Cor | Situação"; como o campo "Icone" e preservado (D5) e o criterio 24 lista Nome, Tipo, Cor, Icone e Situacao nessa ordem, o par de duas colunas ficou "Cor | Icone" e Situacao seguiu abaixo — mantem a ordem atual da tela e o padrao de duas colunas do mockup.
- **Larguras de coluna** (criterio 23): com `td` em `14px 12px`/13.5px e botoes de linha com padding `0 12px` (em vez dos 90px fixos anteriores), as larguras foram recalculadas — Lancamentos `col-amount` 110 -> **130px** (cabe `- R$ 12.480,00`) e `col-actions` 210 -> **200px**; Categorias `col-situation` 140 -> **150px** (pill) e `col-actions` 210 -> **200px**; Usuarios inalterada (210px comporta "Editar" + "Desativar"). Como as tabelas seguem `table-layout: fixed` + `<colgroup>`, a largura nao depende do conteudo: entrar em edicao nao muda coluna nenhuma.
- **Titulos de pagina**: Lancamentos, Categorias, Usuarios e Perfis ganharam o `<h2 class="page-title">` do mockup. Nenhum rotulo existente mudou de texto ou de grafia (D7); os titulos novos seguem a grafia sem acento ja usada no app.
- **Legenda do painel "Evolucao anual"**: o texto "N lancamentos no periodo" do cabecalho deu lugar a legenda Receita/Despesa/Saldo, como no mockup e no criterio 18.

## Desvios em relacao ao plano e as tarefas

- **T8** so precisou de uma linha em `login.html` (troca da classe do `<form>`); todo o resto do tema do Login coube no `login.scss`. A estrutura de `<form>`/`[(ngModel)]`/`(ngSubmit)` ficou intacta, como a tarefa pedia.
- **T5** ganhou um metodo alem dos previstos (`onMouseLeave`), pelo motivo descrito em "Decisoes" — o plano ja apontava o risco de estado conflitante entre os tres gatilhos de expansao.
- **T23** foi feita na parte que depende de codigo (recalculo e ajuste das larguras nos 3 `.scss`, com `table-layout: fixed` garantindo estabilidade entre leitura e edicao). A **medicao no DevTools** citada na tarefa nao e executavel nesta etapa (sem navegador) e entra junto com o roteiro manual da T26 na etapa `/pipeline:verify`.
- **T26** permanece **nao concluida** de proposito: e a validacao manual em `http://localhost` (roteiro (a)..(g), responsividade em 1440/1080/680 e contraste), que a esteira executa na etapa `/pipeline:verify` com o usuario.
- Nenhuma tarefa nova precisou ser acrescentada e nenhum ponto em aberto da spec bloqueou a implementacao.

## Duvidas / pontos a confirmar na validacao

- O `assets` do `angular.json` copia `src/assets/**/*`, entao o `README.md` da pasta de fontes tambem vai para `dist` e fica acessivel em `/assets/fonts/README.md`. Foi mantido o glob do plano (`**/*`); se preferir nao publicar o README, o glob pode virar `**/*.woff2`.
- Contraste (criterio 37) e a expansao por teclado (criterio 13) so tem evidencia manual — checar no DevTools/Lighthouse durante o `/pipeline:verify`.

## Rodada de correcao pos-verificacao (2026-07-27)

Ajustes feitos depois da etapa `/pipeline:verify`, que reprovou 1 criterio e registrou 2 achados fora dos criterios. Todos re-testados: `npm test` 66 verdes, `npm run build` sem warnings.

- **Criterio 9 (NAO ATENDIDO -> corrigido)**: `main-layout.scss` sobrescrevia os icones dos subitens de "Configuracoes" para 18px (`.nav-children button svg`), enquanto o HTML e o criterio pedem 20px. As duas declaracoes foram removidas. A reducao era so um reforco visual de aninhamento e nao tinha justificativa funcional: `.nav-children` so e renderizado com `settingsExpanded() && expanded()`, ou seja, apenas com o trilho em 236px — nunca no estado colapsado de 76px, entao nao havia risco de estouro que a reducao resolvesse. O `font-size: 13px` dos rotulos dos subitens foi mantido (nao e objeto do criterio 9).
- **`::selection` com cor literal**: `styles.scss` usava `oklch(85% 0.06 262)` direto na regra. Virou o token `--accent-selection` no `:root`, consumido por `var()`. Alinha a regra a frase do criterio 2 (toda cor nasce em `:root`), sem mudar o valor renderizado.
- **Nomes de teste desatualizados**: `categories.spec.ts` e `users.spec.ts` ainda diziam "...e Cancelar vermelho" depois de o botao de formulario virar ghost. Renomeados para "...e Cancelar secundario". Nenhuma assercao dependia da cor, entao so o titulo mudou.

### Duvida da etapa anterior, resolvida

- **Glob de assets do `angular.json`**: passou de `**/*` para `**/*.woff2`. O `README.md` da pasta de fontes deixa de ser publicado; os dois `.woff2` continuam saindo no bundle e respondendo 200 em `/assets/fonts/`.
