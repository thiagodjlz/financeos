# Notas de implementacao

Branch: `feature/issue-113-saldo-acumulado` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 9 de 9 concluidas (ver `plan.md`)

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/dashboard/CurrentMonth.java` (novo) — bean `@ApplicationScoped` com `YearMonth current()`; os testes o substituem por `QuarkusMock`.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java` — `balanceBetween(userId, inicio, fim)`: receitas menos despesas pagas do intervalo.
- `backend/src/main/java/br/com/financeos/dashboard/MonthlySummaryResponse.java` — campo `accumulatedBalance` (nasce igual ao `balance`) e `withAccumulatedBalance`.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardSummaryResponse.java` — campos `previousBalance` e `accumulatedBalance`.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` — inicio fixo `YearMonth.of(2026, 10)`, serie acumulada dos 12 meses, summary com anterior/acumulado do mes pedido; default de periodo vem de `CurrentMonth`.
- `backend/src/main/java/br/com/financeos/documentation/content/SummaryAreaContent.java` — area Resumo descreve Saldo anterior/Saldo acumulado (Descricao, Funcionalidades, Indicadores, Regras, Particularidades).
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — item NEW "Saldo acumulado" no bloco `1.0.3`.
- `backend/src/test/java/br/com/financeos/dashboard/DashboardAccumulatedBalanceTest.java` (novo) — 9 testes, um por criterio 1-9.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — `shouldDescribeTheAccumulatedBalanceRulesInSummary`.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — `shouldAnnounceTheAccumulatedBalanceAsNewIn103` (busca por `version("1.0.3")`).
- `frontend/src/app/core/models.ts` — `previousBalance`, `accumulatedBalance` no summary; `accumulatedBalance` no mes.
- `frontend/src/app/features/dashboard/dashboard.ts` — `ChartMonth` com acumulado; `monthBlock` (tipo `MonthBlock`) com `accumulated`; informativo e `announcement` intocados.
- `frontend/src/app/features/dashboard/dashboard.html` — `.balance-carry` com "Saldo anterior" e "Saldo acumulado" no quadro; "Acumulado" no bloco do mes; classe global `tabular` nos valores numericos.
- `frontend/src/app/features/dashboard/dashboard.scss` — estilos de `.balance-carry`, bloco com 4 colunas (2 abaixo de 680px); `font-variant-numeric` trocado pela classe global `.tabular`.
- `frontend/src/app/features/dashboard/dashboard.spec.ts` — `evolution()` deriva o acumulado; `payload()`/`JULY` coerentes; asserts do bloco com 4 valores; `describe('saldo acumulado')` com 4 testes.
- `frontend/src/app/core/services/dashboard.service.spec.ts` — literal tipado com os campos novos.
- `specs/113-saldo-acumulado/{plan.md,spec.md,context.md,implementation-notes.md}` — tarefas marcadas, front-matter, consulta fora do briefing.

## Decisoes

- Anterior/acumulado do summary saem da mesma serie de `monthlyEvolution` (`previousBalance = accumulated(M) - balance`), entao quadro e bloco do mes nunca divergem. Uma unica consulta extra (`balanceBetween`) da o saldo carregado ate janeiro do ano pedido.
- Fixture de front `evolution()` simula o back-end com mes corrente em dez/2026 (antes de outubro = saldo; de outubro em diante soma), para nao provar estado impossivel (issue #48).
- Criterio 8 no teste: edicao de valor feita direto pelo repositorio (o PUT exige categoria, irrelevante aqui) e exclusao pelo `DELETE /transactions/{id}`.
- `DashboardAccumulatedBalanceTest` limpa pelo prefixo `Teste acumulado` no `@BeforeEach` e no `@AfterEach`, em qualquer usuario.
- `periods()` continua usando `Year.now()`: fora do escopo; so o default do summary passou a usar `CurrentMonth`.

### Revisao de textos (`revisar-textos`)

- Resumo/Descricao: "... e quanto sobrou." -> "... e quanto sobrou. Também mostra quanto você juntou desde 1º de outubro de 2026, somando o que sobrou de cada mês." (resultado percebido, sem termo tecnico).
- Funcionalidades: quadro Saldo do mes ganhou "as linhas Saldo anterior e Saldo acumulado" (rotulos da tela).
- Indicadores: linhas novas "Saldo anterior" e "Saldo acumulado" (regra de `DashboardResource`).
- Regras: "Um lançamento excluído ... deixa de contar em todos os totais." -> acrescido "inclusive no Saldo acumulado dos meses seguintes. Alterar o valor ou a data de um lançamento antigo também muda o acumulado na mesma hora."; itens novos: inicio em 1º/10/2026, saldo negativo segue adiante, pendente fora do anterior, mes futuro soma so ate o mes atual.
- Particularidades: linha do grafico continua mensal + "O Saldo acumulado aparece só no quadro Saldo do mês e no quadro abaixo do gráfico."; quadro abaixo do grafico: "a receita, a despesa e o saldo" -> "a receita, a despesa, o saldo e o acumulado".
- Novidades 1.0.3 (NEW): "Saldo acumulado: a partir de outubro de 2026, o que sobra de cada mês passa para o seguinte, e o Resumo mostra o Saldo anterior e o Saldo acumulado no quadro Saldo do mês e no quadro abaixo do gráfico." Nenhum item existente do 1.0.3 fica desmentido.
- Todas as afirmacoes conferidas com `DashboardResource`/`DashboardRepository`; nenhuma usa "contas" (barrado pelo teste) nem termo tecnico.

## Desvios em relacao ao plano

- T5: as linhas novas estouravam o budget `anyComponentStyle` do `dashboard.scss` (8,49 kB > 8 kB; antes 7,87 kB). Para caber, os 8 `font-variant-numeric: tabular-nums` do arquivo foram trocados pela classe global `.tabular` de `styles.scss` no template (mesmo efeito visual), e as linhas reaproveitam `.balance-ratio-text` em vez de estilo proprio. `ng build` sai sem aviso (7,95 kB). Os seletores de teste do quadro sao `.balance-carry > span`.
