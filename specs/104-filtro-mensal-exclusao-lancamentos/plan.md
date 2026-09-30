# Plano de implementacao

## Abordagem

Backend primeiro: `V16` apaga os `CANCELED` e aperta o check; o enum perde `CANCELED`, o `DELETE` passa a `repository.delete(...)` e o Resumo deixa de filtrar `CANCELED` e de recusar ano sem lancamento. No front, um componente compartilhado `core/month-picker` (gatilho "<Mês> de <ano>" que abre ano no cabecalho + 12 meses) serve Resumo e Lancamentos. Em Lancamentos o periodo vira uma chave unica `month` (`YYYY-MM`) no `PagedList` — o rotulo "Data" sai com um `remove('month')` — e o `fetch` a converte em `startDate`/`endDate`. O defeito do celular some com a troca do `input type="date"` por esse gatilho, estilizado em `styles.scss` como o `select` de `.filter-field`.

## Arquivos a alterar

### Backend (`backend/src/main/java/br/com/financeos/`)
- `transactions/TransactionStatus.java`, `transactions/TransactionResource.java` — enum e `DELETE`.
- `dashboard/DashboardRepository.java`, `dashboard/DashboardResource.java` — SQL e validacao do ano.
- `documentation/content/{Transactions,Summary,Categories,Profiles}AreaContent.java`, `OverviewContent.java`; `releasenotes/content/ReleaseNotesContent.java` — textos.
- Testes: `TransactionResourceTest`, `TransactionDeleteSecurityTest` (novo), `CategoryResourceTest`, `DashboardResourceTest`, `DocumentationContentTest`, `ReleaseNotesContentTest`.

### Frontend (`frontend/src/`)
- `app/core/{models,formatters,paged-list}.ts` (+ specs), `app/core/month-picker/*` (novo), `styles.scss`.
- `app/core/services/{transaction,dashboard}.service.ts`.
- `app/features/transactions/transactions.*`, `app/features/dashboard/dashboard.*`.

### Migration
- `backend/src/main/resources/db/migration/V16__remove_canceled_transactions.sql` — `delete ... where status = 'CANCELED'`, `drop constraint <nome confirmado>`, `add constraint transactions_status_check check (status is null or status in ('PENDING','PAID'))` (proximo numero livre: V16; ultimo e `V15__enable_unaccent.sql`).

## Tarefas

- [x] **T1** — Antes de qualquer rebuild, registrar em `implementation-notes.md` a saida de `select status, count(*) from transactions group by status` do banco local e o `conname` do check (query do briefing); escrever a `V16` com esse nome.
  - Arquivos: `V16__remove_canceled_transactions.sql`
  - Criterios: 3
- [x] **T2** — Tirar `CANCELED` do enum; o `@DELETE` (metodo renomeado `delete`) faz `repository.delete(transaction)` apos `require(TRANSACTIONS, DELETE)` e `findByUserAndId` (404 intacto); `validateStatus` fica so com "O status é obrigatório.".
  - Arquivos: `TransactionStatus.java`, `TransactionResource.java`
  - Criterios: 1, 2, 4
- [x] **T3** — SQL sem `CANCELED` (receita = `type = 'INCOME'`; `transaction_count` = `count(*)`; quebra = `t.type = 'INCOME' or (t.type = 'EXPENSE' and t.status = 'PAID')`); apagar `hasTransactionsInYear` e seu uso em `resolvePeriod`, mantendo par -> mes -> ano. `/periods` fica.
  - Arquivos: `DashboardRepository.java`, `DashboardResource.java`
  - Criterios: 5, 6
- [x] **T4** — `TransactionResourceTest`: criar/editar/excluir (204; depois `GET /{id}` 404 e fora da lista); id de `OTHER_USER_ID` e inexistente -> 404 com a linha relida intacta; POST e PUT com `"status": "CANCELED"` -> 400 sem gravar (substitui `shouldRejectCanceledStatusOnCreate`); `GET ?status=CANCELED` -> 400; 0 linhas `CANCELED` e `update ... set status = 'CANCELED'` nativo falha. `CategoryResourceTest#shouldCountTransactionsOfEveryUserAndStatus`: `CANCELED` -> `PENDING`.
  - Arquivos: `TransactionResourceTest.java`, `CategoryResourceTest.java`
  - Criterios: 1, 2, 3, 4
