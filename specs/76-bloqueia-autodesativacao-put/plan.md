# Plano de implementacao

## Abordagem

A regra entra so no back-end: `UserUpdateRequest.active` vira `Boolean` com `@NotNull` (C6) e `UserResource.update` ganha, depois das validacoes de entrada ja existentes e antes de qualquer atribuicao, duas checagens para `currentUser.id().equals(id)`: `active == false` -> 409 "Você não pode desativar a própria conta." e `profileId` diferente do atual -> 409 "Você não pode alterar o próprio perfil.". O front de producao nao muda (decisao P1): o toast de Alerta ja exibe a `message` do 409 e mantem a linha em edicao; so `users.spec.ts` ganha os casos. Central (`UsersAreaContent`) e Novidades (`ReleaseNotesContent`, bloco `1.0.2`) acompanham a regra.

**Ordem das checagens no `update`** (fixa as mensagens de C3 e do caso de perfil inexistente):
`findVisibleById` (404) -> e-mail de outro (409) -> `requireProfileExists` (400) -> **proprio usuario: desativacao (409) -> perfil (409)** -> atribuicoes.

**Decisao do plano — PUT na propria conta com perfil inexistente responde 400 "Perfil informado não existe."**, nao o 409 novo. Motivos: (1) e erro de entrada, e a resposta tem de ser a mesma para qualquer alvo — o 409 novo e regra sobre a propria conta, que so faz sentido com uma entrada valida; (2) "Você não pode alterar o próprio perfil." sugeriria que o perfil existe e so faltou permissao, o que e enganoso; (3) preserva a ordem atual do PUT, so acrescentando a checagem nova no fim; (4) nada e gravado em nenhum dos dois casos. Pelo mesmo raciocinio, em C3 (Inativo **e** outro perfil) responde a mensagem de desativacao, que e checada primeiro — espelha o DELETE.

