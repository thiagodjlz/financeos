# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Feature 100% frontend (criterio 16): nao ha tarefas de Backend nem de Migration. A ordem segue o plano: base visual compartilhada primeiro, depois Lancamentos (tela de referencia, so layout), depois Categorias e por fim Usuarios (a mais complexa), cada tela com componente + template/scss e spec em tarefas separadas.

## Base visual compartilhada

- [x] **T1** — Criar a base visual comum em `styles.scss`: mover `.row-actions`, `.modal-backdrop`, `.modal-card` e `.modal-actions` de `transactions.scss` para o global; dar largura fixa unica aos botoes dentro de `.row-actions` (que caiba no maior rotulo, "Desativar", alem do `min-height: 32px`); criar `.danger-button` (fundo `#b84a3f`, texto branco, mesmas dimensoes de `.primary-button`/`.ghost-button`, com a variante 32px dentro de `.row-actions`); adicionar suporte a `table-layout: fixed` nas tabelas e `white-space: normal` (quebra em vez de corte) nas colunas de texto livre.
  - Arquivos: `frontend/src/styles.scss`, `frontend/src/app/features/transactions/transactions.scss` (remocao das regras movidas)
  - Criterios: 12, 13, 14, 17

- [x] **T2** — Confirmar via curl o corpo real das respostas 409 do backend (`PUT /api/categories/{id}` com nome+tipo duplicados; `PUT /api/users/{id}` com e-mail duplicado e com autodesativacao), para definir a extracao de mensagem no front (corpo quando existir, fallback por `status === 409` quando vazio). Se a conclusao for que so um `ExceptionMapper` no backend resolve, **parar e perguntar ao usuario** (criterio 16 proibe mudanca no backend).
  - Arquivos: — (investigacao; o resultado alimenta T5 e T8)
  - Criterios: — (subsidio ao tratamento de erro dos criterios 6 e 10; sem criterio proprio)

## Lancamentos (referencia de layout)

- [x] **T3** — Aplicar em Lancamentos o layout estavel e as cores de cancelar: `<colgroup>` com larguras por coluna (Data, Descricao, Categoria, Status, Valor, acoes) + `table-layout: fixed`; trocar para `danger-button` a classe do "Cancelar" da tabela, do "Sair" da edicao inline e do "Cancelar" do formulario "Novo lancamento"; no scss, larguras do colgroup e ajuste de padding dos inputs/selects da linha em edicao para caberem nas celulas. **Nenhuma mudanca de logica em `transactions.ts`** (preserva categoria inativa pinada, status oculto em receita, DELETE do "Cancelar" da tabela e modal de saida).
  - Arquivos: `frontend/src/app/features/transactions/transactions.html`, `frontend/src/app/features/transactions/transactions.scss`
  - Criterios: 12, 13, 14, 15, 17

- [x] **T4** — Ajustar `transactions.spec.ts`: atualizar apenas os seletores que localizam por `.ghost-button` os botoes que viraram `danger-button`; os testes de comportamento existentes (categoria inativa pinada, status oculto em receita, Cancelar da tabela com DELETE, modal de saida) devem continuar passando sem mudanca de asserts de comportamento.
  - Arquivos: `frontend/src/app/features/transactions/transactions.spec.ts`
  - Criterios: 15

## Categorias

- [x] **T5** — Implementar em `categories.ts` a edicao inline no padrao de Lancamentos e separar a criacao: `form`/`cancel()` viram somente-criacao com estagio unico (`resetForm()` sem snapshot, sem HTTP); novos membros `editingId`, `editForm { name, type, color, icon, active }`, `editSnapshot`, `confirmingExit`, `startEdit()`, `isEditDirty()` (via `JSON.stringify`, incluindo cor e icone), `saveEdit()` (chama `categoryService.update` + `refresh()` e fecha a linha), `requestExit()` (sem alteracao sai direto sem modal/HTTP), `confirmExitYes()` (descarta e recarrega da API), `confirmExitNo()`; erro de `saveEdit` com `status === 409` exibe "Ja existe uma categoria com esse nome e tipo." (corpo se vier, fallback por status conforme T2) mantendo a linha em edicao.
  - Arquivos: `frontend/src/app/features/categories/categories.ts`
  - Criterios: 1, 2, 3, 4, 5, 6

