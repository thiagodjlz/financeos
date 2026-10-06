# Plano de implementacao

## Abordagem

Back-end: `paidExpensePercent` (DEC-2) e `categoryBreakdown[].sharePercent` (DEC-11) calculados no `DashboardResource`, mais um teste do Valor vazio. Front-end: tokens e utilitarios em `styles.scss`; `list-feedback`, `filter-panel` e `month-picker` ganham o minimo; Resumo, Lancamentos (Detalhe novo) e cadastro reestruturados sobre o mesmo DOM nas duas faixas, com o CSS decidindo. "Ver pendentes" grava o estado de Lancamentos no `ListStateService` e navega.

## Arquivos a alterar

### Backend
- `dashboard/*` (T1, T2), `TransactionResourceTest` (T3), `documentation/content/*` e `releasenotes/content/*` com seus testes (T21, T22).

### Frontend
- `styles.scss`, `core/{models,formatters}`, `core/{list-feedback,filter-panel,month-picker}`, `features/dashboard/*`, `features/transactions/*` (nasce `transaction-detail`). Detalhe por tarefa.

### Migration
- Nenhuma (campos calculados).

## Tarefas

- [x] **T1** — No `DashboardResource.summary`, calcular `paidExpensePercent` (`paidExpense*100/totalIncome`) e o `sharePercent` de cada item (`totalAmount*100/` soma dos itens do mesmo `type`), `divide(..., 1, HALF_UP)`, `null` com divisor zero; o repositorio monta o item com `sharePercent` nulo e o resource preenche.
  - Arquivos: `DashboardSummaryResponse.java`, `CategoryBreakdownResponse.java`, `DashboardRepository.java`, `DashboardResource.java`
  - Criterios: 1, 3
- [x] **T2** — `DashboardResourceTest`: receita 4000 + paga 1170 + pendente 300 -> `29.3` (29,25: HALF_EVEN daria 29.2); receita 1000 + paga 1300 -> `130.0`; so despesa paga -> `null`; mes vazio -> `null`. Despesas pagas 117 e 283 em categorias distintas (+ pendente que nao conta) -> `29.3` e `70.8`; receita unica -> `100.0`.
  - Arquivos: `DashboardResourceTest.java`
  - Criterios: 1, 3
- [x] **T3** — POST valido com `amount` nulo: 400, violacao `.amount` "O valor é obrigatório." e `message` "Informe os campos obrigatórios: Valor.".
  - Arquivos: `TransactionResourceTest.java`
  - Criterios: 10
- [x] **T4** — `paidExpensePercent` em `DashboardSummary` e `sharePercent` em `CategoryBreakdown` (`number | null`), e nas fixtures tipadas.
  - Arquivos: `core/models.ts`, `core/services/dashboard.service.spec.ts`
  - Criterios: — (infraestrutura para T12/T14)
- [x] **T5** — `percentLabel(n)` ("29,3%"), `parseAmountInput(texto)` (vazio -> `null`; "184,90" -> 184.9; "1.234,56" -> 1234.56) e `formatAmountInput(n)` ("120,00"), com testes.
  - Arquivos: `core/formatters.ts`, `core/formatters.spec.ts`
  - Criterios: 1, 3, 10
- [x] **T6** — `dayHeading` com dia da semana sem "-feira" ("Sábado, 10 de outubro"), Hoje/Ontem mantidos, ano so fora do ano de `today`; ajustar o spec.
  - Arquivos: `core/formatters.ts`, `core/formatters.spec.ts`
  - Criterios: 8
- [x] **T7** — Tokens da tabela da spec em `:root`, inclusive `--shadow-modal` e `--shadow-toast`.
  - Arquivos: `src/styles.scss`
  - Criterios: 2, 12, 15
- [x] **T8** — Utilitarios globais: `.toggle-group` (`aria-pressed`), `.month-stepper` (variante `.accent`), `.only-mobile`/`.only-desktop`, `.modal-actions` empilhado (48px) ate 680px.
  - Arquivos: `src/styles.scss`
  - Criterios: 3, 6, 12
- [x] **T9** — Esqueleto, `.load-error` com "Tentar novamente", sem `.pagination-summary` ate 680px, "Filtros ativos" visivel no celular com o rotulo novo.
  - Arquivos: `src/styles.scss`
  - Criterios: 7, 11
- [x] **T10** — `list-feedback`: carga em esqueleto (+ `.sr-only` "Carregando..."); entrada `retryable` (padrao `false`) e saida `retry` com "Tentar novamente"; spec.
  - Arquivos: `core/list-feedback/list-feedback.{ts,html,spec.ts}`
  - Criterios: 11
