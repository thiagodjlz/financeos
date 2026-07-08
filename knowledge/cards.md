# Cartoes

Fonte: `backend/src/main/java/br/com/financeos/cards/`.

## Campos

`userId, accountId(opcional), name, brand, creditLimit, closingDay, dueDay, active`.

## Regras

- Unique `(user_id, name)`; `closing_day`/`due_day` devem estar entre 1 e 31 (constraint no banco, V1 — nao revalidado em Java).
- Se `accountId` for informado, **precisa ser uma conta ativa do proprio usuario** (`CardResource.validateAccount`, `BadRequestException` se nao encontrar) — e a unica validacao explicita de FK entre entidades no app hoje.
- Soft delete (`active=false`), mesmo padrao de Contas. Ao excluir a conta vinculada, o banco seta `card.account_id = NULL` (nao ha cascade delete).
