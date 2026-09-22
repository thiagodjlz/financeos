# Plano de implementacao

## Abordagem

Replicar o padrao da Central de Documentacao (issue #70): `Screen` so de visualizacao, pacote de backend com um unico `GET` protegido por `accessControl.require`, conteudo tipado escrito a mao em `content/`, tela Angular com uma unica requisicao por vida do componente. O contrato muda para lista de versoes com categorias Novidades/Melhorias/Correcoes, e o rotulo "atual" vem do mesmo `quarkus.application.version` de `GET /api/health`. So existe `v1.0.1` ja cortada e nada foi cortado depois, entao o conteudo desta entrega e um **unico bloco**, `1.0.2`, com os oito itens curados em `context.md`.

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/profiles/Screen.java` — acrescenta `RELEASE_NOTES`.
- `backend/src/main/java/br/com/financeos/profiles/ProfileResource.java` — generaliza `savePermissions` para tratar `DOCUMENTATION` e `RELEASE_NOTES` como view-only (ex.: `EnumSet<Screen> VIEW_ONLY_SCREENS`).
- `backend/src/main/java/br/com/financeos/releasenotes/ReleaseNotesResource.java` (novo) — `@Path("/release-notes")`, `@GET` com `accessControl.require(Screen.RELEASE_NOTES, Action.VIEW)`; le `quarkus.application.version` (mesmo `@ConfigProperty` do `HealthResource`), `currentVersion` sem sufixo de build.
- `backend/src/main/java/br/com/financeos/releasenotes/ReleaseNotesResponse.java` (novo) — `record ReleaseNotesResponse(String currentVersion, List<ReleaseNoteVersion> versions)`.
- `backend/src/main/java/br/com/financeos/releasenotes/ReleaseNoteVersion.java` (novo) — `record ReleaseNoteVersion(String version, List<ReleaseNoteCategory> categories)`.
- `backend/src/main/java/br/com/financeos/releasenotes/ReleaseNoteCategory.java` (novo) — `record ReleaseNoteCategory(Kind kind, List<String> items)` com `enum Kind { NEW, IMPROVEMENT, FIX }`.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` (novo) — `build()` devolve `List.of(versao_1_0_2())` com os 8 itens curados (4 Novidades, 3 Melhorias, 1 Correcao); helper `category(Kind, String...)` so entra na lista se houver item; comentario citando a regra do build-bump (criterio 13).
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — `campos()` cita "Novidades por versao" na lista de linhas da matriz; `regras()` ganha a mesma frase de view-only ja usada para Documentacao.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — bullet "Sobre" de `navegacao()` cita as duas telas do grupo.

### Frontend
- `frontend/src/app/core/models.ts` — `Screen` ganha `'RELEASE_NOTES'`; novos tipos `ReleaseNoteCategoryKind`, `ReleaseNoteCategory`, `ReleaseNoteVersion`, `ReleaseNotesResponse`.
- `frontend/src/app/core/services/release-notes.service.ts` (novo) — mesmo formato de `documentation.service.ts`: signal `content`, `load()` fazendo `GET ${API_BASE}/release-notes` uma unica vez.
- `frontend/src/app/core/entry-route.ts` — `ENTRY_ROUTES` ganha `{ screen: 'RELEASE_NOTES', path: '/release-notes' }`, apos `DOCUMENTATION`.
- `frontend/src/app/app.routes.ts` — rota `release-notes` com `canActivate: [permissionGuard('RELEASE_NOTES', 'VIEW')]`, carregando o componente novo.
- `frontend/src/app/layout/main-layout/main-layout.html` — novo botao dentro de `.nav-children` do grupo Sobre, `*ngIf="authService.can('RELEASE_NOTES', 'VIEW')"`, `routerLink="/release-notes"`, SVG de 20px no padrao dos demais itens, rotulo "Novidades por versao".
- `frontend/src/app/layout/main-layout/main-layout.ts` — `canSeeAbout()` passa a `can('DOCUMENTATION','VIEW') || can('RELEASE_NOTES','VIEW')`; `isAboutActive()` passa a considerar tambem `router.url.startsWith('/release-notes')`.
- `frontend/src/app/features/release-notes/release-notes.ts` / `.html` / `.scss` (novo) — carrega o conteudo uma vez, renderiza `versions` (ja ordenado pelo backend), um `.panel` por versao com as categorias presentes (`NEW`->"Novidades", `IMPROVEMENT`->"Melhorias", `FIX`->"Correcoes"), rotulo discreto "atual" no bloco cuja `version` bate com `currentVersion`.
- `frontend/src/app/features/profiles/profiles.ts` — `SCREENS` ganha `{ code: 'RELEASE_NOTES', label: 'Novidades por versao', viewOnly: true }`.

### Migration
- `backend/src/main/resources/db/migration/V14__add_release_notes_screen.sql` — dropa e recria `profile_permissions_screen_check` com a lista completa (`DASHBOARD, TRANSACTIONS, CATEGORIES, USERS, PROFILES, DOCUMENTATION, RELEASE_NOTES`) e semeia `can_view=true` para todos os perfis existentes (`insert ... on conflict on constraint profile_permissions_profile_screen_uk do nothing`), no molde exato da `V13__add_documentation_screen.sql` (proximo numero livre: V14).

## Tarefas

- [x] **T1** — Acrescentar `RELEASE_NOTES` ao enum `Screen`.
  - Arquivos: `backend/src/main/java/br/com/financeos/profiles/Screen.java`
  - Criterios: 1
- [x] **T2** — Criar a migration que recria o check constraint e semeia `can_view=true`.
  - Arquivos: `backend/src/main/resources/db/migration/V14__add_release_notes_screen.sql`
  - Criterios: 4
- [x] **T3** — Criar o pacote `releasenotes` (records + `ReleaseNotesResource`) com `accessControl.require` e `currentVersion` derivado de `quarkus.application.version`.
  - Arquivos: `backend/src/main/java/br/com/financeos/releasenotes/{ReleaseNotesResource,ReleaseNotesResponse,ReleaseNoteVersion,ReleaseNoteCategory}.java`
  - Criterios: 2, 8
- [x] **T4** — Escrever o conteudo curado do bloco `1.0.2` (8 itens, 3 categorias, sem categoria vazia).
  - Arquivos: `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java`
  - Criterios: 5, 6, 7, 9, 10, 11, 12, 13
- [x] **T5** — Generalizar `ProfileResource.savePermissions` para tratar `RELEASE_NOTES` como view-only.
  - Arquivos: `backend/src/main/java/br/com/financeos/profiles/ProfileResource.java`
  - Criterios: 1
- [x] **T6** — Testes de backend do conteudo/endpoint/seguranca (`ReleaseNotesContentTest`, `ReleaseNotesResourceTest`, `ReleaseNotesSecurityTest`), no padrao de `Documentation*Test`.
  - Arquivos: `backend/src/test/java/br/com/financeos/releasenotes/{ReleaseNotesContentTest,ReleaseNotesResourceTest,ReleaseNotesSecurityTest}.java`
  - Criterios: 2, 5, 6, 7, 8, 9, 10, 12
- [x] **T7** — Estender `ProfileResourceTest` com os casos `shouldForceReleaseNotesPermissionToViewOnlyOnCreate/Update`, no padrao dos de `DOCUMENTATION`.
  - Arquivos: `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java`
  - Criterios: 1
- [x] **T8** — Corrigir `AuthResourceTest` para `hasSize(7)` (consumidor do enum `Screen` maior, ver `knowledge/auth-and-permissions.md`).
  - Arquivos: `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java`
  - Criterios: — (consumidor existente atingido pelo criterio 1)
- [x] **T9** — Atualizar a Central de Documentacao (area Perfis e bullet "Sobre") para citar a linha/tela nova.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/{ProfilesAreaContent,OverviewContent}.java`
  - Criterios: — (consistencia da Central, `knowledge/documentation.md`)
- [x] **T10** — Acrescentar `'RELEASE_NOTES'` a `Screen` e os tipos de release notes em `models.ts`.
  - Arquivos: `frontend/src/app/core/models.ts`
  - Criterios: — (infraestrutura para T11-T18)
- [x] **T11** — Criar `release-notes.service.ts` (uma `GET` por vida do app, signal de conteudo).
  - Arquivos: `frontend/src/app/core/services/release-notes.service.ts`
  - Criterios: 2
- [x] **T12** — Acrescentar `RELEASE_NOTES` a `ENTRY_ROUTES`.
  - Arquivos: `frontend/src/app/core/entry-route.ts`
  - Criterios: 3
- [x] **T13** — Acrescentar a rota `release-notes` protegida por `permissionGuard`.
  - Arquivos: `frontend/src/app/app.routes.ts`
  - Criterios: 3
- [x] **T14** — Acrescentar o subitem "Novidades por versao" ao grupo Sobre e estender `canSeeAbout()`/`isAboutActive()`.
  - Arquivos: `frontend/src/app/layout/main-layout/{main-layout.html,main-layout.ts}`
  - Criterios: 3
- [x] **T15** — Criar o componente da tela (lista de versoes, categorias so quando ha item, rotulo "atual" no bloco corrente).
  - Arquivos: `frontend/src/app/features/release-notes/{release-notes.ts,release-notes.html,release-notes.scss}`
  - Criterios: 6, 7, 8, 9, 15, 16
- [x] **T16** — Acrescentar `RELEASE_NOTES` a `SCREENS` em Perfis (`viewOnly: true`).
  - Arquivos: `frontend/src/app/features/profiles/profiles.ts`
  - Criterios: 1, 14
- [x] **T17** — Testes de frontend do servico e do componente novos (carga unica, ordenacao, omissao de categoria vazia via fixture, rotulo "atual").
  - Arquivos: `frontend/src/app/core/services/release-notes.service.spec.ts`, `frontend/src/app/features/release-notes/release-notes.spec.ts`
  - Criterios: 2, 3, 6, 7, 8, 9
- [x] **T18** — Atualizar os testes de frontend atingidos pelo enum maior e pela tela nova: `SCREEN_ROWS`/`toHaveLength` em `profiles.spec.ts`; caso novo de visibilidade do subitem em `main-layout.spec.ts`; entrada `RELEASE_NOTES` em `entry-route.spec.ts`.
  - Arquivos: `frontend/src/app/features/profiles/profiles.spec.ts`, `frontend/src/app/layout/main-layout/main-layout.spec.ts`, `frontend/src/app/core/entry-route.spec.ts`
  - Criterios: 1, 3, 14
- [x] **T19** — Escrever a tabela de rastreabilidade afirmacao -> origem, no padrao da issue #70.
  - Arquivos: `specs/71-novidades-por-versao/implementation-notes.md`
  - Criterios: 11

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | `Screen` view-only; matriz so "Ver"; backend forca flags false | T1, T5, T7, T16, T18 |
| 2 | Endpoint com `accessControl.require`; 200/403/401 | T3, T6, T11, T17 |
| 3 | Submenu em Sobre, visivel so com permissao; URL direta redireciona | T12, T13, T14, T17, T18 |
| 4 | Migration recria check + semeia `can_view=true` | T2 |
| 5 | v1.0.1 nunca aparece | T4, T6 |
| 6 | Bloco mais antigo e 1.0.2 | T4, T6, T15, T17 |
| 7 | Blocos ordenados do mais recente ao mais antigo | T4, T6, T15, T17 |
| 8 | Rotulo "atual" calculado da fonte da versao, formato vX.Y.Z | T3, T6, T15, T17 |
| 9 | So categorias com conteudo sao exibidas | T4, T6, T15, T17 |
| 10 | Nenhum item repetido entre blocos | T4, T6 |
| 11 | Todo item rastreavel numa tabela afirmacao->origem | T4, T19 |
| 12 | Nenhum termo tecnico no texto exibido | T4, T6 |
| 13 | Build novo da mesma versao entra em Correcoes do bloco existente | T4, T6 |
| 14 | Perfis exibe a linha nova so com "Ver", sem alterar contagem/alinhamento | T16, T18 |
| 15 | Design system: sem cor literal nova, reusa cartao/painel | T15 |
| 16 | Ate 680px sem rolagem horizontal, blocos ocupam a largura | T15 |
| 17 | Nenhuma ocorrencia nova nas varreduras de acentuacao | T4, T15 |

## Superficie de validacao

- Criterio 1 — `ProfileResourceTest#shouldForceReleaseNotesPermissionToViewOnlyOnCreate/Update` (T7); Perfis mostra so "Ver" habilitado na linha nova.
- Criterio 2 — `ReleaseNotesSecurityTest` (sem auth, sem linha, `canView=false`, `canView=true`, super admin), no padrao de `DocumentationSecurityTest`.
- Criterio 3 — `main-layout.spec.ts` (subitem some/aparece com `RELEASE_NOTES/VIEW`); `GET /api/release-notes` sem token -> 401; navegacao direta a `/release-notes` sem permissao -> redirect via `resolveEntryRoute`.
- Criterio 4 — `select conname from pg_constraint where conrelid='profile_permissions'::regclass and contype='c'` mostra `RELEASE_NOTES`; `select can_view from profile_permissions where screen='RELEASE_NOTES'` -> todas `true` apos `docker compose up -d --build`.
- Criterios 5, 6, 7, 9, 10, 12, 13 — `ReleaseNotesContentTest` (sem `1.0.1`, unico bloco `1.0.2`, nenhuma categoria vazia, nenhum item duplicado, nenhum identificador tecnico).
- Criterio 8 — `ReleaseNotesResourceTest` valida `currentVersion` em `X.Y.Z` (sem sufixo) igual ao `version` do bloco mais recente; `release-notes.spec.ts` confere o rotulo "atual" nesse bloco.
- Criterio 11 — `specs/71-novidades-por-versao/implementation-notes.md` (T19), uma linha por item de `context.md`.
- Criterio 14 — `profiles.spec.ts` (`SCREEN_ROWS` com 7 rotulos; linha nova com 3 `<td>` vazios sem `data-label`; `rows` com 5 `<td>` cada).
- Criterio 17 — repetir as duas varreduras `rg` de acentuacao (`knowledge/architecture.md`, Idioma) apos a implementacao; comparar contra o baseline (2 linhas frontend, 6 backend, nenhuma nova).

## Validacao manual (etapa 7)

- Criterio 8 — o rotulo "atual" e visualmente discreto (nao compete com o titulo da versao); abrir `/release-notes` e confirmar no navegador.
- Criterio 15 — reutilizacao visual do `.panel`/`.page-title` e ausencia de cor fora do padrao: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app/features/release-notes` deve sair vazio (checagem automatizavel, mas a impressao visual final e conferida na tela).
- Criterio 16 — DevTools em 680px e 390px: `document.documentElement.scrollWidth` nao excede `clientWidth`, blocos de versao ocupam a largura sem sobrepor texto, categorias legiveis com o teclado virtual fechado.

## Riscos e pontos de atencao

- `RELEASE_NOTES` novo no enum `Screen` aumenta as listas dinamicas ja existentes (`effectivePermissions`, `resolvePermissions`) e quebra testes que fixam a contagem anterior: `AuthResourceTest` (`hasSize(6)`, T8) e `profiles.spec.ts` (`SCREEN_ROWS`/`toHaveLength(6)`, T18) — mesmo padrao de "inventario de consumidores" da issue #45. Rodar a suite completa, nao so as classes tocadas.
- `ProfilesAreaContent.java`/`OverviewContent.java` descrevem hoje 6 telas / 1 tela em "Sobre" (`knowledge/documentation.md`): sem T9 a Central fica desatualizada assim que a tela nova existir, sem nenhum teste acusar.
- O rotulo "atual" depende de `currentVersion` bater com `version` do bloco mais recente por igualdade de string (ambos `X.Y.Z`); se a curadoria atrasar um bump, nenhum bloco leva o rotulo — aceitavel (sem criterio de fallback), mas vale comentar no codigo o motivo da comparacao.

## Lacunas

Nenhuma.
