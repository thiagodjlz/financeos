# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; `curl http://localhost/` cita `main-27ADFG2K.js`, e o chunk do Resumo servido ja tem as linhas novas).
Branch: `feature/issue-113-saldo-acumulado` — mudancas ainda **nao commitadas**.
Na sessao do navegador headless, `/api/auth/me`, `/api/audit/screen-access` e `/api/dashboard/summary` foram respondidos dentro do navegador (`Fetch.fulfillRequest`) com token falso: nenhuma escrita, nada chegou ao backend. Nenhum JWT foi assinado e nao houve `GET` autenticado na API real: o comportamento autenticado do summary esta provado pela suite de `quality-check` (230 testes back, 542 front, todos verdes), nao por chamada a stack.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `previousBalance`/`accumulatedBalance` no summary e em `monthlyEvolution`; out/2026 anterior 0 | VERIFICADO | `DashboardAccumulatedBalanceTest#shouldStartAccumulationInOctober2026` (passou); `DashboardResource.java` `withAccumulatedBalance` |
| 2 | out/nov com C = dez, negativo levado adiante | VERIFICADO | `#shouldCarryNegativeBalanceToTheNextMonths` (passou) |
| 3 | mes futuro soma so ate C (inclui virada de ano) | VERIFICADO | `#shouldSumFutureMonthsOnlyUntilTheCurrentMonth` (passou) |
| 4 | antes de 01/10/2026 nunca entra | VERIFICADO | `#shouldIgnoreTransactionsBeforeOctober2026` (passou) |
| 5 | mes anterior a out/2026: acumulado = saldo; jan-set da evolucao | VERIFICADO | `#shouldKeepAccumulatedEqualToBalanceBeforeOctober2026` (passou) |
| 6 | pendente fora do anterior | VERIFICADO | `#shouldIgnorePendingExpenseInPreviousBalance` (passou); SQL `status = 'PAID'` em `DashboardRepository#balanceBetween` |
| 7 | escopo por usuario | VERIFICADO | `#shouldAccumulateOnlyTheLoggedUserTransactions` (passou); `where user_id = ?` |
| 8 | calculado na hora, sem migration | VERIFICADO | `#shouldRecalculateAfterEditingOrDeletingAnOldTransaction` (passou); diff sem arquivo em `db/migration`; `flyway_schema_history` da stack termina na versao 17 (`create audit`) |
| 9 | nao-regressao (campos, linha mensal, informativo) | VERIFICADO | `#shouldKeepExistingTotalsUnchanged` e `DashboardResourceTest` (18, inalterado no diff) passaram; `dashboard.spec.ts` "plota o saldo do próprio mês, e não um acumulado" e "mantém o informativo flutuante com Receita, Despesa e Saldo, sem o acumulado" passaram (rodado de novo nesta etapa: 69/69); informativo no build servido sem "Acumulado" (`evidence/medicoes-navegador.md`) |
| 10 | "Saldo anterior" e "Saldo acumulado" no quadro, da API, valor principal mantido | VERIFICADO | `dashboard.spec.ts` "mostra Saldo anterior e Saldo acumulado da API no quadro..." (passou); build servido: nov -R$ 200,00 (40px) / R$ 400,00 / R$ 200,00 (18px) nas 6 larguras |
| 11 | "Acumulado" no bloco, troca sem HTTP | VERIFICADO | `dashboard.spec.ts` "mostra o Acumulado do mês no bloco e troca..." (passou); build servido: clique/toque em Outubro troca para R$ 400,00 com 0 requisicoes |
| 12 | negativos com sinal | VERIFICADO | `dashboard.spec.ts` "mostra Saldo anterior e acumulado negativos com o sinal de menos" (passou); build servido: -R$ 500,00 / -R$ 600,00 |
| 13 | Central e Novidades 1.0.3 | VERIFICADO | `DocumentationContentTest#shouldDescribeTheAccumulatedBalanceRulesInSummary` e `ReleaseNotesContentTest#shouldAnnounceTheAccumulatedBalanceAsNewIn103` (passaram); cada afirmacao do diff de `SummaryAreaContent.java` conferida com `DashboardResource`/`DashboardRepository`; revisao `revisar-textos` registrada em `implementation-notes.md`; fontes em UTF-8 sem mojibake (`º` = `c2 ba`) |
| 14 | varreduras de idioma vazias | VERIFICADO | os dois `rg` do `context.md` sairam vazios nesta etapa (e a de cor literal tambem) |

## Roteiro de validacao manual

