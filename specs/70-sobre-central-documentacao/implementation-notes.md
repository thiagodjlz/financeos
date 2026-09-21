# Notas de implementacao

Branch: `feature/issue-70-sobre-central-documentacao` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: **44 de 44 concluidas** (ver `tasks.md`).

## Nome conferido do check constraint (criterio 2)

Consultado na base local **antes** de escrever a `V13`, com a stack ainda no ar:

```
$ docker compose exec -T postgres psql -U financeos -d financeos \
    -c "select conname, contype from pg_constraint where conrelid = 'profile_permissions'::regclass order by contype, conname;"

                conname                | contype
---------------------------------------+---------
 profile_permissions_screen_check      | c
 profile_permissions_profile_id_fkey   | f
 profile_permissions_pkey              | p
 profile_permissions_profile_screen_uk | u
(4 rows)
```

Confirma os dois nomes que a `V13` cita: o check `profile_permissions_screen_check` (nomeado explicitamente na `V9`) e a unique `profile_permissions_profile_screen_uk` (`V5`), usada no `on conflict on constraint` que torna o seed idempotente.

Contagem por tela capturada **antes** da subida, para a comparacao do criterio 48:

```
    screen    | can_view | count
--------------+----------+-------
 CATEGORIES   | f        |     1
 CATEGORIES   | t        |     1
 DASHBOARD    | t        |     2
 PROFILES     | f        |     1
 PROFILES     | t        |     1
 TRANSACTIONS | f        |     1
 TRANSACTIONS | t        |     1
 USERS        | f        |     1
 USERS        | t        |     1
(9 rows)
```

Perfis existentes na base local: `Administrador` (`00000000-...-000000000010`) e `Somente Dashboard` — o seed da `V13` deve produzir **duas** linhas `DOCUMENTATION`, uma por perfil.

## Arquivos alterados

### Backend — novos

- `backend/src/main/java/br/com/financeos/documentation/DocumentationResource.java` — unico `@GET /documentation`, com `accessControl.require(Screen.DOCUMENTATION, Action.VIEW)` na primeira linha. Sem repositorio, sem estado, sem verbo de escrita no pacote.
- `.../documentation/{DocumentationResponse,DocumentationArea,DocumentationSection,DocumentationBlock,DocumentationTable}.java` — contrato tipado. A introducao e campo proprio de `DocumentationResponse`, separada de `areas`, para que "exatamente 5 areas" seja afirmacao testavel.
- `.../documentation/content/DocumentationContent.java` — indice que monta a resposta (introducao + 5 areas na ordem do menu).
- `.../documentation/content/{Overview,SummaryArea,TransactionsArea,CategoriesArea,UsersArea,ProfilesArea}Content.java` — a fonte de conteudo de producao, redigida a partir de `knowledge/*.md` e do codigo (tabela de rastreamento abaixo).
- `backend/src/main/resources/db/migration/V13__add_documentation_screen.sql` — recria o check com os 6 valores e semeia `can_view = true` / escrita `false` para todo perfil, de forma idempotente. Nenhum `update` em linha preexistente.
- `backend/src/test/java/br/com/financeos/documentation/{DocumentationResourceTest,DocumentationSecurityTest,DocumentationContentTest}.java`.

### Backend — alterados

- `.../profiles/Screen.java` — um unico valor novo, `DOCUMENTATION`.
- `.../profiles/ProfileResource.java` — `savePermissions` grava `canView` como enviado e forca `canCreate/canEdit/canDelete = false` para `DOCUMENTATION`. Unica regra nova fora do `AccessControl`; o diff do arquivo tem so isso.
- `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java` — metodo novo `shouldListEveryScreenInEffectivePermissions` (6 entradas em `/auth/me`). Os tres testes existentes nao foram tocados.
- `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java` — tres metodos novos (criterio 14) e a constante `WRITABLE_DOCUMENTATION_BODY`. Nenhum teste existente alterado.

### Frontend — novos

- `frontend/src/app/core/entry-route.ts` — `ENTRY_ROUTES`, `NO_ACCESS_ROUTE` e `resolveEntryRoute(auth)`. **Unico lugar do projeto que declara a ordem das rotas do menu**, e nao dispara requisicao nenhuma.
- `frontend/src/app/core/entry-route.spec.ts` — sete casos, incluindo os quatro do criterio 24 e o do superAdmin.
- `frontend/src/app/core/services/documentation.service.{ts,spec.ts}` — `content` em signal + `load()`.
- `frontend/src/app/features/documentation/documentation.{ts,html,scss,spec.ts}` — a Central. Uma `load()` por vida do componente; busca e troca de area sao estado (signal), nunca geometria.
- `frontend/src/app/features/no-access/no-access.{ts,html,spec.ts}` — rota neutra, sem `.scss` proprio (consome `.page-title`/`.empty-state` globais) e sem nenhuma requisicao.

### Frontend — alterados

- `core/models.ts` — `Screen` com 6 valores e as interfaces espelho do contrato da Central.
- `core/guards/permission.guard.ts` e `features/auth/login/login.ts` — **so** o destino do `navigate`, que passa a `resolveEntryRoute(...)`, mais o import. Toast, ordem das checagens, `ensureProfileLoaded()` e retorno intactos.
- `core/guards/permission.guard.spec.ts` e `features/auth/login/login.spec.ts` — casos novos; os existentes nao foram tocados.
- `app.routes.ts` — rotas `documentation` (com `permissionGuard`) e `no-access` (sem `canActivate` proprio). `''` e `**` inalterados.
- `layout/main-layout/main-layout.{ts,html}` — `NavGroup` ganha `'about'` (mesmo signal `openGroup`), `canSeeAbout()`/`isAboutActive()` e o terceiro grupo, ultimo do `<nav>`.
- `layout/main-layout/main-layout.spec.ts` — `4 -> 5` nas duas contagens exatas, `'Sobre'` no fim da lista exata de `aria-label`, e quatro testes novos.
- `features/profiles/profiles.{ts,html,spec.ts}` — sexta linha da matriz com metadado `viewOnly`, template renderizando so a celula "Ver" (com tres `<td>` vazios, **sem `data-label`**), e `20 -> 21` com a sexta linha em `SCREEN_ROWS`.
- `styles.scss` — um token novo, `--fs-doc-area-title: 20px`, para o degrau tipografico do titulo de area.
- `app.config.ts` — `provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' }))` (rodada de ajustes, desvio 10).
- `app.config.spec.ts` — **novo**, dois casos que provam a rolagem no topo a cada navegacao (rodada de ajustes, desvio 10).

