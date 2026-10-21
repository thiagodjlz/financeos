# Medicoes no build servido (antes da instrucao de nao automatizar navegador)

Chrome headless via CDP em `http://localhost/transaction-reports`, bundle `main-DQOT5RPD.js` (o mesmo citado por `curl http://localhost/`).
Todas as chamadas `/api/*` foram respondidas dentro da sessao do navegador (`Fetch.fulfillRequest`) com token falso; nenhuma chegou ao backend, `/api/auth/login` nunca foi chamado, nenhuma escrita.
Dados simulados: 3 lancamentos (descricao mais longa: "Mercado do bairro com descrição longa"), total da API propositalmente diferente da soma (Saldo 777,77).

## Tela (1440)
- Menu: secoes `Relatórios, Cadastros, Configurações, Sobre`; secao Relatorios com o item `Lançamentos` -> `/transaction-reports` (ativo). Um `POST /audit/screen-access {"screen":"TRANSACTION_REPORTS"}` ao entrar.
- Quadros: `Saldo R$ 777,77` (valor da API, sem recalculo) e `Saldo atual R$ 600,00`; 0 controles dentro de `.report-balances`.
- Colunas padrao `Data, Descrição, Categoria, Tipo, Status, Valor`; rotulos `Despesa/Receita`, `Pago/Pendente/-`, `Manual/Importação de planilha/Recorrência`; nenhum enum cru. Desmarcar Categoria: some do cabecalho e das linhas, 0 requisicoes. Sem coluna: aviso "Escolha ao menos uma coluna.", 0 requisicoes ao gerar.
- Vazio: `.empty-state`, Saldo `R$ 0,00`, Saldo atual `R$ 600,00`. Falha 500: toast `Falha`, `.load-error`.
- Preferencia padrao: abre com `?period=PREVIOUS_MONTH&categoryId=c1&type=EXPENSE&groupBy=CATEGORY` e colunas da preferencia.

## Larguras (criterio 18)
| largura | doc.scrollWidth | innerWidth | .table-wrap client/scroll | overflow-x |
|---|---|---|---|---|
| 390 | 390 | 390 | 356 / 820 | auto |
| 375 | 375 | 375 | 341 / 820 | auto |
| 320 | 320 | 320 | 286 / 820 | auto |
Em 375, `scrollLeft=200` na tabela e `window.scrollX=0`. Tabela continua `display: table` (nao vira cartao).

## Impressao (criterio 17)
- `@media print` emulado: menu, barra inferior, filtros, preferencias e botao Imprimir `display:none`; ficam quadros, resumo (Periodo, Filtros, Gerado em) e tabela. Clique em Imprimir: `POST /api/audit/print {"screen":"TRANSACTION_REPORTS"}` e `window.print()` 1 vez.
- **Defeito encontrado**: em largura de pagina A4 (718 px uteis) a tabela fica mais larga que a pagina e o `.report-result { overflow: hidden }` corta a direita.
  - colunas padrao: `Valor` parcial (705-821 px, pagina ate 718);
  - 9 colunas: `Origem` parcial, `Parcela`, `Valor`, `Observações` fora.
- PDF real (`Page.printToPDF`, A4) extraido com `pdftotext -layout`: o cabecalho sai `Data  Descrição  Categoria  Tipo  Status`, **sem `Valor`** e sem nenhum valor de linha (`R$ 30,00` ausente); so o Total do periodo aparece.
- Causa: `transaction-reports.scss:168` (`overflow: hidden` em `.report-result`) + `td { white-space: nowrap }` global; o `@media print` de `styles.scss` libera o `.table-wrap` mas nao o painel nem a quebra de linha.

# Reverificacao apos a correcao de impressao (bundle `main-YLH25ZK7.js`)

Mesmo metodo (Chrome headless, `/api/*` simulado no navegador, token falso, nenhum login/escrita). Observacao da linha 1 alongada para testar quebra.

## Impressao emulada em 718 px (largura util A4)
- Colunas padrao: `Data, Descrição, Categoria, Tipo, Status, Valor` todas dentro da pagina; valores `R$ 50,00`, `R$ 30,00`, `R$ 1.000,00` inteiros; `scrollWidth` 718 = janela.
- 9 colunas: todas dentro da pagina (nenhuma cortada); Valor sem quebra.
- Somem menu, filtros, preferencias e botao Imprimir; ficam quadros, resumo impresso e tabela.

## PDF A4 real (`Page.printToPDF` + `pdftotext -layout`)
Colunas padrao:
```
Data        Descrição                              Categoria                   Tipo     Status            Valor
05/10/2026  Mercado do bairro com descrição longa  Alimentação                 Despesa  Pago         R$ 50,00
08/10/2026  Feira                                  Alimentação                 Despesa  Pendente     R$ 30,00
10/10/2026  Salário                                Salário                     Receita  -         R$ 1.000,00
Total do período Receitas R$ 1.000,00 Despesas pagas R$ 50,00 Saldo R$ 777,77
```
9 colunas: cabecalho `Data Descrição Categoria Tipo Status Origem Parcela Valor Observações`; as tres linhas trazem `R$ 50,00`, `R$ 30,00`, `R$ 1.000,00`, `2/3`, `Importação de planilha`, `Recorrência` e a observacao longa quebrada em 4 linhas dentro da celula.

## Tela (nao-regressao da correcao)
- 375 px com 9 colunas: doc `scrollWidth` 375 = janela; `.table-wrap` 341/1721, `overflow-x: auto`, tabela `display: table`, `td` `nowrap`; `scrollLeft=200` na tabela e `scrollX=0` na pagina.
- 1440: `td` continua `white-space: nowrap` (a quebra so vale na impressao).
