# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Os criterios de aceite sao numerados de **1 a 42**, na ordem em que aparecem em `spec.md` (7 na secao "Linha de Saldo na escala correta", 5 em "Saldo mensal e meses sem lancamento", 6 em "Deixar claro a que se referem os dados", 5 em "Informativo — mouse", 3 em "Informativo — toque", 6 em "Informativo — teclado", 2 em "Aproveitamento da largura do card" e 8 em "Nao-regressao"). O codigo usado pelo `plan.md` (`L1`, `M2`, `R1`, `H3`, `T2`, `K5`, `W1`, `N4`) aparece ao lado do numero na matriz de cobertura.

O criterio 3 foi reescrito na `spec.md` pela decisao **D5** (topo do eixo arredondado para cima ate o passo redondo) — as tarefas abaixo ja seguem o texto novo.

## Backend

Nenhuma tarefa. O criterio 36 (N2) exige que `git diff --name-only` nao liste nada sob `backend/` ao fim da implementacao — `balance` ja vem pronto de `MonthlySummaryResponse.of` e esta issue e de apresentacao. A conferencia desse criterio esta em T21.

## Frontend

- [x] **T1** — Adicionar `shortMoney(value)` e `longMonthName(month)` em `core/formatters.ts`, com `shortMoney` implementado a mao (divisor + sufixo ` mil`/` mi` + `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })`, nunca `notation: 'compact'`) e `longMonthName` capitalizando e preservando o acento (`Março`, `Maio`). `money()` e `monthName()` ficam intactos.
  - Arquivos: `frontend/src/app/core/formatters.ts`
  - Criterios: 13, 14, 32

- [x] **T2** — Reescrever o `computed` `chart()` de `dashboard.ts` com **escala unica**: normalizar `monthlyEvolution` em 12 slots por `month` (1..12), calcular `rawMax = max(0, maior income/expense/balance)`, `rawMin = min(0, menor balance)`, passo redondo, `domainMax = ceil(rawMax / step) * step` e `domainMin = floor(rawMin / step) * step` (D5: topo e base do plot sempre caem numa marca; a barra mais alta nao encosta no teto), `span = (domainMax - domainMin) || 1`, `scaleY(v)` e `zeroY = scaleY(0)`; barras passam a `y = scaleY(valor)` / `height = max(0, zeroY - scaleY(valor))` e os pontos de saldo a `cy = scaleY(item.balance)` (sem recalcular `balance`). Ano inteiro zerado cai para o dominio default de `100`. Remove `maxValue`/`minBalance`/`balanceRange` e a base fixa em `CHART_BOTTOM`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 1, 2, 3, 4, 6, 7, 8

- [x] **T3** — Derivar no `chart()` as **marcas do eixo Y** (valores arredondados por `Math.round(v / step) * step`, minimo de 4 marcas incluindo o zero, rotulo via `shortMoney`), a geometria das gridlines e o `zeroY`/`hasNegative` da linha de zero. **Requisito do seletor de passo**: enumerar a familia `1 / 2 / 2,5 / 5 x 10^k` (nao dobrar/dividir 10^k as cegas) e escolher o passo de forma que valores usuais caiam exatamente numa marca — `1500` com passo `250` ou `500`, `1 200 000` com passo `200 000` (o negativo da fixture B usa passo `500` — ver D6). Um seletor que so produza `5 x 10^k` faz a faixa dos milhoes render `R$ 1,5 mi` e **nunca** `R$ 1,2 mi`, e o criterio 13 falha no DOM do SVG (ver T16). O minimo de 4 marcas do criterio continua valendo; mais de 4 marcas e aceitavel.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 3, 5, 13, 15

- [x] **T4** — Interromper a serie de Saldo apos o ultimo mes com lancamento (D2): `lastActiveIndex` = maior indice com `income !== 0 || expense !== 0` (`-1` no ano vazio), `balancePoints` = `slice(0, lastActiveIndex + 1)` (mes vazio no meio continua na serie) e `linePoints` montado so a partir deles, saindo `''` quando nao ha ponto.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 9, 10, 11, 12

