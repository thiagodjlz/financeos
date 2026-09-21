# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

O back-end vem inteiro primeiro (ele e a fonte das duas regras novas); o front so depois, na dependencia `models` -> `service` -> `ts` -> `html` -> `scss`. **Nenhuma migration**: a feature nao cria tabela, coluna nem seed (criterio 40, conferido na T23).

## Backend

- [x] **T1** — Criar o record `AvailablePeriodResponse(int year, List<Integer> months)` no pacote do dashboard, com nome proprio porque `PeriodResponse` ja existe e significa o periodo consultado. Nenhum record existente e tocado.
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/AvailablePeriodResponse.java`
  - Criterios: 11

- [x] **T2** — Acrescentar `availablePeriods(UUID userId)` ao `DashboardRepository`, no mesmo padrao SQL cru + `DataSource` + try-with-resources das tres consultas existentes: `select extract(year from transaction_date)::int, extract(month from transaction_date)::int from transactions where user_id = ? group by 1, 2 order by 1 desc, 2`, agrupando num `LinkedHashMap<Integer, List<Integer>>` que preserva a ordem do `order by` (anos decrescentes, meses crescentes). **Sem nenhuma clausula de `status`** (Decisao PA3: cancelado conta) e **sempre** com `where user_id = ?` (Decisao PA2).
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java`
  - Criterios: 11, 13, 14

- [x] **T3** — Acrescentar `hasTransactionsInYear(UUID userId, int year)` ao mesmo repositorio (`select exists (select 1 from transactions where user_id = ? and transaction_date between ? and ?)` com `LocalDate.of(year,1,1)`/`of(year,12,31)`), **usando exatamente o mesmo criterio da T2**: mesmo `user_id`, **sem filtro de `status`**. Se um dos dois filtrar `CANCELED` e o outro nao, o dropdown passa a oferecer um ano que a API recusa — defeito que nenhum teste isolado pega. Tarefa separada de proposito: esta consistencia e regra, nao detalhe de implementacao.
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java`
  - Criterios: 13, 22

- [x] **T4** — Criar o endpoint `@GET @Path("/periods") List<AvailablePeriodResponse> periods()` no `DashboardResource`, com `accessControl.require(Screen.DASHBOARD, Action.VIEW)` **na primeira linha**, chamando `repository.availablePeriods(currentUser.id())` e, sobre o resultado, aplicando a regra do **ano corrente sempre presente** (Decisao PA1): se `Year.now().getValue()` nao estiver na lista, inserir `new AvailablePeriodResponse(anoCorrente, List.of())` na posicao que mantem a ordem decrescente. A regra do ano corrente fica no `Resource` (onde mora regra de negocio neste projeto), nunca no `Repository`.
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java`
  - Criterios: 11, 12, 15

- [x] **T5** — Trocar a assinatura de `summary(...)` para `@QueryParam("year") String year, @QueryParam("month") String month` e criar o parse manual dentro do `DashboardResource`, para que `?year=abc` e `?year=` deixem de falhar na **conversao** do `@QueryParam Integer` (hoje escapam do `BusinessExceptionMapper` e nao chegam a 400 com mensagem em portugues). Regras do parse, que sao o ponto critico: `""` (vazio) e **invalido**, nao ausente — trata-lo como `null` faria cair em "Informe o ano e o mês juntos." e reprovaria o criterio 20; e a mensagem da `NumberFormatException` (`For input string: "abc"`) **nunca** pode ser repassada a excecao, porque toda mensagem de `WebApplicationException` virou texto de UI. Nenhum `ParamConverter`/`ParamConverterProvider` global — a solucao fica local ao `DashboardResource`, senao qualquer parametro inteiro de outro endpoint muda de comportamento. Contrato de `DashboardSummaryResponse`/`PeriodResponse` inalterado.
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java`
  - Criterios: 20, 21

- [x] **T6** — Reescrever `resolvePeriod` (deixa de ser `static`, passa a usar `repository` e `currentUser`) com **esta ordem de checagens, que e parte da regra**: (1) ano e mes ausentes -> `YearMonth.now()`; (2) so um presente -> `"Informe o ano e o mês juntos."` (texto intacto); (3) **mes** vazio/nao numerico ou fora de `1..12` -> `"O mês deve estar entre 1 e 12."` (texto intacto); (4) **formato do ano** nulo/vazio/nao numerico ou fora de `1000..9999` -> `"O ano informado é inválido."`; (5) **disponibilidade do ano** — se `year != Year.now().getValue()` e `!repository.hasTransactionsInYear(...)` -> `"Não há lançamentos no ano informado."`, lancada **antes** de qualquer consulta de totais/breakdown/evolucao. As duas mensagens novas sao `BadRequestException` (o `BusinessExceptionMapper` ja serializa). A checagem de mes vem **antes** da de ano de proposito: `shouldRejectMonthOutOfRange` chama `?year=2026&month=13` sem criar lancamento nenhum e, com a ordem invertida, viraria "ano sem lancamentos" em 2027, quando 2026 deixar de ser o ano corrente. Mes sem dados continua **nunca** sendo erro (Decisao PA4-1).
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java`
  - Criterios: 20, 21, 22, 23, 25

