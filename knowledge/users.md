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

## Validacao e mensagens de erro

- A validacao do formulario de usuarios acontece **so no backend** (Bean Validation, 400 com `violations[]`); o frontend mapeia `violations[].field` (formato `metodo.request.campo`, usa o sufixo) para o campo e exibe `violation.message` como legenda vermelha abaixo dele (issues #22/#24).
- Todas as annotations de Bean Validation de `UserCreateRequest`/`UserUpdateRequest` tem `message` customizado em portugues (issue #26) — nenhuma resposta 400 desses endpoints deve conter mensagem default do Hibernate Validator em ingles:
  - `name`: "O nome e obrigatorio." / "O nome deve ter no maximo 120 caracteres."
  - `email`: "O e-mail e obrigatorio." / "Informe um e-mail valido." / "O e-mail deve ter no maximo 180 caracteres."
  - `password`: "A senha e obrigatoria." (so no create; no update a senha e opcional e nao tem `@NotBlank`) / "A senha deve ter entre 8 e 72 caracteres."
  - `profileId`: "O perfil e obrigatorio."
- **Decisao (issue #26)**: a traducao e por DTO, via `message` nas annotations — descartado o locale global pt-BR do Hibernate Validator (`quarkus.locales`/`quarkus.default-locale`), que afetaria todos os endpoints. DTOs de outros dominios (categorias, transacoes, login) continuam com as mensagens default em ingles.
- Ponto de atencao (visto nos testes da issue #26): o `@Email` do Hibernate Validator rejeita local-part acima de 64 chars, entao um e-mail muito longo pode gerar duas violacoes para o mesmo campo (`@Email` + `@Size`); para testar so o limite de 180 chars, use um e-mail bem formado com dominio longo.
