# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; bundle servido = `frontend/dist` do build de 10:21, posterior ao ajuste T13 — sha256 conferido).
Branch: `feature/issue-77-exclusao-categorias-permissao` — mudancas ainda **nao commitadas**.
Rodada 2, apos o ajuste pos-validacao T13 (`categories.ts`/`categories.spec.ts`). Tela medida no build servido (Chrome headless via CDP) com as respostas de `/api/*` substituidas **so na sessao do navegador**; nada chegou ao backend e nenhuma escrita ocorreu. Stack real: `DELETE /api/categories/{id}` sem token -> 401. Banco local: so leitura. Nao houve nova tentativa de JWT local (bloqueada na rodada 1 pelo classificador; comportamento autenticado provado pela suite `@QuarkusTest`, que chama o endpoint real por HTTP).

Diff da feature = exatamente os 18 arquivos de `implementation-notes.md`; nada fora deles no working tree. Desde a rodada 1 mudaram so `categories.ts` e `categories.spec.ts`; o backend esta intocado desde 09:41.

Suites: surefire de 10:19 com 16 classes, 127 testes, 0 falhas/erros; `npm test` reexecutado nesta etapa: 31 arquivos, 325 testes verdes.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | 403 sem `CATEGORIES/DELETE`, categoria intacta | VERIFICADO | `CategoryDeleteSecurityTest#shouldDenyDeleteWithoutPermission` (passou); `require` na 1a linha do `delete` |
| 2 | Sem lancamento -> 204, remocao fisica | VERIFICADO | `CategoryResourceTest#shouldCreateUpdateAndDeleteCategory` e `#shouldDeleteInactiveCategoryWithoutTransactions` (passaram) |
| 3 | Inativa em uso -> 409; inexistente -> 404 | VERIFICADO | `#shouldBlockDeletingInactiveCategoryInUse`, `#shouldReturnNotFoundWhenDeletingUnknownCategory` |
| 4 | N lancamentos -> 409, nada muda, mensagem com N | VERIFICADO | `#shouldBlockDeletingCategoryInUseKeepingCategoryAndTransactions` |
| 5 | N soma todos os usuarios e status | VERIFICADO | `#shouldCountTransactionsOfEveryUserAndStatus`; `count("categoryId", id)` sem filtro em `CategoryUsageCheck` |
| 6 | Subcategoria e `planning_items` nao bloqueiam | VERIFICADO | `#shouldDeleteCategoryDetachingSubcategoryAndPlanningItems`; FKs `on delete set null` (rodada 1) |
| 7 | Lista de tipos, mensagem agrupada por tela | VERIFICADO | `CategoryUsageCheckTest` (4 testes, passaram) |
| 8 | Regra no backend, 409 por chamada direta | VERIFICADO | testes de CA3/CA4/CA5 chamam `DELETE` por HTTP (RestAssured) |
| 9 | Lixeira SVG 20px, "Excluir", so com `DELETE` | VERIFICADO | specs "exibe a lixeira nas linhas ativas e inativas...", "não coloca a lixeira no DOM..." (2); navegador: 0 lixeiras sem `canDelete` |
| 10 | Some na linha em edicao, `disabled` nas demais | VERIFICADO | spec "tira a lixeira da linha em edição..."; navegador: ausente na editada, `disabled` nas outras 2 |
| 11 | Modal cita o nome; cancelar sem HTTP | VERIFICADO | spec "abre a confirmação citando o nome..."; navegador: texto com o nome, "Excluir categoria"/"Cancelar", Cancelar e Esc com 0 requisicoes |
| 12 | Confirmar -> `DELETE`, recarrega, toast Sucesso | VERIFICADO | specs "exclui ao confirmar..." e "confirma a exclusão e avisa só da lista..."; navegador: `DELETE`+`GET`, Sucesso, linha some; com `GET` 500 o Sucesso continua e so a lista e avisada |
| 13 | 409 -> Alerta multilinha, categoria continua | VERIFICADO | spec "exibe alerta com a mensagem do backend em linhas no 409..." e `toast-host.spec.ts`; navegador: `pre-line`, `\n` no `innerText`, sem `GET` |
| 14 | Criar, editar, Sair, Situacao seguem | VERIFICADO | specs pre-existentes verdes + 2 novos (criar/editar com `GET` 500); navegador: `POST`/`PUT active:false` + `GET`, form limpo, "Deseja sair sem salvar?" |
| 15 | Lancamentos, Resumo e toasts de uma linha iguais | VERIFICADO | nenhum arquivo de transacoes/dashboard no diff; `TransactionResourceTest`/`DashboardResourceTest` verdes; toasts de uma linha sem `\n` (rodada 1: 18 px) |
| 16 | Central sem frases antigas, com regra nova | VERIFICADO | `DocumentationContentTest#shouldDescribeDefinitiveCategoryDeletion` (passou); jar servido (rodada 1, backend inalterado) |
| 17 | Item no bloco `1.0.2` | VERIFICADO | `ReleaseNotesContentTest#shouldAnnounceCategoryDeletionAsImprovementIn102` (passou) |
| 18 | Varreduras sem ocorrencia nova | VERIFICADO | reexecutadas: frontend 2 (`styles.scss` 24, 30), backend 6 (= baseline); cor literal vazia; bundle sem `Ã`/`Â` |

