---
issue: 65
url: https://github.com/thiagodjlz/financeos/issues/65
title: "Personalizar saudação do Painel Financeiro"
slug: saudacao-painel-financeiro
domains: [dashboard, auth, users]
target: main
stage: validated
branch: feature/issue-65-saudacao-painel-financeiro
created: 2026-09-20
---

# Personalizar saudação do Painel Financeiro

## Historia

Como operador autenticado do FinanceOS, quero ser recebido na aba Resumo por uma saudacao personalizada com o meu nome e contextualizada com o periodo do dia, para que a entrada no sistema pareca uma recepcao humana e nao a abertura de uma tela estatica de numeros.

## Contexto

A issue pede uma area de boas-vindas no topo do **Painel Financeiro (aba Resumo, `/dashboard`)**: ao abrir a tela, o sistema identifica o operador logado, le o horario local da sessao, determina o periodo do dia e exibe uma frase personalizada em **duas linhas** — a primeira uma saudacao curta com o nome (maior destaque visual), a segunda um complemento de contexto financeiro (peso visual menor). O tom pedido e "leve, descontraido e humano, sem perder o carater profissional"; a issue lista explicitamente formulacoes a **evitar** ("Bom dia, usuario.", "Bem-vindo ao sistema FinanceOS.", "Boa noite, Thiago. Confira o resumo financeiro do periodo." etc.).

A issue menciona uma "imagem de referencia anexada", mas **nao ha anexo nem link no corpo nem nos comentarios** (verificado com `gh issue view 65`). Nao ha, portanto, mockup: a **fonte da verdade visual e a tela atual**, ja no repositorio.

### Estado atual da tela (`frontend/src/app/features/dashboard/`)

- `dashboard.html` comeca com `<header class="topbar">` contendo um `<div>` com `<p class="eyebrow">Painel financeiro</p>` (renderizado em caixa alta por `text-transform: uppercase` em `.eyebrow`) e `<h2>{{ formatMonthName(period.month) | titlecase }} {{ period.year }}</h2>`; a direita, `.period-controls` com o `input` de Ano e o `select` de Mes, ambos recarregando o resumo no `(change)`.
- Em seguida vem `.metric-grid` com os 4 cards (Receitas, Despesas, Pendente, Saldo), depois `.panels-grid` com "Evolucao anual" (SVG desenhado a mao) e "Detalhamento".
- Estilo: `dashboard.scss` com `@media` em 1080px e 680px (em 680px `.topbar` e `.period-controls` viram coluna e o `h2` cai para 24px). Breakpoints do projeto sao um conjunto unico documentado em `styles.scss`: 1080px (`--bp-desktop`), 680px (`--bp-mobile`), 480px (`--bp-compact`).
- Tipografia por tokens (`--fs-dashboard-title: 30px`, `--fs-body: 14px`, `--fs-sm-btn: 12.5px`, `--text-muted`), sem cor literal em `frontend/src/app/**/*.scss`.
- O componente ja implementa `OnInit`, `AfterViewInit` e `OnDestroy` (o `ResizeObserver` do grafico e desconectado no destroy) — ou seja, ja existe um ponto de limpeza de recurso onde o mecanismo de virada de faixa se encaixa.
- **Nao existe hoje nenhum componente ou utilitario de saudacao** (`rg -i "saudac|greeting|bom dia|boa tarde" frontend/src` nao retorna nada) e **nao ha internacionalizacao** no projeto (UI 100% em portugues, conforme CLAUDE.md).
- Utilitarios de data/hora existentes em `frontend/src/app/core/formatters.ts`: `monthName`, `longMonthName`, `money`, `shortMoney`, `transactionStatusLabel` — nenhum trata hora do dia.

### Operador autenticado: de onde vem o nome (ja existe, nada novo)

