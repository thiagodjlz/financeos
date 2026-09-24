# Plano de implementacao

## Abordagem

Os 4 `GET` de listagem devolvem sempre `PageResponse` (`items`, `totalItems`, `totalPages`, `page` a partir de 1, `size` 1..10, padrao 10), com filtros lidos por `UriInfo` e validados no `Resource`; texto por `unaccent`. As listas completas (dropdown, nome nas linhas) vao para `GET /categories/options` e `GET /profiles/options`, com a semantica e a permissao de hoje; a edicao por URL usa `GET /{id}` (novo em Usuarios e Perfis). No front, paginacao, filtros, estados e estado da listagem sao comuns; inclusao/edicao vira um `<tela>-form` com rota propria.

## Arquivos a alterar

### Backend (`backend/src/main/java/br/com/financeos/`)
- `shared/PageResponse.java`, `shared/ListParams.java` (novos); `{transactions,categories,users,profiles}/*Resource.java` + `*Repository.java`
- `documentation/content/` (4 `*AreaContent.java`), `releasenotes/content/ReleaseNotesContent.java`; testes na Fase A e E

### Frontend (`frontend/src/app/`)
- `core/models.ts`, 4 services; novos `core/services/list-state.service.ts`, `core/{pagination,filter-panel,list-feedback}/`; `app.routes.ts`; `../styles.scss`
- `features/{transactions,categories,users,profiles}/` (listagem + novo `<tela>-form`); `features/{dashboard,documentation,release-notes}/`

### Migration
- `backend/src/main/resources/db/migration/V15__enable_unaccent.sql` — `create extension if not exists unaccent;` (proximo numero livre: 15; ultima e `V14__add_release_notes_screen.sql`)

## Tarefas

**Fase A — API**

- [x] **T1** — Criar a migration do `unaccent`
  - Arquivos: `db/migration/V15__enable_unaccent.sql`
  - Criterios: — (infraestrutura para T3–T6)
- [x] **T2** — Criar `PageResponse` e `ListParams` (400: "A página deve ser um número inteiro maior ou igual a 1.", "O tamanho da página deve ser um número entre 1 e 10."; `page=`/`size=` vazios = 400; filtro vazio = ausente)
  - Arquivos: `shared/PageResponse.java`, `shared/ListParams.java`
  - Criterios: 8, 9, 10
- [x] **T3** — Paginar/filtrar `GET /transactions` (`description`, `categoryId`, `type`, `status`, `startDate`, `endDate`; ordem data desc, `createdAt` desc, `id`)
  - Arquivos: `TransactionResource.java`, `TransactionRepository.java`
  - Criterios: 8, 9, 10, 11, 12
- [x] **T4** — Paginar/filtrar `GET /categories` (`name`, `type`, `active`); criar `/options`; `GET /{id}` devolve inativa
  - Arquivos: `CategoryResource.java`, `CategoryRepository.java`
  - Criterios: 4, 8, 9, 10, 11, 12, 13
- [x] **T5** — Paginar/filtrar `GET /users` (`name`, `email`, `profileId`, `active`; lista e contagem sem super_admin); criar `GET /users/{id}` (`USERS/VIEW`)
  - Arquivos: `UserResource.java`, `AppUserRepository.java`
  - Criterios: 2, 8, 9, 10, 11, 12
- [x] **T6** — Paginar/filtrar `GET /profiles` (`name`); criar `GET /profiles/{id}` e `/options` (`PROFILES/VIEW`)
  - Arquivos: `ProfileResource.java`, `ProfileRepository.java`
  - Criterios: 2, 8, 9, 10, 11, 13
- [x] **T7** — Migrar consumidores do array e cobrir Lancamentos/Categorias: 11 -> 10+1 e totais 11/2, alem da ultima, 3 filtros em E, `acai` acha "Açaí", malformados, escopo por usuario, `options` com 11+, `GET /{id}` de inativa
  - Arquivos: `TransactionResourceTest.java`, `CategoryResourceTest.java`
  - Criterios: 4, 8, 9, 10, 11, 12, 13, 23
- [x] **T8** — Idem Usuarios/Perfis (`findUser` e `find { it.id }` passam a `GET /{id}`; `totalItems` sem super_admin)
  - Arquivos: `UserResourceTest.java`, `ProfileResourceTest.java`
  - Criterios: 2, 8, 9, 10, 11, 12, 13, 23
