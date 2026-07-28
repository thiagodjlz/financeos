# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Dependencias duras desta feature (nao reordenar):

1. **T2 e porta de entrada do frontend de Alerta.** Enquanto o teste de T2 nao provar que o `ValidationExceptionMapper` vence o built-in do Quarkus (`ResteasyReactiveViolationException` e subtipo mais especifico e ganha a resolucao), **nenhuma** tarefa de front que depende da `message` agregada (T16, T17, T18 e seus specs T25, T26, T27) pode comecar — o texto que elas renderizam simplesmente nao existiria.
2. **Backend inteiro antes do front** (T1..T10): a mensagem de Alerta nasce no backend.
3. **Acentuacao por ultimo** (T31..T35), com a excecao ja prevista no plano: as `message` de Bean Validation e as mensagens de negocio dos `Resource` sao acentuadas **junto** com o passo de backend (T4..T7) e com os testes que as asseveram (T8..T10), senao a suite quebra no meio do caminho.
4. **T24 (remover `.status-bar` do `styles.scss`) depois de T16..T21**, quando nenhum template mais usa a regra.

## Backend

- [x] **T1** — Criar o record `ApiError(String message)` e o registro `FieldLabels` (mapa ordenado campo -> rotulo em portugues, com a ordem de insercao definindo a ordem da frase agregada)
  - Arquivos: `backend/src/main/java/br/com/financeos/shared/ApiError.java`, `backend/src/main/java/br/com/financeos/shared/FieldLabels.java`
  - Criterios: — (infraestrutura consumida por T2 e T3; sem criterio proprio)

- [x] **T2** — Criar o `ValidationExceptionMapper` (400 com `violations[]` no formato de hoje **mais** a `message` agregada em portugues) e **provar por teste** que ele vence o mapper built-in do Quarkus; se perder, declarar para `ResteasyReactiveViolationException` com `@Priority` menor e rodar o teste de novo ate passar
  - Arquivos: `backend/src/main/java/br/com/financeos/shared/ValidationExceptionMapper.java`, `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java`
  - Criterios: 21, 25
  - Porta: T16, T17, T18, T22 (parte de Alerta), T25, T26 e T27 so comecam com esta tarefa verde.

- [x] **T3** — Criar o `BusinessExceptionMapper` (`WebApplicationException`): repassa o status original sem alterar nenhum, devolve a resposta intacta quando ja ha entity e so serializa `ApiError` quando a mensagem foi passada explicitamente (descartando o padrao `HTTP <status> <reason>` do JAX-RS); **nao** criar mapper para `Exception`/`RuntimeException`
  - Arquivos: `backend/src/main/java/br/com/financeos/shared/BusinessExceptionMapper.java`
  - Criterios: 27, 28, 29, 30, 31, 32, 33, 55, 56

- [x] **T4** — Acrescentar `message` em portugues acentuado nas anotacoes de Bean Validation de Lancamentos e Categorias
  - Arquivos: `backend/src/main/java/br/com/financeos/transactions/TransactionRequest.java`, `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java`
  - Criterios: 21, 23, 24, 26, 47

- [x] **T5** — Acrescentar `message` em portugues em Perfis e Login e acentuar as `message` que ja existem nos DTOs de Usuarios
  - Arquivos: `backend/src/main/java/br/com/financeos/profiles/ProfileRequest.java`, `backend/src/main/java/br/com/financeos/profiles/PermissionEntry.java`, `backend/src/main/java/br/com/financeos/auth/LoginRequest.java`, `backend/src/main/java/br/com/financeos/users/UserCreateRequest.java` e `UserUpdateRequest.java`
  - Criterios: 23, 47

- [x] **T6** — Acentuar as mensagens de negocio de Lancamentos, Categorias e Usuarios (texto e status HTTP inalterados)
  - Arquivos: `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java`, `backend/src/main/java/br/com/financeos/categories/CategoryResource.java`, `backend/src/main/java/br/com/financeos/users/UserResource.java`
  - Criterios: 27, 28, 29, 31, 32, 33, 47

