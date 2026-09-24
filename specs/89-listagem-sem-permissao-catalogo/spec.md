---
issue: 89
url: https://github.com/thiagodjlz/financeos/issues/89
title: "Listagem de Lançamentos/Usuários cai inteira em erro sem permissão de ver Categorias/Perfis"
domains: [transactions, users, categories, auth, documentation]
target: main
stage: validated
branch: feature/issue-89-listagem-sem-permissao-catalogo
created: 2026-09-24
---

# Listagem de Lançamentos/Usuários cai inteira em erro sem permissão de ver Categorias/Perfis

## Historia

Como usuario com permissao de visualizar Lancamentos (ou Usuarios) mas sem permissao de visualizar Categorias (ou Perfis), quero ver a listagem com os registros e o nome correto da categoria/perfil em cada linha, para que a permissao `VIEW` da tela valha de fato.

## Contexto

Regressao da #87 (PR #88, so na `main`; `v1.0.1` nao e afetada). `transactions.ts`/`users.ts` fazem `Promise.all([lista, loadCategories()/loadProfiles()])`: o catalogo (`GET /categories/options`, `CATEGORIES/VIEW`; `GET /profiles/options`, `PROFILES/VIEW`) virou parte da carga para as linhas nunca mostrarem "Sem categoria"/"-" enquanto ele carrega (CA13 da #87). Sem a permissao do catalogo, `/options` responde 403 e a listagem inteira cai em `.load-error` + toast, embora `GET /api/transactions`/`GET /api/users` respondam 200.

Regras que se aplicam:
- Permissao e sempre resolvida no back-end (`AccessControl`, default deny); `auth.can()` no front e so gate de UX.
- "Sem categoria" so vale para lancamento legado sem `categoryId`.
- Precedente: o Resumo (`DASHBOARD/VIEW`) ja devolve o nome da categoria resolvido no back-end (`DashboardRepository`, left join) sem exigir `CATEGORIES/VIEW`.
- Filtros ficam em memoria (`ListStateService`), limpos no logout; troca de perfil so vale no proximo login.
- `categoryId`/`profileId` sao obrigatorios na API; hoje, sem acesso ao catalogo, `transaction-form`/`user-form` mostram toast do 403 e dropdown vazio.
- A Central publica os filtros de Lancamentos (com Categoria) e de Usuarios (com Perfil).

## Criterios de aceite

- [x] CA1: `transactions.spec.ts` cobre `GET /api/transactions` -> 200 com N itens e `can('CATEGORIES','VIEW') = false`: a tabela renderiza as N linhas, a paginacao reflete `totalItems`, nao ha `.load-error` nem toast de erro.
- [x] CA2: idem em `users.spec.ts` para `GET /api/users` -> 200 com `can('PROFILES','VIEW') = false`.
- [x] CA3: `GET /api/transactions` e `GET /api/transactions/{id}` devolvem `categoryName` (nome da categoria gravada, inclusive inativa; `null` quando `categoryId` e `null`); `GET /api/users` e `GET /api/users/{id}` devolvem `profileName` (`null` quando `profileId` e `null`), resolvidos na propria consulta. Coberto em `TransactionResourceTest`/`UserResourceTest`, com caso de categoria inativa e de lancamento sem categoria.
- [x] CA4: a coluna Categoria de Lancamentos e a coluna Perfil de Usuarios exibem `categoryName`/`profileName` da propria linha, sem usar `/categories/options`/`/profiles/options` para isso; "Sem categoria"/"-" so aparecem quando o registro nao tem `categoryId`/`profileId`. Coberto nos dois `*.spec.ts`, com e sem permissao do catalogo.
- [x] CA5: CA13 da #87 mantido: com `/options` pendente (nunca respondido no teste), as linhas ja exibem o nome correto e nunca "Sem categoria"/"-" indevido.
- [x] CA6: sem `CATEGORIES/VIEW`, o painel de Filtros de Lancamentos nao renderiza o campo Categoria e nenhuma requisicao a `/categories/options` e feita; sem `PROFILES/VIEW`, idem para o campo Perfil de Usuarios e `/profiles/options`. Com a permissao, o filtro segue como na #87. Os demais filtros funcionam nos dois casos.
- [x] CA7: sem a permissao do catalogo e com filtro de Categoria/Perfil restaurado do `ListStateService`, o rotulo do filtro ativo nao exibe texto enganoso ("Sem categoria", "-", id cru nem nome de outro registro): exibe "Categoria: indisponível"/"Perfil: indisponível". Coberto nos dois `*.spec.ts`.
- [x] CA8: com a permissao do catalogo e `/options` -> 500 (ou erro de rede), a listagem exibe as linhas com o nome vindo do back-end, um unico toast de erro e o filtro de Categoria/Perfil sem opcoes; a proxima carga da listagem repete `/options`. Coberto nos dois `*.spec.ts`.
- [x] CA9: sem `CATEGORIES/VIEW`, o `transaction-form` (inclusao e edicao) nao exibe o dropdown de Categoria nem toast de erro, e mostra no lugar a mensagem "Seu perfil não tem permissão para ver Categorias, por isso não é possível escolher a categoria."; sem `PROFILES/VIEW`, o `user-form` faz o mesmo com "Seu perfil não tem permissão para ver Perfis, por isso não é possível escolher o perfil.". Na edicao sem troca de tipo, o `categoryId`/`profileId` ja gravado continua sendo enviado no PUT (comportamento atual preservado). Coberto em `transaction-form.spec.ts`/`user-form.spec.ts`, inclusive com `/options` -> 403.
- [x] CA10: nenhuma regra muda nos formularios: `POST /api/transactions` sem `categoryId` segue 400 "A categoria é obrigatória." e `POST /api/users` sem `profileId` segue 400 "O perfil é obrigatório."; os testes existentes de `transaction-form.spec.ts`/`user-form.spec.ts` com permissao seguem verdes sem alteracao de expectativa.
- [x] CA11: permissao continua imposta no back-end: `/categories/options`, `/categories/{id}`, `/profiles/options` e `/profiles/{id}` seguem 403 sem o `VIEW` da propria tela (`ListingSecurityTest` verde e inalterado nessas assercoes); nenhum endpoint novo e criado; o unico dado novo exposto e o nome da categoria/perfil do proprio registro ja visivel.
- [x] CA12: a Central (`TransactionsAreaContent`/`UsersAreaContent`) descreve o comportamento final: filtro de Categoria/Perfil oculto sem permissao de ver Categorias/Perfis, e o formulario informando que nao e possivel escolher — sem afirmar regra que o codigo nao faz; `DocumentationContentTest` verde.
- [x] CA13: as duas varreduras de acentuacao de `knowledge/architecture.md` (secao "Idioma") continuam vazias.
- [x] CA14: `./mvnw test` e `npm test` completos verdes.

