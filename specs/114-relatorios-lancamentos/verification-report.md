# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; `flyway_schema_history` com V18 `success = t`).
Branch: `feature/issue-114-relatorios-lancamentos` — mudancas ainda **nao commitadas**.
Medicoes de tela feitas num Chrome headless com todas as respostas `/api/*` substituidas so dentro da sessao do navegador e token falso: nenhuma chamada chegou ao backend, nenhum login, nenhuma escrita (`evidence/verificacao-navegador.md`). Reverificacao apos a correcao de impressao: bundle `main-YLH25ZK7.js`, PDF A4 real conferido por `pdftotext`.
Suites: backend 269, frontend 573, 0 falhas; logs (07:47-07:48) posteriores a correcao de CSS (07:43-07:44).

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Screen, migration, `/me`, Perfis | VERIFICADO | `Screen.java` +`TRANSACTION_REPORTS("Relatórios - Lançamentos")`; V18 so `alter`/`insert ... on conflict`/`create` (sem `update`); psql: 2 perfis, 2 linhas, 2 com os 4 flags `true`, check com 9 telas; `AuthResourceTest` (9 telas, passou); `ProfileResourceTest#shouldGrantTransactionReportsWithEveryActionToEveryProfileBySeed`, `#shouldKeepTheFourActionsOfTransactionReports`; `profile-form.spec.ts` "tem nove linhas" |
| 2 | Menu, "Mais", rota, acesso | VERIFICADO | `main-layout.spec.ts` "mostra/esconde a seção Relatórios..." e "Acesso à tela" com `/transaction-reports` + `?x=1` = um registro; `app.routes.ts` com `permissionGuard('TRANSACTION_REPORTS','VIEW')`; `entry-route.spec.ts` "põe o relatório depois de Lançamentos..." |
| 3 | `require` + 403/401/super_admin | VERIFICADO | `TransactionReportSecurityTest` (5 testes: 401, 403 com a mensagem em todos, VIEW x escritas, cada acao, super_admin 200); `curl` sem token: 401 nos 5 endpoints e em `POST /api/audit/print` |
| 4 | Outro usuario fora | VERIFICADO | `TransactionReportResourceTest#shouldLeaveOtherUsersTransactionsOut` (linha, grupo, total e Saldo atual) |
| 5 | Filtros | VERIFICADO | `TransactionReportResourceTest#shouldResolvePreviousMonthWithTheFixedToday`, `#shouldFilterByTwoOfThreeCategories`, `#shouldFilterByType`, `#shouldFilterByStatusLeavingIncomeOut`, `#shouldFilterBySource`, `#shouldFilterByInclusiveAmountRange`, `#shouldFilterInstallmentsAndSinglePayments`, `#shouldCombineFiltersWithAnd` |
| 6 | 400 em portugues | VERIFICADO | `TransactionReportResourceTest#shouldRejectInvalidCriteriaInPortuguese` (todas as mensagens do criterio) |
| 7 | Agrupamento | VERIFICADO | `#shouldGroupByCategoryThenMonthWithSubtotals` (valores exatos do criterio), `#shouldGroupInThreeLevelsWithoutStatusAndWithoutCategoryLast` |
| 8 | Saldo do periodo | VERIFICADO | `#shouldComputeThePeriodBalanceWithPaidExpensesOnly` (400,00 total e grupo; so a categoria filtrada); tela exibe o valor da API sem recalcular (API com total 777,77 inconsistente com as linhas -> quadro `R$ 777,77`) |
| 9 | Saldo atual | VERIFICADO | `#shouldComputeTheCurrentBalanceIgnoringFilters` (600,00; igual com Despesa + "Ano anterior") |
| 10 | Quadros fixos | VERIFICADO | `transaction-reports.spec.ts` "mostra Saldo e Saldo atual em dois quadros fixos..." |
| 11 | Colunas | VERIFICADO | spec "desmarcar Categoria...", "sem nenhuma coluna...", "rotula Tipo, Status e Origem..."; `TransactionReportPreferenceResourceTest#shouldRejectInvalidColumnsAndCriteria` (vazia/invalida/repetida = 400) |
| 12 | Sem paginacao | VERIFICADO | `#shouldReturnEveryRowWithoutPagination` (120 linhas) |
| 13 | Preferencias | VERIFICADO | `TransactionReportPreferenceResourceTest#shouldRequireNameInPortuguese`, `#shouldRejectRepeatedNameOnlyForTheSameUser`, `#shouldListOnlyTheLoggedUserPreferences`, `#shouldAnswerNotFoundForAnotherUsersPreference`, `#shouldKeepRelativePeriodWithoutDatesAndResolveItOnTheNewMonth`, `#shouldKeepCustomDates`. (a frase vem em `violations[].message`; o `message` segue o padrao do mapper, como em Perfis) |
| 14 | Padrao | VERIFICADO | `#shouldKeepASingleDefaultPreference`; spec "abre aplicando a preferência padrão..." e "sem preferência padrão, abre no Mês atual..." |
| 15 | Categoria excluida/inativa | VERIFICADO | `#shouldDropDeletedCategoryAndKeepInactiveOne` |
| 16 | Auditoria | VERIFICADO | `@Audited` + `AuditTrail` nos 3 metodos de escrita; `#shouldAuditEveryWriteWithTheNameAsLabel`; `AuditCoverageTest` com `AuditResource.print` (passou); `AuditEventsTest#shouldRecordPrintWithTheScreen` |
| 17 | Imprimir + `@media print` | VERIFICADO | `AuditEventsTest#shouldRecordPrintWithTheScreen`; spec "Imprimir registra..." e "...mesmo se o registro falhar"; print emulado: somem menu/filtros/preferencias/botoes, ficam quadros, resumo e tabela; PDF A4 real com as colunas padrao e com as 9 colunas, todas com valores (`evidence/verificacao-navegador.md`) |
| 18 | 375px | VERIFICADO | 375 px, 9 colunas: doc `scrollWidth` 375 = janela; `.table-wrap` 341/1721 `overflow-x: auto`; `scrollLeft` 200 na tabela, `scrollX` 0 na pagina |
| 19 | Vazio e falha | VERIFICADO | spec "sem lançamentos, mostra o vazio..." e "falha da API vira aviso de Falha..." |
| 20 | Central e Novidades | VERIFICADO | `DocumentationContentTest` (7 areas, `#shouldDescribeBothBalancesAndThePreferencesOfTheTransactionReport`), `DocumentationResourceTest`, `ReleaseNotesContentTest#shouldAnnounceTheTransactionReportAsNewIn103` (passaram); `revisar-textos` registrada nas notas |
| 21 | Nao-regressao | VERIFICADO | nada em `transactions/`/`dashboard/` (back e front); `ListParams` so acrescimos; CSS novo restrito a `.scroll-table` (so na tela nova), `.print-only` e `@media print`; suites passaram; varreduras de idioma e cor vazias |