- [x] **T5** — `TransactionDeleteSecurityTest` no padrao de `CategoryDeleteSecurityTest` (perfil com `TRANSACTIONS` sem delete): 403 e a linha continua.
  - Arquivos: `transactions/TransactionDeleteSecurityTest.java`
  - Criterios: 2
- [x] **T6** — `DashboardResourceTest`: `shouldRejectYearWithoutTransactions` vira `shouldReturnZeroedSummaryForYearWithoutTransactions` (`year=2019&month=3` -> 200, zeros, 12 meses zerados); `year=2019&month=13` -> erro de mes; remover `shouldIncludeCanceledTransactionYear`, o helper `cancelTransaction` e o fixture cancelado de `shouldReturnMonthlySummary`.
  - Arquivos: `DashboardResourceTest.java`
  - Criterios: 5, 6
- [x] **T7** — `models.ts`/`formatters.ts` sem `CANCELED` e sem `AvailablePeriod`; novos `monthLabel(year, month)` (via `longMonthName`), `monthRange('YYYY-MM')` -> `{ startDate, endDate }`, `shiftMonth(period, delta)`; spec: 2026-02 -> 28, 2028-02 -> 29, 2026-12 -> 31, dez/2025 +1 -> jan/2026 e volta.
  - Arquivos: `models.ts`, `formatters.ts`, `formatters.spec.ts`
  - Criterios: 8, 9a, 11
- [x] **T8** — `core/month-picker` standalone, sem `.scss` proprio: `value` (`{year, month} | null`), `label`, saida `valueChange`. Gatilho `button` (`aria-haspopup="dialog"`, `aria-expanded`), texto `monthLabel` ou vazio. Painel: ano no cabecalho, "Ano anterior"/"Próximo ano" sem limite, 12 meses (nome completo no `aria-label`, `aria-pressed`), sem dias; escolher emite uma vez e fecha; `Esc` fecha **sem propagar** (o `filter-panel` ouve `Esc` no document) e devolve o foco; clique fora fecha. `styles.scss`: painel em fluxo dentro de `.filter-sheet` (que tem `overflow-y: auto`), largura limitada ao conteiner; gatilho com as regras do `select` de `.filter-field` nas duas faixas. Spec do componente.
  - Arquivos: `month-picker.ts`, `month-picker.html`, `month-picker.spec.ts`, `styles.scss`
  - Criterios: 9, 10, 14, 15
- [x] **T9** — `PagedList`: opcao `initial?: Partial<F>` usada so sem estado salvo no `ListStateService`; `defaults` segue alvo de `clear`/`clearDraft`/`differsFromDefault`. Casos no spec.
  - Arquivos: `paged-list.ts`, `paged-list.spec.ts`
  - Criterios: 12, 13, 17
- [x] **T10** — Lancamentos: `month: ''` no lugar de `startDate`/`endDate` nos defaults, `initial` = mes atual; `fetch` converte por funcao pura exportada; campo "Data" com `app-month-picker` (`valueChange` grava `list.filters.month` e chama `list.apply()`); rotulo "Data: <Mês> de <ano>"; sai "Cancelado", `[class.canceled]` e `.transaction-row.canceled`; "Excluir lançamento" (`aria-label`/`title`, so com `DELETE`) abre `app-confirm-dialog` (`confirmLabel="Excluir lançamento"`, `cancelLabel="Cancelar"`); confirmar -> `transactionService.delete` (ex-`cancel`), Sucesso "Lançamento excluído com sucesso." e `list.load(true)`; falha -> `fromHttpError(err, 'Não foi possível excluir o lançamento.')`.
  - Arquivos: `transactions.ts`, `transactions.html`, `transactions.scss`, `transaction.service.ts`
  - Criterios: 7, 8, 10, 11, 12, 13, 17