## Fora de escopo

- Mudar quem pode ver/editar categorias ou perfis, liberar `/options` para quem tem `CREATE`/`EDIT` em Lancamentos/Usuarios, ou criar endpoint de catalogo.
- Item "Correção" em Novidades 1.0.2: a regressao nunca foi publicada.
- Atualizar `knowledge/transactions.md`/`users.md`: feito pela etapa `sync-knowledge`.
- Demais telas paginadas (Categorias, Perfis), que nao dependem de catalogo de outra tela.

## Decisoes

- 2026-09-24 (P1): o back-end devolve `categoryName` no `TransactionResponse` e `profileName` no `UserResponse`, resolvidos na propria consulta paginada; as linhas deixam de depender de `/options` para o nome. Nenhum endpoint expoe o catalogo a quem nao tem VIEW da tela dele — so o nome do registro ja visivel. Descartado: tratar 403 como "sem catalogo" com texto "indisponivel" na coluna.
- 2026-09-24 (P2): sem `CATEGORIES/VIEW`/`PROFILES/VIEW` o campo de filtro fica oculto e a tela nem chama `/options` (mesmo padrao do menu). Rotulo de filtro restaurado nesse cenario, se ocorrer, nao pode ser enganoso ("Categoria: indisponível").
- 2026-09-24 (P3): muda so a experiencia dos formularios — mensagem clara em portugues no lugar do dropdown vazio e do toast do 403. Regra inalterada: `/options` segue exigindo VIEW da propria tela, categoria/perfil seguem obrigatorios e validados no back-end.
- 2026-09-24 (P4): falha real do catalogo (5xx/rede) degrada — lista normal com nomes do back-end, aviso de erro, filtro sem opcoes, nova tentativa na proxima carga.
- Os textos exatos das mensagens do CA9 e do rotulo do CA7 sao propostos por esta spec a partir da decisao; ajuste de redacao nao muda o criterio desde que o sentido (sem permissao -> nao e possivel escolher / indisponivel) se mantenha.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/89 (origem: #87 / PR #88, commit d4a5a2c)
- Conhecimento consultado: `knowledge/` README, architecture, auth-and-permissions, transactions, users, categories, documentation, dashboard (`categoryBreakdown`); `specs/87-*` (CA13)
- Codigo conferido: `transactions.ts`, `users.ts`, `transaction-form.ts`, `user-form.ts`, `list-state.service.ts`, `TransactionResponse`, `UserResponse`, `DashboardRepository`, `TransactionsAreaContent`, `UsersAreaContent`