- [x] **T5** — Trocar o `viewBox` fixo por **largura medida**: signal `chartWidth` iniciado em `DEFAULT_CHART_WIDTH = 840`, `ResizeObserver` sobre `.chart-viewport` criado em `ngAfterViewInit` **somente** sob `typeof ResizeObserver !== 'undefined'`, gravando por `signal.set` (app zoneless) com fallback `el.clientWidth || DEFAULT_CHART_WIDTH`, e `disconnect()` em `ngOnDestroy`; constantes novas (`CHART_HEIGHT = 240`, `PLOT_TOP`, `PLOT_BOTTOM`, `MONTH_LABEL_Y`, `AXIS_WIDTH`, `PLOT_RIGHT_PAD`) e geometria em px (`plotLeft`, `plotRight`, `groupWidth`, `barWidth` com clamp no lugar da constante 13).
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 7, 33, 34

- [x] **T6** — Criar em `styles.scss` o utilitario global `.sr-only` (ainda nao existe no projeto) e os tokens do grafico em `:root` (`--chart-grid`, `--chart-zero`, `--chart-band-active`, `--chart-tooltip-bg`, `--chart-tooltip-border`, `--chart-tooltip-w`), nascendo como alias dos tons ja existentes. Nenhuma cor literal pode nascer no `.scss` da tela.
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 31, 40

- [x] **T7** — Reescrever a estrutura do painel no template: titulo `Evolução anual` acentuado, `<div class="chart-viewport" #chartViewport>` envolvendo o `<svg>` com `[attr.viewBox]` dinamico, `<g class="chart-axis">` com `line.chart-grid-line` + `text.chart-axis-label` por marca, `line.chart-zero-line`, barras sobre a escala nova, `polyline.balance-line`/`circle.balance-point` sob `@if (chart().balancePoints.length)`, os 12 `text.chart-month` e a legenda `Receita`/`Despesa`/`Saldo` com marcador de linha para o Saldo.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 5, 11, 12, 13, 15, 16, 17, 18, 33

- [x] **T8** — Ajustar `dashboard.scss` para a nova geometria: `.chart-viewport { position: relative }`, `.evolution-chart { display: block; width: 100%; height: 240px }` casado com o viewBox medido (no lugar do 4:1 centralizado), `.chart-grid-line`, `.chart-zero-line`, `.chart-axis-label`, marcador da legenda e o breakpoint de 1080px sem sobreposicao de rotulos. Somente `var(--token)`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss`
  - Criterios: 15, 17, 33, 34, 40

- [x] **T9** — Adicionar em `dashboard.ts` o estado e os handlers de **mouse e toque**: `activeMonth = signal<number | null>(null)`, `activeSource`, `onMonthEnter/onMonthMove/onMonthLeave` (o `mouseleave` so limpa se `activeSource === 'mouse'`, por causa dos eventos de compatibilidade do toque), `onMonthPointerDown` com `stopPropagation()`, `@HostListener('document:pointerdown')` fechando quando o clique cai fora do `.chart-viewport`, e os computeds `activeSummary()` (com `money()`) e `tooltipLeft()` com clamp entre `0` e `chartWidth - largura`. Nenhum handler chama service.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 19, 20, 21, 22, 23, 24, 25, 26

- [x] **T10** — Adicionar em `dashboard.ts` a **navegacao por teclado e o anuncio acessivel**: `focusedMonth`, `onChartKeydown` (`ArrowRight`/`ArrowLeft` com clamp nas extremidades, `Home`/`End`, `Escape` fechando sem tirar o foco, todos com `preventDefault()`), `onChartBlur` limpando quando a origem foi teclado, e os computeds `announcement()` (`Março: Receita R$ 1.500,00, Despesa R$ 400,00, Saldo R$ 1.100,00`) e `chartAriaLabel()` em portugues acentuado.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 28, 29, 30, 31, 32

- [x] **T11** — Acrescentar ao template a **camada de interacao**: `rect.month-hit` por mes (faixa inteira de 1/12, de `PLOT_TOP` a `PLOT_BOTTOM`, `fill="transparent"`, desenhado depois das barras) com os handlers de mouse/pointer, `rect.month-band` com `is-active`, `tabindex="0"` + `role="img"` + `[attr.aria-label]` dinamico + `(keydown)` **so** no `<svg>` (unico alvo focavel novo), e `<div class="chart-tooltip-layer" aria-live="polite">` sempre presente no DOM, com o card `.chart-tooltip` (nome do mes + `Receita`/`Despesa`/`Saldo` em `money()`) e o `<span class="sr-only">` do anuncio.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.html`
  - Criterios: 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32