## Tabela de rastreamento das regras publicadas (criterio 36)

Uma linha por afirmacao de regra publicada na Central. Nenhuma linha tem origem "inferido".

### Introducao — "Como utilizar o sistema"

| Afirmacao na Central | Origem |
|---|---|
| O FinanceOS e um sistema de controle financeiro pessoal | `README.md:3` |
| Lancamento = entrada/saida com data, descricao, valor, tipo e categoria | `knowledge/transactions.md`, "Campos" |
| Categoria classifica o lancamento e e de um tipo so | `knowledge/categories.md`, "Campos" (`type: CategoryType`) |
| Periodo = par mes/ano usado pelo Resumo | `knowledge/dashboard.md`, "Regras" (`summary?year&month`) |
| Perfil = conjunto de permissoes | `knowledge/auth-and-permissions.md`, "Modelo" |
| Permissao = Ver, Incluir, Alterar ou Excluir | `knowledge/auth-and-permissions.md`, "Modelo" (`Action`); rotulos em `profiles.html:32-36` |
| O trilho se abre por ponteiro/foco e se recolhe ao navegar | `knowledge/architecture.md`, "Menu lateral como trilho de icones" |
| Composicao dos grupos do menu (Resumo, Lancamentos, Cadastros, Configuracoes, Sobre) | `frontend/src/app/layout/main-layout/main-layout.html` (grupo "Sobre" criado por esta issue) |
| Abaixo de 680px o menu vira gaveta, aberta pelo botao Menu e fechada com Esc | `knowledge/architecture.md`, "Responsividade e mobile" |
| O menu mostra so as telas com permissao de Ver | `knowledge/auth-and-permissions.md`, "Frontend" (bullet do menu lateral) |
| Esconder o item nao e a trava: a URL tambem e recusada, com aviso e retorno | `knowledge/auth-and-permissions.md`, "Frontend" (`permission.guard.ts`) |
| A autorizacao e resolvida no servidor a cada pedido | `knowledge/auth-and-permissions.md`, "Login e JWT" ("Sem roles/claims de permissao no token") |
| A sessao dura 12 horas | `knowledge/auth-and-permissions.md`, "Login e JWT" (TTL 12h) |
| Ajuste de permissao se faz na tela de Perfis | `knowledge/auth-and-permissions.md`, "Perfis" |

### Area "Resumo"

