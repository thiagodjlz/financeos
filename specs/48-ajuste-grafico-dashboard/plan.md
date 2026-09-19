# Plano de implementacao

## Abordagem

O conserto e 100% front-end e concentrado no componente `Dashboard`: o `computed` `chart()` deixa de ter duas escalas (barras a partir do zero, linha normalizada por `minBalance`/`balanceRange`) e passa a derivar **uma unica escala linear** `scaleY(valor)` a partir de um dominio que cobre receita, despesa e saldo dos 12 meses e sempre inclui o zero (`domainMin = min(0, menorSaldo)`), com as marcas do eixo Y arredondadas para valores "redondos". Sobre essa escala nascem as barras (base em `y(0)`), a linha de Saldo (interrompida apos o ultimo mes com lancamento, D2), o eixo Y com gridlines rotuladas em forma abreviada (D3) e a linha de zero.

Para o grafico ocupar a largura do card, o SVG passa a ter **viewBox medido**: a largura em unidades de usuario e a largura real do contorno em px (`ResizeObserver`, com fallback constante), de modo que 1 unidade = 1 px, o desenho nunca e reescalado/centralizado e o informativo pode ser um elemento **HTML** posicionado em px sobre o grafico (facilita texto, tokens, `aria-live` e o clamp contra a borda do card).

O informativo (D4) vem de um `signal` de mes ativo alimentado por tres origens — `mouseenter`/`mousemove` numa hit area por mes, `pointerdown` (toque) e setas do teclado sobre o unico `tabindex="0"` do grafico (o proprio `<svg>`) — com `Escape` fechando sem perder o foco.

**Nenhuma regra de negocio nova entra nesta feature**: nao ha campo obrigatorio novo, nenhum payload muda e nada e validado no cliente. `income`/`expense`/`balance` continuam calculados e impostos no back-end (`MonthlySummaryResponse.of`, regras em `knowledge/dashboard.md`) e o front so os formata — confirmo a leitura da etapa 1: **nenhum arquivo de `backend/src`, nenhum DTO e nenhuma migration mudam**. Se durante a implementacao aparecer qualquer regra nova (ex.: decidir no cliente o que conta como "mes com lancamento" a partir de um campo que a API nao devolve), ela teria de ir para o back-end — nao e o caso: `income !== 0 || expense !== 0` usa campos que ja vem prontos.

## Arquivos a alterar

### Backend
- Nenhum. Criterio de nao-regressao N2 exige que `git diff --name-only` nao liste nada sob `backend/` ao fim da implementacao.

