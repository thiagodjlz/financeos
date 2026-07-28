# Notas de implementacao

Branch: `feature/issue-39-ajustes-alertas` (mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 37 de 37 concluidas (ver `tasks.md`)

Suites no fim da rodada: `./mvnw test` 39 testes verdes (7 classes), `npm test` 138 testes verdes (19 arquivos), `npm run build` sem warning novo de budget `anyComponentStyle`.

## Arquivos alterados

### Backend — novos

- `backend/src/main/java/br/com/financeos/shared/ApiError.java` — record `ApiError(String message)`, corpo JSON dos erros de negocio.
- `backend/src/main/java/br/com/financeos/shared/FieldLabels.java` — mapa ordenado campo -> rotulo em portugues (`labelFor`) e a posicao de cada campo (`orderOf`), que define a ordem da frase agregada e a ordem estavel do `violations[]`.
- `backend/src/main/java/br/com/financeos/shared/ValidationExceptionMapper.java` — `@Provider @Priority(Priorities.USER) ExceptionMapper<ConstraintViolationException>`: 400 com `title`/`status`/`violations[]` no formato de hoje **mais** a `message` agregada. Separa violacoes de campo ausente (`@NotNull`/`@NotBlank`/`@NotEmpty`, lidas pelo `ConstraintDescriptor`) — que viram "Informe os campos obrigatórios: X, Y." — das demais, concatenadas com as proprias `message` dos DTOs. Mantem o header `validation-exception: true` do mapper embutido.
- `backend/src/main/java/br/com/financeos/shared/BusinessExceptionMapper.java` — `ExceptionMapper<WebApplicationException>`: repassa o status original, devolve a resposta intacta quando ja ha entity e so serializa `ApiError` quando a mensagem foi passada explicitamente (descarta o padrao `HTTP <status> <reason>` do JAX-RS e mensagens em branco). Nao existe mapper para `Exception`/`RuntimeException`.
- `backend/src/main/resources/db/migration/V11__accent_seeded_category_names.sql` — quatro `UPDATE` (`Salario`->`Salário`, `Cartao`->`Cartão`, `Bebe`->`Bebê`, `Emprestimo`->`Empréstimo`), cada um ancorado em `name + type + user_id is null + parent_id is null` e com guarda `not exists` contra duplicidade. UTF-8 sem BOM; `V1`..`V10` intactas.
- `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java` — 400 do login em portugues (com assercao de que nao ha texto default do Hibernate Validator), 401 com "Credenciais inválidas." no corpo e `GET /users` sem JWT continuando 401.

### Backend — alterados

- `.../transactions/TransactionRequest.java`, `.../categories/CategoryRequest.java`, `.../profiles/ProfileRequest.java`, `.../profiles/PermissionEntry.java`, `.../auth/LoginRequest.java` — `message` em portugues acentuado em todas as anotacoes de Bean Validation.
- `.../users/UserCreateRequest.java`, `.../users/UserUpdateRequest.java` — acentuacao das `message` que ja existiam (issue #26).
- `.../transactions/TransactionResource.java`, `.../categories/CategoryResource.java`, `.../users/UserResource.java`, `.../profiles/ProfileResource.java`, `.../auth/AuthResource.java`, `.../shared/AccessControl.java` — mensagens de negocio acentuadas; status HTTP e regras inalterados.
- `.../dashboard/DashboardResource.java` — as duas `BadRequestException` em ingles viraram "Informe o ano e o mês juntos." e "O mês deve estar entre 1 e 12." (com o mapper novo elas passam a chegar ao cliente).
- `backend/src/test/.../TransactionResourceTest.java` — dois testes novos (mensagem agregada "Informe os campos obrigatórios: Descrição, Valor." e `amount = 0` com a mensagem do `@DecimalMin`) e `message` no corpo dos quatro 400 de regra.
- `backend/src/test/.../CategoryResourceTest.java` — 400 nomeando "Nome", `message` no 409 de duplicidade e nos 400 de categoria pai.
- `backend/src/test/.../ProfileResourceTest.java` — 400 de `screen` ausente e de tela duplicada com `message`, e 409 de perfil em uso ("Perfil em uso por usuários.").
- `backend/src/test/.../UserResourceTest.java` — textos acentuados, `message` agregada no 400 de `{}`, `message` nos 409 de e-mail duplicado e de autodesativacao, `message` no 400 de perfil inexistente; `violations[]` intacto.
- `backend/src/test/.../DashboardResourceTest.java` — as duas `BadRequestException` com `message` acentuada.

### Frontend — novos

- `frontend/src/app/core/http-error.ts` + `.spec.ts` — camada unica de classificacao `classifyHttpError(err, fallback)` e as duas constantes de texto fixo de Falha.
- `frontend/src/app/core/services/toast.service.ts` + `.spec.ts` — pilha em signal, `success`/`warning`/`error`/`dismiss`/`fromHttpError`, duracoes 3800/5200/sem timer, limite de 3, de-duplicacao por tipo+texto e remocao 260 ms apos o inicio da saida.
- `frontend/src/app/core/toast/toast-host.{ts,html,scss,spec.ts}` — componente `app-toast-host` com os tres SVG do mockup, botao Fechar (`aria-label="Fechar"`), barra de progresso so quando ha auto-fechamento, container fixo `top/right: 24px` / `z-index: 999` / `340px` e os `@keyframes toastIn`/`toastOut`/`toastBar`. Sem cor literal — so tokens.
- `frontend/src/app/core/interceptors/auth.interceptor.spec.ts`, `frontend/src/app/core/guards/permission.guard.spec.ts`, `frontend/src/app/features/auth/login/login.spec.ts`, `frontend/src/app/features/dashboard/dashboard.spec.ts` — specs novos.

### Frontend — alterados

- `frontend/src/styles.scss` — `--fs-toast-msg: 13px` em `:root`; regra global `.status-bar` removida.
- `frontend/src/app/app.html` / `app.ts` — `<app-toast-host />` depois do `<router-outlet />` (host unico, vale tambem no `/login`).
- `frontend/src/app/core/interceptors/auth.interceptor.ts` — Alerta "Sua sessão expirou. Entre novamente." no 401 **apenas** quando `!isAuthEndpoint`; logout, redirect e re-lancamento do erro preservados.
- `frontend/src/app/core/guards/permission.guard.ts` — Alerta "Você não tem permissão para acessar esta tela." antes do `router.navigate(['/dashboard'])`.
- `frontend/src/app/features/transactions/transactions.{ts,html}` — sucesso em criar/editar/cancelar, `fromHttpError` nos `catch` (que passaram a receber o erro) e em `loadData`; signal `error` e faixa removidos.
- `frontend/src/app/features/categories/categories.{ts,html}` — sucesso na criacao e na edicao inline; `saveErrorMessage`/`conflictMessage` locais substituidos por `fromHttpError`; signal `error` e faixa removidos.
- `frontend/src/app/features/users/users.{ts,html,scss}` — sucesso em `save`/`saveEdit`/`deactivate`; toast alimentado pela mensagem agregada do backend; `fieldErrors`/`editFieldErrors` preservados; `ERROR_DISMISS_MS`, `errorTimeout`, `showError`, `dismissError`, signal `error`, `OnDestroy`, faixa dismissivel e as regras `.status-bar.dismissible`/`.status-close` removidos.
- `frontend/src/app/features/profiles/profiles.{ts,html}` — sucesso em criar/editar/excluir, erros via `fromHttpError`, faixa removida.
- `frontend/src/app/features/dashboard/dashboard.{ts,html}` — falha de carga vira toast de Falha; faixa removida; `.empty-state` "Sem dados no período" preservado.
- `frontend/src/app/features/auth/login/login.{ts,html}` — 401 dispara `toast.error('Credenciais inválidas. Tente novamente.')`; demais erros pela classificacao padrao; faixa do card removida.
- `frontend/src/app/layout/main-layout/main-layout.html` — "Lançamentos", "Configurações", "Usuários" acentuados no rotulo e nos `title`/`aria-label` do estado recolhido.
- `frontend/src/app/features/*/*.html` e `*.ts` — todo texto exibido acentuado (titulos, cabecalhos, labels, placeholders, `.empty-state`, modal, rotulos de tela em `profiles.ts`).
- Specs existentes atualizados: `transactions.spec.ts`, `categories.spec.ts`, `users.spec.ts`, `profiles.spec.ts`, `main-layout.spec.ts` — assercoes de `.status-bar` migradas para `ToastService.toasts()`, casos novos de Sucesso/Alerta/Falha, `expectNone(() => true)` acompanhado de pilha de toasts vazia e textos acentuados.

## Decisoes

- **O mapper de validacao vence o built-in sem truque.** O `ResteasyReactiveViolationExceptionMapper` do Quarkus 3.37 e declarado para `ValidationException` (conferido no bytecode do jar), nao para `ResteasyReactiveViolationException`. Como `ConstraintViolationException` e subtipo mais especifico de `ValidationException`, o mapper novo ganha a resolucao — o plano B do plano (redeclarar para o tipo interno com `@Priority` menor) **nao foi necessario**, e o teste de T2 passou na primeira execucao.
- **`classifyHttpError` devolve `null` no 401.** O plano previa o retorno `{kind, message}` sempre, deixando o 401 "tratado fora daqui". Na pratica as telas chamam `fromHttpError` no `catch` e o erro 401 chega ate la depois de o interceptor ja ter avisado: sem o `null`, cada sessao expirada produziria dois toasts (o Alerta do interceptor e uma Falha da tela). O `null` deixa a regra num unico lugar testavel e o `ToastService.fromHttpError` simplesmente nao empilha nada.
- **Statuses corrigiveis = 400, 403, 409 e 422.** O plano lista 400/403/409; o 422 entrou junto porque e o outro status "de validacao" que um endpoint poderia passar a usar sem virar Falha. Nenhum endpoint do projeto responde 422 hoje.
- **`violations[]` passou a sair ordenado** pela ordem do `FieldLabels` (antes vinha da iteracao de um `Set`). O formato do array nao mudou (`field` = property path completo, `message`), entao `users.ts`/`users.html` e os testes existentes continuam funcionando; a ordem so ficou deterministica.
- **Eviction do quarto toast com animacao.** O criterio 11 pede "exatamente 3 cards no DOM" e "o mais antigo sai com a animacao de saida" — as duas coisas nao valem no mesmo instante. A implementacao marca o mais antigo como `leaving` (ele continua no DOM por 260 ms rodando `toastOut`) e o remove depois; os specs asseveram 3 toasts **vivos** imediatamente e 3 cards no DOM apos os 260 ms.
- **`login.spec.ts` verifica a ausencia da faixa por `form [class*="status"]`** em vez de `.status-bar`. Escrever o seletor literal reintroduziria o nome da classe no repositorio e faria a varredura do criterio 42 (`rg "status-bar|status-close|dismissible" frontend/src`) voltar com saida — a assercao cobre o mesmo fato sem esse efeito.
- **Comentarios em portugues do backend e do frontend tocados pela varredura foram acentuados** (`BusinessExceptionMapper`, `TransactionResource:131`, `http-error.ts`, `auth.interceptor.ts`, `login.ts`, `toast.service.ts`), para as varreduras dos criterios 46 e 47 sairem realmente vazias.
- **Titulos dos specs (`it(...)`) foram acentuados** junto com os textos, pela mesma razao: o criterio 46 varre `frontend/src` inteiro, sem excluir `*.spec.ts`.
- **Fixture de e-mail invalido em `users.spec.ts` passou de `'invalido'` para `'sem-arroba'`** — e dado digitado no teste, nao texto exibido, mas casava com o regex do criterio 46.

## Desvios em relacao ao plano e as tarefas

- **T10 — o teste de "401 sem JWT continua 401" ficou em `AuthResourceTest`, nao em `UserResourceTest`.** `UserResourceTest` tem `@TestSecurity` no nivel da classe: toda requisicao sai autenticada e nao ha como emitir uma anonima dali sem desmontar a anotacao para os outros 8 testes. `AuthResourceTest` (criado na mesma tarefa) nao tem `@TestSecurity`, entao o caso vive la como `shouldKeepUnauthorizedForRequestWithoutToken` (`GET /users` sem token -> 401). O criterio 55 continua coberto.
- **T2 nao precisou do plano B** (redeclarar o mapper para `ResteasyReactiveViolationException` com `@Priority` menor) — ver "Decisoes".
- **Testes acrescentados alem do que a tarefa pedia**, todos amarrados a criterios ja existentes: `shouldRejectDeactivatingOwnAccount` e o 400 de perfil inexistente em `UserResourceTest` (criterios 29 e 31), `shouldRejectDeletingProfileInUse` em `ProfileResourceTest` (criterio 30), `shouldRejectMonthOutOfRange` em `DashboardResourceTest` (criterio 30/47) e, no front, casos de Falha em `categories.spec.ts` e `profiles.spec.ts` (criterio 38).
- **Nenhuma tarefa ficou por fazer.** As 37 estao marcadas em `tasks.md`.
- **Fora do alcance dos testes automatizados** (validacao manual na etapa 8, como o plano ja previa): criterios 2, 3, 43, 45, 50 e 57 e a conferencia da `V11` na stack Docker — a migration roda no Postgres efemero da suite de backend (que ficou verde), mas os nomes acentuados na tela de Categorias e no dropdown de Lancamentos so aparecem depois de `docker compose up -d --build`.

## Correcao apos a etapa 8 — mensagem do 403 do `AccessControl` (2026-07-28)

**Defeito achado pela verificacao:** `AccessControl.require(...)` lancava `ForbiddenException("Sem permissão de " + action + " em " + screen)`. Antes desta feature a mensagem morria no servidor (`WebApplicationException` sem entity chegava ao Angular com `content-length: 0`); com o `BusinessExceptionMapper` ela passou a ser serializada, e como `classifyHttpError` prefere o corpo em 403, o usuario veria um Alerta escrito **"Sem permissão de CREATE em CATEGORIES"** — `Action`/`Screen` sao nomes de enum em ingles, o que contraria a convencao de todo texto exibido estar em portugues.

**Decisao do usuario:** texto generico em portugues, sem tela nem acao na mensagem.

Arquivo alterado:

- `backend/src/main/java/br/com/financeos/shared/AccessControl.java` — a excecao passa a levar a constante `ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação."`. O par tela+acao **nao foi perdido**: virou `LOG.debugf("Acesso negado para o usuario %s: %s em %s", user.id, action, screen)` antes do `throw`, com um `org.jboss.logging.Logger` estatico (primeiro logger explicito do projeto — o `jboss-logging` ja vinha transitivamente pelo `quarkus-core`, sem dependencia nova no `pom.xml`). Nivel `debug` de proposito: acesso negado e evento rotineiro numa UI guiada por permissao e nao deve poluir o log padrao, mas o diagnostico fica disponivel ligando o nivel.

Itens da correcao que se mostraram no-op, conferidos e registrados:

- **Nenhum teste de backend assertava o texto antigo do 403** (`rg "403|Sem permiss|ForbiddenException" backend/src/test` sem saida) — nada a ajustar.
- **Nenhum texto fixo de 403 no front ficou redundante ou conflitante.** O unico texto de falta de permissao no Angular e o do `permissionGuard` ("Você não tem permissão para acessar esta tela."), disparado no **redirect de rota**, onde nao ha resposta HTTP nenhuma — e exatamente o caso em que D10 manda usar texto fixo do front. Quando ha 403 de endpoint, o corpo do backend passa a existir sempre e `classifyHttpError` o prefere ao fallback da tela, como D10 pede. Os dois textos convivem descrevendo situacoes diferentes (abrir uma tela sem permissao x executar uma acao sem permissao).
- O comentario novo em `AccessControl` foi escrito acentuado para a varredura do criterio 47 continuar vazia.

**Resultado real das suites depois da correcao:** `cd backend && ./mvnw test` verde (39 testes: Health 1, Auth 3, Categories 10, Dashboard 3, Profiles 4, Transactions 9, Users 9; 0 falhas, 0 erros) e `cd frontend && npm test` verde (138 testes em 19 arquivos). Varredura do criterio 47 vazia.

## Ajustes pos-validacao (2026-07-28)

**Pedido do usuario, verbatim:** *"altere o item 1, login com senha errada deve emitir alerta nao falha, ou seja, amarelo"* — reverte a decisao D12 da spec. O 401 de credenciais invalidas no login deixa de ser Falha e passa a **Alerta**, com a consequencia ja aceita pelo usuario: o toast passa a **auto-fechar em 5200 ms com barra de progresso**, em vez de ficar na tela ate ser fechado.

Arquivos alterados:

- `frontend/src/app/features/auth/login/login.ts` — o ramo do 401 troca `this.toast.error(...)` por `this.toast.warning('Credenciais inválidas. Tente novamente.')`; o comentario passa a citar a reversao de D12 em vez da literalidade do design.
- `frontend/src/app/features/auth/login/login.spec.ts` — o caso virou `exibe Alerta com auto-fechamento quando as credenciais são inválidas` e assevera `type: 'warning'`, `title: 'Alerta'`, o mesmo texto e `duration: 5200` (antes: `title: 'Falha'` e `duration: null`).
- `specs/39-ajustes-alertas/spec.md` — D12 reescrita nas duas ocorrencias (o bullet de "Decisoes" e a linha da tabela de divergencias), linha do 401 do login na "Taxonomia dos tres estados", linha do exemplo no "Mapa: mockup -> arquivos", criterio 40 e o item (3) de "Pontos em aberto".

Decisoes de implementacao deste ajuste:

- **A mudanca ficou so em `login.ts`, nao em `classifyHttpError`.** O 401 do login ja tinha um ramo proprio na tela desde a implementacao original (era o unico jeito de usar o texto do design em vez do corpo do backend), e `classifyHttpError` continua devolvendo `null` para 401 — que e o que impede o toast duplicado quando o interceptor ja avisou da sessao expirada. Mexer no modulo de classificacao para distinguir "401 de `/auth/login`" de "401 de qualquer outro endpoint" duplicaria a regra de rota que o interceptor ja tem (`isAuthEndpoint`), sem ganho.
- **Nada mudou no `ToastHost` nem no `.scss`.** O tipo `warning` ja renderiza exatamente o pedido no item 2: quadrado do icone em `var(--pending-soft)` (= `oklch(94% 0.06 80)`), icone em `var(--pending-icon)` (= `oklch(48% 0.14 80)`), triangulo com "!", titulo "Alerta" e barra de progresso na cor do icone por 5200 ms.
- **Nenhum teste de backend dependia da classificacao.** O status continua 401 e `AuthResourceTest#shouldReturnPortugueseMessageForInvalidCredentials` (401 + "Credenciais inválidas." no corpo) segue valendo sem alteracao. Os specs `http-error.spec.ts` e `toast.service.spec.ts` tambem nao precisaram mudar: os casos que eles cobrem sao "401 nao e classificado aqui" (`null`) e "`fromHttpError` de 401 nao empilha nada", que continuam verdadeiros.
- **Efeito colateral a saber:** a tela de login perdeu o unico toast persistente do app que o usuario encontrava com facilidade. Falha persistente continua existindo para 5xx, `status = 0` e API fora do ar.

**Resultado real das suites depois do ajuste:** `cd backend && ./mvnw test` verde (39 testes: Health 1, Auth 3, Categories 10, Dashboard 3, Profiles 4, Transactions 9, Users 9; 0 falhas, 0 erros) e `cd frontend && npm test` verde (138 testes em 19 arquivos).

## Registro para a revisao do usuario (sem mudanca de codigo)

- **De-duplicacao de toasts identicos** (`frontend/src/app/core/services/toast.service.ts:75-84`): quando `success`/`warning`/`error` recebe um tipo **e** um texto iguais aos de um toast que ainda esta vivo na pilha, o servico **nao empilha um segundo card** — ele reinicia o timer de auto-fechamento do card existente. A spec nao previu esse comportamento; ele entrou por um risco levantado no plano ("Toasts duplicados em carga paralela"): `transactions.loadData()` dispara tres requisicoes em `Promise.all` e, com a API fora do ar, produziria tres cards de Falha com o mesmo texto — consumindo de uma vez o limite de 3 (D11). Efeitos colaterais a considerar na revisao: (a) duas acoes iguais em sequencia (salvar duas categorias seguidas) mostram **um** toast de Sucesso com o tempo reiniciado, nao dois; (b) por isso os testes de empilhamento usam mensagens distintas. Se o usuario preferir o comportamento literal do mockup (um card por disparo), basta remover o bloco `if (existing)` de `show(...)` — nada mais depende dele.
