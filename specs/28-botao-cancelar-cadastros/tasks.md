# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Dentro de cada tela, o `.ts` vem antes do `.html` (trocar o template antes quebra a compilacao por metodo inexistente). As quatro telas sao independentes entre si e seguem a ordem do plano: Categorias -> Usuarios -> Perfis -> Lancamentos. Os `*.spec.ts` estao agrupados em "Testes", mas cada um pode ser escrito logo apos a sua tela — a unica exigencia e vir depois dela.

## Frontend

- [x] **T1** — Adicionar `editSnapshot`, `isDirty()` e `cancel()` de dois estagios em Categorias, limpando o snapshot tambem no `save()`
  - Arquivos: `frontend/src/app/features/categories/categories.ts`
  - Detalhe: `edit()` grava `this.editSnapshot = { ...this.form }` apos preencher o formulario; `cancel()` com snapshot e `isDirty()` restaura `this.form = { ...this.editSnapshot }` mantendo `editingId`, senao faz o `cancelEdit()` atual (`editingId.set(null)` + `editSnapshot = null` + `resetForm()`). Nenhuma chamada HTTP em nenhum dos estagios.
  - Criterios: 8, 13, 18, 19, 21, 22, 25, 28, 29
- [x] **T2** — Exibir o botao "Cancelar" de Categorias sempre que o formulario for renderizado, apontando para `cancel()`
  - Arquivos: `frontend/src/app/features/categories/categories.html`
  - Detalhe: linha 40 — remover `*ngIf="editingId()"`, trocar o handler para `(click)="cancel()"`; manter `type="button"`, `class="ghost-button"`, o rotulo "Cancelar" e a posicao dentro do `<form>` ja protegido por `authService.can('CATEGORIES', ...)` (sem `*ngIf` proprio de permissao).
  - Criterios: 1, 5, 6, 7
- [x] **T3** — Adicionar snapshot, `isDirty()` e `cancel()` de dois estagios em Usuarios, limpando `fieldErrors` e a faixa de erro do topo nos dois estagios
  - Arquivos: `frontend/src/app/features/users/users.ts`
  - Detalhe: snapshot nasce com `password: ''` (o `edit()` nunca carrega a senha), entao qualquer caractere digitado na senha conta como alteracao pendente e a restauracao devolve o campo vazio. `cancel()` chama `this.fieldErrors.set(new Map())` **e** `this.dismissError()` nos dois estagios — `resetForm()` sozinho nao limpa `error()` nem o `errorTimeout`. `save()` limpa `editSnapshot`.
  - Criterios: 9, 12, 14, 15, 18, 19, 20, 21, 23, 25, 26, 28, 29
- [x] **T4** — Exibir o botao "Cancelar" de Usuarios sempre que o formulario for renderizado, apontando para `cancel()`
  - Arquivos: `frontend/src/app/features/users/users.html`
  - Detalhe: linha 69 — remover `*ngIf="editingId()"`, handler `(click)="cancel()"`, resto igual.
  - Criterios: 2, 5, 6, 7
- [x] **T5** — Adicionar snapshot com copia profunda, `isDirty()` e `cancel()` de dois estagios em Perfis, cobrindo a matriz de permissoes inteira
  - Arquivos: `frontend/src/app/features/profiles/profiles.ts`
  - Detalhe: os checkboxes usam `[(ngModel)]="permission.canView"` e **mutam os objetos de `this.permissions`** — o snapshot precisa de copia profunda na captura (`permissions.map((p) => ({ ...p }))`) **e** na restauracao, senao `isDirty()` sempre devolve `false`. `isDirty()` compara `JSON.stringify({ name, permissions })` (ordem estavel de `SCREENS`). `save()` limpa `editSnapshot`.
  - Criterios: 10, 16, 17, 18, 19, 21, 24, 25, 28, 29
- [x] **T6** — Exibir o botao "Cancelar" de Perfis sempre que o formulario for renderizado, apontando para `cancel()`
  - Arquivos: `frontend/src/app/features/profiles/profiles.html`
  - Detalhe: linha 38 — remover `*ngIf="editingId()"`, handler `(click)="cancel()"`.
  - Criterios: 3, 5, 6, 7