### Frontend
- `frontend/src/app/features/dashboard/dashboard.ts` — reescrita do `computed` `chart()` (escala unica, dominio com zero, marcas do eixo, corte da linha, geometria em px) + estado novo: `chartWidth` (signal, `ResizeObserver`), `activeMonth` (signal `number | null`), `activeSource` (`'mouse' | 'touch' | 'keyboard' | null`), `focusedMonth`; handlers `onMonthEnter/onMonthMove/onMonthLeave/onMonthPointerDown/onChartKeydown/onChartBlur/onDocumentPointerDown`; computeds `activeSummary()`, `tooltipLeft()`, `announcement()`, `chartAriaLabel()`; normalizacao de `monthlyEvolution` para 12 slots (`month` 1..12) antes de desenhar.
- `frontend/src/app/features/dashboard/dashboard.html` — bloco do painel "Evolucao anual": titulo acentuado, `<div class="chart-viewport" #chartViewport>` envolvendo o `<svg>` com `[attr.viewBox]` dinamico, `tabindex="0"`, `role="img"`, `[attr.aria-label]` dinamico e `(keydown)`; grupos por mes com `<rect class="month-hit">` e faixa de destaque; `<g class="chart-axis">` com gridlines + rotulos; `<line class="chart-zero-line">`; `polyline`/`circle` so para os meses plotados; camada HTML `<div class="chart-tooltip-layer" aria-live="polite">` com o card do informativo e o texto `.sr-only` do anuncio.
- `frontend/src/app/features/dashboard/dashboard.scss` — estilos de `.chart-viewport` (`position: relative`), `.evolution-chart` (troca de `height: 220px` fixo + viewBox 4:1 por altura fixa **casada** com o viewBox medido), `.chart-grid-line`, `.chart-zero-line`, `.chart-axis-label`, `.month-hit` (`fill: transparent; pointer-events: all`), `.month-band.is-active`, `.chart-tooltip*`, foco visivel (`.evolution-chart:focus-visible`), ajustes nos breakpoints 1080px/680px. Somente `var(--token)`, nenhuma cor literal.
- `frontend/src/app/core/formatters.ts` — duas funcoes novas exportadas: `shortMoney(value)` (abreviacao pt-BR do eixo: `R$ 0`, `-R$ 800`, `R$ 1,5 mil`, `R$ 1,2 mi`) e `longMonthName(month)` (nome cheio capitalizado, `Março`) para o informativo e para o anuncio acessivel. `money()` e `monthName()` ficam intactos (o informativo usa `money()`, o eixo X continua com `monthName()`).
- `frontend/src/styles.scss` — utilitario global `.sr-only` (nao existe hoje no projeto) e os tokens do grafico em `:root` (`--chart-grid`, `--chart-zero`, `--chart-band-active`, `--chart-tooltip-bg`, `--chart-tooltip-border`, `--chart-tooltip-w`), nascendo como alias dos tons ja existentes (`--border-th`, `--text-faint`, `--track-bg`, `--surface`, `--border-card`); so se algum alias ficar visualmente errado e que se cria um `oklch()` novo — e ele nasce aqui, nunca no `.scss` da tela.
- `frontend/src/app/features/dashboard/dashboard.spec.ts` — novos `describe` para escala, linha, eixo e informativo (mouse/toque/teclado), mantendo os tres testes atuais de toast. Os criterios citam explicitamente este arquivo, entao os testes do grafico ficam nele (e nao num spec separado).
- `frontend/src/app/core/formatters.spec.ts` — **novo**: casos de `shortMoney` (0, 800, -800, 1500, 1_200_000, 999, 1000) e de `longMonthName` (3 -> `Março`, 5 -> `Maio`).

### Migration (se houver mudanca de schema)
- Nenhuma. Sem mudanca de schema; o grafico continua alimentado pelo `monthlyEvolution` ja existente.

## Decisoes de implementacao

### 1. Escala unica com zero no dominio

```
rawMax = max(0, max sobre os 12 meses de income, expense, balance)
rawMin = min(0, min sobre os 12 meses de balance)
step   = passo "redondo" (1 / 2 / 2,5 / 5 x 10^k) para ~4 marcas, reduzido pela metade enquanto o total de marcas for < 4
domainMax = ceil(rawMax / step) * step
domainMin = floor(rawMin / step) * step
span = (domainMax - domainMin) || 1
scaleY(v) = PLOT_BOTTOM - ((v - domainMin) / span) * (PLOT_BOTTOM - PLOT_TOP)
```

- Barras: `y = scaleY(valor)`, `height = max(0, zeroY - scaleY(valor))`, com `zeroY = scaleY(0)` — base sempre na linha de zero, nunca em `CHART_BOTTOM` fixo.
- Linha/pontos: `cy = scaleY(item.balance)`, usando **o `balance` da API sem recalculo** (criterio L6).
- Como a mesma funcao serve barras e linha, `income: 1000 / expense: 0 / balance: 1000` produz `cy === incomeY` por construcao (L1) e `balance: 600` cai a 60% da altura da barra de 1000 (L2).
- **Leitura explicita do criterio L3**: o dominio e arredondado *para fora* (nunca encolhe abaixo do maior valor nem acima do menor), entao o teste deve assertar o que o proprio criterio pede — que nenhum `y`/`cy`/`y+height` renderizado caia fora de `[PLOT_TOP, PLOT_BOTTOM]` — e nao igualdade exata entre `domainMax` e o maior valor da serie.
- Ano sem lancamentos (`rawMax === 0 && rawMin === 0`): `rawMax` cai para um default de `100` antes do calculo do passo, o que da marcas `R$ 0 / R$ 25 / R$ 50 / R$ 75 / R$ 100`, mantem 4 marcas com o zero e elimina o divisor zero — e o substituto direto das guardas `|| 1` de hoje (que permanecem no `span`). Valores de marca passam por arredondamento (`Math.round(v / step) * step`) para nao vazar `1.0000000000000002` no rotulo.
- `hasNegative = domainMin < 0`. A `.chart-zero-line` e desenhada **sempre** em `zeroY` (mais forte que a gridline) — satisfaz L5 ("sempre que a escala incluir negativos") e mantem a base das barras visivel no caso comum.

