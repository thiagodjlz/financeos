# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; `/api/health` responde `1.0.2-02`; a tag `1.0.3-dev` das imagens vem do `APP_VERSION` do `.env`).
Branch: `fix/issue-104-filtro-mensal-exclusao-lancamentos` — mudancas ainda **nao commitadas**.
Telas medidas em Chrome headless no build servido, com as respostas de `/api/*` substituidas **so dentro da sessao do navegador** (inclusive o `DELETE`): nenhuma escrita chegou ao backend nem ao banco. Banco consultado so com `select`. Nenhum JWT proprio foi usado. Medicoes em `specs/104-filtro-mensal-exclusao-lancamentos/evidence/medicoes-verify.md`.

O diff bate com a lista de `implementation-notes.md` (nenhuma mudanca alheia no working tree). Surefire de `quality-check`: 18 classes, 151 testes, 0 falhas (o `quality-report.md` diz 170; a contagem real dos relatorios e 151, todos verdes).

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | DELETE apaga; depois 404 e fora da lista | VERIFICADO | `TransactionResourceTest#shouldCreateListUpdateAndDeleteTransaction` (passou; relê em transacao nova); `TransactionResource.java` `repository.delete`; sem token -> 401 na stack |
| 2 | 403 sem permissao; 404 de outro usuario/inexistente | VERIFICADO | `TransactionDeleteSecurityTest#shouldDenyDeleteWithoutPermission`, `TransactionResourceTest#shouldNotDeleteTransactionOfOtherUserOrNonexistent` (passaram) |
| 3 | V16 apaga CANCELED e aperta o check | VERIFICADO | psql: `flyway_schema_history` v16 `t`; PAID 258 / PENDING 144 / null 85 (antes +2 CANCELED); check `status IS NULL OR status IN ('PENDING','PAID')`; `TransactionResourceTest#shouldKeepNoCanceledTransactionInDatabase` (update nativo falha) |
| 4 | CANCELED fora do enum; 400 sem gravar; filtro nunca 500 | VERIFICADO | `TransactionStatus.java`; `#shouldRejectCanceledStatusOnCreateAndUpdate`, `#shouldRejectMalformedFiltersInPortuguese` (`status=CANCELED` -> 400) |
| 5 | DashboardRepository sem CANCELED | VERIFICADO | Grep: `CANCELED` so em `V1`/`V16` no `backend/src/main`; `DashboardResourceTest#shouldReturnMonthlySummary` (passou) |
| 6 | Ano sem lancamento = 200 zerado; ordem das checagens | VERIFICADO | `DashboardResourceTest#shouldReturnZeroedSummaryForYearWithoutTransactions`, `#shouldCheckMonthBeforeYearWithoutTransactions`, `#shouldRejectIncompletePeriod`, `#shouldRejectImplausibleYear`; frase antiga ausente do codigo |
| 7 | Excluir com confirmacao, toast | VERIFICADO | CDP: Cancelar -> 0 `DELETE`; confirmar -> `DELETE` + recarga, toast "Sucesso"/"Lançamento excluído com sucesso.", linha some; `transactions.spec.ts` (3 casos) |
| 8 | Sem Cancelado no front | VERIFICADO | CDP: Status `Todos, Pendente, Pago`, 0 `tr.canceled`; Grep sem `CANCELED` em `frontend/src/app` (fora specs) |
| 9 | Seletor do Resumo | VERIFICADO | CDP: `Setembro de 2026`, 12 meses sem dias, ano no cabecalho, 2036..2019 sem limite, escolher Dez/2019 -> 1 `summary?year=2019&month=12` e fecha; `month-picker.spec.ts`, `dashboard.spec.ts` |
| 9a | Passo de calendario, sem `/periods` | VERIFICADO | CDP: Dez/2025 -> Jan/2026 -> Dez/2025, nunca `disabled`, 0 `/dashboard/periods` (nem no bundle); endpoint segue (`DashboardResourceTest#shouldListAvailablePeriodsFromTransactions`) |
| 10 | Campo unico "Data", sem `input type=date` | VERIFICADO | CDP: 0 `input[type=date]`, rotulo `Data`; Fev/2028 aceito |
| 11 | Mes -> dia 1..ultimo dia | VERIFICADO | `formatters.spec.ts` (28/29/31); CDP: `startDate=2028-02-01&endDate=2028-02-29` |
| 12 | Abre no mes atual | VERIFICADO | CDP: 1a `GET` com `2026-09-01..2026-09-30`, campo `Setembro de 2026` |
| 13 | Periodo opcional | VERIFICADO | CDP: remover rotulo e "Limpar filtros" -> `GET` sem datas, campo vazio |
| 14 | 360/390 dentro do conteiner | VERIFICADO | CDP (emulacao): Lancamentos gatilho `r` 370/340 <= sheet 390/360, painel aberto idem; Resumo campo `r` 321/291 <= stepper 374/344; `scrollWidth = clientWidth` |
| 15 | Altura do "Data" = select Tipo | VERIFICADO | CDP 390: 48px = 48px, fonte 16px = 16px, texto `sw 141 = cw 141` |
| 16 | 1280: faixa e cabecalho | VERIFICADO | CDP: `.list-toolbar` termina onde a tabela comeca (280.9); Resumo: saudacao e periodo na mesma faixa do cabecalho |
| 17 | Nao-regressao Lancamentos | VERIFICADO | CDP: no painel do celular o mes so vale em "Aplicar"; voltar do cadastro mantem periodo vazio; `transactions.spec.ts`/`paged-list.spec.ts` |
| 18 | Nao-regressao Resumo + suites | VERIFICADO | quality: backend e frontend (430) verdes; CDP: 4 cards, "Por categoria", "Sem dados no período" em mes zerado |
| 19 | Central + `revisar-textos` | VALIDACAO MANUAL | Conteudo: `DocumentationContentTest#shouldDescribeDefinitiveTransactionDeletionAndMonthFilter` (passou). A skill foi **aplicada a mao** (registro em `implementation-notes.md` e `evidence/revisao-textos.md`), nao invocada — roteiro item 1 |
| 20 | Novidades 1.0.2 | VERIFICADO | `ReleaseNotesContentTest#shouldAnnounceMonthPickerDeletionAndMobileDateFieldIn102` (passou); so ha o bloco `1.0.2` |
| 21 | Varreduras de acentuacao vazias | VERIFICADO | As duas varreduras (e a de cor literal) sem resultado |
| 22 | Backport para a `main` com V16 | PENDENTE POS-MERGE | So fecha apos o merge na `v1.0.2` (T18, etapa 8) |