- [x] **T11** — `transactions.spec.ts`: relogio fixo (`toFake: ['Date']`) e helpers/URLs padrao com `startDate`/`endDate` do mes **antes** dos casos novos: carga inicial com o mes; fev/2028 -> `endDate=2028-02-29`; "Limpar filtros" e remover "Data" -> URL sem datas e campo vazio; nenhum `input[type=date]`; Status `['Todos','Pendente','Pago']`; confirmacao recusada sem HTTP; confirmada -> `DELETE` + toast + recarga; volta do cadastro com periodo vazio mantido.
  - Arquivos: `transactions.spec.ts`
  - Criterios: 7, 8, 10, 11, 12, 13, 17
- [x] **T12** — Resumo: `app-month-picker` no lugar do `span.month-label`, entre "Mês anterior"/"Próximo mês"; `step()` por `shiftMonth`, sem `[disabled]`; escolher mes = `selected.set` + um `load()`; remover `periodOptions`, `canStep*`, `loadPeriods` e, no service, `periods`/`loadPeriods`; `dashboard.scss` a 680px sem estourar a largura.
  - Arquivos: `dashboard.ts`, `dashboard.html`, `dashboard.scss`, `dashboard.service.ts`
  - Criterios: 9, 9a, 14, 16
- [x] **T13** — `dashboard.spec.ts`: tirar `flushPeriods` dos helpers primeiro; casos: nenhum `/dashboard/periods`, rotulo "<Mês> de <ano>", escolher mes -> um `GET summary` e painel fechado, dez/2025 <-> jan/2026, botoes nunca desabilitados; o resto da suite continua verde. Ajustar `dashboard.service.spec.ts` se preciso.
  - Arquivos: `dashboard.spec.ts`, `dashboard.service.spec.ts`
  - Criterios: 9, 9a, 18
- [x] **T14** — Central, via skill `pipeline:revisar-textos`: Lancamentos (resumo, Funcionalidades, regras e destaque "não o apaga", reativar cancelado, valor riscado, acao "Excluir lançamento" com confirmacao e aviso, filtro "Data" mensal que abre no mes atual e pode ser removido); Resumo (seletor, passo mes a mes sem desabilitar, fim de "períodos em que você tem lançamentos"/"cancelado continua contando"/"exceto as canceladas"); Overview (exemplo de Sucesso, lista "sem confirmação"); Categorias ("mesmo que ele esteja cancelado"); Perfis ("um cancelamento em Lançamentos").
  - Arquivos: `TransactionsAreaContent.java`, `SummaryAreaContent.java`, `OverviewContent.java`, `CategoriesAreaContent.java`, `ProfilesAreaContent.java`
  - Criterios: 19
- [x] **T15** — `DocumentationContentTest`: trocar "Cancelar lançamento", "Lançamento cancelado com sucesso", "desabilitado" e "cancelado" pelas expectativas novas; asseverar ausencia de "Cancelado", "Data de", "Data até", "Não há lançamentos no ano informado" e "sem apagá-lo".
  - Arquivos: `DocumentationContentTest.java`
  - Criterios: 19
- [x] **T16** — Novidades `1.0.2`, via skill `pipeline:revisar-textos`: Melhorias (seletor de mes no Resumo e em Lançamentos; Excluir lançamento com confirmacao, que apaga de vez) e Correções (campo de periodo no celular dentro da borda). `ReleaseNotesContentTest`: fixes 3 -> 4 e os tres itens.
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: 20
- [ ] **T17** — Varreduras de acentuacao e de cor literal (vazias) + `./mvnw test` e `npm test` completos.
  - Arquivos: —
  - Criterios: 5, 18, 21
