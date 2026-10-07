# Plano de implementacao

## Abordagem

Pacote novo `audit/` com duas trilhas na mesma tabela. **Alteracao**: metodo de escrita leva `@Audited` (interceptor binding de prioridade `APPLICATION`, logo dentro do `@Transactional`) e chama `AuditTrail.created/updated/deleted(screen, id, rotulo, antes, depois)` com snapshots `LinkedHashMap<rotulo, texto>`; grava na transacao da operacao, e o interceptor lanca `IllegalStateException` se o metodo retornar sem registrar. **Evento**: `AuditWriter.writeEvent` em `QuarkusTransaction.requiringNew()`, para sobreviver ao 401/403. Tipo e acao sao enums Java com rotulo, gravados como texto sem check; `user_super_admin` e snapshot na linha e a consulta exclui tambem quem e super_admin hoje. Front: tela `features/audit` no padrao de listagem, rastreio de tela no shell, "Sair" pelo servidor.

## Arquivos a alterar

Prefixos: `backend/src/main/java/br/com/financeos/` e `frontend/src/app/`.

### Backend
- `audit/` (novos): entidades `AuditRecord`/`AuditRecordChange`; enums `AuditEventType` (Alteração, Login, Login com falha, Logout, Sessão expirada, Acesso negado, Acesso à tela, Impressão) e `AuditAction` (Inclusão, Alteração, Exclusão, Visualização); `AuditRecordRepository`, `AuditWriter`, `Audited`, `AuditInterceptor`, `AuditTrail`, `AuditValues`, `AuditResource` + DTOs, `ExpiredSessionAuditor`.
- `profiles/Screen.java` — `AUDIT` apos `PROFILES`, `label()` em todas.
- `profiles/ProfileResource.java` — `AUDIT` em `VIEW_ONLY_SCREENS`; auditoria (Nome + "Permissões: <tela>" = "Ver, Incluir..."/"Sem acesso"; PUT so telas alteradas).
- `categories/CategoryResource.java`, `transactions/TransactionResource.java`, `users/UserResource.java` — `@Audited` + snapshots; referencia grava nome (pai, categoria, perfil); usuario sem senha, `DELETE` = `UPDATE` de "Ativo" Sim -> Não.
- `auth/AuthResource.java` — `LOGIN`/`LOGIN_FAILED` (e-mail digitado; vinculado se existir); `POST /auth/logout` `@Authenticated`, 204.
- `shared/AccessControl.java` — grava `ACCESS_DENIED` (tela + acao) antes do `ForbiddenException`.
- `shared/InvalidFormatExceptionMapper.java` — `"screen"` -> "A tela informada é inválida.".
- `documentation/content/` — `AuditAreaContent` (novo), `DocumentationContent`, `OverviewContent`, `ProfilesAreaContent`; `releasenotes/content/ReleaseNotesContent.java`.

### Frontend
- `core/models.ts` (`'AUDIT'`, `AuditRecord`, `AuditChange`, `AuditOptions`); `core/services/audit.service.ts` (novo); `core/services/auth.service.ts` (`signOut()`); `core/entry-route.ts` (`AUDIT` apos `PROFILES`, `screenForUrl`); `core/screen-access-tracker.ts` (novo); `core/formatters.ts` (`dateTimeLabel`); `app.routes.ts`; `layout/main-layout/main-layout.{ts,html}`; `features/profiles/profile-screens.ts`; `features/audit/audit.{ts,html,scss}` (novos).

### Migration
- `backend/src/main/resources/db/migration/V17__create_audit.sql` — `audit_records` (sem FK para `app_users`; indice `occurred_at desc, id`) e `audit_record_changes` (FK so para `audit_records`, sem cascade); recria `profile_permissions_screen_check` com `AUDIT`; semeia `AUDIT` em todo perfil com `can_view = (id = '00000000-0000-0000-0000-000000000010')`, demais flags `false` (proximo numero livre: V17).

## Tarefas

- [x] **T1** — Criar a V17
  - Arquivos: `db/migration/V17__create_audit.sql`
  - Criterios: 12, 14
- [x] **T2** — `Screen.AUDIT` com rotulos; view-only em Perfis
  - Arquivos: `profiles/Screen.java`, `profiles/ProfileResource.java`
  - Criterios: 10, 14
- [x] **T3** — Entidades e enums de auditoria
  - Arquivos: `audit/AuditRecord.java`, `AuditRecordChange.java`, `AuditEventType.java`, `AuditAction.java`
  - Criterios: 1, 10
- [x] **T4** — Repositorio (filtros; super_admin excluido na consulta) e `AuditWriter` (alteracao `MANDATORY`, evento `requiringNew`)
  - Arquivos: `audit/AuditRecordRepository.java`, `audit/AuditWriter.java`
  - Criterios: 4, 16, 17
- [x] **T5** — Mecanismo unico com diff por campo
  - Arquivos: `audit/Audited.java`, `AuditInterceptor.java`, `AuditTrail.java`, `AuditValues.java`
  - Criterios: 1, 2, 4, 5
