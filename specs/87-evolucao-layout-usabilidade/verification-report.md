# Relatório de verificação

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruída na etapa anterior; bundle servido `main-WGMT2MX7.js`, já com a correção).
Branch: `feature/issue-87-evolucao-layout-usabilidade` — mudanças ainda **não commitadas**; o diff bate com `implementation-notes.md`.
Reverificação após a 1ª correção (CA13). A correção só alterou `transactions.ts`/`users.ts` e os specs dessas telas (únicos arquivos mais novos que o relatório anterior). Telas medidas no build servido (Chrome headless/CDP), com as respostas de `/api` substituídas só na sessão do navegador (inclusive `PUT`/`DELETE`; nada chegou ao backend). A evidência de API real (CA8–CA12) vem da rodada anterior, com JWT assinado localmente e só `GET` (#69): o backend não mudou. Saídas: `evidence/reverificacao-ca13.md` (esta rodada) e `evidence/verificacao-navegador-e-api.md` (anterior).

## Critérios de aceite

| # | Critério | Status | Evidência |
|---|---|---|---|
| 1 | Sem form/inline; Incluir/Editar por permissão | VERIFICADO | Rodada nova em Lançamentos/Usuários: 0 campos no `tbody`, 0 `form`, "Incluir" + 10 "Editar"; só VIEW: nenhum botão. Categorias/Perfis: evidência anterior |
| 2 | Rotas com guard, recarga, id inexistente | VERIFICADO | Refeito: sem permissão → `/dashboard` + Alerta; 404 → listagem + "Lançamento não encontrado."; recarga da edição carrega o registro |
| 3 | Títulos, campos, valores e regras | VERIFICADO | Evidência anterior; `*-form` não mudaram |
| 4 | Categoria inativa na edição | VERIFICADO | `CategoryResourceTest#shouldReturnInactiveCategoryById`, `TransactionResourceTest#shouldKeepInactiveCategoryAlreadyLinkedOnUpdate`; navegador (anterior) |
| 5 | Salvar 2xx/400/409; payload | VERIFICADO | Refeito: 400 → `.invalid`, `field-error`, foco e toast; 200 → Sucesso e volta. Specs `*-form` |
| 6 | Cancelar com/sem alteração | VERIFICADO | Refeito: modal "Deseja sair sem salvar?" com 0 requisições; recusar mantém o texto |
| 7 | Volta restaura filtros e página | VERIFICADO | Refeito: Lançamentos (Tipo = Despesa) e Usuários (Inativos) voltam em "Página 2 de 3" com os rótulos, após Cancelar, Sair e Salvar |
| 8 | `page`/`size`, totais | VERIFICADO | `*ResourceTest#shouldPaginate*WithTotals` (4, passaram: 153 verdes); stack (anterior) |
| 9 | 400 em português | VERIFICADO | `*#shouldRejectMalformed*InPortuguese`; stack: 6 casos (anterior) |
| 10 | Além da última = 200 vazio | VERIFICADO | `CategoryResourceTest#shouldReturnEmptyPageFarBeyondTheLast`; stack `profiles?page=99` |
| 11 | E; sem maiúscula/acento | VERIFICADO | `#shouldCombineFiltersWithAnd`, `#shouldSearch*IgnoringCaseAndAccents`; stack "CARTAO itau" |
| 12 | 403; escopos | VERIFICADO | `ListingSecurityTest`, `#shouldListOnlyTransactionsOfTheLoggedUser`, `#shouldNeverListNorCountHiddenSuperAdmin` |
| 13 | Dropdowns e nomes com 11+ | VERIFICADO | Navegador: filtro 15 opções (14 + Todas, inativa "(Inativo)"), Perfil 14; formulários (anterior) 7+1 e 13+1. Com `/options` atrasado 1,5 s (abertura e volta do cadastro): 0 célula indevida em 35 amostras de 50 ms por tela, `.loading-state` em `aria-busy=true`. Falha do catálogo (500 e conexão recusada): `.load-error`, 0 linhas, 1 toast; a próxima carga repete `/options` e acerta os nomes. Specs `transactions.spec.ts`/`users.spec.ts` "com a listagem respondendo antes…" e "na falha do catálogo/dos perfis…" (350 verdes) |
| 14 | Paginação na tela | VERIFICADO | Refeito em Lançamentos: "Página X de Y", pontas desabilitadas, página 2 mantém `type=EXPENSE`, mudar Status → `page=1` |
| 15 | Filtros (N) e rótulos | VERIFICADO | Refeito: "(1)" → "(2)"; remover rótulo reaplica o outro (`?status=PAID`) |
| 16 | Padrões e Limpar | VERIFICADO | Refeito em Usuários: `active=true`, "Situação: Ativos", remover = Todos, Limpar volta a Ativos; Lançamentos Status sem padrão. Categorias/Perfis: anterior |
| 17 | Carga sem `.empty-state` | VERIFICADO | Refeito nas 7 telas: `.loading-state` em `[aria-busy=true]`, 0 `.empty-state` |
| 18 | Filtro sem resultado × vazio | VERIFICADO | Refeito: "Nenhum registro encontrado." + "Limpar filtros"; só o padrão: sem botão; sem filtro: "Nenhum usuário cadastrado" |
| 19 | Erro de carga na área | VERIFICADO | Refeito nas 7 telas, 500 e conexão recusada: `.load-error` em português, 0 `.empty-state`, toast de Falha |
| 20 | 360px sem estouro | VERIFICADO | Refeito em Lançamentos/Usuários (listagem, filtros, vazio, 4 cadastros): `scrollWidth` 360. Demais: anterior |
| 21 | 44px / 16px até 480px | VERIFICADO | Refeito: todos os botões 44px, campos 16px. Demais: anterior |
| 22 | Tabela a 1280, cartão a 680 | VERIFICADO | Refeito: `table.fixed-layout` com as colunas da `main`; 680: `thead` none, `tr` block, 0 `td` sem `data-label` |
| 23 | Não-regressão; suítes | VERIFICADO | `quality-report.md`: `./mvnw test` 153 e `npm test` 350 verdes; nenhum DTO no diff; Cancelar lançamento e Desativar usuário refeitos (toast de Sucesso, recarga) |
| 24 | Central | VERIFICADO | `DocumentationContentTest#shouldNotDescribeSideFormNorInlineEditingInAnyArea`, `#shouldDescribeIncludeEditFiltersAndPaginationInRegistrationAreas` |
| 25 | Varreduras de idioma | VERIFICADO | Refeitas após a correção: 0/0; cor literal 0 |

## Não-regressão das correções

A correção muda a carga das listagens de Lançamentos e Usuários (a `PagedList` agora espera lista + catálogo). Alcance: CA1, CA7, CA14–CA19, CA22 nessas telas, mais CA20/CA21 e os fluxos de CA2/CA5/CA6/CA23 que passam por elas — todos refeitos no build servido, com o mesmo resultado da rodada anterior. Paginação, Cancelar lançamento e Desativar usuário não repetem `/options` (catálogo carregado uma vez por abertura da tela). `PagedList`, `styles.scss` e as demais telas não mudaram.

## Roteiro de validação manual

Nenhum critério depende só do seu julgamento. Passos opcionais para ver a correção com seus dados:

1. Abra `http://localhost`, entre como administrador, abra o DevTools (F12) → Network → throttling "Slow 4G". Vá em Lançamentos e recarregue. Esperado: aparece o indicador de carregamento (sem linhas) e depois as linhas já com o nome da categoria; em nenhum momento "Sem categoria" (a não ser em lançamento que realmente não tem categoria). (critério 13)
2. Faça o mesmo em Usuários: a coluna Perfil nunca mostra "-" durante a carga. (critério 13)
3. Em Lançamentos, filtre uma Categoria, vá à página 2 (se houver), clique em Editar e depois em Cancelar. Esperado: volta na mesma página, com o rótulo "Categoria: <nome>" (durante a carga lenta ele mostra "Categoria: …"). (critérios 7 e 13)

## Dados de teste criados

Nenhum. Nesta rodada não houve chamada à stack fora do navegador; as escritas foram simuladas dentro da sessão.

## Achados fora dos critérios

- Com um filtro de Categoria (ou Perfil) aplicado e o catálogo falhando, o rótulo fica "Categoria: …" / "Perfil: …" ao lado do erro de carga até a próxima carga bem-sucedida (medido). A área mostra `.load-error` e o toast; remover o rótulo funciona. Não reprova critério; é cosmético.
- `knowledge/categories.md` está desatualizado: `GET /categories/{id}` agora devolve a inativa, e `?type=` em `GET /categories` não se restringe às ativas (o catálogo foi para `/options`). Fica para `sync-knowledge`.
- O item 2 do roteiro anterior (texto do rótulo "Situação: Ativos") foi resolvido pela decisão P9a da spec.

## Conclusão

25 de 25 verificados automaticamente; nenhum depende só de validação manual; nenhum NÃO ATENDIDO. A feature está pronta para a sua validação em `http://localhost` e, com o seu aval, para `/pipeline:open-pr 87`.

Validado pelo usuario em 2026-09-24.
