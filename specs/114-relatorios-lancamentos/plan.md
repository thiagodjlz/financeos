# Plano de implementacao

## Abordagem

Pacote novo `backend/.../reports/` com `GET /transaction-reports` (so leitura, filtros e agrupamentos por query; GET para nao cair no `AuditCoverageTest`) e o CRUD `/transaction-reports/preferences`, os dois validando pelo mesmo `TransactionReportCriteria`. Grupos, subtotais, rotulos e ordem nascem no back (`TransactionReportBuilder`); Saldo atual reusa `DashboardRepository.balanceBetween(user, 2026-10-01, hoje)` com `CurrentDate` (bean novo, mockavel). A tela `features/transaction-reports` monta filtros, agrupamentos e colunas, gera ao abrir (preferencia padrao ou DD1/DD5 sem filtros), so exibe valores da API e imprime pelo navegador.

## Arquivos a alterar

### Backend (`backend/src/main/java/br/com/financeos/`)
- `profiles/Screen.java` — `TRANSACTION_REPORTS("Relatórios - Lançamentos")`, fora de `VIEW_ONLY_SCREENS`.
- `reports/` (novo) — classes listadas em T2–T8; enums com `label()`: `ReportPeriod` (CURRENT_MONTH, PREVIOUS_MONTH, CURRENT_YEAR, PREVIOUS_YEAR, CUSTOM), `ReportGrouping` (CATEGORY, TYPE, STATUS, SOURCE, DAY, MONTH, YEAR), `ReportColumn` (DD5), `InstallmentFilter` (ALL, INSTALLMENT, SINGLE); preferencia com `@ElementCollection Set<UUID> categoryIds`.
- `shared/ListParams.java` — `enumValues`, `uuids`, `decimal` (aditivos); `shared/FieldLabels.java` — rotulos dos campos novos.
- `audit/AuditResource.java` — `POST /audit/print`.
- `documentation/content/` — `TransactionReportsAreaContent.java` (novo), `DocumentationContent.java`, `OverviewContent.java`; `releasenotes/content/ReleaseNotesContent.java`.

### Frontend (`frontend/src/`)
- `app/core/models.ts`, `app/core/formatters.ts` (`transactionTypeLabel`, `transactionSourceLabel`), `app/core/services/transaction-report.service.ts` (novo), `app/core/services/audit.service.ts` (`print`).
- `app/app.routes.ts`, `app/core/entry-route.ts`, `app/layout/main-layout/main-layout.{html,ts}`, `app/features/profiles/profile-screens.ts`.
- `app/features/transaction-reports/transaction-reports.{ts,html,scss,spec.ts}` + `transaction-report-options.ts` (rotulos, padroes DD1/DD5).
- `styles.scss` — `.table-wrap.scroll-table` (tabela rolavel ate 680) e `@media print`.

### Migration
- `backend/src/main/resources/db/migration/V18__add_transaction_reports.sql` — check com 9 telas; seed `TRANSACTION_REPORTS` com 4 flags `true` em todos os perfis; `transaction_report_preferences` (`user_id` FK `app_users` cascade, `name varchar(100)`, `is_default`, `period`, `start_date`, `end_date`, `type`, `status`, `source`, `min_amount`/`max_amount numeric(14,2)`, `installments`, `group_by text`, `columns text`, timestamps; unique `(user_id, lower(name))`; unique parcial `(user_id) where is_default`) e `transaction_report_preference_categories` (PK composta; FK preferencia e FK `categories`, ambas `on delete cascade`) (proximo numero livre: V18).

## Tarefas

- [x] **T1** — Criar a `V18` e o `Screen.TRANSACTION_REPORTS`; `AuthResourceTest` 8 -> 9 telas; `ProfileResourceTest` cobre seed e as quatro acoes.
  - Arquivos: `V18__add_transaction_reports.sql`, `Screen.java`, `AuthResourceTest.java`, `ProfileResourceTest.java`
  - Criterios: 1