## Testes de backend

- [x] **T7** — Acrescentar a `DashboardResourceTest` os testes do endpoint de periodos, reaproveitando o `createTransaction(...)` privado e o prefixo `"Teste dashboard%"`: `shouldListAvailablePeriodsFromTransactions` (lancamentos em `2023-03-10`, `2025-07-01`, `2025-11-02`, `2026-01-05` -> `2026` com `1`, `2025` com `[7, 11]`, `2023` com `[3]`, **sem** `2024`), `shouldIncludeCanceledTransactionYear` (unico lancamento de 2022 cancelado via o helper `cancelTransaction` -> `2022` presente com o mes), `shouldNotListPeriodsOfAnotherUser` (lancamento gravado para o usuario semeado `00000000-...-000099` num ano que o usuario dev nao tem -> ausente na resposta do dev) e `shouldAlwaysIncludeCurrentYearWithoutTransactions` (`@TestSecurity`/`@JwtSecurity` de metodo para `owner@financeos.internal`, sem lancamento nenhum -> `[{ year: <corrente>, months: [] }]`). **Generalizar o `cleanup()` do `@AfterEach`**, hoje `userId = TEST_USER_ID and description like 'Teste dashboard%'`, para apagar por descricao em **qualquer** usuario — sem isso o lancamento do outro usuario sobrevive e torna as assercoes exatas dos criterios 11 e 12 dependentes da ordem dos metodos.
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
  - Criterios: 11, 12, 13, 14

- [x] **T8** — Acrescentar a `DashboardResourceTest` os testes da validacao de ano: `shouldRejectNonNumericYear` (`?year=abc&month=9`), `shouldRejectEmptyYear` (`?year=&month=9`) e `shouldRejectImplausibleYear` (`?year=0&month=9` e `?year=99999&month=9`) -> 400 com `message` exatamente `"O ano informado é inválido."`; `shouldRejectYearWithoutTransactions` (lancamento so no ano corrente, chamada com `year=2019&month=9`) -> 400 com `"Não há lançamentos no ano informado."` e **sem** corpo de resumo; `shouldAcceptCurrentYearWithoutTransactions` (usuario sem lancamento, `?year=<corrente>&month=<corrente>`) -> 200 zerado.
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
  - Criterios: 20, 21, 22, 23

- [x] **T9** — Acrescentar `shouldReturnZeroedSummaryForMonthWithoutData`: lancamentos so em janeiro do ano corrente, consulta de setembro do mesmo ano -> **200** (nunca 400), quatro totais zerados e `monthlyEvolution` com **12** entradas. E a prova de que a filtragem de meses e disponibilidade de lista, nao validacao (Decisao PA4-1).
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
  - Criterios: 10, 27