- [x] **T6** — Reescrever o template e o scss de Categorias: formulario lateral com titulo fixo "Nova categoria", `*ngIf` por `CATEGORIES/CREATE`, Cancelar com `danger-button`; tabela com `<colgroup>`, linha em leitura com "Editar" (visivel com `CATEGORIES/EDIT`, `[disabled]` quando outra linha esta em edicao) e linha em modo edicao (padrao `ng-container` + `<tr>` de Lancamentos): Nome = input texto + controles compactos de Cor (`input type="color"`) e Icone na mesma celula, Tipo = select Despesa/Receita, Situacao = select Ativo/Inativo (`[ngValue]`), acoes = "Salvar" (`primary-button`) e "Sair" (`danger-button`); modal "Deseja sair sem salvar?" no fim do template; no scss, larguras do colgroup e estilo compacto (32px) dos controles de cor/icone.
  - Arquivos: `frontend/src/app/features/categories/categories.html`, `frontend/src/app/features/categories/categories.scss`
  - Criterios: 1, 2, 3, 4, 5, 12, 13, 14, 17

- [x] **T7** — Reescrever `categories.spec.ts`: remover os testes do Cancelar de dois estagios (comportamento antigo, issue #28) e cobrir: Cancelar estagio unico na criacao sem HTTP (`httpMock.expectNone`), entrada em edicao inline com controles de nome/tipo/situacao/cor/icone e formulario lateral intocado, apenas uma linha por vez ("Editar" das demais `disabled`), Salvar com `PUT /api/categories/{id}` incluindo cor/icone + refresh, Sair sem alteracao sem modal e sem HTTP, Sair com alteracao abre modal (Sim descarta e recarrega / Nao mantem), 409 (flush 409 no `HttpTestingController`) exibe a mensagem em portugues e mantem a linha em edicao.
  - Arquivos: `frontend/src/app/features/categories/categories.spec.ts`
  - Criterios: 1, 2, 3, 4, 5, 6

## Usuarios

- [x] **T8** — Implementar em `users.ts` a edicao inline e a criacao somente-criacao: `form`/`cancel()`/`resetForm()` viram estagio unico (continuando a limpar `fieldErrors` + `dismissError()`; senha volta a ser sempre obrigatoria na criacao); novos membros `editingId` (apontando para a linha), `editForm { name, email, password: '', profileId, active }`, `editSnapshot` com `password: ''` (senha vazia nao conta como alteracao pendente), `confirmingExit`, `startEdit()` (nunca carrega a senha), `saveEdit()` enviando `password: this.editForm.password || undefined` via `userService.update`, `requestExit()`/`confirmExitYes()`/`confirmExitNo()`; erros do `saveEdit`: signal separado `editFieldErrors` alimentado pelo `extractViolations` existente (400 com `violations[]`), faixa do topo via `showError`, e fallback de 409 conforme T2 ("E-mail ja cadastrado." quando identificavel; sem assumir cegamente essa mensagem no caso de autodesativacao), mantendo a linha em edicao.
  - Arquivos: `frontend/src/app/features/users/users.ts`
  - Criterios: 7, 8, 9, 10

- [x] **T9** — Reescrever o template e o scss de Usuarios: formulario lateral com titulo fixo "Novo usuario", `*ngIf` por `USERS/CREATE`, senha sempre `required` (remover o hint "(deixe em branco para manter)" e o checkbox Ativo de edicao), Cancelar com `danger-button`; tabela com `<colgroup>` e linha de edicao: Nome = input, E-mail = input + campo compacto de Senha (`type="password"`, placeholder "Nova senha (opcional)") na mesma celula, Perfil = select com `profiles()`, Status = controle Ativo/Inativo, acoes = "Salvar"/"Sair" substituindo "Editar"/"Desativar" (o "Desativar" segue na linha em leitura, visivel com `USERS/DELETE` e usuario ativo); `<small class="field-error">` sob cada controle da linha para os `violations[]` mapeaveis; modal de saida; no scss, larguras do colgroup e `field-error` dentro da celula crescendo em altura, nunca em largura.
  - Arquivos: `frontend/src/app/features/users/users.html`, `frontend/src/app/features/users/users.scss`
  - Criterios: 7, 8, 9, 10, 11, 12, 13, 14, 17

- [x] **T10** — Reescrever `users.spec.ts`: remover os testes do Cancelar de dois estagios e cobrir: criacao com Cancelar estagio unico limpando validacoes por campo e faixa do topo sem HTTP, edicao inline (uma linha por vez, senha entra vazia, formulario lateral intocado), `PUT /api/users/{id}` sem `password` quando o campo fica vazio e com `password` quando preenchida, senha vazia nao dispara o modal do "Sair", 400 com `violations[]` exibindo erro por campo na linha + faixa no topo com a linha mantida em edicao, 409 de e-mail duplicado ("E-mail ja cadastrado."), "Desativar" some na linha em edicao e continua com `DELETE` na linha em leitura.
  - Arquivos: `frontend/src/app/features/users/users.spec.ts`
  - Criterios: 7, 8, 9, 10, 11

## Regressao e build

- [x] **T11** — Rodar a regressao completa e conferir o escopo: `npm test` e `npm run build` no frontend verdes; `./mvnw test` no backend verde; `git status`/`git diff` sem **nenhum** arquivo de `backend/` alterado (diff de backend vazio).
  - Arquivos: — (verificacao; nenhum arquivo alterado por esta tarefa)
  - Criterios: 15, 16

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Categorias: "Editar" vira edicao inline na linha (nome, tipo, situacao + cor/icone compactos), sem formulario lateral | T5, T6, T7 |
| 2 | Formulario de Categorias somente criacao, titulo fixo, Cancelar estagio unico sem HTTP | T5, T6, T7 |
| 3 | "Salvar" envia `PUT /api/categories/{id}` (com cor e icone), recarrega e volta a leitura | T5, T6, T7 |
| 4 | Categorias: uma linha em edicao por vez, "Editar" das demais `disabled` | T5, T6, T7 |
| 5 | Categorias: "Sair" com alteracao abre modal (Sim/Nao); sem alteracao sai direto sem modal/HTTP | T5, T6, T7 |
| 6 | 409 de nome+tipo duplicado exibido em portugues, linha segue em edicao | T5, T7 |
| 7 | Usuarios: edicao inline na linha (nome, e-mail, perfil, status + senha opcional vazia), sem formulario lateral | T8, T9, T10 |
| 8 | Formulario de Usuarios somente criacao, senha obrigatoria, Cancelar estagio unico limpando validacoes | T8, T9, T10 |
| 9 | Usuarios: mesmos comportamentos 3/4/5 com `PUT /api/users/{id}`; senha vazia = mantem e nao conta como pendente | T8, T9, T10 |
| 10 | Erros 400 `violations[]` e 409 exibidos na faixa do topo **e** por campo na linha, sem validacao nova no front | T8, T9, T10 |
| 11 | "Desativar" presente em leitura (com `USERS/DELETE` e usuario ativo) e da lugar a "Salvar"/"Sair" em edicao | T9, T10 |
| 12 | Entrar em edicao nao altera a largura de nenhuma coluna (Lancamentos, Categorias, Usuarios) | T1, T3, T6, T9 |
| 13 | Conteudo das demais linhas segue integralmente visivel; controles cabem sem estourar a tabela | T1, T3, T6, T9 |
| 14 | Botoes de acao de linha com padrao visual comum e mesmas dimensoes entre si | T1, T3, T6, T9 |
| 15 | Comportamentos existentes de Lancamentos intactos; `npm test` verde | T3, T4, T11 |
| 16 | Nenhum endpoint/regra nova no backend; `./mvnw test` verde; diff de `backend/` vazio | T11 |
| 17 | Todo botao com papel de cancelar/descartar em vermelho (`#b84a3f`), sem alterar dimensoes | T1, T3, T6, T9 |

Todos os 17 criterios tem ao menos uma tarefa.

## Lacunas

- Nenhum criterio de aceite ficou sem tarefa, e nenhuma tarefa (fora T2 e T11, infraestrutura/regressao declaradas como tal) ficou sem criterio.
- Nenhuma regra de negocio nova fica so no frontend: os criterios 6 e 10 consomem validacoes ja impostas pelo backend (`PUT` existentes); o fallback de mensagem por `status === 409` no front e apenas traducao de um status decidido pelo backend, nao uma regra nova (conforme plano).
- **Ponto de atencao (nao e lacuna de cobertura)**: o criterio 10 fixa "E-mail ja cadastrado." como mensagem do 409 de Usuarios, mas o mesmo status 409 tambem cobre a autodesativacao ("Voce nao pode desativar a propria conta.") — e o corpo das respostas 409 do backend provavelmente chega vazio ao Angular. T2 resolve isso com o teste real do corpo; se a unica saida for um `ExceptionMapper` no backend (vetado pelo criterio 16), a implementacao deve parar e perguntar ao usuario, como o plano ja preve.
- Os criterios 12, 13, 14 e 17 sao de layout/estilo e a evidencia final e visual (medicao via DevTools na etapa `/pipeline:verify`, como o plano define) — jsdom nao mede layout, entao as tarefas de spec (T4, T7, T10) nao os provam sozinhas; as tarefas de CSS/template (T1, T3, T6, T9) sao a implementacao e a verificacao manual e a prova.