- [x] **T9** — 403 sem `VIEW` nos 4 `GET` de lista, nos `GET /{id}` e `options`, mesmo com parametro malformado
  - Arquivos: `shared/ListingSecurityTest.java`
  - Criterios: 12, 23

**Fase B — Base do front**

- [x] **T10** — `Page<T>`; `TransactionService`/`CategoryService` com `list(filtros, page)` e `get(id)`; catalogo e `listByType` via `/categories/options`
  - Arquivos: `models.ts`, `transaction.service.ts`, `category.service.ts` (+ specs)
  - Criterios: 8, 13
- [x] **T11** — `UserService`/`ProfileService` com `list` e `get(id)`; perfis via `/profiles/options`
  - Arquivos: `user.service.ts`, `profile.service.ts` (+ specs)
  - Criterios: 8, 13
- [x] **T12** — Estado da listagem por tela (filtros + pagina, em memoria)
  - Arquivos: `core/services/list-state.service.ts` (+ spec)
  - Criterios: 7, 14
- [x] **T13** — Paginacao: "Anterior"/"Próxima" desabilitados nas pontas, "Página X de Y", oculta sem registros
  - Arquivos: `core/pagination/` (+ spec)
  - Criterios: 14, 21
- [x] **T14** — Painel de filtros: "Filtros"/"Filtros (N)", campos projetados, rotulos removiveis, "Limpar filtros"
  - Arquivos: `core/filter-panel/` (+ spec)
  - Criterios: 15, 16, 21
- [x] **T15** — Estados da lista: carga, erro de carga (texto de carga da tela), "Nenhum registro encontrado." + "Limpar filtros", vazio atual projetado
  - Arquivos: `core/list-feedback/` (+ spec)
  - Criterios: 17, 18, 19
- [x] **T16** — Utilitarios globais (toolbar, filtros, rotulos, paginacao, `.load-error`, pagina de cadastro); 44px ate 480px; nada transborda a 360px
  - Arquivos: `styles.scss`
  - Criterios: 20, 21, 22
- [x] **T17** — Rotas `<tela>/new` (`CREATE`) e `<tela>/:id/edit` (`EDIT`) das 4 telas
  - Arquivos: `app.routes.ts`
  - Criterios: 2

**Fase C — Cadastros.** Listagem: sem formulario nem campo na linha, "Incluir" com `CREATE`, "Editar" com `EDIT`, acoes de linha atuais, filtros P5, paginacao, estados, estado restaurado. Formulario: titulo, campos/valores/regras atuais, `GET /{id}` na edicao, 404 -> listagem + Alerta "<Registro> não encontrado(a).", Salvar 2xx -> Sucesso atual + volta, 400/409 -> `invalid`/`field-error`/foco/toast, Cancelar com confirmacao so se houver alteracao.

- [x] **T18** — Listagem de Lancamentos (Descrição, Categoria, Tipo, Status, Data de/até)
  - Arquivos: `features/transactions/transactions.{ts,html,scss,spec.ts}`
  - Criterios: 1, 7, 13, 14, 15, 16, 17, 18, 19, 22, 23
- [x] **T19** — Cadastro de Lancamento (Categoria por Tipo, opcao "(Inativo)", Status oculto em Receita)
  - Arquivos: `features/transactions/transaction-form.{ts,html,scss,spec.ts}`
  - Criterios: 2, 3, 4, 5, 6, 7, 13
- [x] **T20** — Listagem de Categorias (Nome, Tipo, Situação padrao Ativos; lixeira)
  - Arquivos: `features/categories/categories.{ts,html,scss,spec.ts}`
  - Criterios: 1, 7, 14, 15, 16, 17, 18, 19, 22, 23
- [x] **T21** — Cadastro de Categoria (inativa abre "Inativo" e reativa)
  - Arquivos: `features/categories/category-form.{ts,html,scss,spec.ts}`
  - Criterios: 2, 3, 4, 5, 6, 7
- [x] **T22** — Listagem de Usuarios (Nome, E-mail, Perfil, Situação padrao Ativos; "Desativar")
  - Arquivos: `features/users/users.{ts,html,scss,spec.ts}`
  - Criterios: 1, 7, 13, 14, 15, 16, 17, 18, 19, 22, 23
- [x] **T23** — Cadastro de Usuario (senha obrigatoria so na inclusao; Situação e "Nova senha (opcional)" so na edicao)
  - Arquivos: `features/users/user-form.{ts,html,scss,spec.ts}`
  - Criterios: 2, 3, 5, 6, 7, 13
