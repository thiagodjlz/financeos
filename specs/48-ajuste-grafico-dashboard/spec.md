---
issue: 48
url: https://github.com/thiagodjlz/financeos/issues/48
title: "Ajuste de gráfico"
domains: [dashboard]
target: main
stage: validated
branch: feature/issue-48-ajuste-grafico-dashboard
created: 2026-09-19
---

# Ajuste de gráfico

## Historia

Como usuário do Resumo (Dashboard), quero que o gráfico "Evolução anual" desenhe a linha de Saldo na mesma escala das barras, mostre a que valores os dados se referem e exiba os números reais do mês quando eu apontar para ele (mouse, toque ou teclado), para que eu consiga ler a evolução das minhas receitas, despesas e saldo sem precisar adivinhar valores.

## Contexto

A issue #48 traz um print do card **"Evolução anual"** do Resumo e três pedidos:

1. *"Arrume esse gráfico a linha está errada"*;
2. *"Adicione informações para deixar mais claro ao que se refere as informações"*;
3. *"Ao passar o mouse por cima das colunas do gráfico t[r]azer o informativo real dos dados"*.

O print anexado (copiado em `design/grafico-atual.png`, leitura textual em `design/leitura-do-print.md`) é o **estado atual**, não um mockup do desejado — ele documenta o defeito, e não há nenhum alvo visual fornecido pela issue.

**Onde o gráfico mora.** O painel nasceu na issue #35 e é 100% front-end: `frontend/src/app/features/dashboard/dashboard.html` (bloco `<svg class="evolution-chart" viewBox="0 0 840 210">`), alimentado pelo `computed` `chart()` em `dashboard.ts` sobre `summary()?.monthlyEvolution`. **Não há biblioteca de gráfico** — o SVG é desenhado à mão, e o design system (`knowledge/architecture.md`) proíbe dependência npm de UI e recurso externo em runtime, então o conserto continua sendo SVG próprio (inclusive a navegação por teclado, que precisa ser implementada no próprio componente).

**De onde vem o bug da linha (causa confirmada no código).** Em `dashboard.ts`, as barras e a linha usam **duas escalas diferentes**:

- barras: `(item.income / maxValue) * chartHeight`, com `maxValue = max(income, expense)` de todos os meses e base fixa em `CHART_BOTTOM` (ou seja, zero na base);
- linha: `CHART_BOTTOM - ((item.balance - minBalance) / balanceRange) * chartHeight`, com `balanceRange = maxBalance - minBalance` — uma **normalização própria** em que o menor saldo do ano sempre encosta na base e o maior saldo do ano sempre encosta no topo, independentemente do valor das barras.

É exatamente isso que o print mostra: de Set a Dez existe só barra de Receita (sem Despesa), então `balance = income` e a linha deveria coincidir com o topo da barra verde — mas está reta no topo do card, bem acima dela; e Fev, com saldo negativo, aparece colado na base em vez de abaixo de uma linha de zero (que hoje não existe).

**O valor do saldo vem do back-end e não deve ser recalculado no front.** `MonthlySummaryResponse.of` (backend) já devolve `balance = income - expense` por mês, com as regras de `knowledge/dashboard.md`: receita conta com `status is null or status <> 'CANCELED'`, despesa conta **só com `status = 'PAID'`** (pendente não entra), e `monthlyEvolution` sempre retorna os 12 meses do ano zero-preenchidos. Esta issue é **de apresentação**: nenhum endpoint, DTO, SQL ou regra de negócio muda, e o front continua consumindo o campo `balance` como veio da API (a regra de negócio permanece imposta no back-end, conforme `CLAUDE.md`).

**Mês sem lançamento não é mês com saldo zero.** Como a API zero-preenche os 12 meses, plotar todos eles faz o ano inteiro parecer medido. Por decisão do usuário (D2), a linha de Saldo termina no último mês com movimento — meses sem lançamento ficam sem ponto e sem segmento de linha, embora continuem existindo no eixo X e possam ter barras se tiverem valor.