### 2. Geometria e responsividade

- Unidades de usuario = px. `chartWidth` e um `signal` iniciado em `DEFAULT_CHART_WIDTH = 840`; um `ResizeObserver` sobre `.chart-viewport` (criado em `ngAfterViewInit` **somente** se `typeof ResizeObserver !== 'undefined'`, desconectado em `ngOnDestroy`) grava `Math.max(320, Math.round(width))`. Fallback obrigatorio: `el.clientWidth || DEFAULT_CHART_WIDTH` — em jsdom `clientWidth` e 0 e `ResizeObserver` nao existe.
- Constantes: `CHART_HEIGHT = 240`, `PLOT_TOP = 16`, `PLOT_BOTTOM = 196`, `MONTH_LABEL_Y = 214`, `AXIS_WIDTH = 64` (faixa do eixo Y a esquerda, rotulos com `text-anchor="end"` em `x = AXIS_WIDTH - 10`), `PLOT_RIGHT_PAD = 12`.
- `plotLeft = AXIS_WIDTH`, `plotRight = chartWidth() - PLOT_RIGHT_PAD`, `groupWidth = (plotRight - plotLeft) / 12`, `barWidth = clamp(6, groupWidth * 0.26, 18)` (deixa de ser a constante 13, para a barra nao sumir em tela larga), `BAR_GAP = 3`.
- CSS: `.evolution-chart { display: block; width: 100%; height: 240px; }` com `viewBox="0 0 {chartWidth} 240"` — como as proporcoes coincidem, `preserveAspectRatio` default deixa de centralizar/sobrar faixa e o desenho cobre o card inteiro (P4/W1). Com o card a 1920px (largura interna ~1386px) a faixa plotada fica em ~94% da largura interna, acima dos 90% exigidos.
- A faixa do eixo (64px) e descontada do numerador conforme o proprio criterio W1 ("ja descontado o espaco do eixo Y"). Em <= 680px, `AXIS_WIDTH` cai para 52 e os rotulos de mes alternam para `font-size` menor, evitando sobreposicao (W2 cobre 1080px; o breakpoint menor e cuidado extra).

### 3. Linha de Saldo interrompida (D2) sem `NaN`

- `lastActiveIndex` = maior indice com `income !== 0 || expense !== 0`; `-1` quando o ano inteiro esta zerado.
- `balancePoints = meses.slice(0, lastActiveIndex + 1).map(...)` — meses vazios **antes** do ultimo ativo continuam na serie (M3), e Set..Dez so com barra ficam sem ponto (M4).
- `linePoints` e montado apenas a partir de `balancePoints`; com `lastActiveIndex === -1` o array fica vazio, `linePoints` fica `''` e o template nao renderiza `polyline` nem `circle` (`@if (chart().balancePoints.length)`), atendendo M5 sem gerar `points="NaN,NaN"`.
- Como `balance` da API e numero, o unico caminho para `NaN` seria o divisor — coberto pelo `|| 1` no `span` e pelo default de dominio do ano vazio.
- Normalizacao defensiva: `monthlyEvolution` e projetado em 12 slots por `month` (1..12), preenchendo com `income/expense/balance = 0` o que faltar. Isso preserva o eixo X completo (M4) e mantem verde o teste atual que responde `monthlyEvolution: []`.

### 4. Informativo do mes (mouse, toque, teclado)