- [x] **T24** — Listagem de Perfis em `table.fixed-layout` (Nome + acoes; filtro Nome; "Excluir")
  - Arquivos: `features/profiles/profiles.{ts,html,scss,spec.ts}`
  - Criterios: 1, 7, 14, 15, 16, 17, 18, 19, 22, 23
- [x] **T25** — Cadastro de Perfil (nome + matriz; Cancelar de P6 no lugar do de dois estagios)
  - Arquivos: `features/profiles/profile-form.{ts,html,scss,spec.ts}`
  - Criterios: 2, 3, 5, 6, 7

**Fase D — Demais telas**

- [x] **T26** — Resumo: erro de carga na area, no lugar do `.empty-state`
  - Arquivos: `features/dashboard/dashboard.{ts,html,spec.ts}`
  - Criterios: 17, 19
- [x] **T27** — Documentacao e Novidades: erro de carga na area
  - Arquivos: `documentation.{ts,html,spec.ts}`, `release-notes.{ts,html,spec.ts}`
  - Criterios: 17, 19
- [x] **T28** — Medir Login, Resumo, Documentacao e Novidades a 360px e corrigir na origem
  - Arquivos: `.scss` das telas que estourarem
  - Criterios: 20

**Fase E — Central e Novidades**

- [x] **T29** — Reescrever Lancamentos e Categorias na Central (Incluir, Editar em tela propria, Filtros, paginacao)
  - Arquivos: `TransactionsAreaContent.java`, `CategoriesAreaContent.java`
  - Criterios: 24
- [x] **T30** — Idem Usuarios e Perfis, mantendo os trechos de `shouldExplainOwnAccountProtectionsInUsersBusinessRules`
  - Arquivos: `UsersAreaContent.java`, `ProfilesAreaContent.java`
  - Criterios: 24
- [x] **T31** — Testar: nenhuma area cita "à esquerda"/"na própria linha"/"na linha da tabela"; as 4 citam Incluir, Editar, Filtros e paginacao
  - Arquivos: `DocumentationContentTest.java`
  - Criterios: 24
- [x] **T32** — Item de Melhoria no bloco 1.0.2 + teste
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: — (consumidor Novidades, `knowledge/documentation.md`)

**Fase F — Conferencia**

- [ ] **T33** — Rodar as varreduras de idioma e de cor literal (comandos em `context.md`), `npm test` e `./mvnw test` completos
  - Arquivos: —
  - Criterios: 23, 25

**Fase G — Acrescentada na implementacao**

- [x] **T34** — Esquecer filtros e pagina das listagens no logout (outra pessoa no mesmo navegador nao herda o estado)
  - Arquivos: `core/services/auth.service.ts`, `core/services/list-state.service.ts`
  - Criterios: 7

- [x] **T35** — (correcao pos-verificacao) Linhas e rotulo de Categoria/Perfil so com o catalogo carregado: `/options` entra na carga da listagem
  - Arquivos: `features/transactions/transactions.ts` (+ spec), `features/users/users.ts` (+ spec)
  - Criterios: 13

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | sem form/inline; Incluir/Editar por permissao | T18, T20, T22, T24 |
| 2 | rotas com guard, recarga, id inexistente | T5, T6, T8, T17, T19, T21, T23, T25 |
| 3 | titulos, campos e regras atuais | T19, T21, T23, T25 |
| 4 | categoria inativa na edicao | T4, T7, T19, T21 |
| 5 | Salvar 2xx/400/409, payload identico | T19, T21, T23, T25 |
| 6 | Cancelar com/sem alteracao | T19, T21, T23, T25 |
| 7 | volta restaura filtros e pagina | T12, T18–T25 |
| 8 | `page`/`size` e totais | T2–T8, T10, T11 |
| 9 | 400 em portugues | T2–T8 |
| 10 | alem da ultima = 200 vazio | T2–T8 |
| 11 | E; sem caixa/acento | T1, T3–T8 |
| 12 | 403, escopos | T3, T4, T5, T7, T8, T9 |
| 13 | dropdowns e nomes com 11+ | T4, T6–T8, T10, T11, T18, T19, T22, T23, T35 |
| 14 | paginacao na tela | T12, T13, T18, T20, T22, T24 |
| 15 | Filtros (N) e rotulos | T14, T18, T20, T22, T24 |
| 16 | padroes e Limpar | T14, T18, T20, T22, T24 |
| 17 | carga sem `.empty-state` | T15, T18, T20, T22, T24, T26, T27 |
| 18 | filtro sem resultado x vazio | T15, T18, T20, T22, T24 |
| 19 | erro de carga na area | T15, T18, T20, T22, T24, T26, T27 |
| 20 | 360px | T16, T28 |
| 21 | 44px/16px ate 480px | T13, T14, T16 |
| 22 | tabela 1280, cartao 680 | T16, T18, T20, T22, T24 |
| 23 | nao-regressao, suites | T7, T8, T9, T18, T20, T22, T24, T33 |
| 24 | Central | T29, T30, T31 |
| 25 | varreduras vazias | T33 |