- [x] **T11** — `filter-panel`: slots `[filterLead]`/`[filterInline]` fora do painel e entrada `summary` na faixa de "Filtros ativos"; `month-picker`: entrada `placeholder` ("Todo o período"); specs.
  - Arquivos: `core/filter-panel/filter-panel.{ts,html,spec.ts}`, `core/month-picker/month-picker.{ts,html}`
  - Criterios: 6, 7
- [x] **T12** — `dashboard.ts`: frase/barra do Saldo (nulo -> "Sem receitas no mês", 0%; >100 -> 100%), `sharePercent` so formatado, mes do periodo, bloco do celular (`activeMonth() ?? mes do periodo`), altura medida do grafico, `openPending()` (estado `transactions` = padrao + `month`, `PENDING`, `EXPENSE`; navega) e `create()`; exportar chave/padrao de `transactions.ts`.
  - Arquivos: `features/dashboard/dashboard.ts`, `features/transactions/transactions.ts`
  - Criterios: 1, 2, 3, 4, 5
- [x] **T13** — Template/estilo do Resumo (criterios 2-5): Saldo, Pendentes com "Ver"/"Ver pendentes" so com `TRANSACTIONS/VIEW`, Por categoria com `.toggle-group`, destaque do mes, bloco do mes ate 680px (flutuante so acima), 2 colunas acima de 1080px, "Novo lançamento" so com `CREATE` (oculto ate 680px).
  - Arquivos: `features/dashboard/dashboard.{html,scss}`
  - Criterios: 2, 3, 4, 5, 15
- [x] **T14** — Spec do Resumo: `provideRouter` + espia de `navigate`; Saldo/Pendentes no lugar dos 4 cartoes; "29,3%", "130,0%" (barra 100%), "Sem receitas no mês"; "Ver pendentes" e "Novo lançamento" por permissao; `sharePercent` 80.0/20.0 exibido "80,0%"/"20,0%"; destaque e bloco do mes; fixtures com `balance = income - paidExpense`.
  - Arquivos: `features/dashboard/dashboard.spec.ts`
  - Criterios: 1, 2, 3, 4, 5, 13
- [x] **T15** — Criar `transaction-detail`: descricao, valor com sinal, Tipo/Categoria/Data/Status (receita "—" `Sem status`), "Editar lançamento" (`EDIT`) e "Excluir lançamento" (`DELETE`) como saidas, X/scrim/Esc sem HTTP, `Tab` retido, foco devolvido, entrada `suspended` (confirmacao aberta); inferior ate 680px, centralizado acima; spec.
  - Arquivos: `features/transactions/transaction-detail.{ts,html,spec.ts}`
  - Criterios: 9
- [x] **T16** — `transactions.ts`: `chooseType` (limpa categoria incompativel e aplica), `stepMonth(±1)` (sem mes nao anda), `clearMonth()` do rascunho, `totalLabel` ("1 lançamento"/"N lançamentos"), Detalhe e exclusao por ele (confirma, um DELETE, fecha, recarrega).
  - Arquivos: `features/transactions/transactions.ts`
  - Criterios: 6, 7, 9
- [x] **T17** — Template/estilo de Lancamentos: total (cabecalho no cel., faixa de filtros no desk.), passo de mes, Tipo em `.toggle-group`, painel com Periodo + "Todo o período", Status segmentado e Categoria "Todas" (`only-mobile`), selects "Categoria: todas"/"Status: todos" (`only-desktop`); linha abre o Detalhe (descricao como botao), botoes da linha com `stopPropagation` e ocultos ate 680px; vazio com "Novo lançamento" (`CREATE`); `retryable`.
  - Arquivos: `features/transactions/transactions.{html,scss}`
  - Criterios: 6, 7, 9, 11, 15
- [x] **T18** — Spec de Lancamentos: ajustar Tipo por botao e textos dos selects; testar passo de mes e setas desabilitadas, Tipo na hora, total, "Todo o período" so no "Aplicar", Detalhe (abre pela linha, fecha sem HTTP, permissoes, um DELETE e recarga, botao da linha nao abre), vazio, "Tentar novamente", titulos de dia.
  - Arquivos: `features/transactions/transactions.spec.ts`
  - Criterios: 6, 7, 8, 9, 11, 13
- [x] **T19** — Cadastro: ordem DEC-8; Valor texto `inputmode="decimal"` placeholder "0,00", vazio na inclusao, "120,00" na edicao, payload por `parseAmountInput`; "Hoje"/"Ontem" com `isoDate` local (padrao tambem); "Salvando…" desabilitado no envio; medidas do celular da spec.
  - Arquivos: `features/transactions/transaction-form.{ts,html,scss}`
  - Criterios: 10, 15
