# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; os 31 `.js` servidos sao byte a byte iguais ao `frontend/dist`).
Branch: `fix/issue-117-desconto-saldo-acumulado` — mudancas ainda **nao commitadas**. O diff (32 arquivos + `favicon.svg`) bate com a lista de `implementation-notes.md`; nenhuma mudanca alheia.
Telas medidas num Chrome headless com **todas** as respostas de `/api/*` substituidas dentro da sessao do navegador e token falso: nenhuma chamada chegou ao backend, nenhuma escrita, nenhum login. Fora isso, so `curl` sem token (401) e estaticos. Nenhum JWT proprio. Medicoes: `specs/117-desconto-saldo-acumulado/evidence/medicoes-navegador.md`.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Cenario numerico do summary (out/nov/dez/fev; set/2026) | VERIFICADO | `DashboardAccumulatedBalanceTest#shouldAddThePreviousBalanceToTheMonthBalance` e `#shouldIgnoreTransactionsBeforeOctober2026` (passaram, surefire 11/11) |
| 2 | Anterior so da soma crua; editar/excluir muda os seguintes | VERIFICADO | `#shouldNeverCarryTheNewMonthBalanceIntoThePreviousBalance`, `#shouldRecalculateAfterEditingOrDeletingAnOldTransaction`, `#shouldIgnorePendingExpenseInPreviousBalance`, `#shouldSumFutureMonthsOnlyUntilTheCurrentMonth`, `#shouldAccumulateOnlyTheLoggedUserTransactions`; `DashboardResource.java` soma `month.monthResult()` ao carregado, nunca o `balance` |
| 3 | `monthlyEvolution` = summary de cada mes; antes de out cru | VERIFICADO | `#shouldMatchTheMonthlyEvolutionWithTheSummaryOfEachMonth` (out 400, nov 600, dez 600, mar −250; os 12 meses contra o summary) e `#shouldNotExposeTheAccumulatedBalance` |
| 4 | Cartao Saldo do mes (600, legenda, anterior 400, 93,3%, sem "Saldo acumulado") | VERIFICADO | `dashboard.spec.ts` "mostra o Saldo do mês com o Saldo anterior somado, a legenda nova e nenhum Saldo acumulado" (suite 571/571); no build servido, nos 5 tamanhos: R$ 600,00, legenda nova, so "Saldo anterior R$ 400,00", nada com "acumulado" |
| 5 | Linha, informativo e bloco com o Saldo novo; bloco com 3 valores nas duas larguras | VERIFICADO | `dashboard.spec.ts` "plota na linha o Saldo do mês com o Saldo anterior", "mostra no informativo flutuante o mesmo Saldo do quadro", "mostra só Receita, Despesa e Saldo no bloco do mês…"; medido: bloco com 3 valores numa linha a 1440/1024/768/390/320, informativo "Saldo R$ 600,00" |
| 6 | Relatorio inalterado | VERIFICADO | `TransactionReportResourceTest` (17) e `TransactionReportPreferenceResourceTest` (10) passaram sem diff nos testes (`git diff` vazio em `src/test/.../reports`); no `main` so o comentario de `TransactionReportResource.java:29` |
| 7 | `GET /transactions` por valor desc, tipos misturados, desempates, todas as paginas | VERIFICADO | `TransactionResourceTest#shouldOrderByAmountMixingIncomesAndExpensesAcrossPages` (passou; 6 itens, `size=3`, 2 paginas, empate 300 em datas diferentes); `TransactionRepository.java:55` `order by amount desc, transactionDate desc, createdAt desc, id` |
| 8 | 390px sem `tr.day-row`, data em cada linha; desktop com as colunas | VERIFICADO | `transactions.spec.ts` "não titula os dias…" e "mantém as seis colunas…"; medido: 0 `tr.day-row` em todas as larguras, `.date-cell` visivel em cada cartao a 390/320, 6 colunas a 1440/1024/768 |
| 9 | Nome e versao em linhas separadas, sem "·", versao `nowrap` | VERIFICADO | `main-layout.spec.ts` "mostra o nome e a versão em linhas separadas, sem o ponto, no rodapé e no painel Mais"; medido: menu 1280/1024 e Mais 390/320 com "FinanceOS" e "v1.0.3-01" em linhas distintas, versao em 1 linha (18px), `nowrap`, sem corte; recolhido 0x0 |
| 10 | Favicon SVG com a marca + `.ico` novo, ambos 200 | VERIFICADO | `curl -I`: `favicon.svg` 200 `image/svg+xml` (34x34, `rx=10`, `#3b5bdb`, "F" `#ffffff`); `favicon.ico` 200 `image/x-icon`, 2811 bytes, sha256 `c2140972…` (16/32/48); `index.html` servido declara os dois |
| 11 | Central: Resumo sem "acumulado"; Lancamentos com a nova ordem | VERIFICADO | `DocumentationContentTest#shouldDescribeTheAccumulatedBalanceRulesInSummary`, `#shouldDescribeTheNewLayoutOfSummaryAndTransactions`, `#shouldDescribeBothBalancesAndThePreferencesOfTheTransactionReport` (passaram); `grep -i acumulad SummaryAreaContent.java` vazio; revisao `pipeline:revisar-textos` registrada (antes -> depois) em `evidence/revisao-textos.md`, citada nas notas |
| 12 | Bloco 1.0.3 reescrito + 3 itens | VERIFICADO | `ReleaseNotesContentTest#shouldAnnounceTheAccumulatedBalanceAsNewIn103` (nenhum item do 1.0.3 com "Saldo acumulado") e `#shouldAnnounceAmountOrderTabIconAndVersionFixIn103` (passaram); bloco 1.0.2 intocado |
| 13 | Varreduras de idioma vazias | VERIFICADO | as duas de `knowledge/architecture.md` rodadas agora com `rg` 14.1.1: vazias (tambem as de cor literal e de recurso externo) |

