# Plano de implementacao

## Abordagem

Feature 100% front-end e 100% contida em `frontend/src/app/features/dashboard/` (mais os tokens de tipografia em `styles.scss`). Toda a inteligencia da saudacao — faixas de horario, catalogo de frases, extracao do primeiro nome e sorteio — nasce num modulo novo `greeting.ts` de **funcoes puras exportadas**, sem DOM e sem injecao, no mesmo padrao de `monthAxisLabel` (criterio 13); o componente `Dashboard` so consome essas funcoes, guarda `periodo` e `semente` em signals e expoe um `computed` com o texto final. A atualizacao na virada de faixa e um unico `setInterval` de 60 s que le o relogio, compara com o periodo guardado e **so escreve signal quando o periodo muda** (criterio 36), encerrado no `ngOnDestroy` que ja existe para o `ResizeObserver` (criterio 10). Nenhum endpoint, DTO, migration, rota, guard ou dependencia npm e tocado: o nome vem do signal `AuthService.me()` ja resolvido pelo `authGuard` antes de `/dashboard` ativar.

## Arquivos a alterar

### Backend

- Nenhum. A feature nao introduz regra de negocio nem validacao: o texto da saudacao e apresentacao, o unico dado de dominio consumido (`name`) ja e exposto por `GET /auth/me` e nada e persistido (criterios 11, 30 e 37). `git status --porcelain` nao pode listar nada sob `backend/` ao fim da implementacao.

### Frontend

- `frontend/src/app/features/dashboard/greeting.ts` — **novo**. Unidade pura e exportada, unica fonte da regra de faixas e das frases:
  - `export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'night'` (identificadores em ingles, textos em portugues acentuado, conforme a convencao do projeto).
  - `export interface GreetingMessage { withName: string; withoutName: string; subline: string }` — cada mensagem e um **par fixo** linha 1 + linha 2 (Decisao 6 da spec), e a linha 1 vem em duas redacoes: `withName` com o marcador `{nome}` e `withoutName` gramaticalmente correta sem nome (criterio 3 — nunca cai em `"Olá, !"`).
  - `export const GREETING_CATALOG: Record<DayPeriod, GreetingMessage[]>` — catalogo **unico**, no minimo 5 mensagens por periodo (criterio 6, Decisao 3: nao existe lista alternativa por viewport). Cada linha cabe em 60 caracteres com um nome de 12 caracteres substituido (criterio 12), sem emoji e sem as formulacoes vetadas pela issue.
  - `export function greetingDisplayName(name: string | null | undefined): string | null` — `trim`, colapsa espacos e devolve o **primeiro** token preservando acento e caixa; `null` quando vazio/so espacos (criterios 2 e 3).
  - `export function dayPeriod(hour: number): DayPeriod` — recebe a hora local (`Date#getHours()`, criterio 4), com as quatro faixas exatas 0-5 / 6-11 / 12-17 / 18-23 (criterio 5).
  - `export function selectGreeting(period: DayPeriod, seed: number): GreetingMessage` — `seed` em `[0, 1)`, indice `Math.min(len - 1, Math.floor(seed * len))`; determinismo que torna a varredura de sementes do criterio 7 possivel sem stub de `Math.random`.
  - `export function buildGreeting(period: DayPeriod, name: string | null, seed: number): GreetingText` (`{ headline, subline }`) — resolve `withName`/`withoutName` e substitui `{nome}`; e o unico ponto que produz o texto exibido, entao `{nome}`/`undefined`/`null` nunca chegam ao template.
  - `export const GREETING_TICK_MS = 60_000` — periodo do relogio, exportado para o teste nao repetir o numero.