- [x] **T7** — Acentuar/traduzir as mensagens de Perfis, Auth, `AccessControl` e Dashboard (as duas `BadRequestException` hoje em ingles, que com o mapper passam a chegar ao cliente)
  - Arquivos: `backend/src/main/java/br/com/financeos/profiles/ProfileResource.java`, `backend/src/main/java/br/com/financeos/auth/AuthResource.java`, `backend/src/main/java/br/com/financeos/shared/AccessControl.java`, `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java`
  - Criterios: 30, 47

## Testes de backend

- [x] **T8** — Completar `TransactionResourceTest`: mensagem agregada nomeando "Descrição, Valor", `amount = 0` com a mensagem do `@DecimalMin`, e os tres 400 de regra (`categoryId` inexistente, tipo incompativel, `status: CANCELED`) agora com `message` no corpo
  - Arquivos: `backend/src/test/java/br/com/financeos/transactions/TransactionResourceTest.java`
  - Criterios: 21, 23, 26, 31, 32, 33, 48, 56

- [x] **T9** — Atualizar `CategoryResourceTest` (400 "Informe os campos obrigatórios: Nome.", 409 com `message` no corpo, textos acentuados) e `ProfileResourceTest` (409 de perfil em uso com `message` no corpo)
  - Arquivos: `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java`, `backend/src/test/java/br/com/financeos/profiles/ProfileResourceTest.java`
  - Criterios: 23, 24, 27, 30, 48, 56

