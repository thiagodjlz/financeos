# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; `/api/health` = `1.0.3-dev`).
Branch: `feature/issue-109-reformulacao-layout` — mudancas ainda **nao commitadas**.
2a rodada (DEC-12 a DEC-15). Sem resposta substituida, sem JWT proprio, sem escrita. No ar: os 28 `.js`/`.css` servidos sao byte a byte os do `dist`, com "Clique em um m\xEAs…", "Cor da categoria", "Deseja desativar o usu\xE1rio…", "Deseja excluir o perfil…", sem `Ã`/`Â`; `/api/dashboard/summary` e `POST /api/transactions` sem token = 401 (o mapper novo so e alcancavel autenticado: provado pela suite).

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | % do Saldo | VERIFICADO | `DashboardResourceTest#shouldRoundPaidExpensePercentHalfUp`, `#shouldReturnRealPaidExpensePercentAboveHundred`, `#shouldReturnNullPaidExpensePercentWithoutIncome`; `dashboard.spec.ts` (29,3% / 130,0%) |
| 2 | Saldo + Pendentes | VALIDACAO MANUAL | `dashboard.spec.ts` "cartões Saldo e Pendentes"; "Ver" a 390 — roteiro R |
| 3 | % por categoria, alternancia | VALIDACAO MANUAL | `DashboardResourceTest#shouldReturnCategorySharePercentOfItsType`; posicao/altura — roteiro R |
| 4 | Destaque + bloco do mes (DEC-13) | VALIDACAO MANUAL | `dashboard.spec.ts` "o bloco do celular mostra o mês do período…", "no desktop, passar o mouse só move o informativo; clicar num mês troca o bloco", "volta o bloco ao mês do período…"; dica por faixa — roteiro 1 |
| 5 | 2 colunas + "Novo lançamento" | VALIDACAO MANUAL | permissao em `dashboard.spec.ts`; colunas — roteiro R |
| 6 | Passo de mes, Tipo, total | VERIFICADO | `transactions.spec.ts` "passo de mês: as setas…", "Tipo em botões aplica na hora…", "mostra o total da consulta…" |
| 7 | Painel Filtros | VALIDACAO MANUAL | `transactions.spec.ts` "no painel do celular…", "\"Limpar filtros\" do painel…"; faixas — roteiro R |
| 8 | Titulo do dia | VERIFICADO | `formatters.spec.ts` `dayHeading` (4); `transactions.spec.ts` "titula cada dia…" |
| 9 | Detalhe de Lancamentos | VERIFICADO | `transactions.spec.ts` "tocar na linha abre o Detalhe…", "…só com EDIT… só com DELETE", "excluir pelo Detalhe confirma antes, faz um único DELETE…", "os botões da linha não abrem o Detalhe"; `record-detail.spec.ts` (6) |
| 10 | Cadastro | VERIFICADO | `TransactionResourceTest#shouldRequireAmountWhenFormSendsItEmpty`; `transaction-form.spec.ts` "segue a ordem…", "\"184,90\" sai como 184.9", "com o Valor vazio envia nulo…", "\"Hoje\" e \"Ontem\"…", "mostra \"Salvando…\"…" |
| 11 | Detalhe em Categorias, Usuarios, Perfis | VALIDACAO MANUAL | comportamento: `categories.spec.ts`, `users.spec.ts`, `profiles.spec.ts` (4 testes "…Detalhe…" cada: abre pela linha, X/scrim/Esc sem HTTP, botoes por permissao, Cancelar sem HTTP, um `DELETE`, fecha e recarrega; Cor so com a bolinha `role="img"`); rodape/janela e botoes da linha ocultos a 390 — roteiro 2 a 4 |
| 12 | Valor sem limpeza (DEC-14) | VERIFICADO | `TransactionResourceTest#shouldRejectNegativeAmountAsTyped`, `#shouldRejectNonNumericAmountInPortuguese` ("12abc", "1,2,3", "-" -> 400 "O valor informado é inválido.", nada gravado); `formatters.spec.ts` "mantém o sinal…", "não limpa o texto…"; `transaction-form.spec.ts` "não corrige o Valor digitado…" (payload `-50` e `"12abc"`, legenda, campo intacto) |
| 13 | Estados da lista | VERIFICADO | `list-feedback.spec.ts` "durante a carga mostra só o esqueleto…", "com \`retryable\`…"; `transactions.spec.ts` "na falha de carga…", "o vazio oferece…" |
| 14 | Confirmacao 48px; sombras | VALIDACAO MANUAL | `confirm-dialog.spec.ts` "com \`destructive\`…"; agora tambem em Usuarios/Perfis — roteiro 2 a 4 (Bloco E) |
| 15 | Specs + varreduras | VERIFICADO | `quality-report.md`: 181/181 (surefire 0 falha/erro) e 491/491; as 5 varreduras do briefing rodadas agora, vazias (controle positivo ok); removidos so os 5 testes de comportamento trocado da 1a rodada |
| 16 | Central + 1.0.3 | VERIFICADO | `DocumentationContentTest#shouldDescribeTheNewLayoutOfSummaryAndTransactions` ("Clique…", detalhe nas 3 telas, sem "sem confirmação"), `ReleaseNotesContentTest#shouldAnnounceTheLayoutRedesignAsImprovementIn103`; "Quatro indicadores" sem ocorrencia; `revisar-textos` (antes -> depois, com DEC-15) em `evidence/revisao-textos.md` |
| 17 | 390/1440 | VALIDACAO MANUAL | `semRolagem` em todos os blocos do roteiro |