## Superficie de validacao

- CA8–CA13 — 4 `*ResourceTest` e `ListingSecurityTest`. Na stack: `GET /api/categories?size=11` -> 400 em portugues; `GET /api/profiles?page=99` -> 200 `items: []`.
- CA1–CA7, CA13–CA19 — specs das listagens e `*-form`: botoes por permissao, nenhum `input` no `<tbody>`, payload identico, `expectNone` no Cancelar, pagina 2 + Tipo = Despesa restaurados, 11+ opcoes no dropdown.
- CA17/CA19 — specs de Resumo, Documentacao e Novidades: 500 -> mensagem na area, sem `.empty-state`. CA24 — `DocumentationContentTest`. CA25 — T33.

## Validacao manual (etapa 7)

- CA20 — DevTools a 360px (4 cadastros com filtros abertos, paginacao e cadastro; Resumo, Documentacao, Novidades, Login): `document.documentElement.scrollWidth <= 360`.
- CA21 — a 480px: altura >= 44px de Incluir, Editar, Filtros, Limpar filtros, Anterior/Próxima, Salvar/Cancelar; `font-size` 16px nos campos.
- CA22 — tabela com as colunas atuais a 1280px; cartao com rotulos a 680px.
- CA7/CA14 — pagina 2 com Tipo = Despesa -> Editar -> Cancelar/Salvar -> volta igual.
- CA8–CA12 na stack dependem de login (sem credencial automatizada): pela tela.

## Riscos e pontos de atencao

- **Contrato apertado: os 4 `GET` deixam de devolver array.** Consumidores: `CategoryResourceTest` l. 130, 191, 208, 330, 710 (`?type=` -> `/options`), 716; `TransactionResourceTest` l. 100; `UserResourceTest#findUser` l. 516; `ProfileResourceTest` l. 228/285. `AuthResourceTest` l. 56 e `CategoryDeleteSecurityTest` l. 122 so asseveram status. No front: 4 services e 4 telas; o Resumo nao consome.
- `?type=` em `GET /categories` vira filtro sem restringir a ativas; o dropdown so fica certo via `/options` (`knowledge/categories.md`).
- `GET /categories/{id}` passa a devolver inativa (CA4); `knowledge/categories.md` fica desatualizado.
- `create extension` exige privilegio; se a V15 falhar o backend nao sobe. Conferir stack e devservices.
- Ordenacao com desempate por `id`; excluir o ultimo item da ultima pagina deve recarregar a anterior.
- Filtro de texto aplica no `change` (Enter/saida), sem debounce: evita `setTimeout` falso nos testes (`knowledge/testing.md`).
- Budget de 8 kB por `.scss`: estilo comum vai para `styles.scss`.

## Lacunas

- Nenhum criterio sem tarefa.
- Decidido com o usuario (spec P9): Situacao padrao "Ativos" **conta sempre** em "Filtros (N)" e gera rotulo "Ativos" (Categorias e Usuarios abrem com "Filtros (1)"). Remover o rotulo -> Situacao = Todos; "Limpar filtros" -> volta a Ativos. Lista vazia so com o padrao: "Nenhum registro encontrado." sem botao "Limpar filtros"; o botao so aparece quando os filtros diferem do padrao. Sem `active` a API devolve todos; o padrao e default de UX. Afeta T14, T15, T20, T22.
- Decidido com o usuario (spec P10): Perfis vira `table.fixed-layout` (Nome + acoes) em T24.
- Tarefa sem criterio: T32 (Novidades, exigida por `knowledge/documentation.md`); T1, T16 e T17 sao infraestrutura.
