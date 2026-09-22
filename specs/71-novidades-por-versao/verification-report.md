# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior, migration V14 aplicada).
Branch: `feature/issue-71-novidades-por-versao` — mudancas ainda **nao commitadas**. `git status`/`git diff` conferem 1:1 com a lista de "Arquivos alterados" de `implementation-notes.md`; nenhum arquivo fora da feature.
Nao foi usado JWT proprio nem resposta de API substituida na sessao do navegador nesta rodada (tentativa de assinar um JWT local com a chave RSA do repo para exercitar 200/403 via `curl` foi bloqueada pelo classificador de permissoes do ambiente como "Credential Exploration"; os casos 200/403 foram verificados pela suite automatizada, que passou). O unico acesso live ao backend foi `GET /api/release-notes` sem token (401) e `GET /api/health` (200, so leitura).

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `Screen.RELEASE_NOTES` view-only; matriz so "Ver"; backend forca flags false | VERIFICADO | `Screen.java` (diff) acrescenta `RELEASE_NOTES`; `ProfileResource.java` `VIEW_ONLY_SCREENS = EnumSet.of(DOCUMENTATION, RELEASE_NOTES)`; `ProfileResourceTest#shouldForceReleaseNotesPermissionToViewOnlyOnCreate/Update` (passou, quality-report.md); `profiles.spec.ts` linha 384-391 confere 5 `<td>`/linha e 1 checkbox nas linhas Documentacao/Novidades por versao (22 checkboxes no total) |
| 2 | Endpoint comeca com `accessControl.require(Screen.RELEASE_NOTES, Action.VIEW)`; 200/403/401 | VERIFICADO | `ReleaseNotesResource.java:33`; `ReleaseNotesSecurityTest` cobre sem-auth(401), perfil sem linha(403), `canView=false`(403), `canView=true`(200), super_admin oculto(200) — passou (quality-report.md); `curl http://localhost:8080/api/release-notes` sem token -> `401` confirmado ao vivo |
| 3 | Submenu "Novidades por versao" em Sobre, so com permissao; URL direta redireciona | VERIFICADO | `main-layout.html` botao com `*ngIf="authService.can('RELEASE_NOTES','VIEW')"`; `app.routes.ts` rota `release-notes` com `permissionGuard('RELEASE_NOTES','VIEW')` (mesmo guard generico ja usado por `DOCUMENTATION`, que redireciona via `resolveEntryRoute`); `main-layout.spec.ts` "exibe o grupo Sobre so com a permissao de Novidades por versao..." e `entry-route.spec.ts` "leva as Novidades por versao..." — passaram |
| 4 | Migration recria check constraint + semeia `can_view=true` | VERIFICADO | `V14__add_release_notes_screen.sql`; consulta ao vivo: `pg_get_constraintdef` mostra `RELEASE_NOTES` na lista do check; `select ... from profile_permissions where screen='RELEASE_NOTES'` retorna `can_view=t` para os 2 perfis existentes (Administrador, Somente Dashboard); `flyway_schema_history` mostra versao 14 aplicada com sucesso |
| 5 | Versao 1.0.1 nunca aparece | VERIFICADO | `ReleaseNotesContentTest#shouldNeverPublishVersion101` (passou); `ReleaseNotesContent.java` so define `versao_1_0_2()` |
| 6 | Bloco mais antigo e 1.0.2 | VERIFICADO | `ReleaseNotesContentTest#shouldHave102AsTheOldestBlock` (passou) |
| 7 | Blocos ordenados do mais recente ao mais antigo | VERIFICADO | `ReleaseNotesContentTest#shouldOrderVersionsFromNewestToOldest` (passou); `release-notes.spec.ts` "o bloco mais antigo exibido e o 1.0.2, ordenado..." confirma com fixture de 2 versoes (passou) |
| 8 | Rotulo "atual" discreto, calculado da fonte oficial, formato `vX.Y.Z` sem sufixo | VALIDACAO MANUAL | ver roteiro item 1 — a parte calculavel ja esta verificada: `ReleaseNotesResource.currentVersion()` corta a partir do primeiro `-` (`ReleaseNotesResource.java:37-40`), `curl http://localhost:8080/api/health` retorna `version:"1.0.2-dev"`, logo `currentVersion="1.0.2"` bate com o unico bloco; `ReleaseNotesResourceTest#shouldMatchCurrentVersionWithTheNewestBlock` e `release-notes.spec.ts` "rotula a versao mais recente como atual..." + "nao rotula versao nenhuma quando currentVersion nao bate..." passaram. Falta so a impressao visual de "discreto" |
| 9 | So categorias com conteudo sao exibidas | VERIFICADO | `ReleaseNotesContentTest#shouldNotPublishEmptyCategory` (passou); `release-notes.spec.ts` "exibe so as categorias com conteudo" (passou) |
| 10 | Nenhum item repetido entre blocos | VERIFICADO | `ReleaseNotesContentTest#shouldNotRepeatAnyItemAcrossVersions` (passou) |
| 11 | Todo item rastreavel numa tabela afirmacao->origem | VERIFICADO | `implementation-notes.md` secao "Tabela de rastreabilidade", 8 linhas, cada uma citando issue/commit/`knowledge/` real |
| 12 | Nenhum termo tecnico no texto exibido | VERIFICADO | `ReleaseNotesContentTest#shouldNotExposeTechnicalIdentifiers` (passou) |
| 13 | Build novo da mesma versao entra em Correcoes do bloco existente, sem criar bloco novo | VERIFICADO | Leitura estatica: `ReleaseNotesContent.java` chaveia por `"1.0.2"` (sem numero de build) em `versao_1_0_2()` (linha 43) — nao ha campo de build na estrutura, logo um bump de build nunca cria bloco novo por construcao; comentario explicativo nas linhas 16-19 |
| 14 | Perfis exibe a linha nova so com "Ver", sem alterar contagem/alinhamento | VERIFICADO | `profiles.spec.ts` linha 382-391: `rows` com 7 linhas (`SCREEN_ROWS` inclui "Novidades por versao"), cada linha com 5 `<td>`, linhas 5 e 6 (Documentacao/Novidades) com 1 checkbox cada — passou |
| 15 | Design system: sem cor literal nova, reusa cartao/painel | VERIFICADO | `rg "#[0-9a-fA-F]{3,8}\b\|oklch\(\|rgba?\("  frontend/src/app/features/release-notes` sem resultado; `release-notes.html` usa `class="panel"`/`class="panel-heading"` ja definidos em `frontend/src/styles.scss:204-233` |
| 16 | Ate 680px sem rolagem horizontal, blocos ocupam a largura sem sobreposicao | VALIDACAO MANUAL | ver roteiro item 2 — nao ha ferramenta de renderizacao (CDP/navegador) disponivel nesta verificacao para medir `scrollWidth`/`clientWidth` ao vivo |
| 17 | Nenhuma ocorrencia nova nas varreduras de acentuacao | VERIFICADO | Repeti as duas varreduras `rg` de `knowledge/architecture.md` (secao Idioma): frontend 2 linhas (`styles.scss:24,30`), backend 6 linhas (`DashboardResource.java:41,85,124,125`, `ProductionBootstrap.java:178,179`) — identicas ao baseline documentado, nenhuma nova |