- [x] **T2** — Criar `CurrentDate`, os quatro enums, os helpers de `ListParams` e os rotulos de `FieldLabels`.
  - Arquivos: `reports/CurrentDate.java`, `reports/Report*.java`, `reports/InstallmentFilter.java`, `ListParams.java`, `FieldLabels.java`
  - Criterios: — (infraestrutura para T3–T8)
- [x] **T3** — Implementar `TransactionReportCriteria`: relativo resolvido por `CurrentDate`; CUSTOM com datas obrigatorias inclusivas (datas ignoradas fora dele); 400 em portugues para CUSTOM sem data, inicial > final ("A data inicial não pode ser posterior à data final."), min > max, valor negativo, enum/periodo/agrupamento invalido e agrupamento repetido.
  - Arquivos: `reports/TransactionReportCriteria.java`
  - Criterios: 5, 6
- [x] **T4** — Implementar a consulta (sempre `userId`; filtros por E; status exclui receita; categoria `in` exclui legado; Parcelados `installmentTotal > 1`, A vista nulo ou 1; ordem data asc, `createdAt`, `id`; sem paginacao) e o builder (niveis ilimitados; Receitas, Despesas pagas, Saldo por grupo e no total; "Sem status"/"Sem categoria" no fim; categoria por nome, enum na ordem, datas cronologicas; rotulos prontos dd/MM/yyyy, "Outubro de 2026", ano).
  - Arquivos: `reports/TransactionReportRepository.java`, `reports/TransactionReportBuilder.java`, `reports/TransactionReportResponse.java`
  - Criterios: 4, 5, 7, 8, 12
- [x] **T5** — Criar `GET /transaction-reports` (`require(TRANSACTION_REPORTS, VIEW)` antes dos parametros), com periodo resolvido, grupos/linhas, Saldo e `currentBalance` independente dos filtros.
  - Arquivos: `reports/TransactionReportResource.java`
  - Criterios: 3, 4, 8, 9
- [x] **T6** — Escrever `TransactionReportResourceTest` com usuario dedicado (UUID constante por SQL nativo) e `CurrentDate` fixo em 20/10/2026: um teste por filtro, cada 400, Categoria > Mes e tres niveis, Saldo 400,00, Saldo atual 600,00 (tambem com Tipo Despesa e "Ano anterior"), 120 linhas, outro usuario fora.
  - Arquivos: `backend/src/test/java/br/com/financeos/reports/TransactionReportResourceTest.java`
  - Criterios: 4, 5, 6, 7, 8, 9, 12
- [x] **T7** — Criar entidade, repositorio, request (`name` `@NotBlank` "O nome é obrigatório." e `@Size(max = 100)`; `columns` `@NotEmpty`; `period` obrigatorio) e response (so categorias existentes; inativa fica).
  - Arquivos: `reports/TransactionReportPreference*.java` (4)
  - Criterios: 11, 13, 15
- [x] **T8** — Criar `TransactionReportPreferenceResource`: GET (VIEW, so do usuario), POST (CREATE), PUT/DELETE `/{id}` (EDIT/DELETE; outro usuario = 404; exclusao definitiva); nome com `trim`, unico sem caixa (409 "Já existe uma preferência com esse nome."); criterios por `TransactionReportCriteria`; padrao desmarca a anterior por update em lote antes de gravar; `@Audited` + `AuditTrail` (rotulo = nome).
  - Arquivos: `reports/TransactionReportPreferenceResource.java`
  - Criterios: 3, 11, 13, 14, 15, 16
- [x] **T9** — Criar `POST /audit/print` (`require(screen, VIEW)` + `writeEvent(PRINT, ...)`), pôr `AuditResource.print` em `EVENT_ENDPOINTS` e testar em `AuditEventsTest`.
  - Arquivos: `audit/AuditResource.java`, `AuditCoverageTest.java`, `AuditEventsTest.java`
  - Criterios: 16, 17