- **Hit area**: por mes, um `<rect class="month-hit" [attr.x]="grupo.left" [attr.width]="groupWidth" [attr.y]="PLOT_TOP" [attr.height]="PLOT_BOTTOM - PLOT_TOP" fill="transparent">` desenhado **depois** das barras/linha, cobrindo toda a faixa de 1/12 (H3). Um `<rect class="month-band">` abaixo das barras recebe a classe `is-active` para o destaque visual do mes ativo/focado (K4).
- **Estado**: `activeMonth = signal<number | null>(null)` + `activeSource`. `mouseenter`/`mousemove` -> `set(index, 'mouse')`; `mouseleave` -> limpa **so** se `activeSource === 'mouse'` (os eventos de compatibilidade do toque disparam `mouseleave` e fechariam o informativo aberto por toque); `pointerdown` -> `set(index, 'touch')` + `stopPropagation()`; `document:pointerdown` (via `@HostListener`) fora do `.chart-viewport` -> fecha (T2).
- **Posicionamento**: o informativo e HTML dentro de `.chart-viewport { position: relative }`, largura fixa `var(--chart-tooltip-w)` (196px), `top: 8px` e `left = min(max(centroDoMes - largura/2, 0), chartWidth - largura)` — clamp que impede estourar a borda do card em qualquer largura, inclusive no modo dispositivo de 680px (T3). Como 1 unidade de viewBox = 1 px, o centro do mes ja esta em px, sem conversao.
- **Conteudo**: `Março` (via `longMonthName`) + tres linhas rotuladas `Receita`/`Despesa`/`Saldo` com `money()` — valor cheio, nunca abreviado (R2). Mes sem movimento mostra `R$ 0,00` nas tres linhas (H3).
- **Teclado**: o unico alvo focavel novo e o proprio `<svg tabindex="0">` (K1 — uma parada de Tab; os `<rect>` nao recebem `tabindex`). `keydown`: `ArrowRight`/`ArrowLeft` movem `focusedMonth` com clamp nas extremidades (sem dar a volta, decisao registrada aqui para o teste), `Home`/`End` vao a Jan/Dez, `Escape` fecha o informativo mantendo o foco no SVG (K3), todos com `preventDefault()` para nao rolar a pagina. `blur` limpa o informativo quando a origem foi teclado.
- **Acessibilidade**: `aria-label` do SVG = texto base acentuado ("Gráfico de evolução anual de receitas, despesas e saldo. Use as setas para navegar entre os meses.") concatenado com o anuncio do mes ativo; a camada do informativo e `aria-live="polite"` e sempre existe no DOM (so o card interno entra/sai), para o `aria-describedby` do SVG nunca apontar para um id inexistente; dentro dela, um `<span class="sr-only">` com o anuncio no formato `Março: Receita R$ 1.500,00, Despesa R$ 400,00, Saldo R$ 1.100,00` (K5). Foco visivel por `:focus-visible` com `outline` em `var(--accent)` — sem `outline: none` sem substituto.
- **Sem HTTP**: nenhum handler do grafico chama service; `httpMock.expectNone(() => true)` depois dos eventos (H5).

### 5. Abreviacao do eixo (D3)

`shortMoney` e implementado **na mao** (divisor + sufixo + `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })` so para o numero, com `R$ ` e o sinal prefixados), e **nao** com `notation: 'compact'` do `Intl`: a forma compacta depende da versao de ICU do runtime e produziria um teste fragil entre Node local e container. Regras: `|v| < 1000` -> inteiro (`R$ 800`, `-R$ 800`); `< 1e6` -> milhares com ate 1 decimal e sufixo ` mil`; acima -> ` mi`. Zero -> `R$ 0`. A abreviacao e usada **so** nos rotulos do eixo (R2).

## Ordem geral

1. `core/formatters.ts` (+ `formatters.spec.ts`) primeiro: `shortMoney`/`longMonthName` sao dependencia do eixo e do informativo e podem ser validados isolados.
2. Depois o nucleo de calculo em `dashboard.ts` (dominio, `scaleY`, marcas, corte da linha, geometria em px) com os testes de escala/linha/eixo — e o que destrava todos os criterios das secoes "Linha de Saldo", "Saldo mensal" e a maior parte de "Deixar claro".
3. So entao o template + SCSS (eixo, gridlines, linha de zero, hit areas, informativo) e, por ultimo, a camada de interacao (mouse -> toque -> teclado/acessibilidade), que depende da geometria ja estavel.
4. Os tokens em `styles.scss` (e o `.sr-only`) entram junto com o primeiro `.scss` que os consome, antes de rodar a varredura de cor literal. `npm test` + `npm run build` fecham; a validacao de largura/toque/foco so acontece na etapa 8, com a stack no ar.

## Superficie de validacao

