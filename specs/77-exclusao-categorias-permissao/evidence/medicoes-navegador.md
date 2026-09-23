# Medicoes no navegador (issue 77)

Build servido em `http://localhost` (`main-IOBKW6U3.js`, chunk da tela `chunk-CsFwY2As.js`, identicos ao `frontend/dist` da etapa build). Chrome headless via CDP. Todas as chamadas `/api/*` foram atendidas **dentro da sessao do navegador** (`Fetch.fulfillRequest`) com dados sinteticos (3 categorias: "Teste Ativa", "Teste Inativa" inativa, "Teste Outra"). Nada chegou ao backend nem ao banco, inclusive os `DELETE`/`POST`/`PUT` da simulacao. Valores lidos com `getComputedStyle`/`getBoundingClientRect`/`Range.getClientRects`/`document.activeElement`.

| Medicao | Resultado |
|---|---|
| Lixeira a 1440 (superAdmin) | presente nas 3 linhas (ativas e inativa); `button type=button`, `aria-label`/`title` "Excluir"; botao 32x32; SVG 20x20, `viewBox 0 0 24 24`, `stroke currentColor`, `stroke-width 1.8`, `aria-hidden true`; centro vertical igual ao do "Editar" (delta 0), 8 px depois dele, dentro da coluna de acoes (87 px de folga) |
| Cores efetivas da lixeira | icone `oklch(0.42 0.17 25)` (~`rgb(148, 0, 21)`), borda `oklch(0.64 0.008 80) 1px`, fundo `rgb(255, 255, 255)`, `cursor: pointer` |
| Linha em edicao | linha editada sem lixeira; nas outras 2 linhas lixeira e "Editar" `disabled` (opacity 0.55, `cursor: not-allowed`); larguras das colunas 388/140/150/200 identicas antes e durante a edicao |
| Clique na lixeira | `role=dialog` com "Deseja excluir a categoria "Teste Inativa"? A exclusão não pode ser desfeita.", botoes "Cancelar" / "Excluir categoria"; foco inicial em "Cancelar" |
| Cancelar / Esc | modal fecha, **0 requisicoes**, 0 toasts; foco volta para a lixeira da linha |
| Confirmar com 409 | 1 requisicao (`DELETE /api/categories/c-1`), **nenhum `GET` depois**; toast `toast-warning` titulo "Alerta"; `.toast-message` `white-space: pre-line`; `innerText` em 2 linhas logicas ("Não é possível excluir a categoria. Ela está em uso em:" / "Lançamentos: 3 registros"); "Lançamentos" comeca na margem esquerda da mensagem, 18 px abaixo do caractere anterior (line-height 18.2px); toast de 340 px quebra a 1a frase em 2 linhas visuais (3 caixas de linha no total); categoria continua na tabela |
| Confirmar com 204 | `DELETE /api/categories/c-2` + `GET /api/categories`; toast `toast-success` "Sucesso" / "Categoria excluída com sucesso." (1 linha, 18 px); categoria some da tabela |
| Nao-regressao | criar: `POST` + `GET`, toast "Categoria salva com sucesso." em 1 linha (18 px); "Sair" sem alteracao fecha direto; com alteracao abre "Deseja sair sem salvar?" ("Continuar editando" / "Sair sem salvar") e descarta; Situacao Inativo -> `PUT` com `active:false` + `GET`, etiqueta "Inativo", toast "Categoria atualizada com sucesso." |
| 390 px | lixeira 44x44 (`--touch-target`), "Editar" 69x44, alinhados (delta 0); sem rolagem horizontal (`scrollWidth` 375 = `clientWidth` 375) |
| Perfil com ver/criar/alterar e **sem** excluir | 0 elementos `button.icon-button` / `[aria-label="Excluir"]` no DOM; 3 "Editar" |
| Perfil com ver + excluir, sem alterar | 3 lixeiras, 0 "Editar" |
| Bundle servido | `white-space:pre-line` em `main-IOBKW6U3.js`; no chunk da tela `Categoria exclu\xEDda com sucesso.`, `A exclus\xE3o n\xE3o pode ser desfeita.`; 0 ocorrencias de `Ã`/`Â` |

