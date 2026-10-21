---
issue: 113
url: https://github.com/thiagodjlz/financeos/issues/113
title: "Funcionalidade de persistencia do saldo"
domains: [dashboard, transactions, documentation]
target: main
stage: pr-open
branch: feature/issue-113-saldo-acumulado
created: 2026-10-20
---

# Funcionalidade de persistencia do saldo

## Historia

Como pessoa que controla os gastos no FinanceOS, quero que o que sobrou de um mês seja somado ao mês seguinte, para que o Resumo mostre quanto dinheiro eu tenho acumulado desde que comecei a usar o sistema, e não só o resultado isolado de cada mês.

## Contexto

A issue pede que o saldo "restante do mês" seja acumulativo para o mês seguinte, a partir de 01/10/2026. Sem comentários nem mockup.

Hoje o quadro **"Saldo do mês"** mostra `balance = totalIncome - paidExpense` (`knowledge/dashboard.md`; despesa `PENDING` não reduz) e cada mês é isolado: o Resumo é 100% derivado de `transactions`, sem tabela de saldo. A linha de saldo do gráfico plota o saldo do próprio mês (D1 da #48), e a Central publica isso em `SummaryAreaContent`. O Resumo é escopado pelo `user_id` logado e começa com `accessControl.require(Screen.DASHBOARD, Action.VIEW)`; lançamentos passados podem ser editados e excluídos; mudança visível obriga revisar a área "Resumo" da Central e o bloco `1.0.3` de "Novidades por versão".

Definições (todas calculadas no back-end):
- **Saldo do mês (M)**: o `balance` atual, sem mudança.
- **Mês corrente (C)**: o mês da data do servidor.
- **Saldo anterior (M)**: soma do Saldo do mês de cada mês de out/2026 até `min(M-1, C)`, inclusive; `0` quando esse intervalo é vazio (M ≤ out/2026). Para M até C+1 é a soma de todos os meses anteriores; para M além de C+1, os meses entre C e M não entram.
- **Saldo acumulado (M)**: Saldo anterior (M) + Saldo do mês (M). Pode ser negativo.

## Criterios de aceite

Nos testes de back-end o mês corrente é fixado pelo teste (não depende da data real).

- [x] 1. `GET /api/dashboard/summary` devolve `previousBalance` e `accumulatedBalance`, e cada item de `monthlyEvolution` ganha `accumulatedBalance` pela mesma regra; em out/2026 `previousBalance = 0` e `accumulatedBalance = balance`.
- [x] 2. Teste de back-end, mês corrente = dez/2026: out/2026 receita 1000,00 e despesa paga 600,00; nov/2026 receita 500,00 e despesa paga 700,00. Summary de nov/2026: `balance = -200.00`, `previousBalance = 400.00`, `accumulatedBalance = 200.00` (negativo desconta e é levado adiante). Summary de dez/2026 (sem lançamentos): `balance = 0`, `previousBalance = 200.00`, `accumulatedBalance = 200.00`.
- [x] 3. Mês futuro, teste de back-end com mês corrente = nov/2026 e os lançamentos do critério 2 mais receita 1000,00 em dez/2026 e receita 300,00 em jan/2027. Summary de dez/2026: `previousBalance = 200.00` (out + nov), `accumulatedBalance = 1200.00`. Summary de jan/2027: `previousBalance = 200.00` (dez/2026 fica de fora), `accumulatedBalance = 500.00`. Com o mês corrente = dez/2026, o summary de jan/2027 passa a `previousBalance = 1200.00` e `accumulatedBalance = 1500.00`.
- [x] 4. Lançamento com `transaction_date` anterior a 01/10/2026 nunca entra no Saldo anterior: no cenário do critério 2, uma receita de 5000,00 em 15/09/2026 não altera nenhum valor acumulado de out, nov ou dez/2026.
- [x] 5. Mês anterior a out/2026 (ex.: `?year=2026&month=9`): `previousBalance = 0` e `accumulatedBalance = balance`; em `monthlyEvolution` de 2026, jan a set têm `accumulatedBalance = balance`.
- [x] 6. Despesa `PENDING` não entra no Saldo anterior: no cenário do critério 2, uma despesa pendente de 300,00 em out/2026 não altera o `previousBalance` de nov/2026.
- [x] 7. O acúmulo é por usuário: lançamentos de outro usuário em out/2026 não alteram o `previousBalance` de nov/2026 do usuário logado.
- [x] 8. Calculado a cada consulta, sem tabela nova (nenhuma migration Flyway): editar o valor ou excluir um lançamento de out/2026 muda o `previousBalance` de nov/2026 na consulta seguinte, sem ação extra.
- [x] 9. Não-regressão: `balance`, `totalIncome`, `totalExpense`, `paidExpense`, `pendingExpense`, `paidExpensePercent` e cada `monthlyEvolution[].balance` mantêm os valores de hoje para o mesmo conjunto de lançamentos; a linha do gráfico continua plotando o saldo do próprio mês (teste "plota o saldo do próprio mês, e não um acumulado" passa) e o informativo flutuante do gráfico continua com Receita/Despesa/Saldo.
- [x] 10. No quadro "Saldo do mês", a tela exibe uma linha "Saldo anterior" e um destaque "Saldo acumulado" do mês selecionado, em `money()`, com os valores da API sem recálculo no front; o valor principal do quadro continua sendo o Saldo do mês. Com a API do cenário do critério 2, nov/2026 e dez/2026 mostram "R$ 200,00" como acumulado (teste em `dashboard.spec.ts`).
- [x] 11. O bloco do mês abaixo do gráfico ganha "Acumulado" com o `monthlyEvolution[].accumulatedBalance` do mês escolhido, mantendo Receita, Despesa e Saldo; escolher outro mês no gráfico troca o valor sem nova chamada HTTP (teste em `dashboard.spec.ts`).
- [x] 12. Acumulado e Saldo anterior negativos aparecem com o sinal de menos que `money()` produz (como o `balance` negativo hoje), nunca zerados nem em módulo.
- [x] 13. A área "Resumo" da Central descreve a regra (vale desde 01/10/2026, soma receitas menos despesas pagas, saldo negativo é levado adiante, mês futuro soma só até o mês atual) sem contradizer o código, e o bloco `1.0.3` de "Novidades por versão" ganha um item sobre a funcionalidade; os testes de conteúdo das duas telas passam.
- [x] 14. As duas varreduras de idioma de `knowledge/architecture.md` (seção "Idioma") continuam saindo vazias.

## Fora de escopo

- Mudar a regra do Saldo do mês (o que conta como receita ou despesa paga).
- Linha do gráfico "Evolução anual" ou informativo flutuante mostrarem o acumulado (D1 da #48).
- Data de início por usuário, saldo inicial informado à mão, contas, cartões ou conciliação.
- Fechamento mensal gravado (snapshot).

## Decisoes

- 2026-10-20 — PA-1: saldo negativo desconta do acumulado e é levado para o mês seguinte.
- 2026-10-20 — PA-2: o "restante do mês" é o Saldo do mês atual (receitas menos despesas pagas); descartada a opção que incluía pendentes.
- 2026-10-20 — PA-3: meses anteriores a out/2026 têm `previousBalance = 0` e acumulado igual ao saldo do mês.
- 2026-10-20 — PA-4: calculado na hora a partir dos lançamentos, sem tabela nova; editar/excluir lançamento antigo reflete no acumulado. O "persistência" do título é a passagem do saldo de um mês para o outro, não gravação.
- 2026-10-20 — PA-5: exibido dentro do quadro "Saldo do mês" (linha "Saldo anterior" e destaque "Saldo acumulado") e também no bloco do mês abaixo do gráfico; a linha do gráfico segue mensal.
- 2026-10-20 — PA-6: data de início fixa em 01/10/2026 no back-end, igual para todos os usuários.
- 2026-10-20 — PA-7: o Saldo anterior soma só até o mês corrente (data do servidor), inclusive; ao abrir um mês futuro, os meses entre o corrente e o mês aberto ficam de fora.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/113
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `dashboard.md`, `transactions.md`, `documentation.md`; código: `DashboardRepository.java`, `DashboardResource.java`, `DashboardSummaryResponse.java`, `dashboard.html`, `core/formatters.ts`, `SummaryAreaContent.java`.
