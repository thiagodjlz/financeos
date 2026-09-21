# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Nao ha tarefa de backend nem de migration: a ausencia delas e deliberada e e criterio de aceite (11, 30, 37), conferida na T10.

## Frontend

- [x] **T1** — Criar o modulo de funcoes puras da saudacao: `DayPeriod`, `GreetingMessage` (par `withName`/`withoutName` + `subline`), `greetingDisplayName` (trim, colapsa espacos, devolve o primeiro token preservando acento e caixa, `null` quando vazio), `dayPeriod(hour)` com as faixas 0-5 / 6-11 / 12-17 / 18-23, `selectGreeting(period, seed)` com indice `Math.min(len - 1, Math.floor(seed * len))`, `buildGreeting(period, name, seed)` devolvendo `{ headline, subline }` com `{nome}` ja substituido, e `GREETING_TICK_MS = 60_000`. Nenhuma referencia a DOM, a `Date` ou a injecao Angular dentro do modulo.
  - Arquivos: `frontend/src/app/features/dashboard/greeting.ts`
  - Criterios: 2, 3, 4, 5, 7, 13

- [x] **T2** — Escrever o `GREETING_CATALOG` no mesmo arquivo: catalogo unico (sem lista alternativa por viewport), no minimo 5 pares por periodo, cada par com `withName`, `withoutName` gramaticalmente correta e `subline`; portugues acentuado, sem emoji, sem as formulacoes vetadas pela issue ("Bem-vindo ao sistema", "Seja bem-vindo", "Bom dia, usuário.", "Consulte abaixo", "Confira o resumo financeiro do período") e nenhuma linha acima de 60 caracteres ja com `{nome}` trocado por um nome de 12 caracteres.
  - Arquivos: `frontend/src/app/features/dashboard/greeting.ts`
  - Criterios: 3, 6, 12, 13, 35, 39

- [x] **T3** — Acrescentar os dois tokens de tipografia no bloco `--fs-*` do `:root`, junto de `--fs-dashboard-title`: `--fs-greeting-headline` (menor que os 25px do valor do card e <= 30px do `h2`) e `--fs-greeting-subline` (menor que a linha 1). Nenhuma outra regra global alterada.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 16, 17, 19

- [x] **T4** — Ligar a saudacao no componente do Resumo: injetar `AuthService` apenas para **ler** o signal `me()` (nunca chamar `ensureProfileLoaded()`/`fetchMe()`), criar `greetingPeriod = signal(dayPeriod(new Date().getHours()))`, `greetingSeed = signal(Math.random())` e o `computed` `greeting`; iniciar no `ngOnInit` um `setInterval` de `GREETING_TICK_MS` chamando `syncGreetingPeriod()`, que retorna sem escrever signal quando o periodo nao mudou e, na virada, faz `greetingPeriod.set(next)` + `greetingSeed.set(Math.random())`; acrescentar `clearInterval` no `ngOnDestroy` ao lado do `resizeObserver?.disconnect()` ja existente. Nada do grafico, dos filtros ou do `load()` muda.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 1, 4, 8, 9, 10, 36

- [x] **T5** — Inserir o bloco `<div class="greeting">` com as duas linhas (`.greeting-headline` e `.greeting-subline`, ambas lendo do `computed`) dentro do `<div>` do `<header class="topbar">`, entre o `<p class="eyebrow">` e o `<h2>`. Nenhuma frase literal, nenhum icone, avatar, ilustracao ou moldura no template.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 1, 14, 15, 18, 21, 35, 39

