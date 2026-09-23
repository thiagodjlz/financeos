---
issue: 77
url: https://github.com/thiagodjlz/financeos/issues/77
title: "Tela de Categorias nao tem botao de excluir, e a permissao correspondente nao controla nada"
domains: [categories, auth, transactions, documentation]
target: main
stage: pr-open
branch: feature/issue-77-exclusao-categorias-permissao
created: 2026-09-23
---

# Tela de Categorias nao tem botao de excluir, e a permissao correspondente nao controla nada

## Historia

Como operador com permissao de excluir categorias, quero excluir pela tela uma categoria que nao esta em uso e, quando ela estiver em uso, saber onde e quantos registros a usam, para manter o catalogo limpo sem quebrar lancamentos existentes.

## Contexto

Corpo da issue **truncado** (termina em "Solicitar confirmação antes de e"); os criterios completam a lista a partir das secoes 1 a 5. Conferido no codigo:

- `DELETE /api/categories/{id}` ja tem `require(CATEGORIES, DELETE)`, mas e soft delete (`active=false`) via `findActiveById` (404 se inativa), sem checar vinculo. `categories.html` so tem "Editar" (lacuna registrada em `knowledge/categories.md`, #70). Categorias sao catalogo global; transacoes sao por usuario.
- FKs para `categories(id)` (todas `on delete set null`): `transactions.category_id`, `categories.parent_id` (sem UI), `planning_items.category_id` (legada, sem tela). **Contas e Metas nao existem.**
- Exclusao atual nao usa icone nem modal; existe icone SVG inline 20px e o modal `core/confirm-dialog`. Erro de negocio vira `{"message"}` (`BusinessExceptionMapper`) e toast de Alerta (`toast.fromHttpError`); o `toast-host` hoje nao preserva quebra de linha. Precedente: `DELETE /profiles/{id}` -> 409.
- A Central publica o oposto (`CategoriesAreaContent`: "Excluir uma categoria significa apenas torná-la Inativa..."; `ProfilesAreaContent`: "uma desativação em Categorias").
- Varreduras de acentuacao (`architecture.md`, "Idioma") na `main` em 2026-09-23: 2 linhas frontend, 6 backend.

## Criterios de aceite

Backend

- [x] CA1: `DELETE /api/categories/{id}` responde 403 "Você não tem permissão para realizar esta ação." sem `CATEGORIES/DELETE`, sem alterar a categoria.
- [x] CA2: categoria sem lancamento vinculado (ativa ou inativa) -> 204 e a linha e removida fisicamente de `categories` (`findById` vazio; some de `GET /api/categories`).
- [x] CA3: categoria inativa com lancamento vinculado -> 409 (nao 404); id inexistente -> 404.
- [x] CA4: com N lancamentos vinculados -> 409, categoria e lancamentos inalterados, `message` acentuada com "Não é possível excluir a categoria.", "Lançamentos" e N.
- [x] CA5: N soma lancamentos de **todos os usuarios** e **todos os status** (`CANCELED` incluso): teste com lancamentos de dois usuarios, um cancelado, confere o total; a mensagem nao traz nome, e-mail nem descricao de terceiros.
- [x] CA6: subcategoria (`parent_id`) e `planning_items` nao bloqueiam: categoria so com esses vinculos -> 204, a subcategoria fica com `parent_id` nulo e o `planning_items` com `category_id` nulo.
- [x] CA7: a checagem e uma lista de tipos de vinculo (rotulo de tela + contagem), hoje com um item (Lancamentos); com mais de um tipo a mensagem agrupa por tela, uma linha por tela com quantidade, omite tela com zero e nao cita tabela, coluna, enum ou classe (teste unitario com dois tipos simulados).
- [x] CA8: a regra vive no backend: o 409 de CA4 ocorre por chamada direta a API.

Frontend (tela Categorias)

- [x] CA9: linhas em leitura (ativas e inativas) tem botao com icone de lixeira (SVG inline 20px), `aria-label`/`title` "Excluir", so com `can('CATEGORIES','DELETE')`; sem a permissao nao esta no DOM (teste nos dois casos).
- [x] CA10: com uma linha em edicao, a lixeira nao existe nessa linha e fica `disabled` nas demais, igual a "Editar".
- [x] CA11: clicar abre `core/confirm-dialog` citando o nome da categoria, com rotulo de confirmacao que nomeia a acao; cancelar fecha sem HTTP (teste com `httpMock`).
- [x] CA12: confirmar envia `DELETE /api/categories/{id}`; no 204 recarrega a lista e mostra toast de Sucesso "Categoria excluída com sucesso.".
- [x] CA13: no 409 aparece o toast de Alerta com a `message` do backend, cada linha visivel separada (quebra preservada: `white-space` computado `pre-line` ou equivalente), e a categoria continua na lista.

Nao-regressao

- [x] CA14: criacao, edicao inline ("Sair" com modal "Deseja sair sem salvar?") e desativar/reativar pelo Situacao seguem funcionando.
- [x] CA15: dropdown de categoria de Lancamentos e o Resumo seguem iguais para categorias nao excluidas; toasts de uma linha das demais telas nao mudam.

Documentacao e texto

- [x] CA16: `GET /api/documentation` nao contem mais "Excluir uma categoria significa apenas torná-la Inativa" nem "uma desativação em Categorias"; a area Categorias descreve a exclusao definitiva, o bloqueio por lancamentos (de qualquer usuario/status) e a desativaçao pelo Situacao.
- [x] CA17: `GET /api/release-notes` traz no bloco `1.0.2` um item sobre a exclusao de categorias.
- [x] CA18: as varreduras de acentuacao de `architecture.md` nao ganham ocorrencia nova (baseline: 2 frontend, 6 backend).

## Fora de escopo

- Exclusao forcada, em cascata ou reatribuicao dos vinculos (a issue proibe).
- Categorias por usuario; expor subcategorias na UI; lixeira nas demais telas.

## Decisoes

- PA-1 (2026-09-23): **exclusao fisica** quando nao ha vinculo; desativar continua pelo Situacao. Excecao a "sem hard delete" de `architecture.md`, como perfis.
- PA-2 (2026-09-23): lancamentos `CANCELED` **contam**, sem distincao na mensagem.
- PA-3 (2026-09-23): contagem de **todos os usuarios**, mensagem so com o total.
- PA-4 (2026-09-23): **so Lancamentos bloqueiam**. Consequencia aceita: pelo `on delete set null`, subcategorias perdem o pai e `planning_items` perdem a categoria. Checagem estruturada para aceitar novos tipos (a issue pede todos os vinculos).
- PA-5 (2026-09-23): bloqueio no **toast de Alerta padrao**, mensagem do backend em linhas.
- PA-6 (2026-09-23): categoria **inativa pode ser excluida**, mesma regra; o `DELETE` deixa de responder 404 para inativa.
- PA-7 (2026-09-23): lixeira **igual a "Editar"**: some na linha em edicao, `disabled` nas demais.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/77 (corpo truncado)
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `categories.md`, `auth-and-permissions.md`, trechos de `transactions.md`, `frontend-ui.md`, `documentation.md`, `backend-patterns.md`
- Codigo conferido: `CategoryResource.java`, `categories.html`, `V1__init.sql`, `*AreaContent.java`, `core/toast/toast-host.html`
