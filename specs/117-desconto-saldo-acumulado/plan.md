# Plano de implementacao

## Abordagem

**Contrato da API (DEC-3):** `balance` passa a ser o Saldo do mes novo (Saldo anterior + receitas − despesas pagas) no summary e em cada item de `monthlyEvolution`; `accumulatedBalance` **sai** dos dois records (ficaria igual a `balance`); `previousBalance` fica no summary e **entra** em `MonthlySummaryResponse`. Invariante nova, por mes: `balance = previousBalance + income - expense`, derivada dentro do record (`of` nasce com anterior 0; `withPreviousBalance(p)` recalcula). O summary le `balance`/`previousBalance` do proprio mes da serie, entao quadro, bloco e linha nunca divergem. Front e back saem na mesma imagem; nao ha outro consumidor do campo removido.

Ordenacao: so troca o `order by` de `TransactionRepository.search` (o relatorio usa outro repositorio). No celular a lista perde `tr.day-row`/`dayHeading` e mostra a data na linha. Rodape: `.app-version` vira o par de linhas (nome + versao `nowrap`), mantendo o teste existente. Favicon: SVG desenhado em `<path>` (sem fonte) + `.ico` gerado da mesma marca.

## Arquivos a alterar

### Backend (`backend/src/main/java/br/com/financeos/`; testes no espelho em `src/test`)
- `dashboard/{MonthlySummaryResponse,DashboardSummaryResponse,DashboardResource}.java` — contrato e regra do saldo.
- `reports/TransactionReportResource.java` — so o comentario da linha 29.
- `transactions/TransactionRepository.java` — `order by amount desc, transactionDate desc, createdAt desc, id`.
- `documentation/content/{Summary,Transactions,TransactionReports}AreaContent.java`, `releasenotes/content/ReleaseNotesContent.java` — textos.
- Testes: `DashboardAccumulatedBalanceTest`, `DashboardResourceTest`, `TransactionResourceTest`, `DocumentationContentTest`, `ReleaseNotesContentTest`.

### Frontend (`frontend/src/app/`)
- `core/models.ts`, `core/services/dashboard.service.spec.ts`, `features/dashboard/dashboard.{ts,html,scss,spec.ts}`.
- `features/transactions/transactions.{ts,html,scss,spec.ts}`; `core/formatters.{ts,spec.ts}` e `../styles.scss` (sai `dayHeading`/`--fs-day-heading`).
- `layout/main-layout/main-layout.{html,scss,spec.ts}`.
- `frontend/src/index.html`, `frontend/public/favicon.svg` (novo), `frontend/public/favicon.ico` (substituido).

### Migration
- Nenhuma (sem mudanca de schema; ultima e `V18`).

## Tarefas

- [x] **T1** — Redefinir o saldo no back: `MonthlySummaryResponse(year, month, income, expense, previousBalance, balance)` com `withPreviousBalance`; `withAccumulatedBalance` vira `withPreviousBalance`, somando ao carregado `income.subtract(expense)` do mes (nunca o `balance` novo), mesmos limites de `ACCUMULATION_START`/C; summary sem `accumulatedBalance`, com `balance`/`previousBalance` do mes da serie; comentario de `TransactionReportResource` sem "acumulado". `balanceBetween` nao muda.
  - Arquivos: `MonthlySummaryResponse.java`, `DashboardSummaryResponse.java`, `DashboardResource.java`, `TransactionReportResource.java`
  - Criterios: 1, 2, 3, 6
- [x] **T2** — Reescrever `DashboardAccumulatedBalanceTest` para a regra nova: cenario do criterio 1 (C = dez/2026; out, nov, dez, fev/2027; set/2026 com receita 100,00); criterio 2 (pendente fora, outro usuario fora, mes futuro so ate C, negativo segue, editar/excluir antigo muda os seguintes, anterior nunca soma o Saldo novo); criterio 3 (`monthlyEvolution[m].balance` == `balance` do summary de cada mes; `balance = previousBalance + income - expense` nos 12 meses; antes de out/2026 `previousBalance` 0); ausencia de `accumulatedBalance` no JSON.
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardAccumulatedBalanceTest.java`
  - Criterios: 1, 2, 3
- [x] **T3** — Blindar `DashboardResourceTest#shouldReturnZeroedSummaryForMonthWithoutData`: ele assere `balance` 0 em set do ano corrente com despesa em jan; a partir de jan/2027 o anterior entraria (-800). Fixar C por `QuarkusMock` (`DashboardAccumulatedBalanceTest.FixedCurrentMonth`) e derivar o ano dele.
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
  - Criterios: — (inventario de consumidores do `balance` redefinido)
