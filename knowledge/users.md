# Usuarios

Fonte: `backend/src/main/java/br/com/financeos/users/` e `frontend/src/app/features/users/`. Ver tambem [auth-and-permissions.md](auth-and-permissions.md) para o usuario `super_admin` oculto, que e tratado a parte.

## Regras

- `UserCreateRequest`: `name, email, password (8-72 chars), profileId` — **`profileId` e obrigatorio** (`@NotNull`); nao existe usuario "sem perfil" criado via API.
- `UserUpdateRequest`: idem + `active`; senha opcional (branco = mantem a atual).
- Email unico: checado em Java (`findByEmail`, 409 "E-mail ja cadastrado.") alem da constraint unica do banco.
- Senha via `BcryptUtil.bcryptHash`.
- **Um usuario nao pode desativar a si mesmo** (`currentUser.id().equals(id)` -> 409).
- Todas as operacoes de listagem/busca passam por `listVisible()`/`findVisibleById()`, que excluem o `super_admin` oculto.
- **Sem hard delete** — "excluir" so seta `active=false`.

## Frontend (`frontend/src/app/features/users/`)

Exibicao de erros do formulario (issues #22 e #24):

- A validacao e **so do backend** (Bean Validation, resposta 400 com `violations[]`); nao ha validacao no frontend antes do submit. O componente mapeia `violation.field` (formato `metodo.request.campo`, via `split('.').pop()`) para os campos `name`, `email`, `password`, `profileId` num `Map<campo, mensagem>` (`fieldErrors`).
- Campo invalido recebe a classe `.invalid` (borda/box-shadow vermelhos, issue #22) **e** uma legenda vermelha (`<small class="field-error">`) logo abaixo, com a **mensagem especifica da violacao retornada pelo backend** (ex.: "A senha deve ter entre 8 e 72 caracteres"), nao um texto generico (decisao da issue #24). Se houver mais de uma violacao para o mesmo campo, vale a primeira.
- O primeiro campo invalido (ordem `name`, `email`, `password`, `profileId`) recebe foco automatico; campo invalido focado exibe `outline` vermelho (`input.invalid:focus, select.invalid:focus` em `users.scss`) para o outline padrao do navegador nao se sobrepor ao destaque — campos validos mantem o foco padrao (issue #24).
- Destaque e legenda de um campo somem sempre **juntos** e apenas com **interacao real**: `(input)` nos inputs, `(change)` no select. So clicar/focar no campo nao limpa. Ao submeter de novo, o estado e recalculado a partir da nova resposta 400.
- **Toda** mensagem de erro da status-bar da tela (validacao, falha ao carregar, falha ao desativar) tem auto-dismiss de 5 segundos e botao "X" para fechar manualmente; um alerta novo reinicia o contador (decisao da issue #24). Fechar o alerta (X ou timeout) **nao** limpa destaques/legendas dos campos — estados independentes; na direcao inversa, corrigir o ultimo campo invalido fecha o alerta.
- Esse comportamento (X, auto-dismiss, estilos) e restrito ao SCSS/componente de usuarios — o `.status-bar` global de `frontend/src/styles.scss`, usado pelas outras telas, nao foi alterado.
- Erros 409 (e-mail duplicado, autodesativacao) nao trazem `violations` e caem na mensagem generica da status-bar, sem destaque/legenda por campo.