## Roteiro de validacao manual

Nenhum criterio ficou para o usuario. O roteiro abaixo e so a conferencia visual com os **seus** dados, para o aval antes do `/pipeline:open-pr`.

0. Em `http://localhost`, faca **Ctrl+F5** (no celular, feche e reabra a aba). Se o rodape do menu ainda mostrar "FinanceOS · v1.0.3-01" numa linha so, ou o Resumo ainda mostrar a linha "Saldo acumulado", e o build anterior em cache: repita o Ctrl+F5.
1. Va em Resumo e escolha novembro de 2026 (ou o mes atual). Esperado: o Saldo do mes ja inclui o "Saldo anterior" mostrado logo abaixo; a legenda diz "Saldo anterior mais receitas menos despesas pagas"; nao existe "Saldo acumulado" em lugar nenhum; o quadro abaixo do grafico mostra so Receita, Despesa e Saldo, e o Saldo e o mesmo do quadro grande. Confira se os numeros fazem sentido para o seu dinheiro. (criterios 4 e 5)
2. Va em Lancamentos. Esperado: do maior valor para o menor, receitas e despesas misturadas. Estreite a janela ate o tamanho de celular (ou abra no celular): nenhum titulo por dia, cada cartao com a sua data em cinza na ultima linha. (criterios 7 e 8)
3. Veja a guia do navegador. Esperado: um quadrado azul com um "F" branco, no lugar do escudo do Angular (se nao mudou, feche e reabra o navegador: o icone fica em cache a parte). (criterio 10)

## Dados de teste criados

Nenhum. As telas foram medidas com respostas simuladas dentro do navegador; nenhuma requisicao chegou ao banco.

## Achado fora dos criterios

- **Painel Mais a 320px com nome longo**: com um nome de 36 caracteres, a conta do painel Mais passa 19px da borda da tela (a 390px cabe). Preexistente: desligar as regras novas da versao nao muda nada; a causa e o nome com `nowrap`. Detalhe em `evidence/medicoes-navegador.md`.
- **`APP_VERSION=1.0.4-dev` no `.env`**: so muda a tag das imagens Docker (`docker-compose.yml:26,44`). O bundle servido traz so `"1.0.3-01"` e o rodape mostra `v1.0.3-01`, entao a tela nao e afetada. Ajustar o `.env` para `1.0.3-01` e opcional.

## Conclusao

13 de 13 verificados automaticamente; nenhum depende do usuario. Nenhum NAO ATENDIDO: a feature esta pronta para o aval do usuario e para o `/pipeline:open-pr` (commit com `FINANCEOS_TEXTOS_REVISADOS=1`; depois do merge em `v1.0.3`, levar a correcao para a `main`).

Validado pelo usuario em 2026-10-30.