- `GET /auth/me` retorna `MeResponse(name, email, superAdmin, permissions[])` (`knowledge/auth-and-permissions.md`).
- `frontend/src/app/core/services/auth.service.ts` expoe o signal `me: Signal<MeResponse | null>`, preenchido por `fetchMe()`.
- O `authGuard`/`permissionGuard` fazem `await authService.ensureProfileLoaded()` **antes** de ativar a rota `/dashboard`, entao o `me()` ja esta resolvido quando o componente inicializa.
- Regra de exibicao de nome ja estabelecida: `main-layout.html` mostra o **nome completo** no rodape da sidebar (`<p class="current-user" [attr.title]="me.name">`). Essa regra continua valendo — a saudacao e o unico lugar que passa a usar o **primeiro nome**, conforme pedido explicito da issue ("Thiago Dos Santos" -> "Thiago").
- O usuario administrador de producao tem nome fixo `Administrator` (`knowledge/auth-and-permissions.md`), ou seja, primeiro nome "Administrator" — caso normal, sem tratamento especial.

### Back-end: nao ha regra de negocio nova a impor

A convencao do projeto (CLAUDE.md) e que **toda regra de negocio e validacao vive no back-end**. Aqui nao ha regra de negocio: o texto da saudacao e **apresentacao** — nao altera calculo, nao valida entrada do usuario, nao decide permissao e nao produz dado persistido. O unico dado de dominio consumido (`name` do operador autenticado) **ja e exposto** por `GET /auth/me`, e a propria issue determina reutilizar a informacao existente e nao criar persistencia. Logo, esta feature e **100% front-end**: nenhum endpoint, DTO, entidade, migration ou validacao de backend e criado ou alterado (criterio 37).

### Regras existentes que restringem esta feature

