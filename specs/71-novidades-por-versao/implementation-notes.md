# Notas de implementacao

Branch: `feature/issue-71-novidades-por-versao` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 19 de 19 concluidas (ver `plan.md`)

## Arquivos alterados

### Backend
- `backend/src/main/java/br/com/financeos/profiles/Screen.java` — acrescenta `RELEASE_NOTES`.
- `backend/src/main/java/br/com/financeos/profiles/ProfileResource.java` — `VIEW_ONLY_SCREENS` (`DOCUMENTATION`, `RELEASE_NOTES`) generaliza o saneamento view-only.
- `backend/src/main/resources/db/migration/V14__add_release_notes_screen.sql` — novo; recria o check constraint e semeia `can_view=true` para os perfis existentes.
- `backend/src/main/java/br/com/financeos/releasenotes/{ReleaseNotesResource,ReleaseNotesResponse,ReleaseNoteVersion,ReleaseNoteCategory}.java` — novos; endpoint `GET /release-notes` com `accessControl.require(Screen.RELEASE_NOTES, Action.VIEW)`.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — novo; conteudo curado do bloco `1.0.2` (8 itens).
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — cita a 7a linha da matriz e a regra de view-only dela.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — bullet "Sobre" passa a citar as duas telas.
- `backend/src/test/java/br/com/financeos/releasenotes/{ReleaseNotesContentTest,ReleaseNotesResourceTest,ReleaseNotesSecurityTest}.java` — novos, no padrao de `Documentation*Test`.
- `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java` — casos `shouldForceReleaseNotesPermissionToViewOnlyOnCreate/Update`.
- `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java` — `hasSize(6)` -> `hasSize(7)` + `hasItem("RELEASE_NOTES")`.

### Frontend
- `frontend/src/app/core/models.ts` — `Screen` +`'RELEASE_NOTES'`; tipos `ReleaseNoteCategoryKind/Category/Version`, `ReleaseNotesResponse`.
- `frontend/src/app/core/services/release-notes.service.ts` (+ `.spec.ts`) — novo, mesmo formato de `documentation.service.ts`.
- `frontend/src/app/core/entry-route.ts` (+ `.spec.ts`) — `RELEASE_NOTES -> /release-notes` apos `DOCUMENTATION`.
- `frontend/src/app/app.routes.ts` — rota `release-notes` com `permissionGuard('RELEASE_NOTES','VIEW')`.
- `frontend/src/app/layout/main-layout/{main-layout.html,main-layout.ts,main-layout.spec.ts}` — subitem "Novidades por versão" no grupo Sobre; `canSeeAbout()`/`isAboutActive()` passam a considerar as duas telas.
- `frontend/src/app/features/release-notes/{release-notes.ts,release-notes.html,release-notes.scss,release-notes.spec.ts}` — novos; um `.panel`/`.panel-heading` por versao, categorias so quando ha item, rotulo "atual" reaproveitando o `span` de `.panel-heading`.
- `frontend/src/app/features/profiles/{profiles.ts,profiles.spec.ts}` — `SCREENS` +`RELEASE_NOTES` (`viewOnly: true`); `SCREEN_ROWS`/contagens de 6->7 linhas e 21->22 checkboxes (duas ocorrências do total de checkboxes no spec, não só a apontada no plano).

## Decisões

- Rótulo "atual": backend deriva `currentVersion` de `quarkus.application.version` removendo o sufixo a partir do primeiro `-` (mesma fonte do `GET /api/health`, sem constante paralela); o frontend só compara `version === currentVersion` por igualdade de string, sem fallback — decisão já registrada no plano (risco aceito, sem versão com build divergente hoje).
- Ícone do subitem "Novidades por versão" no menu: usei um sino (`bell`) de contorno, no mesmo padrão de traço/tamanho (20px, `stroke-width 1.8`) dos demais itens, para diferenciar visualmente do ícone de documento já usado por "Documentação".
- Reaproveitei `.panel-heading` (título + `span` mudo à direita) para o rótulo "atual" em vez de criar uma classe nova: já é o padrão existente para um rótulo discreto ao lado de um título de painel.

## Tabela de rastreabilidade (afirmação → origem), bloco 1.0.2

| # | Categoria | Afirmação exibida | Origem |
|---|---|---|---|
| 1 | Novidades | Nova área "Novidades por versão", no menu Sobre, reunindo o que muda em cada versão. | issue #71 (esta entrega) |
| 2 | Novidades | Central de Documentação: manual do sistema dentro do próprio FinanceOS, no menu Sobre. | issue #70 |
| 3 | Novidades | Uso completo pelo celular: menu em gaveta, tabelas em cartão, campos maiores para toque. | issue #54 |
| 4 | Novidades | Publicar o FinanceOS na internet com endereço próprio (HTTPS automático) ou pela rede privada do Tailscale, sem custo de hospedagem. | `knowledge/deployment.md` (ambiente de produção externo) |
| 5 | Melhorias | Painel Resumo: saudação personalizada com o seu nome, conforme o horário do dia. | issue #65 |
| 6 | Melhorias | Período do Resumo: mês por extenso; ano e mês só listam datas com lançamentos existentes. | issue #69 |
| 7 | Melhorias | Mais segurança nas contas ao publicar na internet: administrador com nome fixo, contas de teste removidas do ambiente publicado. | `knowledge/auth-and-permissions.md` (`ProductionBootstrap`); issues #64/#66 |
| 8 | Correções | Contraste da borda dos campos de formulário corrigido, visível sob luz forte ou baixa visão. | issue #58 |

## Desvios em relação ao plano

- `profiles.spec.ts` tinha uma segunda asserção de `checkboxes().toHaveLength(21)` (linha 161, teste "limpa o nome e toda a matriz de permissoes em modo de criacao") não listada em T18/T7 do plano; ajustada para 22 junto com a contagem já prevista — mesmo motivo (enum `Screen` maior).
- Fora isso, nenhum desvio: as 19 tarefas foram implementadas como planejadas.
