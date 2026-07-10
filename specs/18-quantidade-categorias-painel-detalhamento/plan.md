# Plano de implementacao

## Abordagem

Mudanca puramente de template no frontend: nos cabecalhos "Receitas" e "Despesas" do painel "Detalhamento" (`dashboard.html`), trocar o `formatMoney(summary()?.totalIncome/totalExpense)` pela contagem de itens de `categoriesByType('INCOME'/'EXPENSE')`, metodo que ja existe em `dashboard.ts` e ja e usado para renderizar a lista/estado vazio de cada secao. Nao ha mudanca de logica no componente, de service, de model ou de backend — so o binding no `.html`.

## Arquivos a alterar

### Backend

Nenhum arquivo de backend muda (confirmado pela spec: `DashboardSummaryResponse`/`CategoryBreakdown` ja expoe os dados necessarios via `categoryBreakdown`).

### Frontend

- `frontend/src/app/features/dashboard/dashboard.html` — no cabecalho `.category-section-header.income` (linha ~61), trocar `{{ formatMoney(summary()?.totalIncome) }}` por `{{ categoriesByType('INCOME').length }}`; no cabecalho `.category-section-header.expense` (linha ~74), trocar `{{ formatMoney(summary()?.totalExpense) }}` por `{{ categoriesByType('EXPENSE').length }}`. Os 4 cards de metricas do topo (linhas 20-35) e o rodape "Total" do painel (linha 84-87) ficam inalterados.

### Migration (se houver mudanca de schema)

Nao aplicavel — sem mudanca de schema.

## Sequencia de implementacao

1. Em `frontend/src/app/features/dashboard/dashboard.html`, alterar o cabecalho da secao "Receitas" (`.category-section-header.income`) para exibir `{{ categoriesByType('INCOME').length }}` no lugar do `formatMoney(summary()?.totalIncome)`.
2. Alterar o cabecalho da secao "Despesas" (`.category-section-header.expense`) para exibir `{{ categoriesByType('EXPENSE').length }}` no lugar do `formatMoney(summary()?.totalExpense)`.
3. Conferir que os cards de metricas do topo e o rodape "Total" do painel nao foram tocados (nenhuma outra linha do `.html` deve mudar).
4. Validacao manual ponta a ponta no navegador (`npm start` no frontend, com backend rodando):
   - Abrir a aba "Resumo" (`/dashboard`) com um periodo (ano/mes) que tenha lancamentos de receita e despesa pagos.
   - No painel "Detalhamento", conferir que o cabecalho verde "Receitas" mostra um numero inteiro igual a quantidade de linhas de categoria listadas logo abaixo dele (contar as linhas exibidas), e nao mais um valor em R$.
   - Conferir que o cabecalho vermelho "Despesas" mostra igualmente a quantidade de linhas de categoria de despesa listadas abaixo, e nao mais um valor em R$.
   - Trocar para um periodo (ano/mes) sem nenhuma receita: confirmar que a secao "Receitas" mostra o estado vazio "Sem dados no periodo" na lista e que o cabecalho mostra `0`. Repetir o mesmo teste para um periodo sem nenhuma despesa paga (`0` no cabecalho "Despesas").
   - Conferir que os 4 cards do topo ("Receitas", "Despesas", "Pendentes", "Saldo") continuam mostrando valores monetarios formatados (ex.: "R$ 1.234,56"), sem alteracao visual.
   - Conferir que o rodape "Total" do painel "Detalhamento" continua mostrando a contagem geral de linhas (receitas + despesas somadas), sem alteracao.

## Riscos e pontos de atencao

- Risco baixo de confundir a nova contagem por tipo (cabecalho da secao) com a contagem geral ja existente no rodape "Total" (`summary()?.categoryBreakdown?.length`) — sao dois numeros diferentes e o rodape nao deve ser tocado, conforme `knowledge/dashboard.md` e o "fora de escopo" da spec.
- `categoriesByType(type)` ja retorna `[]` (nao `undefined`) quando `summary()` e nulo ou a lista esta vazia, entao `.length` sempre resolve para `0` sem checagem extra de nulidade — nao ha necessidade de tratamento adicional para o estado "Sem dados no periodo".
- Estilo do cabecalho (`.category-section-header`, `font-size: 13px; font-weight: 800; text-transform: uppercase`) foi pensado para textos curtos como valores em R$; um numero inteiro pequeno deve caber sem ajuste de CSS, mas vale conferir visualmente no passo de validacao manual que nao fica com espacamento estranho.