- [x] **T10** — Escrever `TransactionReportPreferenceResourceTest` (nome, 409 x outro usuario, lista, 404, relativo noutro mes, CUSTOM mantem datas, padrao B desmarca A, colunas vazias/invalidas = 400, categoria excluida/inativa, auditoria) e `TransactionReportSecurityTest` (403 com a mensagem, 401, `super_admin` 200).
  - Arquivos: `backend/src/test/java/br/com/financeos/reports/TransactionReportPreferenceResourceTest.java`, `.../TransactionReportSecurityTest.java`
  - Criterios: 3, 11, 13, 14, 15, 16
- [x] **T11** — Acrescentar tipos, `TransactionReportService` (+spec), `AuditService.print` e os dois rotulos em `formatters.ts` (+spec).
  - Arquivos: `core/models.ts`, `core/services/transaction-report.service.ts`, `core/services/audit.service.ts`, `core/formatters.ts`
  - Criterios: 11 (infraestrutura para T13–T15)
- [x] **T12** — Ligar a navegacao: rota com `permissionGuard('TRANSACTION_REPORTS','VIEW')`, `ENTRY_ROUTES` apos TRANSACTIONS, secao "Relatórios" > "Lançamentos" no menu e no "Mais" (`canSeeReports()`), `PROFILE_SCREENS` apos Lançamentos; atualizar `main-layout.spec.ts`, `entry-route.spec.ts` (`screenForUrl`) e `profile-form.spec.ts` (8 -> 9; view-only a partir do indice 6).
  - Arquivos: `app.routes.ts`, `entry-route.ts`, `main-layout.{html,ts}`, `profile-screens.ts`
  - Criterios: 1, 2
- [x] **T13** — Criar a tela: Periodo, Categoria (oculta sem `CATEGORIES/VIEW`), Tipo, Status, Origem, Valor, Parcelamento; agrupamentos ordenados; colunas (sem coluna nao gera); quadros Saldo e Saldo atual sempre visiveis em `money()`; tabela com subtotais e rotulos; trio de estados; Falha em toast.
  - Arquivos: `features/transaction-reports/transaction-reports.{ts,html,scss}`, `transaction-report-options.ts`
  - Criterios: 8, 10, 11, 12, 18, 19
- [x] **T14** — Acrescentar preferencias: aplicar, salvar nova, alterar, excluir com `confirm-dialog`, marcar padrao; ao abrir aplica a padrao e gera.
  - Arquivos: `features/transaction-reports/transaction-reports.{ts,html}`
  - Criterios: 13, 14, 15
- [x] **T15** — "Imprimir": `audit.print('TRANSACTION_REPORTS')` e `window.print()` mesmo com falha; `@media print` global esconde menu, barra inferior, toasts, `.no-print` e mostra `.print-only` (periodo e filtros aplicados); regra global `.scroll-table` ate 680px.
  - Arquivos: `styles.scss`, `features/transaction-reports/transaction-reports.{ts,html}`
  - Criterios: 17, 18
- [x] **T16** — Escrever `transaction-reports.spec.ts`: quadros sem controle de ocultar, colunas (Categoria some; sem coluna nao gera nem chama HTTP), rotulos sem enum, padrao ao abrir, sem padrao = DD1/DD5, vazio, falha, "Imprimir" (espia `window.print`), ordem desfavoravel e sem `CATEGORIES/VIEW`.
  - Arquivos: `features/transaction-reports/transaction-reports.spec.ts`
  - Criterios: 10, 11, 14, 17, 19
- [x] **T17** — Publicar a area (Saldo como D6, Saldo atual como D7) e o menu em `OverviewContent.navegacao()`; `DocumentationContentTest` com 7 areas e sem `Relatórios|Relatorios` em `REMOVED_OR_UNIMPLEMENTED`; revisar por `.claude/skills/pipeline/revisar-textos/SKILL.md`.
  - Arquivos: `TransactionReportsAreaContent.java`, `DocumentationContent.java`, `OverviewContent.java`, `DocumentationContentTest.java`
  - Criterios: 20