- `frontend/src/app/features/dashboard/greeting.spec.ts` — **novo**. Testes puros (sem `TestBed`) dos criterios 2, 3, 5, 6, 7 e 12.
- `frontend/src/app/features/dashboard/dashboard.ts` — injeta `AuthService` (apenas para **ler** o signal `me()`; **nunca** chamar `ensureProfileLoaded()`/`fetchMe()`, sob pena de quebrar o criterio 1); acrescenta `greetingPeriod = signal<DayPeriod>(dayPeriod(new Date().getHours()))`, `greetingSeed = signal(Math.random())` e `protected readonly greeting = computed(() => buildGreeting(this.greetingPeriod(), greetingDisplayName(this.auth.me()?.name), this.greetingSeed()))`; no `ngOnInit`, inicia `this.greetingTimer = setInterval(() => this.syncGreetingPeriod(), GREETING_TICK_MS)`; `syncGreetingPeriod()` calcula o periodo atual e **retorna sem escrever nada** se for igual ao guardado (criterio 36 — tick dentro da faixa nao invalida o `computed`, o objeto devolvido continua sendo a mesma referencia), e, na virada, faz `greetingPeriod.set(next)` + `greetingSeed.set(Math.random())` (um unico novo sorteio, agora no catalogo entrante); `ngOnDestroy` ganha `clearInterval(this.greetingTimer)` ao lado do `resizeObserver?.disconnect()` ja existente. Nada do grafico, dos filtros ou do `load()` muda.
- `frontend/src/app/features/dashboard/dashboard.html` — dentro do `<div>` do `<header class="topbar">`, **entre** `<p class="eyebrow">` e o `<h2>` (criterio 15), um bloco `<div class="greeting">` com `<p class="greeting-headline">{{ greeting().headline }}</p>` e `<p class="greeting-subline">{{ greeting().subline }}</p>`. Nenhuma frase literal no template (criterio 35) e nenhum icone/avatar/moldura (criterio 18). Ficar no mesmo `<div>` do `.eyebrow`/`h2` e o que garante o alinhamento a esquerda e a posicao dos controles de periodo a direita sem mexer no flex do `.topbar` (criterio 21).
- `frontend/src/app/features/dashboard/dashboard.scss` — bloco novo `.greeting` (`display: grid; gap` pequeno; `margin` inferior antes do `h2`) + `.greeting-headline` (`var(--fs-greeting-headline)`, `font-weight: 700`, `line-height: var(--lh-title)`) e `.greeting-subline` (`var(--fs-greeting-subline)`, peso 500, `color: var(--text-muted)`, `line-height: var(--lh-body)`), ambos com `overflow-wrap: anywhere` e **sem** `text-overflow: ellipsis`/`white-space: nowrap` (criterio 25). Dentro do `@media (max-width: 680px)` ja existente (literal, nunca `var(--bp-mobile)`), reduzir o degrau da linha 1 e apertar a margem para segurar os <= 96 px do criterio 26. Sem cor literal e sem `!important` (criterios 19 e 20).
- `frontend/src/styles.scss` — dois tokens novos no bloco `--fs-*` do `:root`, junto de `--fs-dashboard-title`: `--fs-greeting-headline` (sugestao 18px — tem de ser **menor** que os 25px do valor dos cards e <= 30px do titulo, criterio 17) e `--fs-greeting-subline` (sugestao 14px, igual a `--fs-body`, sempre menor que a linha 1, criterio 16). Nenhuma outra regra global e alterada (criterio 20).
- `frontend/src/app/features/dashboard/dashboard.spec.ts` — testes de componente novos (criterios 1, 3, 8, 9, 10, 15 e 36), no padrao ja usado no arquivo (dirigir pelo DOM, `HttpTestingController` + `httpMock.verify()`).

### Nao mudam (conferir no diff)

`frontend/src/app/core/services/dashboard.service.ts`, `core/models.ts`, `core/services/auth.service.ts`, `core/formatters.ts`, rotas e guards, `layout/main-layout/*` (criterios 14 e 33) e `frontend/package.json` (criterio 34).

### Migration

Nenhuma. Nao ha mudanca de schema, tabela, coluna ou seed — nenhum arquivo novo em `backend/src/main/resources/db/migration/` (criterio 11).

## Ordem geral

Comecar por `greeting.ts` + `greeting.spec.ts`: com o catalogo e as funcoes puras fechados e verdes, os criterios 2, 3, 5, 6, 7 e 12 ja estao cobertos e o texto exibido esta congelado antes de existir markup. Em seguida os tokens em `styles.scss` (o `.scss` do componente depende deles), depois o trio `dashboard.ts` -> `dashboard.html` -> `dashboard.scss`, nessa ordem, porque o template consome o `computed` e o estilo consome as classes do template. Por ultimo os testes de componente em `dashboard.spec.ts`, que exigem o bloco ja renderizado e o timer ja instalado. A validacao responsiva (390px/320px) e a ultima etapa e pode obrigar a reajustar so os tokens e o bloco de 680px, sem voltar as camadas anteriores.

