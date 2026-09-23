# Briefing — issue 76

## Regras que restringem esta mudanca

- Toda regra e imposta no back-end (checagem no `Resource` ou Bean Validation no DTO, erro em portugues); o front so espelha como UX. Aqui o front **nao muda codigo de producao** (decisao P1 da spec): o 409 do back vira toast sozinho. (`knowledge/architecture.md`)
- `DELETE /users/{id}` ja recusa o proprio id com 409 "Você não pode desativar a própria conta." (`currentUser.id().equals(id)`); o PUT nao tem checagem — e a brecha desta issue. (`knowledge/users.md`)
- `profileId` precisa existir: `requireProfileExists` -> 400 "Perfil informado não existe.", no create e no update. E-mail unico: 409 "E-mail já cadastrado." (update ignora o proprio usuario). (`knowledge/users.md`)
- Toda anotacao de Bean Validation tem `message` em portugues acentuado, por DTO (nunca locale global). O 400 traz `violations[]` (campo `metodo.request.campo`) + `message` agregada do `ValidationExceptionMapper`; `@NotNull` conta como campo ausente e o rotulo vem de `shared/FieldLabels` (`active` -> "Situação" ja existe). (`knowledge/backend-patterns.md`, `knowledge/users.md`)
- Toda mensagem passada a `WebApplicationException` vira texto de UI (`BusinessExceptionMapper` serializa `{message}` e mantem o status). (`knowledge/backend-patterns.md`)
- `super_admin` oculto: `findVisibleById` o exclui, entao PUT no id `...0099` responde 404 antes de qualquer checagem. (`knowledge/users.md`, `knowledge/auth-and-permissions.md`)
- Erro do `saveEdit` vira toast de Alerta com a `message` do corpo e a linha segue em edicao; 2xx dispara toast de Sucesso. (`knowledge/users.md`)
- Central de Documentacao e Novidades por versao sao escritas a mao: mudar regra de tela documentada obriga revisar a area (`UsersAreaContent`) **e** o bloco da versao corrente (`1.0.2`) de `ReleaseNotesContent`. Linguagem de usuario, rotulo da tela ("Status", "Inativo", "Perfil"), sem identificador tecnico, paragrafo <= 600 caracteres (teste). Um bloco por `X.Y.Z`; nenhum item se repete entre blocos. (`knowledge/documentation.md`)
- Testes backend: usuario/perfil de teste com UUID constante entram por SQL nativo (`QuarkusTransaction.requiringNew()`) e saem no `@AfterEach`, sem migration (padrao de `DocumentationSecurityTest`). (`knowledge/testing.md`)
- Testes frontend (vitest/jsdom): tudo pelo DOM, `HttpTestingController` com `httpMock.verify()` no `afterEach`. (`knowledge/testing.md`)

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../users/UserUpdateRequest.java` | `boolean active` primitivo (ausente = `false`) | `@NotNull(message = "A situação é obrigatória.") Boolean active` |
| `backend/.../users/UserResource.java` | `update` grava `active`/`profileId` sem olhar quem e o alvo | 409 ao se desativar ou trocar o proprio perfil, antes de gravar |
| `backend/src/test/.../users/UserResourceTest.java` | `@TestSecurity` de classe, `sub` = `...0001` (seed "FinanceOS Dev", `dev@financeos.local`, perfil `...0010` Administrador, unico perfil semeado) | casos C1-C7 |
| `backend/.../documentation/content/UsersAreaContent.java` | `regras()` publica so a regra do botao Desativar (highlight) | cobre Status Inativo na linha e proprio perfil |
| `backend/src/test/.../documentation/DocumentationContentTest.java` | limites gerais (600 chars, sem identificador tecnico) | teste do texto novo da area Usuarios |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` | bloco `1.0.2`, FIX com 1 item (contraste) | +1 item em FIX |
| `backend/src/test/.../releasenotes/ReleaseNotesContentTest.java` | regras gerais do conteudo | teste do item novo |
| `frontend/src/app/features/users/users.spec.ts` | 409 de e-mail no PUT e 409 de autodesativacao no DELETE | 409 novos no PUT + corpo `active` |

Frontend de producao (`users.ts`, `users.html`, `user.service.ts`) **nao muda**: `UserUpdatePayload.active: boolean` e obrigatorio e `saveEdit` sempre envia `active: this.editForm.active`; o select `editActive` usa `[ngValue]="true|false"` (booleano real).

## Convencoes aplicaveis

- Sem comentario no codigo, salvo "porque" nao obvio.
- Texto exibido acentuado. Varreduras (so ocorrencias novas contam; baseline 2 linhas frontend `styles.scss` 24/30, 6 backend `DashboardResource.java` 41/85/124/125 e `ProductionBootstrap.java` 178/179). Comandos literais (`knowledge/architecture.md`):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  A varredura do front cobre `*.spec.ts`: titulo de `it(...)` e fixture tambem precisam estar acentuados.
- Nenhuma migration: nao ha mudanca de schema (`app_users.active` ja e `not null`).
- Suites completas: `cd backend && ./mvnw test`; `cd frontend && npm test`.

## Consultas fora do briefing

Nenhuma ate agora.
