---
issue: 26
url: https://github.com/thiagodjlz/financeos/issues/26
title: "Traduzir legenda dos campos"
domains: [users]
stage: quality-checked
branch: feature/issue-26-traduzir-legendas-campos
created: 2026-07-10
---

# Traduzir legenda dos campos

## Historia

Como usuario administrador do FinanceOS, quero que as legendas de campos inconsistentes do formulario de usuarios apareçam em portugues, para que eu entenda imediatamente o que corrigir sem precisar interpretar mensagens tecnicas em ingles.

## Contexto

A issue pede: "Traduzir legenda dos campos inconsistentes [...] must be a well-formed email address e size must be between 8 and 72 deixe as legendas em portugues" (com print do formulario de usuarios exibindo essas duas mensagens em ingles).

Pelas regras existentes (`knowledge/users.md`, issues #22 e #24):

- A validacao do formulario de usuarios e feita **so no backend** (Bean Validation, resposta 400 com `violations[]`); o frontend apenas mapeia `violation.field` para os campos `name`, `email`, `password`, `profileId` e exibe a **mensagem especifica da violacao retornada pelo backend** como legenda vermelha abaixo do campo, alem do destaque visual.
- Hoje, nenhuma annotation dos DTOs (`UserCreateRequest`, `UserUpdateRequest`) define `message` customizado, entao todas as legendas exibidas sao as mensagens default do Hibernate Validator, em ingles (ex.: "must be a well-formed email address", "size must be between 8 and 72", "must not be blank", "must not be null").
- Logo, a traducao acontece na **origem das mensagens no backend**: `message` customizado em portugues em cada annotation de Bean Validation dos DTOs de usuarios (ver Decisoes); o mecanismo de exibicao do frontend (destaque, legenda, foco, auto-dismiss) nao muda.

Validacoes existentes nos DTOs de usuarios que hoje geram mensagem em ingles:

| Campo | Regra | Mensagem atual (ingles) |
|---|---|---|
| `name` | `@NotBlank`, `@Size(max = 120)` | "must not be blank" / "size must be between 0 and 120" |
| `email` | `@NotBlank`, `@Email`, `@Size(max = 180)` | "must not be blank" / "must be a well-formed email address" / "size must be between 0 and 180" |
| `password` | `@NotBlank` (create), `@Size(min = 8, max = 72)` | "must not be blank" / "size must be between 8 and 72" |
| `profileId` | `@NotNull` | "must not be null" |

## Criterios de aceite

- [ ] `POST /api/users` com e-mail mal formatado (ex.: `"abc"`) retorna 400 com `violations[]` contendo, para o campo `email`, a mensagem "Informe um e-mail valido." — nao mais "must be a well-formed email address".
- [ ] `POST /api/users` com senha fora do intervalo 8-72 caracteres retorna 400 com a mensagem "A senha deve ter entre 8 e 72 caracteres." para o campo `password` — nao mais "size must be between 8 and 72".
- [ ] `POST /api/users` com `name` em branco retorna 400 com a mensagem "O nome e obrigatorio." para o campo `name`.
- [ ] `POST /api/users` com `email` em branco retorna 400 com a mensagem "O e-mail e obrigatorio." para o campo `email`.
- [ ] `POST /api/users` com `password` em branco retorna 400 com a mensagem "A senha e obrigatoria." para o campo `password`.
- [ ] `POST /api/users` sem `profileId` retorna 400 com a mensagem "O perfil e obrigatorio." para o campo `profileId`.
- [ ] `POST /api/users` com `name` acima de 120 caracteres e com `email` acima de 180 caracteres retornam 400 com as mensagens "O nome deve ter no maximo 120 caracteres." e "O e-mail deve ter no maximo 180 caracteres.", respectivamente.
- [ ] `PUT /api/users/{id}` produz as mesmas mensagens em portugues para as mesmas violacoes (incluindo `password` opcional: so valida tamanho quando informada, comportamento atual mantido).
- [ ] Na tela de Usuarios, ao submeter o formulario com campo invalido, a legenda vermelha abaixo do campo exibe a mensagem em portugues vinda do backend — sem nenhuma mudanca no mecanismo de exibicao (destaque `.invalid`, foco no primeiro campo invalido, limpeza por interacao, auto-dismiss da status-bar), conforme issues #22 e #24.
- [ ] Nenhuma resposta 400 de validacao dos endpoints de usuarios contem mensagem em ingles do Bean Validation.
- [ ] Testes de backend cobrem ao menos as mensagens de `email` mal formatado e `password` fora do tamanho (os dois casos citados na issue).

## Fora de escopo

- Adicionar validacao no frontend antes do submit (a decisao das issues #22/#24 de validar so no backend permanece).
- Alterar as regras de validacao em si (limites de tamanho, obrigatoriedade) — apenas o idioma/texto das mensagens.
- Mensagens de erros 409 (e-mail duplicado, autodesativacao) — ja estao em portugues ("E-mail ja cadastrado.") e nao passam por `violations[]`.
- Traduzir mensagens de Bean Validation de outras telas/dominios (categorias, transacoes, login) — a issue cobre somente o formulario de usuarios (ver Decisoes).
- Configurar locale global pt-BR do Hibernate Validator (`quarkus.locales`/`quarkus.default-locale`) — descartado por decisao registrada abaixo.

## Decisoes

- 2026-07-10 — **Abrangencia da traducao**: traduzir somente as mensagens dos DTOs de usuarios (`UserCreateRequest`/`UserUpdateRequest`), definindo `message` diretamente nas annotations de Bean Validation. Nao usar locale global pt-BR do Hibernate Validator, pois afetaria todos os endpoints e foge do escopo da issue.
- 2026-07-10 — **Textos exatos das mensagens**: os textos propostos na spec foram aprovados como estao (o de senha segue o padrao ja documentado em `knowledge/users.md`: "A senha deve ter entre 8 e 72 caracteres").

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/26
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/users.md`