Antes de tudo: o `index.html` sai sem `Cache-Control`, entao o navegador pode seguir com a tela antiga. Faca **Ctrl+F5** no computador (no celular, feche e reabra a aba). Sinal de tela antiga: o quadro "Saldo do mês" nao tem as linhas "Saldo anterior" e "Saldo acumulado", e o quadro abaixo do grafico tem so 3 valores (sem "Acumulado").

1. Abra `http://localhost`, entre com a sua conta e fique no Resumo de **Outubro de 2026**. Esperado: no quadro "Saldo do mês" o valor grande continua sendo o saldo do mes; abaixo da barra "Despesas pagas equivalem a ...", aparecem "Saldo anterior **R$ 0,00**" e "Saldo acumulado" com o **mesmo valor** do saldo do mes (outubro e o primeiro mes). O valor grande continua visivelmente maior que o acumulado. (criterios 1 e 10, com os seus dados)
2. Clique em "Próximo mês" (Novembro de 2026). Esperado: "Saldo anterior" = o saldo de outubro que voce viu no passo 1; "Saldo acumulado" = esse valor mais o saldo de novembro (sem lancamentos em novembro, os dois ficam iguais). Volte para **Setembro de 2026**: "Saldo anterior R$ 0,00" e "Saldo acumulado" igual ao saldo do mes. (criterios 3 e 5, com os seus dados)
3. Em Outubro, olhe o quadro logo abaixo do grafico. Esperado: quatro valores na mesma linha — Receita, Despesa, Saldo e **Acumulado**. Abra o DevTools (F12) > Network e clique em outro mes do grafico: o titulo e o Acumulado trocam para aquele mes e **nenhuma** chamada nova a `/api/dashboard/summary` aparece. (criterio 11)
4. Numeros alinhados (a implementacao trocou o `tabular-nums` do `dashboard.scss` pela classe global `.tabular` em elementos que ja existiam). Compare com o que voce conhece da tela: o valor grande do Saldo do mês, Receitas e Despesas do quadro, o valor de Pendentes, os percentuais e valores da lista "Por categoria" e o total no rodape dela, os valores do quadro abaixo do grafico e os do informativo ao passar o mouse no grafico. Esperado: aparencia **identica** a de antes — algarismos de largura fixa, valores da coluna direita de "Por categoria" alinhados digito a digito. Conferencia opcional: no DevTools, clique com o botao direito no valor grande > Inspecionar > aba Computed > `font-variant-numeric` = `tabular-nums` (medido igual em todos os 8 elementos, ver `evidence/medicoes-navegador.md`). (nao-regressao da troca)
5. No celular (ou DevTools com largura 390 e depois 320): o quadro "Saldo do mês" mostra as duas linhas novas sem cortar valor nem empurrar a tela para o lado; o quadro abaixo do grafico vira **duas linhas** de dois valores (Receita | Despesa, Saldo | Acumulado) com a dica "Toque em um mês do gráfico para ver os valores."; tocar em outro mes troca o Acumulado. (criterios 10 e 11, aparencia)
6. Va em Sobre > Documentação > Resumo e leia "Descrição", "Indicadores" (linhas Saldo anterior e Saldo acumulado), "Regras" e "Particularidades"; depois Sobre > Novidades por versão > 1.0.3, item "Saldo acumulado". Esperado: texto claro para quem usa o sistema, sem termo tecnico. (criterio 13, tom)

## Dados de teste criados

Nenhum. Nenhuma escrita na stack local (as respostas da tela foram simuladas dentro do navegador).

## Achado fora dos criterios

- O container `financeos-backend` roda em UTC (`date` = UTC, sem `TZ`), e o mes corrente vem de `YearMonth.now()` (`CurrentMonth.java`). Das 21h a meia-noite (horario de Brasilia) do ultimo dia de cada mes, o servidor ja considera o mes seguinte como corrente; so muda o Saldo anterior de meses a partir de C+2 nessa janela. Mesmo comportamento que o default de periodo ja tinha; registrado em "Riscos" do plano. Nao bloqueia.
- `docker-report.md`: imagem tagueada `1.0.2-04` por causa do `APP_VERSION` fixo no `.env` (codigo rodando e o da feature). Preexistente.

## Conclusao

14 de 14 criterios verificados automaticamente (testes da suite + medicao no build servido). Nenhum NAO ATENDIDO. O roteiro acima pede ao usuario so o que depende de olho humano: os valores com os seus dados reais, a aparencia em celular, o alinhamento dos numeros apos a troca para `.tabular` e o tom dos textos.

Validado pelo usuario em 2026-10-20.