## Backend servido (container `financeos-backend`, `/deployments/app/backend-1.0.2-dev.jar`)

Busca por bytes UTF-8 exatos nas classes do jar em execucao:

- presentes: "Não é possível excluir a categoria. Ela está em uso em:" (`CategoryUsageCheck`), "Excluir uma categoria a remove definitivamente" (`CategoriesAreaContent`), "Tela de Categorias: botão Excluir em cada linha" (`ReleaseNotesContent`);
- ausentes em todas as classes: "Excluir uma categoria significa apenas torná-la Inativa", "uma desativação em Categorias".

## Banco local (somente leitura)

`pg_constraint`: `transactions.category_id`, `categories.parent_id`, `planning_items.category_id` com `confdeltype = n` (on delete set null). 46 categorias, todas ativas; 43 com lancamentos, 3 sem (dados reais do usuario — nao usar no roteiro).

## Rodada 2 (apos T13, 2026-09-23 10:27)

Build servido: `main-FSYZP322.js` + chunk da tela `chunk-SgVfbRDS.js`, sha256 identicos aos de `frontend/dist/frontend/browser` (build de 10:21, depois do `categories.ts` de 10:15). O chunk servido contem `confirmDelete` com `try` so no `remove` e `refreshAfterChange()` com `toast.error(F)` guardado por `classifyHttpError`. Mesmo metodo da rodada 1: Chrome headless via CDP, `/api/*` atendido na sessao do navegador (`Fetch.fulfillRequest`), 3 categorias sinteticas; nada chegou ao backend nem ao banco. Script: scratchpad da sessao (`cdp.mjs`).

| Cenario | Requisicoes | Toasts (tipo / mensagem) | Estado da tela |
|---|---|---|---|
| Excluir: `DELETE` 204 + `GET` 500 | `DELETE /api/categories/c-2`, `GET /api/categories` | Sucesso "Categoria excluída com sucesso." + Falha "Não foi possível carregar as categorias." | nenhum "Não foi possível excluir"; lista antiga mantida (3 linhas) |
| Excluir: 204 + `GET` 200 | `DELETE`, `GET` | so Sucesso "Categoria excluída com sucesso." | linha removida (2 linhas) |
| Excluir: 409 | so `DELETE` (sem `GET`) | Alerta com `\n` preservado no `innerText`, `white-space: pre-line` | categoria continua |
| Cancelar / Esc no modal | 0 | 0 | modal fecha |
| Criar: `POST` 201 + `GET` 500 | `POST`, `GET` | Sucesso "Categoria salva com sucesso." + Falha "Não foi possível carregar as categorias." | formulario limpo, 0 `.invalid`, Salvar habilitado |
| Criar: 201 + `GET` 200 | `POST`, `GET` | so Sucesso | nova linha na tabela, formulario limpo |
| Editar Situação -> Inativo: `PUT` 200 + `GET` 500 | `PUT`, `GET` | Sucesso "Categoria atualizada com sucesso." + Falha "Não foi possível carregar as categorias." | saiu da edicao, Salvar habilitado |
| Editar Situação: `PUT` 200 + `GET` 200 | `PUT`, `GET` | so Sucesso | etiqueta "Inativo" |
| Linha em edicao | — | — | sem lixeira na linha editada; lixeira e "Editar" `disabled` nas outras 2 |
| "Sair" com alteracao | `GET` ao confirmar | — | modal "Deseja sair sem salvar?" / "Continuar editando" / "Sair sem salvar"; descarta |
| Excluir: 204 + `GET` 401 | `DELETE`, `GET` | Sucesso + Alerta "Sua sessão expirou. Entre novamente." (do interceptor) | sem o aviso da lista; redireciona a `/login` |
| Perfil sem `canDelete` | — | — | 0 `[aria-label=Excluir]`, 3 "Editar" |
