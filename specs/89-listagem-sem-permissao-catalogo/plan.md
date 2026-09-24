# Plano de implementacao

## Abordagem

O back-end passa a devolver o nome junto com o registro: `categoryName` em `TransactionResponse` e `profileName` em `UserResponse`, via campo so leitura `@Formula` (subselect escalar na mesma SQL) nas entidades `FinancialTransaction` e `AppUser`. Assim o `PanacheQuery` de `search`/`searchVisible`, a contagem do `PageResponse.of` e o `findByUserAndId`/`findVisibleById` ficam intactos, sem endpoint novo e sem join que mude escopo ou `totalItems` (mesmo efeito do left join do `DashboardRepository`). No front, as linhas leem o nome da propria linha; o catalogo (`/options`) sai do `fetch` da `PagedList` e passa a ser carga paralela, so com `VIEW` da tela dele, usada apenas pelo filtro e pelo rotulo do filtro; falha degrada (toast unico, filtro sem opcoes, nova tentativa na proxima carga). Nos formularios, sem `VIEW` do catalogo (ou com 403 dele), o dropdown da lugar a uma mensagem fixa, sem toast; o payload continua o mesmo.

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/transactions/FinancialTransaction.java` — `@Formula("(select c.name from categories c where c.id = category_id)") public String categoryName;`
- `backend/src/main/java/br/com/financeos/transactions/TransactionResponse.java` — campo `categoryName`; `from(transaction)` usa o campo da entidade; sobrecarga `from(transaction, categoryName)` para POST/PUT.
- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — `validateCategory` devolve a `Category` validada; `create`/`update` respondem com `category.name` (o `@Formula` nao e recalculado apos `persist`/alteracao no contexto).
- `backend/src/main/java/br/com/financeos/users/AppUser.java` — `@Formula("(select p.name from profiles p where p.id = profile_id)") public String profileName;`
- `backend/src/main/java/br/com/financeos/users/UserResponse.java` — campo `profileName`; sobrecarga `from(user, profileName)`.
- `backend/src/main/java/br/com/financeos/users/UserResource.java` — `requireProfileExists` devolve o `Profile`; `create`/`update` respondem com `profile.name`.
- `backend/src/main/java/br/com/financeos/documentation/content/TransactionsAreaContent.java` — filtro Categoria so aparece com permissao de ver Categorias; no cadastro, sem essa permissao, aviso de que nao e possivel escolher a categoria.
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — idem para Perfil/Perfis.
- Testes: `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java`, `backend/src/test/java/br/com/financeos/users/UserResourceTest.java`.

### Frontend
- `frontend/src/app/core/models.ts` — `Transaction.categoryName: string | null`; `AppUserSummary.profileName: string | null`.
- `frontend/src/app/features/transactions/transactions.ts` / `.html` — `fetch` so com a lista; `loadCategories()` disparado sem `await`, so com `can('CATEGORIES','VIEW')`, memoizado no sucesso, anulado na falha, nunca rejeita (trata o erro dentro: `toast.fromHttpError(err, 'Não foi possível carregar as categorias.')`); coluna `transaction.categoryName ?? 'Sem categoria'`; campo Categoria do filtro com `*ngIf` da permissao; rotulo: sem permissao ou catalogo falho/sem o id -> "Categoria: indisponível", carregando -> "…", carregado -> nome.
- `frontend/src/app/features/users/users.ts` / `.html` — idem com `can('PROFILES','VIEW')`, `user.profileName ?? '-'`, "Perfil: indisponível".
- `frontend/src/app/features/transactions/transaction-form.ts` / `.html` — sem `CATEGORIES/VIEW`: nao chama `/categories/options?type=` nem `/categories/{id}`, nao toasta; `categoryUnavailable` (permissao ausente **ou** 403 do `/options`) troca o `<select>` por "Seu perfil não tem permissão para ver Categorias, por isso não é possível escolher a categoria."; a legenda `field-error` de `categoryId` segue exibivel no 400.
- `frontend/src/app/features/users/user-form.ts` / `.html` — idem: "Seu perfil não tem permissão para ver Perfis, por isso não é possível escolher o perfil.".
- `frontend/src/styles.scss` — classe global da mensagem (ex.: `.field-notice`), so com `var(--token)` existentes (os formularios nao tem `.scss` proprio).
- Specs: `transactions.spec.ts`, `users.spec.ts`, `transaction-form.spec.ts`, `user-form.spec.ts`.

### Migration
- Nenhuma (sem mudanca de schema).

## Tarefas

- [x] **T1** — Devolver `categoryName` em `GET /transactions`, `GET /transactions/{id}`, POST e PUT
  - Arquivos: `FinancialTransaction.java`, `TransactionResponse.java`, `TransactionResource.java`
  - Criterios: 3, 11
- [x] **T2** — Devolver `profileName` em `GET /users`, `GET /users/{id}`, POST e PUT
  - Arquivos: `AppUser.java`, `UserResponse.java`, `UserResource.java`
  - Criterios: 3, 11
- [x] **T3** — Cobrir `categoryName` em `TransactionResourceTest`: lista e detalhe com categoria ativa, inativa (`deactivateCategory`) e lancamento sem categoria (`createTransaction(..., null)`) -> `null`; nome no corpo do POST/PUT; teste existente do 400 "A categoria é obrigatória." intacto
  - Arquivos: `TransactionResourceTest.java`
  - Criterios: 3, 10
- [x] **T4** — Cobrir `profileName` em `UserResourceTest`: lista e detalhe com perfil e com usuario sem perfil (persistido pelo repositorio, e-mail `teste-usuarios-%` para a limpeza existente) -> `null`; PUT que troca o perfil responde o nome novo; 400 "O perfil é obrigatório." intacto
  - Arquivos: `UserResourceTest.java`
  - Criterios: 3, 10
- [x] **T5** — Desacoplar o catalogo da carga em Lancamentos (modelo, coluna, filtro oculto, rotulo "indisponível", degradacao na falha)
  - Arquivos: `core/models.ts`, `transactions.ts`, `transactions.html`
  - Criterios: 1, 4, 5, 6, 7, 8
- [x] **T6** — Atualizar `transactions.spec.ts`: helper `create` com permissoes setadas **antes** do `createComponent` e `render` que so atende `/options` com permissao; fixtures com `categoryName`; substituir os dois casos da #87 ("segura as linhas" e "falha do catalogo = erro de carga") pelos novos: sem `CATEGORIES/VIEW` (N linhas, `totalItems`, sem `.load-error`/toast, sem campo Categoria, `expectNone(OPTIONS_URL)`, demais filtros funcionando); nome da linha com e sem permissao e "Sem categoria" so no legado; `/options` pendente (casado com `expectOne` sem `flush`) com nomes ja corretos; rotulo restaurado "Categoria: indisponível"; `/options` -> 500 com linhas, 1 toast, filtro so "Todas" e nova requisicao na proxima carga
  - Arquivos: `transactions.spec.ts`
  - Criterios: 1, 4, 5, 6, 7, 8
- [x] **T7** — Mesmo desacoplamento em Usuarios
  - Arquivos: `users.ts`, `users.html`
  - Criterios: 2, 4, 5, 6, 7, 8
- [x] **T8** — Atualizar `users.spec.ts` com o mesmo conjunto de T6 (`PROFILES/VIEW`, `-`, "Perfil: indisponível")
  - Arquivos: `users.spec.ts`
  - Criterios: 2, 4, 5, 6, 7, 8
- [x] **T9** — `transaction-form` sem `CATEGORIES/VIEW` ou com 403 do `/options`: mensagem no lugar do dropdown, sem toast, sem `/categories/{id}`; PUT mantem o `categoryId` gravado; criar a classe global da mensagem
  - Arquivos: `transaction-form.ts`, `transaction-form.html`, `frontend/src/styles.scss`
  - Criterios: 9, 10
- [x] **T10** — `transaction-form.spec.ts`: `setup` com superAdmin antes do `createComponent` (expectativas atuais intactas); casos novos na inclusao e na edicao sem permissao (sem `/options`, sem `/categories/{id}`, mensagem, nenhum toast, PUT com o `categoryId` gravado) e com permissao + `/options` -> 403
  - Arquivos: `transaction-form.spec.ts`
  - Criterios: 9, 10
- [x] **T11** — `user-form` sem `PROFILES/VIEW` ou com 403 do `/options`: mensagem no lugar do dropdown, sem toast; PUT mantem o `profileId` gravado
  - Arquivos: `user-form.ts`, `user-form.html`
  - Criterios: 9, 10
- [x] **T12** — `user-form.spec.ts`: `setup` com superAdmin antes do `createComponent`; casos novos equivalentes aos de T10
  - Arquivos: `user-form.spec.ts`
  - Criterios: 9, 10
- [x] **T13** — Atualizar a Central (Funcionalidades/particularidades e linha Categoria/Perfil de Campos) sem afirmar regra inexistente; paragrafo <= 600
  - Arquivos: `TransactionsAreaContent.java`, `UsersAreaContent.java`
  - Criterios: 12
- [x] **T14** — Conferencia final: as duas varreduras de acentuacao (e a de cor literal) vazias; `ListingSecurityTest` sem alteracao; `./mvnw test` e `npm test` completos
  - Arquivos: — (verificacao)
  - Criterios: 11, 13, 14

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Lancamentos lista sem `CATEGORIES/VIEW` | T5, T6 |
| 2 | Usuarios lista sem `PROFILES/VIEW` | T7, T8 |
| 3 | `categoryName`/`profileName` na API | T1, T2, T3, T4 |
| 4 | Coluna usa o nome da linha | T5, T6, T7, T8 |
| 5 | `/options` pendente nao gera nome errado | T5, T6, T7, T8 |
| 6 | Filtro oculto e sem `/options` sem permissao | T5, T6, T7, T8 |
| 7 | Rotulo restaurado "indisponível" | T5, T6, T7, T8 |
| 8 | `/options` 5xx degrada | T5, T6, T7, T8 |
| 9 | Formularios com mensagem sem permissao | T9, T10, T11, T12 |
| 10 | Regras dos formularios inalteradas | T3, T4, T9, T10, T11, T12 |
| 11 | Permissao no back-end, sem endpoint novo | T1, T2, T14 |
| 12 | Central atualizada | T13 |
| 13 | Varreduras de acentuacao vazias | T14 |
| 14 | Suites completas verdes | T14 |

## Superficie de validacao

- Criterios 1, 2, 4-8 — casos de T6/T8. Criterios 9, 10 — casos de T10/T12 + testes atuais verdes.
- Criterio 3 — casos de T3/T4; na stack, `GET /api/transactions?page=1&size=10` traz `categoryName` em cada item.
- Criterio 11 — `ListingSecurityTest` verde e sem diff; nenhum `@Path` novo nos `*Resource.java`.
- Criterio 12 — `DocumentationContentTest` verde + leitura das duas areas em `/documentation`.
- Criterios 13, 14 — varreduras do `context.md` vazias; `./mvnw test` e `npm test` completos.

## Validacao manual (etapa 7)

- Criterios 1, 6, 7 — em `http://localhost`, com um perfil que tenha `TRANSACTIONS/VIEW` e `USERS/VIEW` sem `CATEGORIES/VIEW`/`PROFILES/VIEW` (exige login do usuario): Lancamentos e Usuarios listam com o nome certo, sem campo Categoria/Perfil no painel de Filtros, e a aba Rede nao mostra `/options`.
- Criterio 9 — cadastro Novo/Editar lancamento e usuario com esse perfil: mensagem legivel no lugar do dropdown, sem toast; o painel de filtros sem o campo continua alinhado acima e abaixo de 680px.