- [x] **T10** — Atualizar `UserResourceTest` (textos acentuados, `violations[]` intacto, `message` agregada no 400, `message` no corpo dos 409 de e-mail duplicado e autodesativacao, 401 sem JWT continua 401), criar `AuthResourceTest` e ajustar `DashboardResourceTest`
  - Arquivos: `backend/src/test/java/br/com/financeos/users/UserResourceTest.java`, `backend/src/test/java/br/com/financeos/auth/AuthResourceTest.java`, `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
  - Criterios: 23, 25, 28, 29, 48, 55, 56

## Frontend — base do toast (sem consumidor)

- [x] **T11** — Criar o token `--fs-toast-msg: 13px` em `:root` (unico degrau que falta; nenhum literal pode nascer no `.scss` do componente)
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 12

- [x] **T12** — Criar o modulo puro de classificacao `classifyHttpError(err, fallback)` e as constantes de texto fixo de Falha, com o spec em tabela status -> `kind` -> origem do texto
  - Arquivos: `frontend/src/app/core/http-error.ts`, `frontend/src/app/core/http-error.spec.ts`
  - Criterios: 36, 38, 39, 41

- [x] **T13** — Criar o `ToastService` (signal de pilha, `success`/`warning`/`error`/`dismiss`/`fromHttpError`, duracoes 3800/5200/sem timer, limite de 3 com saida do mais antigo, de-duplicacao por tipo+texto, remocao 260 ms depois da saida) com spec de timers falsos
  - Arquivos: `frontend/src/app/core/services/toast.service.ts`, `frontend/src/app/core/services/toast.service.spec.ts`
  - Criterios: 4, 5, 6, 7, 9, 11

- [x] **T14** — Criar o componente `app-toast-host` (template com os tres SVG, botao Fechar com `aria-label="Fechar"`, barra de progresso so quando ha auto-fechamento; `.scss` com container fixo `top/right: 24px`, `z-index: 999`, `340px`, card em tokens e os `@keyframes toastIn`/`toastOut`/`toastBar`) com spec de DOM e comportamento
  - Arquivos: `frontend/src/app/core/toast/toast-host.ts`, `frontend/src/app/core/toast/toast-host.html`, `frontend/src/app/core/toast/toast-host.scss`, `frontend/src/app/core/toast/toast-host.spec.ts`
  - Criterios: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 57

- [x] **T15** — Montar `<app-toast-host />` em `app.html` (depois do `<router-outlet />`) e importar o componente em `app.ts`, para que `/login` e as telas internas compartilhem o mesmo host
  - Arquivos: `frontend/src/app/app.html`, `frontend/src/app/app.ts`
  - Criterios: 1

## Frontend — telas, interceptor e guard

- [x] **T16** — Ligar Lancamentos ao toast: sucesso em `saveTransaction`/`saveEdit`/`cancelTransaction`, `fromHttpError` nos `catch` (que passam a receber o erro) e em `loadData`, remocao do signal `error` e do `<div class="status-bar">`
  - Arquivos: `frontend/src/app/features/transactions/transactions.ts`, `frontend/src/app/features/transactions/transactions.html`
  - Criterios: 13, 14, 15, 20, 22, 26, 31, 32, 33, 37, 38, 41, 42
  - Depende de T2 (mensagem agregada) e T13/T15.

- [x] **T17** — Ligar Categorias ao toast: sucesso em criacao e edicao inline (inclusive "Situação: Inativo"), `fromHttpError` no erro mantendo a linha em edicao, remocao do signal `error`, do `saveErrorMessage`/`conflictMessage` locais e da `.status-bar`
  - Arquivos: `frontend/src/app/features/categories/categories.ts`, `frontend/src/app/features/categories/categories.html`
  - Criterios: 16, 20, 24, 27, 37, 38, 41, 42
  - Depende de T2.

- [x] **T18** — Ligar Usuarios ao toast: sucesso em `save`/`saveEdit`/`deactivate`, toast alimentado pela **mensagem agregada do backend** (em vez do "Revise o(s) campo(s)..." montado no front), preservando `fieldErrors`/`editFieldErrors`; remover `ERROR_DISMISS_MS`, `errorTimeout`, `showError`, `dismissError`, o signal `error`, o `OnDestroy` do timer, a faixa dismissivel e as regras `.status-bar.dismissible`/`.status-close`
  - Arquivos: `frontend/src/app/features/users/users.ts`, `frontend/src/app/features/users/users.html`, `frontend/src/app/features/users/users.scss`
  - Criterios: 17, 18, 20, 25, 28, 29, 37, 42, 44, 53
  - Depende de T2.

- [x] **T19** — Ligar Perfis ao toast: sucesso em `save` (criacao e edicao) e `remove`, erros via `fromHttpError` (o 409 de perfil em uso agora chega com corpo), remocao do signal `error` e da `.status-bar`
  - Arquivos: `frontend/src/app/features/profiles/profiles.ts`, `frontend/src/app/features/profiles/profiles.html`
  - Criterios: 19, 20, 30, 37, 38, 42

- [x] **T20** — Ligar o Resumo ao toast: falha de carga vira toast de Falha, remocao do signal `error` e da `.status-bar`; o `.empty-state` "Sem dados no período" permanece intacto (D4)
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`, `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 37, 38, 39, 42, 54

- [x] **T21** — Ligar o Login ao toast: 401 dispara `toast.error('Credenciais inválidas. Tente novamente.')` (D12), demais erros seguem a classificacao padrao, e a faixa do card de login deixa de existir
  - Arquivos: `frontend/src/app/features/auth/login/login.ts`, `frontend/src/app/features/auth/login/login.html`
  - Criterios: 40, 42

- [x] **T22** — Disparar Alerta de sessao expirada no interceptor **apenas** quando `!isAuthEndpoint`, mantendo logout, redirect e re-lancamento do erro; criar o spec do interceptor
  - Arquivos: `frontend/src/app/core/interceptors/auth.interceptor.ts`, `frontend/src/app/core/interceptors/auth.interceptor.spec.ts`
  - Criterios: 35, 55

- [x] **T23** — Disparar Alerta de falta de permissao no `permissionGuard` antes do `router.navigate(['/dashboard'])`; criar o spec do guard
  - Arquivos: `frontend/src/app/core/guards/permission.guard.ts`, `frontend/src/app/core/guards/permission.guard.spec.ts`
  - Criterios: 34

- [x] **T24** — Remover a regra global `.status-bar` do `styles.scss` (linhas 144-152), com nenhum template ainda a usando
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 42, 43
  - Depende de T16..T21.

## Testes de frontend

- [x] **T25** — Atualizar `transactions.spec.ts`: sucesso em criar/editar/cancelar, 400 agregado virando Alerta com o texto do backend, `amount = 0` como Alerta, 500 e `status = 0` como Falha, e `expectNone(() => true)` do Cancelar/Sair agora tambem assertando pilha de toasts vazia
  - Arquivos: `frontend/src/app/features/transactions/transactions.spec.ts`
  - Criterios: 13, 14, 15, 20, 22, 26, 38, 39, 41, 51, 52

- [x] **T26** — Atualizar `categories.spec.ts`: sucesso na criacao e na edicao inline, Alerta nomeando "Nome", 409 virando Alerta com a linha ainda em edicao (assercao migra de `.status-bar` para `ToastService.toasts()`), Cancelar sem HTTP e sem toast
  - Arquivos: `frontend/src/app/features/categories/categories.spec.ts`
  - Criterios: 16, 20, 24, 27, 41, 51, 52, 54

- [x] **T27** — Atualizar `users.spec.ts`: sucesso ao criar/editar/desativar, legendas `field-error` **e** toast de Alerta convivendo, 409 de e-mail e de autodesativacao como Alerta, assercoes de `.status-bar` e de `dismissError` substituidas por assercoes sobre a pilha de toasts
  - Arquivos: `frontend/src/app/features/users/users.spec.ts`
  - Criterios: 17, 18, 20, 25, 28, 29, 41, 44, 51, 52, 53

- [x] **T28** — Atualizar `profiles.spec.ts`: sucesso ao criar, editar e excluir perfil, 409 de perfil em uso como Alerta, Cancelar de dois estagios sem HTTP e sem toast
  - Arquivos: `frontend/src/app/features/profiles/profiles.spec.ts`
  - Criterios: 19, 20, 30, 41, 51

- [x] **T29** — Criar `dashboard.spec.ts` cobrindo a carga com erro: 500 e `status = 0` geram toast de Falha (o plano cita este spec na superficie de validacao dos criterios 37-39 sem lista-lo entre os arquivos novos — ver "Lacunas")
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 37, 38, 39

- [x] **T30** — Criar `login.spec.ts`: 401 gera Falha com "Credenciais inválidas. Tente novamente." e nao existe `.status-bar` no DOM
  - Arquivos: `frontend/src/app/features/auth/login/login.spec.ts`
  - Criterios: 40, 42

## Acentuacao de todo o texto exibido (passo final)

- [x] **T31** — Acentuar o menu lateral (incluindo `title`/`aria-label` do estado recolhido e os tres grupos, entre eles "Cadastros" da issue #37) e os textos do Resumo e do Login
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`, `frontend/src/app/features/dashboard/dashboard.html` e `dashboard.ts`, `frontend/src/app/features/auth/login/login.html` e `login.ts`
  - Criterios: 45, 46, 54