**Falta de referência numérica.** O SVG atual não tem eixo Y, gridlines nem qualquer número: só barras, rótulos de mês e legenda. Daí o segundo pedido da issue. O eixo passa a ter marcas com valores **abreviados** (`R$ 1,5 mil`), e o valor cheio (`R$ 1.500,00`) aparece no informativo do mês (D3).

**Largura mal aproveitada.** O `viewBox="0 0 840 210"` (proporção 4:1) combinado com `.evolution-chart { width: 100%; height: 220px; }` e o `preserveAspectRatio` padrão (`xMidYMid meet`) faz o desenho ser escalado pela altura (≈880px de largura renderizada) e **centralizado**, sobrando faixas vazias dos dois lados quando o card é mais largo que isso — é o vazio à esquerda visível no print.

**Acentuação.** O título está como `Evolucao anual` no `<h3>` e no `aria-label` do SVG, violando a regra de acentuação da issue #39 (`knowledge/architecture.md`).

## Criterios de aceite

### Linha de Saldo na escala correta

- [x] A linha de Saldo e as barras usam **uma única escala vertical**: num teste de componente (`dashboard.spec.ts`), ao responder `monthlyEvolution` com um mês de `income: 1000, expense: 0, balance: 1000`, o atributo `cy` do ponto de saldo desse mês é igual ao atributo `y` da barra de receita do mesmo mês (tolerância de 0,5 unidade de usuário do SVG).
- [x] Mês com receita e despesa é plotado coerentemente: com `income: 1000, expense: 400, balance: 600`, o `cy` do ponto de saldo fica **entre** o topo da barra de receita e a base do gráfico, e corresponde a 60% da altura da barra de receita (tolerância de 0,5).
- [x] A escala vertical cobre todas as séries e **termina numa marca redonda** (D5): o limite superior do domínio é **maior ou igual** ao maior valor entre receita, despesa e saldo de todos os 12 meses **e** é múltiplo do passo do eixo Y — ou seja, o topo da área de plotagem é sempre uma marca rotulada e a barra mais alta não encosta no teto; o limite inferior é `min(0, menor saldo do ano)` arredondado para baixo pelo mesmo passo. Verificável por teste com um ano contendo saldo maior que a maior barra e outro com saldo negativo, checando que nenhum `y`/`cy` renderizado fica fora da área de plotagem.
- [x] Saldo negativo é desenhado **abaixo da linha do zero**: com um mês de `income: 100, expense: 500, balance: -400`, o `cy` do ponto desse mês é maior (mais baixo no SVG) que a coordenada `y` da linha de zero, e a base das barras coincide com essa mesma linha de zero.
- [x] Existe uma linha de zero visível no gráfico (elemento com classe própria, ex.: `.chart-zero-line`) sempre que a escala incluir valores negativos, e a base das barras é essa linha.
- [x] O valor de saldo plotado é o campo `balance` recebido da API, sem recálculo no front-end: num teste, uma resposta com `income: 1000, expense: 200` e `balance: 700` (valor propositalmente incoerente) é plotada usando 700.
- [x] Nenhum atributo do SVG sai como `NaN` em ano sem lançamentos: com os 12 meses zerados, todos os `y`, `height`, `cy` e os pares de `points` da linha são numéricos finitos (guarda equivalente à atual `|| 1` preservada).

### Saldo mensal e meses sem lancamento