### Linha de Saldo na escala correta
- Criterio L1 (escala unica, `cy` == `y` da barra) — `Dashboard#'plota o ponto de saldo na mesma escala da barra de receita'` em `dashboard.spec.ts`: flush com um mes `income: 1000, expense: 0, balance: 1000`, ler `circle.balance-point[cy]` e `rect.bar-income[y]`, `expect(Math.abs(cy - y)).toBeLessThanOrEqual(0.5)`.
- Criterio L2 (mes com receita e despesa) — mesmo spec, cenario `1000/400/600`: `cy` entre `barY` e `zeroY` e `zeroY - cy` ≈ `0,6 * (zeroY - barY)` (tolerancia 0,5).
- Criterio L3 (dominio cobre as tres series) — dois casos (saldo maior que a maior barra; saldo negativo) verificando que todo `y`, `y + height` e `cy` do SVG fica dentro de `[16, 196]`.
- Criterio L4 (saldo negativo abaixo do zero) — cenario `100/500/-400`: `cy > line.chart-zero-line[y1]` e `rect.bar-income[y] + height` ≈ `y1`.
- Criterio L5 (linha de zero visivel) — presenca de `line.chart-zero-line` e coincidencia com a base das barras no mesmo teste de L4.
- Criterio L6 (usa o `balance` da API) — resposta com `income: 1000, expense: 200, balance: 700`: `cy` igual a `scaleY(700)` (derivado das coordenadas das barras), diferente de `scaleY(800)`.
- Criterio L7 (sem `NaN` em ano vazio) — 12 meses zerados: percorrer `rect`/`circle`/`line`/`text` do SVG e assertar `Number.isFinite` em todo `x/y/width/height/cx/cy` e no `viewBox`.

### Saldo mensal e meses sem lancamento
- Criterio M1 (saldo do mes, nao acumulado) — Jan `1000` e Fev `500`: `cy(Fev) > cy(Jan)` e `cy(Fev)` == `scaleY(500)`.
- Criterio M2 (linha termina no ultimo mes com lancamento) — dados Jan..Ago: `circle.balance-point` tem 8 elementos e `polyline.balance-line[points].trim().split(/\s+/)` tem 8 pares.
- Criterio M3 (buraco no meio nao corta a serie) — Jan e Mar com dados, Fev zerado: 3 pontos e 3 pares em `points`.
- Criterio M4 (eixo X completo + barras depois do fim da linha) — cenario do print (Set..Dez so com receita): 12 `text.chart-month` com `Jan`..`Dez` e `rect.bar-income` desenhada em Set..Dez sem `circle` correspondente.
- Criterio M5 (ano vazio) — nenhum `circle.balance-point`, nenhum `polyline.balance-line` no DOM, sem erro (reaproveita as asserçoes de L7).

### Deixar claro a que se referem os dados
- Criterio R1 (eixo Y com >= 4 marcas abreviadas) — teste lendo `text.chart-axis-label`: `length >= 4`, inclui `R$ 0`; casos dedicados em `formatters.spec.ts` para `R$ 1,5 mil`, `R$ 1,2 mi`, `-R$ 800`.
- Criterio R2 (abreviacao so no eixo) — um teste com `income: 1500` assertando `R$ 1,5 mil` entre os rotulos do eixo e `R$ 1.500,00` no texto do informativo apos `mouseenter`.
- Criterio R3 (gridline por marca) — `line.chart-grid-line`.length == `text.chart-axis-label`.length, e cada `y1 === y2` dentro da area de plotagem.
- Criterio R4 (titulo acentuado) — comando verificavel: `rg -n "Evolucao" frontend/src` sem saida; + teste lendo o `<h3>` (`Evolução anual`) e o `aria-label` do SVG.
- Criterio R5 (legenda) — teste conferindo os tres `.chart-legend span` (`Receita`, `Despesa`, `Saldo`) e a presenca de `.legend-marker.balance`; confirmacao visual na tela.
- Criterio R6 (eixo X com 12 meses) — coberto pelo teste de M4.

### Informativo do mes — mouse
- Criterio H1 (hover abre o informativo) — `dispatchEvent(new MouseEvent('mouseenter'))` no `rect.month-hit` do mes e leitura de `.chart-tooltip`: contem o nome do mes e as tres linhas rotuladas.
- Criterio H2 (valores em `money()` e saldo da API) — mesmo teste, comparando o texto com `R$ 1.234,56` e com o `balance` enviado.
- Criterio H3 (faixa inteira do mes, inclusive mes vazio) — `mouseenter` num mes zerado exibe `R$ 0,00` tres vezes; conferir `width` do `rect.month-hit` ≈ `groupWidth` e altura de `PLOT_TOP` a `PLOT_BOTTOM`.
- Criterio H4 (`mouseleave` fecha) — apos `mouseleave`, `.chart-tooltip` fora do DOM (a camada `aria-live` permanece, vazia).
- Criterio H5 (sem HTTP) — `httpMock.expectNone(() => true)` ao fim do teste de hover.

