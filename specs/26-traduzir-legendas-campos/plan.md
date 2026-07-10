# Plano de implementacao

## Abordagem

Definir `message` customizado em portugues em cada annotation de Bean Validation dos dois DTOs de usuarios (`UserCreateRequest` e `UserUpdateRequest`), sem tocar nas regras (limites, obrigatoriedade) nem no mecanismo de exibicao do frontend — o componente de usuarios ja exibe `violation.message` vinda do backend como legenda (`users.ts`, `applySaveError`), entao a traducao na origem se propaga sozinha para a UI. Criar `UserResourceTest` (hoje inexistente) cobrindo as mensagens traduzidas nas respostas 400, seguindo o padrao de `CategoryResourceTest` (`@QuarkusTest` + `@TestSecurity`/`@JwtSecurity` com o usuario seed `00000000-0000-0000-0000-000000000001`, que e super admin e passa pelo `accessControl.require`).

## Arquivos a alterar

### Backend

- `backend/src/main/java/br/com/financeos/users/UserCreateRequest.java` — adicionar `message` em portugues em todas as annotations:
  - `name`: `@NotBlank(message = "O nome e obrigatorio.")`, `@Size(max = 120, message = "O nome deve ter no maximo 120 caracteres.")`
  - `email`: `@NotBlank(message = "O e-mail e obrigatorio.")`, `@Email(message = "Informe um e-mail valido.")`, `@Size(max = 180, message = "O e-mail deve ter no maximo 180 caracteres.")`
  - `password`: `@NotBlank(message = "A senha e obrigatoria.")`, `@Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")`
  - `profileId`: `@NotNull(message = "O perfil e obrigatorio.")`
- `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java` — mesmas mensagens para `name`, `email` e `profileId`; em `password` (opcional no update, so tem `@Size`) usar `@Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")`. Nao adicionar `@NotBlank` em `password` (comportamento atual de senha opcional mantido — branco/nulo mantem a senha, tratado em `UserResource.update`).
- `backend/src/test/java/br/com/financeos/users/UserResourceTest.java` — **novo** teste no padrao de `CategoryResourceTest` (`@QuarkusTest`, `@TestSecurity(user = "dev@financeos.local")`, `@JwtSecurity` com `sub = 00000000-0000-0000-0000-000000000001`), validando via REST Assured que:
  - `POST /users` com email mal formatado (ex.: `"abc"`) retorna 400 e `violations[]` contem, para o campo terminado em `email`, a mensagem "Informe um e-mail valido." (criterio citado na issue);
  - `POST /users` com senha curta (ex.: `"123"`) retorna 400 com "A senha deve ter entre 8 e 72 caracteres." para `password` (criterio citado na issue);
  - `POST /users` com corpo vazio/campos em branco retorna 400 com "O nome e obrigatorio.", "O e-mail e obrigatorio.", "A senha e obrigatoria." e "O perfil e obrigatorio.";
  - `PUT /users/{id}` com senha curta retorna 400 com a mesma mensagem de senha (garante o update tambem traduzido); usar um usuario criado no proprio teste (com cleanup `@AfterEach` deletando por email de teste, como o cleanup por prefixo de `CategoryResourceTest`).
  - Observacao: o formato das violations do Quarkus e `violations[].field` no formato `metodo.request.campo` — nos asserts, casar por sufixo do campo (ex.: `endsWith("email")`) ou filtrar a lista, em vez de igualdade exata do path.

### Frontend

- Nenhum arquivo muda. `frontend/src/app/features/users/users.ts` ja exibe `violation.message` do backend na legenda (`applySaveError`/`fieldErrors`); destaque `.invalid`, foco, limpeza por interacao e auto-dismiss permanecem intactos (issues #22/#24).

### Migration (se houver mudanca de schema)

- Nao ha mudanca de schema — nenhuma migration. (Para referencia, o proximo numero livre em `db/migration` seria V10.)

## Sequencia de implementacao

1. Adicionar os `message` em portugues nas annotations de `UserCreateRequest.java` (textos exatos aprovados na spec, secao Decisoes).
2. Repetir em `UserUpdateRequest.java`, mantendo `password` apenas com `@Size` (sem `@NotBlank`).
3. Criar `UserResourceTest.java` cobrindo os cenarios listados acima (no minimo email mal formatado e senha fora do tamanho, conforme criterio de aceite; incluir os demais campos obrigatorios e o `PUT`).
4. Rodar `./mvnw test` em `backend/` e confirmar que todos os testes passam.
5. Validacao manual ponta a ponta no navegador (a legenda visivel ao usuario muda de texto, mesmo sem arquivo de `features/` alterado): subir a stack, logar como admin, abrir a tela **Usuarios**, clicar em novo usuario e:
   - submeter com e-mail `abc` e senha `123` — conferir legenda vermelha "Informe um e-mail valido." abaixo de e-mail e "A senha deve ter entre 8 e 72 caracteres." abaixo de senha, com destaque `.invalid` e foco no primeiro campo invalido;
   - submeter o formulario todo em branco — conferir "O nome e obrigatorio.", "O e-mail e obrigatorio.", "A senha e obrigatoria." e "O perfil e obrigatorio." nos respectivos campos;
   - digitar nos campos e conferir que legenda + destaque somem juntos por interacao, e que a status-bar segue com X e auto-dismiss de 5s (nada disso deve ter regredido);
   - editar um usuario existente informando senha `123` — conferir a mesma mensagem de senha no fluxo de edicao;
   - conferir que nenhuma legenda em ingles do Bean Validation aparece em nenhum dos cenarios.

## Riscos e pontos de atencao

- **`password` no `UserUpdateRequest` nao tem `@NotBlank`**: nao introduzir obrigatoriedade por engano — senha em branco no update mantem a atual (`knowledge/users.md`). So o `@Size` recebe mensagem. Detalhe pre-existente: `@Size(min = 8)` rejeita string vazia nao-nula, entao o frontend precisa continuar enviando `null`/omitindo a senha quando em branco — comportamento atual, fora do escopo mudar.
- **Nao usar locale global** (`quarkus.locales`/`quarkus.default-locale`) nem `ValidationMessages.properties`: decisao registrada na spec restringe a traducao aos DTOs de usuarios para nao afetar categorias/transacoes/login.
- **Formato do `field` nas violations**: o Quarkus retorna `create.request.email` / `update.request.password`; o frontend ja faz `split('.').pop()`. Nos testes novos, nao assumir path exato — casar por sufixo.
- **Frontend intocado**: qualquer mudanca acidental em `users.ts`/`users.html`/`users.scss` arrisca regredir os comportamentos das issues #22 e #24 (destaque, foco, limpeza por interacao, auto-dismiss) — este plano nao altera nenhum arquivo do frontend.
- Textos das mensagens devem ser **exatamente** os da spec (criterios de aceite verificam string literal, incluindo o ponto final).
