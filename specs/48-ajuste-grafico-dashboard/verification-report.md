# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reiniciada na etapa anterior — ver `docker-report.md`; containers `financeos-frontend`/`financeos-backend`/`financeos-postgres` no ar, `GET /` 200 e `GET /api/health` 200 conferidos nesta etapa).
Branch: `feature/issue-48-ajuste-grafico-dashboard` — mudancas ainda **nao commitadas**.

Evidencias desta etapa, alem da leitura do diff:

- `cd frontend && npm test` reexecutado aqui: **21 arquivos, 199 testes, 0 falhas** (exit 0). Todo teste citado abaixo esta nessa rodada verde.
- Bundle **realmente servido** conferido por `curl`: `http://localhost/` referencia `styles-OKDUXOSR.css` e `main-E5ZSAT43.js`, que carrega `chunk-ByYvaFK-.js` (Dashboard). O chunk servido ja contem `.chart-grid-line{stroke:var(--chart-grid)}`, `.chart-zero-line`, `.month-hit{fill:transparent;pointer-events:all}`, `.month-band.is-active`, `.chart-tooltip{...width:min(var(--chart-tooltip-w),100%)...}`, `.evolution-chart{display:block;width:100%;height:240px}` + `:focus-visible{outline:2px solid var(--accent)}`, e os atributos `preserveAspectRatio`, `tabindex`, `aria-live`. O CSS global servido tem os sete tokens `--chart-*` e o utilitario `.sr-only`. Ou seja: **o que esta rodando corresponde ao working tree**.
- Encoding conferido por bytes no bundle servido: o titulo aparece como `Evolu\xE7\xE3o an...` (escapes corretos de `ç`/`ã`) e nao ha nenhum `Ã`/`Â` no chunk — sem mojibake.
- Nenhum arquivo sob `backend/` no `git status`; nenhuma consulta de escrita foi feita ao banco.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Linha e barras na mesma escala (`cy` == `y` da barra) | VERIFICADO | `dashboard.spec.ts` > escala do grafico > "plota o ponto de saldo na mesma escala da barra de receita" (passou) |
| 2 | Mes com receita e despesa a 60% da barra | VERIFICADO | `dashboard.spec.ts` > escala do grafico > "plota o saldo proporcional a barra de receita no mes com despesa" (passou) |
| 3 | Dominio cobre as tres series e termina em marca redonda (D5) | VERIFICADO | "arredonda o topo do eixo para a marca redonda acima do maior valor" (sequencia de marcas lida no DOM, ultima gridline em `y = PLOT_TOP`, barra e ponto com `y > PLOT_TOP`) + "mantem todas as series dentro da area de plotagem, inclusive com saldo negativo" (passaram) |
| 4 | Saldo negativo abaixo da linha de zero | VERIFICADO | "desenha o saldo negativo abaixo da linha de zero, com as barras apoiadas nela" (passou) |
| 5 | `.chart-zero-line` visivel e base das barras nela | VERIFICADO | mesmo teste do criterio 4 (`line.chart-zero-line` nao nula, base da barra == `y1`); elemento desenhado em `dashboard.html:142-148`; estilo servido `.chart-zero-line{stroke:var(--chart-zero);stroke-width:1.5}` |
| 6 | Plota o `balance` da API, sem recalculo no front | VERIFICADO | "plota o saldo recebido da API, sem recalcular receita menos despesa" (fixture `1000/200/balance 700`; passou) |
| 7 | Nenhum `NaN` em ano sem lancamentos | VERIFICADO | "nao gera atributo NaN em ano sem lancamentos" (varre `x/y/width/height/cx/cy/x1/y1/x2/y2` de todos os nos do SVG; passou) |
| 8 | Saldo do mes, nao acumulado | VERIFICADO | saldo mensal e fim da linha > "plota o saldo do proprio mes, e nao um acumulado" (passou) |
| 9 | Linha termina no ultimo mes com lancamento | VERIFICADO | "interrompe a linha de saldo depois do ultimo mes com lancamento" (8 `circle.balance-point`, 8 pares em `polyline[points]`; passou) |
| 10 | Mes vazio no meio nao corta a serie | VERIFICADO | "mantem na linha o mes sem lancamento que fica no meio da serie" (3 pontos, 3 pares; passou) |
| 11 | Eixo X completo + barras independentes do fim da linha | VERIFICADO (com ressalva) | "desenha as barras dos meses depois do fim da linha e mantem os 12 meses no eixo X" (12 `text.chart-month` de `Jan` a `Dez`) e "nao desenha ponto nem linha de saldo no ano sem lancamentos" (12 rotulos com zero lancamento); barras renderizadas para os 12 meses sem depender de `balancePoints` em `dashboard.html:116-132`. **Ressalva**: o parentese do criterio ("cenario do print: Set..Dez tem barra de Receita e nenhum ponto de saldo") e inalcancavel sob a decisao **D2** da propria spec — mes com barra de Receita e, por definicao, mes com lancamento, logo entra na linha. Inconsistencia do texto do criterio, nao da implementacao |
| 12 | Ano vazio sem ponto e sem `polyline` | VERIFICADO | "nao desenha ponto nem linha de saldo no ano sem lancamentos" (passou) |
| 13 | Eixo Y com >= 4 marcas abreviadas (as quatro faixas, no DOM do SVG) | VERIFICADO | eixo, titulo e legenda > "rotula o eixo em milhares..." (`R$ 1,5 mil` e `R$ 0`), "rotula o eixo com valores negativos abaixo de mil" (`-R$ 500`, `R$ 0`, fixture coerente `balance === income - expense` asserida antes do render — D6) e "rotula o eixo em milhoes" (`R$ 1,2 mi`); todas lendo `text.chart-axis-label`. Cobertura adicional em `formatters.spec.ts` (passaram) |
| 14 | Abreviacao so no eixo; informativo com `money()` | VERIFICADO | "rotula o eixo em milhares e mostra o valor cheio no informativo": `R$ 1,5 mil` no eixo e `R$ 1.500,00` no informativo apos `mouseenter`, com `not.toContain('R$ 1,5 mil')` no tooltip (passou) |
| 15 | Gridline horizontal por marca | VERIFICADO | "desenha uma gridline horizontal para cada marca do eixo" (contagem igual ao numero de marcas, `y1 == y2`, dentro de `[PLOT_TOP, PLOT_BOTTOM]`, `x1 == plotLeft`, `x2 == plotRight`; passou) |
| 16 | Titulo e `aria-label` com `Evolução anual` | VERIFICADO | "exibe o titulo e o rotulo acessivel acentuados" (passou); `rg -n "Evolucao" frontend/src` sem saida; bundle servido com `Evolu\xE7\xE3o` (sem mojibake). Conferencia visual rapida no roteiro (item 2) |
| 17 | Legenda `Receita`/`Despesa`/`Saldo` com marcador proprio do Saldo | VERIFICADO | "mantem a legenda das tres series com marcador de linha no saldo" (passou); `dashboard.scss:142-145` deixa o marcador do Saldo com `border-radius: var(--radius-pill)`, distinto dos marcadores quadrados das barras e inalterado desde a issue #35. Conferencia visual rapida no roteiro (item 2) |
| 18 | Eixo X com os 12 meses abreviados | VERIFICADO | "desenha as barras dos meses depois do fim da linha e mantem os 12 meses no eixo X" (`['Jan'..'Dez']`; passou) |
| 19 | Hover abre o informativo do mes | VERIFICADO | informativo por mouse > "exibe receita, despesa e saldo do mes apontado" (passou) |
| 20 | Valores em `money()` e Saldo igual ao da API | VERIFICADO | mesmo teste: texto exato `Março Receita R$ 1.500,00 Despesa R$ 400,00 Saldo R$ 1.100,00` (passou) |
| 21 | Hit area cobre a faixa inteira; mes vazio mostra `R$ 0,00` | VERIFICADO | "cobre a faixa inteira do mes e exibe zero no mes sem lancamento" (`width` proximo de `groupWidth`, `y == PLOT_TOP`, `height == PLOT_BOTTOM - PLOT_TOP`, tooltip com tres `R$ 0,00`; passou) |
| 22 | `mouseleave` fecha o informativo | VERIFICADO | "fecha o informativo ao tirar o mouse da faixa do mes" (`.chart-tooltip` sai do DOM; passou) |
| 23 | Nenhuma requisicao HTTP ao abrir o informativo | VERIFICADO | "abre o informativo sem disparar requisicao" (`httpMock.expectNone(() => true)`; passou) |
| 24 | Toque abre o mesmo informativo | VERIFICADO | informativo por toque > "abre pelo toque o mesmo informativo do mouse" (compara o texto com o do hover; passou) |
| 25 | Tocar em outro mes troca; tocar fora fecha | VERIFICADO | "troca o informativo ao tocar em outro mes e fecha ao tocar fora do grafico" (um unico `.chart-tooltip` vivo; `pointerdown` no `document.body` fecha; passou) |
| 26 | Toque legivel dentro do card em <= 680px | VALIDACAO MANUAL | ver roteiro item 3 |
| 27 | Uma unica parada de Tab (`tabindex="0"` no SVG) | VERIFICADO | teclado e acessibilidade > "entra na ordem de tabulacao com uma unica parada" (`tabindex="0"` e exatamente um `[tabindex]:not([tabindex="-1"])` no `.chart-panel`; passou) |
| 28 | Setas movem o mes e exibem o informativo | VERIFICADO | "navega entre os meses com as setas e para nas extremidades" (clamp em Jan e Dez, `Home`/`End`, texto do informativo a cada passo; passou) |
| 29 | `Escape` fecha mantendo o foco no grafico | VERIFICADO | "fecha o informativo com Escape mantendo o foco no grafico" (`document.activeElement === svg`; passou) |
| 30 | Mes focado com indicacao visual | VALIDACAO MANUAL | a parte automatizavel esta verde — "destaca a faixa do mes focado" (exatamente um `rect.month-band.is-active`, no indice certo) — e o CSS servido tem `.month-band.is-active{fill:var(--chart-band-active)}` e `.evolution-chart:focus-visible{outline:2px solid var(--accent)}`; o "visivel" em si e olho humano: ver roteiro item 4 |
| 31 | Anuncio a leitor de tela (`aria-live`, `.sr-only`, `aria-label`) | VERIFICADO | "anuncia o mes focado em portugues para leitores de tela" (`aria-live="polite"` na camada, `.sr-only` com `Março: Receita R$ 1.500,00, Despesa R$ 400,00, Saldo R$ 1.100,00`, `aria-label` do SVG contendo o mesmo trecho; passou). `.sr-only` presente no CSS global servido |
| 32 | Textos do informativo e rotulos acessiveis em portugues acentuado | VERIFICADO | mesmo teste do criterio 31 + `formatters.spec.ts` > longMonthName (`Março`); varredura de acentuacao de `knowledge/architecture.md` sobre `frontend/src` sem saida; bundle servido sem `Ã`/`Â` |
| 33 | Plotagem >= 90% da largura interna do card a 1920px | VALIDACAO MANUAL | ver roteiro item 5 (com o snippet de medicao) |
| 34 | Legivel e sem sobreposicao de rotulos a 1080px | VALIDACAO MANUAL | ver roteiro item 6 |
| 35 | Troca de Ano/Mes recarrega com uma unica chamada | VERIFICADO | nao-regressao do Resumo > "recarrega o resumo ao trocar o mes, com uma unica chamada" (`change` no `<select>` gera uma `GET /dashboard/summary` e o grafico e redesenhado com 2 pontos; passou). O campo Ano mantem o mesmo caminho: `(change)="load()"` em `dashboard.html:8`, inalterado |
| 36 | Nenhum arquivo de `backend/src` alterado | VERIFICADO | `git status --porcelain` lista apenas 6 arquivos sob `frontend/src` mais a pasta `specs/48-...`; nada sob `backend/` |
| 37 | Cards de metricas e "Detalhamento" intactos | VERIFICADO | "mantem os cards de metricas e o painel de detalhamento" (4 `.metric-card`, `h3` "Detalhamento", dois `.empty-state` "Sem dados no período"; passou); `dashboard.scss:102` mantem `grid-template-columns: minmax(0, 1fr) 360px`. Conferencia visual rapida no roteiro (item 7) |
| 38 | Toasts do Resumo preservados | VERIFICADO | os tres testes originais (500, `status = 0`, 200 sem toast) continuam no arquivo, inalterados e verdes |
| 39 | Sem dependencia npm nova e sem recurso externo | VERIFICADO | `frontend/package.json` e `package-lock.json` fora do `git status` (nao tocados); `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` sem saida |
| 40 | Nenhuma cor literal fora de `styles.scss` | VERIFICADO | `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` sem saida; os sete tokens `--chart-*` nasceram em `:root` (`styles.scss`) como alias de tons existentes e aparecem assim no CSS servido |
| 41 | Varredura de acentuacao sem saida | VERIFICADO | as varreduras de `knowledge/architecture.md` sobre `frontend/src` (incluindo `*.spec.ts`) e `rg -n "Evolucao" frontend/src` sairam vazias |
| 42 | `npm test` e `npm run build` passam | VERIFICADO | `npm test` reexecutado nesta etapa: 21 arquivos / **199 testes** verdes, exit 0. O build esta provado pelo bundle servido em `http://localhost`, gerado por `docker compose up -d --build` (ver `build-report.md`) |

