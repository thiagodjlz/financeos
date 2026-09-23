---
issue: 76
url: https://github.com/thiagodjlz/financeos/issues/76
title: "Usuario consegue desativar a propria conta pelo PUT"
domains: [users, documentation]
target: main
stage: validated
branch: feature/issue-76-bloqueia-autodesativacao-put
created: 2026-09-22
---

# Usuario consegue desativar a propria conta pelo PUT (e trocar o proprio perfil)

## Historia

Como operador com permissao de editar usuarios, quero que o sistema recuse desativar a minha propria conta e trocar o meu proprio perfil por qualquer caminho, para que eu nao perca o acesso por engano nem contorne a regra que o botao "Desativar" ja impoe.

## Contexto

A issue so tem titulo (corpo `-`, sem comentarios, sem design). Conferido no codigo:

- `DELETE /api/users/{id}` recusa com 409 "Você não pode desativar a própria conta." quando `currentUser.id().equals(id)`. O `PUT /api/users/{id}` faz `user.active = request.active()` e `user.profileId = request.profileId()` **sem** checagem: o usuario logado pode se desativar ou se dar um perfil sem acesso a Usuarios e se trancar para fora. `knowledge/users.md` registrava a brecha (issues #31/#70) como decisao de produto; esta issue e essa decisao.
- `UserUpdateRequest.active` e `boolean` primitivo: PUT sem `active` chega como `false` e hoje desativa **qualquer** usuario em silencio. `FieldLabels` ja mapeia `active` -> "Situação", entao a `message` agregada do 400 sai "Informe os campos obrigatórios: Situação.".
- O front sempre envia `active`: `UserUpdatePayload.active: boolean` e obrigatorio no tipo e `saveEdit` manda `active: this.editForm.active`, preenchido de `user.active` no `startEdit`.
- Erro do `saveEdit` ja vira toast de Alerta com a `message` do corpo e a linha segue em edicao (`applyEditSaveError`): os 409 novos aparecem sem mudar o front.
- `super_admin` oculto: `findVisibleById` o exclui, entao PUT/DELETE no id dele (`...0099`) respondem 404 antes de qualquer checagem, e ele ignora perfis (acesso total). A regra nova nao precisa de tratamento especial e nao o alcanca; ele (e o administrador do `.env` em producao, tambem `superAdmin`) continua sendo o caminho de recuperacao.
- `profile_id` e anulavel no banco, mas usuario sem perfil nao tem permissao em Usuarios e nao chega a este PUT.
- A Central (`UsersAreaContent.regras()`) publica so a regra do botao. Pela `knowledge/documentation.md`, mudar regra documentada obriga revisar a area da Central e o bloco da versao corrente em "Novidades por versão" (`1.0.2`).
- Varreduras de acentuacao remedidas em 2026-09-23 na `chore/sync-knowledge-issue-75`: 2 linhas no frontend e 6 no backend, igual ao baseline de `knowledge/architecture.md`.

## Criterios de aceite

- [x] **C1** - Logado, `PUT /api/users/{idProprio}` com `active: false`, mesmo perfil e demais campos validos retorna **409** com `message` "Você não pode desativar a própria conta.". O `GET /api/users` seguinte mostra o proprio usuario com `active: true` e nome, e-mail e perfil inalterados. Evidencia: teste em `UserResourceTest`.
- [x] **C2** - `PUT /api/users/{idProprio}` com `active: true` e `profileId` de outro perfil existente retorna **409** com `message` "Você não pode alterar o próprio perfil.". O `GET` seguinte mostra perfil, nome, e-mail e `active` inalterados (tambem com nome alterado no corpo). Evidencia: teste em `UserResourceTest`.
- [x] **C3** - `PUT /api/users/{idProprio}` com `active: false` **e** perfil diferente retorna 409 com uma das duas mensagens acima, sem gravar nada. Evidencia: teste em `UserResourceTest`.
- [x] **C4** - `PUT /api/users/{idProprio}` com `active: true` e o mesmo `profileId` retorna **200** e aplica a troca de nome. Evidencia: teste novo; `shouldAllowKeepingOwnEmailOnUpdate` continua passando.
- [x] **C5** - (nao-regressao) `PUT /api/users/{idDeOutro}` com `active: false` retorna 200 e o `GET` mostra `active: false`. Com outro `profileId` existente, retorna 200 e o `GET` mostra o perfil novo. Evidencia: testes em `UserResourceTest`.
- [x] **C6** - `PUT /api/users/{id}` **sem** o campo `active`, ou com `active: null`, retorna **400** para qualquer usuario (proprio ou outro). O `violations[]` traz o campo terminado em `.active` com `message` "A situação é obrigatória." e a `message` agregada contem "Situação". O `GET` seguinte mostra o usuario-alvo inalterado (ativo continua ativo). `UserUpdateRequest.active` passa a `Boolean` com `@NotNull`. Evidencia: teste em `UserResourceTest`.
- [x] **C7** - (nao-regressao) `DELETE /api/users/{idProprio}` continua 409 com a mesma mensagem (`shouldRejectDeactivatingOwnAccount` inalterado), `DELETE` de outro usuario continua 204 e `PUT /api/users/00000000-0000-0000-0000-000000000099` (`super_admin`) continua 404.
- [x] **C8** - Na tela de Usuarios, ao salvar a propria linha com Status "Inativo" (409 de C1) ou com outro Perfil (409 de C2), a tela:
  - mostra toast de Alerta com o texto da `message`;
  - mantem a linha em edicao;
  - nao mostra toast de Sucesso.

  Evidencia: testes em `users.spec.ts` com `flush` de 409 para cada mensagem, e verificacao manual em `http://localhost`.
- [x] **C9** - (nao-regressao) O corpo do PUT enviado por `saveEdit` sempre contem `active` booleano: `true` quando a linha fica Ativo e `false` quando muda para Inativo. Evidencia: teste em `users.spec.ts` que confere `request.body.active` nos dois casos.
- [x] **C10** - A area "Usuários" da Central (`GET /api/documentation`) informa que a propria conta nao pode ser desativada **nem pelo botão Desativar nem mudando o Status para Inativo na linha**, e que ninguem altera o **proprio perfil**. O texto deixa de restringir a regra ao botao, usa linguagem de usuario, sem identificador tecnico, e cada paragrafo tem ate 600 caracteres. Evidencia: teste de conteudo do backend e leitura de `/documentation`.
- [x] **C11** - O bloco `1.0.2` de `GET /api/release-notes` ganha **um** item em "Correções" cobrindo as duas protecoes da propria conta (desativacao e troca de perfil), em linguagem de usuario. Nenhum bloco novo e nenhum item existente alterado. Evidencia: teste de `ReleaseNotesContent` ou resposta do endpoint.
- [x] **C12** - Varreduras de acentuacao de `knowledge/architecture.md` (secao "Idioma"): nenhuma ocorrencia nova sobre o baseline de **2 linhas no frontend** e **6 no backend** (medido em 2026-09-23).
- [x] **C13** - Suites completas passam: `./mvnw test` no backend e `npm test` no frontend.

## Fora de escopo

- Esconder/desabilitar "Inativo" ou o select de Perfil na propria linha, e expor o `id` em `GET /api/auth/me` (ver Decisoes).
- Outras alteracoes da propria conta pelo PUT (nome, e-mail, senha) continuam permitidas.
- Backport para a `v1.0.1`: a correcao sai so na `1.0.2`.

## Decisoes

- 2026-09-22 - Alvo `main`: a correcao sai na `1.0.2`, nao como build nova da `v1.0.1`, embora o defeito exista la (decisao do usuario).
- 2026-09-23 - P1: basta o toast do 409 vindo do back. O front nao esconde nem desabilita "Inativo" e `GET /api/auth/me` nao passa a expor o id.
- 2026-09-23 - P2: `active` passa a obrigatorio (`Boolean` + `@NotNull`). PUT sem `active` ou com null retorna 400 com mensagem em portugues para qualquer usuario, e deixa de desativar em silencio (C6). O texto "A situação é obrigatória." segue o padrao de mensagem por DTO e o rotulo "Situação" de `FieldLabels`.
- 2026-09-23 - P3: a troca do proprio perfil pelo PUT entra nesta issue: 409 "Você não pode alterar o próprio perfil.", sem gravar nada. Mesmo perfil continua 200 e trocar o perfil de outro continua valendo. No front, so o toast do 409. O `super_admin` oculto nao precisa de tratamento especial, porque ja responde 404 no PUT e ignora perfis.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/76
- Codigo conferido: `UserResource`, `UserUpdateRequest`, `ValidationExceptionMapper`, `FieldLabels`, `UserResourceTest`, `V6__seed_profiles_and_admin.sql`, `features/users/users.{ts,html,spec.ts}`, `user.service.ts`, `UsersAreaContent`, `ReleaseNotesContent`
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/users.md`, `knowledge/auth-and-permissions.md` (secao super_admin), `knowledge/documentation.md`