## Roteiro de validacao manual

Todos os criterios foram medidos; o roteiro e so a conferencia visual com os seus dados reais.

0. Recarregue `http://localhost` com Ctrl+F5 (celular: feche e reabra a aba). Se o menu nao tiver a secao **Relatórios**, o navegador ainda esta com o build antigo.
1. Entre com o seu usuario e va em **Relatórios > Lançamentos** (`http://localhost/transaction-reports`). Esperado: quadros **Saldo** e **Saldo atual** no topo e a tabela do mes atual; confira se os valores batem com o que voce espera dos seus lancamentos.
2. Clique em **Imprimir** e olhe a pre-visualizacao (A4, retrato): sem menu, filtros e botoes; com os quadros, "Período / Filtros / Gerado em" e a tabela com a coluna **Valor** inteira. Marque todas as colunas e repita: textos longos quebram dentro da celula e nenhuma coluna sai da pagina. Em **Configurações > Auditoria** aparece um registro **Impressão** de **Relatórios - Lançamentos**.
3. No celular (ou DevTools em 375 px): a tabela rola para os lados dentro do quadro e a pagina nao.

## Dados de teste criados

Nenhum. Leituras `psql` somente; `curl` so sem token (401, nada gravado).

## Achado fora dos criterios

- Tag das imagens Docker `1.0.2-04` x `VERSION` `1.0.3-dev` (preexistente, ver `docker-report.md`).

## Nao-regressao das correcoes

A correcao mexeu so em `@media print` (`styles.scss` global e `transaction-reports.scss`). Reconferidos: 18 (375 px, ainda `nowrap` e rolagem so na tabela), 17 (impressao) e a tela em 1440 (`td` `nowrap`). Os demais criterios nao dependem de CSS de impressao.

## Conclusao

21 de 21 criterios verificados automaticamente; nenhum NAO ATENDIDO. O defeito da rodada anterior (coluna Valor ausente no PDF A4) foi corrigido: o PDF real traz Valor com as colunas padrao e com as 9 colunas. O roteiro acima e so conferencia visual com os dados do usuario.

Validado pelo usuario em 2026-10-21.