## Roteiro de validacao manual

Contexto do "antes": o print da issue (`specs/48-ajuste-grafico-dashboard/design/grafico-atual.png`) mostra o estado **anterior** — linha de Saldo **reta no topo** em Set..Dez, **sem eixo Y**, **sem nenhum numero**, **sem informativo** ao apontar, e o desenho ocupando **so a metade direita** do card, com uma faixa vazia grande a esquerda. Cada item abaixo e o contraste esperado agora.

1. **Chegar no painel.** Abra `http://localhost` e entre com o seu usuario (qualquer perfil com acesso ao Resumo). O Resumo e a tela inicial; se nao for, clique em **Resumo** na barra lateral. Escolha, nos controles do topo (Ano e Mes), um periodo que tenha lancamentos. Olhe o card **"Evolução anual"**. Esperado, ja diferente do print: titulo **acentuado**, **eixo Y a esquerda com valores em R$ abreviados** (ex.: `R$ 0`, `R$ 500`, `R$ 1 mil`, `R$ 1,5 mil`) e **linhas horizontais de grade** atravessando o grafico; a linha de Saldo passa **pelo topo das barras de Receita** nos meses so com receita (nao reta no alto do card) e os meses sem lancamento no fim do ano ficam **sem ponto e sem linha**, so com o rotulo do mes no eixo X. (criterios 1 a 15 e 18 — confirmacao visual do que os testes ja provam)

