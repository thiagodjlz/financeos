# Notas de implementacao

Branch: `feature/issue-76-bloqueia-autodesativacao-put` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 8 de 9 concluidas (ver `plan.md`); T9 parcial, ver Desvios.

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/users/UserUpdateRequest.java` — `active` passa a `Boolean` com `@NotNull(message = "A situação é obrigatória.")`.
- `backend/src/main/java/br/com/financeos/users/UserResource.java` — `update` recusa com 409 a desativação e a troca de perfil da própria conta, depois de `requireProfileExists` e antes de gravar.
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — highlight de "Regras de negócio" cobre botão Desativar, Status Inativo na linha e o próprio perfil.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — +1 item em Correções do bloco `1.0.2`.
- `backend/src/test/java/br/com/financeos/users/UserResourceTest.java` — perfil de teste (`...09d2`) por SQL nativo, snapshot/restauração do usuário `...0001` e 11 testes novos (C1-C7 e perfil inexistente na própria conta).
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste do highlight da área Usuários.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — teste do item novo em Correções (FIX com 2 itens, contraste intacto).
- `frontend/src/app/features/users/users.spec.ts` — 4 testes: 409 de Inativo e de outro Perfil na linha (C8) e `body.active` true/false (C9).
- `specs/76-bloqueia-autodesativacao-put/plan.md` — marcação das tarefas.
- `specs/76-bloqueia-autodesativacao-put/spec.md` — front-matter (`stage`, `branch`).
- `specs/76-bloqueia-autodesativacao-put/implementation-notes.md` — este arquivo.

## Decisoes

- Ordem das checagens do PUT conforme o plano: 404 -> e-mail (409) -> perfil inexistente (400) -> própria conta: desativação (409) -> perfil (409). C3 responde a mensagem de desativação; perfil inexistente na própria conta responde 400 "Perfil informado não existe." (teste `shouldRejectNonexistentProfileOnOwnUpdateAsBadRequest`).
- Comparação de perfil com `Objects.equals(user.profileId, request.profileId())`, porque `profile_id` é anulável no banco.
- Restauração do usuário `...0001` no `@AfterEach` por snapshot tirado no `@BeforeEach` (nome, e-mail, perfil, active), e não por valores fixos do seed: devolve exatamente o estado que a classe encontrou, mesmo que outra classe tenha mexido antes. Feita pelo repositório, pois o PUT recusaria desfazer. Ordem: restaura `...0001`, apaga `teste-usuarios-%`, apaga `profile_permissions` e o perfil de teste.
- No front, o select `editActive` (`[ngValue]`) é trocado por `selectedIndex = 1` + `change`; o de perfil (`[value]`) usa o `selectValue` existente. Nenhum arquivo de produção do front mudou (decisão P1).

## Desvios em relacao ao plano

- T9 fica desmarcada: as varreduras de acentuação foram rodadas (frontend 2 linhas, backend 6 — igual ao baseline, C12 ok) e `npm test` completo passou (31 arquivos, 311 testes), mas a suite completa do backend (`./mvnw test`) não foi rodada nesta etapa — pela regra do agente de implementação ela é o portão do `/pipeline:quality-check`. Backend rodado escopado: `UserResourceTest` (20/20), `DocumentationContentTest` (10/10), `DocumentationResourceTest`, `ReleaseNotesContentTest` (9/9), `ReleaseNotesResourceTest`.
- Snapshot em vez de restaurar para valores fixos do seed (ver Decisoes) — mesmo efeito de proteção pedido no plano.