## Superficie de validacao

Convencao dos testes novos: arquivos vitest (`vi`, **nao** `jasmine` — o runner do projeto e vitest, entao o `jasmine.clock()` citado na spec vira `vi.useFakeTimers()` + `vi.setSystemTime()`).

- Criterio 1 — `dashboard.spec.ts#"não dispara requisição nova ao exibir a saudação"`: apos `render()`, `httpMock.expectNone(() => true)` com `AuthService.me` preenchido no TestBed; **e** validacao na tela: abrir `http://localhost/dashboard` com o DevTools na aba Network e confirmar que so aparece `GET /api/dashboard/summary` (mais o `GET /api/auth/me` de sempre).
- Criterio 2 — `greeting.spec.ts#"greetingDisplayName devolve o primeiro nome"`: `'Thiago Dos Santos'`, `'Thiago'`, `'  Ana  Paula  '` e um nome acentuado.
- Criterio 3 — `greeting.spec.ts#"buildGreeting sem nome"` (varre o catalogo inteiro assertando que nenhuma saida contem `{nome}`, `undefined`, `null` ou `, !`) + `dashboard.spec.ts#"renderiza a saudação sem nome quando me() é nulo"`.
- Criterio 4 — revisao de codigo assistida por varredura: `dayPeriod` recebe `number` e o unico produtor e `new Date().getHours()` em `dashboard.ts`; `rg -n "getUTC|toISOString" frontend/src/app/features/dashboard` sem saida relativa a saudacao.
- Criterio 5 — `greeting.spec.ts#"dayPeriod nas bordas das quatro faixas"`: horas 0, 5, 6, 11, 12, 17, 18, 23.
- Criterio 6 — `greeting.spec.ts#"cada período tem ao menos 5 mensagens"`: percorre as quatro chaves de `GREETING_CATALOG`.
- Criterio 7 — `greeting.spec.ts#"todas as mensagens do período são alcançáveis"`: varre sementes de 0 a 0,999 em passo de 0,001 por periodo e confere que o conjunto de indices atingidos cobre 100% do catalogo.
- Criterio 8 — validacao na tela: em `http://localhost/dashboard`, anotar as duas linhas, trocar o Ano, trocar o Mes e abrir/fechar o informativo do grafico — texto identico; reforcado por `dashboard.spec.ts#"mantém a mesma frase ao trocar ano e mês"` (compara o `textContent` das duas linhas antes e depois do `(change)`).
- Criterio 9 — `dashboard.spec.ts#"atualiza a saudação na virada de faixa"`: `vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })` (nao falsificar `setTimeout`/`Promise`, para nao travar `fixture.whenStable()`), `vi.setSystemTime(17:59)` antes de criar o componente, assertar que o texto pertence ao catalogo da tarde, avancar para `17:59:59`+tick (mesma faixa -> texto identico), depois `vi.setSystemTime(18:00)` + `vi.advanceTimersByTime(GREETING_TICK_MS)` + `detectChanges()` e assertar que o texto pertence ao catalogo da noite.
- Criterio 10 — `dashboard.spec.ts#"encerra o relógio da saudação no destroy"`: apos `fixture.destroy()`, `vi.setSystemTime` alem de uma virada + `vi.advanceTimersByTime` nao altera nada e nao lanca; `vi.getTimerCount()` volta a zero.
- Criterio 11 — conferencia no diff: nenhum arquivo novo em `db/migration/`, nenhum `Resource`/endpoint novo, nenhum uso de `localStorage`/`sessionStorage` na solucao (`rg -n "localStorage|sessionStorage" frontend/src/app/features/dashboard` sem saida).
- Criterio 12 — `greeting.spec.ts#"catálogo respeita tom, tamanho e idioma"`: varre todas as mensagens assertando ausencia das formulacoes vetadas, ausencia de emoji (faixa de codepoints), presenca de acentuacao correta por inspecao das frases e `length <= 60` das tres redacoes com `{nome}` -> nome de 12 caracteres.
- Criterio 13 — estrutural, coberto pela simples existencia de `greeting.spec.ts` sem `TestBed`: se as funcoes nao fossem puras e exportadas, o arquivo nao compilaria.
- Criterio 14 — validacao na tela: navegar por `/transactions`, `/categories`, `/users`, `/profiles` e `/login` e confirmar ausencia do bloco; no diff, nenhum arquivo de `layout/main-layout/` alterado.
- Criterio 15 — `dashboard.spec.ts#"posiciona a saudação entre o rótulo e o título"`: compara a ordem dos nos via `compareDocumentPosition`/`querySelectorAll` no `.topbar`; **e** conferencia visual a 1440px (PAINEL FINANCEIRO -> saudacao -> "Setembro 2026" -> filtros -> cards).
- Criterio 16 — validacao na tela (DevTools, `getComputedStyle` das duas linhas a 1440px): `font-size` 1 > 2, `font-weight` 1 >= 700 e > o da 2, cor da linha 2 igual a `--text-muted`.
- Criterio 17 — validacao na tela (DevTools): `font-size` da linha 1 < 25px do `strong` do `.metric-card` e <= 30px do `h2`; o `h2` continua o maior texto do cabecalho.
- Criterio 18 — validacao na tela (DevTools) + leitura do `.scss`: o bloco nao tem `background: var(--surface)` + `border` + `box-shadow` de card, nem icone/avatar/ilustracao.
- Criterio 19 — `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app/features/dashboard/dashboard.scss` sem saida, e os dois tokens novos presentes em `frontend/src/styles.scss`.
- Criterio 20 — `rg -n "!important" frontend/src/app/features/dashboard/dashboard.scss` sem saida; diff de `styles.scss` contendo apenas as duas linhas de token.
- Criterio 21 — validacao na tela a 1440px: borda esquerda das duas linhas alinhada com `.eyebrow` e `h2` (regua/`getBoundingClientRect().left` igual), controles de periodo ainda a direita.
- Criterio 22 — validacao na tela em 1440x900 e 1280x800: `scrollHeight <= clientHeight` no `.greeting` e `document.documentElement.scrollWidth <= window.innerWidth` no console.
- Criterio 23 — mesma medicao em 1024x768 e 768x1024, confirmando que a saudacao continua acima dos cards.
- Criterio 24 — validacao na tela em 390x844 (emulacao iPhone 12): `document.documentElement.scrollWidth <= window.innerWidth`. *(verificavel por emulacao — comportamento nativo nao reproduzido)*
- Criterio 25 — validacao na tela em 390x844 com a mensagem mais longa do catalogo forcada (editar temporariamente a semente no DevTools ou usar o indice conhecido): texto quebra em varias linhas, sem reticencias e sem corte. *(verificavel por emulacao)*
- Criterio 26 — validacao na tela em 390x844: `document.querySelector('.greeting').offsetHeight <= 96` com a mensagem mais longa.
- Criterio 27 — validacao na tela em 390x844: focar Ano e Mes (alvo >= 44px, fonte >= 16px) e confirmar na aba Network **uma** `GET /api/dashboard/summary` por troca.
- Criterio 28 — validacao na tela a 320px de largura: sem rolagem horizontal e saudacao legivel e inteira.
- Criterio 29 — validacao na tela em 390x844: 4 cards em coluna unica com valor completo e grafico dentro do painel (nao regressao).
- Criterio 30 — conferencia no diff (`git status --porcelain` sem `backend/`, `dashboard.service.ts` intacto) + comparacao dos 4 valores do mesmo periodo antes/depois na tela.
- Criterio 31 — `dashboard.spec.ts` existente (testes de troca de Ano/Mes) continua verde, sem afrouxar assercao, mais a conferencia do criterio 27 na tela.
- Criterio 32 — `npm test` com **todos** os testes de grafico de `dashboard.spec.ts` verdes, sem alterar assercao existente.
- Criterio 33 — validacao na tela: rodape da sidebar continua mostrando o nome completo; diff sem `main-layout.html`.
- Criterio 34 — `git diff frontend/package.json` vazio.
- Criterio 35 — `rg -n "Bom dia|Boa tarde|Boa noite|madrugada" frontend/src/app/features/dashboard/dashboard.html` sem saida; `dayPeriod` e a unica implementacao de faixas (`rg -n "getHours" frontend/src/app` so no `dashboard.ts` e no `greeting.ts`).
- Criterio 36 — `dashboard.spec.ts#"tick dentro da mesma faixa não reescreve a saudação"`: guarda a referencia do objeto devolvido pelo `computed` antes do tick e assere `toBe` (mesma referencia) depois, mais `httpMock.expectNone(() => true)`; revisao do codigo confirmando `setInterval` de 60 s e ausencia de `requestAnimationFrame`.
- Criterio 37 — `git status --porcelain` sem nenhuma entrada sob `backend/`.
- Criterio 38 — `npm test` e `npm run build` no `frontend/` verdes e sem warning novo de `anyComponentStyle`; `./mvnw test` no `backend/` verde.
- Criterio 39 — varredura de acentuacao do projeto (`rg -n "Usuarios|...|\bnao\b" frontend/src --glob '!**/*.md'`) sem saida nova, incluindo `greeting.ts` e os titulos dos testes novos; rotulos existentes da tela inalterados no diff.

