# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; containers `financeos-backend`/`financeos-frontend` criados 07:29:40, depois da ultima edicao de codigo, 07:23).
Branch: `feature/issue-76-bloqueia-autodesativacao-put` — mudancas ainda **nao commitadas**.

Chamadas reais a stack: `GET /api/health` 200; `PUT /api/users/...0001` e `GET /api/documentation` **sem token** -> 401. A tentativa de assinar um JWT local com a chave RSA do repo (usuario `...0001`, so `GET`) foi **bloqueada pelo classificador de permissoes** ("Credential Exploration", issue #71); nao foi contornada. Os comportamentos de API ficam provados pela suite automatizada. Nenhuma escrita na stack local. No banco local, so leitura (`profiles`, `app_users`).

Prova de que o container serve o codigo da feature: `backend-1.0.2-dev.jar` copiado do container contem, em UTF-8 correto (`c3 b3`, `c3 a7`, `c3 a3`, sem `c3 83`), "alterar o próprio perfil" em `UserResource.class`, `java/lang/Boolean` e "A situação é obrigatória." em `UserUpdateRequest.class`, "Status para Inativo" em `UsersAreaContent.class` e "trocar o próprio perfil" em `ReleaseNotesContent.class`.

Suite backend: `target/surefire-reports` de 07:26 (posterior a todos os fontes), 14 de 14 classes de teste, 113 testes, 0 falhas/erros. Suite frontend: reexecutada nesta etapa (`npm test -- --watch=false`): 31 arquivos, 311 testes, todos passaram.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | PUT proprio com Inativo -> 409, nada gravado | VERIFICADO | `UserResourceTest#shouldRejectDeactivatingOwnAccountOnUpdate` (passou): 409 + mensagem, GET com nome/e-mail/perfil iguais e `active: true`; `UserResource.java:98-101` |
| 2 | PUT proprio com outro perfil -> 409, nada gravado | VERIFICADO | `UserResourceTest#shouldRejectChangingOwnProfileOnUpdate` (passou), com nome alterado no corpo; `UserResource.java:102-104` |
| 3 | Inativo + outro perfil -> 409, nada gravado | VERIFICADO | `UserResourceTest#shouldRejectDeactivatingAndChangingOwnProfileTogether` (passou): mensagem de desativacao, GET inalterado |
| 4 | PUT proprio ativo + mesmo perfil -> 200 | VERIFICADO | `UserResourceTest#shouldAllowUpdatingOwnNameKeepingProfileAndActive` e `#shouldAllowKeepingOwnEmailOnUpdate` (passaram) |
| 5 | Outro usuario: desativar/trocar perfil -> 200 | VERIFICADO | `UserResourceTest#shouldAllowDeactivatingAnotherUserOnUpdate` e `#shouldAllowChangingAnotherUserProfileOnUpdate` (passaram), GET confere |
| 6 | `active` ausente/null -> 400 "A situação é obrigatória." | VERIFICADO | `UserResourceTest#shouldRequireActiveOnUpdateForOwnAccount` e `#shouldRequireActiveOnUpdateForAnotherUser` (passaram): sem campo e `null`, `violations` `.active`, `message` com "Situação", GET inalterado; `UserUpdateRequest.java:14` (`@NotNull Boolean`) |
| 7 | DELETE proprio 409, DELETE outro 204, PUT super_admin 404 | VERIFICADO | `#shouldRejectDeactivatingOwnAccount` (passou, metodo fora dos hunks do diff), `#shouldDeactivateAnotherUserOnDelete`, `#shouldReturnNotFoundWhenUpdatingHiddenSuperAdmin` (passaram) |
| 8 | Tela: Alerta nos dois 409, linha em edicao, sem Sucesso | VALIDACAO MANUAL | `users.spec.ts` "exibe alerta no 409 ao salvar a própria linha como Inativo..." e "...ao trocar o próprio perfil..." passaram; a spec pede tambem a tela real — roteiro item 1 |
| 9 | `saveEdit` sempre envia `active` booleano | VERIFICADO | `users.spec.ts` "envia active verdadeiro no PUT quando o Status fica Ativo" e "envia active falso no PUT quando o Status muda para Inativo" (passaram); option index 1 = `[ngValue]="false"` em `users.html:167` |
| 10 | Central, area Usuarios: regra ampliada | VALIDACAO MANUAL | Objetivo ja verificado: `DocumentationContentTest#shouldExplainOwnAccountProtectionsInUsersBusinessRules`, `#shouldKeepParagraphsShort` (442 caracteres) e `#shouldNotExposeTechnicalIdentifiers` passaram. Resta o tom — roteiro item 2 |
| 11 | Novidades 1.0.2: um item em Correcoes | VALIDACAO MANUAL | Objetivo ja verificado: `ReleaseNotesContentTest#shouldAnnounceOwnAccountProtectionsAsASingleFixIn102` (2 itens FIX, contraste intacto), `#shouldNotRepeatAnyItemAcrossVersions`, `#shouldNotExposeTechnicalIdentifiers` passaram; diff so acrescenta o item. Resta o tom — roteiro item 3 |
| 12 | Varreduras de acentuacao sem ocorrencia nova | VERIFICADO | Comandos literais do `context.md` rodados nesta etapa: frontend 2 linhas (`styles.scss:24,30`), backend 6 (`ProductionBootstrap.java:178,179`, `DashboardResource.java:41,85,124,125`) — identico ao baseline |
| 13 | Suites completas passam | VERIFICADO | Backend 113/113 (surefire, 14 classes); frontend 311/311 (reexecutado) |

## Roteiro de validacao manual

Cuidado: no item 1 voce edita a sua propria linha. Se aparecer toast de **Sucesso** em vez de Alerta, pare — a correcao nao esta no ar. No banco local existem os perfis "Administrador" e "Somente Dashboard".

1. Abra `http://localhost`, entre com a sua conta (Thiago, perfil Administrador) e va em **Usuários**. Na sua linha clique **Editar**, mude **Status** para **Inativo** e clique **Salvar**. Esperado: toast de titulo **Alerta** com "Você não pode desativar a própria conta."; a linha continua em edicao (campos editaveis visiveis); nenhum toast de Sucesso. Volte o Status para **Ativo**, mude **Perfil** para **Somente Dashboard** e clique **Salvar**. Esperado: toast **Alerta** com "Você não pode alterar o próprio perfil.", linha ainda em edicao, sem Sucesso. Por fim clique **Sair** -> **Sair sem salvar** e confira que a linha mostra Ativo e Administrador. Se quiser, recarregue a pagina (F5): continua igual. (criterio 8)
2. Va em **Sobre -> Documentação**, area **Usuários**, secao **Regras de negócio**. Esperado: o destaque diz que voce nao pode desativar a propria conta **nem pelo botão Desativar nem mudando o Status para Inativo na sua linha**, que **ninguém altera o próprio perfil**, cita as duas mensagens e diz que a mudanca precisa ser feita por outra pessoa. Julgue se o texto esta claro para um usuario comum. (criterio 10)
3. Va em **Sobre -> Novidades por versão**, bloco **1.0.2**, **Correções**. Esperado: exatamente dois itens — o do contraste da borda (inalterado) e "Tela de Usuários: não é mais possível desativar a própria conta nem trocar o próprio perfil ao editar a sua linha." Julgue o texto. (criterio 11)

## Dados de teste criados

Nenhum. Os testes de backend rodam no banco de devservices (nao no Postgres da stack) e restauram o usuario `...0001` e apagam o perfil/usuarios de teste no `@AfterEach`.

## Conclusao

10 de 13 criterios verificados automaticamente; 3 (8, 10, 11) dependem do usuario, e em todos a parte objetiva ja esta coberta por teste que passou. Nenhum NAO ATENDIDO.

Validado pelo usuario em 2026-09-23.