- [x] A série plotada é o **saldo do mês** (`balance` do próprio mês, como a API devolve), não um acumulado: num teste com `Jan { income: 1000, expense: 0, balance: 1000 }` e `Fev { income: 500, expense: 0, balance: 500 }`, o ponto de Fev fica **abaixo** do ponto de Jan (500 < 1000), e não em 1500.
- [x] A linha de Saldo **termina no último mês com lançamento** (mês com `income !== 0` ou `expense !== 0`): num teste com dados de Jan a Ago e Set..Dez zerados, existem exatamente 8 pontos de saldo (`circle.balance-point`) e a `points` da `polyline` tem 8 pares — nenhum ponto ou segmento em Set..Dez.
- [x] Mês sem lançamento **antes** do último mês com movimento continua na linha (o corte é só no fim da série, não um buraco no meio): com dados em Jan, nada em Fev e dados em Mar, existem 3 pontos e a linha liga os três.
- [x] Os meses sem lançamento continuam aparecendo no eixo X com o rótulo do mês, e mês com valor continua desenhando suas barras normalmente mesmo depois do fim da linha (num ano em que o último mês com lançamento é seguido por meses zerados, esses meses seguintes mantêm o rótulo no eixo X e não recebem ponto de saldo).
- [x] Ano inteiro sem lançamentos não renderiza nenhum ponto nem `polyline` de saldo, e o gráfico não quebra (sem `NaN`, sem erro no console).

### Deixar claro a que se referem os dados

- [x] O gráfico exibe um **eixo Y** com no mínimo 4 marcas, incluindo obrigatoriamente a marca `0`, cada uma com rótulo monetário **abreviado** em padrão pt-BR (vírgula decimal): `R$ 1,5 mil` para 1500, `R$ 1,2 mi` para 1 200 000, `R$ 0` para zero e `-R$ 500` para valores negativos abaixo de mil (ver D6) — verificável **no DOM do SVG** por teste de componente em `dashboard.spec.ts`, com uma ou mais respostas que produzam cada faixa como marca do eixo.
- [x] A abreviação é aplicada **apenas ao eixo Y**; o informativo do mês (tooltip) mostra o valor cheio formatado por `money()` (`R$ 1.500,00`) — um mesmo teste com `income: 1500` confirma `R$ 1,5 mil` no rótulo do eixo e `R$ 1.500,00` no informativo.
- [x] Cada marca do eixo Y tem uma **gridline horizontal** correspondente atravessando a área de plotagem.
- [x] O título do painel é `Evolução anual` (acentuado) e o `aria-label` do SVG também está acentuado: `rg -n "Evolucao" frontend/src` não retorna nenhuma linha.
- [x] A legenda continua nomeando as três séries em português — `Receita`, `Despesa`, `Saldo` — e o Saldo continua identificado como linha (marcador distinto das barras).
- [x] O eixo X continua com os 12 meses abreviados e capitalizados (`Jan`..`Dez`), um rótulo por mês.

### Informativo do mes — mouse

- [x] Ao passar o mouse sobre a faixa vertical de um mês do gráfico, aparece um informativo com o nome do mês e as três linhas rotuladas `Receita`, `Despesa` e `Saldo`, com os valores daquele mês.
- [x] Os valores do informativo são formatados em Real pt-BR pelo helper `money()` de `frontend/src/app/core/formatters.ts` (ex.: `R$ 1.234,56`), e o valor de Saldo exibido é exatamente o `balance` da API daquele mês — verificável por teste de componente disparando `mouseenter`/`mousemove` na faixa do mês e lendo o texto do informativo.
- [x] A área sensível cobre **toda a faixa do mês** (largura do grupo de 1/12 do gráfico, do topo à base), e não apenas os retângulos das barras: o informativo aparece também num mês sem receita e sem despesa, exibindo `R$ 0,00` nas três linhas.
- [x] O informativo some ao tirar o mouse da faixa do mês (`mouseleave`): o elemento deixa o DOM ou fica oculto, verificável por teste.
- [x] Abrir o informativo não dispara nenhuma requisição HTTP: no teste de componente, após os eventos de mouse, `httpMock.expectNone(() => true)` passa.

### Informativo do mes — toque

- [x] Um toque sobre a faixa de um mês abre o mesmo informativo daquele mês (mesmos rótulos e mesmos valores do modo mouse) — verificável por teste de componente disparando os eventos de ponteiro/toque na faixa e comparando o texto com o do cenário de hover.
- [x] Tocar em outro mês troca o informativo para o mês tocado (não abre dois ao mesmo tempo), e tocar fora da área do gráfico fecha o informativo — verificável por teste.
- [ ] Validação manual em `http://localhost` com o DevTools em modo dispositivo (largura ≤ 680px): tocar numa faixa de mês exibe o informativo legível dentro do card, sem sair da tela na horizontal.