- [x] **T10** — Criar `DashboardPeriodsSecurityTest`, classe **sem** `@TestSecurity` de classe (padrao de `AuthResourceTest`, porque a anotacao de classe de `DashboardResourceTest` autentica tudo): `shouldRequireAuthentication` (`GET /dashboard/periods` sem token -> 401) e `shouldDenyUserWithoutDashboardView` (cria em transacao um `Profile` sem nenhuma `ProfilePermission` e um `AppUser` `superAdmin = false` com UUID fixo apontando para ele, chama com `@TestSecurity` + `@JwtSecurity(sub = <UUID fixo>)` -> 403; `@AfterEach` remove usuario e perfil).
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardPeriodsSecurityTest.java`
  - Criterios: 15

- [x] **T11** — Rodar `./mvnw test` no `backend/` e conferir no diff que `shouldReturnMonthlySummary`, `shouldRejectIncompletePeriod` e `shouldRejectMonthOutOfRange` continuam verdes **sem uma linha alterada** (o arquivo so ganhou metodos e a generalizacao do `cleanup`), incluindo as 12 entradas de `monthlyEvolution`.
  - Arquivos: — (execucao e conferencia de diff; se algum dos tres quebrar, o defeito esta na ordem de checagens da T6, nao no teste)
  - Criterios: 25, 28, 37, 38

## Frontend

- [x] **T12** — Declarar `export interface AvailablePeriod { year: number; months: number[] }` em `core/models.ts` (nenhum tipo existente muda) e, no `DashboardService`, acrescentar `readonly periods = signal<AvailablePeriod[]>([])` e `async loadPeriods(): Promise<void>` chamando `GET ${API_BASE}/dashboard/periods` no mesmo formato do `refresh()` existente (`firstValueFrom` + `http.get`). O `refresh(year, month)` fica intacto.
  - Arquivos: `frontend/src/app/core/models.ts`, `frontend/src/app/core/services/dashboard.service.ts`
  - Criterios: 17, 19

- [x] **T13** — Fazer `formatMonthName()` delegar a `longMonthName()` (ja existente em `core/formatters.ts`) em vez de `monthName()`, sem criar nenhum array/objeto de nomes de mes. **`monthAxisLabel` continua chamando `monthName()` diretamente** e nao pode passar a usar `formatMonthName`/`longMonthName`: por extenso os 12 rotulos do eixo X colidiriam a 390px e quebrariam as assercoes existentes do bloco "eixo, titulo e legenda".
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 1, 2, 3, 5, 42

- [x] **T14** — Criar no componente `availableYears(): number[]` (anos do signal `periods` na ordem recebida, unindo o `period.year` corrente quando faltar — rede de seguranca para falha da chamada e para virada de ano entre o relogio do navegador e o do servidor; nunca devolve lista vazia) e `availableMonths(): number[]` (meses do ano selecionado; `[1..12]` quando o ano nao esta na resposta ou veio com `months: []`, Decisao PA4-4; para o **ano corrente**, uniao com o mes corrente, ordenada crescente). Metodos chamados do template, no padrao ja usado por `categoriesByType()`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 6, 7, 17

- [x] **T15** — Disparar `loadPeriods()` no `ngOnInit`, **exatamente uma vez por vida do componente**, ao lado do `load()` ja existente (sem dependencia de ordem: o periodo inicial e ano+mes correntes, sempre validos pela Decisao PA1), com o erro tratado pelo mesmo `toast.fromHttpError(err, '<fallback em portugues>')`; e criar `onYearChange()` para substituir o `(change)="load()"` do campo Ano: se `period.month` nao estiver em `availableMonths()`, reposiciona para o `Math.max(...)` da lista e so entao chama `load()` **uma unica vez** (nenhuma requisicao com o mes antigo); se estiver, mantem. O campo Mes continua com `(change)="load()"`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 8, 9, 19, 26

- [x] **T16** — No `.period-controls`, trocar `<input aria-label="Ano" type="number" min="2023" max="2035">` por `<select aria-label="Ano" [(ngModel)]="period.year" (change)="onYearChange()">` com `<option *ngFor="let year of availableYears()" [ngValue]="year">{{ year }}</option>` (`[ngValue]` mantem o valor como `number`); trocar o literal `[1,...,12]` do `<select>` de Mes por `availableMonths()`; e ajustar o `<h2>` para `{{ formatMonthName(period.month) }} {{ period.year }}`, removendo o `| titlecase` (o `longMonthName()` ja devolve capitalizado). Nenhuma classe de estilo exclusiva de um dos dois campos.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 3, 4, 16, 17, 18, 24, 30, 31, 36

- [x] **T17** — Em `.period-controls`, remover o bloco `input { width: 88px }` e dar largura aos dois `<select>` (`width: auto` + um `min-width` que caiba "Setembro" e "2026" sem reticencias) — o global `input, select { width: 100% }` de `styles.scss` nao serve a dois campos lado a lado num flex e o `text-overflow: ellipsis` global truncaria o mes; e, no `@media (max-width: 680px)` ja existente, trocar `.period-controls input { width: 100% }` por `.period-controls select { width: 100% }`. Medida literal no `.scss` da tela (espacamento/layout de componente nao vira token). Sem cor literal, sem `!important` e sem `:hover` novo fora de `@media (hover: hover)`. Nenhuma decisao de largura/viewport no TS — `matchMedia` nao existe em jsdom e derrubaria a suite.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss`
  - Criterios: 30, 32, 33, 34, 35