- [x] **T20** — Spec do cadastro: `TODAY` por `isoDate`; Valor vazio/"120,00"; "184,90" -> `184.9`; vazio -> `amount: null` e legenda "O valor é obrigatório." no 400; Hoje/Ontem; "Salvando…"; ordem dos campos.
  - Arquivos: `features/transactions/transaction-form.spec.ts`
  - Criterios: 10, 13
- [x] **T21** — Reescrever Resumo (sem "Quatro indicadores"), Lancamentos e introducao (esqueleto, "Tentar novamente", confirmacao no Detalhe), revisando por `.claude/skills/pipeline/revisar-textos/SKILL.md`; `DocumentationContentTest` exige "Ver pendentes"/"Todo o período" e barra "Quatro indicadores".
  - Arquivos: `SummaryAreaContent.java`, `TransactionsAreaContent.java`, `OverviewContent.java`, `DocumentationContentTest.java`
  - Criterios: 14
- [x] **T22** — Melhorias no bloco `versao_1_0_3()`, revisadas por `.claude/skills/pipeline/revisar-textos/SKILL.md`, sem repetir item do 1.0.2; teste exigindo Melhorias no 1.0.3.
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: 14
- [ ] **T23** — Rodar as varreduras do briefing (vazias), `npm test` e `./mvnw test` completos.
  - Arquivos: —
  - Criterios: 13, 14
- [x] **T24** — Chave e filtros padrão da listagem de Lançamentos num módulo próprio, para o Resumo gravar o estado de "Ver pendentes" sem importar a tela inteira.
  - Arquivos: `features/transactions/transaction-filters.ts`, `features/transactions/transactions.ts`, `features/dashboard/dashboard.ts`
  - Criterios: 2
- [x] **T25** — `confirm-dialog` com entrada `destructive` (confirmar em estilo de perigo, como no artboard Componentes) e texto do modal em 15/500; spec. Ampliada por decisão do usuário: a exclusão de Categorias também usa `destructive`.
  - Arquivos: `core/confirm-dialog/confirm-dialog.{ts,html,spec.ts}`, `src/styles.scss`, `features/transactions/transactions.html`, `features/categories/categories.{html,spec.ts}`
  - Criterios: 9, 12
- [x] **T26** — `TransactionService.create/update` aceitam `amount: null` (`TransactionPayload`), para o Valor vazio chegar ao back-end como nulo (DEC-7).
  - Arquivos: `core/services/transaction.service.ts`
  - Criterios: 10
- [ ] **T27** — ~~Item em Correções do bloco 1.0.3 sobre a Data do cadastro à noite.~~ Retirado por decisão do usuário: a correção (`isoDate` local, T19) fica no código, sem item nas Novidades; o bloco 1.0.3 sai só com Melhorias.
  - Arquivos: `ReleaseNotesContent.java` (item removido)
  - Criterios: —

- [x] **T28** — DEC-13: bloco do mês abaixo do gráfico também no desktop; clique (mouse), toque e teclado fixam o mês do bloco, o ponteiro só move o informativo; dica "Toque…" (`only-mobile`) e "Clique…" (`only-desktop`); volta ao mês do período a cada carga; spec.
  - Arquivos: `features/dashboard/dashboard.{ts,html,scss,spec.ts}`
  - Criterios: 4
- [x] **T29** — DEC-14 no back-end: `shared/InvalidFormatExceptionMapper` (valor que não converte para o tipo do campo vira 400 no formato do `ValidationExceptionMapper`, "O valor informado é inválido."); testes de valor negativo e de texto no `TransactionResourceTest`.
  - Arquivos: `shared/InvalidFormatExceptionMapper.java`, `TransactionResourceTest.java`
  - Criterios: 12
- [x] **T30** — DEC-14 no front: `parseAmountInput` sem limpeza (vazio -> `null`, número com sinal -> número, resto -> o texto digitado); `TransactionPayload.amount` aceita texto; specs do formatador e do cadastro (legenda do 400).
  - Arquivos: `core/formatters.{ts,spec.ts}`, `core/services/transaction.service.ts`, `features/transactions/transaction-form.spec.ts`
  - Criterios: 12
- [x] **T31** — DEC-12: `core/record-detail` genérico (ícone e linhas projetados, Editar/Excluir por rótulo e permissão, `busy`, `suspended`), estilos do Detalhe globais em `styles.scss`; Lançamentos passa a usá-lo e `transaction-detail` sai; spec.
  - Arquivos: `core/record-detail/record-detail.{ts,html,spec.ts}`, `src/styles.scss`, `features/transactions/transactions.{ts,html}`
  - Criterios: 9, 11