- [x] **T6** — Auditar Categorias e Lancamentos
  - Arquivos: `categories/CategoryResource.java`, `transactions/TransactionResource.java`
  - Criterios: 1, 2, 13
- [x] **T7** — Auditar Usuarios e Perfis
  - Arquivos: `users/UserResource.java`, `profiles/ProfileResource.java`
  - Criterios: 1, 2, 3
- [x] **T8** — Login, Login com falha, Logout e Acesso negado
  - Arquivos: `auth/AuthResource.java`, `shared/AccessControl.java`
  - Criterios: 6, 7, 8
- [x] **T9** — Sessao expirada: `@ObservesAsync AuthenticationFailureEvent`; com `InvalidJwtException.hasExpired()` na cadeia, `sub` de `getJwtContext()` (jose4j verifica a assinatura antes das claims)
  - Arquivos: `audit/ExpiredSessionAuditor.java`
  - Criterios: 8
- [x] **T10** — `GET /audit` (paginado; `startDate`, `endDate`, `timeZone`, `user`, `type`, `action`, `screen`; inicial > final = 400) e `GET /audit/options`
  - Arquivos: `audit/AuditResource.java`, `AuditRecordResponse.java`, `AuditOptionsResponse.java`
  - Criterios: 10, 11, 15, 16, 17
- [x] **T11** — `POST /audit/screen-access` com `require(<tela>, VIEW)`; tela invalida = 400
  - Arquivos: `audit/AuditResource.java`, `ScreenAccessRequest.java`, `shared/InvalidFormatExceptionMapper.java`
  - Criterios: 9
- [x] **T12** — Teste das 12 escritas: registro, detalhe, sem senha/hash, 400/404/409 sem registro, rollback com `AuditWriter` falho (`QuarkusMock`), rotulo preservado apos excluir/renomear
  - Arquivos: `backend/src/test/.../audit/AuditChangeRecordingTest.java`
  - Criterios: 1, 2, 3, 4, 13
- [x] **T13** — Teste por reflexao dos `*Resource` de `target/classes`: todo `@POST/@PUT/@DELETE/@PATCH` tem `@Audited`, salvo lista (login, logout, screen-access); caso positivo prova que barra
  - Arquivos: `backend/src/test/.../audit/AuditCoverageTest.java`
  - Criterios: 5
- [x] **T14** — Teste de eventos: login ok/falha (e-mail existente e inexistente), logout, token assinado vencido (polling), 403, acesso a tela 200/403/400, "Impressão" nas opcoes
  - Arquivos: `backend/src/test/.../audit/AuditEventsTest.java`
  - Criterios: 6, 7, 8, 9, 10
- [x] **T15** — Teste de consulta e seguranca: ordem, paginacao, filtros, 400, sem periodo; 200/403 (com e sem linha)/401; super_admin oculto inclusive apagado; `PUT`/`DELETE /audit` 405; sem FK para `app_users`, linhas mantidas apos apagar usuario/categoria/perfil
  - Arquivos: `backend/src/test/.../audit/AuditResourceTest.java`, `AuditSecurityTest.java`
  - Criterios: 11, 12, 15, 16, 17
- [x] **T16** — Ajustar `/auth/me` para 8 telas e saneamento de `AUDIT` em Perfis
  - Arquivos: `AuthResourceTest.java`, `ProfileResourceTest.java`
  - Criterios: 14
- [x] **T17** — Tipos e service de auditoria no front
  - Arquivos: `core/models.ts`, `core/services/audit.service.ts`, `audit.service.spec.ts`
  - Criterios: 10, 16
- [x] **T18** — Ordem do menu e matriz de Perfis com Auditoria
  - Arquivos: `core/entry-route.ts`, `entry-route.spec.ts`, `features/profiles/profile-screens.ts`, `profile-form.spec.ts`
  - Criterios: 14, 18
- [x] **T19** — Rota `/audit` e item "Auditoria" no menu e no painel "Mais"
  - Arquivos: `app.routes.ts`, `main-layout.{ts,html}`, `main-layout.spec.ts`
  - Criterios: 18
- [x] **T20** — "Sair" chama `POST /auth/logout` antes de descartar o token; 401 do interceptor nao chama
  - Arquivos: `auth.service.ts`, `auth.service.spec.ts`, `main-layout.ts`, `main-layout.spec.ts`, `auth.interceptor.spec.ts`
  - Criterios: 7
- [x] **T21** — Rastreio de acesso a tela, spec das quatro situacoes
  - Arquivos: `core/screen-access-tracker.ts`, `screen-access-tracker.spec.ts`, `main-layout.ts`
  - Criterios: 9
- [x] **T22** — Tela Auditoria (`initial` hoje-30..hoje, `defaults` vazios, opcoes do back, `data-label`, sem acoes de escrita, Detalhe com campo/anterior/novo)
  - Arquivos: `features/audit/audit.{ts,html,scss}`, `core/formatters.ts`
  - Criterios: 10, 19, 20, 21
- [x] **T23** — Specs da tela e de `dateTimeLabel` (inclui tipo desconhecido exibido pelo rotulo)
  - Arquivos: `features/audit/audit.spec.ts`, `core/formatters.spec.ts`
  - Criterios: 10, 19
