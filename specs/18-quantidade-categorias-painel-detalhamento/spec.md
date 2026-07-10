---
issue: 18
url: https://github.com/thiagodjlz/financeos/issues/18
title: "Ajuste da quantidade do painel de Detalhamento"
domains: [dashboard]
stage: pr-open
branch: feature/issue-18-quantidade-categorias-painel-detalhamento
created: 2026-07-08
---

# Ajuste da quantidade do painel de Detalhamento

## Historia

Como usuario do FinanceOS, quero que os cabecalhos "Receitas" e "Despesas" do painel "Detalhamento" (aba Resumo) mostrem a quantidade de categorias de cada tipo, para que eu consiga ver rapidamente quantas categorias distintas tiveram movimentacao no periodo, sem duplicar a informacao de valor total que ja aparece nos cards de metricas do topo.

## Contexto

A issue pede, na aba Resumo, painel "Detalhamento": "Ajustar a quantidade do cabecalho Receitas e Despesas para mostrar a quantidade de categoria de cada tipo e nao o valor em reais (R$)."

Hoje, em `frontend/src/app/features/dashboard/dashboard.html`, o painel "Detalhamento" tem duas secoes empilhadas (regra ja documentada em `knowledge/dashboard.md`): "Receitas" (verde) e "Despesas" (vermelho), cada uma com um cabecalho (`category-section-header`) que exibe o tipo e, ao lado, `{{ formatMoney(summary()?.totalIncome) }}` / `{{ formatMoney(summary()?.totalExpense) }}` — ou seja, o valor total em R$ do tipo (o mesmo valor ja exibido nos cards de metricas do topo "Receitas"/"Despesas", fora do painel Detalhamento).

A mudanca e trocar esse valor monetario, apenas dentro dos cabecalhos do painel "Detalhamento", pela contagem de categorias distintas daquele tipo que aparecem na lista abaixo do cabecalho (`categoriesByType('INCOME')` / `categoriesByType('EXPENSE')`, que ja filtram `summary()?.categoryBreakdown` por tipo). Essa lista ja e a fonte usada para renderizar as linhas de categoria e o estado vazio "Sem dados no periodo", entao a contagem de categorias e simplesmente o tamanho desse array filtrado — sem necessidade de mudanca no backend (`DashboardSummaryResponse`/`CategoryBreakdown` ja retornam um item por `(category_id, type)` no periodo).

Os 4 cards de metricas do topo (Receitas, Despesas, Pendente, Saldo, fora do painel "Detalhamento") e o rodape do painel ("Total" com a contagem geral de linhas de `categoryBreakdown`) nao sao mencionados na issue e continuam mostrando o que mostram hoje.

## Criterios de aceite

- [ ] No painel "Detalhamento" da aba Resumo, o cabecalho da secao "Receitas" (verde) exibe a quantidade de categorias distintas do tipo `INCOME` presentes em `categoryBreakdown` no periodo selecionado (ou seja, `categoriesByType('INCOME').length`), em vez do valor monetario `totalIncome`.
- [ ] No painel "Detalhamento" da aba Resumo, o cabecalho da secao "Despesas" (vermelho) exibe a quantidade de categorias distintas do tipo `EXPENSE` presentes em `categoryBreakdown` no periodo selecionado (`categoriesByType('EXPENSE').length`), em vez do valor monetario `totalExpense`.
- [ ] Quando nao ha categorias de um tipo no periodo (lista vazia, estado "Sem dados no periodo" exibido), o cabecalho daquela secao mostra `0`.
- [ ] Os 4 cards de metricas do topo do Resumo ("Receitas", "Despesas", "Pendentes", "Saldo") continuam exibindo valores monetarios formatados (`formatMoney`), sem alteracao.
- [ ] O rodape do painel "Detalhamento" ("Total") continua exibindo a contagem total de linhas de `categoryBreakdown` (receitas + despesas), sem alteracao.
- [ ] Nenhuma mudanca de contrato de API/backend e necessaria: o campo usado para a contagem (`categoryBreakdown`, ja filtrado por tipo via `categoriesByType`) ja existe em `DashboardSummaryResponse`.

## Fora de escopo

- Alteracao dos cards de metricas do topo da aba Resumo (fora do painel "Detalhamento").
- Alteracao do rodape "Total" do painel "Detalhamento".
- Qualquer mudanca no backend (`DashboardResource`/`DashboardRepository`) ou no calculo de totais/quebra por categoria descrito em `knowledge/dashboard.md`.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/18
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/dashboard.md`
- Codigo consultado: `frontend/src/app/features/dashboard/dashboard.html`, `frontend/src/app/features/dashboard/dashboard.ts`