## Testes de frontend

- [x] **T18** — **Primeira tarefa da etapa de testes do front**: adaptar os helpers compartilhados de `dashboard.spec.ts` (`summaryRequest()`, `render()` e o `flushSummary()`/`renderAt()` do bloco da saudacao) para atender tambem a `GET /api/dashboard/periods` de cada carregamento — enquanto isso nao existir, o `httpMock.verify()` do `afterEach` reprova **a suite inteira** do Resumo, nao so os testes novos, e esconde os defeitos reais. No mesmo passo, tornar explicitos os seletores fragilizados pela mudanca, **mantendo a mesma assercao**: `host().querySelector('select')` (linha ~610) e `pick<HTMLSelectElement>('select')` (linha ~751) passam a `select[aria-label="Mês"]`, e `pick<HTMLInputElement>('input')` (linha ~741) passa a `pick<HTMLSelectElement>('select[aria-label="Ano"]')`, trocando o ano por selecao de `<option>` + `change`. O mock de periodos do bloco da saudacao precisa oferecer 2025 e 2026 com os 12 meses, senao o teste esbarra no reposicionamento de mes da T15. Nenhuma assercao removida ou enfraquecida.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 37, 43

- [x] **T19** — Testes novos de apresentacao do mes, num `describe('seleção de período')`: `<option>` de `select[aria-label="Mês"]` com a lista inteira `Janeiro..Dezembro` na ordem (ano com 12 meses disponiveis); nenhum rotulo casando `/^[A-Za-zÀ-ÿ]{3}\.?$/` nem contendo `.`; `.topbar h2` exatamente `Setembro 2026` com `period = {2026, 9}`; e escolher "Março" disparando `…/dashboard/summary?year=<ano>&month=3`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 1, 2, 3, 4, 39

- [x] **T20** — Testes novos de disponibilidade e reposicionamento: resposta `[{2026,[1..6]},{2025,[7,11]}]` com 2025 selecionado -> exatamente `Julho` e `Novembro`; ano corrente com `months: [1..6]` e relogio em setembro -> `Janeiro..Junho` **mais** `Setembro`, em ordem cronologica (usar `vi.setSystemTime` com `toFake` restrito a `['Date']`, nunca `setTimeout`/microtasks, que travam `whenStable()` e o flush do `HttpTestingController`); `months: []` -> 12 opcoes com o mes corrente selecionado e sem `disabled`; 2026/Setembro -> escolher 2025 (`[7,11]`) -> campo em `Novembro`, `h2` `Novembro 2025`, uma unica `…month=11` e nenhuma com `month=9`; 2026/Março -> escolher 2025 (`[3,7]`) -> `month=3`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 6, 7, 8, 9, 39

- [x] **T21** — Testes novos do campo Ano e do erro: resposta com 2026, 2025 e 2023 -> `<option>` nessa ordem e nenhuma com `2024`; requisicao saindo como `?year=2025` (sem aspas, sem `[object Object]`); apos o render, trocar Ano e depois Mes atendendo **so** as `summary`, com o `httpMock.verify()` provando a ausencia de uma segunda `periods`; e um 400 respondido com `{"message":"Não há lançamentos no ano informado."}` virando toast de **Alerta** com esse mesmo texto.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 17, 18, 19, 26, 39