## Roteiro de validacao manual

1. (criterio 19) Abra `http://localhost`, va em Documentação e leia as areas Lançamentos e Resumo e a Visão geral. Esperado: nenhuma mencao a Cancelado, "Data de"/"Data até", valor riscado ou recusa de ano sem lancamento; Lançamentos descreve o filtro Data mensal (abre no mes atual, rotulo Data removivel) e "Excluir lançamento" com confirmacao; Resumo descreve o seletor e o passo mes a mes. Julgue se o tom esta bom para o usuario final. Antes do commit, quem chamou deve rodar a skill `pipeline:revisar-textos` sobre esses textos (a implementacao nao tinha a ferramenta).
2. (fora dos criterios, decisao pendente) Va em Novidades por versão, bloco 1.0.2. O item "Tabela de Lançamentos" foi reescrito sem "o lançamento cancelado mostra o valor riscado" e o item "Período do Resumo" foi reescrito. A spec punha "reescrever itens antigos que citam cancelado" fora de escopo. Confirme se aceita as duas reescritas.
3. (opcional, conferencia visual) Em Lançamentos, clique na lixeira de um lancamento seu de teste e depois em Cancelar: nada muda. Se quiser excluir de verdade, use um lancamento descartavel criado por voce: a linha some e aparece o aviso verde "Lançamento excluído com sucesso." Se aparecer "Cancelar lançamento" ou o aviso "cancelado", o navegador esta com bundle antigo (Ctrl+F5).

## Dados de teste criados

Nenhum.

## Achado fora dos criterios

- POST/PUT com `"status": "CANCELED"` falham na desserializacao (400), sem mensagem de negocio propria; o teste so confere o status. Risco ja previsto no plano; a tela nunca envia o valor.
- A 320 px a saudacao e o seletor do Resumo passam 4,3 px da borda do cabecalho (sem rolagem horizontal). Fora das larguras de C14.
- `implementation-notes.md` diz que o item "Tabela de Lançamentos" ficou como estava; o diff mostra que foi reescrito (roteiro item 2).
- Knowledge (`transactions.md`, `dashboard.md`, "sem hard delete" em `architecture.md`) fica para o `sync-knowledge`.

## Conclusao

21 de 23 criterios verificados automaticamente; 1 depende do usuario (C19) e 1 fica pendente pos-merge (C22). Nenhum criterio NAO ATENDIDO.

Validado pelo usuario em 2026-09-30.
