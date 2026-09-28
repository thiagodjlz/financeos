# Medições da verificação após os ajustes pós-validação (etapa 7)

Data: 2026-09-28. Build **servido** em `http://localhost` (`main-WIALMXF6.js` + `styles-A2DGARGI.css`, md5 idêntico ao `frontend/dist`, gerado depois do último fonte alterado). Chrome headless via CDP; chamadas `*/api/*` respondidas **só dentro da sessão do navegador** (mesmos dados fictícios de `medicoes-navegador.md`, mais detalhe de categoria, usuário e perfil para as telas de edição). `POST`/`PUT` simulados (400 no formato do `ExceptionMapper` ou 404): nada chegou ao backend nem ao banco. ≤680 com `mobile: true`, toque emulado, altura 844; acima, mouse, altura 900.

## Critério 10 — barra de filtros no desktop (DEC-11)

Lançamentos, Categorias, Usuários e Perfis, em 2000, 1440, 1280, 1024, 768 e 681:

- `.filter-sheet-handle`, `.filter-sheet-head` e `.filter-sheet-actions`: `display: none`, 0×0 nas 24 combinações.
- Nenhum texto "Filtros" visível, 0 botões "Fechar filtros" e 0 "Aplicar" visíveis; botão "Filtros" do celular oculto (Perfis nem o tem).
- Linha: busca e depois os campos, 40px cada. 2000: Lançamentos numa linha (busca x309, Tipo x619, Categoria x766, Status x971, Data de x1143, Data até x1356). 1440: "Data até" quebra para a 2ª linha (90px); Categorias, Usuários e Perfis numa linha. `scrollWidth` = largura em todas.
- Celular (680 e 390), sem regressão: painel fechado com o botão "Filtros"; aberto com alça 14px, cabeçalho 60px ("Filtros" + fechar), "Aplicar"; campos 16px/48.

## Critérios 2 e 5 — cadastros no desktop (DEC-12)

| Largura | Área de conteúdo | Card | Lançamento (corpo \| Data/Status) | Categoria, Usuário, Perfil (`.form-grid`) |
|---|---|---|---|---|
| 2000 | 1672 | **960**, x288 | 902 \| `441px 441px` | `441px 441px` |
| 1440 | 1112 | **960** | 902 \| `441px 441px` | `441px 441px` |
| 1280 | 952 | 952 | 894 \| `437px 437px` | `437px 437px` |
| 1024 | 696 | 696 | 638 \| `309px 309px` | `309px 309px` |
| 768 / 681 | 440 / 353 | 440 / 353 | 382 / 295 \| 2 colunas | 2 colunas |

- Campos a 1440/2000: Lançamento Tipo 902, Valor 902, Data 441 \| Status 441, Descrição 902, Categoria 902; edição de **receita**: Data **902** (linha inteira), sem Status. Categoria: Nome \| Tipo, Cor \| Situação. Usuário: Nome \| E-mail, Senha \| Perfil (+ Status na edição). Perfil: Nome (coluna 1), tabela 902.
- "R$": 23×27, `white-space: nowrap`, `flex-shrink: 0`, `line-height` 27px, **1 linha** (retângulos do texto por `Range`) em todas as larguras de 2000 a 681.
- Valor 60px; contador "0/255" (novo), "14/255" e "16/255" (edição); "Salvar lançamento/categoria/usuário/perfil" `rgb(59, 91, 219)` 40px raio 10, rodapé estático; card borda `rgb(232, 230, 225)` raio 14; campos 44px, 14px, borda `rgb(147, 143, 135)`; radios `type`/`status`.
- 1440: Receita → 0 `input[name=status]`, Data 902; Despesa → 2 radios, Data 441. `POST /api/transactions` com `{"transactionDate":"2026-09-28","description":"","amount":12.5,"type":"EXPENSE","status":"PAID","categoryId":"c1"}` (mesmo formato da rodada anterior); 400 → `description` com borda `rgb(185, 58, 46)` e "A descrição é obrigatória.".

## Critério 9 — barra inferior no celular (DEC-13/14)

| Largura | Itens (largura) | Rótulos (1 linha, dentro do item) |
|---|---|---|
| 320 | Resumo 76, Lançamentos 76, + 76 (botão 52×52), Mais 76 | Lançamentos 74,7×17 ativo / 72,8×17; Resumo 43,6–44,7; Mais 25,7–26,5 |
| 390 | 4 × 93,5 | idem |
| 680 | 4 × 166 | idem |
| sem `TRANSACTIONS/CREATE` | 320: 3 × 101,3; 390: 3 × 124,7; 680: 3 × 221,3 | 1 linha |
| só `DASHBOARD` | Resumo e Mais (320: 2 × 152) | Mais só com "Sair" |

- Texto da barra em todas as rotas: "Resumo Lançamentos Mais" (+ botão "Novo lançamento"); nenhum "Cadastros"; nenhum `#sheet-registers`.
- Itens 56px de altura, 11,5px. Destaque: ativo `rgb(43, 68, 176)` (`#2b44b0`) peso 700; inativo `rgb(107, 103, 96)` (`#6b6760`) peso 500. `/dashboard` → Resumo; `/transactions` → Lançamentos; `/categories`, `/users`, `/profiles`, `/documentation`, `/release-notes` → Mais. Exatamente 1 item ativo por rota.
- Painel "Mais" (320/390/680): seções Cadastros, Configurações, Sobre; itens Categorias, Usuários, Perfis, Documentação, Novidades por versão, Sair; foco em "Fechar Mais", `body` travado; tocar Categorias → `/categories`, painel fechado, `body` livre, Mais ativo. Sem `CATEGORIES/VIEW`: seções Configurações e Sobre, sem Categorias. Fechado: `visibility: hidden`, `aria-hidden="true"`; Esc fecha e devolve o foco a "Mais"; scrim fecha. 1440: barra `display: none`, menu 248 com Categorias.

## Critério 11 — não-regressão do celular

680, 480, 390, 320 × lançamento novo/edição, categoria, usuário, perfil: **sem** `.bottom-bar` no DOM; "Salvar …" `position: fixed` 648/448/358/288 × **52** em y=780, `rgb(59, 91, 219)`; `elementFromPoint` no centro = o botão; 1 toque real → `POST`/`PUT` enviado; campos **16px** (44px a 680, 48px a ≤480); grade 1 coluna; `scrollWidth` = largura. "+" → `/transactions/new` sem barra; voltar → `/transactions` com a barra, 0 não-GET, 0 toast.

## Demais critérios — reexecução dos roteiros anteriores

Os scripts da 1ª rodada (`medicoes-navegador.md`) rodaram de novo no build atual e o resultado foi comparado campo a campo. Diferenças: saudação sorteada, data de hoje no payload, card 960 (era 720), títulos de dia sem "Hoje/Ontem" (dados fictícios de 24/09, hoje é 28/09), campos 16px e "Salvar" livre no celular (correção 1) e a barra sem "Cadastros" (DEC-13). Nenhuma outra mudança: critérios 1, 3, 4, 6, 7, 8, 12 e 13 iguais.