2. **Titulo, rotulos e legenda.** Ainda no card: o titulo deve ler **"Evolução anual"** (com cedilha e til) e a legenda deve trazer **Receita**, **Despesa** e **Saldo**, com o marcador do Saldo **arredondado/pill**, diferente dos marcadores quadrados das barras. Esperado: nenhum texto sem acento, nenhum caractere estranho (`Ã`, `Â`). (criterios 16 e 17)

3. **Toque em tela estreita.** Abra o DevTools (F12), ative o **modo dispositivo** (Ctrl+Shift+M) e escolha uma largura **<= 680px** (ex.: iPhone SE / 390px). Role ate o card "Evolução anual" e **toque numa faixa de mes** que tenha valores. Esperado: o informativo abre com o **nome do mes por extenso** e as tres linhas `Receita`, `Despesa`, `Saldo` em R$ cheio (ex.: `R$ 1.234,56`); o card do informativo fica **inteiro dentro do card do painel**, sem cortar texto e **sem criar rolagem horizontal** na pagina. Toque em outro mes: o conteudo **troca** (nunca dois informativos). Toque fora do grafico: o informativo **fecha**. (criterio 26)

4. **Destaque do mes focado por teclado.** Volte ao tamanho normal da janela (desative o modo dispositivo). Clique no controle **Mes** do topo e pressione **Tab** ate o foco chegar ao grafico — deve bastar **uma parada** e voce deve ver um **contorno de foco visivel** em volta do grafico. Pressione **seta para a direita** varias vezes. Esperado: a **faixa vertical do mes focado fica com fundo destacado** (mais escura que o resto) e o informativo daquele mes aparece e acompanha a navegacao; a seta para a esquerda volta e **para em Janeiro**, a da direita **para em Dezembro**. Pressione **Esc**: o informativo fecha e o **foco continua no grafico** (o contorno permanece). Um Tab a mais deve **sair** do grafico para o proximo elemento da pagina. (criterio 30; confirma tambem 27, 28 e 29 na tela)

