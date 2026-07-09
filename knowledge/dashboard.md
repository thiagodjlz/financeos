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
- O painel antes chamado "Categorias" agora e "Detalhamento": duas secoes empilhadas (nao lado a lado, nao em abas) com cabecalho colorido — "Receitas" (verde) e "Despesas" (vermelho) — cada uma mostrando o total do tipo no cabecalho e um estado vazio proprio ("Sem dados no periodo"); a contagem total fica no rodape do painel.
