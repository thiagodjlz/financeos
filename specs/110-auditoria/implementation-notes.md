# Notas de implementacao

Branch: `feature/issue-110-auditoria` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 27 de 27 concluidas (ver `plan.md`)

## Arquivos alterados

Backend (`backend/src/main/java/br/com/financeos/`):
- `audit/` (novo, 18 classes) — entidades `@Immutable`, enums de tipo/acao, repositorio, writer, `@Audited` + interceptor, `AuditTrail`, `AuditValues`, `ExpiredSessionAuditor`, `AuditResource` + DTOs.
- `profiles/Screen.java` — `AUDIT` apos `PROFILES`; `label()` por tela.
- `profiles/ProfileResource.java` — `AUDIT` em `VIEW_ONLY_SCREENS`; `@Audited` + snapshots (Nome, "Permissões: <tela>").
- `categories/CategoryResource.java`, `transactions/TransactionResource.java`, `users/UserResource.java` — `@Audited` + snapshots.
- `auth/AuthResource.java` — eventos Login/Login com falha; `POST /auth/logout`.
- `shared/AccessControl.java` — grava "Acesso negado" antes do 403.
- `shared/InvalidFormatExceptionMapper.java` — `screen` -> "A tela informada é inválida.".
- `documentation/content/AuditAreaContent.java` (novo), `DocumentationContent.java`, `OverviewContent.java`, `ProfilesAreaContent.java`; `releasenotes/content/ReleaseNotesContent.java`.
- `backend/src/main/resources/db/migration/V17__create_audit.sql` (novo).

Testes backend (`backend/src/test/java/br/com/financeos/`):
- `audit/` (novo) — `AuditProbe` (bean de leitura), `AuditChangeRecordingTest`, `AuditCoverageTest`, `AuditEventsTest`, `AuditResourceTest`, `AuditSecurityTest`.
- `auth/AuthResourceTest.java`, `profiles/ProfileResourceTest.java`, `documentation/DocumentationContentTest.java`, `documentation/DocumentationResourceTest.java`.

Frontend (`frontend/src/app/`):
- `core/models.ts`, `core/entry-route.ts` (+ `screenForUrl`), `core/entry-route.spec.ts`, `core/formatters.ts` (+ `dateTimeLabel`), `core/formatters.spec.ts`.
- `core/services/audit.service.ts` + `.spec.ts` (novos); `core/services/auth.service.ts` (`signOut`) + `.spec.ts`; `core/interceptors/auth.interceptor.spec.ts`.
- `core/screen-access-tracker.ts` + `.spec.ts` (novos).
- `app.routes.ts`; `layout/main-layout/main-layout.{ts,html,spec.ts}`.
- `features/profiles/profile-screens.ts`, `profile-form.spec.ts`, `profiles.spec.ts`.
- `features/audit/audit.{ts,html,scss,spec.ts}` (novos).

Knowledge: `knowledge/audit.md` (novo), `knowledge/README.md`, `knowledge/backend-patterns.md`, `knowledge/auth-and-permissions.md`.

## Decisoes

- `occurred_at` gravado pela aplicacao (`OffsetDateTime.now()`); tipo/acao/tela como texto; resposta traz `typeLabel/actionLabel/screenLabel` (codigo desconhecido sai pelo codigo).
- Usuario do registro capturado pelo interceptor **antes** do metodo (nome do momento mesmo editando a si proprio).
- Inclusao/exclusao omitem campo nulo; alteracao so com o que mudou. Lancamentos incluem "Origem" (Manual/Importação de planilha/Recorrência), "Parcela", "Total de parcelas", "Observações"; Categorias "Situação" Ativo/Inativo e "Categoria pai" pelo nome.
- Login com falha grava o e-mail digitado (`trim`, sem baixar caixa) em `user_email`, com `user_id/nome` da conta quando o e-mail existe. 400 de login (campos vazios) nao e tentativa e nao gera evento.
- Periodo lido no fuso `timeZone` (o front manda o do navegador); sem o parametro vale `America/Sao_Paulo`. Fuso invalido = 400 "O fuso horário informado é inválido.".
- Ocultacao do super_admin: `user_super_admin = false` **e** `user_id` fora de quem e super_admin hoje.
- `ScreenAccessTracker` provido no `MainLayout` (nao na raiz) para um login novo comecar sem tela anterior; registra a tela da carga inicial pelo `NavigationEnd` da navegacao que cria o shell (e por `router.navigated` se o shell nascer depois).
- `signOut` sai mesmo se o `POST /auth/logout` falhar; com token ja vencido, o 401 dessa chamada mostra o aviso "Sua sessão expirou" do interceptor (mantido).

### Revisao de textos (`revisar-textos`)

- Area nova "Auditoria": rascunho "no fuso do navegador" -> "no horário do aparelho que você está usando" (termo tecnico -> resultado percebido); "recusa 400/404/409 não grava" -> "Uma gravação recusada, como um dado inválido ou repetido, não gera registro de Alteração."; "token vencido recusado" -> "Ao voltar a usar o sistema depois que a sessão de 12 horas terminou, fica registrada uma Sessão expirada."; tipo "Impressão" sem emissor -> "O filtro Tipo também lista Impressão, que ainda não tem registros."; ocultacao do super_admin omitida (conta interna, sem utilidade para o usuario). Regras conferidas no codigo entregue.
- `OverviewContent`: "Configurações: seção com as telas de Usuários e Perfis." -> "... Usuários, Perfis e Auditoria."; ordem de entrada ganhou "Auditoria" apos Perfis; "Em Lançamentos, Categorias, Usuários e Perfis, tocar ou clicar..." -> "... Usuários, Perfis e Auditoria, ...".
- `ProfilesAreaContent`: linhas da matriz ganharam "Auditoria"; regra nova "A linha Auditoria também tem apenas a coluna Ver ... De início, só o perfil Administrador pode ver a Auditoria.".
- Novidades 1.0.3: item novo em Novidades "Auditoria: nova tela, no menu Configurações, que mostra quem incluiu, alterou ou excluiu cada registro, com o valor anterior e o novo de cada campo, e os acessos ao sistema, como entradas, saídas e telas abertas.".

## Desvios em relacao ao plano

- `POST /auth/logout` precisou de `@Consumes(MediaType.WILDCARD)`: o POST sem corpo respondia 415 pelo `@Consumes(JSON)` da classe.
- `DocumentationResourceTest` (fora do plano) ajustado para 6 areas.
- Records auxiliares nao listados (`AuditActor`, `AuditChange`, `AuditFilter`) e bean de teste `AuditProbe`.
- `auth.interceptor.ts` nao mudou (so ganhou teste); `MORE_ROUTE` do `main-layout.ts` passou a incluir `/audit`.
- Bloco 1.0.3 ganhou a categoria Novidades (antes so tinha Melhorias).
- T27 rodou as suites completas aqui: backend 219 e frontend 536 testes verdes; varreduras vazias.

## Ajustes pos-validacao (2026-10-07)

- Pedido: filtros Tipo/Ação/Funcionalidade abriam lista nativa com moldura vazia (Ação no desktop; Tipo e Funcionalidade no celular). Causa provavel: `<select>` dentro de `label.filter-field`; Lançamentos nao tem o problema.
- Mudou (`audit.html/ts/scss/spec.ts`): desktop usa `select.filter-select` solto ("Tipo: todos" etc.); painel do celular usa botoes `aria-pressed` que quebram linha (`.choice-toggle`), escolha vale no "Aplicar". Detalhes e testes: `evidence/ajuste-filtros-auditoria.md`.