`Objects.equals(user.profileId, request.profileId())` na comparacao de perfil: `profile_id` e anulavel no banco (inalcancavel aqui, mas evita NPE).

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java` — `boolean active` -> `@NotNull(message = "A situação é obrigatória.") Boolean active`.
- `backend/src/main/java/br/com/financeos/users/UserResource.java` — duas checagens do proprio usuario no `update`, na ordem acima.
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — `regras()`: highlight reescrito (botao Desativar **e** Status Inativo na linha; ninguem altera o proprio perfil).
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — +1 item em `Kind.FIX` do `versao_1_0_2()`.
- `backend/src/test/java/br/com/financeos/users/UserResourceTest.java` — casos C1-C7 e o caso de perfil inexistente na propria conta.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste do texto da area Usuarios.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — teste do item novo.

### Frontend
- `frontend/src/app/features/users/users.spec.ts` — casos C8 e C9. Nenhum arquivo de producao do front muda.

### Migration
- Nenhuma (sem mudanca de schema; proximo numero livre seria `V15`).

## Tarefas

- [x] **T1** — Tornar `active` obrigatorio no `UserUpdateRequest` (`Boolean` + `@NotNull(message = "A situação é obrigatória.")`); `user.active = request.active()` continua valido (desempacota um valor garantido nao nulo)
  - Arquivos: `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java`
  - Criterios: 6
- [x] **T2** — No `UserResource.update`, depois de `requireProfileExists` e antes das atribuicoes, recusar com 409 quando o alvo e o proprio usuario: primeiro `!request.active()` ("Você não pode desativar a própria conta."), depois perfil diferente do atual ("Você não pode alterar o próprio perfil.")
  - Arquivos: `backend/src/main/java/br/com/financeos/users/UserResource.java`
  - Criterios: 1, 2, 3, 4, 5, 7
- [x] **T3** — Infraestrutura do `UserResourceTest` para mexer na propria conta com seguranca: perfil de teste com UUID constante inserido por SQL nativo (`QuarkusTransaction.requiringNew()`, padrao de `DocumentationSecurityTest`); `@AfterEach` que, **nesta ordem**, restaura o usuario `...0001` ao estado do seed (nome "FinanceOS Dev", `dev@financeos.local`, perfil `...0010`, ativo) direto pelo repositorio, apaga os usuarios `teste-usuarios-%` e so entao apaga o perfil de teste (FK de `app_users.profile_id`). Helper para ler um usuario pelo `GET /users`
  - Arquivos: `backend/src/test/java/br/com/financeos/users/UserResourceTest.java`
  - Criterios: — (infraestrutura para T4 e T5)
- [x] **T4** — Testes da propria conta: C1 (Inativo -> 409 + GET inalterado), C2 (outro perfil, com nome alterado no corpo -> 409 + GET com perfil/nome/e-mail/`active` inalterados), C3 (Inativo + outro perfil -> 409 com a mensagem de desativacao, nada gravado), C4 (mesmo perfil + ativo + nome novo -> 200 e nome aplicado), e o caso da decisao do plano (perfil inexistente -> 400 "Perfil informado não existe.")
  - Arquivos: `backend/src/test/java/br/com/financeos/users/UserResourceTest.java`
  - Criterios: 1, 2, 3, 4
- [x] **T5** — Testes de nao-regressao e contrato: C5 (outro usuario: Inativo -> 200 e GET `active: false`; outro perfil -> 200 e GET com perfil novo), C6 (sem `active` e com `active: null`, para o proprio e para outro -> 400, `violations` com campo terminado em `.active` e "A situação é obrigatória.", `message` contendo "Situação", GET com o alvo ainda ativo), C7 (`DELETE` de outro -> 204; `PUT /users/00000000-0000-0000-0000-000000000099` com corpo valido -> 404; `shouldRejectDeactivatingOwnAccount` e `shouldAllowKeepingOwnEmailOnUpdate` intocados)
  - Arquivos: `backend/src/test/java/br/com/financeos/users/UserResourceTest.java`
  - Criterios: 4, 5, 6, 7
- [x] **T6** — Reescrever o highlight de `UsersAreaContent.regras()`: a propria conta nao pode ser desativada nem pelo botao Desativar nem mudando o Status para Inativo na linha, e ninguem altera o proprio perfil; citar as duas mensagens; <= 600 caracteres; acrescentar em `DocumentationContentTest` um teste que localiza a area "Usuários", secao "Regras de negócio", e confere "Status", "Inativo" e "próprio perfil"
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java`, `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`
  - Criterios: 10
- [x] **T7** — Acrescentar **um** item em `Kind.FIX` do bloco `1.0.2` (ex.: "Tela de Usuários: não é mais possível desativar a própria conta nem trocar o próprio perfil ao editar a sua linha."), sem alterar os itens existentes nem criar bloco; teste em `ReleaseNotesContentTest` que confere FIX com 2 itens, o item de contraste intacto e um item citando "própria conta" e "próprio perfil"
  - Arquivos: `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java`, `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java`
  - Criterios: 11
- [x] **T8** — `users.spec.ts`: C8 — dois testes (linha trocada para Inativo e linha com Perfil `profile-2`) com `flush` de 409 e a respectiva `message`, conferindo 1 toast de titulo "Alerta" com o texto, nenhum "Sucesso", linha ainda em edicao (`input[name="editName"]` presente) e nenhum `GET /users` extra; C9 — `request.request.body.active` e `true` ao salvar sem mexer no Status e `false` ao trocar para Inativo. O select `editActive` usa `[ngValue]`, entao o helper `selectValue` (que atribui `value`) nao serve: mudar por `selectedIndex = 1` + `change`
  - Arquivos: `frontend/src/app/features/users/users.spec.ts`
  - Criterios: 8, 9