- [x] **T32** — Acentuar todos os textos exibidos de Lancamentos e Categorias (titulos, cabecalhos, labels, placeholders, botoes, `.empty-state`, modal e strings de mensagem nos `.ts`)
  - Arquivos: `frontend/src/app/features/transactions/transactions.html` e `transactions.ts`, `frontend/src/app/features/categories/categories.html` e `categories.ts`
  - Criterios: 45, 46, 54

- [x] **T33** — Acentuar todos os textos exibidos de Usuarios e Perfis
  - Arquivos: `frontend/src/app/features/users/users.html` e `users.ts`, `frontend/src/app/features/profiles/profiles.html` e `profiles.ts`
  - Criterios: 45, 46, 54

- [x] **T34** — Atualizar os specs que asseveram texto para a versao acentuada e manter `npm test` verde
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`, `frontend/src/app/features/{transactions,categories,users,profiles}/*.spec.ts`
  - Criterios: 46, 54

- [x] **T35** — Rodar as varreduras de conferencia dos criterios 46 e 47 ate saida vazia, conferir que nenhum identificador/rota/enum/chave foi renomeado (`git diff --stat` sem `app.routes.ts`, sem `core/models.ts`, sem migration existente alterada) e que os arquivos alterados continuam em UTF-8 sem BOM com `<meta charset="utf-8">` intacto
  - Arquivos: varredura sobre `frontend/src` e `backend/src/main/java` (correcoes pontuais onde a varredura acusar)
  - Criterios: 46, 47, 49, 50

## Migration

- [x] **T36** — Criar `V11__accent_seeded_category_names.sql` com quatro `UPDATE` (`Salario`->`Salário`, `Cartao`->`Cartão`, `Bebe`->`Bebê`, `Emprestimo`->`Empréstimo`), cada um ancorado em `name + type + user_id is null + parent_id is null` e com a guarda `not exists` contra duplicidade; gravar em UTF-8 sem BOM e nao tocar em `V1`..`V10`
  - Arquivos: `backend/src/main/resources/db/migration/V11__accent_seeded_category_names.sql`
  - Criterios: — (decisao do coordenador posterior a spec; estende os criterios 45, 47, 49 e 50 ao dado semeado exibido na tela, sem criterio proprio)

## Fechamento

- [x] **T37** — Rodar `cd backend && ./mvnw test`, `cd frontend && npm test` e `npm run build`, confirmando suites verdes e nenhum warning novo de budget `anyComponentStyle`
  - Arquivos: — (execucao; correcoes pontuais nos arquivos que falharem)
  - Criterios: 48, 58

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Servico + host unico em `app.html` (vale no login) | T15 |
| 2 | Pilha fixa no canto superior direito, 340px, `z-index: 999` | T14 |
| 3 | Card: `--surface`, `--border-card`, `--radius-lg`, `--shadow-login`, padding | T14 |
| 4 | Sucesso: titulo, icone, `--income-*`, 3800 ms | T13, T14 |
| 5 | Alerta: titulo, icone, `--pending-*`, 5200 ms | T13, T14 |
| 6 | Falha: `--expense-*`, permanece ate fechar | T13, T14 |
| 7 | Botao Fechar com `aria-label`, cancela o timer | T13, T14 |
| 8 | Barra de progresso 3px so quando ha auto-fechamento | T14 |
| 9 | Animacoes `toastIn`/`toastOut` e remocao ~260 ms | T13, T14 |
| 10 | Tres toasts empilhados com 12px | T14 |
| 11 | Quarto toast deixa exatamente 3 no DOM | T13, T14 |
| 12 | Token de 13px + varredura de cor literal vazia | T11, T14 |
| 13 | `POST /api/transactions` -> Sucesso | T16, T25 |
| 14 | `PUT /api/transactions/{id}` -> Sucesso | T16, T25 |
| 15 | `DELETE /api/transactions/{id}` -> Sucesso | T16, T25 |
| 16 | `POST`/`PUT /api/categories` -> Sucesso | T17, T26 |
| 17 | `POST`/`PUT /api/users` -> Sucesso | T18, T27 |
| 18 | `DELETE /api/users/{id}` -> Sucesso | T18, T27 |
| 19 | `POST`/`PUT`/`DELETE /api/profiles` -> Sucesso | T19, T28 |
| 20 | Acao sem HTTP nao dispara toast | T16, T17, T18, T19, T25, T26, T27, T28 |
| 21 | 400 com `violations[]` + `message` agregada nomeando campos | T2, T4, T8 |
| 22 | Front exibe a agregada como Alerta, texto identico ao do corpo | T16, T25 |
| 23 | Bean Validation em portugues nos 4 DTOs (sem texto default) | T4, T5, T8, T9, T10 |
| 24 | Categoria sem `name` -> Alerta nomeando "Nome" | T4, T9, T17, T26 |
| 25 | Usuarios: `violations[]` + legendas + toast convivendo | T2, T10, T18, T27 |
| 26 | `amount = 0` -> Alerta com a mensagem de limite | T4, T8, T16, T25 |
| 27 | 409 categoria duplicada -> Alerta, linha segue em edicao | T3, T6, T9, T17, T26 |
| 28 | 409 e-mail duplicado -> Alerta com texto do corpo | T3, T6, T10, T18, T27 |
| 29 | 409 autodesativacao -> Alerta com texto do corpo | T3, T6, T10, T18, T27 |
| 30 | 409 perfil em uso -> Alerta com texto do corpo | T3, T7, T9, T19, T28 |
| 31 | `categoryId` inexistente com mensagem no corpo | T3, T6, T8, T16 |
| 32 | Categoria de tipo diferente com mensagem propria | T3, T6, T8, T16 |
| 33 | `status: CANCELED` via POST com mensagem no corpo | T3, T6, T8, T16 |
| 34 | Rota sem permissao: redirect + Alerta | T23 |
| 35 | 401 fora do login: logout + Alerta de sessao expirada | T22 |
| 36 | Texto do corpo quando existe, fixo so quando nao ha | T12 |
| 37 | API fora do ar nas 5 telas -> Falha persistente | T16, T17, T18, T19, T20, T29 |
| 38 | 5xx -> Falha | T12, T16, T17, T19, T20, T25, T26, T28, T29 |
| 39 | Rede/timeout (`status = 0`) -> Falha | T12, T20, T25, T29 |
| 40 | Login 401 -> Falha e faixa do card some | T21, T30 |
| 41 | Nenhum 400/409 vira Falha | T12, T25, T26, T27, T28 |
| 42 | `rg "status-bar\|status-close\|dismissible"` sem saida | T16, T17, T18, T19, T20, T21, T24 |
| 43 | Mensagem nao empurra mais o conteudo | T24 |
| 44 | `ERROR_DISMISS_MS`/`errorTimeout`/`dismissError` deixam de existir | T18, T27 |
| 45 | Texto acentuado nas 6 telas e no menu lateral | T31, T32, T33 |
| 46 | Varredura de acentuacao do front sai vazia | T31, T32, T33, T34, T35 |
| 47 | Mensagens do backend acentuadas | T4, T5, T6, T7, T35 |
| 48 | Testes de backend atualizados e `./mvnw test` verde | T8, T9, T10, T37 |
| 49 | Nada renomeado (rotas, models, migrations existentes) | T35, T36 |
| 50 | Sem mojibake; arquivos em UTF-8 e `<meta charset>` intacto | T35, T36 |
| 51 | Cancelar continua sem HTTP nos 4 formularios | T25, T26, T27, T28 |
| 52 | "Sair" com alteracao pendente continua abrindo o modal | T25, T26, T27 |
| 53 | Legendas `field-error` de Usuarios preservadas | T18, T27 |
| 54 | `.empty-state` das tabelas e do Resumo preservados | T20, T26, T31, T32, T33, T34 |
| 55 | 401 continua 401 e o interceptor continua deslogando | T3, T10, T22 |
| 56 | Status HTTP de todas as regras inalterados | T3, T8, T9, T10 |
| 57 | Modal acima do trilho, toast acima do modal | T14 |
| 58 | `npm test`, `npm run build` e `./mvnw test` | T37 |

## Lacunas

- **Nenhum criterio de aceite ficou sem tarefa** — os 58 criterios da spec tem ao menos uma tarefa, e nenhum criterio que descreve regra de negocio e coberto so por tarefa de frontend: as mensagens de validacao e de recusa (criterios 21-33) nascem em T2..T7 no backend e o front apenas renderiza o que recebe.
- Duas tarefas declaram `criterios: —` e sao infraestrutura legitima: **T1** (`ApiError`/`FieldLabels`, consumidos por T2 e T3) e **T36** (migration `V11`, decisao do coordenador posterior a spec, que estende os criterios 45/47/49/50 ao dado semeado exibido na tela). Nenhuma outra tarefa esta sem criterio — nao ha escopo a mais do que a issue pediu.
- **Ponto torto do plano (menor, registrado sem correcao):** a superficie de validacao cita `DashboardSpec` nos criterios 37-39, mas `frontend/src/app/features/dashboard/dashboard.spec.ts` **nao existe** hoje nem aparece na lista de arquivos novos do plano (que lista apenas `toast.service.spec.ts`, `http-error.spec.ts`, `toast-host.spec.ts`, `auth.interceptor.spec.ts`, `permission.guard.spec.ts` e `login.spec.ts`). T29 cria o arquivo seguindo a superficie de validacao; se a intencao do plano era deixar o criterio 37 so em validacao manual, T29 pode ser reduzida — mas ai os criterios 38 e 39 ficam sem cobertura automatizada no Resumo.
- **Risco de ordem ja refletido nas tarefas:** T2 e a unica tarefa cujo resultado pode obrigar a reescrever a propria abordagem (mapper declarado para `ResteasyReactiveViolationException` com `@Priority` menor). Se ela nao ficar verde, T16, T17, T18, T25, T26 e T27 nao tem o que renderizar e os criterios 21, 22, 24, 25 e 26 caem juntos.
- **Criterios cuja evidencia e majoritariamente manual** (etapa 8, nao lacuna de cobertura): 37 (API fora do ar tela a tela), 43 (posicao do painel com e sem toast), 45 (varredura visual dos textos), 50 (mojibake em `http://localhost`), 57 (toast acima do modal) e a validacao da `V11` (backend sobe, `docker compose logs backend` com a migration aplicada, nomes acentuados na tela de Categorias e no dropdown de Lancamentos).
