# Briefing — issue 89

## Regras que restringem esta mudanca

- Permissao e sempre resolvida no back-end (`AccessControl`, default deny, 403 generico "Você não tem permissão para realizar esta ação."); `auth.can()` no front e so gate de UX. Nenhum endpoint novo; `/categories/options`, `/categories/{id}` (`CATEGORIES/VIEW`) e `/profiles/options`, `/profiles/{id}` (`PROFILES/VIEW`) continuam como estao (`knowledge/auth-and-permissions.md`, `knowledge/backend-patterns.md` "Listagens paginadas").
- `categoryId` e obrigatorio no request (`@NotNull`, "A categoria é obrigatória."), mas a coluna e nullable: lancamento legado sem categoria segue listado; "Sem categoria" so vale para ele (`knowledge/transactions.md` "Campos").
- `profileId` obrigatorio (`@NotNull`, "O perfil é obrigatório."); `profile_id` e anulavel no banco (`knowledge/users.md`).
- Categoria inativa ja gravada continua valendo no lancamento (nome precisa sair mesmo inativa); categoria em uso nao pode ser excluida (409), entao nao ha `categoryId` orfao (`knowledge/categories.md`).
- `GET /transactions` escopado por `userId` na consulta; `GET /users` exclui o `super_admin` oculto da lista e do `totalItems` (`searchVisible`/`findVisibleById`). O nome resolvido nao pode mudar esse escopo nem a contagem (`knowledge/backend-patterns.md`, `knowledge/users.md`).
- Precedente: o Resumo ja devolve o nome da categoria resolvido no back-end por left join (`DashboardRepository.categoryBreakdown`) sem exigir `CATEGORIES/VIEW` (`knowledge/dashboard.md`).
- Filtros e pagina ficam no `ListStateService` (memoria, limpo no logout): um filtro de Categoria/Perfil pode ser restaurado numa tela que nao consegue mais resolver o nome (`knowledge/frontend-ui.md`).
- Toasts: falha tecnica (5xx/rede) = Falha, 403 = Alerta; `classifyHttpError` devolve `null` no 401 (o interceptor avisa). De-duplicacao: mesmo tipo + mesmo texto nao empilha — lista e catalogo falhando juntos com a API fora devem dar um toast so (`knowledge/frontend-ui.md` "Feedback ao usuario").
- Central de Documentacao: toda afirmacao publicada tem origem no codigo; linguagem de usuario, sem identificador tecnico; paragrafo <= 600 caracteres (`DocumentationContentTest`) (`knowledge/documentation.md`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../transactions/FinancialTransaction.java` | entidade, `categoryId` nullable | ganha `categoryName` so leitura (`@Formula`) |
| `backend/.../transactions/TransactionResponse.java` | record sem nome | + `categoryName` |
| `backend/.../transactions/TransactionResource.java` | `validateCategory` nao devolve nada | devolve a `Category`; POST/PUT respondem com o nome dela |
| `backend/.../users/AppUser.java` | entidade, `profileId` nullable | ganha `profileName` so leitura (`@Formula`) |
| `backend/.../users/UserResponse.java` | record sem nome | + `profileName` |
| `backend/.../users/UserResource.java` | `requireProfileExists` void | devolve o `Profile`; POST/PUT respondem com o nome dele |
| `backend/.../documentation/content/TransactionsAreaContent.java`, `UsersAreaContent.java` | descrevem filtros e campos | + filtro oculto e aviso no cadastro sem permissao |
| `frontend/src/app/core/models.ts` | `Transaction`, `AppUserSummary` | + `categoryName`, `profileName` |
| `frontend/src/app/features/transactions/transactions.{ts,html}` | `Promise.all` lista + catalogo | lista sozinha; catalogo so com `CATEGORIES/VIEW`, em paralelo, falha degrada |
| `frontend/src/app/features/users/users.{ts,html}` | idem com perfis | idem com `PROFILES/VIEW` |
| `frontend/src/app/features/transactions/transaction-form.{ts,html}` | sempre chama `/options?type=` e `/categories/{id}` | sem permissao: nenhuma das duas, mensagem no lugar do dropdown |
| `frontend/src/app/features/users/user-form.{ts,html}` | sempre chama `/profiles/options` | sem permissao: nao chama, mensagem no lugar do dropdown |
| `*.spec.ts` dos 4 componentes; `TransactionResourceTest`, `UserResourceTest` | testes atuais | casos novos + helpers com permissao explicita |

## Convencoes aplicaveis

- Todo texto exibido em portugues acentuado. Varreduras (CA13), devem sair vazias:
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  A do front cobre `*.spec.ts` (titulo de teste e fixture); `indisponivel` casa — escrever "indisponível". Comentario novo em `.java`/`.ts` tambem entra.
- `styles.scss` e o unico arquivo com cor literal; classe nova de aviso consome `var(--token)`. Varredura: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` vazia.
- Testes de componente: `httpMock.verify()` no `afterEach`; app zoneless — `createComponent` ja dispara `ngOnInit`, entao permissao (`superAdmin`/`permissions`) precisa estar setada **antes** do `createComponent`. Requisicao nova/removida no `ngOnInit` quebra a suite inteira: ajuste os helpers (`render`/`setup`/`create`) primeiro (`knowledge/testing.md`).
- Tela com mais de uma resposta: spec na ordem desfavoravel (catalogo pendente, catalogo falhando) (`knowledge/testing.md`).
- Sem comentario salvo "porque" nao obvio; os comentarios atuais de `loadCategories`/`loadProfiles` ficam falsos e devem ser reescritos.

## Consultas fora do briefing

Nenhuma ate agora.