## Riscos e pontos de atencao

- **Regressao visual/responsiva no cabecalho (risco principal).** O `.topbar` e um flex `justify-content: space-between; align-items: flex-end` com `flex-wrap`: acrescentar duas linhas na coluna da esquerda aumenta a altura desse ramo e desloca os controles de periodo, que estao alinhados pela **base**. A 1080px e a 680px (onde `.topbar` vira coluna) o efeito muda. Mitigacao: manter o bloco dentro do `<div>` existente, com `margin` pequena e degraus reduzidos no bloco de 680px, e medir `offsetHeight` do `.greeting` e `scrollWidth` do documento em 1440 / 1280 / 1024 / 768 / 390 / 320 antes de dar a feature por pronta (criterios 21 a 29). Nenhum desses criterios tem teste automatizado — em jsdom **nao ha CSS aplicado** e toda medida vem `0`, entao teste de geometria aprovaria falsamente; a confirmacao final e medicao na tela.
- **Orcamento de `anyComponentStyle` (8 kB por `.scss` de componente).** `dashboard.scss` ja tem 399 linhas e e o maior `.scss` de componente do projeto; o criterio 38 proibe warning novo de orcamento. Se o `npm run build` acusar, a saida e enxugar o bloco novo (ou promover regras estruturais a utilitario global em `styles.scss`, que nao entra no budget), nunca aumentar o budget no `angular.json`.
- **`jasmine.clock()` nao existe aqui.** O runner e vitest (`frontend/package.json`, `vitest ^4`); a spec cita `jasmine.clock()` como exemplo. Usar `vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })` — falsificar `setTimeout`/microtasks quebra `fixture.whenStable()` e o flush do `HttpTestingController`, e o efeito seria a suite inteira do dashboard travando, nao so o teste novo.
- **O criterio 1 morre se alguem chamar `ensureProfileLoaded()` no componente.** O `authGuard` ja resolveu o `me()` antes da rota ativar; o `Dashboard` deve apenas **ler** o signal. Uma chamada "defensiva" ao servico dispararia `GET /api/auth/me` e quebraria tambem o `httpMock.verify()` dos testes existentes.
- **Acentuacao e a varredura do projeto.** A varredura de idioma de `knowledge/architecture.md` casa com `periodo`, `nao`, `voce`, `possivel` etc. **inclusive em `*.spec.ts`** — o catalogo e os titulos dos testes novos precisam nascer acentuados, senao o `quality-check` reprova por algo que nao e defeito funcional.
- **Nao ha regra de negocio para levar ao back-end, e isso e deliberado.** A convencao do projeto exige validacao no back-end para toda regra de negocio; aqui nao ha entrada de usuario, calculo, permissao ou dado persistido — so apresentacao (Contexto da spec, criterio 37). Se durante a implementacao aparecer qualquer regra que dependa de dado do usuario alem do `name` ja exposto, isso e sinal de escopo novo e deve voltar a spec, nao virar logica no front.
- **Estabilidade da frase depende de nao sortear no template.** Qualquer `Math.random()` chamado dentro de getter/pipe/template faria a frase piscar a cada deteccao de mudanca (Decisao 5, criterio 8). O sorteio acontece exatamente duas vezes por vida do componente: na inicializacao e em cada virada de faixa.
- **`knowledge/dashboard.md` e a referencia do que nao pode mudar** — totais, ordem dos cards, uma unica `GET /api/dashboard/summary` por troca de periodo, escala unica do grafico e `monthAxisLabel`. O bloco novo entra antes do `.metric-grid` e nao deve tocar em nenhum `computed` existente.
