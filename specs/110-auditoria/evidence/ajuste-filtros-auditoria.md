# Ajuste pos-validacao: filtros Tipo, Ação e Funcionalidade (2026-10-07)

## Relato do usuario

"Filtro de ação ficou bugado, anexei print para demonstrar no desktop. Já no smartphone os filtros Tipo e
Funcionalidades estão com o mesmo bug". Print (Chrome/Windows): a lista nativa do `<select>` Ação abria
numa moldura branca do tamanho da lista de Funcionalidade (9 itens) com só 5 opções. No celular, as listas
de 9 itens (Tipo, Funcionalidade) apareciam cortadas/com espaço vazio. Filtros de Lançamentos sem problema.
Não reproduzido no navegador embutido.

## Causa provavel

Os tres `<select>` ficavam dentro de `label.filter-field` (pilula com `select` transparente e sem borda,
dentro do `.filter-sheet` que no desktop e `display: contents` e no celular e painel fixo com `transform`
e `overflow-y: auto`). Lançamentos, que funciona, usa no desktop o `select.filter-select` solto e, no
painel do celular, botões de escolha para listas curtas. Sem reprodução local, a correcao troca o padrao
de markup para o de Lançamentos em vez de um ajuste de CSS pontual.

## O que mudou

- Desktop: `select.filter-select.only-desktop` solto (fora de `label.filter-field`), `aria-label`,
  `[class.is-set]` pelo aplicado, primeira opcao "Tipo: todos" / "Ação: todas" / "Funcionalidade: todas",
  aplica no `change`. `.filter-select` copiado de `transactions.scss` para `audit.scss` (sem `order`, que
  em Lançamentos so posiciona apos o Tipo em botoes).
- Celular: `div.filter-field.only-mobile[role=group]` com `aria-labelledby` + `.toggle-group.choice-toggle`
  com botoes `aria-pressed` ("Todos"/"Todas" + opcoes de `options()`). `chooseDraft(key, code)` em
  `audit.ts` so altera `list.filters` (o `apply` nao age com o painel aberto); vale no "Aplicar",
  fechar descarta.
- `.choice-toggle` (local, so ate 680px): `display: flex; flex-wrap: wrap`, botoes `flex: 1 1 auto`,
  `white-space: normal` — o `.toggle-group` global no celular e grade de colunas iguais numa linha so, que
  nao caberia 9 opcoes em 320-390px.
- Datas e busca por usuario inalteradas. Texto da Documentação continua correto (nao fala em lista).

## Testes

- `audit.spec.ts`: teste de opcoes reescrito (selects soltos com `only-desktop` e primeira opcao nova;
  grupos `only-mobile` sem `select`, "Todos"/"Todas" pressionado); teste de Tipo no desktop confere
  `is-set`; novos: painel do celular so aplica no "Aplicar" (params `type/action/screen` e chips
  "Tipo: Login", "Ação: Inclusão", "Funcionalidade: Categorias") e fechar sem aplicar descarta; teste
  "nao oferece incluir/editar/excluir" ignora os botoes de escolha.
- `npx ng test --watch=false`: 44 arquivos, 538 testes verdes. `npm run build`: ok, sem avisos.
