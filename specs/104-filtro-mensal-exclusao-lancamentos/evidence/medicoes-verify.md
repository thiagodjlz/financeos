# Medicoes da etapa verify (issue 104)

Chrome headless por CDP no build servido em `http://localhost` (bundle `main-PHRS67YC.js`; o chunk lazy `chunk-BNHcDUEY.js` contem `month-picker-trigger` e `Lan\xE7amento exclu\xEDdo com sucesso`; nenhum chunk contem `dashboard/periods` nem `CANCELED`; nenhum `Ã`/`Â`). Respostas de `/api/*` substituidas **so dentro da sessao do navegador** (Fetch.fulfillRequest): nada chegou ao backend nem ao banco. Relogio real: 30/09/2026.

## Banco local (somente leitura, `psql`)

- `flyway_schema_history`: `16 | remove canceled transactions | t` (11:51 UTC).
- `select status, count(*)`: PAID 258, PENDING 144, null 85 — sem CANCELED; antes (implementation-notes): CANCELED 2, PAID 258, PENDING 144, null 85.
- `transactions_status_check`: `CHECK (((status IS NULL) OR ((status)::text = ANY (ARRAY['PENDING','PAID']...))))`.

## API real

- `GET /api/health` -> `version: 1.0.2-02`.
- `DELETE /api/transactions/<uuid>` sem token -> 401; `GET /api/dashboard/summary?year=2019&month=3` sem token -> 401.
- `POST /api/auth/login` com `{}` -> 400 `Informe os campos obrigatórios: E-mail, Senha.` (mapper compartilhado em portugues).

## Resumo (`/dashboard`)

| Medida | Resultado |
|---|---|
| Requisicoes na abertura (1440) | so `GET /api/dashboard/summary?year=2026&month=9`; nenhuma `/dashboard/periods` |
| Campo | texto `Setembro de 2026`, `aria-label` `Período do resumo: Setembro de 2026` |
| Mes anterior / Proximo mes | `disabled=false` na abertura e depois dos passos |
| Painel aberto | `aria-expanded=true`, ano `2026`, 12 botoes `Jan..Dez`, 0 elementos de dia, foco em `Setembro de 2026` (`aria-pressed=true`) |
| Ano | +10 -> 2036, -17 -> 2019, botoes nunca desabilitados |
| Escolher `Dezembro de 2019` | 1 requisicao: `summary?year=2019&month=12`; painel fechado; foco no gatilho |
| Passo | Dez/2025 -> `summary?year=2026&month=1` (Janeiro de 2026) -> `summary?year=2025&month=12`; mes zerado mostra `Sem dados no período` |
| Esc / clique fora | fecham o painel; Esc devolve foco ao gatilho |
| 1280 | saudacao `t 32..90.9` e `.month-stepper` `t 44.9..90.9` na mesma faixa do cabecalho; `scrollWidth 1280 = clientWidth` |

| Largura | campo `right` | `.month-stepper` `right` / cabecalho `right` | painel aberto `l..r` | doc `scrollWidth`/`clientWidth` |
|---|---|---|---|---|
| 1024 | 510.3 | 555.3 / 984 | 333..621 | 1024/1024 |
| 768 | 510.3 | 555.3 / 728 | 333..621 | 768/768 |
| 390 | 321 | 374 / 374 | 69..357 | 390/390 |
| 360 | 291 | 344 / 344 | 64..352 | 360/360 |
| 320 | 255.3 | 308.3 / 304 | 24..312 | 320/320 |

Texto do campo sem corte em todas as larguras (`scrollWidth = clientWidth` do `.month-picker-text`: 125 no desktop, 134 no celular).
A 320 px a saudacao e o `.month-stepper` passam 4,3 px da borda do cabecalho (dentro do padding; sem rolagem horizontal) — fora dos criterios (C14 fala em 360/390).

## Lancamentos (`/transactions`)

Mock com 3 lancamentos de setembro/2026; `DELETE` respondido pelo navegador (204) e retirado da lista falsa.

| Medida (1440 salvo indicacao) | Resultado |
|---|---|
| Primeira carga | `GET /api/transactions?page=1&size=10&startDate=2026-09-01&endDate=2026-09-30`; campo `Setembro de 2026`; rotulo `Data: Setembro de 2026` |
| Filtros | 0 `input[type=date]` na pagina; rotulo do campo `Data`; Status `Todos, Pendente, Pago`; 0 `tr.canceled`; 0 botoes "Cancelar lançamento" |
| Escolher `Fevereiro de 2028` | 1 requisicao `startDate=2028-02-01&endDate=2028-02-29`; painel fechado |
| Remover rotulo `Data: Fevereiro de 2028` | `GET ...?page=1&size=10` sem datas; campo vazio |
| "Novo lançamento" -> voltar | `GET ...?page=1&size=10` (periodo vazio mantido); campo vazio |
| Escolher Março/2026 e "Limpar filtros" | `...startDate=2026-03-01&endDate=2026-03-31` e depois `...?page=1&size=10`; campo vazio |
| Excluir -> Cancelar | mensagem `Deseja excluir o lançamento "Mercado do mês"? A exclusão não pode ser desfeita.`; botoes `Cancelar`/`Excluir lançamento`; 0 `DELETE`; 3 linhas |
| Excluir -> confirmar | `DELETE /api/transactions/<id>` + recarga do mes; toast `toast-success` "Sucesso" / "Lançamento excluído com sucesso."; linha sumiu |
| 1280 | `.list-toolbar` `b 280.9` = `table` `t 280.9` (faixa acima); gatilho Data h 38 = select Tipo h 38; botao Filtros oculto; `scrollWidth 1280 = clientWidth` |
| 1024 | idem (faixa acima da tabela, h 38 = 38) |

Painel "Filtros" aberto (emulacao mobile + toque):

| Largura | gatilho Data `l..r` | `.filter-sheet` `r` | altura Data / Tipo | fonte | borda / raio | texto `sw`/`cw` | painel do seletor aberto `l..r` | doc `sw`/`cw` |
|---|---|---|---|---|---|---|---|---|
| 390 | 20..370 | 390 | 48px / 48px | 16px / 16px | `rgb(147, 143, 135) 1px` / igual; 10px | 141/141 | 20..370 | 390/390 |
| 360 | 20..340 | 360 | 48px / 48px | 16px / 16px | igual | 141/141 | 20..340 | 360/360 |
| 320 | 20..300 | 320 | 48px / 48px | 16px / 16px | igual | 141/141 | 20..300 | 320/320 |

A faixa de filtros nao aparece no celular (select Tipo invisivel antes de abrir o painel). Esc com o seletor aberto: seletor fecha, painel Filtros continua aberto, foco no gatilho. A 390, escolher Agosto/2026 no painel: 0 requisicoes; "Aplicar": `startDate=2026-08-01&endDate=2026-08-31`.