- [x] **T12** — Estilizar o informativo e o foco em `dashboard.scss`: `.month-hit` (`fill: transparent; pointer-events: all`), `.month-band.is-active`, `.chart-tooltip*` com largura `var(--chart-tooltip-w)` e posicionamento em px, `.evolution-chart:focus-visible` com `outline` em `var(--accent)` (sem `outline: none` sem substituto) e o breakpoint de 680px (`AXIS_WIDTH` menor, rotulos reduzidos, informativo inteiro dentro do card).
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.scss`
  - Criterios: 26, 30, 34, 40

## Testes

T13 roda logo apos T1; as demais seguem a ordem da lista.

- [x] **T13** — Criar `formatters.spec.ts` cobrindo `shortMoney` (`0`, `800`, `-800`, `999`, `1000`, `1500`, `1_200_000`) e `longMonthName` (`3 -> Março`, `5 -> Maio`). Isto e **cobertura adicional** do formatador isolado: a evidencia do criterio 13 continua sendo o DOM do SVG em T16, nunca este arquivo.
  - Arquivos: `frontend/src/app/core/formatters.spec.ts`
  - Criterios: 13, 14

- [x] **T14** — Adicionar a `dashboard.spec.ts` o `describe` de **escala e linha de zero**: `cy === y` da barra em `1000/0/1000`; `1000/400/600` a 60% da altura; o dominio arredondado de D5 provado nas duas metades do criterio 3 — (a) o maior valor das tres series e `<=` ao valor da marca mais alta do eixo **e** essa marca e multiplo do passo (o topo do plot e uma marca rotulada, e o `y` da barra mais alta e **maior** que `PLOT_TOP`, ou seja, nao encosta no teto) e (b) nenhum `y`, `y + height` ou `cy` fora de `[PLOT_TOP, PLOT_BOTTOM]`, nos cenarios de saldo acima da maior barra e de saldo negativo; `100/500/-400` com `cy` abaixo de `line.chart-zero-line[y1]` e base das barras nessa linha; `1000/200/balance: 700` plotado em 700; ano zerado sem nenhum `NaN` em `x/y/width/height/cx/cy`/`viewBox`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 1, 2, 3, 4, 5, 6, 7

- [x] **T15** — Adicionar o `describe` de **saldo mensal e corte da linha**: Fev (500) abaixo de Jan (1000) e nao em 1500; dados Jan..Ago dando 8 `circle.balance-point` e 8 pares em `polyline.balance-line[points]`; Jan/Mar com Fev zerado dando 3 pontos ligados; cenario do print (Set..Dez so com receita) com 12 `text.chart-month` e barras sem ponto; ano vazio sem `circle` e sem `polyline`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 8, 9, 10, 11, 12

- [x] **T16** — Adicionar o `describe` de **eixo, titulo e legenda**, com as quatro faixas do criterio 13 lidas **no DOM do SVG** (`text.chart-axis-label` de `dashboard.spec.ts`), em tres fixtures — uma so nao produz `R$ 1,2 mi` e um negativo na mesma escala:
  - fixture A (milhares + zero): maior valor `1500`, **passo do eixo obrigatoriamente divisor de 1500** (`250` ou `500`) para existir marca em 1500 — assertar `R$ 1,5 mil` e `R$ 0` entre os rotulos, a sequencia completa de marcas (para o teste falhar com mensagem clara se o algoritmo do passo de T3 mudar) e, no mesmo teste, `R$ 1.500,00` no informativo apos `mouseenter` (criterio 14);
  - fixture B (negativo): `{ 1: [400, 0, 400], 2: [0, 1000, -1000] }` — **coerente** (`balance === income - expense`, com assercao de sanidade antes do render), faixa `-1000..1000`, passo `500` — assertar a sequencia completa `['-R$ 1 mil', '-R$ 500', 'R$ 0', 'R$ 500', 'R$ 1 mil']`, com `-R$ 500` e `R$ 0` entre os rotulos. **Ver D6**: o exemplo original `-R$ 800` foi trocado porque so era alcancavel com `balance !== income - expense`, estado que `MonthlySummaryResponse.of` nunca produz — um saldo `-x` coerente exige `expense >= x`, o que eleva `rawMax` e faz o passo subir ate um valor do qual `800` nao e multiplo;
  - fixture C (milhoes): maior valor `1 200 000`, passo `200 000` — assertar `R$ 1,2 mi` entre os rotulos e a sequencia de marcas.

    Mais: `line.chart-grid-line`.length igual ao numero de marcas com `y1 === y2` dentro da plotagem; `<h3>` e `aria-label` com `Evolução anual`; tres itens de legenda com marcador de linha no Saldo; `text.chart-month` com `Jan`..`Dez`.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 13, 14, 15, 16, 17, 18

- [x] **T17** — Adicionar o `describe` do **informativo por mouse**: `mouseenter`/`mousemove` no `rect.month-hit` exibindo mes + `Receita`/`Despesa`/`Saldo` com `money()` e o `balance` da API; mes zerado exibindo `R$ 0,00` tres vezes com `width` do hit ≈ `groupWidth` e altura de `PLOT_TOP` a `PLOT_BOTTOM`; `mouseleave` removendo `.chart-tooltip`; `httpMock.expectNone(() => true)` ao fim.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 19, 20, 21, 22, 23

- [x] **T18** — Adicionar o `describe` do **informativo por toque**: `pointerdown` na faixa produzindo texto identico ao do cenario de hover; `pointerdown` em outro mes trocando o conteudo com um unico `.chart-tooltip` vivo; `pointerdown` em `document.body` fechando.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 24, 25

- [x] **T19** — Adicionar o `describe` de **teclado e acessibilidade**: `tabindex="0"` no `<svg>` e exatamente um `[tabindex]:not([tabindex="-1"])` no painel; `ArrowRight`/`ArrowLeft` movendo o mes e atualizando o informativo, com clamp em Jan/Dez; `Escape` fechando com `document.activeElement` ainda no SVG; camada `aria-live="polite"`, `.sr-only` com o anuncio acentuado e `aria-label` do SVG contendo esse trecho; classe `is-active` no `rect.month-band` do mes focado. Titulos e fixtures escritos ja acentuados (a varredura cobre `*.spec.ts`).
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 27, 28, 29, 30, 31, 32

- [x] **T20** — Garantir a **nao-regressao** em `dashboard.spec.ts`: os tres testes atuais de toast (500, `status = 0`, 200 sem toast) seguem passando sem alteracao; troca do `<select>` de mes/ano via `dispatchEvent(new Event('change'))` gera **uma** `GET /dashboard/summary` e redesenha o grafico; os 4 `.metric-card` e o painel "Detalhamento" (com `.empty-state` "Sem dados no período") continuam iguais.
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`
  - Criterios: 35, 37, 38

