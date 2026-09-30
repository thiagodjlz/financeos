---
issue: 104
url: https://github.com/thiagodjlz/financeos/issues/104
title: "Ajustes de campos, filtros e funcionalidades (Resumo e Lancaçmento)"
domains: [transactions, dashboard, documentation]
target: v1.0.2
stage: pr-open
branch: fix/issue-104-filtro-mensal-exclusao-lancamentos
created: 2026-09-30
---

# Ajustes de campos, filtros e funcionalidades (Resumo e Lançamentos)

## Historia

Como usuario do FinanceOS, quero escolher o periodo por um seletor de mes/ano e que Excluir apague o lançamento de verdade, para filtrar rapido no celular e nao conviver com registros cancelados.

## Contexto

1. **Resumo**: ao lado do passo de mês (#93) entra um campo que abre seletor de **meses** (sem dias), ano no cabeçalho com ← / →; escolher o mês aplica o filtro.
2. **Lançamentos**: "Data de"/"Data até" (`input type="date"`) viram um campo único **"Data"** com o mesmo seletor; o mês vira `startDate` = dia 1 e `endDate` = último dia. A tela abre no mês atual.
3. **Celular**: o print `design/print-mobile-filtros-lancamentos.png` mostra, no painel "Filtros", "Data de"/"Data até" passando da borda direita e mais baixos que os selects. É registro do defeito, não mockup: nenhum valor visual sai dele. Telas: `features/dashboard/dashboard.*` e `features/transactions/transactions.*`.
4. **Excluir**: hoje `DELETE /api/transactions/{id}` (`Action.DELETE`) grava `status = CANCELED`, sem confirmação. Passa a apagar a linha, e os cancelados existentes são removidos.

O item 4 derruba "transações nunca são excluídas" (`architecture.md`, `transactions.md`). Dependem de `CANCELED`: filtro Status, `validateStatus`, edição que reativa cancelado, `tr.canceled`, `transactionStatusLabel`, filtros `status <> 'CANCELED'` do `DashboardRepository`, `/dashboard/periods`, check do banco (V1, nome a confirmar no banco). `import_rows.transaction_id` é `on delete set null`. Categoria só com cancelados passa a poder ser excluída (#77). A Central publica a regra antiga (Transactions, Summary, Overview, Profiles, Categories) e a recusa de ano sem lançamento.

**Alvo**: a `main` (1.0.3-dev) só difere de `origin/v1.0.2` pelo commit de abertura da 1.0.3. Implementação na `v1.0.2`, depois levada à `main` por merge/cherry-pick (CLAUDE.md). Migration nova: `V16` nas duas.

## Criterios de aceite

Exclusão e status (backend):
- [x] C1. `DELETE /api/transactions/{id}` responde 204 e remove a linha: depois, `GET /api/transactions/{id}` dá 404 e ela some da listagem.
- [x] C2. Sem `TRANSACTIONS/DELETE`: 403; id de outro usuário ou inexistente: 404, sem apagar nada.
- [x] C3. `V16` apaga os `CANCELED` e só depois recria o check como `status is null or status in ('PENDING','PAID')`: após ela, 0 cancelados, não cancelados intactos (mesma contagem) e `update ... set status = 'CANCELED'` falha no banco.
- [x] C4. `CANCELED` sai do enum `TransactionStatus`: POST/PUT com `status: "CANCELED"` respondem 400 sem gravar, e `GET /api/transactions?status=CANCELED` nunca responde 500.
- [x] C5. `DashboardRepository` sem referência a `CANCELED`; totais, "Por categoria" e evolução mensal iguais para dados sem cancelados (testes passam).

Resumo (backend):
- [x] C6. `GET /api/dashboard/summary?year=2019&month=3` sem lançamentos responde 200 com totais zerados e `monthlyEvolution` de 12 meses zerados; "Não há lançamentos no ano informado." deixa de existir. Continuam: par ano+mês, mês 1..12, "O ano informado é inválido." fora de 1000..9999, nessa ordem.

Telas:
- [x] C7. Excluir na linha (`aria-label`/`title` "Excluir lançamento", só com `TRANSACTIONS/DELETE`) abre confirmação; recusar não faz HTTP; confirmar faz `DELETE`, a linha some e aparece o toast de Sucesso "Lançamento excluído com sucesso."
- [x] C8. Sem "Cancelado" no filtro Status, sem `tr.canceled` e sem `CANCELED` em `transactionStatusLabel`/`models.ts`.
- [x] C9. Resumo: o campo mostra "<Mês> de <ano>" (`longMonthName`); abre 12 meses, sem dias, ano no cabeçalho, ← / → livres (sem limite); escolher mês dispara uma só `GET /api/dashboard/summary` com ele e fecha o seletor.
- [x] C9a. "Mês anterior"/"Próximo mês" seguem ao lado e andam mês a mês no calendário (dez/2025 -> jan/2026 e volta), nunca desabilitados; o Resumo não chama mais `GET /api/dashboard/periods`, que fica no back-end sem consumidor no front.
- [x] C10. Lançamentos: um único campo "Data" com o mesmo seletor, sem limite de anos; nenhum `input type="date"` nos filtros.
- [x] C11. Mês escolhido gera `startDate` dia 1 e `endDate` último dia (teste: 2026-02 -> 28, 2028-02 -> 29, 2026-12 -> 31), enviados na `GET /api/transactions`.
- [x] C12. Primeira abertura de Lançamentos: a `GET /api/transactions` sai com o mês atual e o campo o exibe.
- [x] C13. Período opcional: "Limpar filtros" e remover o rótulo "Data" em "Filtros ativos" fazem a `GET /api/transactions` sair sem `startDate`/`endDate` e o campo fica vazio.

Celular (verificável por emulação — comportamento nativo não reproduzido):
- [x] C14. A 360 e 390 px, no painel "Filtros" de Lançamentos e no Resumo, o campo de período tem `getBoundingClientRect().right` <= o do contêiner e `scrollWidth <= clientWidth` no documento.
- [x] C15. A 390 px o campo "Data" tem a altura computada do select "Tipo" e o texto não é cortado.
- [x] C16. A 1280 px os filtros seguem numa faixa acima da tabela e o Resumo mantém saudação e período no cabeçalho.

Não-regressão:
- [x] C17. Lançamentos: filtros aplicam na hora no desktop e só em "Aplicar" no celular; voltar do cadastro mantém filtros (inclusive período vazio) e página; demais filtros e paginação iguais.
- [x] C18. Resumo: saudação, cards, "Por categoria", gráfico, informativo e "Sem dados no período" inalterados; suítes completas de backend e frontend passam.

Documentação e entrega:
- [x] C19. Central sem texto dizendo que excluir preserva o lançamento, sem a situação Cancelado, sem "Data de"/"Data até" e sem recusa de ano sem lançamento; Lançamentos e Resumo descrevem seletor, confirmação e exclusão. Passa por `pipeline:revisar-textos`.
- [x] C20. Bloco `1.0.2` de Novidades: itens do seletor e da exclusão (Melhorias) e do campo no celular (Correções), sem repetir em outro bloco.
- [x] C21. As duas varreduras de acentuação de `architecture.md` continuam vazias.
- [ ] C22. Após o merge na `v1.0.2`, tudo está na `main` e `V16` existe nas duas.

## Fora de escopo

- Outros filtros e o cadastro de lançamento, salvo tirar o que dependia de Cancelado.
- Reescrever itens antigos de Novidades que citam "cancelado" (histórico).

## Decisoes

- 2026-09-30: `target: v1.0.2`, com backport para a `main` (1.0.3) — C22.
- 2026-09-30: C14/C15 são verificados por emulação e não reprovam a feature pelo comportamento nativo do Safari iOS (acordo da issue #54).
- 2026-09-30 (P1): o status Cancelado sai por completo — enum, check do banco, filtro Status, rótulo, linha riscada e SQL do Resumo; a migration apaga os cancelados antes de apertar o check.
- 2026-09-30 (P2/P3): Excluir pede confirmação; rótulo "Excluir lançamento", aviso "Lançamento excluído com sucesso.".
- 2026-09-30 (P4): o seletor do Resumo oferece qualquer mês/ano com navegação livre; a API aceita período sem lançamento e devolve zeros; "Mês anterior"/"Próximo mês" continuam ao lado do campo.
- 2026-09-30 (P5): período de Lançamentos opcional — abre no mês atual; "Limpar filtros" e o rótulo "Data" removem o período e mostram tudo; sem limite de anos.
- 2026-09-30 (P6): "Mês anterior"/"Próximo mês" andam mês a mês no calendário, sem pontas desabilitadas e sem `/dashboard/periods`. O endpoint fica no back-end (só o Resumo o consumia); sai apenas o uso no front (`DashboardService.periods`).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/104
- Print: `specs/104-filtro-mensal-exclusao-lancamentos/design/print-mobile-filtros-lancamentos.png`
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `transactions.md`, `dashboard.md`, `documentation.md`
