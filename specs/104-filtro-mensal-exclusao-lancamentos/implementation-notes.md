# Notas de implementacao

Branch: `fix/issue-104-filtro-mensal-exclusao-lancamentos` (base: `v1.0.2`, criada de `origin/v1.0.2`, com `financeosVersionBase=v1.0.2`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 16 de 18 concluidas (ver `plan.md`); abertas: T17 (parcial) e T18 (pos-merge)

## Banco local antes da V16 (T1)

Check de status: `transactions_status_check` (`status IN ('PENDING','PAID','CANCELED')`); ultima migration aplicada: V15. Contagem: CANCELED 2, PAID 258, PENDING 144, null 85. Esperado apos `docker compose up -d --build`: sem CANCELED, demais iguais.

## Arquivos alterados

- `backend/src/main/resources/db/migration/V16__remove_canceled_transactions.sql` (novo) — apaga os `CANCELED` e recria o check sem eles
- `backend/.../transactions/TransactionStatus.java` — sai `CANCELED`
- `backend/.../transactions/TransactionResource.java` — `DELETE` vira `delete()` com `repository.delete`; `validateStatus` so exige status da despesa
- `backend/.../dashboard/DashboardRepository.java` — SQL sem `CANCELED`; sai `hasTransactionsInYear`
- `backend/.../dashboard/DashboardResource.java` — sai a recusa de ano sem lancamento
- `backend/.../documentation/content/{Transactions,Summary,Categories,Profiles}AreaContent.java`, `OverviewContent.java` — textos novos
- `backend/.../releasenotes/content/ReleaseNotesContent.java` — bloco 1.0.2
- `backend/src/test/.../transactions/TransactionResourceTest.java`, `TransactionDeleteSecurityTest.java` (novo), `categories/CategoryResourceTest.java`, `dashboard/DashboardResourceTest.java`, `documentation/DocumentationContentTest.java`, `releasenotes/ReleaseNotesContentTest.java`
- `frontend/src/app/core/month-picker/month-picker.{ts,html,spec.ts}` (novo) — seletor de mes/ano compartilhado
- `frontend/src/app/core/{models,formatters,paged-list}.ts` (+ `formatters.spec.ts`, `paged-list.spec.ts`) — sem `CANCELED`/`AvailablePeriod`; `currentMonth`, `monthLabel`, `shiftMonth`, `monthKey`, `parseMonthKey`, `monthRange`; opcao `initial`
- `frontend/src/app/core/services/{dashboard,transaction}.service.ts` (+ `transaction.service.spec.ts`) — sai `periods`/`loadPeriods`; `cancel` -> `delete`
- `frontend/src/app/features/transactions/transactions.{ts,html,scss,spec.ts}` — filtro "Data" mensal, "Excluir lancamento" com confirmacao
- `frontend/src/app/features/dashboard/dashboard.{ts,html,scss,spec.ts}` — seletor + passo de calendario, sem `/periods`
- `frontend/src/styles.scss` — estilos do seletor (desktop, faixa de filtros, 680px), `.list-panel:has(...)`, camada 40

## Decisoes

- O filtro de Lancamentos guarda o periodo numa chave unica `month` (`YYYY-MM`); `transactionQuery()` (exportada em `transactions.ts`) a converte em `startDate`/`endDate`. Estado salvo antigo com `startDate`/`endDate` so sobrevive na memoria da sessao (`ListStateService`), sem efeito apos recarregar.
- O "Data" de Lancamentos e `div.filter-field` com `role="group"`, nao `label`: um `label` envolvendo o gatilho e os 12 botoes do painel repassaria cliques.
- Estilo do seletor todo em `styles.scss`: o encapsulamento emulado impede `dashboard.scss` de alcancar o gatilho interno. Variante `.month-picker.bare` (sem moldura) para o passo de mes do Resumo.
- Painel sobreposto no desktop e no Resumo; no painel "Filtros" do celular fica no fluxo (o `.filter-sheet` rola). Se a sobreposicao sairia da tela, o componente a desloca para dentro medindo o proprio retangulo (nao e decisao de layout por largura; sem `matchMedia`).
- `.list-panel` tem `overflow: hidden` pelos cantos da tabela; `.list-panel:has(.month-picker-panel)` libera enquanto o seletor esta aberto, para a lista curta nao cortar o painel.
- Esc dentro do seletor fecha so ele (`stopPropagation`), sem fechar o painel "Filtros" do celular, que escuta Esc no document.
- Abrir no mes atual conta como filtro ativo: "Filtros, 1 ativo", "Limpar filtros" visivel e mes vazio mostra "Nenhum registro encontrado." (teste de carga ajustado; "Sem lancamentos cadastrados" aparece apos remover o rotulo Data).
- Mensagem da confirmacao: `Deseja excluir o lançamento "<descrição>"? A exclusão não pode ser desfeita.` (modelo de Categorias).

## Revisao de textos (skill `pipeline:revisar-textos`)

Sem ferramenta para invocar a skill neste subagente: apliquei manualmente o `SKILL.md` (5 perguntas, rotulos da tela, sem enum/infra) — a etapa seguinte pode reexecuta-la. Antes -> depois de cada texto em `specs/104-filtro-mensal-exclusao-lancamentos/evidence/revisao-textos.md`. Em resumo: sai toda mencao a cancelar/Cancelado/valor riscado/"não o apaga", a "Data de"/"Data até" e aos periodos "em que você tem lançamentos" e botoes desabilitados; entram Excluir lancamento com confirmacao, filtro Data mensal que abre no mes atual e pode ser removido, e o seletor/passo de calendario do Resumo. Novidades 1.0.2: "Período do Resumo" reescrito; novos "Filtro Data em Lançamentos", "Excluir lançamento" (Melhorias) e "Filtro de data no celular" (Correcoes).

## Desvios em relacao ao plano

- T16: a pedido do orquestrador, o item "Período do Resumo" da 1.0.2 foi reescrito em vez de mantido (o plano previa nao reescrever).
- T17 parcial: varreduras de acentuacao e de cor literal vazias (feitas pela ferramenta Grep; `rg` nao esta no PATH do Git Bash) e `npm test` completo verde (40 arquivos, 430 testes). A suite completa do backend nao foi rodada aqui (regra da etapa: e o portao de `/pipeline:quality-check`); rodadas e verdes as classes tocadas e vizinhas (Transaction*, Category*, Dashboard*, Documentation*, ReleaseNotes* de conteudo e recurso).
- T18 nao executada (pos-merge, por instrucao).
- Ponto em aberto: o item de Melhorias 1.0.2 "Tabela de Lançamentos: ... e o lançamento cancelado mostra o valor riscado" ficou como estava ("Fora de escopo": itens antigos que citam cancelado), mas descreve algo que deixa de existir na propria 1.0.2 — decidir na etapa 7.

- Revisao de textos (`pipeline:revisar-textos`) concluida pelo orquestrador em 2026-09-30; ver `evidence/revisao-textos.md`. O item "Tabela de Lançamentos" de Novidades 1.0.2 tambem foi reescrito pelo orquestrador (sai "valor riscado").