- [x] **T4** — Ordenar `GET /transactions` por valor desc, depois data desc, `createdAt` desc, `id`.
  - Arquivos: `TransactionRepository.java`
  - Criterios: 7
- [x] **T5** — Teste novo em `TransactionResourceTest` (helper com valor parametrizado): receitas e despesas alternadas com valores diferentes, dois lancamentos de mesmo valor em datas diferentes, `size=3` percorrendo todas as paginas; a ordem concatenada e a esperada. Os testes existentes usam todos 10,00 e seguem pela data.
  - Arquivos: `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java`
  - Criterios: 7
- [x] **T6** — Central (revisar com `.claude/skills/pipeline/revisar-textos/SKILL.md`): Resumo sem nenhum "acumulado" — Saldo do mes = Saldo anterior mais Receitas menos Despesas pagas; Saldo anterior = receitas menos despesas pagas de cada mes desde 1º de outubro de 2026; linha e quadro do grafico com o Saldo novo e quadro com receita, despesa e saldo; "mes sem lancamentos mostra todos os valores zerados" e "mes zerado" reescritos (o Saldo traz o anterior); DEC-8 (Saldo do mes corrente conta o mes inteiro, Saldo atual so ate hoje). Lancamentos: ordem do maior valor para o menor, receitas e despesas juntas; no celular, cartoes sem titulo por dia, cada um com a sua data. Relatorio: a mesma diferenca da DEC-8.
  - Arquivos: `SummaryAreaContent.java`, `TransactionsAreaContent.java`, `TransactionReportsAreaContent.java`
  - Criterios: 11
- [x] **T7** — Ajustar `DocumentationContentTest`: `shouldDescribeTheAccumulatedBalanceRulesInSummary` passa a exigir os termos novos e a ausencia de "acumulado" no Resumo; `shouldDescribeTheNewLayoutOfSummaryAndTransactions` troca "Sábado, 10 de outubro" pela ordem por valor; relatorio exige a frase da DEC-8.
  - Arquivos: `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`
  - Criterios: 11
- [x] **T8** — Bloco `1.0.3` (revisar com `.claude/skills/pipeline/revisar-textos/SKILL.md`): reescrever o item NEW "Saldo acumulado:" (a sobra entra no Saldo do mes e aparece como Saldo anterior; sem prometer Saldo acumulado); IMPROVEMENT "ordem do maior para o menor valor" (com a data em cada lancamento no celular) e "icone da guia com a marca do FinanceOS"; FIX "versao no rodape do menu abaixo do nome, sem quebrar". Bloco 1.0.2 intocado.
  - Arquivos: `ReleaseNotesContent.java`
  - Criterios: 12
- [x] **T9** — Ajustar `ReleaseNotesContentTest`: o teste do Saldo acumulado passa a achar o item reescrito e assere que nenhum item do 1.0.3 contem "Saldo acumulado"; teste novo para os tres itens.
  - Arquivos: `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java`
  - Criterios: 12
- [x] **T10** — Contrato no front: `DashboardSummary` sem `accumulatedBalance`; `MonthlySummary` com `previousBalance` no lugar; comentarios; fixture de `dashboard.service.spec.ts`.
  - Arquivos: `frontend/src/app/core/models.ts`, `frontend/src/app/core/services/dashboard.service.spec.ts`
  - Criterios: — (infraestrutura para T11)