### Informativo do mes — teclado

- [x] O gráfico entra na ordem de tabulação com **uma única parada de Tab** (elemento focável com `tabindex="0"`): partindo do controle de Mês do topo, Tab leva o foco ao gráfico e o próximo Tab sai dele para o elemento seguinte da página — verificável por teste de componente checando o `tabindex` e os elementos focáveis, e manualmente na tela.
- [x] Com o gráfico focado, `ArrowRight`/`ArrowLeft` movem o mês focado um a um (e param nas extremidades ou dão a volta, de forma consistente), e o informativo do mês focado é exibido automaticamente com os valores daquele mês — verificável por teste disparando `keydown` e lendo o texto do informativo.
- [x] `Escape` com o informativo aberto o fecha e mantém o foco no gráfico — verificável por teste.
- [ ] O mês focado tem indicação visual própria (destaque da faixa ou contorno de foco visível, sem `outline: none` sem substituto) — verificável na tela navegando por teclado.
- [x] O informativo é anunciável por leitor de tela: o elemento que recebe foco tem `role` e `aria-label`/`aria-describedby` em português apontando para o texto do mês focado (ex.: `Março: Receita R$ 1.500,00, Despesa R$ 400,00, Saldo R$ 1.100,00`), e o contêiner do informativo é uma live region (`aria-live="polite"`) — verificável por teste de componente lendo os atributos e o texto anunciado após `ArrowRight`.
- [x] Todos os textos do informativo e dos rótulos acessíveis estão em português acentuado.

### Aproveitamento da largura do card

- [ ] Com a janela em 1920px de largura e a sidebar recolhida, a área de plotagem do gráfico (do rótulo `Jan` ao rótulo `Dez`, já descontado o espaço do eixo Y) ocupa **no mínimo 90% da largura interna do card** "Evolução anual" — verificável em `http://localhost` medindo o `<svg>`/card no DevTools; não há faixa vazia à esquerda maior que o padding do card (24px).
- [ ] O gráfico continua legível e sem sobreposição de rótulos de mês na largura de 1080px (ponto em que `.panels-grid` passa a uma coluna só) — verificável visualmente reduzindo a janela.

### Nao-regressao (comportamento ja entregue)