- [x] **T32** — DEC-12 em Categorias (Tipo, Cor, Situação; Excluir com confirmação de perigo), Usuários (E-mail, Perfil, Status; Desativar só com usuário ativo) e Perfis (permissões por tela); linha abre o Detalhe, botões da linha param a propagação e somem até 680px; `profile-screens.ts` compartilhado com o cadastro; specs.
  - Arquivos: `features/categories/categories.{ts,html,scss,spec.ts}`, `features/users/users.{ts,html,scss,spec.ts}`, `features/profiles/{profiles.ts,profiles.html,profiles.scss,profiles.spec.ts,profile-form.ts,profile-screens.ts}`
  - Criterios: 11
- [x] **T33** — Central (Resumo: bloco nas duas faixas; Lançamentos: recusa do Valor; Categorias, Usuários, Perfis e introdução: Detalhe) e item do 1.0.3 revisados por `revisar-textos`; `DocumentationContentTest` e `ReleaseNotesContentTest`.
  - Arquivos: `documentation/content/{Summary,Transactions,Categories,Users,Profiles}AreaContent.java`, `OverviewContent.java`, `ReleaseNotesContent.java`, `DocumentationContentTest.java`, `ReleaseNotesContentTest.java`
  - Criterios: 16
- [x] **T34** — DEC-15: "Desativar usuário" e "Excluir perfil" pedem confirmação (`confirm-dialog` `destructive`) na linha e no Detalhe (Detalhe por baixo, `suspended`; confirmar fecha os dois e faz um único DELETE); Cor do Detalhe de Categorias só com a bolinha (`role="img"`, "Cor da categoria"); Central de Usuários, Perfis e introdução sem "sem confirmação" e item novo no 1.0.3, revisados por `revisar-textos`; specs e testes de conteúdo.
  - Arquivos: `features/users/users.{ts,html,spec.ts}`, `features/profiles/profiles.{ts,html,spec.ts}`, `features/categories/categories.{html,spec.ts}`, `documentation/content/{Users,Profiles}AreaContent.java`, `OverviewContent.java`, `ReleaseNotesContent.java`, `DocumentationContentTest.java`, `ReleaseNotesContentTest.java`
  - Criterios: 11, 16

## Cobertura dos criterios de aceite

Numeração dos critérios de `spec.md` depois da validação de 2026-10-06 (entraram o 11 e o 12).

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | % do Saldo | T1, T2, T5, T12, T14 |
| 2 | Saldo e Pendentes | T7, T12, T13, T14, T24 |
| 3 | % por categoria | T1, T2, T5, T8, T12, T13, T14 |
| 4 | Gráfico e bloco do mês | T12, T13, T14, T28 |
| 5 | 2 colunas + Novo | T12, T13, T14 |
| 6 | Passo, Tipo, total | T8, T11, T16, T17, T18 |
| 7 | Painel Filtros | T9, T11, T16, T17, T18 |
| 8 | Titulo do dia | T6, T18 |
| 9 | Detalhe de Lançamentos | T15, T16, T17, T18, T25, T31 |
| 10 | Cadastro | T3, T5, T19, T20, T26 |
| 11 | Detalhe nos cadastros | T31, T32, T34 |
| 12 | Valor sem limpeza | T29, T30 |
| 13 | Estados da lista | T9, T10, T17, T18 |
| 14 | Modal e sombras | T7, T8, T25 |
| 15 | Specs + varreduras | T14, T18, T20, T23 |
| 16 | Central + 1.0.3 | T21, T22, T23, T33, T34 |
| 17 | 390/1440 | T7, T13, T17, T19 (manual) |

## Superficie de validacao

- Testes das tarefas da matriz; `GET /api/dashboard/summary` com os dois percentuais.

## Validacao manual (etapa 7)

- 15 — 390px e 1440px sem rolagem horizontal (Filtros e Detalhe abertos); tokens no Computed.
- 4-7, 9, 12 — posicoes por faixa do mockup, `only-*` ocultos na oposta, foco do Detalhe, confirmacao empilhada a 390px.

## Riscos e pontos de atencao

- Status e Categoria com um controle por faixa no mesmo `list.filters`: nomes distintos; o do painel so aplica no "Aplicar".
- Ordem do Resumo difere entre faixas: `grid-template-areas`.
- Altura medida do grafico: o fallback 240 mantem `PLOT_BOTTOM = 196` dos testes.
- Detalhe e confirmacao escutam Esc/Tab no `document`: Detalhe `suspended`.
- `dashboard.scss` tem 441 linhas: compartilhado vai para `styles.scss` (budget 8 kB).
- % por categoria da API (DEC-11) pode somar 99,9%/100,1%; o front nao corrige. Barra e total do rodape seguem no front (#93).
- "Tentar novamente" so em Lancamentos (`retryable`); o esqueleto aparece em todas as listas.
- "Ver pendentes" sobrescreve o estado salvo de Lancamentos.
- Novidades: item novo no 1.0.3 (T22); nada a reescrever (bloco vazio).

## Lacunas

- Nenhuma.