### Informativo do mes — toque
- Criterio T1 (toque abre o mesmo informativo) — `dispatchEvent(new PointerEvent('pointerdown'))` na faixa; texto identico ao do cenario de hover (comparacao direta das duas strings no mesmo spec).
- Criterio T2 (troca de mes / fecha ao tocar fora) — `pointerdown` em outro mes troca o conteudo e mantem um unico `.chart-tooltip`; `pointerdown` em `document.body` fecha.
- Criterio T3 (toque na tela) — **validacao na tela**: `http://localhost` -> menu lateral -> Resumo -> DevTools em modo dispositivo com largura <= 680px -> tocar numa faixa de mes do card "Evolução anual" -> o informativo aparece legivel, inteiro dentro do card, sem corte/scroll horizontal; tocar fora fecha.

### Informativo do mes — teclado
- Criterio K1 (uma parada de Tab) — teste conferindo que o `<svg.evolution-chart>` tem `tabindex="0"` e que `.chart-panel [tabindex]:not([tabindex="-1"])` tem exatamente um elemento; + **validacao na tela**: a partir do `<select>` de Mês do topo, Tab foca o grafico (contorno visivel) e o Tab seguinte sai para o proximo elemento da pagina.
- Criterio K2 (setas navegam e abrem o informativo) — `keydown` `ArrowRight`/`ArrowLeft` no SVG: o texto do `.chart-tooltip` acompanha o mes esperado; nas extremidades o indice nao passa de Jan/Dez.
- Criterio K3 (`Escape` fecha e mantem o foco) — apos `Escape`, `.chart-tooltip` some e `document.activeElement` continua sendo o SVG.
- Criterio K4 (mes focado com indicacao visual) — **validacao na tela**: navegar por teclado no Resumo e observar a faixa destacada do mes + o contorno de foco do grafico (o teste automatizado so cobre a classe `is-active` no `rect.month-band`).
- Criterio K5 (anuncio a leitor de tela) — teste lendo, apos `ArrowRight`: `aria-live="polite"` na camada, `.sr-only` com `Março: Receita R$ 1.500,00, Despesa R$ 400,00, Saldo R$ 1.100,00` e o `aria-label` do SVG contendo esse mesmo trecho.
- Criterio K6 (textos em portugues acentuado) — varredura de acentuacao de `knowledge/architecture.md` sobre `frontend/src` sem saida + revisao dos textos novos no teste de K5.

### Aproveitamento da largura do card
- Criterio W1 (>= 90% da largura interna a 1920px) — **validacao na tela**: `http://localhost` em 1920px, sidebar recolhida, Resumo; no DevTools medir `.chart-panel` (largura interna = `clientWidth - 48` de padding) e o `<svg.evolution-chart>`; conferir que a faixa plotada (`svg.clientWidth - 64 - 12`) e >= 90% da largura interna e que nao ha faixa vazia a esquerda alem do padding de 24px.
- Criterio W2 (legivel a 1080px) — **validacao na tela**: reduzir a janela ate `.panels-grid` virar uma coluna e conferir que os 12 rotulos de mes continuam sem sobreposicao e o informativo continua dentro do card.

### Nao-regressao
- Criterio N1 (troca de Ano/Mês recarrega) — teste em `dashboard.spec.ts`: alterar o `<select>` de mes com `dispatchEvent(new Event('change'))` e assertar **uma** requisicao `GET /dashboard/summary` (via `httpMock.expectOne`) e o redesenho do grafico com a serie nova.
- Criterio N2 (nada em `backend/`) — comando ao fim da implementacao: `git diff --name-only` sem nenhuma linha sob `backend/`.
- Criterio N3 (cards e "Detalhamento" intactos) — testes existentes/novos lendo os 4 `.metric-card` e o painel de Detalhamento (incluindo `.empty-state` "Sem dados no período") + conferencia visual na tela do Resumo.
- Criterio N4 (toasts preservados) — os tres testes atuais de `dashboard.spec.ts` (500, `status = 0`, 200 sem toast) continuam passando sem alteracao.
- Criterio N5 (sem dependencia npm nova / recurso externo) — `git diff frontend/package.json` vazio e `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` sem saida.
- Criterio N6 (sem cor literal em componente) — `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` sem saida.
- Criterio N7 (acentuacao) — as duas varreduras de `knowledge/architecture.md` sem saida (a do front cobre `*.spec.ts`).
- Criterio N8 (`npm test` e `npm run build`) — `cd frontend && npm test` e `npm run build` verdes na etapa de build.