## Nao-regressao das correcoes

- `core/record-detail` + Detalhe no `styles.scss` global: criterio 9 retestado; layout volta ao roteiro (R).
- `parseAmountInput`: "184,90", "1.234,56" e vazio seguem testados (10).
- `InvalidFormatExceptionMapper` global: 181 verdes; Valor vazio segue "O valor é obrigatório." (10).
- `pinnedMonth`: testes do informativo verdes (4). `confirm-dialog` sem mudanca desde 2026-10-03 (14).

## Roteiro de validacao manual

Ctrl+Shift+R antes. Largura: F12 > Ctrl+Shift+M > Responsive > 390 ou 1440. Blocos em `specs/109-reformulacao-layout/evidence/medicoes-console.md` (cole no Console, compare com a tabela). Entre como administrador. **Nada grava: em toda confirmacao, clique em Cancelar.**

**Novo nesta rodada**

1. `http://localhost/dashboard` a 1440: abaixo do grafico, bloco do mes com "Clique em um mês do gráfico para ver os valores.". Passe o mouse noutro mes: so o informativo flutuante aparece, o bloco fica. Clique nele: o bloco passa a esse mes; cole o **Bloco I**. Avance o mes: o bloco volta ao mes do periodo. A 390, cole o **Bloco A** (`dicaVisivel` "Toque…"). Errado/cache: sem bloco a 1440. (criterio 4)
2. `http://localhost/categories` a 390: toque numa categoria com cor. Detalhe no rodape com Tipo, Cor (so a bolinha, sem codigo) e Situacao; cole o **Bloco H**. "Excluir categoria" -> cole o **Bloco E** -> **Cancelar** (volta ao Detalhe). Feche pelo X. A 1440: clique na linha (janela centralizada), **Bloco H**, Tab nao sai, Esc fecha; "Editar categoria" da linha abre a edicao sem o Detalhe (volte sem salvar). (11, 14, 17)
3. `http://localhost/users` a 390: toque num usuario ativo, **Bloco H**, "Desativar usuário": confirmacao "Deseja desativar o usuário "<nome>"? Ele deixa de entrar no sistema, mas o cadastro é mantido."; **Bloco E**; **Cancelar**. A 1440, o "Desativar usuário" da linha tambem confirma; **Cancelar**. Usuario inativo: so "Editar usuário" no Detalhe. (11, 14, 17)
4. `http://localhost/profiles` a 390 e 1440: abra um perfil; 7 telas com as permissoes ou "Sem acesso", sem cortar no alto; **Bloco H**. "Excluir perfil" (Detalhe e linha) pergunta "Deseja excluir o perfil "<nome>"? A exclusão não pode ser desfeita."; **Cancelar**. (11, 14, 17)

**Reconfirmacao da 1a rodada**

- R. A 390 e 1440, em `http://localhost/transactions` abra um lancamento e cole o **Bloco D** (estilo do Detalhe agora global; esperado igual a 1a rodada). No Resumo, o **Bloco A** so muda em `blocoDoMes`/`dicaVisivel` a 1440; Blocos B, C, F, G sem mudanca esperada. (2, 3, 5, 7, 9, 17)

`semRolagem` = `true` em todos. Sombras como o navegador serializa: modal `rgba(20, 24, 40, 0.18) 0px 20px 50px 0px`; painel do celular `rgba(20, 24, 40, 0.25) 0px -12px 40px 0px`.

## Dados de teste criados

Nenhum.

## Achado fora dos criterios

- Working tree = exatamente os arquivos de `implementation-notes.md`.
- Registros desatualizados pela DEC-15: `evidence/ajustes-2026-10-06.md` (Cor "bolinha + código"; Usuarios/Perfis "sem confirmação") e `implementation-notes.md` ("Ajustes pós-validação", 2o item). O codigo segue a DEC-15; corrigir antes do `sync-knowledge`.
- Detalhe aberto por clique na linha devolve o foco ao que estava focado antes (`record-detail.ts` guarda `document.activeElement`); agora nas quatro telas. Pelo teclado volta certo.
- Imagens locais etiquetadas `1.0.2-04` (`APP_VERSION` do ambiente); a API responde `1.0.3-dev`. So rotulo.

## Conclusao

9 de 17 verificados automaticamente (1, 6, 8, 9, 10, 12, 13, 15, 16); 8 dependem do roteiro (2, 3, 4, 5, 7, 11, 14, 17), com o comportamento ja provado pelos testes. Nenhum NAO ATENDIDO.

Validado pelo usuario em 2026-10-06.