- **Resumo** (`knowledge/dashboard.md`, issues #16/#18/#48/#54): totais (`totalIncome`, `totalExpense`, `pendingExpense`, `balance`), recarga automatica com **uma unica** `GET /api/dashboard/summary` por troca de Ano/Mes, ordem dos 4 cards, painel "Detalhamento" com contagem de categorias, grafico "Evolucao anual" com escala unica, `monthAxisLabel` e informativo por mes — nada disso pode mudar.
- **Mobile** (issue #54): sem rolagem horizontal, campos com >= 16px em <= 480px, alvos de toque >= 44px, gaveta de navegacao, `env(safe-area-inset-*)`, sem `!important` em `frontend/src/**/*.scss`.
- **Design system** (issue #35): toda medida/cor nova nasce como custom property em `frontend/src/styles.scss`; `frontend/src/app/**/*.scss` sem cor literal; sem dependencia nova de UI; tema unico.
- **Texto em portugues acentuado** em toda a UI.

## Decisoes

- **2026-09-20 — Criterio dependente de comportamento nativo nao reprova a feature.** Criterios verificaveis apenas por emulacao no DevTools (viewport de 390x844, quebra de texto, toque) trazem a ressalva "(verificavel por emulacao — comportamento nativo nao reproduzido)" e nao sao motivo de reprovacao na etapa `/pipeline:verify` — padrao acordado com o usuario na issue #54.
- **2026-09-20 — PA1: a saudacao se atualiza sozinha na virada de faixa.** Decisao do usuario: se a tela ficar aberta e o relogio local cruzar a fronteira de um periodo (ex.: 17:59 -> 18:00), a saudacao passa a refletir o **novo** periodo **sem exigir recarregar a pagina** — quem deixa o Resumo aberto no fim da tarde nao pode continuar sendo saudado com "boa tarde" as 19h. A atualizacao acontece **na virada da faixa**, nao a cada instante: enquanto o periodo nao muda, o texto permanece exatamente o mesmo (criterio 8). O mecanismo (timer/`interval`/`signal` de relogio) e detalhe do plano, mas esta amarrado por criterios de qualidade: encerrado no `ngOnDestroy` (criterio 10, junto do `ResizeObserver` que ja e desconectado la) e sem re-render a cada tick (criterio 36).
- **2026-09-20 — PA2: catalogo unico, sem lista separada para mobile.** Decisao do usuario: existe **um so** conjunto de mensagens por periodo, com limite de ~60 caracteres por linha (criterio 12) para caber bem ate 390px. A issue permitia frases mais curtas em viewports pequenos ("se necessario"), mas um segundo catalogo dobraria a manutencao e o risco de divergencia de tom; o limite de caracteres somado a quebra natural de texto (criterios 25 e 26) resolve o espaco no celular.
- **2026-09-20 — Derivacao da issue (nao e escolha do usuario): posicao da saudacao.** A issue apresenta uma hierarquia sugerida (PAINEL FINANCEIRO -> saudacao -> Set. 2026 -> filtros -> cards) e diz explicitamente para **nao** considera-la obrigatoria. Esta spec adota essa ordem por ser a que preserva a hierarquia atual sem criar bloco solto, e a fixa no criterio 15 — e o ponto a ajustar caso o plano proponha outro arranjo.
- **2026-09-20 — Derivacao da issue: frase estavel dentro do mesmo periodo.** A frase e sorteada no carregamento do componente e **nao muda** enquanto o operador permanece na tela e o periodo nao vira (trocar Ano/Mes, abrir o informativo do grafico ou qualquer re-renderizacao mantem a mesma frase). Sortear dentro do template faria a frase piscar a cada ciclo de deteccao de mudanca do Angular — efeito que a issue nao pede e que contraria "simples e previsivel". Na virada da faixa ha um unico novo sorteio, agora no catalogo do periodo entrante (PA1).
- **2026-09-20 — Derivacao da issue: par de linhas fixo.** Cada mensagem do catalogo e um **par** (linha 1 + linha 2) escrito junto, e nao duas listas sorteadas independentemente — os exemplos da issue sao pares coerentes ("Ora, ora... {nome} por aqui a essa hora?" / "Plantao financeiro ativado!"); sorteio independente produziria combinacoes sem sentido.

## Criterios de aceite

### Funcional

- [x] 1. Ao abrir `/dashboard` com sessao valida, a tela exibe um bloco de saudacao contendo o nome do operador autenticado, obtido do `me()` ja carregado pelo `AuthService` (`GET /auth/me`) — **sem nenhuma requisicao HTTP nova**: na aba Network, carregar `/dashboard` continua disparando apenas a `GET /api/dashboard/summary` (mais o `GET /api/auth/me` que ja existe hoje, quando o perfil ainda nao foi carregado).
- [x] 2. O nome exibido e o **primeiro nome**: dada a funcao pura exportada que extrai o nome de exibicao, `"Thiago Dos Santos"` -> `"Thiago"`, `"Thiago"` -> `"Thiago"`, `"  Ana  Paula  "` -> `"Ana"`, preservando acentuacao e a capitalizacao como cadastrada (sem forcar caixa alta/baixa). Coberto por teste unitario.
- [x] 3. Quando o nome nao esta disponivel (`me()` nulo ou `name` vazio/so espacos), a saudacao continua sendo renderizada numa versao gramaticalmente correta **sem nome** e **nunca** exibe `undefined`, `null`, `{nome}` ou pontuacao orfa do tipo `"Olá, !"`. Coberto por teste unitario com `me()` nulo.
- [x] 4. O periodo do dia e determinado pelo **horario local da sessao** (hora do relogio do dispositivo, ex.: `Date#getHours()`), sem depender de UTC, de horario vindo da API ou de qualquer configuracao manual. Verificavel: a funcao de periodo recebe a hora local como entrada e nenhuma chamada a API alimenta essa decisao.
- [x] 5. Existem exatamente **quatro** periodos e as faixas sao exatamente estas — coberto por teste unitario nas bordas: `00:00` e `05:59` -> madrugada; `06:00` e `11:59` -> manha; `12:00` e `17:59` -> tarde; `18:00` e `23:59` -> noite.
- [x] 6. Cada um dos quatro periodos tem **no minimo 5 mensagens** distintas no catalogo (estrutura conceitual da issue), cada mensagem sendo um par linha 1 + linha 2. Coberto por teste unitario que percorre os quatro periodos.
- [x] 7. A escolha e pseudoaleatoria dentro do catalogo do periodo: **todas** as mensagens do periodo sao alcancaveis (teste unitario varrendo o indice/semente de escolha em todo o intervalo possivel cobre 100% das mensagens do periodo) e duas entradas consecutivas na tela podem apresentar frases diferentes — a tela nao exibe sempre a mesma frase.
- [x] 8. **Dentro do mesmo periodo a frase nao muda**: apos trocar o Ano e depois o Mes em `/dashboard` (e apos abrir/fechar o informativo do grafico), o texto das duas linhas continua identico ao exibido no carregamento (Decisao 5).
- [x] 9. **Virada de faixa atualiza a saudacao sozinha** (Decisao 2): com a tela aberta, ao cruzar a fronteira de um periodo o texto passa a ser do periodo entrante **sem recarregar a pagina**. Verificavel em teste unitario/de componente com relogio controlado (`jasmine.clock()` ou fonte de tempo injetada): posicionado o relogio em `17:59`, o texto renderizado pertence ao catalogo da tarde; avancado o relogio para `18:00` e disparada a deteccao de mudanca, o texto renderizado passa a pertencer ao catalogo da noite — e a troca ocorre **apenas** na virada (avancar de `17:30` para `17:59`, dentro da mesma faixa, mantem o texto identico).
- [x] 10. **Sem vazamento de timer/subscription**: o mecanismo do criterio 9 e encerrado no `ngOnDestroy` do componente do Resumo (junto da desconexao do `ResizeObserver` que ja existe la). Verificavel em teste: apos `fixture.destroy()`, avancar o relogio alem de uma virada de faixa nao executa mais o callback (nenhuma tarefa pendente, nenhuma atualizacao de estado) — com `jasmine.clock()`, `tick` pos-destroy nao altera nada e nao lanca erro.
- [x] 11. Nao existe cadastro, tela de configuracao ou parametro para a mensagem, e **nenhuma persistencia em banco** e criada para controlar qual frase foi exibida: nenhuma migration `V<n>__*.sql` nova, nenhuma tabela/coluna nova e nenhum endpoint novo. Se a solucao usar `localStorage`/`sessionStorage` para evitar repetir a ultima frase, limpar o armazenamento do navegador **nao** quebra a tela (uma mensagem valida continua sendo exibida).
- [x] 12. As mensagens respeitam o tom pedido e o **catalogo e unico** (Decisao 3 — nao existe lista alternativa por viewport), verificado por teste unitario sobre o catalogo: nenhuma mensagem contem as formulacoes vetadas pela issue (`"Bem-vindo ao sistema"`, `"Seja bem-vindo"`, `"Bom dia, usuário."`, `"Consulte abaixo"`, `"Confira o resumo financeiro do período"`), nenhuma contem emoji, todas estao em portugues acentuado e nenhuma linha ultrapassa **60 caracteres** ja com o nome substituido por um nome de 12 caracteres (limite que sustenta os criterios de mobile).
- [x] 13. A logica de periodo, o catalogo e a selecao da mensagem vivem numa unidade **pura e exportada** (funcoes sem dependencia de DOM, no padrao ja usado por `monthAxisLabel` em `dashboard.ts`), consumida pelo componente do Resumo — o que torna os criterios 2 a 12 testaveis sem renderizar a tela.

### UX/UI

- [x] 14. A saudacao aparece **somente** na tela do Resumo: `/transactions`, `/categories`, `/users`, `/profiles` e `/login` nao exibem o bloco, e nenhum arquivo de `frontend/src/app/layout/main-layout/` passa a renderizar saudacao.
- [x] 15. Posicao (Decisao 4): no DOM de `/dashboard`, o bloco de saudacao fica **depois** do rotulo "Painel financeiro" (`.eyebrow`) e **antes** do titulo de mes/ano (`h2` do `.topbar`) e do `.metric-grid`; a ordem visual resultante no desktop a 1440px e: PAINEL FINANCEIRO -> saudacao (2 linhas) -> "Setembro 2026" -> filtros Ano/Mes -> cards.
- [x] 16. A primeira linha tem **maior destaque visual** que a segunda, medido no DevTools: `font-size` computado da linha 1 maior que o da linha 2 **e** `font-weight` da linha 1 >= 700 e maior que o da linha 2; a linha 2 usa a cor de texto secundaria do tema (`var(--text-muted)` ou `var(--text-soft)`).
- [x] 17. A saudacao **nao compete** com os indicadores financeiros: o `font-size` computado da linha 1 e **menor** que o dos valores dos cards de metrica (25px) e menor ou igual ao do titulo de mes/ano (`--fs-dashboard-title`, 30px); o `h2` "Setembro 2026" continua sendo o maior texto do cabecalho.
- [x] 18. **Nao e um card**: o elemento da saudacao nao usa a combinacao `background: var(--surface)` + `border: 1px solid var(--border-card)` + `box-shadow: var(--shadow-card)` dos `.metric-card`/paineis, e nao introduz moldura, icone, avatar nem ilustracao.
- [x] 19. Tipografia, cor e espacamento vem de tokens: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app/features/dashboard/dashboard.scss` nao retorna nenhuma cor literal, e qualquer medida nova de tema (tamanho de fonte da saudacao, espacamento do bloco) nasce como custom property em `frontend/src/styles.scss`, no padrao dos `--fs-*` existentes.
- [x] 20. `rg -n "!important" frontend/src/app/features/dashboard/dashboard.scss` nao retorna nada, e nenhum estilo global existente e alterado para acomodar a saudacao alem da criacao dos tokens do criterio 19.
- [x] 21. Alinhamento preservado: a saudacao alinha a esquerda com `.eyebrow` e com o `h2` (mesma borda esquerda medida no DevTools a 1440px) e nao altera a posicao dos controles de periodo, que continuam a direita do `.topbar` no desktop.

### Responsividade

- [x] 22. Em 1440x900 e 1280x800 (desktop), `/dashboard` renderiza a saudacao em duas linhas sem texto cortado (`scrollHeight <= clientHeight` no elemento do bloco) e `document.documentElement.scrollWidth <= window.innerWidth`.
- [x] 23. Em 1024x768 e 768x1024 (tablet), mesma verificacao do criterio 22: sem overflow horizontal e sem texto cortado, com a saudacao ainda acima dos cards.
- [x] 24. Em **390x844 (iPhone 12)**, `/dashboard` mantem `document.documentElement.scrollWidth <= window.innerWidth` — nenhuma rolagem horizontal. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- [x] 25. Em 390x844, nenhuma linha da saudacao fica cortada nem sobreposta: frases longas **quebram linha** dentro do container (sem `text-overflow: ellipsis` e sem corte), conferido com a mensagem mais longa do catalogo forcada na tela. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- [x] 26. Em 390x844 a saudacao nao ocupa espaco excessivo: a altura computada do bloco (`offsetHeight` no DevTools) e **<= 96px** com a mensagem mais longa do catalogo.
- [x] 27. Em 390x844 os filtros Ano e Mes continuam visiveis e operaveis (alvo de toque e `font-size` >= 16px herdados da issue #54) e trocar qualquer um deles continua recarregando o resumo com **uma unica** `GET /api/dashboard/summary`.
- [x] 28. Em 320px de largura (menor viewport suportado do projeto, `body { min-width: 320px }` desde a issue #54) a tela continua sem rolagem horizontal e com a saudacao legivel e sem corte.
- [x] 29. Em 390x844 os 4 cards de metrica continuam em coluna unica, com rotulo e valor completos (ex.: `R$ 4.900,00` sem truncar), e o grafico "Evolucao anual" continua dentro da largura do painel — a inclusao da saudacao nao altera nenhum desses comportamentos.

### Qualidade e nao regressao

- [x] 30. Regras de calculo intactas: nenhum arquivo de `backend/` e alterado e `frontend/src/app/core/services/dashboard.service.ts` nao muda; os valores de Receitas, Despesas, Pendente e Saldo exibidos para um mesmo periodo sao identicos aos de antes da mudanca.
- [x] 31. Filtros de periodo intactos: o `input` de Ano (`min=2023`, `max=2035`) e o `select` de Mes continuam recarregando via `(change)` (evento nativo, **nao** `(ngModelChange)`), com uma unica requisicao por alteracao.
- [x] 32. Grafico intacto: escala unica de barras e linha de saldo, linha terminando no ultimo mes com lancamento, rotulos de mes via `monthAxisLabel` (3 letras / 1 letra abaixo de 30px de faixa), informativo por mouse/toque/teclado e `.empty-state` "Sem dados no período" — todos os testes existentes de `dashboard.spec.ts` continuam passando **sem afrouxar assercao**.
- [x] 33. O rodape da sidebar continua exibindo o **nome completo** do operador (`main-layout.html`, `.current-user` com `[attr.title]="me.name"`) — a regra de primeiro nome vale so na saudacao.
- [x] 34. Nenhuma dependencia nova: `git diff frontend/package.json` nao adiciona entradas em `dependencies` nem `devDependencies`; nenhuma biblioteca de data/hora, de sorteio, de agendamento ou de i18n e introduzida — o mecanismo do criterio 9 usa apenas recursos ja disponiveis (Angular/`rxjs`/API do navegador).
- [x] 35. Sem logica duplicada e sem hardcode fora da estrutura de mensagens: o nome do operador continua vindo de uma unica fonte (`AuthService.me()`), nao ha segunda copia da regra de faixas de horario no projeto e nenhuma frase fica escrita direto no template — `rg -n "Bom dia|Boa tarde|Boa noite|madrugada" frontend/src/app/features/dashboard/dashboard.html` nao retorna nada (a varredura mira so o template de producao; o catalogo e os testes citam esses termos livremente).
- [x] 36. **O mecanismo de virada de faixa e barato e nao provoca trabalho desnecessario**: o relogio e consultado no maximo uma vez por minuto (nenhum `setInterval` com periodo inferior a 1 minuto e nenhum agendamento por `requestAnimationFrame`/ciclo de render), o estado da saudacao so e reescrito quando o periodo **muda** de fato (tick dentro da mesma faixa nao altera signal/propriedade e, portanto, nao dispara re-render — conferivel no teste do criterio 9, em que o texto e a mesma referencia de objeto antes e depois do tick), e nenhum tick dispara requisicao HTTP (`httpMock.expectNone(() => true)` apos avancar o relogio).
- [x] 37. Zero alteracao de back-end: `git status --porcelain` na branch da feature nao lista nada sob `backend/`, e nenhuma regra de negocio ou validacao e movida para o front-end (o texto da saudacao e apresentacao, nao regra de negocio — ver Contexto).
- [x] 38. Testes novos cobrindo os criterios 2, 3, 5, 6, 7, 9, 10 e 12 sao adicionados a suite do frontend (padrao `dashboard.spec.ts`), `npm test` e `npm run build` (frontend) passam sem warning novo de orcamento (`anyComponentStyle`, 8 kB por `.scss` de componente) e `./mvnw test` (backend) continua verde sem alteracao de codigo.
- [x] 39. Todo texto novo exibido esta em portugues acentuado, e nenhum rotulo existente da tela ("Painel financeiro", "Receitas", "Despesas", "Pendente", "Saldo", "Evolução anual", "Detalhamento") e alterado.

## Fora de escopo

- Saudacao em outras telas, no login ou no shell/menu lateral — a issue trata exclusivamente da aba Resumo.
- Qualquer mudanca de regra de negocio, endpoint, DTO, permissao, migration ou calculo do Resumo.
- Preferencia do usuario para desligar/personalizar a saudacao, escolher apelido ou cadastrar frases proprias (a issue diz explicitamente que nao deve haver cadastro/configuracao manual).
- Catalogo alternativo de frases por viewport (Decisao 3) e persistencia em banco do historico de frases exibidas.
- Animacao/transicao na troca de mensagem na virada de faixa: a substituicao do texto e direta.
- Emoji, avatar, ilustracao, animacao de entrada ou card dedicado para a saudacao ("nao criar um card desnecessario apenas para colocar a mensagem").
- Internacionalizacao / troca de idioma (nao existe i18n no projeto).
- Saudacao dependente de dados financeiros ("voce gastou X esse mes") — a linha 2 e complemento de tom, nao insight calculado.
- Mudanca de identidade visual, paleta, tipografia ou breakpoints definidos nas issues #35 e #54.
- Validacao em aparelho fisico como condicao de aceite (a verificacao e por emulacao, conforme Decisao 1).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/65
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/dashboard.md`, `knowledge/auth-and-permissions.md`, `knowledge/users.md`
- Specs anteriores relacionadas: `specs/35-redesign-interface/spec.md` (design system e tokens), `specs/48-ajuste-grafico-dashboard/spec.md` (grafico do Resumo), `specs/54-responsividade-mobile/spec.md` (breakpoints, 390px, padrao de criterio verificavel por emulacao)
- Codigo inventariado: `frontend/src/app/features/dashboard/{dashboard.html,dashboard.ts,dashboard.scss,dashboard.spec.ts}`, `frontend/src/app/core/services/auth.service.ts`, `frontend/src/app/core/models.ts` (`MeResponse`), `frontend/src/app/core/formatters.ts`, `frontend/src/app/core/guards/{auth.guard.ts,permission.guard.ts}`, `frontend/src/app/layout/main-layout/main-layout.html`, `frontend/src/styles.scss`
