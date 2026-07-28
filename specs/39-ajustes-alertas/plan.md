# Plano de implementacao

## Abordagem

Criar um canal unico de feedback no frontend — `ToastService` (estado + timers + limite de 3) e um `ToastHost` renderizado **uma unica vez** em `frontend/src/app/app.html` — e fazer o backend passar a mandar a mensagem no corpo da resposta, via dois `ExceptionMapper` novos em `shared/`: um para `ConstraintViolationException` (mantem o `violations[]` de hoje e acrescenta uma `message` agregada em portugues que nomeia os campos) e outro para `WebApplicationException` (serializa `{message}` sem mexer em status). A classificacao Sucesso/Alerta/Falha fica em **um** modulo puro (`core/http-error.ts`) consumido pelo `ToastService`, pelo interceptor e pelo guard — nenhuma tela reimplementa a regra; cada tela so escolhe o texto fixo de Sucesso e o fallback de Falha. A faixa `.status-bar` sai de todas as telas e do `styles.scss`. A acentuacao de todo o texto exibido e o **ultimo** passo, isolado, para nao se misturar ao diff funcional — e inclui uma migration `V11` que acentua o **dado semeado** exibido na tela (nomes das categorias padrao da `V2`).

## Arquivos a alterar

### Backend

Novos (pacote `br.com.financeos.shared`):

- `backend/src/main/java/br/com/financeos/shared/ApiError.java` — record `ApiError(String message)`, corpo JSON dos erros de negocio.
- `backend/src/main/java/br/com/financeos/shared/FieldLabels.java` — registro `LinkedHashMap<String,String>` de campo -> rotulo em portugues (`name`->"Nome", `email`->"E-mail", `password`->"Senha", `profileId`->"Perfil", `description`->"Descrição", `amount`->"Valor", `transactionDate`->"Data", `type`->"Tipo", `categoryId`->"Categoria", `status`->"Status", `color`->"Cor", `icon`->"Ícone", `active`->"Situação", `permissions`->"Permissões", `screen`->"Tela", `installmentNumber`->"Parcela", `installmentTotal`->"Total de parcelas", `notes`->"Observações"). A **ordem de insercao** define a ordem dos campos na frase agregada (violacoes chegam em `Set`, sem ordem estavel); campo desconhecido cai no proprio nome do path.
- `backend/src/main/java/br/com/financeos/shared/ValidationExceptionMapper.java` — `@Provider @Priority(1) ExceptionMapper<ConstraintViolationException>`. Responde **400** com `{"title","status":400,"violations":[{"field","message"}],"message":"<agregada>"}`: o array `violations` mantem exatamente o formato de hoje (`field` = property path completo, ex. `create.request.email`) para nao quebrar `users.ts`/`users.html` nem os testes existentes; a `message` agregada e montada separando as violacoes de **campo ausente** (`@NotNull`/`@NotBlank`/`@NotEmpty`, lidas por `violation.getConstraintDescriptor().getAnnotation().annotationType()`) das demais — ausentes viram "Informe os campos obrigatórios: Descrição, Valor." (rotulos na ordem do `FieldLabels`), e as demais sao concatenadas com as proprias `message` dos DTOs ("O valor deve ser maior ou igual a 0,01.").
- `backend/src/main/java/br/com/financeos/shared/BusinessExceptionMapper.java` — `@Provider ExceptionMapper<WebApplicationException>`. **Nao altera status nenhum**: repassa `e.getResponse().getStatus()`. Se a resposta ja tem entity, devolve a resposta original intacta; senao, escreve `ApiError` com `e.getMessage()` **apenas** quando a mensagem foi passada explicitamente (descartar o texto default do JAX-RS no padrao `HTTP <status> <reason>` e mensagens em branco), caso contrario responde sem corpo como hoje. Cobre os 400/409 de negocio de Lancamentos, Categorias, Usuarios e Perfis. **Nao** criar mapper para `Exception`/`RuntimeException`: 5xx continua sendo o 500 default do Quarkus (nada de stack trace no corpo).

