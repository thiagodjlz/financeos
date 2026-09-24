---
issue: 92
url: https://github.com/thiagodjlz/financeos/issues/92
title: "Central de Documentação afirma que não existe usuário sem perfil"
domains: [documentation, users]
target: main
stage: validated
branch: feature/issue-92-central-usuario-sem-perfil
created: 2026-09-24
---

# Central de Documentação afirma que não existe usuário sem perfil

## Historia

Como pessoa que consulta a Central de Documentação, quero que a regra de perfil de Usuários descreva o que o sistema realmente garante, para que eu não encontre uma contradição ao ver um usuário com "-" na coluna Perfil.

## Contexto

A área Usuários da Central, seção "Regras de negócio" (`UsersAreaContent.regras()`), publica: "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um." A segunda metade é falsa (achado da verificação da #89 / PR #91):

- `app_users.profile_id` é anulável: criado na `V5__create_profiles.sql` sem `not null`, e a `V6__seed_profiles_and_admin.sql` só preencheu o `dev@financeos.local`. Usuário anterior à V5 ou inserido direto no banco fica sem perfil.
- A listagem de Usuários exibe `profileName` nulo como "-" na coluna "Perfil" (`users.ts`, `profileName()`; comportamento esperado desde a #89).
- O que o sistema garante (conferido no código e em `knowledge/users.md`): `profileId` é `@NotNull(message = "O perfil é obrigatório.")` em `UserCreateRequest` **e** `UserUpdateRequest`, e o `UserResource` recusa perfil inexistente com 400 "Perfil informado não existe." no create e no update. Logo, todo cadastro e toda alteração via API exigem um perfil; um usuário sem perfil só deixa de estar nessa condição quando alguém edita o cadastro dele.

Regras da Central que se aplicam (`knowledge/documentation.md`): nada de regra inventada (toda afirmação tem origem no código ou no `knowledge/`), linguagem de usuário (rótulos da tela, nenhum termo de implementação), itens/parágrafos curtos. A frase atual é a única ocorrência dessa afirmação no conteúdo publicado (varredura em `backend/src/main/java` e `frontend/src/app`).

É só correção de texto: não muda regra de negócio, validação, endpoint nem banco.

## Criterios de aceite

- [x] CA1. No conteúdo servido por `GET /api/documentation`, a área `users`, seção "Regras de negócio", não contém mais a frase "não existe pessoa cadastrada sem um" (nem outra afirmação de que é impossível existir usuário sem perfil) e contém um item dizendo que **todo cadastro e toda alteração de usuário exigem um perfil**. Evidência: teste automatizado no pacote de testes de Documentação do backend (ex.: `DocumentationContentTest`) que falha se a frase antiga voltar e se o item novo sumir.
- [x] CA2. A mesma seção explica por que um usuário pode aparecer com "-" na coluna Perfil: pessoas cadastradas antes de o sistema ter perfis podem estar sem perfil e passam a ter um quando o cadastro delas for alterado. O texto novo não contém termos técnicos — nenhuma ocorrência de "banco", "migração", "migration", "API", "nulo", "null", "profile", "Flyway" ou nome de versão de migração (`V5`, `V6`) no(s) item(ns) alterado(s) — e cita os rótulos como a tela os exibe ("Perfil", "-").
- [x] CA3. O texto novo não contradiz o restante da área Usuários da Central: continua coerente com a linha "Perfil" da seção "Campos" ("Obrigatório...") e com o destaque de que ninguém altera o próprio perfil (a correção do perfil de quem está sem um é feita por outra pessoa com permissão na tela de Usuários, nunca descrita como algo que a própria pessoa faz).
- [x] CA4. Nenhuma regra muda: `git diff` da branch contra `main` não altera `UserCreateRequest.java`, `UserUpdateRequest.java`, `UserResource.java`, `AccessControl.java` nem cria/edita arquivo em `backend/src/main/resources/db/migration/`. Os testes de `backend/src/test/java/br/com/financeos/users/` e `.../documentation/` passam sem alteração de asserção de comportamento.
- [x] CA5. A suíte de Documentação do backend (`DocumentationContentTest`, `DocumentationResourceTest`, `DocumentationSecurityTest`) passa, incluindo o limite de 600 caracteres por parágrafo e a regra de nenhum item/seção vazio.
- [x] CA6. As duas varreduras de acentuação de `knowledge/architecture.md` (seção "Idioma"; regex do backend e do frontend são diferentes) continuam saindo **vazias**, como estão na `main` desde a issue #78.
- [x] CA7. `knowledge/users.md` deixa de registrar o ponto como pendente: a regra de `UserCreateRequest` não traz mais "redacao a corrigir na issue #92" nem afirma que a Central "simplifica demais", e passa a registrar que a Central publica a regra correta (cadastro e alteração exigem perfil; usuário antigo pode aparecer com "-").

## Fora de escopo

- Tornar `app_users.profile_id` obrigatório no banco (exigiria migration atribuindo perfil aos usuários existentes sem um) — só com decisão explícita, em outra issue.
- Explicar na Central o que um usuário sem perfil consegue ver/fazer (no código, `AccessControl` trata perfil nulo como nenhuma permissão). A issue pede só a correção da frase; acrescentar essa regra seria conteúdo novo.
- Ajustar a linha "Perfil" da seção "Campos" ("na alteração, o perfil já gravado é mantido"), que não contempla o caso raro de quem, sem permissão de ver Perfis, edita um usuário sem perfil (o PUT volta 400 "O perfil é obrigatório."). Não é o texto apontado pela issue.
- Item em "Novidades por versão": a Central de Documentação estreia no próprio bloco `1.0.2` (categoria Novidades) e a `1.0.2` ainda não foi cortada, então corrigir uma frase dela não é mudança entre versões (`knowledge/documentation.md`: nenhum item se repete; retrabalho só entra no bloco de uma versão seguinte).
- Qualquer mudança de tela, frontend, validação ou mensagem de erro.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/92
- Achado de origem: verificação da #89 / PR #91
- Código conferido: `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` (`regras()`, `campos()`), `users/UserCreateRequest.java`, `users/UserUpdateRequest.java`, `users/UserResource.java`, `shared/AccessControl.java`, `db/migration/V5__create_profiles.sql`, `V6__seed_profiles_and_admin.sql`, `releasenotes/content/ReleaseNotesContent.java`, `frontend/src/app/features/users/users.ts` e `users.html`
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/users.md`, `knowledge/documentation.md`