5. **Aproveitamento da largura a 1920px.** Deixe a janela **maximizada em um monitor de 1920px** (ou, no DevTools, modo dispositivo com largura 1920 e zoom 100%) e **recolha a barra lateral**. Olhe o card "Evolução anual": nao pode existir **faixa vazia a esquerda** alem do padding do card (24px) — o desenho deve comecar logo depois dos rotulos do eixo Y e o rotulo **Dez** deve ficar junto da borda direita. Para medir, cole no **Console** do DevTools:

   ```js
   const panel = document.querySelector('.chart-panel');
   const svg = document.querySelector('svg.evolution-chart');
   const eixo = svg.clientWidth < 520 ? 44 : 64;   // AXIS_WIDTH
   const interno = panel.clientWidth - 48;          // padding de 24px de cada lado
   const plot = svg.clientWidth - eixo - 12;        // PLOT_RIGHT_PAD = 12
   console.log({ interno, svg: svg.clientWidth, plot, razao: (plot / interno * 100).toFixed(1) + '%' });
   ```

   Esperado: `razao` **>= 90%**. (criterio 33)

6. **Legibilidade a 1080px.** Reduza a largura da janela ate o painel "Detalhamento" **descer para baixo do grafico** (a `.panels-grid` vira uma coluna so, em 1080px). Esperado: os **12 rotulos de mes** (`Jan`..`Dez`) continuam legiveis e **sem se sobrepor** uns aos outros, os rotulos do eixo Y continuam legiveis, e o informativo (passe o mouse por um mes) continua **dentro do card**. (criterio 34)