## Riscos e pontos de atencao

- `@Formula` nao e recalculado no contexto de persistencia: POST/PUT que troca a categoria/perfil responderia o nome antigo (ou `null` no POST) se usasse o campo da entidade — por isso a sobrecarga `from(..., nome)` com a entidade validada (`knowledge/backend-patterns.md`).
- `AppUser` e carregado a cada request pelo `AccessControl`: o subselect de `profileName` entra em toda leitura de usuario (custo desprezivel; nao e insertable/updatable, nao afeta `ProductionBootstrap`).
- Os specs de formulario nunca setaram permissao (`can()` hoje e `false` neles): o gate novo quebra a suite inteira se o `setup` nao ganhar `superAdmin.set(true)` **antes** do `createComponent` (zoneless). Mudar o helper nao muda expectativa (CA10) (`knowledge/testing.md`).
- Dois casos atuais de `transactions.spec.ts`/`users.spec.ts` codificam o comportamento da #87 que esta issue muda de proposito (linhas seguradas ate o catalogo; falha do catalogo = erro de carga): sao substituidos, nao "consertados".
- Promessa do catalogo disparada sem `await` precisa tratar o erro internamente, senao vira rejeicao nao tratada no vitest.
- Com a API fora, lista e catalogo falham juntos: usar `fromHttpError` no catalogo mantem o texto igual ao da lista e a de-duplicacao evita o segundo card (`knowledge/frontend-ui.md`).
- Interpretacao de "inclusive com `/options` -> 403" (CA9): permissao do signal `true` mas servidor negando (perfil alterado durante a sessao) e tratada como sem permissao — mensagem, sem toast.
- `knowledge/frontend-ui.md` ("Catalogo que resolve nome na linha entra no fetch"), `transactions.md` e `users.md` ficam desatualizados: tarefa da `sync-knowledge`, fora de escopo aqui.
- Novidades por versao: sem item (fora de escopo na spec — a regressao nunca foi publicada).

## Lacunas

Nenhuma.
