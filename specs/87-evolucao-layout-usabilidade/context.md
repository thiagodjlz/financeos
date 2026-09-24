# Briefing — issue 87

## Regras que restringem esta mudanca

- Todo endpoint novo ou alterado comeca com `accessControl.require(Screen.X, Action.Y)`; o 403 e generico ("Você não tem permissão para realizar esta ação."). Checar permissao **antes** de validar parametro. (`knowledge/auth-and-permissions.md`)
- Parametro de query com erro proprio: ler cru por `@Context UriInfo` e parsear a mao (`@QueryParam` tipado falha na conversao fora do `BusinessExceptionMapper`); valor invalido vira `null` e responde a mensagem do chamador; nunca `ParamConverterProvider` global (modelo: `DashboardResource.queryParam/parseNumber`). Toda mensagem de excecao vira texto de tela: portugues acentuado, sem nome de enum/parametro. (`knowledge/backend-patterns.md`)
- Escopos: Lancamentos sempre pelo `userId` logado (`findByUserAndId`); Usuarios so por `listVisible`/`findVisibleById` (super_admin oculto nunca listado nem contado). (`knowledge/transactions.md`, `knowledge/users.md`)
- Categorias: `list(type)` com tipo = so ativas (dropdown de Lancamentos); sem tipo = todas, inclusive inativas (resolve o nome nas linhas). `PUT` busca sem filtro de ativo (permite reativar); `GET /{id}` hoje da 404 para inativa. (`knowledge/categories.md`)
- Lancamento: Categoria filtrada pelo Tipo (`?type=`), trocar para tipo incompativel limpa; placeholder "Selecione" (`value=""`, `required` nao bloqueia submit); categoria inativa ja gravada entra como opcao extra "Nome (Inativo)" e some ao trocar categoria/tipo; Status oculto para Receita, Despesa so "Pendente"/"Pago"; payload `{...form, amount: Number, status: INCOME ? null : status, categoryId: '' -> null}`. (`knowledge/transactions.md`)
- Usuarios: criacao `{name,email,password,profileId}` sem Situacao; edicao `{name,email,profileId,active,password: password || undefined}`, senha nunca carregada (`''`, nao conta como alteracao); protecoes da propria conta so no back (toast do 409). (`knowledge/users.md`)
- Categorias: payload `{name,type,color: '' -> null,active}`; valores iniciais nome vazio, Despesa, `#2f7d62`, Ativo; edicao usa `color ?? '#2f7d62'`. (`knowledge/categories.md`)
- Perfis: payload `{name, permissions}` com a matriz completa; destaque de campo so em `name`; snapshot com copia profunda (`clonePermissions`) porque `[(ngModel)]` muta os objetos. (`knowledge/auth-and-permissions.md`)
- Toasts: `toast.fromHttpError(err, fallback)`; Sucesso com os textos atuais por acao; acao sem HTTP nao toasta; erro da escrita separado do erro da recarga (`refreshAfterChange` de `categories.ts`). (`knowledge/frontend-ui.md`)
- Campo invalido: `FieldErrorState` + `focusFirstInvalidField` (`core/field-errors.ts`, foco na ordem do DOM); estilos globais. (`knowledge/frontend-ui.md`)
- Central e Novidades sao escritos a mao: linguagem de usuario, paragrafo <= 600 caracteres, sem identificador tecnico; mudanca visivel entra no bloco `1.0.2` (`VERSION` = `1.0.2-dev`). (`knowledge/documentation.md`)

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../{transactions,categories,users,profiles}/*Resource.java` | `GET` devolve lista inteira | pagina + filtros validados; `GET /{id}` e `/options` |
| `backend/.../*Repository.java` | `listByFilters`, `list(type)`, `listVisible` | consulta paginada + contagem |
| `backend/.../documentation/content/*AreaContent.java` (4) | formulario "à esquerda", edicao na linha | tela propria, Filtros, paginacao |
| `frontend/src/app/core/services/{transaction,category,user,profile}.service.ts` | `refresh()` da lista inteira | `list(filtros, pagina)`, `get(id)`, opcoes |
| `frontend/src/app/features/{transactions,categories,users,profiles}/` | formulario lateral + edicao inline | listagem paginada/filtravel + componente de cadastro |
| `frontend/src/app/app.routes.ts` | 1 rota por tela | `<tela>/new` e `<tela>/:id/edit` |
| `frontend/src/styles.scss` | utilitarios globais, 1080/680/480 | toolbar, filtros, paginacao, erro de carga |

## Convencoes aplicaveis

- Utilitario novo nasce em `styles.scss` (unico arquivo com cor literal; budget de 8 kB por `.scss` de componente); `@media` com literal 1080/680/480, nunca `var(--bp-*)`; `:hover` so dentro de `@media (hover: hover)`; toque 44px e campo 16px so ate 480px (`form-actions`, `row-actions`). (`knowledge/frontend-ui.md`)
- Tabela de cadastro: `table.fixed-layout` + `<colgroup>` + `col-actions` + `<th><span class="sr-only">Ações</span></th>`; `data-label` igual ao `<th>` em todo `<td>` (vira cartao a 680px). `.loading-state` + `aria-busy`; `.empty-state` so apos a resposta. Confirmacao via `core/confirm-dialog` ("Deseja sair sem salvar?", "Continuar editando"/"Sair sem salvar"). (`knowledge/frontend-ui.md`)
- Testes front: vitest + jsdom, DOM-driven, `HttpTestingController` + `verify()`; rota coringa no TestBed para `routerLink`/`navigate`; requisicao nova no `ngOnInit` exige ajustar os helpers antes; `<select [ngValue]>` via `selectedIndex`; nada de `setTimeout` no `toFake`. Back: 403 em classe sem `@TestSecurity` de classe, usuario/perfil de UUID constante por SQL nativo, limpeza no `@AfterEach`. (`knowledge/testing.md`)
- CA25 — as duas varreduras de idioma devem sair vazias (o regex do back casa `lancamento`/`periodo` minusculos; o do front casa `periodo` e `Descricao`/`Situacao`):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Cor literal fora de `styles.scss` (vazia): `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"`

## Consultas fora do briefing

Nenhuma ate agora.
