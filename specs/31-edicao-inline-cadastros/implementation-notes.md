# Notas de implementacao

Branch: `feature/issue-31-edicao-inline-cadastros` (mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 11 de 11 concluidas (ver `tasks.md`)

## Arquivos alterados

- `frontend/src/styles.scss` — base visual comum: `.danger-button` (fundo `#b84a3f`, texto branco, mesmas dimensoes de `.primary-button`/`.ghost-button`); `.row-actions` movido do scss de Lancamentos para o global, agora com largura fixa de 90px para todos os botoes de linha (cabe no maior rotulo, "Desativar"); `.modal-backdrop`/`.modal-card`/`.modal-actions` movidos para o global; `table.fixed-layout` (`table-layout: fixed`, celulas com `white-space: normal` + `overflow-wrap: anywhere` para quebrar em vez de cortar, inputs/selects de celula com padding compacto, `.field-error` em bloco dentro de `td`).
- `frontend/src/app/features/transactions/transactions.html` — `<colgroup>` + classe `fixed-layout` na tabela; "Cancelar" do formulario, "Cancelar" da tabela e "Sair" da edicao inline trocados para `danger-button`. Nenhuma mudanca em `transactions.ts` (criterio 15).
- `frontend/src/app/features/transactions/transactions.scss` — removidas as regras movidas para o global; larguras do colgroup (Data 140, Categoria 170, Status 200, Valor 110, acoes 210, Descricao com o restante) e `min-width: 1000px` na tabela.
- `frontend/src/app/features/transactions/transactions.spec.ts` — so o seletor do Cancelar do formulario (`.ghost-button` -> `.danger-button`); asserts de comportamento intactos.
- `frontend/src/app/features/categories/categories.ts` — edicao inline no padrao de Lancamentos (`editingId`, `editForm` com name/type/color/icon/active, `editSnapshot`, `startEdit`, `isEditDirty`, `saveEdit`, `requestExit`, `confirmExitYes/No`); formulario lateral virou somente-criacao com `cancel()` de estagio unico (sem HTTP); 409 tratado com corpo da resposta quando existir e fallback "Ja existe uma categoria com esse nome e tipo.", mantendo a linha em edicao.
- `frontend/src/app/features/categories/categories.html` — titulo fixo "Nova categoria", `*ngIf` por `CATEGORIES/CREATE`, Cancelar `danger-button`; tabela com colgroup + linha de edicao (nome + cor + icone compactos na celula Nome, selects de Tipo e Situacao), "Editar" desabilitado com outra linha em edicao, "Salvar"/"Sair" na linha em edicao, modal "Deseja sair sem salvar?".
- `frontend/src/app/features/categories/categories.scss` — larguras do colgroup e grid compacta `.inline-name-fields` (input de nome + seletor de cor 44px + icone).
- `frontend/src/app/features/categories/categories.spec.ts` — reescrito: criacao com Cancelar de estagio unico sem HTTP, entrada em edicao inline sem tocar o formulario lateral, uma linha por vez, PUT com cor/icone + refresh, Sair sem alteracao sem modal/HTTP, modal com Sim/Nao, 409 com mensagem em portugues mantendo a edicao.
- `frontend/src/app/features/users/users.ts` — mesmo movimento: criacao somente no formulario (`cancel()` de estagio unico limpando `fieldErrors` + faixa do topo; `form` sem `active`); edicao inline com `editForm` (senha sempre entra vazia, snapshot com `password: ''`), `editFieldErrors` separado alimentado pelo mesmo `extractViolations`, `saveEdit` enviando `password || undefined`, faixa do topo via `showError`, fallback de 409 "E-mail ja cadastrado.".
- `frontend/src/app/features/users/users.html` — titulo fixo "Novo usuario", senha sempre `required` (hint e checkbox Ativo de edicao removidos), Cancelar `danger-button`; tabela com colgroup + linha de edicao (senha compacta "Nova senha (opcional)" na celula do e-mail, select de Perfil, select Ativo/Inativo, `field-error` por campo), "Desativar" so na linha em leitura, "Salvar"/"Sair" em edicao, modal de saida.
- `frontend/src/app/features/users/users.scss` — larguras do colgroup, `min-width: 960px`, pilha vertical `.inline-email-fields` (cresce em altura, nunca em largura).
- `frontend/src/app/features/users/users.spec.ts` — reescrito: criacao (titulo fixo, senha obrigatoria, Cancelar limpa validacoes sem HTTP), edicao inline (senha vazia, uma linha por vez, formulario intocado), PUT sem/com `password`, senha vazia nao dispara modal do Sair, 400 `violations[]` por campo na linha + faixa, 409 de e-mail, Desativar com DELETE em leitura e oculto em edicao.

## Decisoes

- **T2 (corpo dos 409)**: confirmado que as respostas de `WebApplicationException(mensagem, status)` chegam com corpo vazio — teste empirico via curl no endpoint de login (mesmo construto, respondeu `401` com `content-length: 0`) e ausencia de qualquer `ExceptionMapper` no backend. As credenciais de dev foram rotacionadas para fora do repositorio (V10), entao nao foi possivel disparar o 409 real autenticado; a evidencia acima e suficiente. O front extrai o corpo quando existir (string ou `{message}`) e usa fallback por `status === 409` com o texto conhecido — sem mudanca no backend, sem necessidade de parar e perguntar.
- **409 de autodesativacao nao ameaca o fallback de Usuarios**: lendo `UserResource`, a checagem "Voce nao pode desativar a propria conta." existe **apenas no `DELETE /users/{id}`** — o `PUT` nao a possui. Logo o unico 409 possivel no `saveEdit` (PUT) e o de e-mail duplicado, e o fallback "E-mail ja cadastrado." e inequivoco. (O `PUT` com `active: false` no proprio usuario e aceito pelo backend hoje; comportamento preexistente, fora do escopo.)
- **`table-layout: fixed` via classe (`fixed-layout`)**, nao no seletor global `table`, para nao afetar a tabela de Perfis (fora do escopo).
- O tratamento de 409 em Categorias vale tambem para o `save()` de criacao (o backend valida o POST com a mesma regra); antes a mensagem era generica.
- Botoes "Nao"/"Sim" do modal de saida permanecem `ghost`/`primary` (o criterio 17 lista apenas os "Cancelar" dos formularios, o "Cancelar" da tabela de Lancamentos e o "Sair" da edicao inline).
- `mvnw test` (30 testes), `npm test` (59 testes) e `npm run build` verdes; `git diff` de `backend/` vazio (criterio 16).

## Desvios em relacao ao plano e as tarefas

- O helper `settle()` dos specs novos de Categorias/Usuarios ganhou um `detectChanges()` final (a resolucao da promise de `refresh()` apos o flush acontecia depois do ultimo render do helper original); nao previsto no plano, sem efeito no comportamento da aplicacao.
- Nenhum outro desvio: o plano previa possivel parada por causa do corpo dos 409, mas o fallback por status resolveu sem tocar o backend.