- [x] **T22** — Rodar `npm test` e `npm run build` no `frontend/` (sem warning novo de `anyComponentStyle`), confirmando que os testes unitarios existentes de `monthAxisLabel` (`'Jan'` a 60px, `'J'` a 20px) passam **sem edicao**, que as assercoes de fim da linha de saldo e as da saudacao/cards/Detalhamento seguem verdes e que nenhuma assercao foi afrouxada.
  - Arquivos: — (execucao)
  - Criterios: 5, 29, 37, 39, 43

## Verificacao de diff e varreduras

- [x] **T23** — Conferir as invariantes estaticas por varredura e diff: `rg -n 'type="number"' frontend/src/app/features/dashboard/dashboard.html` e `rg -n "2023|2035" .../dashboard.html` sem saida, com `rg -n 'aria-label="Ano"' .../dashboard.html` casando uma linha de `<select>`; `rg -n "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(|!important" .../dashboard.scss` sem saida e `rg -n ":hover|outline" .../dashboard.scss` sem ocorrencia fora de `@media (hover: hover)` e sem `outline: none` novo; `rg -n "Janeiro|Fevereiro" frontend/src/app --glob '!*.spec.ts'` sem lista de meses no codigo de producao e `monthAxisLabel` ainda em `monthName()`; `git status --porcelain backend/src/main/resources/db/migration/` vazio; `git diff` de `DashboardSummaryResponse`, `PeriodResponse`, `MonthlySummaryResponse` e `CategoryBreakdownResponse` vazio; `git diff frontend/package.json backend/pom.xml` vazio; e a varredura de acentuacao de `knowledge/architecture.md` sem saida nova, incluindo as duas mensagens novas do backend e os titulos dos testes novos.
  - Arquivos: — (conferencia; so altera arquivo se a varredura acusar)
  - Criterios: 5, 16, 24, 32, 33, 40, 41, 42

## Validacao na tela

- [ ] **T24** — Medir a responsividade em `http://localhost/dashboard` a 1440x900, 1024x768, 768x1024, 390x844 e 320px e ajustar **so** a largura dos `<select>` no `.scss` se a medicao reprovar: `document.documentElement.scrollWidth <= window.innerWidth` em todas; campos lado a lado ate 680px e empilhados a 100% abaixo; `scrollWidth <= clientWidth` do `<select>` de Mes exibindo "Setembro"; no Computed, mesmo `height`/`font-size`/`border`/`border-radius` nos dois campos a 1440px e `font-size: 16px` + `min-height: 44px` a 390px; e as duas listas de opcoes abrindo sem corte.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss` (so se a medicao reprovar)
  - Criterios: 30, 34, 35, 36

- [ ] **T25** — Percorrer o comportamento na stack local: aba Network ao abrir `/dashboard` (uma unica `GET /api/dashboard/periods`, so `summary` nas trocas de Ano e Mes); titulo do cabecalho por extenso; mes sem lancamento mostrando os 4 cards zerados e o `.empty-state` "Sem dados no período" **sem** toast, com o grafico ainda desenhando os 12 rotulos; `curl`/Swagger/`fetch` autenticado em `?year=2019&month=9` devolvendo o 400 sem passar pela tela, e a mesma URL forcada pelo console virando toast de Alerta com o texto do backend; teclado no campo Ano (`Tab`, setas, `Esc`) com uma unica `summary` por troca e o mes reposicionado quando for o caso; e a nao regressao do Resumo (saudacao estavel, ordem Receitas/Despesas/Pendente/Saldo, contagem de categorias, sem botao "Atualizar").
  - Arquivos: — (conferencia na stack local)
  - Criterios: 3, 10, 19, 24, 26, 27, 28, 31, 43

## Validacao manual (etapa 8)

Criterios que nao ficam verdes por `npm test`/`./mvnw test` — em jsdom nao ha CSS aplicado e toda medida vem `0`, e a lista nativa do `<select>` e desenhada pelo sistema operacional. A confirmacao e medicao em `http://localhost/dashboard`.