- [x] **T21** — Rodar as varreduras de conformidade e o build, corrigindo o que apontarem: `git diff --name-only` sem nada sob `backend/`; `git diff frontend/package.json` vazio e `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` sem saida; `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` sem saida; as duas varreduras de acentuacao de `knowledge/architecture.md` e `rg -n "Evolucao" frontend/src` sem saida; `cd frontend && npm test` e `npm run build` verdes.
  - Arquivos: — (verificacao; sem arquivo proprio, corrige onde a varredura apontar)
  - Criterios: 36, 39, 40, 41, 42

## Validacao manual (etapa 8)

Quatro criterios **nao** ficam verdes por `npm test` — a evidencia deles e a tela, com a stack no ar em `http://localhost` (Resumo, card "Evolução anual"):

- **Criterio 26 (T3) — toque em tela estreita**: DevTools em modo dispositivo com largura <= 680px, tocar numa faixa de mes; o informativo aparece legivel, inteiro dentro do card, sem corte nem scroll horizontal; tocar fora fecha.
- **Criterio 30 (K4) — indicacao visual do mes focado**: navegar por teclado e observar a faixa destacada do mes e o contorno de foco do grafico (o teste automatizado so cobre a classe `is-active`).
- **Criterio 33 (W1) — aproveitamento da largura**: janela em 1920px com a sidebar recolhida; medir no DevTools a largura interna do `.chart-panel` (`clientWidth - 48`) e a faixa plotada (`svg.clientWidth - AXIS_WIDTH - PLOT_RIGHT_PAD`); a razao deve ser >= 90% e nao pode haver faixa vazia a esquerda alem dos 24px de padding.
- **Criterio 34 (W2) — legibilidade a 1080px**: reduzir a janela ate `.panels-grid` virar uma coluna; os 12 rotulos de mes continuam sem sobreposicao e o informativo continua dentro do card.