- [x] **T11** — Resumo: legenda "Saldo anterior mais receitas menos despesas pagas"; `.balance-carry` so com "Saldo anterior"; bloco do mes com Receita, Despesa e Saldo (sai `accumulated` de `MonthBlock`/`ChartMonth`/`monthlySeries`); comentario da D1 corrigido; scss: sai `.accumulated strong` e o override de 2 colunas a 680px, `.month-block-values` em `repeat(3, ...)` nas duas larguras (so remove bytes).
  - Arquivos: `dashboard.ts`, `dashboard.html`, `dashboard.scss`
  - Criterios: 4, 5
- [x] **T12** — `dashboard.spec.ts`: `evolution()` simula o back (de out em diante `previousBalance` = carregado e `balance` = carregado + valor do mes; carrega so o valor cru); fixtures sem `accumulatedBalance`; legenda nova no teste dos cartoes; blocos com 3 valores; `describe('saldo acumulado')` vira o do Saldo novo: criterio 4 (anterior 400, receitas 3000, pagas 2800, `balance` 600, `paidExpensePercent` 93.3 -> "R$ 600,00", legenda, "Saldo anterior R$ 400,00", "Despesas pagas equivalem a 93,3% das receitas", host sem "acumulado"); criterio 5 (ponto de nov em `scaleY(600)`, informativo "Saldo R$ 600,00", bloco de 3 valores); renomear "plota o saldo do próprio mês, e não um acumulado".
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 4, 5
- [x] **T13** — Lancamentos sem titulo por dia: tira `tr.day-row` e `dayHeading`; `rows()` sem `heading` (cartao continuo: `groupStart` no primeiro, `groupEnd` no ultimo); ate 680px a `.date-cell` aparece numa area propria do grid (ex.: terceira linha `'icon date date'`, texto `--text-muted`); sai `.day-row` do scss. Desktop intocado.
  - Arquivos: `transactions.ts`, `transactions.html`, `transactions.scss`
  - Criterios: 8
- [x] **T14** — Remover `dayHeading` de `core/formatters.ts` e seu `describe` em `formatters.spec.ts`, e o token `--fs-day-heading` de `styles.scss` (sem consumidor apos T13).
  - Arquivos: `frontend/src/app/core/formatters.ts`, `frontend/src/app/core/formatters.spec.ts`, `frontend/src/styles.scss`
  - Criterios: 8
- [x] **T15** — `transactions.spec.ts`: trocar os dois testes de titulo por dia por: nenhum `tr.day-row`; cada `tr.transaction-row` com `.date-cell` mostrando a sua data (datas diferentes e repetidas); `thead` com as 6 colunas.
  - Arquivos: `frontend/src/app/features/transactions/transactions.spec.ts`
  - Criterios: 8
- [x] **T16** — Rodape e conta do "Mais": `<span class="app-version"><span class="app-name">{{ appName }}</span><span class="app-version-number">v{{ appVersion }}</span></span>`, sem `&middot;`; `.app-version` em coluna; `.app-version-number { white-space: nowrap; }`; recolhido segue escondendo, nome com reticencias.
  - Arquivos: `main-layout.html`, `main-layout.scss`
  - Criterios: 9
- [x] **T17** — `main-layout.spec.ts`: nos dois lugares (`.sidebar-footer` e `#sheet-more`), nome e `v${APP_VERSION}` em elementos separados e nenhum "·"; o teste "mostra iniciais, nome, versão e Sair no rodapé" fica como esta.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 9
- [x] **T18** — Favicon: `public/favicon.svg` (34x34, `rx="10"`, `#3b5bdb`, "F" em `<path>` `#ffffff`, nada externo alem do `xmlns`); `public/favicon.ico` regenerado da mesma marca (16/32/48) por script no scratchpad, fora do repo; `index.html` com `<link rel="icon" type="image/svg+xml" href="favicon.svg">` + o `.ico` como reserva.
  - Arquivos: `frontend/public/favicon.svg`, `frontend/public/favicon.ico`, `frontend/src/index.html`
  - Criterios: 10
