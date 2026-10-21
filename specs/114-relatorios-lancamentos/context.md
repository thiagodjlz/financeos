# Briefing — issue 114

## Regras que restringem esta mudanca

- Tela nova = valor no `Screen` com `label()` + migration que recria `profile_permissions_screen_check` com a lista completa e semeia com `insert ... select ... on conflict on constraint profile_permissions_profile_screen_uk do nothing`, sem `update` (modelo `V13`/`V17`); confirmar o nome em `pg_constraint` antes do `drop` (`knowledge/auth-and-permissions.md`, `knowledge/architecture.md`).
- Endpoint comeca com `accessControl.require(Screen.X, Action.Y)`, antes de ler parametro (403 vence 400); 403 = "Você não tem permissão para realizar esta ação."; `super_admin` ignora perfil (`knowledge/auth-and-permissions.md`, `knowledge/backend-patterns.md`).
- Lancamento e escopado pelo `userId` logado; receita tem `status = null`; filtro `status` exclui receita (`knowledge/transactions.md`).
- Saldo = receitas − despesas `PAID` (pendente fora); acumulado desde out/2026; `DashboardRepository.balanceBetween(userId, inicio, fim)` ja calcula isso (`knowledge/dashboard.md`).
- "Agora" vem de bean `@ApplicationScoped` trocado no teste por `QuarkusMock.installMockForType` (precedente `dashboard/CurrentMonth`), nunca `now()` no `Resource` (`knowledge/backend-patterns.md`, `knowledge/testing.md`).
- Query lida crua do `UriInfo` via `ListParams` (vazio = ausente, malformado = 400 em portugues); mensagem de `WebApplicationException` vira texto de tela; DTO com `message` acentuada em cada anotacao; campo novo precisa de rotulo em `FieldLabels` (`knowledge/backend-patterns.md`).
- Escrita leva `@Audited` + `AuditTrail.created/updated/deleted(screen, id, rotulo, AuditValues)` apos as validacoes; quem grava evento entra em `EVENT_ENDPOINTS` do `AuditCoverageTest`; `PRINT` ("Impressão") existe sem emissor; evento por `AuditWriter.writeEvent` (`knowledge/audit.md`).
- Menu: secao sem `Screen`, `*ngIf` por item com `can(screen,'VIEW')`, no menu e no painel "Mais"; a ordem vive so em `ENTRY_ROUTES` de `core/entry-route.ts`, que tambem resolve `screenForUrl` (primeiro segmento) do "Acesso à tela" (`knowledge/auth-and-permissions.md`, `knowledge/audit.md`).
- `VIEW` de uma tela nao depende de outra: filtro que usa `/categories/options` some sem `CATEGORIES/VIEW` ou com 403, sem toast (`knowledge/frontend-ui.md`).
- Ate 680px `styles.scss` vira toda `table` cartao; excecao nasce como regra global, nunca media query por tela (`knowledge/frontend-ui.md`).
- Feedback: escrita 2xx = Sucesso; 400/403/409 = Alerta por `toast.fromHttpError`; 5xx/rede = Falha; trio `.loading-state`/`.load-error`/`.empty-state`; exclusao confirma no `core/confirm-dialog` `destructive` (`knowledge/frontend-ui.md`).
- FK para `app_users` e `on delete cascade` (`hasRelatedRows` acha tabela nova sozinho); exclusao e soft delete salvo excecao declarada (`knowledge/auth-and-permissions.md`, `knowledge/architecture.md`).
- Central: area = `documentation/content/<Area>Content.java` + uma linha em `DocumentationContent.build()`; `DocumentationContentTest` fixa quantidade/titulos e hoje **proibe "Relatórios"** em titulo; sem enum no texto; paragrafo <= 600; revisao por `.claude/skills/pipeline/revisar-textos/SKILL.md`; commit com `FINANCEOS_TEXTOS_REVISADOS=1`. Novidades: item no bloco `1.0.3` (`knowledge/documentation.md`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../profiles/Screen.java` | 8 telas | + `TRANSACTION_REPORTS` |
| `backend/.../db/migration/V18__...sql` | — | check, seed, tabelas |
| `backend/.../reports/*` | — | relatorio + preferencias |
| `backend/.../audit/AuditResource.java` | `screen-access` | + `POST /audit/print` |
| `backend/.../shared/ListParams.java`, `FieldLabels.java` | helpers, rotulos | multi-valor/decimal, rotulos |
| `backend/.../documentation/content/*`, `ReleaseNotesContent.java` | 6 areas; bloco 1.0.3 | area, menu, item |
| `frontend/.../app.routes.ts`, `core/entry-route.ts`, `layout/main-layout/*` | rotas/menu | secao "Relatórios" |
| `frontend/.../features/profiles/profile-screens.ts` | matriz | linha nova |
| `frontend/.../features/transaction-reports/*` | — | tela nova |
| `frontend/src/styles.scss` | cartao ate 680 | tabela rolavel, `@media print` |

## Convencoes aplicaveis

- So `styles.scss` tem cor literal; deve sair vazia: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` (`knowledge/frontend-ui.md`).
- Varreduras de idioma devem sair vazias (`knowledge/architecture.md`, "Idioma"); `id`/identificador `.java` com `lancamento`/`periodo` em minuscula casa a do backend — use ingles:
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Teste 401/403 em classe sem `@TestSecurity` de classe, usuario/perfil de UUID constante por SQL nativo, removidos no `@AfterEach`; soma exata nao pode depender de dado de outras classes (`knowledge/testing.md`).
- Front: requisicao nova no `ngOnInit` exige ensinar os helpers do spec; caso na ordem desfavoravel e sem a permissao do catalogo; jsdom nao aplica CSS (`knowledge/testing.md`).

## Consultas fora do briefing

Nenhuma ate agora.
