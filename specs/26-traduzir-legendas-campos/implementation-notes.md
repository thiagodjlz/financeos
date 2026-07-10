# Notas de implementacao

Branch: `feature/issue-26-traduzir-legendas-campos`

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/users/UserCreateRequest.java` — `message` em portugues em todas as annotations de Bean Validation (`name`, `email`, `password`, `profileId`), textos exatos aprovados na spec.
- `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java` — mesmas mensagens para `name`, `email` e `profileId`; em `password` apenas o `@Size` recebeu mensagem (senha continua opcional no update, sem `@NotBlank`).
- `backend/src/test/java/br/com/financeos/users/UserResourceTest.java` — novo, no padrao de `CategoryResourceTest` (`@QuarkusTest` + `@TestSecurity`/`@JwtSecurity` com o super admin seed). Cobre: e-mail mal formatado, senha curta no POST, campos obrigatorios em branco (`{}`), `name`/`email` acima do tamanho maximo e senha curta no PUT. Asserts casam `violations[].field` por sufixo (`endsWith('.campo')`), pois o path completo e `metodo.request.campo`. Cleanup `@AfterEach` deleta usuarios por prefixo de e-mail `teste-usuarios-%`.

## Decisoes

- Branch criada a partir de `main` atualizada (ja com o merge da feature #24), e nao da branch anterior — instrucao da esteira; a pasta `specs/26-*` estava untracked e acompanhou a troca de branch.
- No teste de PUT, o usuario alvo e criado via `POST /users` no proprio teste, usando o perfil seed `00000000-0000-0000-0000-000000000010` (Administrador) da migration V6.
- No teste de tamanho maximo de e-mail, foi usado um e-mail **bem formado** de 181 caracteres (local-part de 64 chars + dominio longo) em vez de um local-part gigante: o `@Email` do Hibernate Validator rejeita local-part acima de 64 chars, o que geraria duas violacoes para o campo e tornaria o assert nao deterministico.

## Desvios em relacao ao plano

- Nenhum desvio de escopo. Unico ajuste tecnico: o dado do teste de e-mail acima de 180 caracteres precisou ser um endereco bem formado (ver Decisoes), para isolar a violacao do `@Size` da do `@Email` — o plano nao previa essa interacao entre as duas annotations.
- O passo 5 do plano (validacao manual no navegador) acontece fora deste agente, apos o build/docker-restart da esteira.