- [x] **T6** — Estilizar o bloco: `.greeting` (grid, gap pequeno, margem inferior antes do `h2`), `.greeting-headline` (`var(--fs-greeting-headline)`, peso 700, `var(--lh-title)`) e `.greeting-subline` (`var(--fs-greeting-subline)`, peso menor, `color: var(--text-muted)`, `var(--lh-body)`), ambas com `overflow-wrap: anywhere` e **sem** `text-overflow: ellipsis`/`white-space: nowrap`; dentro do `@media (max-width: 680px)` ja existente (literal, nunca `var(--bp-mobile)`), reduzir o degrau da linha 1 e apertar a margem. Sem cor literal, sem `!important` e sem background/border/box-shadow de card.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss`
  - Criterios: 16, 17, 18, 19, 20, 21, 25, 26

## Testes

- [x] **T7** — Criar o spec puro (sem `TestBed`) do modulo de saudacao: `greetingDisplayName` com `'Thiago Dos Santos'`, `'Thiago'`, `'  Ana  Paula  '` e um nome acentuado; `dayPeriod` nas horas 0, 5, 6, 11, 12, 17, 18 e 23; contagem >= 5 por periodo; varredura de sementes de 0 a 0,999 em passo de 0,001 cobrindo 100% do catalogo de cada periodo; varredura do catalogo assertando ausencia das formulacoes vetadas, ausencia de emoji e `length <= 60` com nome de 12 caracteres; e `buildGreeting` sem nome nunca produzindo `{nome}`, `undefined`, `null` ou `, !`. Titulos de teste em portugues acentuado.
  - Arquivos: `frontend/src/app/features/dashboard/greeting.spec.ts`
  - Criterios: 2, 3, 5, 6, 7, 12, 13, 38

- [x] **T8** — Acrescentar os testes de componente no spec existente, no padrao do arquivo (dirigir pelo DOM, `HttpTestingController` + `httpMock.verify()`), usando `vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })` — **nao** falsificar `setTimeout`/microtasks: ordem do DOM do bloco entre `.eyebrow` e `h2`; saudacao sem nome com `me()` nulo; texto identico apos trocar Ano, trocar Mes e abrir/fechar o informativo; nenhuma requisicao extra alem da `GET /api/dashboard/summary` do carregamento (`httpMock.expectNone(() => true)` depois de atende-la); tick dentro da mesma faixa devolvendo a **mesma referencia** do objeto do `computed`; virada de 17:59 para 18:00 trocando o texto para o catalogo da noite; e `fixture.destroy()` zerando `vi.getTimerCount()`, com avanco do relogio pos-destroy sem efeito e sem erro.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 1, 3, 8, 9, 10, 15, 36, 38

- [x] **T9** — Rodar a suite completa e o build: `npm test` e `npm run build` no `frontend/` (sem warning novo de `anyComponentStyle`, 8 kB por `.scss` de componente) e `./mvnw test` no `backend/`, confirmando que todos os testes existentes de `dashboard.spec.ts` (grafico, escala unica, `monthAxisLabel`, informativo, `.empty-state`, troca de Ano/Mes) seguem verdes **sem afrouxar nenhuma assercao**.
  - Arquivos: — (execucao; se o budget acusar, enxugar o bloco novo de `dashboard.scss`, nunca aumentar o budget em `frontend/angular.json`)
  - Criterios: 30, 31, 32, 38

## Verificacao de diff e varreduras

- [x] **T10** — Conferir as invariantes estaticas da feature no diff e por varredura: `git status --porcelain` sem nenhuma entrada sob `backend/`; nenhum arquivo novo em `backend/src/main/resources/db/migration/`; `git diff frontend/package.json` vazio; `core/services/dashboard.service.ts`, `core/models.ts`, `core/services/auth.service.ts`, `core/formatters.ts`, rotas, guards e `layout/main-layout/*` intactos; `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app/features/dashboard/dashboard.scss`, `rg -n "!important" frontend/src/app/features/dashboard/dashboard.scss`, `rg -n "localStorage|sessionStorage" frontend/src/app/features/dashboard`, `rg -n "Bom dia|Boa tarde|Boa noite|madrugada" frontend/src/app/features/dashboard/dashboard.html` e `rg -n "getUTC|toISOString" frontend/src/app/features/dashboard` todos sem saida; `rg -n "getHours" frontend/src/app` so em `dashboard.ts` e `greeting.ts`; diff de `styles.scss` contendo apenas as duas linhas de token; e a varredura de acentuacao de `knowledge/architecture.md` sem saida nova, incluindo `greeting.ts`, `greeting.spec.ts` e os titulos dos testes novos.
  - Arquivos: — (conferencia; nenhum arquivo alterado, a nao ser correcao do que a varredura acusar)
  - Criterios: 4, 11, 14, 19, 20, 30, 33, 34, 35, 37, 39

## Validacao na tela

- [ ] **T11** — Medir o cabecalho a 1440px no DevTools e ajustar os tokens se preciso: `font-size` e `font-weight` computados das duas linhas, cor da linha 2, comparacao com os 25px do valor do card e os 30px do `h2`, e ausencia da combinacao de card no bloco.
  - Arquivos: `frontend/src/styles.scss`, `frontend/src/app/features/dashboard/dashboard.scss` (so se a medicao reprovar)
  - Criterios: 15, 16, 17, 18

- [ ] **T12** — Medir desktop e tablet (1440x900, 1280x800, 1024x768, 768x1024) e ajustar o bloco se preciso: `scrollHeight <= clientHeight` no `.greeting`, `document.documentElement.scrollWidth <= window.innerWidth`, borda esquerda das duas linhas alinhada com `.eyebrow` e `h2`, controles de periodo ainda a direita e saudacao acima dos cards.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss` (so se a medicao reprovar)
  - Criterios: 21, 22, 23

- [ ] **T13** — Medir mobile (390x844 e 320px de largura) com a mensagem mais longa do catalogo forcada e ajustar o bloco de 680px se preciso: sem rolagem horizontal nos dois, quebra de linha sem reticencias e sem corte, `.greeting` com `offsetHeight <= 96`, filtros Ano/Mes operaveis (alvo >= 44px, fonte >= 16px) com **uma** `GET /api/dashboard/summary` por troca, 4 cards em coluna unica com valor completo e grafico dentro do painel.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss` (so se a medicao reprovar)
  - Criterios: 24, 25, 26, 27, 28, 29

- [ ] **T14** — Percorrer a nao regressao na tela: aba Network ao abrir `/dashboard` (so `GET /api/dashboard/summary`, mais o `GET /api/auth/me` de sempre); frase identica apos trocar Ano, trocar Mes e abrir/fechar o informativo; ausencia do bloco em `/transactions`, `/categories`, `/users`, `/profiles` e `/login`; rodape da sidebar ainda com o nome completo; e os 4 valores (Receitas, Despesas, Pendente, Saldo) do mesmo periodo identicos aos de antes da mudanca.
  - Arquivos: — (conferencia na stack local)
  - Criterios: 1, 8, 14, 30, 33

## Validacao manual (etapa 8)

Nenhum criterio de geometria tem teste automatizado de proposito: em jsdom nao ha CSS aplicado e toda medida vem `0`, entao um teste de geometria aprovaria falsamente. A confirmacao e medicao na tela, em `http://localhost/dashboard`.

- **Criterio 15** (T11) — a 1440px, ordem visual do cabecalho: PAINEL FINANCEIRO -> saudacao (2 linhas) -> "Setembro 2026" -> filtros Ano/Mes -> cards.
- **Criterios 16 e 17** (T11) — `getComputedStyle` das duas linhas: `font-size` da linha 1 maior que o da linha 2, `font-weight` da linha 1 >= 700 e maior que o da linha 2, cor da linha 2 igual a `--text-muted`; `font-size` da linha 1 menor que os 25px do `strong` do `.metric-card` e <= 30px do `h2`, que continua o maior texto do cabecalho.
- **Criterio 18** (T11) — inspecionar o bloco: sem `background: var(--surface)` + `border: 1px solid var(--border-card)` + `box-shadow: var(--shadow-card)`, sem icone, avatar ou ilustracao.
- **Criterio 21** (T12) — `getBoundingClientRect().left` das duas linhas igual ao do `.eyebrow` e do `h2`; `.period-controls` ainda a direita.
- **Criterios 22 e 23** (T12) — em 1440x900, 1280x800, 1024x768 e 768x1024: `document.querySelector('.greeting')` com `scrollHeight <= clientHeight` e `document.documentElement.scrollWidth <= window.innerWidth`.
- **Criterios 24, 25 e 26** (T13) — em 390x844 (emulacao iPhone 12), com a mensagem mais longa do catalogo na tela: sem rolagem horizontal, texto quebrando em varias linhas sem reticencias e sem corte, `document.querySelector('.greeting').offsetHeight <= 96`. *(Verificavel por emulacao — comportamento nativo nao reproduzido, Decisao 1.)* **Margem apertada**: com a linha 1 a 18px/`--lh-title` e a linha 2 a 14px/`--lh-body`, duas linhas cada mais o gap dao ~89px dos 96px permitidos — se a mensagem mais longa quebrar em tres linhas em algum ponto, o degrau da linha 1 no bloco de 680px precisa cair antes de a feature ser dada por pronta.
- **Criterios 27, 28 e 29** (T13) — em 390x844, focar Ano e Mes (alvo >= 44px, fonte >= 16px) e confirmar **uma** `GET /api/dashboard/summary` por troca na aba Network; a 320px, sem rolagem horizontal e saudacao legivel e inteira; os 4 cards em coluna unica com valor completo (ex.: `R$ 4.900,00` sem truncar) e o grafico dentro da largura do painel.
- **Criterios 1, 8, 14, 30 e 33** (T14) — Network no carregamento; frase identica apos trocar Ano/Mes e abrir/fechar o informativo; ausencia do bloco nas outras cinco rotas; nome completo no rodape da sidebar; 4 valores do periodo identicos aos de antes.

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Saudacao com o nome do `me()`, sem requisicao HTTP nova | T4, T5, T8, T14 |
| 2 | Primeiro nome preservando acento e caixa | T1, T7 |
| 3 | Sem nome disponivel, frase valida e sem pontuacao orfa | T1, T2, T7, T8 |
| 4 | Periodo pelo horario local da sessao | T1, T4, T10 |
| 5 | Quatro faixas exatas (0-5 / 6-11 / 12-17 / 18-23) | T1, T7 |
| 6 | No minimo 5 mensagens por periodo | T2, T7 |
| 7 | Escolha pseudoaleatoria, todas alcancaveis | T1, T7 |
| 8 | Frase estavel dentro do mesmo periodo | T4, T8, T14 |
| 9 | Virada de faixa atualiza sozinha | T4, T8 |
| 10 | Timer encerrado no `ngOnDestroy` | T4, T8 |
| 11 | Sem cadastro, persistencia, migration ou endpoint | T10 |
| 12 | Tom, catalogo unico, 60 caracteres, sem emoji | T2, T7 |
| 13 | Unidade pura e exportada | T1, T2, T7 |
| 14 | Saudacao so no Resumo | T5, T10, T14 |
| 15 | Posicao entre `.eyebrow` e `h2` | T5, T8, T11 |
| 16 | Linha 1 com maior destaque que a linha 2 | T3, T6, T11 |
| 17 | Nao compete com os indicadores financeiros | T3, T6, T11 |
| 18 | Nao e um card, sem icone/avatar/moldura | T6, T11 |
| 19 | Tipografia, cor e espacamento por token | T3, T6, T10 |
| 20 | Sem `!important` e sem mexer em estilo global | T6, T10 |
| 21 | Alinhamento e controles de periodo preservados | T5, T6, T12 |
| 22 | 1440x900 e 1280x800 sem corte e sem overflow | T12 |
| 23 | 1024x768 e 768x1024 sem corte e sem overflow | T12 |
| 24 | 390x844 sem rolagem horizontal | T13 |
| 25 | 390x844 com quebra de linha, sem corte | T6, T13 |
| 26 | 390x844 com `offsetHeight <= 96px` | T6, T13 |
| 27 | 390x844 com filtros operaveis e uma unica requisicao | T13 |
| 28 | 320px sem rolagem horizontal e legivel | T13 |
| 29 | 390x844 com cards e grafico intactos | T13 |
| 30 | Calculos e `dashboard.service.ts` intactos | T9, T10, T14 |
| 31 | Filtros de periodo intactos (`(change)`, 1 requisicao) | T9, T13 |
| 32 | Grafico intacto, testes existentes sem afrouxar | T9 |
| 33 | Sidebar continua com o nome completo | T10, T14 |
| 34 | Nenhuma dependencia nova | T10 |
| 35 | Sem logica duplicada e sem frase no template | T1, T2, T5, T10 |
| 36 | Relogio barato, sem re-render e sem HTTP por tick | T4, T8 |
| 37 | Zero alteracao de back-end | T10 |
| 38 | Testes novos + `npm test`/`npm run build`/`./mvnw test` | T7, T8, T9 |
| 39 | Portugues acentuado, rotulos existentes intactos | T2, T5, T10 |

## Lacunas

- Nenhuma — todos os 39 criterios de aceite estao cobertos por ao menos uma tarefa, e nenhuma tarefa existe sem criterio associado.
- **Nota sobre a convencao "regra de negocio no back-end" (nao e lacuna)**: todas as tarefas sao de frontend e nenhuma toca `backend/`. Isso foi conferido e nao configura regra de negocio vazando para o front — nao ha entrada de usuario validada, calculo, decisao de permissao nem dado persistido; o unico dado de dominio consumido (`name`) ja e exposto por `GET /auth/me`. A propria spec transforma essa ausencia em criterio (11, 30, 37), verificado pela T10. Se durante a implementacao aparecer qualquer regra que dependa de dado do usuario alem do `name`, isso e escopo novo e volta a spec — nao vira logica no front.
- **Ponto de atencao medido, nao lacuna (criterio 26)**: os `<= 96px` a 390px fecham com os tamanhos sugeridos no plano (~89px estimados com duas linhas em cada frase), mas com ~7px de folga. E o unico exemplo numerico da spec cujo fechamento depende de ajuste fino de token; esta anotado na T13 e na secao de validacao manual para nao ser descoberto so na etapa `/pipeline:verify`.
