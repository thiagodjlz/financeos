# Notas de implementacao

Branch: `feature/issue-18-quantidade-categorias-painel-detalhamento`

## Arquivos alterados

- `frontend/src/app/features/dashboard/dashboard.html` — no cabecalho `.category-section-header.income`, trocado `{{ formatMoney(summary()?.totalIncome) }}` por `{{ categoriesByType('INCOME').length }}`; no cabecalho `.category-section-header.expense`, trocado `{{ formatMoney(summary()?.totalExpense) }}` por `{{ categoriesByType('EXPENSE').length }}`.

## Decisoes

- Usado o metodo `categoriesByType(type)` ja existente em `dashboard.ts` (mesmo usado para renderizar as linhas e o estado vazio de cada secao), sem criar logica nova — garante que a contagem no cabecalho sempre bate com o numero de linhas listadas abaixo.
- Nao foi necessario tratamento extra para lista vazia: `categoriesByType` retorna `[]` quando nao ha dados, entao `.length` resolve para `0` naturalmente.

## Desvios em relacao ao plano

Nenhum desvio. A mudanca ficou restrita aos dois bindings no template, exatamente como descrito em `plan.md`; cards de metricas do topo e rodape "Total" nao foram tocados.