- [x] **T9** — Rodar as duas varreduras de acentuacao (comandos literais no `context.md`) e comparar com o baseline 2/6; rodar `./mvnw test` e `npm test` completos
  - Arquivos: —
  - Criterios: 12, 13

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | PUT proprio com Inativo -> 409, nada gravado | T2, T4 |
| 2 | PUT proprio com outro perfil -> 409, nada gravado | T2, T4 |
| 3 | Inativo + outro perfil -> 409, nada gravado | T2, T4 |
| 4 | PUT proprio ativo + mesmo perfil -> 200 | T2, T4, T5 |
| 5 | Outro usuario: desativar/trocar perfil continua 200 | T2, T5 |
| 6 | `active` ausente/null -> 400 "A situação é obrigatória." | T1, T5 |
| 7 | DELETE proprio 409, DELETE outro 204, PUT super_admin 404 | T2, T5 |
| 8 | Tela: toast de Alerta nos dois 409, linha em edicao, sem Sucesso | T8 |
| 9 | `saveEdit` sempre envia `active` booleano | T8 |
| 10 | Central: regra ampliada na area Usuarios | T6 |
| 11 | Novidades 1.0.2: um item em Correções | T7 |
| 12 | Varreduras de acentuacao sem ocorrencia nova | T9 |
| 13 | Suites completas verdes | T9 |

## Superficie de validacao

- Criterios 1-4 — `UserResourceTest` (T4): `PUT /api/users/00000000-0000-0000-0000-000000000001` + `GET /api/users` conferindo o registro `...0001`.
- Criterio 5 — `UserResourceTest` (T5), usuario criado no proprio teste.
- Criterio 6 — `UserResourceTest` (T5): corpo sem `active` e com `"active": null`, alvo proprio e outro.
- Criterio 7 — `UserResourceTest` (T5) + `shouldRejectDeactivatingOwnAccount` existente.
- Criterios 8, 9 — `users.spec.ts` (T8); 8 tambem na tela (abaixo).
- Criterio 10 — `DocumentationContentTest` (T6) + leitura de `/documentation`, area Usuários.
- Criterio 11 — `ReleaseNotesContentTest` (T7) + leitura do menu Sobre -> Novidades por versão.
- Criterios 12, 13 — saida dos comandos (T9).

## Validacao manual (etapa 7)

- Criterio 8 — `http://localhost`, logado com a propria conta (a esteira nao tem senha; o usuario valida): Usuários -> Editar na propria linha -> Status "Inativo" -> Salvar: toast de Alerta "Você não pode desativar a própria conta.", linha continua em edicao, nenhum toast de Sucesso. Repetir trocando so o Perfil: "Você não pode alterar o próprio perfil.". Depois "Sair" -> "Sair sem salvar" e conferir que a linha mostra os valores originais.
- Criterios 10 e 11 — leitura do texto novo em Sobre -> Documentação (area Usuários) e Sobre -> Novidades por versão (bloco 1.0.2, Correções).

## Riscos e pontos de atencao

- **Principal: os testes mexem no usuario `...0001`, compartilhado por todas as classes `@QuarkusTest` do mesmo banco de devservices.** Se um teste deixar esse usuario inativo, com perfil de teste sem permissao ou com outro nome, as classes seguintes (Dashboard, Categorias, Lancamentos...) podem cair em 403 e a falha aparece longe da causa. Mitigacao: restauracao incondicional no `@AfterEach` pelo repositorio (nao pelo PUT, que a propria regra nova recusaria) antes de apagar o perfil de teste. (`knowledge/testing.md`)
- Contrato apertado (`active` obrigatorio) — inventario dos consumidores: os 3 PUT existentes em `UserResourceTest` ja enviam `"active": true`; nenhum outro teste de backend chama `PUT /users`; `user.service.spec.ts` e `saveEdit` enviam booleano. O default implicito (`false` do primitivo) deixa de existir, sem substituto. Sem dado legado: `app_users.active` ja e `not null`.
- Canal: as duas mensagens 409 novas viram toast — ambas acentuadas, sem identificador tecnico. (`knowledge/backend-patterns.md`)
- O front nao conhece o proprio id (`/api/auth/me` nao o expoe, decisao P1): nao ha espelho de UX, e o unico retorno e o toast do 409 — aceito na spec.
- Comentario ou texto novo no backend com "nao"/"voce" sem acento sobe a varredura; titulos de `it(...)` do front idem.

## Lacunas

Nenhuma.