7. **Conferencia rapida de nao-regressao.** Na mesma passada, confirme que os **4 cards de metricas** do topo (Receitas, Despesas, Pendentes, Saldo) e o painel **"Detalhamento"** (coluna da direita, secoes Receitas/Despesas com a contagem de categorias e "Sem dados no período" quando vazio) estao **iguais ao que eram**. Troque o **Mes** e o **Ano** nos controles do topo: o resumo deve recarregar sozinho e o grafico redesenhar com a serie nova, **sem** botao "Atualizar" e sem informativo preso do periodo anterior. (criterios 35 e 37)

## Dados de teste criados

Nenhum. Nenhuma escrita foi feita no banco nem pela API; a verificacao usou apenas os testes automatizados, o diff e leituras por `curl` dos assets servidos.

## Achado fora dos criterios

Nenhuma mudanca alheia a feature: o working tree contem **apenas** os arquivos da issue (`frontend/src/app/core/formatters.ts`, `frontend/src/app/core/formatters.spec.ts`, `frontend/src/app/features/dashboard/{dashboard.ts,dashboard.html,dashboard.scss,dashboard.spec.ts}`, `frontend/src/styles.scss`) mais a pasta `specs/48-ajuste-grafico-dashboard/` — exatamente a lista de `implementation-notes.md`.

Registro de leitura (nao reprova nada, mas convem saber na validacao): o **criterio 11** tem um parentese autocontraditorio com a decisao **D2** — "Set..Dez tem barra de Receita e nenhum ponto de saldo" nao pode ocorrer, porque mes com barra de receita e mes com lancamento e, por D2, a linha vai ate ele. O comportamento implementado e o de D2, e as duas afirmacoes principais do criterio (rotulo de mes sempre presente no eixo X; barras desenhadas independentemente do fim da linha) estao provadas.

## Conclusao

**38 dos 42 criterios verificados automaticamente; 4 dependem de validacao manual do usuario** (26, 30, 33 e 34 — exatamente os quatro que `tasks.md` antecipou como "nao fecham por `npm test`"). **Nenhum criterio NAO ATENDIDO.**

Nada bloqueia a feature do lado automatizado: 199 testes de frontend verdes, 51 de backend, build e stack no ar com o codigo desta branch. A feature so avanca para commit/PR (`/pipeline:open-pr`) depois que o usuario percorrer o roteiro acima em `http://localhost` e aprovar — em especial os itens 3 a 6, que sao a unica evidencia possivel dos criterios 26, 30, 33 e 34.
