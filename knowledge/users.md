# Usuarios

Fonte: `backend/src/main/java/br/com/financeos/users/`. Ver tambem [auth-and-permissions.md](auth-and-permissions.md) para o usuario `super_admin` oculto, que e tratado a parte.

## Regras

- `UserCreateRequest`: `name, email, password (8-72 chars), profileId` — **`profileId` e obrigatorio** (`@NotNull`); nao existe usuario "sem perfil" criado via API.
- `UserUpdateRequest`: idem + `active`; senha opcional (branco = mantem a atual).
- Email unico: checado em Java (`findByEmail`, 409 "E-mail ja cadastrado.") alem da constraint unica do banco.
- Senha via `BcryptUtil.bcryptHash`.
- **Um usuario nao pode desativar a si mesmo** (`currentUser.id().equals(id)` -> 409).
- Todas as operacoes de listagem/busca passam por `listVisible()`/`findVisibleById()`, que excluem o `super_admin` oculto.
- **Sem hard delete** — "excluir" so seta `active=false`.