DTOs (`message` em portugues acentuado, mesmo padrao da issue #26):

- `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java` — `message` em `@NotNull transactionDate`, `@NotBlank`/`@Size` description, `@NotNull`/`@DecimalMin` amount, `@NotNull type`, `@Min` installmentNumber/installmentTotal.
- `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java` — `message` em name (`@NotBlank`/`@Size`), type (`@NotNull`), color/icon (`@Size`).
- `backend/src/main/java/br/com/financeos/profiles/ProfileRequest.java` — `message` em name (`@NotBlank`/`@Size`) e permissions (`@NotEmpty`).
- `backend/src/main/java/br/com/financeos/profiles/PermissionEntry.java` — `message` no `@NotNull screen`.
- `backend/src/main/java/br/com/financeos/auth/LoginRequest.java` — `message` em email (`@NotBlank`/`@Email`) e password (`@NotBlank`).
- `backend/src/main/java/br/com/financeos/users/UserCreateRequest.java` e `UserUpdateRequest.java` — so acentuacao das `message` que ja existem ("O nome é obrigatório.", "Informe um e-mail válido.", "A senha deve ter entre 8 e 72 caracteres.", "O perfil é obrigatório.", "O e-mail deve ter no máximo 180 caracteres.").

Mensagens de negocio (so acentuacao, texto e status inalterados):

- `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java` — "Categoria informada não existe.", "A categoria deve ser do mesmo tipo do lançamento.", "Categoria inativa não pode ser selecionada.", "O status Cancelado só pode ser aplicado pelo cancelamento do lançamento."
- `backend/src/main/java/br/com/financeos/categories/CategoryResource.java` — "Já existe uma categoria com esse nome e tipo.", "Categoria pai informada não existe.", "Uma categoria não pode ser pai dela mesma."
- `backend/src/main/java/br/com/financeos/users/UserResource.java` — "E-mail já cadastrado.", "Você não pode desativar a própria conta.", "Perfil informado não existe."
- `backend/src/main/java/br/com/financeos/profiles/ProfileResource.java` — "Perfil em uso por usuários.", "Tela duplicada nas permissões do perfil."
- `backend/src/main/java/br/com/financeos/auth/AuthResource.java` — "Credenciais inválidas."
- `backend/src/main/java/br/com/financeos/shared/AccessControl.java` — mensagem do `ForbiddenException` em portugues ("Sem permissão de ... em ..."); status 403 e o `NotAuthorizedException("Bearer")` do 401 ficam como estao.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` — as duas `BadRequestException` hoje em ingles ("year and month must be provided together", "month must be between 1 and 12") viram portugues, ja que com o mapper novo elas passam a chegar ao cliente.

Testes de backend:

- `backend/src/test/java/br/com/financeos/users/UserResourceTest.java` — atualizar os textos assertados para a versao acentuada; acrescentar assercao do campo `message` agregado no 400 e do `message` no corpo do 409.
- `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java` — novos casos: `POST` sem `description`/`amount` -> 400 com `violations[]` **e** `message` = "Informe os campos obrigatórios: Descrição, Valor."; `amount = 0` -> 400 com a mensagem do `@DecimalMin`; `categoryId` inexistente / tipo incompativel / `status: CANCELED` -> 400 com `message` no corpo (hoje o corpo e vazio).
- `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java` — 409 com `message` no corpo; `POST` sem `name` -> 400 com "Informe os campos obrigatórios: Nome."; textos acentuados.
- `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java` — 409 de perfil em uso com `message` no corpo.
- `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java` (novo) — `POST /api/auth/login` com `{}` responde 400 sem texto default do Hibernate Validator; com credencial invalida responde 401 com "Credenciais inválidas." no corpo.
- `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java` — ajustar assercoes de texto se houver.

### Frontend

Novos:

- `frontend/src/app/core/services/toast.service.ts` — fica em `core/services/` por consistencia (todo service do app ja vive la, com o `.spec.ts` ao lado). Estado `toasts = signal<Toast[]>([])`; API `success(message)`, `warning(message)`, `error(message)`, `dismiss(id)` e `fromHttpError(err, fallback)`. Regras: duracao 3800 (sucesso) / 5200 (alerta) / sem timer (falha); ao entrar o **4o** toast, dispara a saida do mais antigo (qualquer tipo, inclusive falha); `dismiss` limpa o timer, marca `leaving` e remove do array 260 ms depois; **de-duplicacao**: se ja existe na pilha um toast vivo com o mesmo tipo **e** o mesmo texto, reinicia o timer dele em vez de empilhar um clone (evita 3 toasts identicos quando uma tela dispara requisicoes em paralelo — ver Riscos).
- `frontend/src/app/core/services/toast.service.spec.ts` — duracoes, limite de 3, fechamento manual, de-duplicacao, remocao apos 260 ms (timers falsos do vitest).
- `frontend/src/app/core/http-error.ts` — **camada unica de classificacao**. Funcao pura `classifyHttpError(err, fallback): { kind: 'warning' | 'error'; message: string }`: 400/409/403 -> `warning` com o texto do corpo (`string`, `{message}` ou a `message` agregada do `ValidationExceptionMapper`) e, sem corpo, o fallback recebido; 401 -> tratado fora daqui (interceptor/login); status >= 500, status 0 e corpo malformado -> `error` com texto fixo de falha. Exporta tambem as constantes de texto fixo ("Erro inesperado do sistema. Tente novamente em instantes.", "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.").
- `frontend/src/app/core/http-error.spec.ts` — tabela de status -> `kind` + origem do texto.
- `frontend/src/app/core/toast/toast-host.ts` / `.html` / `.scss` — componente standalone `app-toast-host` (o componente fica em `core/toast/` como a spec preve; so o service acompanha os demais em `core/services/`). Template = `*ngFor` sobre `toastService.toasts()`, com os tres SVG do mockup por `*ngIf` de tipo, botao Fechar com `aria-label="Fechar"` e barra de progresso so quando ha auto-fechamento (duracao via `[style.animationDuration]`, que e dado, nao cor). `.scss` com o container fixo (`top/right: 24px`, `z-index: 999`, `width: 340px`, `max-width: calc(100vw - 32px)`, coluna com `margin-bottom: 12px`), o card (`var(--surface)`, `1px solid var(--border-card)`, `var(--radius-lg)`, `var(--shadow-login)`, `padding: 16px 16px 18px`, `overflow: hidden`), o quadrado 36x36 (`var(--radius-icon)`) com as cores por classe de tipo (`--income-soft`/`--income-icon`, `--pending-soft`/`--pending-icon`, `--expense-soft`/`--expense-on-soft`), titulo `var(--fs-body)`/700, mensagem `var(--fs-toast-msg)`/`var(--text-muted)`, botao fechar `var(--text-faint)` e os `@keyframes toastIn`/`toastOut`/`toastBar` copiados do mockup. **Nenhuma cor literal** — so tokens.
- `frontend/src/app/core/toast/toast-host.spec.ts` — DOM e comportamento: os tres titulos e paletas, auto-fechamento 3800/5200, falha sem timer nem barra, botao Fechar antes do timer (sem erro no console), empilhamento de 3 com 12px, quarto toast deixando 3 cards, saida ~260 ms.
- `frontend/src/app/core/interceptors/auth.interceptor.spec.ts` (novo) — 401 fora do login: logout + `/login` + toast de **Alerta**; 401 em `/auth/login`: logout/redirect como hoje e **nenhum** toast (quem avisa e a tela de login, com Falha).
- `frontend/src/app/core/guards/permission.guard.spec.ts` (novo) — sem permissao: redirect para `/dashboard` + toast de Alerta.
- `frontend/src/app/features/auth/login/login.spec.ts` (novo) — 401 do login gera Falha com "Credenciais inválidas. Tente novamente." e nao ha `.status-bar` no DOM.

Alterados:

- `frontend/src/app/app.html` — acrescenta `<app-toast-host />` depois do `<router-outlet />`. **Aqui e nao no `main-layout`**: `/login` e rota **irma** do shell (`app.routes.ts:6-9`, fora dos `children` do `main-layout`), entao um host montado no layout nao existiria na tela de login; `App` e o unico componente presente nas duas arvores. Como o container e `position: fixed`, a posicao no template nao afeta o layout.
- `frontend/src/app/app.ts` — importa `ToastHost`.
- `frontend/src/app/core/interceptors/auth.interceptor.ts` — no `catchError`, alem do logout + redirect que ja existem, dispara `toast.warning('Sua sessão expirou. Entre novamente.')` **apenas quando `!isAuthEndpoint`** (a flag ja existe no arquivo); o erro continua sendo re-lancado. O interceptor **nao** classifica nem toasta nenhum outro status: se ele toastasse tudo, (a) cada tela perderia o texto de contexto, (b) telas que disparam requisicoes em paralelo gerariam toasts repetidos e (c) os specs de componente, que usam `provideHttpClient()` **sem** interceptors, nao veriam nada — a regra ficaria sem cobertura de teste.
- `frontend/src/app/core/guards/permission.guard.ts` — antes do `router.navigate(['/dashboard'])`, `toast.warning('Você não tem permissão para acessar esta tela.')` (403/redirect nao tem corpo: texto fixo do front, conforme a taxonomia).
- `frontend/src/app/features/transactions/transactions.ts` — remove `error` signal; `saveTransaction`/`saveEdit`/`cancelTransaction` chamam `toast.success('Lançamento salvo com sucesso.' | 'Lançamento atualizado com sucesso.' | 'Lançamento cancelado com sucesso.')` no caminho feliz e `toast.fromHttpError(err, ...)` no `catch` (o `catch` precisa receber o erro — hoje sao `catch {}` sem parametro); `loadData` idem. Fluxo de edicao inline e do modal inalterado.
- `frontend/src/app/features/categories/categories.ts` — mesma troca; `saveErrorMessage`/`conflictMessage` locais saem em favor de `fromHttpError(err, 'Não foi possível salvar a categoria.')`, mantendo a linha em edicao no erro.
- `frontend/src/app/features/users/users.ts` — remove `ERROR_DISMISS_MS`, `errorTimeout`, `showError`, `dismissError`, o signal `error` e o `OnDestroy` que so existia por causa do timer; `applySaveError`/`applyEditSaveError` continuam preenchendo `fieldErrors`/`editFieldErrors` a partir de `violations[]` (legendas por campo preservadas) e passam a mandar ao toast a **mensagem agregada vinda do backend** em vez de montar "Revise o(s) campo(s) inválido(s): ..." no front; sucesso em `save`/`saveEdit`/`deactivate`.
- `frontend/src/app/features/profiles/profiles.ts` — sucesso em `save` (criacao e edicao) e `remove`; erros via `fromHttpError` (409 de perfil em uso agora chega com corpo).
- `frontend/src/app/features/dashboard/dashboard.ts` — remove `error` signal; falha de carga vira toast (API fora do ar -> Falha). O `.empty-state` "Sem dados no período" **nao muda** (D4).
- `frontend/src/app/features/auth/login/login.ts` — remove `error` signal; 401 -> `toast.error('Credenciais inválidas. Tente novamente.')` (D12); demais erros seguem a classificacao padrao.
- `frontend/src/app/features/{dashboard,transactions,categories,users,profiles}/*.html` e `features/auth/login/login.html` — remove o `<div class="status-bar">` (e, em Usuarios, o `.dismissible` + botao `.status-close`).
- `frontend/src/app/features/users/users.scss` — remove `.status-bar.dismissible` e `.status-close` (linhas 47-63).
- `frontend/src/styles.scss` — adiciona `--fs-toast-msg: 13px` em `:root` (D6) e **remove** a regra `.status-bar` (linhas 144-152).
- Specs existentes: `features/users/users.spec.ts` (assercoes de `.status-bar` viram assercoes sobre `TestBed.inject(ToastService).toasts()`), `features/categories/categories.spec.ts`, `features/transactions/transactions.spec.ts`, `features/profiles/profiles.spec.ts` e `layout/main-layout/main-layout.spec.ts` (textos acentuados). Os `expectNone(() => true)` do Cancelar continuam e ganham a assercao de pilha de toasts vazia.

Acentuacao (passo proprio, no fim): todos os `.html` e `.ts` de `features/`, `layout/main-layout/main-layout.html`, mais os `.spec.ts` que asseveram texto. **Nao** tocar em `app.routes.ts`, `core/models.ts`, valores de enum nem chaves de objeto.

### Migration (dado semeado exibido na tela — decisao do coordenador em 2026-07-28)

- `backend/src/main/resources/db/migration/V11__accent_seeded_category_names.sql` — acentua os nomes das categorias semeadas pela `V2` (proximo numero de versao livre: **V11**; o repositorio esta em `V10__rotate_seeded_user_passwords.sql`).

Conteudo e regras:

- Somente `UPDATE categories set name = '<acentuado>'`. **Nada de DDL**, nada de `id`, `type`, `color`, `icon`, `active`, `user_id` ou `parent_id` — so a coluna exibida.
- Quatro linhas afetadas, achadas na varredura da `V2`: `Salario` -> `Salário` (INCOME), `Cartao` -> `Cartão` (EXPENSE), `Bebe` -> `Bebê` (EXPENSE), `Emprestimo` -> `Empréstimo` (EXPENSE). Os demais nomes semeados (`Extras`, `Casa`, `Carro`, `Mercado`, `Internet`, `Celular`, `Investimentos`) ja estao corretos e ficam de fora.
- Cada `UPDATE` e ancorado na linha semeada, nao no nome solto: `where name = '<antigo>' and type = '<TIPO>' and user_id is null and parent_id is null`. Assim uma categoria criada pelo usuario com nome parecido nao e alterada, e a migration fica idempotente na pratica (rodar de novo nao acha mais nada).
- Guarda contra duplicidade: cada `UPDATE` leva `and not exists (select 1 from categories c2 where c2.name = '<acentuado>' and c2.type = '<TIPO>' and c2.user_id is null and c2.parent_id is null)`. Sem isso, numa base onde o usuario ja tenha criado "Salário" a mao ficariam duas linhas com mesmo nome+tipo — a unique do banco nao dispara (`user_id`/`parent_id` nulos sao distintos para o Postgres, ver `knowledge/categories.md`), mas o `CategoryResource.validateDuplicate` passaria a recusar a edicao das duas.
- **Varredura das demais migrations por dado exibido ao usuario** (feita ao escrever este plano): `V3`/`V6`/`V10` semeiam `app_users.name` ("FinanceOS Dev", "System Owner"), `app_users.email`, `profiles.name` ("Administrador") e `profile_permissions.screen`. Nenhum precisa de acento — "Administrador" ja esta correto, os dois nomes de usuario sao rotulos em ingles (traduzir seria renomear dado, nao acentuar, e a decisao se limita a acentuacao) e e-mail/`screen` nao sao texto livre exibido (`screen` e valor de enum, protegido pelo criterio 49). Nenhuma migration semeia `transactions.description`. Portanto **a `V11` cobre tudo**: so as quatro categorias.
- **A `V2` nao e editada.** Regra do projeto: migration ja commitada nunca muda (`knowledge/architecture.md`). O criterio 49 da spec continua valendo na leitura de **nao alterar migration existente** — a `V11` e arquivo novo, decidido pelo usuario depois da spec.
- **A ordem resolve os dois casos**: base ja migrada (esta em `V10`) recebe so a `V11` e passa a exibir os nomes acentuados; base nova roda `V2` (sem acento, com `on conflict do nothing`) e, na sequencia, a `V11` — o Flyway aplica em ordem crescente de versao no startup, entao o estado final e identico nos dois cenarios. Nao ha necessidade de mexer na `V2` nem de `flyway repair`.
- **Encoding**: gravar o `.sql` em **UTF-8 sem BOM** (o Flyway le migrations em UTF-8 por padrao e o projeto nao sobrescreve `quarkus.flyway.encoding`; arquivo em UTF-16/BOM faz o Flyway falhar ou gravar mojibake). O `postgres:16-alpine` do `docker-compose.yml` faz `initdb` com encoding UTF8 e o driver JDBC transmite em UTF-8 — o caminho fim a fim ja e UTF-8; o unico ponto fragil e o arquivo mal gravado no Windows (mesma armadilha do `Out-File`/`Set-Content` ja registrada em Riscos).

Testes/fixtures que citam os nomes antigos:

- **Backend: nenhum.** `rg "Salario|Cartao|Bebe|Emprestimo|Administrador" backend/src/test` nao retorna nada — nenhum teste depende dos nomes semeados (os testes criam as proprias categorias).
- **Frontend: tres arquivos usam "Salario"/"Mercado" como fixture de mock**, nao como assercao do seed: `features/transactions/transactions.spec.ts:24`, `features/categories/categories.spec.ts:21` e `core/services/category.service.spec.ts:36,40,46,50`. Como respondem por `HttpTestingController`, **nao quebram** com a `V11`; acentuar para "Salário" e opcional e, se feito, tem de ser nos dois lados da assercao no mesmo passo (o `rg` do criterio 46 nao pega "Salario", entao nenhum criterio exige isso).

## Ordem geral

Backend primeiro e por inteiro (mappers + `message` nos DTOs + acentuacao das mensagens de negocio + testes), porque o texto que o Alerta exibe nasce la e sem os mappers metade dos criterios do front nao tem o que renderizar. Depois a base do front sem consumidor (token `--fs-toast-msg`, `ToastService`, `ToastHost`, `http-error.ts`, host em `app.html`), que ja fecha o bloco "Componente e comportamento do toast" isoladamente. So entao ligar as telas, o interceptor e o guard e remover a `.status-bar` — cada tela e um passo independente, e a remocao da regra global de `styles.scss` fica por ultimo dentro desse bloco, quando nenhum template mais a usa. A varredura de acentuacao vem **por ultimo**, num passo proprio: ela toca praticamente os mesmos arquivos de todos os passos anteriores e, feita antes, viraria conflito e re-trabalho a cada tela mexida. Todo texto **novo** escrito nos passos anteriores ja nasce acentuado. Dentro desse passo final, a migration `V11` e um **sub-passo separado e independente** do resto (mexe em dado, nao em codigo, e nao depende do toast): pode ser escrita a qualquer momento, mas so produz efeito visivel depois de `docker compose up -d --build` (etapa 7 da esteira), quando o Flyway roda no container — por isso a validacao dela cai na etapa de verificacao, junto com a conferencia de mojibake.

## Superficie de validacao

Criterios numerados na ordem da spec (secao entre parenteses).

**Componente e comportamento do toast**

- Criterio 1 (servico + host unico em `app.html`) — `ToastHost` presente em `app.html` (`app.spec.ts` continua verde) + validacao na tela: com o app em `http://localhost`, errar a senha em `/login` mostra o toast no canto superior direito, e depois de entrar salvar uma categoria mostra o toast no mesmo lugar.
- Criterio 2 (posicao/`z-index`/largura) — `ToastHostSpec#deve posicionar a pilha no canto superior direito` (getComputedStyle do container) + conferencia no DevTools na tela.
- Criterio 3 (card: fundo/borda/raio/sombra/padding) — mesmo spec, assercao de classes + inspecao visual.
- Criterio 4 (Sucesso, 3800 ms) — `ToastHostSpec#sucesso fecha sozinho em 3800ms` (timers falsos).
- Criterio 5 (Alerta, 5200 ms) — `ToastHostSpec#alerta fecha sozinho em 5200ms`.
- Criterio 6 (Falha permanece) — `ToastHostSpec#falha permanece apos 10s` + na tela: errar a senha no login e esperar ~15 s com o toast na tela.
- Criterio 7 (botao Fechar) — `ToastHostSpec#fechar remove antes do timer e cancela o timeout` (sem erro no console) + clique no `×` na tela.
- Criterio 8 (barra de progresso) — `ToastHostSpec#barra so existe quando ha auto-fechamento` (`.toast-progress` ausente no toast de falha) + observacao na tela.
- Criterio 9 (animacoes de entrada/saida e remocao em 260 ms) — `ToastHostSpec#saida remove do DOM apos 260ms` + validacao na tela (entrada deslizando da direita).
- Criterio 10 (tres empilhados, 12px) — `ToastHostSpec#empilha tres toasts distintos` (3 cards, o mais antigo no topo).
- Criterio 11 (quarto toast deixa 3) — `ToastHostSpec#quarto toast expulsa o mais antigo, inclusive falha`.
- Criterio 12 (token 13px + varredura de cor) — `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` sai vazio e `rg "--fs-toast-msg" frontend/src` acha o token em `styles.scss` e o uso em `toast-host.scss`.

**Sucesso: toda escrita persistida**

- Criterio 13 (`POST /api/transactions`) — `TransactionsSpec#exibe sucesso ao criar lancamento` (`HttpTestingController` responde 201; `ToastService.toasts()` com `type: 'success'` e "Lançamento salvo com sucesso.").
- Criterio 14 (`PUT /api/transactions/{id}`) — `TransactionsSpec#exibe sucesso ao salvar edicao inline`.
- Criterio 15 (`DELETE /api/transactions/{id}`) — `TransactionsSpec#exibe sucesso ao cancelar lancamento`.
- Criterio 16 (`POST`/`PUT /api/categories`) — `CategoriesSpec#exibe sucesso ao criar` e `#exibe sucesso ao salvar edicao inline` (inclusive com "Situação: Inativo") + validacao na tela: Categorias -> "Nova categoria" -> Salvar.
- Criterio 17 (`POST`/`PUT /api/users`) — `UsersSpec#exibe sucesso ao criar` e `#exibe sucesso ao salvar edicao inline`.
- Criterio 18 (`DELETE /api/users/{id}`) — `UsersSpec#exibe sucesso ao desativar`.
- Criterio 19 (`POST`/`PUT`/`DELETE /api/profiles`) — `ProfilesSpec#exibe sucesso ao criar, editar e excluir perfil`.
- Criterio 20 (acao sem HTTP nao toasta) — nos 4 specs de tela: `httpMock.expectNone(() => true)` + `expect(toastService.toasts()).toEqual([])` apos "Cancelar" do formulario e "Sair" da edicao inline sem alteracao.

**Alerta: validacao com o nome dos campos**

- Criterio 21 (`POST /api/transactions` sem `description`/`amount`) — `TransactionResourceTest#deveRetornarMensagemAgregadaComNomeDosCampos`: 400 com `violations` e `message` = "Informe os campos obrigatórios: Descrição, Valor.". Verificavel tambem por `POST /api/transactions` com `{}` no Swagger local.
- Criterio 22 (front exibe a agregada como Alerta) — `TransactionsSpec#erro 400 vira alerta com o texto do backend` (toast `type: 'warning'`, texto identico ao do corpo).
- Criterio 23 (Bean Validation em pt nos 4 DTOs) — `TransactionResourceTest`, `CategoryResourceTest`, `ProfileResourceTest` e `AuthResourceTest` (novo) assertando as `message` em portugues; varredura `rg -n "must not be|must be|size must" backend/src` sem saida em resposta de teste.
- Criterio 24 (`POST /api/categories` sem `name`) — `CategoryResourceTest#semNomeRetornaMensagemNomeandoOCampo` + `CategoriesSpec#alerta nomeia o campo Nome`.
- Criterio 25 (Usuarios: `violations[]` + legendas + toast) — `UsersSpec#mantem legendas por campo e mostra alerta` (verifica `.field-error` no DOM **e** o toast de Alerta) + `UserResourceTest` com `violations[]` intacto.
- Criterio 26 (`amount = 0`) — `TransactionResourceTest#valorAbaixoDoMinimoRetornaMensagemDeLimite` + `TransactionsSpec` correspondente (toast Alerta, nao Falha).

**Alerta: recusas de negocio e de permissao**

- Criterio 27 (409 categoria duplicada) — `CategoriesSpec#409 vira alerta e mantem a linha em edicao` + `CategoryResourceTest` assertando `message` no corpo.
- Criterio 28 (409 e-mail duplicado) — `UsersSpec#409 vira alerta com o texto do corpo` + `UserResourceTest`.
- Criterio 29 (409 autodesativacao) — `UserResourceTest#naoPodeDesativarPropriaConta` com `message` no corpo + `UsersSpec`.
- Criterio 30 (409 perfil em uso) — `ProfileResourceTest#perfilEmUsoRetornaMensagem` + `ProfilesSpec`.
- Criterio 31 (`categoryId` inexistente com corpo) — `TransactionResourceTest#categoriaInexistenteRetornaMensagemNoCorpo` (hoje `content-length: 0`).
- Criterio 32 (categoria de tipo diferente) — `TransactionResourceTest#categoriaDeTipoDiferenteRetornaMensagemPropria` (texto distinto do criterio 31 no mesmo status 400).
- Criterio 33 (`status: CANCELED` via POST) — `TransactionResourceTest#statusCanceladoViaPostRetornaMensagem`.
- Criterio 34 (rota sem permissao) — `permission.guard.spec.ts#redireciona e alerta` + validacao na tela: entrar com um usuario cujo perfil nao tem `USERS/VIEW`, digitar `http://localhost/users` na barra de enderecos, observar o redirect para o Resumo com o toast amarelo "Você não tem permissão para acessar esta tela.".
- Criterio 35 (401 fora do login) — `auth.interceptor.spec.ts#401 desloga e alerta` + validacao na tela: apagar `financeos_token` do `localStorage` (ou esperar o TTL), recarregar uma tela interna e observar o toast de Alerta na tela de login.
- Criterio 36 (corpo quando existe, texto fixo quando nao) — `http-error.spec.ts` (tabela status x origem do texto).

**Falha: erro tecnico inesperado**

- Criterio 37 (API fora do ar em cada tela) — validacao na tela: `docker compose stop backend`, navegar por Resumo, Lancamentos, Categorias, Usuarios e Perfis e observar em cada uma o toast vermelho "Falha" que **nao** some sozinho; complementado por `DashboardSpec`/specs de tela com `error(new ProgressEvent('error'), { status: 0 })`.
- Criterio 38 (5xx) — specs de tela respondendo 500 (`toasts()[0].type === 'error'`).
- Criterio 39 (rede/timeout, `status = 0`) — `http-error.spec.ts` + spec de tela.
- Criterio 40 (login 401 = Falha e faixa some) — `login.spec.ts#credenciais invalidas geram falha` + `expect(query('.status-bar')).toBeNull()` + validacao na tela (errar a senha em `http://localhost/login`).
- Criterio 41 (nenhum 400/409 vira Falha) — nos specs dos criterios 22, 24-33: `expect(toasts()[0].title).toBe('Alerta')`.

**Remocao da faixa `.status-bar`**

- Criterio 42 — `rg "status-bar|status-close|dismissible" frontend/src` sem saida.
- Criterio 43 (mensagem nao empurra conteudo) — validacao na tela: em Categorias, comparar a posicao do painel "Nova categoria" com e sem toast na tela (o toast e `position: fixed`, nao ocupa fluxo).
- Criterio 44 (auto-fechamento proprio de Usuarios some) — `rg "ERROR_DISMISS_MS|errorTimeout|dismissError" frontend/src` sem saida + `UsersSpec` verde sem esses membros.

**Acentuacao de todo o texto exibido**

- Criterio 45 (textos das 6 telas + menu) — validacao na tela: percorrer Resumo, Lancamentos, Categorias, Usuarios, Perfis e Login conferindo menu lateral (recolhido e expandido, incluindo `title`/`aria-label`), titulos, cabecalhos de tabela, labels, placeholders, botoes, `.empty-state` e o modal "Deseja sair sem salvar?".
- Criterio 46 (varredura do front) — `rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'` sem saida.
- Criterio 47 (mensagens do backend) — `rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'` sem saida em texto de mensagem.
- Criterio 48 (testes de backend atualizados) — `cd backend && ./mvnw test` verde.
- Criterio 49 (nada renomeado) — `git diff --stat` sem `app.routes.ts`, sem `core/models.ts` e sem alteracao em **migration existente** (`V1`..`V10` intactas; a `V11` e arquivo novo, decidida pelo usuario em 2026-07-28).
- Criterio 50 (sem mojibake / UTF-8) — validacao na tela em `http://localhost` (nenhum "Ã§"/"Ã£") + `git diff` sem alteracao de `<meta charset="utf-8">`; conferir tambem a mensagem **vinda do backend** (ex.: 409 de categoria duplicada) renderizada no toast, que passa por Java -> JSON -> nginx, e os nomes de categoria vindos do **banco** (ver o passo extra abaixo), que passam por Flyway -> Postgres -> JDBC -> JSON.
- Passo extra — migration `V11` (decisao de 2026-07-28; estende os criterios 45, 47, 49 e 50, sem criterio proprio na spec):
  - Aplicacao da migration: depois de `docker compose up -d --build`, `docker compose logs backend | rg "V11|Successfully applied"` mostra a `V11` aplicada e o backend sobe (migration malformada derruba a aplicacao inteira).
  - Dado corrigido **pelo caminho que o usuario ve**: a tela de Categorias em `http://localhost` (e/ou `GET http://localhost:8080/api/categories`) mostra "Salário", "Cartão", "Bebê" e "Empréstimo"; o dropdown de Categoria em "Novo lançamento" e a coluna Categoria da tabela "Últimos lançamentos" exibem os mesmos nomes acentuados, sem mojibake.
  - Nao-regressao do dado: a contagem de categorias e a mesma de antes (`select count(*) from categories;`), nenhum `id` mudou — na tabela de Lancamentos a coluna Categoria continua com o nome da categoria e nao virou "Sem categoria" — e as categorias criadas pelo usuario ficaram intactas.
  - Base nova: `docker compose down -v && docker compose up -d --build` (volume zerado) roda `V2` + `V11` do zero e chega ao mesmo resultado acentuado.
  - `cd backend && ./mvnw test` continua verde: os testes sobem um Postgres efemero (Dev Services) aplicando todas as migrations, entao a `V11` tambem e exercitada ali.

**Nao-regressao**

- Criterio 51 (Cancelar sem HTTP) — `expectNone(() => true)` nos 4 specs (ja existentes, mantidos).
- Criterio 52 (Sair com modal) — specs existentes de edicao inline + validacao na tela.
- Criterio 53 (legendas `field-error`) — `UsersSpec` (criterio 25).
- Criterio 54 (`.empty-state`) — specs existentes com o texto acentuado + validacao na tela.
- Criterio 55 (401 continua 401 e desloga) — `AuthResourceTest`/`UserResourceTest` com requisicao sem JWT devolvendo 401 + `auth.interceptor.spec.ts`.
- Criterio 56 (status HTTP inalterados) — suite de backend completa verde (`./mvnw test`).
- Criterio 57 (modal acima do trilho, toast acima do modal) — validacao na tela: abrir "Deseja sair sem salvar?" em Lancamentos e disparar um toast (ex.: salvar em outra aba nao da; usar o toast de sessao/alerta ja presente) — conferir que o toast fica por cima do modal.
- Criterio 58 (suites e build) — `cd frontend && npm test`, `npm run build` (sem warning novo de `anyComponentStyle`), `cd backend && ./mvnw test`.

## Riscos e pontos de atencao

- **O `ExceptionMapper` de validacao pode perder para o built-in do Quarkus.** O `quarkus-hibernate-validator` ja registra um mapper para `ResteasyReactiveViolationException` (subclasse de `ConstraintViolationException`), e a resolucao de mapper prefere o tipo mais especifico. Se o teste do criterio 21 mostrar que o corpo continua sem `message`, a correcao e declarar o mapper para o **mesmo** tipo do built-in (`io.quarkus.hibernate.validator.runtime.jaxrs.ResteasyReactiveViolationException`) com `@Priority` menor. Confirmar isso com um teste **antes** de escrever qualquer codigo de front que dependa da `message` agregada.
- **O `BusinessExceptionMapper` intercepta muito mais do que os 400/409 de negocio**: `NotFoundException`, `NotAuthorizedException` do `AccessControl` e o 401 do JWT ausente passam por ele. O contrato "nenhum status muda" e o ponto mais fragil da feature — dai as regras de repassar a resposta original quando ja ha entity e de nunca serializar a mensagem default do JAX-RS (`"HTTP 401 Unauthorized"` vazaria para a UI). Cobrir com os criterios 55 e 56.
- **Nao criar mapper para `Exception`**: um 500 com corpo estruturado tenderia a virar Alerta no front e mascararia bug, contrariando a taxonomia (Falha = tecnico inesperado).
- **Toasts duplicados em carga paralela**: `transactions.loadData()` dispara 3 requisicoes em `Promise.all`; com a API fora do ar sao 3 rejeicoes. Dai a de-duplicacao por tipo+texto no `ToastService`. Efeito colateral: um teste de empilhamento precisa usar **mensagens distintas** — o criterio 10 sera escrito assim.
- **`@keyframes` em `.scss` de componente**: confirmar no navegador que as animacoes rodam com `ViewEncapsulation.Emulated`; se o nome do keyframe for escopado/perdido, mover os tres `@keyframes` para `styles.scss` (nao ha cor neles, entao isso nao fere a regra de `styles.scss` ser o unico arquivo com cor).
- **Testes de backend que asseveram texto**: `UserResourceTest` tem varias assercoes com o texto exato sem acento ("O nome e obrigatorio.", "Informe um e-mail valido."). A acentuacao dos DTOs quebra a suite se os testes nao forem atualizados no **mesmo** passo — por isso a acentuacao das `message` de Bean Validation acontece junto com o passo de backend, e nao na varredura final.
- **Mojibake/UTF-8 no build Docker e na migration**: os arquivos precisam ser gravados em UTF-8 **sem BOM** (ferramentas do PowerShell no Windows gravam UTF-16/BOM por padrao — usar as ferramentas de edicao do agente, nao `Out-File`/`Set-Content`). Isso vale igualmente para o `.sql` da `V11`. O pom ja fixa `project.build.sourceEncoding=UTF-8`, o Java 21 usa UTF-8 como default (JEP 400), o Flyway le migrations em UTF-8 e o `postgres:16-alpine` inicializa o banco em UTF8 — a ponta fragil e so o arquivo mal gravado. O `nginx.conf` nao declara `charset`, o que hoje funciona porque o `index.html` tem `<meta charset="utf-8">` e scripts de modulo sao sempre lidos como UTF-8 — se aparecer mojibake so no ambiente Docker (e nao em `npm start`), a correcao e acrescentar `charset utf-8;` ao `frontend/nginx.conf`. Cuidado com a conferencia por `psql` no PowerShell: o console do Windows pode exibir mojibake mesmo com o dado correto no banco — validar preferencialmente pela tela/API, nao pelo terminal.
- **Migration que quebra derruba a aplicacao inteira** (`knowledge/architecture.md`, licao da issue #20): a `V11` e so `UPDATE`, sem DDL nem nome de constraint adivinhado, o que a mantem no cenario de baixo risco; ainda assim, conferir a subida do backend (`docker compose logs backend`) antes de qualquer verificacao de tela.
- **`UPDATE` de nome pode colidir com dado do usuario**: numa base onde alguem ja criou "Salário" a mao, o rename criaria duas linhas com mesmo nome+tipo — a unique do banco nao pega (NULLs distintos) e o `validateDuplicate` em Java passaria a recusar a edicao de ambas. Dai a clausula `not exists` em cada `UPDATE`; vale conferir a base local do usuario antes de dar por validado.
- **A `.status-bar` some por completo** (regra global de `styles.scss:144-152`, os 6 templates e as regras de `users.scss:47-63`): nao ha convivencia com o toast — D1 e explicita. Consequencia a vigiar na revisao: hoje a faixa e o unico canal de erro **persistente na tela**; depois da mudanca so o toast de Falha e persistente, e Alerta some em 5,2 s. As legendas `field-error` de Usuarios continuam sendo o canal persistente da validacao por campo (D5) — nao remover.
- **A spec proibia mexer em dado semeado; o usuario reverteu isso em 2026-07-28.** A `V11` e decisao posterior a spec (D8 e criterio 49 diziam que dado do banco nao seria renomeado). O plano segue a decisao nova mantendo a parte inegociavel da regra: **nenhuma migration existente e editada** e nenhum `id`, enum ou chave muda. Se na revisao o usuario voltar atras, basta nao criar a `V11` — nenhum outro passo depende dela.
- **`knowledge/architecture.md:44` fica desatualizado** ("os erros de regra do backend chegam com corpo vazio ao Angular" e o padrao de fallback por status): a feature muda exatamente esse fato. Assunto da etapa `/pipeline:sync-knowledge`, junto com o registro em `knowledge/categories.md` de que os nomes das categorias semeadas passaram a ser acentuados pela `V11`. Os fallbacks por status em `categories.ts:164` e `users.ts:316` devem continuar existindo como rede de seguranca (criterio 36).
- **Menu lateral tem hoje o grupo "Cadastros"** (`main-layout.html:51-80`, issue #37), diferente do que a spec descreve com base na #35. A varredura de acentuacao cobre o template real, incluindo os `title`/`aria-label` dos tres grupos.
