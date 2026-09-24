# Relatório de verificação

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruída às 10:06, imagens `1.0.2-dev`).
Branch: `feature/issue-89-listagem-sem-permissao-catalogo` — mudanças ainda **não commitadas**. O diff (24 arquivos) coincide com a lista de `implementation-notes.md`; nada alheio no working tree.
Tela verificada no build **servido**, em Chrome headless, com as respostas de `/api/*` substituídas só na sessão do navegador (inclusive dois `PUT`): nenhuma escrita chegou ao backend ou ao banco. JWT próprio não foi tentado. Medições: `evidence/verificacao-navegador-e-api.md`.

## Critérios de aceite

| # | Critério | Status | Evidência |
|---|---|---|---|
| 1 | Lançamentos lista sem `CATEGORIES/VIEW` | VERIFICADO | `transactions.spec.ts` "sem permissão de ver Categorias lista as linhas e a paginação…" (passou); navegador: 3 linhas, "23", "Página 1 de 3", sem `.load-error`/toast, sem `GET /categories/options` |
| 2 | Usuários lista sem `PROFILES/VIEW` | VERIFICADO | `users.spec.ts` "sem permissão de ver Perfis lista as linhas e a paginação…" (passou); navegador idem, sem `/profiles/options` |
| 3 | `categoryName`/`profileName` na API | VERIFICADO | `TransactionResourceTest#shouldReturnCategoryNameInListAndDetail` (ativa, inativa, legado `null`, lista e detalhe), `#shouldRespondCategoryNameOnCreateAndUpdate`, `UserResourceTest#shouldReturnProfileNameInListAndDetail`, `#shouldAllowChangingAnotherUserProfileOnUpdate` (passaram); OpenAPI em execução traz os dois campos; resolvidos por `@Formula` na própria SQL (`FinancialTransaction.java:36`, `AppUser.java:41`) |
| 4 | Coluna usa o nome da linha | VERIFICADO | "mostra na coluna o nome vindo da linha, com ou sem o catálogo…" nos dois specs (passaram); navegador: coluna mostrou "Nome do servidor N" mesmo com catálogo carregado dizendo "Mercado"; "Sem categoria"/"-" só na linha sem id |
| 5 | CA13 da #87 com `/options` pendente | VERIFICADO | "com o catálogo pendente…"/"com os perfis pendentes…" (passaram); navegador com `/options` atrasado 2 s: aos 700 ms linhas já com os nomes certos |
| 6 | Filtro oculto sem permissão; com ela, como na #87 | VERIFICADO | specs do CA1/CA2 (`filterCategoryId`/`filterProfileId` ausentes, `expectNone`, filtro Tipo/Situação funcionando) + "oferece no filtro todas as categorias…"/"filtra por Perfil com todas as opções…" (passaram); navegador: painel sem Categoria/Perfil, Tipo/Situação reaplicam sem `/options`; com permissão, `Todas|Mercado|Antiga (Inativo)` |
| 7 | Rótulo restaurado "indisponível" | VERIFICADO | "sem permissão…, o filtro de Categoria/Perfil restaurado aparece como indisponível" nos dois specs (passaram); bundle servido contém `"indispon\xEDvel"`. Cenário inalcançável pela UI real (estado limpo no logout), por isso só pela suíte |
| 8 | `/options` 5xx degrada | VERIFICADO | "na falha do catálogo/dos perfis mantém as linhas, avisa uma vez…" + "com a API fora… um único aviso" (passaram); navegador: 500 -> linhas, 1 toast "Falha", filtro só `Todas`/`Todos`, próxima carga repete `/options` e o filtro volta com opções |
| 9 | Formulários com aviso sem permissão | VERIFICADO | 4 casos novos em `transaction-form.spec.ts` e 4 em `user-form.spec.ts` (inclusão, edição, sem permissão e 403; PUT com id gravado) passaram; navegador: aviso exato, 0 toast, nenhum `/categories*`/`/profiles*`, PUT com `categoryId`/`profileId` gravados, sem estouro de 1440 a 320 px |
| 10 | Regras dos formulários inalteradas | VERIFICADO | `TransactionResourceTest#shouldRequireCategoryOnCreateAndUpdate`, `UserResourceTest#shouldReturnPortugueseMessagesForBlankRequiredFields` (passaram, sem diff); nos dois `*-form.spec.ts` o diff só troca o `setup` (permissão antes do `createComponent`) e acrescenta casos: nenhuma expectativa existente mudou |
| 11 | Permissão no back-end, sem endpoint novo | VERIFICADO | `ListingSecurityTest` sem diff (último commit `d4a5a2c`) e `#shouldDenyOptionsAndDetailWithoutViewPermission` verde; diff sem `@Path`/verbo novo; OpenAPI em execução com os mesmos 17 caminhos; único campo novo nas respostas é o nome |
| 12 | Central atualizada | VERIFICADO | `TransactionsAreaContent.java:62-67,107-109`, `UsersAreaContent.java:58-61,108-109` conferidos contra o código (filtro oculto, aviso, id mantido "enquanto o Tipo não for trocado" = `onTypeChange` limpa); `DocumentationContentTest` verde |
| 13 | Varreduras de acentuação vazias | VERIFICADO | as duas `rg` do `context.md` sem saída (e a de cor literal também) |
| 14 | `./mvnw test` e `npm test` verdes | VERIFICADO | surefire 10:03: 156 testes, 0 falha/erro; `quality-report.md`: 367 testes front verdes; reexecução dos 4 specs tocados: 65/65 |

