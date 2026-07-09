# Contas

Fonte: `backend/src/main/java/br/com/financeos/accounts/`.

## Campos

`userId, name, type(AccountType), initialBalance(BigDecimal, default 0), active`.
`AccountType`: `CHECKING, SAVINGS, WALLET, INVESTMENT, OTHER`.

## Regras

- Unique `(user_id, name)` (V1).
- **Escopo estrito por usuario**: toda leitura/escrita filtra por `userId = currentUser.id()`.
- **Soft delete**: `DELETE` so seta `active=false`, nunca remove a linha (cartoes/transacoes referenciam com `ON DELETE SET NULL`).
- `initialBalance` e apenas o valor inicial armazenado — **nao ha calculo de saldo corrente** no `AccountResource`/`AccountRepository`; os totais do dashboard sao baseados em transacoes, nao em contas (ver [dashboard.md](dashboard.md)).
