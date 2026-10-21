# Resumo no build servido (Chrome headless por CDP)

Build: `http://localhost/main-27ADFG2K.js` + `styles-ALDBCCSP.css` (os citados por `curl http://localhost/`); chunk da tela `chunk-B7l4hKB1.js` contem `balance-carry`, "Saldo anterior", "Saldo acumulado", "Acumulado", `repeat(4,minmax(0,1fr))` e `repeat(2,minmax(0,1fr))`; `styles` contem `.tabular{font-variant-numeric:tabular-nums}`; nenhum `Ã`/`Â` nos arquivos baixados.

Todas as chamadas `/api/*` foram respondidas **dentro da sessao do navegador** (`Fetch.fulfillRequest`); nada chegou ao backend nem ao banco; token no `localStorage` = texto falso; nenhuma chamada a `/api/auth/login`. Fuso America/Sao_Paulo, hoje real (20/10/2026). Script: scratchpad da sessao (`cdp-dashboard.mjs`).

Dados simulados, coerentes com a regra do back-end com mes corrente = dez/2026:
- **cenario**: set 3200/1800, out 1000/600 (saldo 400), nov 500/700 (saldo -200).
- **negativo**: out 100/600 (saldo -500), nov 0/100 (saldo -100).

## Requisicoes

- Abertura (todas as larguras): `GET /api/auth/me`; `POST /api/audit/screen-access`; `GET /api/dashboard/summary?year=2026&month=10`.
- "Próximo mês": so `GET /api/dashboard/summary?year=2026&month=11`.
- Clique/toque no mes Outubro do grafico (`rect.month-hit` 9): **0 requisicoes** em todas as larguras.

## Valores exibidos (iguais em 1440/1280/1024/768/390/320)

| Conjunto/mes | Saldo do mês (valor principal) | Saldo anterior | Saldo acumulado | Bloco abaixo do grafico |
|---|---|---|---|---|
| cenario out | R$ 400,00 | R$ 0,00 | R$ 400,00 | Receita R$ 1.000,00 / Despesa R$ 600,00 / Saldo R$ 400,00 / Acumulado R$ 400,00 |
| cenario nov | -R$ 200,00 | R$ 400,00 | R$ 200,00 | Receita R$ 500,00 / Despesa R$ 700,00 / Saldo -R$ 200,00 / Acumulado R$ 200,00 |
| cenario nov, apos tocar Outubro | (quadro inalterado) | R$ 400,00 | R$ 200,00 | titulo Outubro, Acumulado R$ 400,00 |
| negativo out | -R$ 500,00 | R$ 0,00 | -R$ 500,00 | ... Saldo -R$ 500,00 / Acumulado -R$ 500,00 |
| negativo nov | -R$ 100,00 | -R$ 500,00 | -R$ 600,00 | ... Saldo -R$ 100,00 / Acumulado -R$ 600,00 |
| negativo nov, apos tocar Outubro | (quadro inalterado) | -R$ 500,00 | -R$ 600,00 | titulo Outubro, Acumulado -R$ 500,00 |

Informativo flutuante (hover em Novembro, 768 a 1440): "Novembro / Receita R$ 500,00 / Despesa R$ 700,00 / Saldo -R$ 200,00" — sem "Acumulado".

## Tamanhos e larguras (mes nov, cenario)

| Largura | doc scroll/client | Saldo do mês font-size | rotulo / valor "Saldo anterior" | valor "Saldo acumulado" | `.balance-carry` (largura) | bloco: colunas | overflow em algum valor |
|---|---|---|---|---|---|---|---|
| 1440 | 1425/1425 | 40px | 12.5px / 12.5px | 18px | 295 | 4 x 137px | nao |
| 1280 | 1265/1265 | 40px | 12.5px / 12.5px | 18px | 360 | 4 x 113px | nao |
| 1024 | 1009/1009 | 40px | 12.5px / 12.5px | 18px | 313 | 4 x 146px | nao |
| 768 | 753/753 | 40px | 12.5px / 12.5px | 18px | 360 | 4 x 82px | nao |
| 390 | 390/390 | 34px | 12.5px / 12.5px | 18px | 318 | 2 x 146px (2 linhas) | nao |
| 320 | 320/320 | 34px | 12.5px / 12.5px | 18px | 248 | 2 x 111px (2 linhas) | nao |

Cor dos valores das linhas novas: `rgb(255, 255, 255)` (`--on-accent`). Dica do bloco: 390/320 "Toque em um mês do gráfico para ver os valores."; 768+ "Clique em um mês do gráfico para ver os valores." (a outra oculta).

## `font-variant-numeric` efetivo (troca por `.tabular`)

Em todas as larguras e nos dois conjuntos, `getComputedStyle(...).fontVariantNumeric = "tabular-nums"` em: `.balance-value` (1), `.balance-item-value` (2), `.pending-value` (1), `.month-block-values span` (4), `.category-share` (2), `.category-amount` (2), `.panel-footer strong` (1), `.balance-carry strong` (2) e `.chart-tooltip-row b` (3, com o informativo aberto). Controle: `.balance-label` = `normal`. Sao os 8 seletores que tinham `tabular-nums` no `dashboard.scss` de `HEAD`.
