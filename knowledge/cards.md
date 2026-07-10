# Cartoes

**Removido por completo na issue #20** (2026-07-08): a funcionalidade de Cartoes deixou de existir no sistema. Foram removidos o pacote de backend `cards/` (entidade, resource, repository, DTOs), o endpoint `/cards`, a tabela `cards` (dropada via migration `V9__remove_accounts_and_cards.sql`, dados perdidos definitivamente, drop feito antes de `accounts` por causa da FK `cards.account_id`), o valor `CARDS` do enum `Screen` (backend e tipo espelho no frontend) e toda a UI relacionada (`CardService`, formulario/lista de Cartao na antiga tela de Cadastros).

`Transacoes` ja nao referenciava `cards` desde a issue relativa a V7 (`cardId` removido de Lancamentos antes desta remocao), entao a remocao nao teve impacto de integridade referencial.

Nao reintroduzir Cartoes (endpoint, tela ou vinculo com Lancamentos/Contas) sem confirmar explicitamente com o dono do produto — este arquivo fica apenas como registro do que existiu, nao descreve mais um dominio ativo do sistema.