- [x] **T7** — Extrair `newTransactionForm()`, criar o cache `categoriesByType` e adicionar `clearTransactionForm()` sincrono em Lancamentos
  - Arquivos: `frontend/src/app/features/transactions/transactions.ts`
  - Detalhe: o cache (alimentado em `loadCategoriesForType()`/`loadCategoriesForEdit()`) precisa existir antes do `clearTransactionForm()` que o consome — repor o dropdown via `onTypeChange()`/`listByType()` dispararia `GET /categories?type=EXPENSE` e derrubaria o criterio 28. Manter `new Date().toISOString().slice(0, 10)` como data inicial. Nome distinto de `cancelTransaction()` (que faz `DELETE`) e sem tocar em `requestExit()`/`confirmExitYes()`/`exitEditDiscarding()` da edicao inline.
  - Criterios: 11, 27, 28, 29
- [x] **T8** — Adicionar o botao "Cancelar" ao lado de "Salvar" no formulario "Novo lancamento"
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`
  - Detalhe: envolver o "Salvar" da linha 43 num `<div class="two-cols">` (classe global de `styles.scss:77`; o override `td .two-cols` de `transactions.scss` so vale dentro da tabela) e adicionar `<button class="ghost-button" type="button" (click)="clearTransactionForm()">Cancelar</button>`. Nao mexer no "Cancelar" da tabela (linha 87, cancela o lancamento) nem no "Sair" da edicao inline (linha 126).
  - Criterios: 4, 5, 6, 7, 27

## Testes

- [x] **T9** — Criar `categories.spec.ts` cobrindo presenca/rotulo/`type` do botao, limpeza em criacao, restauracao no 1o clique, saida da edicao no 2o, `PUT`/`POST` corretos e ausencia de requisicoes
  - Arquivos: `frontend/src/app/features/categories/categories.spec.ts`
  - Detalhe: primeiro spec de componente do projeto — padrao de `main-layout.spec.ts` + `category.service.spec.ts` (`provideHttpClient()`/`provideHttpClientTesting()`, `authService.superAdmin.set(true)`, flush do `GET /api/categories` do `ngOnInit`, `httpMock.verify()` no `afterEach`). Testes dirigidos pelo DOM (membros do componente sao `protected`). Inclui o caso sem `superAdmin` (formulario e botao ausentes).
  - Criterios: 1, 5, 6, 7, 8, 13, 18, 19, 21, 22, 25, 28
- [x] **T10** — Criar `users.spec.ts` cobrindo senha como unica alteracao pendente, limpeza de `fieldErrors`/faixa do topo e os dois estagios
  - Arquivos: `frontend/src/app/features/users/users.spec.ts`
  - Detalhe: flush de `GET /api/users` + `GET /api/profiles`; erro de validacao simulado com 400 + `violations[]` para conferir que "Cancelar" apaga as legendas vermelhas e a `.status-bar` em criacao, na restauracao e na saida da edicao.
  - Criterios: 2, 5, 6, 9, 12, 14, 15, 18, 19, 20, 21, 23, 25, 26, 28
- [x] **T11** — Criar `profiles.spec.ts` com foco na matriz de permissoes (um checkbox ja e alteracao pendente, restauracao nos dois sentidos, matriz zerada no 2o clique)
  - Arquivos: `frontend/src/app/features/profiles/profiles.spec.ts`
  - Criterios: 3, 5, 6, 10, 16, 17, 18, 19, 21, 24, 25, 28
- [x] **T12** — Criar `transactions.spec.ts` cobrindo o estagio unico, o retorno do dropdown para Despesa sem novo request e a ausencia de requisicoes no clique
  - Arquivos: `frontend/src/app/features/transactions/transactions.spec.ts`
  - Detalhe: flush de `GET /api/transactions`, `GET /api/categories` e `GET /api/categories?type=EXPENSE`; trocar o tipo para Receita antes de cancelar e conferir que as opcoes de Despesa voltam vindas do cache (`expectNone` de qualquer `GET /categories`).
  - Criterios: 4, 5, 6, 11, 27, 28
- [x] **T13** — Confirmar que nenhum arquivo de `backend/` foi tocado e rodar a suite do backend
  - Arquivos: nenhum (verificacao: `git diff --name-only` sem caminho sob `backend/` + `cd backend && ./mvnw test`)
  - Detalhe: se durante a implementacao surgir necessidade de mexer no servidor, o escopo mudou — parar e perguntar, conforme o plano.
  - Criterios: 30

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Botao "Cancelar" em Categorias no modo de criacao | T2, T9 |
| 2 | Botao "Cancelar" em Usuarios no modo de criacao | T4, T10 |
| 3 | Botao "Cancelar" em Perfis no modo de criacao | T6, T11 |
| 4 | Botao "Cancelar" no formulario "Novo lancamento" | T8, T12 |
| 5 | Rotulo "Cancelar" nas 4 telas e nos 2 estagios | T2, T4, T6, T8, T9, T10, T11, T12 |
| 6 | Botao com `type="button"` (nao submete o form) | T2, T4, T6, T8, T9, T10, T11, T12 |
| 7 | Sem permissao de criacao, botao nao aparece (gate do `<form>` intacto) | T2, T4, T6, T8, T9 |
| 8 | Categorias: limpar volta ao estado inicial | T1, T9 |
| 9 | Usuarios: limpar volta ao estado inicial | T3, T10 |
| 10 | Perfis: nome vazio e matriz toda desmarcada | T5, T11 |
| 11 | Lancamentos: estado inicial e dropdown de volta em Despesa | T7, T12 |
| 12 | Usuarios: cancelar em criacao limpa mensagens do backend | T3, T10 |
| 13 | Categorias: 1o clique restaura os valores do registro | T1, T9 |
| 14 | Usuarios: 1o clique restaura o registro e esvazia a senha | T3, T10 |
| 15 | Usuarios: so senha digitada ja e alteracao pendente | T3, T10 |
| 16 | Perfis: 1o clique restaura nome e matriz | T5, T11 |
| 17 | Perfis: um unico checkbox ja e alteracao pendente | T5, T11 |
| 18 | Apos o 1o clique o formulario continua em edicao (titulo mantido) | T1, T3, T5, T9, T10, T11 |
| 19 | Cancelar + Salvar envia `PUT /{recurso}/{id}` do mesmo id | T1, T3, T5, T9, T10, T11 |
| 20 | Usuarios: restaurar tambem limpa mensagens do backend | T3, T10 |
| 21 | Sem alteracao pendente, o 1o clique ja sai da edicao | T1, T3, T5, T9, T10, T11 |
| 22 | Categorias: dois cliques (restaura, depois sai) | T1, T9 |
| 23 | Usuarios: dois cliques (restaura, depois sai) | T3, T10 |
| 24 | Perfis: dois cliques (restaura, depois zera a matriz) | T5, T11 |
| 25 | Apos sair da edicao, Salvar envia `POST` | T1, T3, T5, T9, T10, T11 |
| 26 | Usuarios: mensagens limpas apos sair da edicao | T3, T10 |
| 27 | Lancamentos permanece de estagio unico (sem modo de edicao no form) | T7, T8, T12 |
| 28 | Nenhuma requisicao HTTP ao clicar em "Cancelar" | T1, T3, T5, T7, T9, T10, T11, T12 |
| 29 | Tabela lateral inalterada nas 4 telas | T1, T3, T5, T7 |
| 30 | `backend/` intocado e `./mvnw test` verde | T13 |

## Lacunas

- Nenhuma — todos os 30 criterios de aceite estao cobertos por ao menos uma tarefa, e nenhuma tarefa ficou sem criterio.
- Convencao "toda regra de negocio e imposta no back-end": verificada e nao violada. Nenhum criterio desta spec descreve regra de negocio nova (nada e enviado ao servidor ao cancelar; nao ha campo, validacao nem endpoint novo), e o criterio 30 exige explicitamente `backend/` inalterado. O unico criterio com cara de autorizacao (7) se apoia no gate ja existente (`authService.can(...)` no `<form>` como espelho de UX, com `accessControl.require(Screen, Action)` continuando a impor no servidor) — nenhuma tarefa afrouxa esse gate.
- Observacao de escopo (nao e lacuna): o criterio 29 e verificado apenas por validacao manual na tela; o plano nao previu assert automatizado da contagem da tabela lateral. As tarefas T9-T12 cobrem o efeito equivalente com `expectNone`/`httpMock.verify()`.