- [ ] **T18** — Pos-merge (etapa 8, fora de `/pipeline:implement`): levar a `v1.0.2` para a `main` e conferir `V16` nas duas.
  - Arquivos: —
  - Criterios: 22

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | DELETE remove a linha | T2, T4 |
| 2 | 403 / 404 sem apagar | T2, T4, T5 |
| 3 | V16 apaga e aperta check | T1, T4 |
| 4 | CANCELED fora do enum | T2, T4 |
| 5 | Dashboard sem CANCELED | T3, T6, T17 |
| 6 | ano sem lancamento = 200 zerado | T3, T6 |
| 7 | Excluir com confirmacao | T10, T11 |
| 8 | sem Cancelado no front | T7, T10, T11 |
| 9 | seletor no Resumo | T8, T12, T13 |
| 9a | passo de calendario, sem /periods | T7, T12, T13 |
| 10 | campo unico "Data" | T8, T10, T11 |
| 11 | mes -> startDate/endDate | T7, T10, T11 |
| 12 | abre no mes atual | T9, T10, T11 |
| 13 | periodo opcional | T9, T10, T11 |
| 14 | largura a 360/390 | T8, T12 |
| 15 | altura = select Tipo | T8 |
| 16 | 1280 px | T12 |
| 17 | nao-regressao Lancamentos | T9, T10, T11 |
| 18 | nao-regressao Resumo + suites | T13, T17 |
| 19 | Central | T14, T15 |
| 20 | Novidades 1.0.2 | T16 |
| 21 | varreduras | T17 |
| 22 | backport na main | T18 |

## Superficie de validacao

- C1, C2, C4 — `TransactionResourceTest` (exclusao, 404, 400) e `TransactionDeleteSecurityTest#shouldDenyDeleteWithoutPermission`.
- C3 — teste nativo + contagem por status do banco local antes (T1) e depois do `docker compose up -d --build`: `CANCELED` = 0, demais iguais.
- C5, C6 — `DashboardResourceTest#shouldReturnMonthlySummary`, `#shouldReturnZeroedSummaryForYearWithoutTransactions` e ordem das checagens.
- C7-C13, C17 — `transactions.spec.ts`, `month-picker.spec.ts`, `paged-list.spec.ts`, `formatters.spec.ts`; tela `/transactions`.
- C9, C9a, C18 — `dashboard.spec.ts`; tela `/dashboard`, Network sem `/dashboard/periods`.
- C19, C20 — testes de conteudo; telas Documentação e Novidades por versão.
- C21 — comandos do briefing, saida vazia.

## Validacao manual (etapa 7)

- C14 — DevTools a 360 e 390 px, `/transactions` > "Filtros" (seletor aberto e fechado) e `/dashboard`: `right` do campo <= o do conteiner; `scrollWidth <= clientWidth` no documento.
- C15 — 390 px, painel "Filtros": altura computada do gatilho "Data" = a do select "Tipo"; texto inteiro.
- C16 — 1280 px: filtros em faixa acima da tabela; Resumo com saudacao e periodo no cabecalho.
- C7/C9 — foco visivel; `Esc` dentro do painel de filtros fecha so o seletor. C3 — contagem antes/depois.

## Riscos e pontos de atencao

- Nome do check so vale confirmado no banco; errado, a stack nao sobe. A `V16` apaga dado e nao volta: o rollback de `update-environment.ps1` depende do dump (`knowledge/architecture.md`).
- Linha `CANCELED` remanescente quebraria a leitura com 500 apos o enum mudar — a `V16` roda no startup, antes.
- POST/PUT com `"CANCELED"` passa a falhar na desserializacao (mapper embutido do Jackson): 400, mas sem `ApiError` em portugues. A tela nunca envia o valor; teste assevera so status e ausencia de gravacao. Nao criar mapper nesta issue.
- `transactions.spec.ts` muda de URL em todos os casos: ajustar helpers com relogio fixo antes (`knowledge/testing.md`).
- Abrir no mes atual conta como filtro ativo: "Limpar filtros" aparece de saida e mes vazio mostra "Nenhum registro encontrado." — coerente com Situacao "Ativos"; conferir na etapa 7.
- Bloco `1.0.2` ja traz "Período do Resumo: ... percorrem só os meses com lançamentos e o mês atual", que fica desatualizado; "Fora de escopo" so protege itens que citam "cancelado". Plano: nao reescrever; o item novo descreve a mudanca — confirmar com o usuario na etapa 7.
- Knowledge (`transactions.md`, `dashboard.md`, "sem hard delete" em `architecture.md`) fica para o `sync-knowledge`.

## Lacunas

- Nenhuma. (C22 so fecha depois do merge: T18 roda na etapa 8/pos-merge, fora de `/pipeline:implement`.)