- **Criterio 24** (T25) — recusa do ano sem passar pela tela: `curl -H "Authorization: Bearer <token>" "http://localhost:8080/api/dashboard/summary?year=2019&month=9"` devolvendo 400 com a mensagem. Sem credencial local disponivel (as senhas seed foram rotacionadas para fora do repositorio, `V10`), cair para o Swagger local `http://localhost:8080/docs/` ou `fetch` no console com o token do `localStorage`.
- **Criterio 26** (T25) — forcar a URL invalida pelo console e observar o toast de **Alerta** com o texto do backend, sem `[object Object]` e sem ingles.
- **Criterio 30** (T24) — a 1440px, DevTools > Computed nos dois campos: mesmo `height`, `font-size`, `border` e `border-radius`; no diff, nenhuma classe exclusiva de um deles.
- **Criterio 31** (T25) — `Tab` ate o campo Ano, `Seta para baixo`/`Seta para cima` trocando o ano com **uma** `GET /api/dashboard/summary` por troca na aba Network (e o mes reposicionado quando o ano novo nao tiver o mes atual), `Esc` sem deixar o campo invalido. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- **Criterio 34** (T24) — em 1440x900, 1024x768 e 768x1024: `document.documentElement.scrollWidth <= window.innerWidth` no console, campos lado a lado e `scrollWidth <= clientWidth` do `<select>` de Mes exibindo "Setembro".
- **Criterio 35** (T24) — em 390x844: sem rolagem horizontal, campos empilhados a 100%, `font-size: 16px` e `min-height: 44px` no Computed de cada um. *(Verificavel por emulacao.)*
- **Criterio 36** (T24) — em 390x844 e a 320px: abrir as duas listas e conferir que nenhuma e cortada nem ultrapassa a tela. *(Verificavel por emulacao.)*
- **Criterios 10, 27 e 28** (T25) — mes sem lancamento com os 4 cards zerados e o `.empty-state` "Sem dados no período", **sem** toast, e o grafico "Evolucao anual" ainda com os 12 rotulos de mes mesmo com o dropdown listando menos meses.
- **Criterios 3, 19 e 43** (T25) — titulo por extenso no cabecalho; Network com uma unica `periods` por carregamento; saudacao estavel ao trocar Ano/Mes, ordem dos 4 cards, contagem de categorias e ausencia de botao "Atualizar".

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Meses por extenso no campo Mes | T13, T19 |
| 2 | Nenhuma abreviacao nas opcoes | T13, T19 |
| 3 | Titulo `Setembro 2026` no cabecalho | T13, T16, T19, T25 |
| 4 | Valor interno do mes continua `1..12` | T16, T19 |
| 5 | Eixo X do grafico continua abreviado | T13, T22, T23 |
| 6 | Meses = os do ano selecionado (+ mes corrente no ano corrente) | T14, T16, T20 |
| 7 | Ano sem meses cai nos 12, mes corrente selecionado | T14, T16, T20 |
| 8 | Troca de ano reposiciona o mes para o maior disponivel | T15, T20 |
| 9 | Troca de ano mantem o mes quando ele existe | T15, T20 |
| 10 | Mes sem dados e 200, nunca 400 | T9, T25 |
| 11 | `GET /dashboard/periods` com o contrato e a ordenacao | T1, T2, T4, T7 |
| 12 | Ano corrente sempre na resposta | T4, T7 |
| 13 | Lancamento cancelado conta | T2, T3, T7 |
| 14 | Lista escopada por usuario | T2, T7 |
| 15 | `accessControl.require` na primeira linha (403/401) | T4, T10 |
| 16 | Campo Ano e `<select>`, nao `<input>` | T16, T23 |
| 17 | Opcoes de Ano = anos do endpoint, ordem decrescente | T12, T14, T16, T21 |
| 18 | Valor interno do ano continua `number` | T16, T21 |
| 19 | Periodos buscados uma unica vez por carregamento | T12, T15, T21, T25 |
| 20 | `?year=abc` e `?year=` -> 400 "O ano informado é inválido." | T5, T6, T8 |
| 21 | `?year=0` e `?year=99999` -> mesma mensagem | T5, T6, T8 |
| 22 | Ano sem lancamentos -> 400 com mensagem distinta | T3, T6, T8 |
| 23 | Ano corrente nunca cai no 400 do criterio 22 | T6, T8 |
| 24 | Recusa vale sem passar pela tela; faixa fixa some do HTML | T16, T23, T25 |
| 25 | Validacoes de periodo existentes identicas | T6, T11 |
| 26 | 400 vira toast com a mensagem do backend | T15, T21, T25 |
| 27 | Ano selecionado nao assume todos os meses com dados | T9, T25 |
| 28 | `monthlyEvolution` continua com 12 entradas | T11, T25 |
| 29 | Linha de saldo termina no ultimo mes com lancamento | T22 |
| 30 | Ano e Mes com o mesmo controle e a mesma aparencia | T16, T17, T24 |
| 31 | Teclado no campo Ano, uma requisicao por troca | T16, T25 |
| 32 | `:focus` global preservado, `:hover` dentro do envelope | T17, T23 |
| 33 | Sem cor literal e sem `!important` | T17, T23 |
| 34 | Desktop/tablet sem rolagem, "Setembro" sem truncar | T17, T24 |
| 35 | Mobile 390x844: empilhado, 16px e 44px | T17, T24 |
| 36 | Lista nativa abre sem corte a 390px e 320px | T16, T24 |
| 37 | `mvn test`/`npm test` verdes, spec adaptado sem afrouxar | T11, T18, T22 |
| 38 | Testes novos de backend das regras novas | T7, T8, T9, T10, T11 |
| 39 | Testes novos de frontend do campo Mes | T19, T20, T21, T22 |
| 40 | Nenhuma migration e nenhum contrato existente alterado | T23 |
| 41 | Nenhuma dependencia nova | T23 |
| 42 | Sem logica duplicada de nome de mes | T13, T23 |
| 43 | Saudacao, cards, Detalhamento e ausencia de "Atualizar" | T18, T22, T25 |

