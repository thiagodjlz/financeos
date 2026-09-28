# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida apos os ajustes pos-validacao; bundle servido `main-WIALMXF6.js` + `styles-A2DGARGI.css`, md5 igual ao `frontend/dist`, gerado depois do ultimo fonte alterado).
Branch: `feature/issue-93-modernizacao-sistema` — mudancas ainda **nao commitadas**.
Reverificacao apos os ajustes DEC-11 a DEC-14. Telas medidas no Chrome headless com as respostas de `/api/*` substituidas **so na sessao do navegador** (inclusive `POST`/`PUT` com 400/404 simulados): nenhuma escrita chegou ao backend ou ao banco. JWT local nao foi tentado (bloqueado em rodada anterior, issues #71/#76); API autenticada provada pela suite. Medicoes desta rodada: `evidence/medicoes-verificacao-ajustes.md`; rodadas anteriores em `evidence/medicoes-navegador.md` e `evidence/medicoes-reverificacao-1.md`.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Tokens, varreduras, `body` | VERIFICADO | as 2 varreduras vazias (rerodadas); `body` Inter, fundo `rgb(246, 245, 242)` (script da 1a rodada rerodado, sem diferenca) |
| 2 | Botao, card, campo, 400 | VERIFICADO | 2000–681: botao `rgb(59, 91, 219)` 40px raio 10 nos 4 cadastros; card borda `rgb(232, 230, 225)` raio 14; campo 44px borda `rgb(147, 143, 135)`; 400: borda `rgb(185, 58, 46)` + "A descrição é obrigatória."; ≤480 botoes 48px |
| 3 | Pills 24px, "—" | VERIFICADO | rerodado, sem diferenca |
| 4 | Listagens | VERIFICADO | rerodado, sem diferenca; filtros visiveis de 2000 a 681 nas 4 telas |
| 5 | Cadastro de lancamento (DEC-12) | VERIFICADO | 1440 e 2000: card **960**, Data \| Status `441px 441px` (receita: Data 902, sem Status); "R$" `nowrap`, 1 linha, 2000→681; Valor 60; "0/255"/"14/255"; "Salvar lançamento"; `radio`; payload do POST igual ao anterior |
| 6 | `categoryColor` + bolinha | VERIFICADO | `TransactionResourceTest#shouldReturnCategoryColorInListDetailAndResponses`, `DashboardResourceTest#shouldReturnCategoryColorInBreakdown` (surefire 0 falhas); bolinha rerodada sem diferenca |
| 7 | Cards do Resumo | VERIFICADO | rerodado, sem diferenca |
| 8 | "Por categoria" + passo | VERIFICADO | rerodado, sem diferenca |
| 9 | Menu e barra inferior (DEC-13/14) | VERIFICADO | 320/390/680: Resumo, Lancamentos, +, Mais, de largura igual (76 / 93,5 / 166), rotulos em 1 linha dentro do item, sem "Cadastros"; Mais com Categorias (secao Cadastros) so com `CATEGORIES/VIEW`; sem `CREATE` 3 itens iguais; so Resumo: Mais com "Sair"; destaque unico por rota; `main-layout.spec` "mostra Categorias no painel Mais..." |
| 10 | Desktop sem cabecalho do painel (DEC-11) | VERIFICADO | 2000/1440/1280/1024/768/681 × 4 listagens: alca, cabecalho e acoes `display: none` 0×0; 0 "Filtros", 0 "Fechar filtros", 0 "Aplicar" visiveis; `filter-panel.spec` "mantém alça, título e ações..." |
| 11 | Celular | VERIFICADO | por emulacao (aceito pelo criterio): 680/480/390/320 nos 5 cadastros sem barra, "Salvar" fixo 52px, toque real envia; campos 16px; painel de filtros com cabecalho e "Aplicar", campos 16px/48; voltar = "Cancelar" (0 HTTP, 0 toast) |
| 12 | Login, toast, modal | VERIFICADO | rerodado, sem diferenca (login 420/18, campos 48, "Mostrar senha" com 0 requisicoes; toast 360/12; modal 400/16) |
| 13 | Nao-regressao | VERIFICADO | so VIEW: nenhum botao de acao nas 4 listagens; menu parcial igual; "Cancelar" sem alteracao: 0 HTTP/0 toast; `DELETE /api/transactions/{id}` |
| 14 | Suites e acentuacao | VERIFICADO | `quality-report.md`: `./mvnw test` 163/0, `npm test` 416/0, sem fonte alterado depois; 4 varreduras vazias; bundle sem `Ã`/`Â` |

## Nao-regressao das correcoes

- **T32** (seletor `.filter-sheet > ...` esconde o cabecalho): no celular o painel continua com alca, "Filtros", fechar e "Aplicar"; campos 16px/48 (criterio 11).
- **T33** (card 960, `.form-grid`, `.two-cols > :only-child`): a ≤680 os 5 cadastros voltam a 1 coluna, "Salvar" fixo 52px intacto, `scrollWidth` = largura em todas as larguras (criterios 2, 11). Entre 1024 e 681 o card acompanha a area de conteudo e mantem 2 colunas.
- **T34** (barra sem Cadastros, `moreActive` por signal): barra some nos cadastros e volta ao sair; painel Mais com `visibility: hidden` fechado, Esc devolve o foco, scrim fecha, `body` destrava ao navegar; permissoes do menu desktop iguais (criterios 9, 13).
- Scripts da 1a rodada rerodados e comparados campo a campo: so as diferencas esperadas (ver evidence).

## Roteiro de validacao manual

Todos os criterios foram medidos no build servido. Os passos abaixo conferem, com os seus dados, os quatro ajustes que voce pediu. Se algo "antigo" aparecer (card de 720px, "Cadastros" na barra), e bundle em cache: recarregue com Ctrl+Shift+R.

1. Abra `http://localhost` no desktop (janela larga, ~1440px ou maior), entre com o seu usuario e va em Lancamentos. Esperado: acima da tabela so a busca e os campos Tipo, Categoria, Status, Data de, Data até; **sem** alca, sem o titulo "Filtros" e sem o X. Repita em Categorias, Usuarios e Perfis (Perfis so tem a busca). (criterio 10)
2. Clique em "Novo lancamento". Esperado: card de **960px** de largura (DevTools > Computed do `.form-card`: `width: 960px`; o valor antigo seria `720px`), "R$" do Valor numa linha so, Data e Status lado a lado. Marque "Receita": Status some e Data ocupa a linha inteira. Clique "Cancelar" sem salvar. Abra "Nova categoria", "Novo usuario" e "Novo perfil": mesmo card, campos em 2 colunas. (criterios 2 e 5)
3. DevTools > Toggle device toolbar > 390 × 844, recarregue em Lancamentos. Esperado: barra inferior com Resumo, Lancamentos, + e Mais, **sem "Cadastros"**, quatro espacos do mesmo tamanho e "Lancamentos" numa linha. O item da tela atual fica azul escuro e em negrito (Computed `color: rgb(43, 68, 176)`, token `#2b44b0`); os outros cinza `rgb(107, 103, 96)`. Troque para 320 × 844: "Lancamentos" continua numa linha. (criterio 9)
4. Toque em "Mais". Esperado: painel com a secao Cadastros (Categorias) antes de Configuracoes e Sobre, e "Sair" no fim. Toque em Categorias: abre a listagem e "Mais" fica destacado. (criterio 9)
5. Ainda a 390, toque no "+". Esperado: cadastro sem a barra inferior, "Salvar lancamento" azul de 52px fixo no rodape; campo Descricao com `font-size: 16px` no Computed. Volte pela seta: a barra reaparece, sem aviso. (criterio 11)

## Dados de teste criados

Nenhum.

## Conclusao

14 de 14 criterios verificados automaticamente; nenhum NAO ATENDIDO e nenhum depende so de juizo humano. Os ajustes DEC-11 a DEC-14 estao no build servido, sem regressao no celular ja validado (Salvar fixo 52px sem barra, campos 16px) nem nos demais criterios. A feature esta pronta para a sua conferencia (roteiro acima) e, com o aval, para `/pipeline:open-pr`.

Validado pelo usuario em 2026-09-28.