Medicoes: `evidence/medicoes-navegador.md` (rodada 1 e secao "Rodada 2").

## Achado da rodada anterior (fora dos criterios) — RESOLVIDO

Antes, `confirmDelete`/`save`/`saveEdit` tratavam operacao e recarregamento no mesmo `catch`. Agora (`categories.ts`) o `catch` cobre so a operacao; gravada, vem o Sucesso e `refreshAfterChange()`, que avisa "Não foi possível carregar as categorias." (Falha) e fica em silencio no 401. Provado por 4 specs novos (verdes) e no navegador: excluir/criar/editar com `GET` 500 -> Sucesso + aviso da lista, nunca "Não foi possível excluir/salvar"; com `GET` 401 -> Sucesso + "Sua sessão expirou." do interceptor, sem aviso duplicado.

## Nao-regressao das correcoes

A T13 mexe no fluxo de sucesso de criar, editar (inclui Situação) e excluir, entao remedi CA11 a CA14 no build servido: caminhos felizes (`POST`/`PUT`/`DELETE` + `GET` 200) com um unico toast de Sucesso e lista atualizada; 409 da exclusao sem `GET`; modal "Sair"; Salvar volta a habilitar. Todos seguem atendidos.

Observacao (nao e defeito): com operacao gravada e `GET` falho, a tabela continua mostrando a lista anterior ate o proximo carregamento. E consequencia do comportamento pedido e o aviso da lista explica.

## Roteiro de validacao manual

Nenhum criterio depende de juizo humano: os 18 foram medidos. Confirmacao opcional com os dados reais (use **so** a categoria de teste criada no passo 1: excluir e definitivo):

1. Abra `http://localhost` com Ctrl+F5, entre como administrador e va em Cadastros > Categorias. Crie "Teste exclusao 77" (Despesa). Esperado: toast Sucesso "Categoria salva com sucesso.", sem nenhum outro aviso; lixeira ao lado de "Editar" em todas as linhas, icone vermelho escuro — DevTools > Computed do `button.icon-button`: `color: oklch(0.42 0.17 25)` (~`rgb(148, 0, 21)`). Sem lixeira nenhuma = bundle em cache. (CA9, CA14)
2. Clique na lixeira de "Mercado" e confirme em "Excluir categoria". Esperado: toast Alerta com duas linhas — "Não é possível excluir a categoria. Ela está em uso em:" e, embaixo, "Lançamentos: 1 registro" — e "Mercado" continua na lista. Computed de `.toast-message`: `white-space: pre-line`; se estiver `normal`, as duas frases aparecem emendadas. (CA4, CA13)
3. Clique na lixeira de "Teste exclusao 77" e confirme. Esperado: um unico toast Sucesso "Categoria excluída com sucesso." e a linha some. (CA2, CA12)

## Dados de teste criados

Nenhum. (O passo 1 do roteiro cria uma categoria que o passo 3 exclui.)

## Conclusao

18 de 18 criterios verificados automaticamente; nenhum depende do usuario. Nenhum NAO ATENDIDO. O achado da rodada anterior foi resolvido sem regressao. A feature esta pronta para o aval do usuario e `/pipeline:open-pr`.

Validado pelo usuario em 2026-09-23.
