# Pull Request

URL: https://github.com/thiagodjlz/financeos/pull/11

## Resumo

PR aberto a partir da branch `feature/issue-10-remover-campos-conta-cartao-lancamentos` (commit `ebe9ad1`), fechando a issue #10. Remove por completo os campos Conta e Cartao da aba Lancamentos: formulario e tabela no frontend, DTOs (`TransactionRequest`/`TransactionResponse`), entidade `FinancialTransaction` e `TransactionResource` no backend, alem da migration `V7` que dropa as colunas `account_id`/`card_id` da tabela `transactions`. Quality-check e build passaram sem falhas antes da abertura do PR.
