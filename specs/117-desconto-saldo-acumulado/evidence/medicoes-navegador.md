# Medicoes no navegador e na stack local — issue 117

Chrome headless por CDP, build servido em `http://localhost` (`main-DNYRIBCW.js`; os 31 `.js` servidos sao byte a byte iguais a `frontend/dist/frontend/browser/`). Toda chamada `/api/*` foi respondida **dentro da sessao do navegador** (`Fetch.fulfillRequest`), com token falso; nada chegou ao backend. Chamadas interceptadas: `GET /auth/me`, `POST /audit/screen-access` (respondido 204 no navegador), `GET /dashboard/summary?year=2026&month=10|11`, `GET /categories/options`, `GET /transactions?...`.

Dados simulados = cenario do criterio 1 (out: 1000/600; nov: 3000/2800 pagas + 500 pendente), serie montada como o back produz (`previousBalance` = soma crua dos meses anteriores desde out/2026; `balance` = anterior + receitas − pagas).

## Resumo, novembro/2026 (criterios 4 e 5)

| Largura | Saldo do mes | Legenda | Linhas do quadro | Bloco do mes | Colunas do bloco | `acumulado` no texto | Estouro horizontal |
|---|---|---|---|---|---|---|---|
| 1440 | R$ 600,00 | Saldo anterior mais receitas menos despesas pagas | Saldo anterior R$ 400,00 | Receita R$ 3.000,00 / Despesa R$ 2.800,00 / Saldo R$ 600,00 | 3 na mesma linha (188px cada) | nao | nao |
| 1024 | idem | idem | idem | idem | 3 na mesma linha | nao | nao |
| 768 | idem | idem | idem | idem | 3 (112px) | nao | nao |
| 390 | idem | idem | idem | idem | 3 (95px), sem estouro de valor | nao | nao |
| 320 | idem | idem | idem | idem | 3 (71px), sem estouro de valor | nao | nao |

- Frase da barra: "Despesas pagas equivalem a 93,3% das receitas".
- Outubro (antes de avancar): Saldo R$ 400,00, Saldo anterior R$ 0,00, bloco 1.000 / 600 / 400.
- Informativo flutuante sobre novembro (`.month-hit` 11): "Novembro Receita R$ 3.000,00 Despesa R$ 2.800,00 Saldo R$ 600,00".
- `circle.balance-point`: 11 (linha para em nov, ultimo mes com movimento; dez sem ponto).

## Lancamentos (criterio 8)

Lista simulada ja na ordem da API (800 D, 500 R, 300 D 20/10, 300 D 02/10, 120 R).

| Largura | `tr.day-row` | `tbody th` | Data em cada linha | `.date-cell` | Cabecalho visivel |
|---|---|---|---|---|---|
| 1440 / 1024 / 768 | 0 | 0 | sim | `table-cell` | Data, Descrição, Categoria, Status, Valor, Ações (6 celulas por linha) |
| 390 | 0 | 0 | sim (01/10, 03/10, 20/10, 02/10, 20/10), dentro do cartao | `block`, `grid-area: date`, `rgb(107, 103, 96)` (`--text-muted`) | — |
| 320 | 0 | 0 | sim, sem estouro | idem | — |

Cartao continuo a 390: `border-top-left-radius` 16px na primeira linha, `border-bottom-left-radius` 16px na ultima, 0px nas do meio.

## Versao no rodape (criterio 9)

| Lugar | Nome | Versao | Topo nome -> topo versao | Altura da versao | `white-space` | Cor | Cortada? |
|---|---|---|---|---|---|---|---|
| Menu lateral 1280 | FinanceOS | v1.0.3-01 | 848 -> 866 (linhas separadas) | 18px = 1 linha (line-height 18px) | `nowrap` | `rgb(107, 103, 96)`, 12px | nao (scrollWidth = clientWidth) |
| Menu lateral 1024 | idem | idem | idem | idem | `nowrap` | idem | nao |
| Painel Mais 390 | idem | idem | 788 -> 806 | 18px | `nowrap` | idem | nao |
| Painel Mais 320 | idem | idem | 788 -> 806 | 18px | `nowrap` | idem | nao |

- Texto do elemento: "FinanceOSv1.0.3-01" (sem "·").
- Menu recolhido (1280): `.app-version` com 0x0 px.
- Versao no bundle servido: so `"1.0.3-01"` (`chunk-BYgr3AaC.js`); nenhuma ocorrencia de `1.0.4-dev`. `APP_VERSION` do `.env` so entra na tag das imagens (`docker-compose.yml:26,44`); o `frontend/Dockerfile` nao o usa.

## Favicon (criterio 10)

- `curl -I http://localhost/favicon.svg` -> 200, `image/svg+xml`, 214 bytes; conteudo: `rect` 34x34 `rx="10"` `#3b5bdb` + `path` "F" `#ffffff`.
- `curl -I http://localhost/favicon.ico` -> 200, `image/x-icon`, 2811 bytes, sha256 `c2140972d271a12d...` (o do Angular era `f9102be80297c052...`, 15086 bytes). Quadros: 16x16, 32x32, 48x48.
- `curl http://localhost/` declara `<link rel="icon" href="favicon.ico" sizes="16x16 32x32 48x48">` e `<link rel="icon" type="image/svg+xml" href="favicon.svg">`.

## Achado fora dos criterios: conta do painel Mais a 320px com nome longo

Com o nome "Pessoa Verificacao Com Nome Comprido", a 320px `.sheet-account` vai de 12 a 351px dentro de `.sheet-list` de 320px (19px alem da borda; a 390px cabe). Desligar as regras novas da versao (`white-space: normal`, `display: block`) nao muda nada (direita 339 -> 339); esconder o nome derruba para 296. Causa: o nome com `nowrap` + reticencias, nao a versao — preexistente, nao introduzido por esta issue.