Os criterios 16 (R4), 17 (R5) e 37 (N3) tambem pedem uma conferencia visual rapida na mesma passada, alem do teste automatizado.

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 (L1) | Linha e barras na mesma escala (`cy` == `y` da barra) | T2, T14 |
| 2 (L2) | Mes com receita e despesa a 60% da barra | T2, T14 |
| 3 (L3) | Dominio cobre as tres series e termina em marca redonda (D5) | T2, T3, T14 |
| 4 (L4) | Saldo negativo abaixo da linha de zero | T2, T14 |
| 5 (L5) | `.chart-zero-line` visivel e base das barras nela | T3, T7, T14 |
| 6 (L6) | Plota o `balance` da API, sem recalculo no front | T2, T14 |
| 7 (L7) | Nenhum `NaN` em ano sem lancamentos | T2, T5, T14 |
| 8 (M1) | Saldo do mes, nao acumulado | T2, T15 |
| 9 (M2) | Linha termina no ultimo mes com lancamento | T4, T15 |
| 10 (M3) | Mes vazio no meio nao corta a serie | T4, T15 |
| 11 (M4) | Eixo X completo + barras depois do fim da linha | T2, T4, T7, T15 |
| 12 (M5) | Ano vazio sem ponto e sem `polyline` | T4, T7, T15 |
| 13 (R1) | Eixo Y com >= 4 marcas abreviadas, as quatro faixas no DOM do SVG | T1, T3, T7, T16 (T13 como cobertura adicional) |
| 14 (R2) | Abreviacao so no eixo; informativo com `money()` | T1, T11, T16 (T13 como cobertura adicional) |
| 15 (R3) | Gridline horizontal por marca | T3, T7, T8, T16 |
| 16 (R4) | Titulo e `aria-label` com `Evolução anual` | T7, T11, T16, T21 |
| 17 (R5) | Legenda `Receita`/`Despesa`/`Saldo` com marcador de linha | T7, T8, T16 |
| 18 (R6) | Eixo X com os 12 meses abreviados | T7, T16 |
| 19 (H1) | Hover abre o informativo do mes | T9, T11, T17 |
| 20 (H2) | Valores em `money()` e Saldo igual ao da API | T9, T11, T17 |
| 21 (H3) | Hit area cobre a faixa inteira; mes vazio mostra `R$ 0,00` | T9, T11, T17 |
| 22 (H4) | `mouseleave` fecha o informativo | T9, T11, T17 |
| 23 (H5) | Nenhuma requisicao HTTP ao abrir o informativo | T9, T17 |
| 24 (T1) | Toque abre o mesmo informativo | T9, T11, T18 |
| 25 (T2) | Tocar em outro mes troca; tocar fora fecha | T9, T11, T18 |
| 26 (T3) | Toque legivel dentro do card em <= 680px (manual) | T9, T11, T12 |
| 27 (K1) | Uma unica parada de Tab (`tabindex="0"` no SVG) | T11, T19 |
| 28 (K2) | Setas movem o mes e exibem o informativo | T10, T11, T19 |
| 29 (K3) | `Escape` fecha mantendo o foco no grafico | T10, T11, T19 |
| 30 (K4) | Mes focado com indicacao visual (manual + `is-active`) | T10, T11, T12, T19 |
| 31 (K5) | Anuncio a leitor de tela (`aria-live`, `.sr-only`, `aria-label`) | T6, T10, T11, T19 |
| 32 (K6) | Textos do informativo em portugues acentuado | T1, T10, T11, T19, T21 |
| 33 (W1) | Plotagem >= 90% da largura interna a 1920px (manual) | T5, T7, T8 |
| 34 (W2) | Legivel e sem sobreposicao a 1080px (manual) | T5, T8, T12 |
| 35 (N1) | Troca de Ano/Mes recarrega com uma unica chamada | T20 |
| 36 (N2) | Nenhum arquivo de `backend/src` alterado | T21 |
| 37 (N3) | Cards de metricas e "Detalhamento" intactos | T20 |
| 38 (N4) | Toasts do Resumo preservados | T20 |
| 39 (N5) | Sem dependencia npm nova e sem recurso externo | T21 |
| 40 (N6) | Nenhuma cor literal fora de `styles.scss` | T6, T8, T12, T21 |
| 41 (N7) | Varredura de acentuacao sem saida | T21 |
| 42 (N8) | `npm test` e `npm run build` passam | T21 |