## Lacunas

- Nenhuma — todos os 43 criterios de aceite estao cobertos por ao menos uma tarefa, e nenhuma tarefa existe sem criterio associado.
- **Regra de negocio no back-end (conferido, nao e lacuna)**: as duas unicas regras que **recusam** — ano invalido (criterios 20/21) e ano sem lancamentos (criterio 22) — nascem no `DashboardResource` (T5, T6) e sao provadas por teste de backend (T8) e por chamada direta sem navegador (T25); a fonte dos periodos disponiveis (criterios 11 a 15) tambem e backend (T1 a T4). O que fica so no Angular — uniao com o mes corrente, fallback de 12 meses e reposicionamento do mes (criterios 6 a 9) — e **disponibilidade de lista, nao validacao**: o back-end continua aceitando qualquer mes `1..12` (Decisao PA4-1, provado pela T9), entao nenhum criterio de regra depende de codigo que so existe no front. Se durante a implementacao aparecer necessidade de **recusar** um mes, isso e escopo novo e volta a spec.
- **Aviso, nao lacuna (criterio 26)**: nao ha tarefa de implementacao propria — o `catch` de `load()` ja chama `toast.fromHttpError(err, 'Não foi possível carregar o resumo.')` e o `classifyHttpError` ja classifica 400 com corpo como Alerta. A cobertura e por teste novo (T21) e verificacao na tela (T25), que e o que o criterio cobra. A unica coisa nova e o mesmo tratamento para o `loadPeriods()` (T15).
- **Aviso sobre os exemplos numericos dos criterios 11 e 12 (alcancaveis, mas dependentes da T7)**: nao ha lancamento semeado por migration nenhuma, entao `[{2026,[1]}, {2025,[7,11]}, {2023,[3]}]` e `[{ano corrente, months: []}]` sao produziveis pelo backend — desde que (a) o `cleanup()` do `@AfterEach` seja generalizado para apagar por descricao em **qualquer** usuario, senao o lancamento do outro usuario de `shouldNotListPeriodsOfAnotherUser` sobrevive e contamina `shouldAlwaysIncludeCurrentYearWithoutTransactions`, e (b) a assercao do ano corrente no criterio 11 tolere o que a Decisao PA1 injeta. Os dois pontos estao escritos na T7; se a suite ficar dependente da ordem dos metodos, o defeito e da fixture, nao do algoritmo.
- **Aviso sobre o criterio 6 (exemplo dependente do relogio)**: "hoje em setembro" so e determinista com `vi.setSystemTime`, e o `toFake` precisa ficar restrito a `['Date']` — incluir `setTimeout`/microtasks trava `fixture.whenStable()` e o flush do `HttpTestingController` e derruba a suite inteira do componente (padrao registrado em `knowledge/architecture.md` desde a issue #65). Anotado na T20.