| Afirmacao na Central | Origem |
|---|---|
| O Resumo e a tela de abertura do sistema | `frontend/src/app/app.routes.ts:15` (`redirectTo: 'dashboard'`) |
| Nada e cadastrado na tela; ela so le lancamentos ja registrados | `knowledge/dashboard.md`, cabecalho ("o dashboard e 100% derivado de transacoes") |
| Os numeros sao sempre os do proprio usuario | `knowledge/dashboard.md`, "Regras" ("escopado por `user_id`, como todas as consultas do dashboard") |
| Quatro indicadores: Receitas, Despesas, Pendentes e Saldo | `knowledge/dashboard.md` ("Ordem dos 4 cards"); rotulo "Pendentes" em `dashboard.html:54` |
| Grafico Evolucao anual com os doze meses | `knowledge/dashboard.md`, "Evolucao mensal" e "Painel Evolucao anual" |
| Painel Detalhamento separado em Receitas e Despesas | `knowledge/dashboard.md`, painel "Detalhamento" |
| Saudacao com o primeiro nome, variando com a hora do dia | `knowledge/dashboard.md`, "Saudacao personalizada no topo" |
| Ano e Mes sao listas de opcoes, sem digitacao | `knowledge/dashboard.md`, "Campos Ano e Mes do cabecalho" |
| A lista de anos traz os anos em que o usuario tem lancamentos | `knowledge/dashboard.md`, `GET /dashboard/periods` |
| A lista de meses traz os meses do ano escolhido | `knowledge/dashboard.md`, `availableMonths()` |
| Trocar de ano reposiciona no maior mes disponivel quando o mes nao existe la | `knowledge/dashboard.md`, `onYearChange()` |
| Receitas = receitas do mes, exceto as canceladas | `knowledge/dashboard.md`, `total_income` |
| Despesas = so as despesas com situacao Pago | `knowledge/dashboard.md`, `total_expense` |
| Pendentes = so as despesas com situacao Pendente | `knowledge/dashboard.md`, `pending_expense` |
| Saldo = Receitas menos Despesas pagas | `knowledge/dashboard.md`, `balance = totalIncome - paidExpense` |
| Despesa pendente nao reduz o Saldo e aparece so no indicador Pendentes | `knowledge/dashboard.md`, "Totais" + `pending_expense` ("unico lugar do Resumo") |
| Lancamentos cancelados nao entram em nenhum total | `knowledge/dashboard.md`, `total_income` / `total_expense` |
| Mes sem lancamentos abre zerado, com "Sem dados no periodo" | `knowledge/dashboard.md`, "Mes sem dados nunca e erro" |
| Ano sem lancamentos e recusado com "Nao ha lancamentos no ano informado." | `knowledge/dashboard.md`, "Regras" (issue #69) |
| **Excecao 1**: o ano corrente sempre aparece, mesmo sem lancamento | `knowledge/dashboard.md`, `GET /dashboard/periods` ("o ano corrente sempre aparece, com `months: []`") |
| **Excecao 2**: no ano corrente o mes corrente sempre aparece na lista | `knowledge/dashboard.md`, `availableMonths()` ("no ano corrente, devolve a uniao dos meses com dados com o mes corrente") |
| **Excecao 3**: lancamento cancelado continua contando como periodo disponivel | `knowledge/dashboard.md`, `GET /dashboard/periods` ("sem filtro de `status`"); `knowledge/transactions.md`, "Sem hard delete" |
| Filtrar meses e disponibilidade de lista, nao validacao | `knowledge/dashboard.md`, "Filtrar meses e disponibilidade de lista, nao validacao" |
| O grafico sempre desenha os doze meses | `knowledge/dashboard.md`, "Evolucao mensal" (zero-preenchido) |
| A linha de saldo e do proprio mes, nao um acumulado | `knowledge/dashboard.md`, D1 da issue #48 |
| A linha termina no ultimo mes com movimento | `knowledge/dashboard.md`, D2 da issue #48 |
| Informativo do mes por ponteiro, toque ou setas do teclado | `knowledge/dashboard.md`, D4 da issue #48 |
| No Detalhamento o numero e a quantidade de categorias, nao o valor somado | `knowledge/dashboard.md`, painel "Detalhamento" (issue #18) |
| Lancamentos antigos sem categoria aparecem como "Sem categoria" | `knowledge/dashboard.md`, `categoryBreakdown` |
| Nao ha botao de atualizar; a tela recarrega ao trocar Ano ou Mes | `knowledge/dashboard.md`, "Sem botao Atualizar" |

### Area "Lancamentos"

| Afirmacao na Central | Origem |
|---|---|
| A tela tem o formulario Novo lancamento e a tabela Ultimos lancamentos | `frontend/src/app/features/transactions/transactions.html:11` e `:108` |
| A tabela lista do mais recente para o mais antigo | `backend/.../transactions/TransactionRepository.java:57` (`order by transactionDate desc, createdAt desc`) |
| A correcao e feita na propria linha da tabela | `knowledge/transactions.md`, "Frontend" (edicao inline) |
| Data obrigatoria, iniciada no dia de hoje | `backend/.../transactions/TransactionRequest.java:15`; `frontend/.../transactions.ts:20` |
| Descricao obrigatoria, no maximo 255 caracteres | `backend/.../transactions/TransactionRequest.java:16` |
| Valor obrigatorio e maior que zero | `backend/.../transactions/TransactionRequest.java:17`; `knowledge/transactions.md`, "Regras" |
| Tipo obrigatorio: Despesa ou Receita | `TransactionRequest.java:18`; rotulos em `transactions.html:65-66` |
| Status Pendente/Pago existe so quando o Tipo e Despesa | `knowledge/transactions.md`, "status obrigatorio so para despesa" e "Frontend" |
| Categoria obrigatoria; a lista traz so categorias ativas do mesmo tipo | `knowledge/transactions.md`, "Validacao de categoria no backend" e "Frontend" |
| Mensagem "O valor deve ser maior que zero." | `knowledge/transactions.md`, "Regras" |
| Mensagem "A categoria deve ser do mesmo tipo do lancamento." | `knowledge/transactions.md`, "Validacao de categoria no backend" |
| Receita nao tem situacao | `knowledge/transactions.md`, "status = null para receitas" |
| Cancelado nao e opcao do campo Status | `knowledge/transactions.md`, "status = CANCELED nao entra via POST/PUT" |
| Cancelar nao apaga: vira Cancelado, segue consultavel e sai dos totais | `knowledge/transactions.md`, "Sem hard delete" |
| Trocar o Tipo limpa a categoria ja escolhida | `knowledge/transactions.md`, "Frontend" |
| Editar um lancamento cancelado e salvar o reativa | `knowledge/transactions.md`, "Sem hard delete" e "Frontend" |
| Uma linha em edicao por vez | `knowledge/transactions.md`, "Edicao inline" |
| Sair com alteracao pendente pede confirmacao | `knowledge/transactions.md`, "Edicao inline" |
| Categoria inativa ja gravada continua na edicao, marcada como Inativo | `knowledge/transactions.md`, "Frontend" (issue #20) |
| Lancamentos legados sem categoria aparecem como Sem categoria e exigem categoria ao editar | `knowledge/transactions.md`, "Campos" (DEC-2 da issue #45) e "Frontend" |
| Cada botao aparece conforme a permissao do perfil | `knowledge/auth-and-permissions.md`, "Frontend"; `transactions.html` (`*ngIf` por `can(...)`) |

### Area "Categorias"

| Afirmacao na Central | Origem |
|---|---|
| Categorias classificam lancamentos e alimentam o Detalhamento do Resumo | `knowledge/categories.md`, cabecalho; `knowledge/dashboard.md`, `categoryBreakdown` |
| A tela tem o formulario Nova categoria e a tabela Ultimos registros | `frontend/.../categories/categories.html:6` e `:64` |
| Nome, Tipo, Cor e Situacao sao os quatro campos, todos obrigatorios | `knowledge/categories.md`, "Regras" (issue #45) |
| A obrigatoriedade vale para criar e para alterar | `knowledge/categories.md`, "Regras" ("O mesmo DTO serve `POST` e `PUT`") |
| As categorias sao um catalogo compartilhado, nao por usuario | `knowledge/categories.md`, "Atencao, pegadinha do dominio" |
| Nome e tipo nao podem se repetir: "Ja existe uma categoria com esse nome e tipo." | `knowledge/categories.md`, "Regras" (`validateDuplicate`) |
| O mesmo nome pode existir como receita e como despesa | `knowledge/categories.md`, "Regras" (a unicidade e nome + tipo) |
| Excluir uma categoria e torna-la Inativa; a Situacao desativa e reativa | `knowledge/categories.md`, "Soft delete via `DELETE`..." e "`PUT` busca por `findByIdOptional`" |
| Categoria inativa sai do seletor de novos lancamentos mas continua nos antigos | `knowledge/categories.md`, `CategoryRepository.list(type)`; `knowledge/transactions.md`, "Frontend" |
| Na tabela a cor e um ponto e a Situacao e uma etiqueta Ativo/Inativo | `knowledge/categories.md`, "Frontend" (issue #35) |
| Uma linha em edicao por vez | `knowledge/categories.md`, "Edicao inline na tabela" |
| Sair com alteracao pendente pede confirmacao | `knowledge/categories.md`, "Edicao inline na tabela" |
| O formulario lateral so cria | `knowledge/categories.md`, "Formulario lateral somente de criacao" |

### Area "Usuarios"

| Afirmacao na Central | Origem |
|---|---|
| Cada pessoa entra com o proprio e-mail e senha e recebe um perfil | `knowledge/auth-and-permissions.md`, "Login e JWT"; `knowledge/users.md`, "Regras" |
| A tela tem o formulario Novo usuario e a tabela de usuarios | `frontend/.../users/users.html:6` e `:69` |
| Nome obrigatorio, no maximo 120 caracteres | `knowledge/users.md`, "Validacao e mensagens de erro" |
| E-mail obrigatorio, em formato valido, no maximo 180 caracteres | `knowledge/users.md`, "Validacao e mensagens de erro" |
| Senha de 8 a 72 caracteres; obrigatoria no cadastro e opcional na alteracao | `knowledge/users.md`, "Regras" (`UserCreateRequest`/`UserUpdateRequest`) |
| Perfil obrigatorio | `knowledge/users.md`, "Regras" (`profileId` `@NotNull`) |
| Status Ativo/Inativo disponivel na linha em edicao | `knowledge/users.md`, "Frontend" (select Ativo/Inativo) |
| Senha em branco na alteracao mantem a senha atual | `knowledge/users.md`, "A senha nunca e carregada" |
| E-mail unico: "E-mail ja cadastrado." | `knowledge/users.md`, "Regras" |
| O perfil escolhido precisa existir: "Perfil informado nao existe." | `knowledge/users.md`, "Regras" (`requireProfileExists`) |
| Nenhum usuario e apagado: Desativar so tira o acesso | `knowledge/users.md`, "Sem hard delete" |
| Quem esta inativo nao consegue entrar | `knowledge/auth-and-permissions.md`, "Login e JWT" (`valida active=true`) |
| Nao da para desativar a propria conta pelo botao Desativar: "Voce nao pode desativar a propria conta." | `knowledge/users.md`, "Regras" (checagem no `DELETE`) — ver Inconsistencia 1 |
| O formulario lateral so cadastra | `knowledge/users.md`, "Frontend" |
| Uma linha em edicao por vez | `knowledge/users.md`, "Edicao inline na tabela" |
| Sair com alteracao pendente pede confirmacao | `knowledge/architecture.md`, "Edicao inline e layout das tabelas de cadastro" |
| Desativar so aparece nas linhas de quem esta ativo | `knowledge/users.md`, "Frontend" |
| Trocar o perfil muda o que a pessoa ve ao entrar novamente | `knowledge/auth-and-permissions.md`, "Login e JWT" e "Frontend" (`me()` resolvido no login) |
| O nome cadastrado aparece no rodape do menu e, so o primeiro nome, na saudacao do Resumo | `knowledge/users.md`, "Regras" (issue #65) |

### Area "Perfis"

| Afirmacao na Central | Origem |
|---|---|
| Perfil e um conjunto de permissoes, atribuido na tela de Usuarios | `knowledge/auth-and-permissions.md`, "Modelo"; `knowledge/users.md`, "Regras" |
| Nome do perfil obrigatorio | `knowledge/auth-and-permissions.md`, "Perfis" (`@NotBlank`, "O nome e obrigatorio.") |
| A matriz tem uma linha por tela e quatro colunas de acao | `frontend/.../profiles/profiles.html:32-36` |
| Ver abre a tela; Incluir cria; Alterar corrige; Excluir remove | `knowledge/auth-and-permissions.md`, "Modelo" (`Action`); `backend/.../shared/AccessControl.java:47-52` |
| Excluir e cancelamento em Lancamentos, desativacao em Categorias e Usuarios, e remocao do perfil sem uso em Perfis | `knowledge/architecture.md:68` ("Exclusao **normalmente** e soft delete... so perfis sem uso e usuarios sao excecoes especificas"); `backend/.../profiles/ProfileResource.java:98-99` (`deleteById`) — redacao corrigida na rodada de ajustes, ver Inconsistencia 10 |
| As linhas seguem a ordem do menu e sao seis | `frontend/.../profiles/profiles.ts` (`SCREENS`, sexta linha criada por esta issue) |
| Sem Ver, a tela nao aparece no menu e nao abre pela URL | `knowledge/auth-and-permissions.md`, "Frontend" (menu lateral + `permission.guard.ts`) |
| Salvar substitui a matriz inteira | `knowledge/auth-and-permissions.md`, "Perfis" ("substituicao total") |
| Perfil em uso nao pode ser excluido: "Perfil em uso por usuarios." | `knowledge/auth-and-permissions.md`, "Perfis" |
| A linha Documentacao tem so a coluna Ver, porque a Central e so leitura | `backend/.../profiles/ProfileResource.java`, `savePermissions` (regra criada por esta issue) |
| Incluir/Alterar/Excluir so sao exercidos por botoes de dentro da tela, entao nao liberam nada sem o Ver | `frontend/.../core/guards/permission.guard.ts` (nega a rota sem `VIEW`); os botoes vivem nos templates das telas, sob `*ngIf="authService.can(...)"` |
| Cancelar age em duas etapas ao alterar um perfil | `knowledge/auth-and-permissions.md`, "Frontend (features/profiles/)" (issue #28) |
| Sem alteracao pendente, o primeiro clique ja sai da alteracao | `knowledge/architecture.md`, "Botao Cancelar nos formularios de cadastro" |
| Alterar um perfil muda o que as pessoas ligadas a ele veem ao entrar novamente | `knowledge/auth-and-permissions.md`, "Login e JWT" |
| O servidor confere cada permissao a cada consulta; esconder botao nao protege o dado | `knowledge/auth-and-permissions.md`, "`AccessControl`" e "Frontend" ("so gate de UX") |

## Inconsistencias e lacunas encontradas (criterio 37)

Registradas, **nao** resolvidas. Nenhum `knowledge/*.md` foi alterado nesta feature (`git status --porcelain knowledge/` sai vazio).

1. **A trava de autodesativacao existe so no `DELETE`.** `knowledge/users.md:12` diz explicitamente que `PUT /users/{id}` com `active: false` no proprio usuario **e aceito hoje** ("comportamento preexistente; fechar essa brecha e decisao de produto"). Como a tela tem os dois caminhos (botao Desativar e o campo Status da linha em edicao), a afirmacao do criterio 34 lida ao pe da letra — "o usuario nao pode desativar a propria conta" — seria uma regra que o sistema so aplica em metade dos caminhos. A Central publica a versao verificavel: o **botao Desativar** recusa, com a mensagem exata. O caminho pela edicao nao foi documentado nem como possivel nem como impossivel.
2. **O indicador chama-se "Pendentes" na tela, e "Pendente" na spec.** O criterio 31 e `knowledge/dashboard.md` escrevem o card como "Pendente"; `frontend/.../dashboard/dashboard.html:54` renderiza `Pendentes`. A Central usa o rotulo real da tela (criterio 38 manda usar o rotulo em portugues da UI).
3. **A tela de Categorias nao tem botao de excluir.** `knowledge/categories.md` e o criterio 33 falam em "excluir uma categoria" via `DELETE /categories/{id}`, mas `categories.html` so oferece "Editar" — na tela, a desativacao acontece pelo campo Situacao. A Central afirma as duas coisas de forma consistente (excluir equivale a tornar Inativa; o caminho na tela e a Situacao, que tambem reativa) sem inventar um botao que nao existe.
4. **`knowledge/auth-and-permissions.md` ficou desatualizado em tres pontos com esta feature**: a linha 10 lista o enum `Screen` com 5 valores; a linha 27 afirma que `effectivePermissions()` "sempre retorna as 5 `Screen`"; a linha 56 diz que `resolvePermissions()` "sempre devolve as 5 telas". Com `DOCUMENTATION` passam a ser 6. Nao corrigido aqui (fora de escopo, criterio 37) — material para `/pipeline:sync-knowledge`.
5. **`knowledge/auth-and-permissions.md:66` descreve o redirect antigo.** Diz que o `permission.guard.ts` "redireciona para `/dashboard`"; com a Decisao PA3 ele passa a levar para a primeira rota permitida, ou `/no-access`. Nao corrigido aqui.
6. **Parcelas e observacoes existem na API e nao na tela.** `TransactionRequest` tem `installmentNumber`, `installmentTotal` e `notes`, nenhum deles exposto em `transactions.html`; `knowledge/transactions.md:18` ainda registra que **nada valida** `installmentNumber <= installmentTotal` nem que os dois venham juntos. Nao viraram conteudo: documentar campo que o usuario nao consegue preencher seria descrever funcionalidade indisponivel.
7. **Subcategorias, importacao de Excel e recorrencia continuam declaradas e nao implementadas.** `parentId` e validado no backend mas "a UI atual nem expoe subcategorias" (`knowledge/categories.md:18`); `TransactionSource.EXCEL_IMPORT/RECURRENCE` existem no enum sem pacote Java correspondente (`knowledge/transactions.md:12`). Fora do conteudo por decisao da spec (criterio 35).
8. **A unique de categoria no banco nao dispara.** `knowledge/categories.md:17` registra que o Postgres trata NULLs como distintos e `user_id` e sempre NULL, entao a unicidade real e garantida em Java. A Central publica so o efeito observavel (nome + tipo nao se repetem, com a mensagem exata), sem descrever o mecanismo.
9. **"Ultimos lancamentos" e "Ultimos registros" nao tem limite.** O rotulo sugere um recorte, mas `TransactionRepository.java:57` ordena sem `limit` e `transaction.service.ts:13` busca a lista inteira. A Central diz que a tabela lista os lancamentos do mais recente para o mais antigo, sem afirmar recorte.
10. **"Excluir e sempre cancelamento ou desativacao" estava factualmente errado** (encontrado na revisao de redacao pedida apos a validacao manual). A coluna "Excluir" da area Perfis publicava que a acao de remocao "no sistema e sempre um cancelamento ou uma desativacao". `knowledge/architecture.md:68` diz **"normalmente"** e abre excecao explicita para perfis, e `ProfileResource.delete` (linhas 98-99) faz `permissionRepository.deleteByProfile(id)` + `repository.deleteById(id)` — remocao real. A propria tabela de Acoes da mesma area ja dizia "Remove o perfil". Corrigido para "um cancelamento em Lancamentos, uma desativacao em Categorias e em Usuarios, e a remocao do perfil sem uso em Perfis". Nenhum `knowledge/*.md` foi alterado.

## Acrescentar uma sexta area (criterio 47)

Arquivos que mudariam, e **so** eles:

1. `backend/src/main/java/br/com/financeos/documentation/content/<NovaArea>Content.java` — **novo**, no mesmo molde dos cinco existentes.
2. `backend/src/main/java/br/com/financeos/documentation/content/DocumentationContent.java` — **uma linha** acrescentada ao `List.of(...)`.

Nao mudam: o componente, o template, o `.scss`, a rota, o guard, o enum `Screen`, o `models.ts` nem migration alguma. O componente itera `[introducao, ...areas]` por um caminho unico e **nao tem nenhum `if` por id ou titulo de area** (`documentation.ts`, `allAreas`/`visibleAreas`/`activeArea`); o indice e a renderizacao usam a mesma lista; e o `.scss` estiliza por **tipo de bloco** (`.doc-paragraph`, `.doc-list`, `.doc-highlight`, tabela), nunca por area.

Ressalva honesta: um **teste** precisaria acompanhar — `DocumentationContentTest#shouldPublishIntroductionAndFiveAreas` fixa `assertEquals(5, ...)` e a lista de titulos. Teste nao esta entre os artefatos que o criterio 47 proibe tocar ("componente, template, SCSS, rota, guard, enum ou migration"), e a assercao exata e proposital — e ela que sustenta o criterio 29.

## Desvios em relacao ao plano e as tarefas

1. **Os `id` das areas nasceram alinhados as rotas, e nao como slugs em portugues.** O plano (e a T6/T8) previa `"resumo"`, `"lancamentos"`, ...; usei `overview`, `dashboard`, `transactions`, `categories`, `users`, `profiles`. **Motivo:** a varredura de acentuacao do backend (`knowledge/architecture.md:138`) traz `lancamento` e `periodo` **em minusculas**, entao o slug `"lancamentos"` num `.java` **casa** a varredura e acrescentaria uma ocorrencia nova, reprovando o criterio 46. Conferi com um arquivo de teste isolado antes de decidir. A observacao que a `tasks.md` (Lacuna 2) e o enunciado desta etapa deram como verificada — "o regex e sensivel a maiusculas, entao o slug em minuscula nao casa" — vale **so para a varredura do frontend** (`Lancamento`, com maiuscula); a do backend e outra. A propria Lacuna 2 apontava `"transactions"`, alinhado a rota, como saida aceitavel. O `id` nunca e exibido (serve de chave do indice e do `trackBy`), entao a troca nao afeta nenhum criterio de conteudo.
2. **`DocumentationSection.of(titulo, blocos...)`** foi acrescentado alem dos membros listados na T5, so para os arquivos de conteudo ficarem legiveis. Nao muda o contrato JSON.
3. **Dois testes a mais em `DocumentationContentTest`** (T15): `shouldGiveEveryAreaAUniqueIdentifier` e `shouldPublishTheMinimumSectionsOfEveryArea` — este ultimo cobre a parte do criterio 30 que a T15 descrevia em prosa ("secoes minimas presentes por area").
4. **Um teste a mais em `DocumentationSecurityTest`** (T14): `shouldAllowProfileWithDocumentationView`, o caminho positivo com a linha `DOCUMENTATION` concedida — fecha o par com os dois casos de 403 na mesma montagem.
5. **`main-layout.spec.ts` precisou de um terceiro ajuste de valor alem do `4 -> 5`.** A assercao exata `expect(buttons.map(... 'aria-label'))).toEqual([...])` lista os rotulos um a um; recebeu `'Sobre'` no fim. E a mesma natureza das contagens (valor deslocado pelo grupo novo), continua exata e nao afrouxa nada.
6. **Tres comentarios de codigo novos precisaram ser acentuados** depois que a T41 acusou. `app.routes.ts`, `documentation.ts` e `profiles.html` tinham comentarios com "nao"/"acoes" sem acento, que casavam a varredura do frontend e a fariam sair de 2 para 5 linhas. Foram reescritos acentuados. **Os 8 comentarios do baseline nao foram tocados**, como manda o criterio 46.
7. **T18, T42 e T43 foram executadas numa rodada posterior**, depois que o Docker Desktop (que caiu no meio da implementacao) voltou. Nenhum ajuste de codigo foi necessario: as suites passaram de primeira. Evidencia na secao "Execucao dos testes e da stack local".

8. **Alvo de toque do indice da Central ajustado apos a etapa 8 (2026-09-21).** A verificacao encontrou `.doc-area-link` com `min-height: 38px` tambem abaixo de 480px, enquanto `knowledge/architecture.md` fixa `--touch-target: 44px` ate essa largura e todo o resto do app respeita (botoes de formulario, itens da gaveta, botao de menu). Nenhum criterio de aceite exigia — o criterio 45 cita textualmente so o campo de busca, que ja cumpria —, mas era desvio de um padrao documentado do projeto. Decisao do usuario: corrigir antes da validacao manual. Acrescentado um bloco `@media (max-width: 480px)` em `documentation.scss` aplicando `min-height: var(--touch-target)` ao `.doc-area-link`. Arquivo foi de 1944 para 2035 bytes (budget `anyComponentStyle` de 8192).

9. **Indice da Central deixou de ser `sticky` fora do layout de duas colunas (2026-09-21, pedido do usuario).** Na validacao manual o usuario relatou que "em modo celular a tela acabou quebrando um pouco o layout": `.doc-index` tinha `position: sticky; top: 20px` **sem restricao de largura**, enquanto o `.content-grid` global colapsa para uma coluna em `@media (max-width: 1080px)`. Abaixo disso o indice ficava grudado no topo da janela (por baixo da barra fixa do mobile) com o conteudo rolando atras dele, sobrepondo texto e cortando a lista de areas. O `sticky` agora vive num `@media (min-width: 1081px)`, exatamente a faixa em que a segunda coluna existe; em telas estreitas o indice rola junto com a pagina e aparece inteiro antes do conteudo. Nenhum criterio mudou — era defeito de implementacao dos criterios 39 e 45. Revisado tambem, no mesmo arquivo, o resto do comportamento em tela estreita: nao ha outra regra posicionada (`fixed`/`sticky`/largura fixa) no `.scss` da Central, `.doc-content` mantem `overflow-wrap: anywhere`, e as tabelas do conteudo ja trazem `data-label` em todo `<td>` (entram no modo cartao pela regra global de 680px). `documentation.scss` foi de 2035 para 2090 bytes (budget `anyComponentStyle` de 8192, sem warning no `npm run build`).

10. **A rolagem volta ao topo a cada troca de tela (2026-09-21, pedido do usuario).** `provideRouter(routes)` virou `provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' }))` em `app.config.ts`. Como `.workspace` nao tem `overflow` proprio (quem rola e o documento), o mecanismo do proprio Angular resolve — sem `scrollTo` espalhado por componente. **A mudanca e global**, vale para todas as telas, e e o que o usuario pediu ("quando eu mudo de tela"). Nao conflita com o `onNavigate()` do menu (o `focus()` na `<section class="workspace">` acontece no clique, e a rolagem para o topo acontece depois do `NavigationEnd`) nem com o fechamento da gaveta no mobile. Coberta por `app.config.spec.ts`, com `ViewportScroller` substituido por um duble: conferi que os dois casos novos **falham** com o `provideRouter(routes)` antigo, entao o teste prova a configuracao do projeto e nao o framework.

11. **Revisao de redacao das sete fontes de conteudo (2026-09-21, pedido do usuario).** Partindo de "fale com quem administra o sistema", que o usuario apontou, os sete arquivos de `documentation/content/` foram relidos frase a frase. Mudancas de **forma**, sem alterar nenhuma regra publicada — a unica excecao e a correcao factual registrada na Inconsistencia 10:
   - `OverviewContent`: "fale com quem administra o sistema" -> "fale com o administrador do sistema" (e "um botao **de** que voce precisa", regencia); "o menu a esquerda e a **unica porta de entrada** das telas" -> "da acesso a todas as telas" (a frase se contradizia com a regra seguinte, que fala em digitar o endereco da tela); "Use o indice **ao lado**" -> "Use o indice das areas" (posicao que deixou de ser verdadeira no celular); "Quem **responde por** cada permissao" -> "Quem **confere** cada permissao", com ponto e virgula no lugar do travessao.
   - `SummaryAreaContent`: "Saudacao com o seu primeiro nome, **que muda** conforme a hora" (o que muda e o cumprimento, nao o nome) -> "Saudacao no alto da tela, com o seu primeiro nome e um cumprimento que muda conforme a hora do dia"; a frase truncada "...no ano informado. — diferente do mes vazio..." virou duas frases; "Passar o ponteiro, tocar ou usar as setas do teclado **sobre o grafico**" (regencia quebrada nos dois ultimos termos) -> "Passar o ponteiro sobre o grafico, toca-lo ou percorre-lo com as setas do teclado"; "Despesas pendentes sao **contabilizadas** em um unico lugar" -> "aparecem em um unico lugar da tela: o indicador Pendentes".
   - `TransactionsAreaContent`: "categoria de receita em despesa e recusada com..." (telegrafico) -> "usar uma categoria de receita em uma despesa e recusado com a mensagem..."; "essa situacao so e **atingida pelo cancelamento**" -> "so aparece quando o lancamento e cancelado"; "**sera preciso** escolher uma categoria" -> "e preciso".
   - `CategoriesAreaContent`: "quem tem permissao de ver Categorias ve a mesma lista" -> "todas as pessoas com permissao de ver Categorias enxergam a mesma lista" (sujeito ambiguo).
   - `UsersAreaContent`: "A tela de Usuarios **administra** quem tem acesso" -> "**controla** quem tem acesso" (tela nao administra; mesmo vicio que o usuario apontou na outra frase); "trocar **o** [campo de senha] e opcional: **deixando-o** em branco..." -> "preenche-lo e opcional: se voce deixa-lo vazio, a senha atual da pessoa e mantida; se preenche-lo, a senha e redefinida"; "o sistema recusa com Voce nao pode..." -> "recusa com **a mensagem** Voce nao pode...", padrao ja usado nas demais areas; desfeita a repeticao "perfil... sem perfil".
   - `ProfilesAreaContent`: "desde que nenhum usuario esteja usando **ele**" -> "nenhum usuario **o** esteja usando"; virgula na frase do efeito de alterar um perfil; e a correcao factual da coluna "Excluir" (Inconsistencia 10).
   - Os "Sair (linha) — Abandona a edicao da linha, **confirmando** se houver alteracao pendente" (gerundio ambiguo) viraram "Abandona a edicao da linha; se houver alteracao pendente, pede confirmacao antes de descarta-la", iguais nas tres areas que tem a acao.

   Conferido depois da revisao: `DocumentationContentTest` continua verde (limite de 600 caracteres por paragrafo, ausencia de identificador tecnico, alinhamento das tabelas, secoes minimas por area), a varredura de acentuacao do backend continua nas **6** linhas do baseline e a do frontend nas **2**, e a tabela de rastreamento acima continua batendo com o texto publicado: nenhuma linha passou a ter origem "inferido" e nenhuma regra nasceu ou sumiu.

## Ajustes pos-validacao (2026-09-21)

Tres pedidos do usuario depois da validacao manual da etapa 8, implementados e detalhados nos desvios 9, 10 e 11 acima: (a) layout da Central no celular, (b) rolagem de volta ao topo ao trocar de tela e (c) revisao do portugues de todo o conteudo publicado. Reexecucao completa depois dos tres:

- `./mvnw test` — **81 testes, 0 falhas** (mesmo numero de antes; nenhuma assercao afrouxada).
- `npm test` — **287 testes, 28 arquivos, 0 falhas** (285 antes; os 2 novos sao os de `app.config.spec.ts`).
- `npm run build` — sem nenhum warning de `anyComponentStyle`; `documentation.scss` em 2090 bytes e o chunk `documentation` em 8.09 kB.
- Varreduras de acentuacao **exatamente no baseline**: 6 linhas no backend (`DashboardResource.java`, `ProductionBootstrap.java`) e 2 no frontend (`styles.scss`).
- `docker compose up -d --build` executado para o usuario revalidar em `http://localhost`.

## Execucao dos testes e da stack local (T18, T42, T43)

O Docker Desktop caiu no meio da sessao de implementacao e voltou depois (engine 29.5.3); as tres tarefas que dependiam dele foram fechadas nesta rodada.

### `./mvnw test` — 81 testes, 0 falhas (T18, T42)

```
[INFO] Running br.com.financeos.HealthResourceTest                        Tests run:  1, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.auth.AuthResourceTest                     Tests run:  4, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.categories.CategoryResourceTest           Tests run: 17, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.dashboard.DashboardPeriodsSecurityTest    Tests run:  2, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.dashboard.DashboardResourceTest           Tests run: 13, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.documentation.DocumentationResourceTest   Tests run:  1, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.documentation.DocumentationSecurityTest   Tests run:  5, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.documentation.DocumentationContentTest    Tests run:  8, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.profiles.ProfileResourceTest              Tests run:  8, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.transactions.TransactionResourceTest      Tests run: 13, Failures: 0, Errors: 0
[INFO] Running br.com.financeos.users.UserResourceTest                    Tests run:  9, Failures: 0, Errors: 0
[INFO] Results:
[INFO] Tests run: 81, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

As suites de `dashboard`, `transactions`, `categories`, `users` e `HealthResourceTest` passaram **sem uma linha alterada** (`git status --porcelain` desses arquivos sai vazio). `AuthResourceTest` foi de 3 para 4 testes e `ProfileResourceTest` de 5 para 8, so por acrescimo.

**Conferencia de assercao afrouxada (T42).** `git diff backend/src/test | grep "^-"` sai **vazio**: nenhuma linha foi removida de teste de backend. No frontend, as unicas remocoes sao as admitidas, cada uma com contrapartida igual ou mais estrita:

```
- const SCREEN_ROWS = ['Resumo', 'Lançamentos', 'Categorias', 'Usuários', 'Perfis'];
+ const SCREEN_ROWS = ['Resumo', 'Lançamentos', 'Categorias', 'Usuários', 'Perfis', 'Documentação'];
-   expect(checkboxes()).toHaveLength(20);          +   expect(checkboxes()).toHaveLength(21);
-   expect(navButtons(fixture)).toHaveLength(4);    +   expect(navButtons(fixture)).toHaveLength(5);
-   expect(buttons).toHaveLength(4);                +   expect(buttons).toHaveLength(5);
```

(mais duas linhas de `import`, alargadas para trazer `Router`/`PermissionEntry`/`Screen`). A lista exata de `aria-label` de `main-layout.spec.ts` recebeu `'Sobre'` como **acrescimo**, sem remocao. `npm test` reconfirmado: **285 testes, 27 arquivos, todos passando**.

### Stack local (T43)

`docker compose up -d --build` subiu limpo. O banco estava na versao 12, entao a `V13` rodou **contra uma base que ja tinha as cinco telas antigas** — a melhor condicao possivel para provar os criterios 2, 3 e 48:

```
$ docker compose logs backend | grep -i flyway
INFO [org.flywaydb.core.internal.command.DbValidate] Successfully validated 13 migrations (execution time 00:00.031s)
INFO [org.flywaydb.core.internal.command.DbMigrate]  Current version of schema "public": 12
INFO [org.flywaydb.core.internal.command.DbMigrate]  Migrating schema "public" to version "13 - add documentation screen"
INFO [org.flywaydb.core.internal.command.DbMigrate]  Successfully applied 1 migration to schema "public", now at version v13 (execution time 00:00.021s)
```

Sem erro e sem warning de Flyway. `GET /api/health` responde `{"status":"UP","version":"1.0.2-dev"}` e `GET /api/documentation` sem token responde **HTTP 401**.

**Criterio 3 — uma linha `DOCUMENTATION` por perfil, nenhuma com `pp` nulo:**

```
$ select p.id, p.name, pp.can_view, pp.can_create, pp.can_edit, pp.can_delete
    from profiles p
    left join profile_permissions pp on pp.profile_id = p.id and pp.screen = 'DOCUMENTATION'
   order by p.name;

                  id                  |       name        | can_view | can_create | can_edit | can_delete
--------------------------------------+-------------------+----------+------------+----------+------------
 00000000-0000-0000-0000-000000000010 | Administrador     | t        | f          | f        | f
 ca6f042d-8f06-47a8-811a-99337abc2d7a | Somente Dashboard | t        | f          | f        | f
(2 rows)
```

Duas linhas para os dois perfis existentes, `can_view = true` e os tres flags de escrita `false`, nenhum `pp` nulo. Reforco: `select count(*) from profile_permissions where screen = 'DOCUMENTATION' and (can_create or can_edit or can_delete);` devolve **0**.

**Criterio 48 — nenhuma linha preexistente alterada.** Antes e depois da subida, lado a lado:

```
        ANTES                                    DEPOIS
    screen    | can_view | count          screen     | can_view | count
--------------+----------+-------     ---------------+----------+-------
 CATEGORIES   | f        |     1       CATEGORIES    | f        |     1
 CATEGORIES   | t        |     1       CATEGORIES    | t        |     1
 DASHBOARD    | t        |     2       DASHBOARD     | t        |     2
                                       DOCUMENTATION | t        |     2   <-- unica linha nova
 PROFILES     | f        |     1       PROFILES      | f        |     1
 PROFILES     | t        |     1       PROFILES      | t        |     1
 TRANSACTIONS | f        |     1       TRANSACTIONS  | f        |     1
 TRANSACTIONS | t        |     1       TRANSACTIONS  | t        |     1
 USERS        | f        |     1       USERS         | f        |     1
 USERS        | t        |     1       USERS         | t        |     1
(9 rows)                              (10 rows)
```

As nove linhas das cinco telas antigas sao identicas; a unica diferenca e a linha nova.

**Criterio 2 — o check aceita `'DOCUMENTATION'` e continua recusando `'FOO'`** (os dois em transacao com `rollback`, para nao sujar a base):

```
$ insert into profile_permissions (...) values (..., 'DOCUMENTATION', true, false, false, false);
INSERT 0 1
          resultado
-----------------------------
 insert DOCUMENTATION aceito

$ insert into profile_permissions (...) values (..., 'FOO', true, false, false, false);
ERROR:  new row for relation "profile_permissions" violates check constraint "profile_permissions_screen_check"
DETAIL:  Failing row contains (638ec459-..., 00000000-0000-0000-0000-0000000000ff, FOO, t, f, f, f).
```

**Criterio 2 — o seed e idempotente.** Reexecutando o proprio `insert ... on conflict` da `V13`:

```
 antes
-------
     2
INSERT 0 0
 depois
--------
      2
```

`INSERT 0 0`: nenhuma linha duplicada, a unique `profile_permissions_profile_screen_uk` absorveu a reexecucao como esperado.

## Resumo do que esta verde

- `./mvnw test` — **81 testes, 0 falhas** (baseline da `main`: 64; 17 novos nesta feature).
- `npm test` — **285 testes, 27 arquivos, 0 falhas** (baseline medido na T32: 255; 30 novos).
- `npm run build` — sem nenhum warning de `anyComponentStyle`; chunk `documentation` em 7.95 kB.
- `docker compose up -d --build` — `V13` aplicada da versao 12 sem erro; criterios 2, 3 e 48 conferidos no banco.
- Todas as varreduras da T41 limpas e acentuacao **exatamente no baseline** (6 backend, 2 frontend).