- [x] Trocar Ano ou Mês nos controles do topo continua recarregando o resumo e redesenhando o gráfico com a série nova, via `(change)`, sem botão "Atualizar" — teste existente/novo confirma uma única chamada a `GET /dashboard/summary` por troca.
- [x] Nenhum arquivo de `backend/src` é alterado por esta issue: `git diff --name-only` ao fim da implementação não lista nada sob `backend/`; nenhum endpoint, DTO ou migration novo.
- [x] Os 4 cards de métricas (Receitas, Despesas, Pendentes, Saldo) e o painel "Detalhamento" (coluna de 360px à direita, seções Receitas/Despesas com contagem de categorias e `.empty-state` "Sem dados no período") continuam iguais.
- [x] Toasts do Resumo preservados: 500 e `status = 0` continuam gerando toast de **Falha** com as mensagens de `core/http-error.ts`, e resposta 200 não gera toast (testes atuais de `dashboard.spec.ts` continuam passando).
- [x] Nenhuma dependência npm nova em `frontend/package.json` (sem biblioteca de gráfico) e nenhum recurso externo em runtime: `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` continua sem saída.
- [x] Nenhuma cor literal nova fora de `frontend/src/styles.scss`: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` continua vazia — tom novo (gridline, fundo do informativo, destaque do mês focado) nasce como custom property em `:root`.
- [x] Todo texto novo exibido na tela está em português acentuado; a varredura de acentuação de `knowledge/architecture.md` sobre `frontend/src` continua sem saída.
- [x] `cd frontend && npm test` e `npm run build` passam.

## Fora de escopo

- Qualquer mudança nas regras de cálculo do dashboard (o que conta como receita/despesa/pendente, `balance = totalIncome - paidExpense`, quebra por categoria) — esta issue é de apresentação.
- Novos endpoints, campos de DTO ou migrations; o gráfico continua alimentado pelo `monthlyEvolution` já existente (inclusive por causa da decisão D1: saldo mensal, não acumulado).
- Exportar/baixar o gráfico, filtrar séries clicando na legenda, zoom, comparação entre anos.
- Redesenho dos 4 cards de métricas, do painel "Detalhamento" ou de qualquer outra tela.
- Adoção de biblioteca de gráficos (proibida pelo design system: sem dependência npm de UI).
- Revisão de acessibilidade das demais telas do sistema — o teclado/leitor de tela desta issue cobre só o gráfico "Evolução anual".

## Referencia visual da issue

O anexo da issue é um **print do estado atual**, e não um mockup do resultado desejado. Portanto:

- Nenhum valor visual do resultado pode ser derivado dele — cores, raios, tipografia e espaçamentos do gráfico novo saem dos tokens já existentes em `frontend/src/styles.scss` (`--income`, `--expense`, `--balance`, `--track-bg`, `--border-th`, `--text-soft`, `--surface`, `--shadow-card`, `--radius-*`, `--fs-*`).
- Não há tabela de "tokens extraídos do mockup" a preencher; qualquer tom novo necessário (gridline, fundo do informativo, destaque do mês focado) nasce como custom property em `:root`, conforme o design system.

### Problemas do print -> como a spec resolve

| # | Observado no print (estado atual) | Resolução |
|---|---|---|
| P1 | Linha de Saldo normalizada em escala própria: reta no topo em Set..Dez (meses só com receita) e colada na base em Fev (saldo negativo) | Escala única compartilhada com as barras + linha de zero; critérios da seção "Linha de Saldo na escala correta" |
| P2 | Sem eixo Y, sem gridlines, sem nenhum número ou unidade | Eixo Y com ≥4 marcas abreviadas em R$ pt-BR (incluindo o 0) + gridlines |
| P3 | Sem informativo: apontar para o gráfico não informa nada | Informativo por faixa de mês com Receita/Despesa/Saldo em R$ cheio, acessível por mouse, toque e teclado |
| P4 | Plot centralizado ocupando ~metade da largura, faixa vazia à esquerda | Plot ocupa ≥90% da largura interna do card |
| P5 | Título "Evolucao anual" sem acento (no `<h3>` e no `aria-label`) | "Evolução anual" acentuado; varredura `rg -n "Evolucao" frontend/src` vazia |
| P6 | Linha de saldo atravessa Set..Dez, meses sem lançamento, sugerindo medição onde não houve movimento | Linha termina no último mês com lançamento (D2) |
| P7 | O print **não desenha** nenhum estado de erro/vazio do Resumo | Omissão do print não autoriza remover nada: toasts, `.empty-state` e o painel "Detalhamento" permanecem (critérios de não-regressão) |

## Regras existentes que restringem o redesign

De `knowledge/dashboard.md` e `knowledge/architecture.md` — tudo isto precisa sobreviver (ver critérios de não-regressão):

- Recarga automática do resumo ao trocar Ano/Mês via `(change)` nativo, sem botão "Atualizar" (e sem `(ngModelChange)` no campo Ano).
- Falha de carga vira **toast de Falha**; período sem dados continua sendo `.empty-state` inline, nunca toast.
- `monthlyEvolution` sempre traz os 12 meses zero-preenchidos — não existe caso de lista vazia; o caso degenerado é ano sem lançamentos (divisor zero), já protegido no `chart()`. É o front que decide onde a linha termina (D2), sem mudar o contrato.
- O painel "Evolução anual" nunca tocou o back-end (issue #35) e continua assim.
- Design system: só `styles.scss` tem cor literal; utilitários globais (`.panel`, `.panel-heading`, `.empty-state`) antes de CSS de componente; sem dependência de UI/ícones; sem recurso externo em runtime; SVG inline para ícones.
- Controle estilizado nunca substitui controle real (issue #35): o alvo focável do gráfico deve continuar respondendo a teclado nativamente, sem sequestrar Tab da página.
- Toda regra de negócio permanece no back-end (`CLAUDE.md`): o front apenas exibe `income`/`expense`/`balance` como vieram da API.

## Decisoes

- **D1 (2026-09-19) — Saldo mensal, não acumulado.** A linha continua plotando o `balance` do próprio mês, como `MonthlySummaryResponse.of` já devolve. Nenhum campo novo no back-end e nenhum endpoint muda.
- **D2 (2026-09-19) — Meses sem lançamento não entram na linha.** A série de Saldo é interrompida após o último mês com lançamento, para não sugerir "saldo zero" onde na verdade é "ainda não aconteceu". As barras de Receita/Despesa desses meses continuam sendo desenhadas normalmente quando houver valor, e o rótulo do mês permanece no eixo X.
- **D3 (2026-09-19) — Rótulos do eixo Y abreviados.** O eixo usa a forma curta em pt-BR (`R$ 1,5 mil`, `R$ 1,2 mi`, com vírgula decimal); o valor cheio (`R$ 1.500,00`) aparece no informativo do mês.
- **D4 (2026-09-19) — Informativo acessível por mouse, toque e teclado.** Além do hover, toque abre o mesmo informativo, e os meses são navegáveis por teclado (Tab para entrar no gráfico, setas para mover entre meses, Esc para fechar), com o mês focado anunciado a leitores de tela. Como o gráfico é SVG desenhado à mão, tudo isso é implementado no próprio componente, sem biblioteca.
- **D5 (2026-09-19) — Topo do eixo arredondado para cima até o passo redondo.** O limite superior do domínio não é o maior valor da série, e sim o múltiplo do passo do eixo imediatamente acima dele (`ceil(rawMax / step) * step`); o limite inferior segue a mesma regra para baixo (`floor(rawMin / step) * step`). Consequência aceita: a barra mais alta nunca encosta no teto da área de plotagem. Motivo: rótulo redondo e legível é exatamente o que a issue pede ("adicione informações para deixar mais claro ao que se refere as informações") — casar o topo com o maior valor produziria marcas quebradas do tipo `R$ 1.847`, ilegíveis como referência. O critério 3 da seção "Linha de Saldo na escala correta" foi reescrito para exigir as duas coisas (`domainMax >= maior valor` **e** múltiplo do passo).
- **D6 (2026-09-19) — Exemplo de marca negativa do eixo: `-R$ 500`, e não `-R$ 800`.** O exemplo original só era alcançável com uma fixture em que `balance !== income - expense` — estado que o back-end nunca produz, porque `MonthlySummaryResponse.of` deriva o saldo do próprio mês. Com dados coerentes, um saldo de `-800` exige uma despesa de pelo menos `800`, que sobe o limite superior do domínio e leva o passo do eixo a um valor do qual `800` não é múltiplo, de modo que a marca `-R$ 800` não existe em escala nenhuma. O critério passa a usar `-R$ 500` (fixture coerente: um mês `income: 400, expense: 0, balance: 400` e outro `income: 0, expense: 1000, balance: -1000`, que gera as marcas `-R$ 1 mil`, `-R$ 500`, `R$ 0`, `R$ 500`, `R$ 1 mil`), sem perder a cobertura da faixa negativa do `shortMoney` — continua sendo um negativo abaixo de mil, exibido sem abreviação.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/48
- Print anexado (estado atual): `specs/48-ajuste-grafico-dashboard/design/grafico-atual.png` e `specs/48-ajuste-grafico-dashboard/design/leitura-do-print.md`
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/dashboard.md`
- Código investigado: `frontend/src/app/features/dashboard/dashboard.ts` (`chart()`), `dashboard.html`, `dashboard.scss`, `dashboard.spec.ts`, `frontend/src/app/core/formatters.ts`, `backend/src/main/java/br/com/financeos/dashboard/` (`MonthlySummaryResponse`, `DashboardRepository.monthlyEvolution`)
