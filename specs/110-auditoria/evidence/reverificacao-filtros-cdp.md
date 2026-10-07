# Reverificacao dos filtros da Auditoria (2026-10-07, Chrome headless por CDP)

Build servido: `http://localhost/main-NQQ3ELCF.js` (chunk da tela `chunk-DvjCsEbX.js`). Todas as chamadas `/api/*` respondidas **dentro da sessao do navegador** (`Fetch.fulfillRequest`), token falso no `localStorage`; requisicoes vistas: so `GET /api/auth/me`, `POST /api/audit/screen-access`, `GET /api/audit`, `GET /api/audit/options` — nenhuma chegou ao backend, nenhuma a `/auth/login`. Script: scratchpad da sessao (`cdp-filtros.js`).

## Bundle servido (curl)

- `index.html` sem `Cache-Control` (so `Last-Modified`/`ETag`).
- Chunk da tela contem `"filter-select","only-desktop"` nos 3 selects, `Tipo: todos`, `A\xE7\xE3o: todas`, `Funcionalidade: todas`, `choice-toggle` com `flex-wrap:wrap`; nenhum `Ã`/`Â` no chunk nem no `main`.

## Desktop

| Largura | doc scrollWidth/innerWidth | selects visiveis (texto, opcoes, largura) | grupos de botoes visiveis | botao Filtros |
|---|---|---|---|---|
| 1440 | 1425/1440 | Tipo: todos (9, 158px), Ação: todas (5, 132px), Funcionalidade: todas (9, 194px) | 0 | oculto |
| 1280 | 1265/1280 | idem | 0 | oculto |
| 1024 | 1009/1024 | idem | 0 | oculto |
| 768 | 753/768 | idem, nenhum fora da tela | 0 | oculto |

- Nenhum `select` dentro de `label` (antes ficavam em `label.filter-field`).
- Opcoes: Tipo = Tipo: todos, Alteração, Login, Login com falha, Logout, Sessão expirada, Acesso negado, Acesso à tela, Impressão; Ação = Ação: todas, Inclusão, Alteração, Exclusão, Visualização; Funcionalidade = Funcionalidade: todas, Resumo, Lançamentos, Categorias, Usuários, Perfis, Auditoria, Documentação, Novidades por versão.
- Escolher "Exclusão" em Ação: uma unica `GET /api/audit?page=1&size=10&startDate=2026-09-07&endDate=2026-10-07&action=DELETE&timeZone=America/Sao_Paulo`; select ganha `is-set` com fundo `rgb(237, 241, 253)`; chip "Ação: Exclusão".

## Celular (painel Filtros aberto)

| Largura | doc | painel (x, rolagem vertical, rolagem horizontal) | selects visiveis | Tipo / Ação / Funcionalidade (botoes, linhas, fora do grupo) | "Aplicar" alcancavel |
|---|---|---|---|---|---|
| 390x844 | 390/390 | 0..390, 974/796, 390/390 | 0 | 9/4/0, 5/2/0, 9/4/0 | sim (792..844) |
| 375x667 | 375/375 | 0..375, 974/619, 375/375 | 0 | 9/4/0, 5/2/0, 9/4/0 | sim (615..667) |
| 320x640 | 320/320 | 0..320, 974/592, 320/320 | 0 | 9/4/0, 5/2/0, 9/4/0 | sim (588..640) |

- Com o painel fechado: nenhum select visivel, botao Filtros visivel, documento sem rolagem horizontal.
- Botao pressionado reflete o aplicado ("Exclusão" vindo do desktop; "Todos"/"Todas" nos demais).
- Tocar "Logout" em Tipo: 0 requisicoes; fechar o painel: 0 requisicoes, chips inalterados; reabrir: volta a "Todos".
- Tocar "Acesso à tela", "Visualização", "Novidades por versão": 0 requisicoes antes do "Aplicar"; no "Aplicar", uma unica `GET /api/audit?...&type=SCREEN_ACCESS&action=VIEW&screen=RELEASE_NOTES&timeZone=America/Sao_Paulo`; chips "Tipo: Acesso à tela", "Ação: Visualização", "Funcionalidade: Novidades por versão"; documento 390/390.

## Nao medivel aqui

A lista nativa do `<select>` (popup desenhado pelo sistema operacional, onde estava o defeito relatado) nao aparece no DOM nem no headless: fica no roteiro manual.