- [x] **T18** — Acrescentar item em `Kind.NEW` do bloco `1.0.3` e a assercao em `ReleaseNotesContentTest`; revisar por `.claude/skills/pipeline/revisar-textos/SKILL.md`.
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: 20
- [x] **T19** — Rodar `./mvnw test`, `npm test`, `npm run build` e as varreduras do `context.md`; conferir que `TransactionResource`, `transactions.ts` e `DashboardResource` nao mudaram.
  - Arquivos: —
  - Criterios: 21

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Screen, migration, `/me`, Perfis | T1, T12 |
| 2 | Menu, "Mais", rota, acesso | T12 |
| 3 | `require`, 403/401/super_admin | T5, T8, T10 |
| 4 | Outro usuario fora | T4, T5, T6 |
| 5 | Filtros | T3, T4, T6 |
| 6 | 400 | T3, T6 |
| 7 | Agrupamento | T4, T6 |
| 8 | Saldo | T4, T5, T6, T13 |
| 9 | Saldo atual | T5, T6 |
| 10 | Quadros fixos | T13, T16 |
| 11 | Colunas | T7, T8, T10, T11, T13, T16 |
| 12 | Sem paginacao | T4, T6, T13 |
| 13 | Preferencias | T7, T8, T10, T14 |
| 14 | Padrao | T8, T10, T14, T16 |
| 15 | Categoria excluida/inativa | T7, T8, T10, T14 |
| 16 | Auditoria | T8, T9, T10 |
| 17 | Imprimir | T9, T15, T16 |
| 18 | 375px | T13, T15 |
| 19 | Vazio e falha | T13, T16 |
| 20 | Central e Novidades | T17, T18 |
| 21 | Nao-regressao | T19 |

## Superficie de validacao

- 1, 3–9, 11–16 — testes de T1, T6, T9, T10; 2, 10, 11, 14, 17, 19 — specs de T12 e T16; 20 — testes de T17/T18 e Sobre > Documentação.

## Validacao manual (etapa 7)

- 17 — Relatórios > Lançamentos > "Imprimir" com DevTools > Rendering > `print`: somem menu, filtros e botoes; ficam quadros, periodo, filtros aplicados e tabela; Auditoria lista "Impressão".
- 18 — viewport 375px: a tabela rola dentro do `.table-wrap` e `document.documentElement.scrollWidth === window.innerWidth`.
- 1 — Perfis > Editar: linha "Relatórios - Lançamentos" com quatro switches.

## Riscos e pontos de atencao

- `DocumentationContentTest` proibe "Relatórios" e fixa 6 areas, e `OverviewContent` lista as secoes do menu: mudam juntos (`knowledge/documentation.md`).
- A regra global de cartao ate 680px atinge toda `table`; `.scroll-table` precisa vencer por ordem/especificidade sem tocar outras telas (`knowledge/frontend-ui.md`).
- Padrao: o unique parcial exige o update em lote antes do flush (Hibernate grava insert antes de update); a desmarcacao da anterior nao gera registro proprio.
- Teste de soma exata com o usuario `...0001` seria contaminado por outras classes: usar usuario dedicado (`knowledge/testing.md`).
- Exclusao de preferencia e definitiva (excecao ao soft delete, a registrar no `sync-knowledge`); categoria continua excluivel e some da preferencia pelo cascade (D9).
- Contratos que crescem: `/auth/me`, `/profiles` e `/audit/options` com 9 telas; specs que contam itens de menu e Perfis.
- Novidades: decidido item novo no `1.0.3` (T18), sem reescrever itens existentes.

## Lacunas

- Nenhuma: todo criterio tem tarefa; T2 e T11 sao infraestrutura.
- Observacao: "sem coluna, a tela nao gera" (criterio 11) fica so no front porque o `GET` nao recebe colunas (DD5); "minimo uma coluna" e imposta no back na preferencia (T7, T8).