## Roteiro de validação manual

Todos os critérios foram verificados; o roteiro abaixo é a conferência final com o seu login e os dados reais (nenhum perfil local hoje tem Lançamentos sem Categorias). Use **Ctrl+F5** antes de começar. Bundle velho em cache se reconhece assim: a listagem cai em "Não foi possível carregar…" com toast, e o cadastro mostra a lista de Categoria vazia com toast de Alerta.

1. Entre com a sua conta (Administrador) em `http://localhost`. Em **Perfis > Incluir**, crie "Teste sem catálogo" com Ver/Incluir/Alterar em Lançamentos e Usuários, **Ver em Categorias** (provisório) e nada em Perfis. Em **Usuários > Incluir**, crie "Teste Catálogo", `teste-catalogo@financeos.local`, com esse perfil.
2. Numa janela anônima, entre como Teste Catálogo, inclua um lançamento com categoria e saia. Na sua conta, edite o perfil "Teste sem catálogo" e **desmarque Ver em Categorias**.
3. Entre de novo como Teste Catálogo e abra **Lançamentos** com F12 > Rede. Esperado: a linha com o nome da categoria, sem erro nem toast; **Filtros** sem o campo Categoria; nenhuma chamada a `categories/options`. (critérios 1, 4, 6)
4. **Editar** a linha: no lugar da lista de Categoria aparece "Seu perfil não tem permissão para ver Categorias, por isso não é possível escolher a categoria.", numa caixa cinza (Computed: `color: oklch(0.45 0.014 80)` ≈ `rgb(89, 85, 77)`, `background-color: oklch(0.93 0.01 80)` ≈ `rgb(235, 231, 225)`), sem toast. Mude a descrição e salve: "Lançamento atualizado com sucesso." e a categoria continua a mesma na tabela. Diga se o texto e o visual estão bons (redação pode ser ajustada). (critério 9)
5. **Incluir** com esse usuário: mesmo aviso; ao salvar, o campo mostra "A categoria é obrigatória." e nada é gravado. Confirme que aceita: sem ver Categorias não dá para incluir lançamento (decisão P3). (critérios 9, 10)
6. Ainda como Teste Catálogo, abra **Usuários**: todos com o Perfil certo na coluna, **Filtros** sem Perfil, sem chamada a `profiles/options`; **Editar** qualquer pessoa mostra "Seu perfil não tem permissão para ver Perfis, por isso não é possível escolher o perfil." — clique **Cancelar** sem salvar. (critérios 2, 4, 6, 9)
7. Na sua conta, em **Documentação > Lançamentos** e **> Usuários**, leia as frases novas (linha Categoria/Perfil da tabela de campos e a particularidade do filtro). (critério 12)
8. Volte à sua conta: Lançamentos e Usuários com os nomes certos e o filtro de Categoria/Perfil com todas as opções, como antes. (critérios 4, 6)

## Dados de teste criados

Nenhum por esta etapa. Se seguir o roteiro: perfil "Teste sem catálogo", usuário `teste-catalogo@financeos.local` (desative-o) e o lançamento dele (cancele-o).

## Achado fora dos critérios

- `UsersAreaContent.java:76` ("Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um.") é anterior à feature e convive com o "-" da coluna para usuário sem perfil (legado); vale para a `sync-knowledge` avaliar.

## Conclusão

14 de 14 critérios verificados automaticamente; nenhum depende do usuário e nenhum ficou NÃO ATENDIDO. O roteiro é a conferência final com dados reais antes do `/pipeline:open-pr`.

Validado pelo usuario em 2026-09-24.