## Lacunas

Nenhum criterio de aceite ficou sem tarefa e nenhuma tarefa ficou sem criterio (T21 e a unica sem arquivo proprio, e existe exatamente para fechar os criterios de comando 36, 39, 40, 41 e 42). As tres divergencias levantadas na primeira versao deste arquivo foram decididas e ja estao incorporadas: o criterio 3 foi reescrito na `spec.md` com a decisao **D5** (T2/T3/T14), a evidencia das quatro faixas do criterio 13 continua no DOM do SVG com tres fixtures em `dashboard.spec.ts` (T16, com `formatters.spec.ts` apenas como cobertura adicional) e o passo do eixo virou requisito explicito de T3 e de T16.

Permanece so o ponto informativo:

- **Quatro criterios so tem evidencia manual: 26 (T3), 30 (K4), 33 (W1) e 34 (W2).** As tarefas que os implementam existem (T9/T11/T12, T5/T8), mas a prova cai inteira na validacao da etapa 8, com a stack no ar — roteiro nominal na secao "Validacao manual (etapa 8)" acima. Nao e lacuna de plano; e aviso de que esses quatro nao ficam verdes por `npm test`.

Conferencias que **nao** viraram lacuna, registradas para nao serem reabertas:

- **Regra de negocio so no front-end: nao se aplica.** Nenhum criterio desta issue descreve regra de negocio nova. `income`/`expense`/`balance` continuam calculados e impostos no back-end (`MonthlySummaryResponse.of`, `knowledge/dashboard.md`) e o criterio 6 (L6) blinda justamente o recalculo no cliente. O corte da linha (D2, criterios 9/10/11/12) usa `income !== 0 || expense !== 0` sobre campos que a API ja devolve — e escolha de **apresentacao** sobre dado recebido, nao filtro nem recalculo de valor, por isso nao exige tarefa de backend.
- **Ausencia de tarefa de migration e de backend e intencional**, e o criterio 36 (N2) a transforma em verificacao explicita (T21).