- [x] **T19** — Rodar as varreduras (as duas de idioma, a de cor literal e a de recurso externo, comandos no `context.md`) e conferir `TransactionReportResourceTest` sem alteracao.
  - Arquivos: —
  - Criterios: 6, 13

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Cenario numerico do summary | T1, T2 |
| 2 | Anterior so da soma crua; editar/excluir | T1, T2 |
| 3 | `monthlyEvolution` = summary | T1, T2 |
| 4 | Cartao Saldo do mes | T11, T12 |
| 5 | Linha, informativo e bloco | T11, T12 |
| 6 | Relatorio inalterado | T1, T19 |
| 7 | Ordem por valor no back | T4, T5 |
| 8 | Celular sem titulo de dia | T13, T14, T15 |
| 9 | Versao em duas linhas | T16, T17 |
| 10 | Favicon | T18 |
| 11 | Central | T6, T7 |
| 12 | Novidades 1.0.3 | T8, T9 |
| 13 | Varreduras vazias | T19 |

## Superficie de validacao

- 1, 2, 3 — `DashboardAccumulatedBalanceTest` (T2); `GET /api/dashboard/summary?year=2026&month=11` sem `accumulatedBalance`.
- 4, 5 — `dashboard.spec.ts` (T12).
- 6 — `TransactionReportResourceTest` e `TransactionReportPreferenceResourceTest` sem diff.
- 7 — `TransactionResourceTest` (teste novo de T5).
- 8 — `transactions.spec.ts` (T15); tela a 390px.
- 9 — `main-layout.spec.ts` (T17); tela a 1280px.
- 10 — `curl -sI http://localhost/favicon.svg` -> 200 e `Content-Type: image/svg+xml`; `curl -sI http://localhost/favicon.ico` -> 200, `image/x-icon`, sha256 sem o prefixo `f9102be80297c052` e tamanho diferente de 15086 bytes (o `try_files` do nginx devolve 200 com `index.html` para arquivo inexistente: o status sozinho nao prova nada).
- 11 — `DocumentationContentTest` (T7) e `grep -i acumulad SummaryAreaContent.java` vazio.
- 12 — `ReleaseNotesContentTest` (T9).
- 13 — as varreduras de T19.

## Validacao manual (etapa 7)

- 4/5 — Resumo de nov/2026 em `http://localhost`: cartao, quadro abaixo do grafico com 3 valores a 1280px e a 390px (e 320px, sem quebrar valor), linha de saldo de out em diante subindo com o anterior.
- 8 — Lancamentos a 390px: sem titulo por dia, data visivel em cada cartao, cartao continuo bem arredondado; a 1280px a tabela com as 6 colunas.
- 9 — 1280px: "FinanceOS" e "v1.0.3-NN" em linhas separadas, versao inteira (DevTools > Computed `white-space: nowrap` em `.app-version-number`); menu recolhido sem nome/versao; conta do "Mais" a 390px igual.
- 10 — guia do navegador com a marca "F" (recarga forcada; favicon fica em cache).

## Riscos e pontos de atencao

- **Dupla contagem** (principal): somar o `balance` novo ao carregado infla os meses seguintes; T1 soma `income - expense`, T2 prova (`knowledge/dashboard.md`).
- Campo removido: todos os leitores de `accumulatedBalance` estao em T1/T2/T10-T12; a etapa 4 roda a suite completa.
- Mes vazio depois de out/2026 deixa de ter Saldo zero (dez = 600,00), mas a linha segue parando no ultimo mes com movimento (D2 da #48): o bloco mostra o Saldo e o grafico nao tem ponto. Coerente com a spec; observar.
- `DashboardResourceTest#shouldAcceptCurrentYearWithoutTransactions` (usuario `...0099`, mes real) passa a somar o anterior dele; verde enquanto nenhuma classe deixar lancamento dele de out/2026 em diante.
- `.ico` e binario: gerar por script fora do repo e conferir o sha256.
- Novidades: decisao escrita — tres itens novos e um reescrito (T8); o "agrupada por dia" do 1.0.2 fica como historico.

## Lacunas

- Nenhum criterio sem tarefa. Observacao: a DEC-8 pede o texto da diferenca entre Saldo do mes corrente e Saldo atual tambem no Relatorio, e nenhum criterio cita o Relatorio; ficou em T6/T7 sob o criterio 11.
- T3 e T10 nao tem criterio: T10 e infraestrutura de contrato; T3 protege a suite contra o `balance` redefinido.
