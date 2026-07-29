---
issue: 22
url: https://github.com/thiagodjlz/financeos/issues/22
title: "Ajuste cadastro de usuários"
domains: [users]
stage: pr-open
branch: feature/issue-22-destaque-erro-validacao-usuario
created: 2026-07-09
---

# Ajuste cadastro de usuários

## Historia

Como usuario com permissao de editar/criar usuarios, quero que a tela de Usuarios me mostre exatamente qual campo esta invalido quando o backend rejeita o salvamento por uma regra de validacao, com o campo destacado em vermelho e o foco do cursor movido ate ele, para que eu nao precise adivinhar (ou abrir o console do navegador) qual dado preciso corrigir.

## Contexto

A issue relata um caso concreto: ao editar um usuario e informar uma senha com menos de 8 caracteres, o backend (`PUT /users/{id}`, `UserUpdateRequest.password` anotado com `@Size(min = 8, max = 72)` em `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java`) responde `400` com o corpo padrao de validacao do Quarkus:

```json
{"title": "Constraint Violation", "status": 400, "violations": [{"field": "update.request.password", "message": "size must be between 8 and 72"}]}
```

Hoje, em `frontend/src/app/features/users/users.ts`, o metodo `save()` ignora completamente esse corpo: o `catch` (sem capturar o erro) so seta `this.error.set('Nao foi possivel salvar o usuario. Revise os campos e tente novamente.')`, uma mensagem fixa e generica exibida no topo da tela (`<div class="status-bar" *ngIf="error()">` em `users.html`). Nenhum campo do formulario (`Nome`, `E-mail`, `Senha`, `Perfil`) recebe indicacao visual de erro nem foco, entao o usuario so descobre qual campo esta errado abrindo o console do navegador (como a propria issue fez).

A issue pede que essa correcao valha para qualquer campo do formulario, nao so senha — os campos validados hoje no backend sao: `name` (`@NotBlank`, `@Size(max = 120)`), `email` (`@NotBlank`, `@Email`, `@Size(max = 180)`) e `password` (`@Size(min = 8, max = 72)`, `@NotBlank` na criacao) em `UserCreateRequest`/`UserUpdateRequest`; `profileId` e `@NotNull` mas e um `<select>` sempre preenchido pela UI (nao deve, na pratica, disparar essa violacao a partir do formulario). O identificador de campo retornado pelo backend segue o padrao `<metodo>.<parametro>.<propriedade>` (ex.: `update.request.password`, `create.request.email`) — o ultimo segmento apos o ultimo `.` corresponde ao nome da propriedade no DTO, que mapeia 1:1 para os campos do formulario (`name`, `email`, `password`, `profileId`).

Casos de erro que **nao** vem no formato `{violations: [...]}` (ex.: `409` de e-mail duplicado, lancado como `WebApplicationException` simples em `UserResource.create`, ou falhas genericas de rede/servidor) continuam sem informacao de campo especifico e devem manter o comportamento atual (mensagem generica no topo, sem destaque em nenhum campo) — nao ha como saber qual campo destacar nesses casos.

## Criterios de aceite

- [ ] Quando `POST /users` ou `PUT /users/{id}` retorna `400` com corpo `{title: "Constraint Violation", violations: [{field, message}, ...]}`, a mensagem exibida no topo da tela de Usuarios deixa de ser o texto fixo generico e passa a citar o(s) rotulo(s) do(s) campo(s) inconsistente(s) exibido(s) no formulario (ex.: "Senha", "E-mail", "Nome"), derivado(s) do ultimo segmento do `field` de cada violacao (`update.request.password` -> campo `password` -> rotulo "Senha").
- [ ] Cada campo do formulario referenciado em `violations` (Nome, E-mail, Senha ou Perfil, conforme o `field` retornado) recebe um contorno vermelho (estado visual de invalido) apos a resposta de erro.
- [ ] O foco do cursor e movido automaticamente para o primeiro campo invalido do formulario (considerando a ordem visual do formulario: Nome, E-mail, Senha, Perfil — nao a ordem do array `violations`) apos a resposta de erro.
- [ ] O comportamento (mensagem especifica, contorno vermelho, foco) funciona tanto no fluxo de criacao (`Novo usuario`, `POST /users`) quanto no de edicao (`Editar usuario`, `PUT /users/{id}`), para qualquer um dos campos validados (`name`, `email`, `password`).
- [ ] Se a violacao referenciar mais de um campo ao mesmo tempo (ex.: nome em branco e senha curta na mesma tentativa), todos os campos referenciados recebem o contorno vermelho, e a mensagem no topo cita todos os rotulos envolvidos.
- [ ] Ao o usuario alterar o valor de um campo destacado (ou ao iniciar uma nova tentativa de salvar), o contorno vermelho e a mensagem de erro anterior daquele campo sao limpos antes do novo resultado ser avaliado — o destaque nao permanece indefinidamente na tela apos a correcao.
- [ ] Erros de salvamento que **nao** vem no formato `{violations: [...]}` (ex.: `409` de e-mail duplicado, erro `500`, falha de rede) continuam exibindo a mensagem generica atual no topo da tela ("Nao foi possivel salvar o usuario. Revise os campos e tente novamente." ou a mensagem especifica ja retornada pelo backend, quando houver), sem contorno vermelho em nenhum campo especifico (nao ha como saber qual campo destacar nesses casos) — sem regressao do comportamento atual para esses casos.
- [ ] `npm run build` (frontend) completa sem erros apos a mudanca.

## Fora de escopo

- Tratamento de erros que nao seguem o formato `{violations: [...]}` do Quarkus (ex.: `409` de e-mail duplicado em `UserResource.create`) — esses continuam com mensagem generica no topo, sem destaque de campo, pois o corpo da resposta nao identifica um campo especifico.
- Qualquer mudanca no backend (`UserResource`, `UserCreateRequest`, `UserUpdateRequest`) ou nas regras de validacao ja existentes (tamanho de senha, formato de e-mail, etc.) — a issue e sobre a apresentacao do erro no frontend, nao sobre as regras de validacao em si.
- Aplicar esse tratamento de erro a outros formularios do sistema (Categorias, Lancamentos, Perfis) — a issue e especifica sobre o "cadastro de usuarios"; generalizar o padrao para outras telas fica para uma issue futura, se necessario.
- Validacao client-side antecipada dos campos (ex.: bloquear o submit no frontend antes de chamar a API se a senha tiver menos de 8 caracteres) — a issue pede melhorar a exibicao do erro retornado pelo backend, nao adicionar validacao previa no formulario.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/22
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/users.md`
- Codigo consultado: `frontend/src/app/features/users/users.ts`, `frontend/src/app/features/users/users.html`, `frontend/src/app/core/services/user.service.ts`, `frontend/src/app/core/interceptors/auth.interceptor.ts`, `backend/src/main/java/br/com/financeos/users/UserResource.java`, `backend/src/main/java/br/com/financeos/users/UserCreateRequest.java`, `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java`
