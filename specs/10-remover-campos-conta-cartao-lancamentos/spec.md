---
issue: 10
url: https://github.com/thiagodjlz/financeos/issues/10
title: "Remoção de campos na aba Lançamentos"
domains: [transactions]
stage: pr-open
branch: feature/issue-10-remover-campos-conta-cartao-lancamentos
created: 2026-07-07
---

# Remoção de campos na aba Lançamentos

## Historia

Como usuario da aba Lancamentos, quero que os campos Conta e Cartao deixem de existir nessa tela, para que o formulario e a listagem de lancamentos fiquem mais simples e nao exponham informacao que nao deve mais ser preenchida ali.

## Contexto

A issue pede, literalmente: "Remova da aba Lancamentos os campos Conta e Cartao. Remocao completa." O termo "remocao completa" indica que nao basta ocultar visualmente os campos (ex.: via CSS) — eles devem deixar de existir na experiencia da aba.

Hoje, conforme `frontend/src/app/features/transactions/`:
- `transactions.html` tem, no formulario "Novo lancamento", os `<select>` de **Conta** (`accountId`) e **Cartao** (`cardId`), alimentados por `AccountService`/`CardService`.
- A tabela "Ultimos lancamentos" tem as colunas **Conta** e **Cartao**, resolvidas por `accountName(id)`/`cardName(id)`.
- `transactions.ts` mantem `accountId`/`cardId` no `transactionForm`, os envia no `create()` (convertendo string vazia para `null` via `emptyToNull`), e injeta `AccountService`/`CardService` so para popular esses dois campos.
- Nao ha filtros de Conta/Cartao na listagem hoje (`TransactionResource.list` so aceita `type/status/startDate/endDate/categoryId`), entao nao ha filtro visivel para remover.

No backend (`backend/src/main/java/br/com/financeos/transactions/`), conforme `knowledge/transactions.md`:
- `FinancialTransaction` tem as colunas `account_id`/`card_id` (opcionais), e `TransactionRequest`/`TransactionResponse` expõem `accountId`/`cardId`.
- "Sem validacao de posse cruzada": hoje nada verifica que `accountId`/`cardId` pertencem ao usuario atual antes de salvar — ou seja, esses campos ja sao fracamente controlados no backend.
- O dashboard (`knowledge/dashboard.md`) calcula seus totais/agrupamentos por `category_id` e `status`, nao usa `account_id`/`card_id` — remover esses campos da aba Lancamentos nao deve impactar o dashboard.
- Contas (`knowledge/accounts.md`) e Cartoes (`knowledge/cards.md`) continuam existindo como entidades/telas proprias; a issue nao pede a remocao dessas telas, so a desvinculacao na aba Lancamentos.

"Remocao completa" foi decidida (ver secao "Decisoes"): alem da UI, os campos `accountId`/`cardId` saem dos DTOs (`TransactionRequest`/`TransactionResponse`), da entidade `FinancialTransaction` e das colunas `account_id`/`card_id` da tabela `transactions` via migration, com perda definitiva do historico de vinculo ja gravado.

## Criterios de aceite

- [ ] Na aba Lancamentos, o formulario "Novo lancamento" nao exibe mais os campos Conta e Cartao (nem como `<select>` visivel, nem oculto no DOM/formulario).
- [ ] O `transactionForm` do componente Lancamentos (`transactions.ts`) nao possui mais as propriedades `accountId`/`cardId`, e o payload enviado em `create()`/futuras edicoes nao inclui mais esses campos.
- [ ] A tabela "Ultimos lancamentos" nao exibe mais as colunas Conta e Cartao.
- [ ] O componente Lancamentos nao injeta mais `AccountService`/`CardService` nem chama `accountService.refresh()`/`cardService.refresh()`, ja que essa informacao nao e mais necessaria nessa tela (a menos que outra parte do componente ainda dependa deles).
- [ ] As telas de Contas e Cartoes continuam funcionando normalmente (nao sao removidas nem alteradas por esta issue).
- [ ] O dashboard continua retornando os mesmos totais/agrupamentos de antes (ele nao depende de `accountId`/`cardId`), sem regressao.
- [ ] Lancamentos existentes que ja tinham `accountId`/`cardId` preenchidos continuam sendo listados normalmente na aba Lancamentos (sem erro), apos a remocao dos campos.
- [ ] `TransactionRequest`/`TransactionResponse` nao possuem mais `accountId`/`cardId`, e `TransactionResource`/servico de transacoes nao aceitam nem retornam esses campos.
- [ ] `FinancialTransaction` nao possui mais os atributos mapeados para `account_id`/`card_id`.
- [ ] Uma migration remove as colunas `account_id` e `card_id` da tabela `transactions` (o vinculo historico com conta/cartao e perdido de forma definitiva e intencional).

## Fora de escopo

- Remocao ou alteracao das telas/entidades de Contas e Cartoes em si.
- Qualquer mudanca no calculo do dashboard.
- Adicao de filtros de Conta/Cartao na listagem (nao existem hoje, e a issue pede remocao, nao adicao).

## Decisoes

- **Alcance da "remocao completa"** (decidido com o usuario em 2026-07-07): vai alem da UI. Inclui remover `accountId`/`cardId` dos DTOs do backend, da entidade `FinancialTransaction`, e uma migration removendo as colunas `account_id`/`card_id` da tabela `transactions`. O historico de vinculo ja gravado sera perdido — isso e aceito.

## Pontos em aberto

- Nao ficou claro se ha necessidade de expor `accountId`/`cardId` em algum outro lugar do sistema (ex.: relatorios futuros, import de Excel ainda nao implementado). Como a decisao acima remove os campos ate do banco, qualquer necessidade futura exigiria reintroduzir esses campos do zero; nao ha indicacao hoje de que isso seja necessario.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/10
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/transactions.md`, `knowledge/accounts.md`, `knowledge/cards.md`, `knowledge/dashboard.md`
- Codigo consultado: `frontend/src/app/features/transactions/transactions.html`, `frontend/src/app/features/transactions/transactions.ts`, `frontend/src/app/core/models.ts`, `frontend/src/app/core/services/transaction.service.ts`, `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java`, `TransactionResponse.java`, `FinancialTransaction.java`, `TransactionResource.java`
