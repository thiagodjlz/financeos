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

## Frontend: exibicao de erro de validacao (`features/users/`)

- Quando `POST /users`/`PUT /users/{id}` retorna `400` com o corpo padrao de validacao do Quarkus (`{title: "Constraint Violation", violations: [{field, message}]}`), a tela de Usuarios (`users.ts`/`users.html`) destaca em vermelho cada campo do formulario (Nome, E-mail, Senha, Perfil) referenciado em `violations`, move o foco para o primeiro campo invalido (ordem visual do formulario) e cita o(s) rotulo(s) na mensagem no topo — em vez da mensagem generica fixa. O campo e identificado pegando o ultimo segmento de `field` (ex.: `update.request.password` -> `password`) e mapeando para o rotulo correspondente (issue #22).
- O destaque de um campo some assim que o usuario altera seu valor; a mensagem geral some quando o ultimo campo destacado e corrigido. Uma nova tentativa de salvar limpa o destaque anterior antes de avaliar o novo resultado.
- Erros que **nao** vem no formato `{violations: [...]}` (ex.: `409` de e-mail duplicado, erros 500, falha de rede) continuam com a mensagem generica no topo, sem destaque em nenhum campo especifico — nao ha como saber qual campo destacar nesses casos.