- [x] **T24** — Area "Auditoria" na Central; Visao geral e Perfis atualizados; 6 areas no teste (revisar com `.claude/skills/pipeline/revisar-textos/SKILL.md`)
  - Arquivos: `AuditAreaContent.java`, `DocumentationContent.java`, `OverviewContent.java`, `ProfilesAreaContent.java`, `DocumentationContentTest.java`
  - Criterios: 22
- [x] **T25** — Item em `versao_1_0_3()` (revisar com `.claude/skills/pipeline/revisar-textos/SKILL.md`)
  - Arquivos: `releasenotes/content/ReleaseNotesContent.java`
  - Criterios: 22
- [x] **T26** — Registrar o padrao em `knowledge/`
  - Arquivos: `knowledge/audit.md` (novo), `README.md`, `backend-patterns.md`, `auth-and-permissions.md`
  - Criterios: 23
- [x] **T27** — Varreduras de acentuacao e de cor; `./mvnw test` e `npm test` completos
  - Arquivos: —
  - Criterios: 21, 24

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | registro por escrita 2xx | T3, T5, T6, T7, T12 |
| 2 | detalhe por campo | T5, T6, T7, T12 |
| 3 | sem senha/hash | T7, T12 |
| 4 | recusa nao grava; mesma transacao | T4, T5, T12 |
| 5 | mecanismo unico + reflexao | T5, T13 |
| 6 | login / login com falha | T8, T14 |
| 7 | Sair -> logout no servidor | T8, T14, T20 |
| 8 | sessao expirada; acesso negado | T8, T9, T14 |
| 9 | acesso a tela | T11, T14, T21 |
| 10 | tipo novo sem migration; rotulos | T2, T3, T10, T14, T17, T22, T23 |
| 11 | sem manutencao | T10, T15 |
| 12 | exclusao/purge nao apagam | T1, T15 |
| 13 | rotulo do momento | T6, T12 |
| 14 | `AUDIT`, migration, Perfis, 8 telas | T1, T2, T16, T18 |
| 15 | 200/403/401 | T10, T15 |
| 16 | consulta e filtros | T4, T10, T15, T17 |
| 17 | super_admin oculto | T4, T10, T15 |
| 18 | rota, menu, Mais, entry-route | T18, T19 |
| 19 | 30 dias, colunas, Detalhe | T22, T23 |
| 20 | 390 px em cartoes | T22 |
| 21 | acentuacao; varreduras | T22, T27 |
| 22 | Central + Novidades | T24, T25 |
| 23 | knowledge | T26 |
| 24 | suites completas | T27 |

## Superficie de validacao

- Testes nomeados nas tarefas (T12-T16, T18-T23, T24). Front: Sair no menu e no "Mais" (`main-layout.spec`), 401 sem `/auth/logout` (`auth.interceptor.spec`).
- 14 — na stack: `select conname from pg_constraint where conrelid = 'profile_permissions'::regclass and contype = 'c';`.

## Validacao manual (etapa 7)

- 20 — `/audit` a 390 px: cartoes, sem rolagem horizontal; "Filtros" abre o painel inferior.
- 19 — hora no fuso do navegador confere com a acao; Detalhe por clique e teclado com campo/anterior/novo.
- 7, 9 — entrar, trocar de tela, abrir cadastro, paginar e Sair; conferir os eventos na Auditoria.
- 21 — textos da tela, opcoes e Detalhe acentuados.

## Riscos e pontos de atencao

- **Principal**: sessao expirada. `AuthenticationFailureEvent` chega na thread de I/O (JPA so em observador assincrono); se a causa nao trouxer o `InvalidJwtException`, alternativa e um `HttpAuthenticationMechanism` que delega ao do JWT. Teste assina com a chave privada local. Requisicoes paralelas com o token vencido geram um evento cada.
- `@Audited` dentro do `@Transactional` (prioridade numerica > 200); fora, falha da auditoria nao desfaz a operacao.
- Sem FK para `app_users` de proposito: com FK, os `@AfterEach` que apagam usuario de teste quebrariam e `hasRelatedRows` so desativaria conta semeada com auditoria (`knowledge/auth-and-permissions.md`).
- `POST /auth/logout` sem `require` (nao ha `Screen`), como `/auth/me`: excecao a registrar em `knowledge/`.
- Decisoes do plano: "Visualização" como acao de Acesso negado a `VIEW` e de Acesso a tela; Login/Logout/Sessao sem acao nem funcionalidade; troca so de senha = Alteracao sem campos; Categorias com "Situação" (Ativo/Inativo), Usuarios com "Ativo" (Sim/Não) pelo criterio 2.
- Banco de teste compartilhado: assercao por marcador proprio, nunca contagem global.
- Specs que montam `MainLayout` passam a ver `POST /audit/screen-access` e `/auth/logout`: ensinar os helpers de `main-layout.spec` primeiro.
- `OverviewContent` (Configurações, ordem do menu) e `ProfilesAreaContent` (linhas da matriz) ficam desmentidos sem T24; Novidades ganha item (T25).

## Lacunas

- Nenhuma.
