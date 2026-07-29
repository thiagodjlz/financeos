# Dashboard / Resumo

Fonte: `backend/src/main/java/br/com/financeos/dashboard/`. Unica area do backend que nao usa Panache/JPA — `DashboardRepository` roda SQL cru via `DataSource`. Tela do frontend: `frontend/src/app/features/dashboard/`, rota `/dashboard`, exibida ao usuario como "Resumo".

## Regras

- `GET /dashboard/summary?year&month`: `year`/`month` devem vir juntos ou nenhum (default = mes atual); `BadRequestException` se so um for enviado; `month` validado 1..12.
- **Totais** — despesas `PENDING` saem de todo lugar do Resumo exceto o proprio card "Pendente":
  - `total_income`: soma receitas (`type = INCOME`) com `status IS NULL OR status <> 'CANCELED'` (receita normalmente tem `status = null`, ver [transactions.md](transactions.md); so fica `CANCELED` se cancelada via `DELETE`).
  - `total_expense`: soma despesas (`type = EXPENSE`) com **`status = 'PAID'` apenas** — despesas `PENDING` nao entram mais aqui (ate a issue #16 entravam, junto com `PAID`).
  - `paid_expense`: mesma condicao que `total_expense` (ficaram numericamente iguais apos a mudanca acima); os dois campos continuam expostos separados em `DashboardSummaryResponse` para nao quebrar o contrato da API.
  - `pending_expense`: unico lugar do Resumo onde despesas `PENDING` ainda sao contabilizadas.
  - `balance = totalIncome - paidExpense` (nao mais `totalExpense`) — despesas pendentes deixaram de reduzir o saldo exibido.
- Quebra por categoria (`categoryBreakdown`): agrupa por `(category_id, type)` no periodo, left-join com `categories` (categorias sao globais, ver [categories.md](categories.md)) e usa `"Sem categoria"` quando `category_id` e nulo; despesas so contam com `status = 'PAID'`, receitas contam com `status IS NULL OR status <> 'CANCELED'` (mesma regra dos totais).
- Evolucao mensal (`monthlyEvolution`) sempre retorna os 12 meses do ano pedido (zero-preenchido via `MonthlySummaryResponse.empty`), sobrepondo os valores reais onde existirem; despesa de cada mes segue a mesma regra acima (so `PAID`), receita segue a mesma regra dos totais.

Qualquer mudanca nos totais/regras de negocio de outras areas (ex.: mudar o que conta como "cancelado"/"pendente" em Transacoes) provavelmente exige revisitar esta area tambem, ja que o dashboard e 100% derivado de transacoes.

## Frontend (`frontend/src/app/features/dashboard/`)

- Sem botao "Atualizar": o resumo recarrega automaticamente ao trocar Ano ou Mes, via `(change)` (evento nativo — nao `(ngModelChange)`, para nao disparar uma chamada a API a cada digito digitado no campo Ano).
- Ordem dos 4 cards de metricas do topo: Receitas, Despesas, Pendente, Saldo.
- O painel antes chamado "Categorias" agora e "Detalhamento": duas secoes empilhadas (nao lado a lado, nao em abas) com cabecalho colorido — "Receitas" (verde) e "Despesas" (vermelho) — cada uma com um estado vazio proprio ("Sem dados no periodo"). O cabecalho de cada secao mostra a **quantidade de categorias distintas** daquele tipo no periodo (`categoriesByType(type).length`, `0` quando vazio), **nao** o valor monetario total (issue #18) — o total em dinheiro por tipo continua exposto so nos 4 cards de metricas do topo; a contagem geral (receitas + despesas) fica no rodape do painel, rotulada "Total". Desde a issue #35 ele ocupa uma coluna de 360px a direita do grafico, e cada categoria ganha uma barra proporcional ao maior valor **da propria secao** (`maxAmount(type)`).
- **Painel "Evolucao anual"** (issue #35): `<svg viewBox="0 0 840 210">` com, por mes, uma barra de receita e uma de despesa mais uma `polyline` de saldo com um ponto por mes, alimentado pelo `computed` `chart()` sobre `summary()?.monthlyEvolution` — **o campo ja era retornado pela API, nenhum endpoint novo foi criado e o backend nao foi tocado**. Como `monthlyEvolution` sempre traz os 12 meses zero-preenchidos, nao existe caso de lista vazia; o caso degenerado e outro: um ano sem lancamentos (`maxValue = 0`) ou com todos os saldos iguais (`balanceRange = 0`) geraria `NaN` nos atributos do SVG, por isso o `chart()` tem guardas `|| 1` nos dois divisores. Trocar o Ano redesenha o grafico com a serie nova pelo mesmo `(change)` que ja recarregava os cards.