## Riscos e pontos de atencao

- **jsdom nao tem `ResizeObserver` e `clientWidth` e sempre 0.** Sem o fallback `DEFAULT_CHART_WIDTH` o `viewBox` sai `0 0 NaN 240` e praticamente todo teste novo quebra. O guard `typeof ResizeObserver !== 'undefined'` e a largura default nao sao detalhe: sao pre-requisito da suite inteira.
- **`Intl` com `notation: 'compact'` varia por ICU** — motivo de `shortMoney` ser implementado a mao. Se alguem "simplificar" para compact, `R$ 1,2 mi` pode virar `R$ 1,2 mi.` ou `R$ 1,2 M` conforme o runtime e o criterio R1 falha so no container.
- **Novo canal de exibicao: os numeros do `monthlyEvolution` passam a ser texto de UI.** Ate agora esses valores so viravam altura de barra; com o informativo e o eixo, tudo que alimenta esse canal aparece escrito. O inventario dos produtores e curto e fechado — `income`, `expense` e `balance` de `MonthlySummaryResponse` (numeros, formatados por `money()`/`shortMoney()`) e o nome do mes vindo de `Intl` pt-BR — e nenhum deles carrega texto tecnico. O unico ponto a conferir e o nome do mes: `monthName()` devolve `"mar."` (minusculo e com ponto) e o mes cheio vem acentuado (`março`, `maio`), entao `longMonthName` precisa capitalizar e preservar o acento, senao o tooltip e o anuncio de leitor de tela exibem texto fora do padrao do projeto (foi assim que a issue #39 deixou vazar `Sem permissão de CREATE em CATEGORIES`, e o defeito so apareceu na verificacao).
- **`mouseleave` disparado por eventos de compatibilidade do toque** fecharia na hora o informativo aberto por `pointerdown` em alguns navegadores — dai o `activeSource`. Vale conferir manualmente no modo dispositivo (criterio T3).
- **App zoneless (Angular 22, sem zone.js).** Toda mutacao vinda de `ResizeObserver` e do `@HostListener('document:pointerdown')` precisa passar por `signal.set(...)`; guardar em campo simples nao redesenha nada e o bug so aparece na tela, nunca no teste.
- **`monthlyEvolution: []`** aparece no teste atual e no `dashboard.service.spec.ts`; sem a normalizacao para 12 slots, o eixo X sumiria nesse cenario e o teste verde hoje passaria a nao provar nada.
- **Varredura de acentuacao cobre `*.spec.ts`**: titulos de teste e fixtures novos com "nao", "periodo", "invalido" sem acento quebram o criterio N7 — escrever ja acentuado.
- **Budget `anyComponentStyle` (8 kB por `.scss` de componente)**: `dashboard.scss` ja tem ~285 linhas e vai crescer com eixo, informativo e foco. Se o warning aparecer no build, a saida e mover o que for generico (`.sr-only`, tokens) para `styles.scss` — nunca criar cor literal na tela para compensar.
- **`knowledge/dashboard.md` (linha 25) descreve o estado antigo** (`viewBox="0 0 840 210"`, escala propria do saldo, guardas `|| 1` nos dois divisores) e ficara desatualizado: a etapa `/pipeline:sync-knowledge` precisa reescrever esse paragrafo com a escala unica, o corte da linha (D2), o eixo abreviado (D3) e o informativo acessivel (D4).
- **Regras de negocio do Resumo nao podem ser tocadas** (`knowledge/dashboard.md`): despesa so `PAID`, receita `status is null or <> CANCELED`, `balance = totalIncome - paidExpense`. O corte da linha em D2 e decisao de **apresentacao** sobre dados ja recebidos — nao pode virar filtro/recalculo de valor no front.