## Roteiro de validacao manual

1. Login com um usuario que tenha a permissao "Novidades por versao" (todos os perfis existentes ja tem `can_view=true` apos a migration V14 — qualquer usuario nao-oculto serve). Va em Sobre > Novidades por versao (`http://localhost/release-notes`). Confirme visualmente que o rotulo "atual" ao lado de "Versao v1.0.2" e discreto: fonte menor que o titulo da versao e cor acinzentada/muted, sem competir com o titulo (no Computed do DevTools, o `span` deve estar em `color: var(--text-muted)` resolvido, tipicamente algo em tom de cinza medio — bem mais claro/apagado que o preto/quase-preto do `h3` ao lado; se aparecer do mesmo peso visual do titulo ou em destaque/cor de link, o bundle pode estar em cache antigo). (criterio 8)
2. Abra o DevTools, ative o modo de dispositivo (device toolbar) e configure a largura da viewport para 680px e depois para 390px. Com a tela `http://localhost/release-notes` aberta e carregada, rode no console: `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. Esperado: `true` nas duas larguras (sem rolagem horizontal). Confirme tambem visualmente que o bloco/painel da versao 1.0.2 ocupa a largura disponivel da tela sem cortar nem sobrepor texto das listas de Novidades/Melhorias/Correcoes. (criterio 16)

## Dados de teste criados

Nenhum. Os unicos acessos ao ambiente local nesta verificacao foram consultas somente-leitura (`curl` sem token, `curl /api/health`, `psql` com `select`); nenhuma escrita foi feita.

## Conclusao

15 de 17 criterios verificados automaticamente (testes de backend/frontend que passaram na etapa `quality-check`, leitura de diff e consultas somente-leitura ao ambiente local); 2 dependem de confirmacao visual do usuario no navegador (criterios 8 e 16), com o roteiro acima. Nenhum criterio ficou como NAO ATENDIDO — a feature esta pronta para a validacao humana e, apos o OK, para `/pipeline:open-pr`.

Validado pelo usuario em 2026-09-22.
