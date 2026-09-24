# Notas de implementação

Branch: `feature/issue-87-evolucao-layout-usabilidade` (base: `main`; mudanças não commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 34 de 35 concluídas (ver `plan.md`). T33 aberta: varreduras, `npm test` completo e build de produção feitos; falta só o `./mvnw test` completo, reservado à etapa 4.

## Arquivos alterados

Backend (`backend/src/main/...`)
- `resources/db/migration/V15__enable_unaccent.sql` — novo: `create extension if not exists unaccent`.
- `java/.../shared/{PageResponse,ListParams,TextSearch}.java`, `transactions/TransactionFilter.java` — novos: página com totais, `page`/`size`/filtros lidos do `UriInfo` com 400 em português, texto "contém" sem acento.
- `java/.../transactions/TransactionRepository.java`, `TransactionResource.java` — `GET` paginado/filtrado, sempre pelo usuário logado.
- `java/.../categories/CategoryRepository.java`, `CategoryResource.java` — `GET` paginado (`name`, `type`, `active`); `GET /options` (semântica antiga do `list(type)`); `GET /{id}` devolve inativa.
- `java/.../users/AppUserRepository.java`, `UserResource.java` — `GET` paginado sem super_admin; `GET /users/{id}`.
- `java/.../profiles/ProfileRepository.java`, `ProfileResource.java` — `GET` paginado (`name`); `GET /profiles/{id}` e `/options`.
- `java/.../documentation/content/{Transactions,Categories,Users,Profiles}AreaContent.java` — Incluir/Editar em tela própria, Filtros, paginação; sem formulário lateral nem edição na linha.
- `java/.../releasenotes/content/ReleaseNotesContent.java` — 2 itens de Melhoria no 1.0.2; texto da correção de Usuários passa a "ao editar o seu cadastro".

Backend (testes)
- `shared/ListingSecurityTest.java` — novo: 403 nos 4 `GET` de lista, `options` e `/{id}`, antes da validação de parâmetro.
- `{Transaction,Category,User,Profile}ResourceTest` — consumidores do array migrados; paginação, filtros, malformados, escopo, `options`.
- `DocumentationContentTest`, `ReleaseNotesContentTest` — CA24 e itens do 1.0.2.

Frontend (`frontend/src/...`)
- `app/core/models.ts` — `Page<T>`, `PAGE_SIZE`, `ListFilters`.
- `app/core/services/page-params.ts` — novo: `HttpParams` com `page`, `size` e só os filtros preenchidos.
- `app/core/services/{transaction,category,user,profile}.service.ts` (+ specs) — `list(filtros, página)`, `get(id)`, `options()`; sem signal de lista.
- `app/core/services/list-state.service.ts` (+ spec) — novo: filtros e página por listagem, em memória.
- `app/core/services/auth.service.ts` — `logout()` limpa o `ListStateService` (T34).
- `app/core/paged-list.ts` (+ spec) — novo: controlador comum das listagens (carga, erro, página, filtros, persistência).
- `app/core/pagination/`, `app/core/filter-panel/`, `app/core/list-feedback/` (+ specs) — novos componentes.
- `app/app.routes.ts` — `<tela>/new` (`CREATE`) e `<tela>/:id/edit` (`EDIT`) nas 4 telas.
- `styles.scss` — toolbar, painel e rótulos de filtro, paginação, `.load-error`, `.form-page`, 44px até 480px; removidos `.compact-list`/`.list-row` (sem uso).
- `app/features/{transactions,categories,users,profiles}/` — listagens reescritas (`.ts/.html/.scss/.spec.ts`) e cadastros novos `transaction-form`, `category-form` (+ `.scss`), `user-form`, `profile-form` (+ `.scss`, que herdou os estilos da matriz do antigo `profiles.scss`).
- `app/features/{dashboard,documentation,release-notes}/` — `loadError` na área, `.empty-state` suprimido na falha (+ specs; `dashboard.scss` ganhou a margem do aviso).

## Decisões

- Texto: `unaccent` na coluna, `Normalizer` no termo, `ilike`; `%`, `_`, `!` escapados.
- `size` ausente = 10; `page`/`size` vazios = 400; filtro vazio = ausente; filtro malformado = 400 "O/A <campo> informado(a) é inválido(a).".
- Texto aplica no `change` e no Enter; `apply()` ignora repetição (uma requisição só).
- Situação padrão gera "Situação: Ativos" e conta em "Filtros (1)" (P9).
- "Limpar filtros" do painel: sempre visível, desabilitado no padrão; o do vazio só quando diferem (P9).
- Filtro Categoria de Lançamentos: catálogo completo, inativas com "(Inativo)", restrito ao Tipo do filtro.
- Categoria inativa já gravada: resolvida por `GET /categories/{id}` se não está entre as ativas do tipo.
- `GET /{id}` 404 → Alerta "<Registro> não encontrado(a)." e volta à listagem; outras falhas: `.load-error`.
- Cadastro de Usuário: campo "Status", como a coluna e a Central.
- Recarga após exclusão/cancelamento/desativação usa o aviso "da lista"; a carga ao voltar do cadastro, o `fromHttpError`.

## Desvios em relação ao plano

- T34 acrescentada (limpar estado das listagens no logout).
- Arquivos não previstos: `shared/TextSearch.java`, `transactions/TransactionFilter.java`, `core/paged-list.ts`, `core/services/page-params.ts` — extraídos (lógica comum às 4 telas).
- Cadastros de Lançamento e Usuário sem `.scss` próprio; `profiles.scss` virou `profile-form.scss` e a listagem ganhou um `profiles.scss` novo.
- T28: emulação (Chrome headless, respostas fictícias); nada estourou 360px. Evidência: `specs/87-evolucao-layout-usabilidade/evidence/medicao-responsiva.md`.
- T33 parcial: `./mvnw test` completo não rodado aqui (etapa 4). Classes do back tocadas: 119 testes verdes; `npm test` completo: 346 verdes.
- Um `git mv` indexou a renomeação do `.scss`; desfeito (`git restore --staged`).

## Correção pós-verificação (CA13, 1ª rodada)

- Com `/options` atrasado, linhas e rótulo saíam "Sem categoria"/"-".
- `transactions.ts`, `users.ts`: o `fetch` da `PagedList` espera `Promise.all([lista, catálogo])`; catálogo = promessa única por tela (recargas não repetem `/options`), anulada na falha para a próxima carga tentar de novo. Linhas no `.loading-state` até os dois chegarem; falha do catálogo = erro de carga da listagem (`.load-error` + um toast). Rótulo "Categoria/Perfil: …" até o catálogo chegar.
- Specs (+2 em cada tela): listagem antes de `/options` e falha do catálogo; `settle()` ganhou `setTimeout` (cadeia de promessas mais longa). `npm test`: 350 verdes.
