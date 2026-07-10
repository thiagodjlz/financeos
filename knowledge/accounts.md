# Contas

**Removido por completo na issue #20** (2026-07-08): a funcionalidade de Contas deixou de existir no sistema. Foram removidos o pacote de backend `accounts/` (entidade, resource, repository, DTOs), o endpoint `/accounts`, a tabela `accounts` (dropada via migration `V9__remove_accounts_and_cards.sql`, dados perdidos definitivamente), o valor `ACCOUNTS` do enum `Screen` (backend e tipo espelho no frontend) e toda a UI relacionada (`AccountService`, formulario/lista de Conta na antiga tela de Cadastros).

`Transacoes` ja nao referenciava `accounts` desde a issue relativa a V7 (`accountId` removido de Lancamentos antes desta remocao), entao a remocao nao teve impacto de integridade referencial.

Nao reintroduzir Contas (endpoint, tela ou vinculo com Lancamentos/Cartoes) sem confirmar explicitamente com o dono do produto — este arquivo fica apenas como registro do que existiu, nao descreve mais um dominio ativo do sistema.
