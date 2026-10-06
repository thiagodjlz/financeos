# Medicoes de console — roteiro de validacao manual da issue 109

Cada bloco e colado no Console do DevTools (F12 > Console), na tela e largura indicadas no roteiro de
`verification-report.md`. Todos so **leem** a pagina: nenhum faz requisicao nem grava nada.
Largura: F12 > Ctrl+Shift+M (modo dispositivo) > "Dimensions: Responsive" > digite a largura (390 ou 1440).
Antes da primeira medicao, Ctrl+Shift+R (recarregar sem cache).

## Bloco A — Resumo (`http://localhost/`)

```js
(() => { const q = s => document.querySelector(s), cs = s => getComputedStyle(q(s)),
  top = s => Math.round(q(s).getBoundingClientRect().top),
  a = q('.dashboard-main').getBoundingClientRect(), b = q('.dashboard-side').getBoundingClientRect();
  return {
    semRolagem: document.documentElement.scrollWidth <= innerWidth,
    duasColunas: a.width > 0 && b.width > 0 && Math.round(a.top) === Math.round(b.top) && b.left > a.right,
    ordemTopo: ['.balance-card', '.pending-card', '.breakdown-panel', '.chart-panel'].map(top),
    saldoFonte: cs('.balance-value').fontSize,
    barra: cs('.balance-bar').backgroundColor,
    trilho: cs('.balance-track').backgroundColor,
    pendentesFundo: cs('.pending-card').backgroundColor,
    pendentesAltura: Math.round(q('.pending-card').getBoundingClientRect().height),
    verTexto: q('.pending-link') ? q('.pending-link').innerText.trim() : 'sem atalho (perfil sem ver Lancamentos)',
    alternanciaAltura: Math.round(q('.breakdown-toggle button').getBoundingClientRect().height),
    alternanciaAbaixoDoTitulo: q('.breakdown-toggle').getBoundingClientRect().top > q('.breakdown-panel h2').getBoundingClientRect().bottom,
    percentualCor: q('.category-share') ? cs('.category-share').color : 'sem categoria no mes',
    graficoAltura: Math.round(q('.evolution-chart').getBoundingClientRect().height),
    faixaDoMes: getComputedStyle(q('rect.month-band.is-period')).fill,
    blocoDoMes: cs('.month-block').display,
    dicaVisivel: [...document.querySelectorAll('.month-block-hint')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.innerText.trim()),
    novoLancamento: q('.new-transaction') ? cs('.new-transaction').display : 'sem permissao de incluir',
  }; })()
```

| Campo | 390 | 1440 |
|---|---|---|
| semRolagem | `true` | `true` |
| duasColunas | `false` | `true` |
| ordemTopo | 4 numeros crescentes (Saldo, Pendentes, Por categoria, Evolucao) | — |
| saldoFonte | `"34px"` | `"40px"` |
| barra / trilho | `"rgb(159, 176, 247)"` / `"rgba(255, 255, 255, 0.16)"` | igual |
| pendentesFundo | `"rgb(252, 241, 222)"` | igual |
| pendentesAltura | 72 ou mais | 72 ou mais |
| verTexto | `"Ver"` | `"Ver pendentes"` |
| alternanciaAltura | 40 | 32 |
| alternanciaAbaixoDoTitulo | `true` | `false` |
| percentualCor | `"rgb(107, 103, 96)"` | igual |
| graficoAltura | 200 | 260 |
| faixaDoMes | `"rgb(239, 238, 234)"` | igual |
| blocoDoMes | `"grid"` | `"grid"` (DEC-13, novo em 2026-10-06; antes era `"none"`) |
| dicaVisivel | `["Toque em um mês do gráfico para ver os valores."]` | `["Clique em um mês do gráfico para ver os valores."]` |
| novoLancamento | `"none"` | qualquer valor diferente de `"none"` |

Bundle em cache aparece como: `.balance-card` inexistente (erro `Cannot read properties of null`),
quatro cartoes `.metric-card` na tela, ou (bundle da 1a rodada) `blocoDoMes "none"` e `dicaVisivel []` a 1440.

## Bloco B — Lancamentos (`http://localhost/transactions`), painel fechado

```js
(() => { const q = s => document.querySelector(s), d = s => q(s) ? getComputedStyle(q(s)).display : 'ausente',
  all = s => [...document.querySelectorAll(s)].map(e => getComputedStyle(e).display !== 'none'),
  h = s => q(s) ? Math.round(q(s).getBoundingClientRect().height) : 'ausente';
  return {
    semRolagem: document.documentElement.scrollWidth <= innerWidth,
    passoAltura: h('.filter-lead'), passoSetaLargura: Math.round(q('.filter-lead .icon-button').getBoundingClientRect().width),
    passoFundo: getComputedStyle(q('.filter-lead')).backgroundColor, passoBorda: getComputedStyle(q('.filter-lead')).borderColor,
    passoAcimaDaBusca: q('.filter-lead').getBoundingClientRect().bottom <= q('.search-field').getBoundingClientRect().top,
    tipoAltura: h('.type-toggle button'), tipoTrilho: getComputedStyle(q('.type-toggle')).backgroundColor,
    totalCabecalho: d('.header-total'), totalFaixa: d('.active-filters-summary'),
    selectsDoDesktopVisiveis: all('.filter-select'), camposDoPainelVisiveis: all('.filter-fields .only-mobile'),
    botaoFiltros: d('.filter-toggle'), filtrosAtivos: d('.active-filters'), mostrando: d('.pagination-summary'),
    linhaAltura: h('tbody tr.transaction-row'),
  }; })()
```

| Campo | 390 | 1440 |
|---|---|---|
| semRolagem | `true` | `true` |
| passoAltura / passoSetaLargura | 48 / 44 | cerca de 40 / 34 |
| passoFundo / passoBorda | `"rgb(255, 255, 255)"` / `"rgb(232, 230, 225)"` | `"rgb(237, 241, 253)"` / `"rgb(201, 212, 247)"` |
| passoAcimaDaBusca | `true` | `false` |
| tipoAltura / tipoTrilho | 40 / `"rgb(239, 238, 234)"` | 34 / `"rgb(239, 238, 234)"` |
| totalCabecalho / totalFaixa | diferente de `"none"` / `"none"` | `"none"` / diferente de `"none"` |
| selectsDoDesktopVisiveis | todos `false` | todos `true` |
| camposDoPainelVisiveis | todos `true` | todos `false` |
| botaoFiltros | diferente de `"none"` | `"none"` |
| filtrosAtivos | diferente de `"none"` (ha o rotulo "Data: ...") | diferente de `"none"` |
| mostrando | `"none"` | diferente de `"none"` |
| linhaAltura | 68 ou mais | — |

## Bloco C — painel Filtros aberto (390)

```js
(() => { const q = s => document.querySelector(s), b = q('.filter-sheet-actions .primary-button');
  return { semRolagem: document.documentElement.scrollWidth <= innerWidth,
    titulo: getComputedStyle(q('.filter-sheet h2')).fontSize,
    aplicarAltura: Math.round(b.getBoundingClientRect().height), aplicarRaio: getComputedStyle(b).borderRadius,
    statusAltura: Math.round(q('.status-toggle button').getBoundingClientRect().height) }; })()
```

Esperado: `true`, `"18px"`, 52, `"14px"`, 40.

## Bloco D — Detalhe aberto (390 e 1440)

```js
(() => { const q = s => document.querySelector(s), r = q('.detail-panel').getBoundingClientRect();
  return { semRolagem: document.documentElement.scrollWidth <= innerWidth,
    valorFonte: getComputedStyle(q('.detail-amount')).fontSize,
    linhaAltura: Math.round(q('.detail-list > div').getBoundingClientRect().height),
    botoes: [...document.querySelectorAll('.detail-actions button')].map(e => Math.round(e.getBoundingClientRect().height)),
    noRodape: Math.round(r.bottom) === innerHeight, centralizado: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2,
    foco: document.activeElement.getAttribute('aria-label') }; })()
```

Esperado: `semRolagem true`, `"28px"`, 48 ou mais, `[52, 48]` (com as duas permissoes), `foco "Fechar"`;
a 390 `noRodape true`; a 1440 `centralizado true` e `noRodape false`.

## Bloco E — confirmacao aberta (390; serve para Lancamentos, Categorias, Usuarios e Perfis)

```js
(() => { const bs = [...document.querySelectorAll('.modal-actions button')];
  return { botoes: bs.map(e => ({ texto: e.innerText.trim(), altura: Math.round(e.getBoundingClientRect().height),
      largura: Math.round(e.getBoundingClientRect().width), topo: Math.round(e.getBoundingClientRect().top) })),
    sombra: getComputedStyle(document.querySelector('.modal-card')).boxShadow }; })()
```

Esperado: dois botoes de altura 48 e mesma largura, o de confirmar ("Excluir lançamento", "Excluir categoria",
"Desativar usuário" ou "Excluir perfil") com `topo` menor (em cima) que "Cancelar"; `sombra "rgba(20, 24, 40, 0.18) 0px 20px 50px 0px"`. Em cache: `rgba(20, 24, 40, 0.3)` ou botoes
lado a lado (mesmo `topo`).

## Bloco F — cadastro (`http://localhost/transactions/new`, 390)

```js
(() => { const q = s => document.querySelector(s), h = s => Math.round(q(s).getBoundingClientRect().height),
  nome = e => { if (e.matches('fieldset')) return e.querySelector('legend').innerText.trim();
    const l = e.matches('label') ? e : e.querySelector('label');
    return [...l.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()).textContent.trim(); },
  campos = [...document.querySelectorAll('form .form-card-body > *')].map(nome);
  return { semRolagem: document.documentElement.scrollWidth <= innerWidth, ordem: campos,
    cabecalho: h('.form-header'), tipo: h('.type-choice .choice'), tipoRaio: getComputedStyle(q('.type-choice .choice')).borderRadius,
    valor: h('.amount-field'), valorBorda: getComputedStyle(q('.amount-field')).borderTopWidth,
    valorRaio: getComputedStyle(q('.amount-field')).borderRadius, valorFonte: getComputedStyle(q('.amount-field input')).fontSize,
    descricao: h('input[name="description"]'), hoje: h('.date-shortcut') }; })()
```

Esperado: `true`; ordem `["Tipo", "Valor", "Descrição", "Categoria", "Data"]` (o Status fica no mesmo bloco da Data, logo depois dela);
cabecalho 56 ou mais, tipo 44, `"11px"`, valor 72, `"2px"`, `"14px"`, `"34px"`, descricao 48, hoje 44.

## Bloco G — toast (qualquer largura, logo depois do aviso aparecer)

```js
getComputedStyle(document.querySelector('.toast-card')).boxShadow
```

Esperado: `"rgba(27, 26, 24, 0.12) 0px 12px 32px 0px"` (uma sombra so). Em cache aparece uma segunda sombra
`rgba(27, 26, 24, 0.06) 0px 2px 6px 0px`.

## Bloco H — Detalhe de Categorias, Usuarios e Perfis (novo em 2026-10-06; 390 e 1440)

Abra `http://localhost/categories`, `http://localhost/users` ou `http://localhost/profiles`, toque/clique numa
linha (fora dos botoes) e cole:

```js
(() => { const q = s => document.querySelector(s), p = q('.detail-panel'), r = p.getBoundingClientRect(),
  vis = e => getComputedStyle(e).display !== 'none', dot = q('.detail-list .detail-color');
  return { semRolagem: document.documentElement.scrollWidth <= innerWidth,
    titulo: q('.detail-title h2').innerText.trim(),
    linhas: [...document.querySelectorAll('.detail-list > div')].map(d => [d.querySelector('dt').innerText.trim(),
      d.querySelector('dd').innerText.replace(/\s+/g, ' ').trim(), Math.round(d.getBoundingClientRect().height)]),
    bolinha: dot ? { cor: getComputedStyle(dot).backgroundColor, largura: Math.round(dot.getBoundingClientRect().width),
      rotulo: dot.getAttribute('aria-label') } : 'sem bolinha',
    botoes: [...document.querySelectorAll('.detail-actions button')].map(e => [e.innerText.trim(), Math.round(e.getBoundingClientRect().height)]),
    noRodape: Math.round(r.bottom) === innerHeight, centralizado: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2,
    cabeNaTela: r.top >= 0, sombra: getComputedStyle(p).boxShadow,
    botoesDaLinhaVisiveis: [...document.querySelectorAll('td.row-actions')].some(vis),
    foco: document.activeElement.getAttribute('aria-label') }; })()
```

| Campo | 390 | 1440 |
|---|---|---|
| semRolagem / cabeNaTela | `true` / `true` | `true` / `true` |
| linhas (Categorias) | `Tipo`, `Cor`, `Situação`; a `Cor` com texto `""` (so a bolinha) ou `"Sem cor"`; altura 48 ou mais | igual |
| linhas (Usuarios) | `E-mail`, `Perfil` (`"-"` sem perfil), `Status`; 48 ou mais | igual |
| linhas (Perfis) | 7 telas na ordem do menu (Resumo ... Novidades por versão), cada uma `"Ver, Incluir, Alterar, Excluir"` (ou parte) ou `"Sem acesso"` | igual |
| bolinha (so Categorias com cor) | `cor` = a cor da categoria em `rgb(...)`, `largura` 10, `rotulo "Cor da categoria"` | igual |
| botoes | `[["Editar categoria", 52], ["Excluir categoria", 48]]`; Usuarios ativo `Editar usuário`/`Desativar usuário` (inativo: so Editar); Perfis `Editar perfil`/`Excluir perfil` | igual |
| noRodape / centralizado | `true` / `false` | `false` / `true` |
| sombra | `"rgba(20, 24, 40, 0.25) 0px -12px 40px 0px"` | `"rgba(20, 24, 40, 0.18) 0px 20px 50px 0px"` |
| botoesDaLinhaVisiveis | `false` (no celular editar/excluir ficam so no Detalhe) | `true` |
| foco | `"Fechar"` | `"Fechar"` |

Bundle da 1a rodada aparece como: `.detail-panel` inexistente (erro `Cannot read properties of null`) ao tocar na
linha, a `Cor` com o codigo (`"#123456"`) ao lado da bolinha, ou "Desativar usuário"/"Excluir perfil" agindo sem
abrir a confirmacao.

## Bloco I — bloco do mes no desktop (novo em 2026-10-06; Resumo a 1440)

Clique num mes do grafico **diferente** do mes do periodo e cole:

```js
(() => { const q = s => document.querySelector(s), b = q('.month-block'), vis = e => getComputedStyle(e).display !== 'none';
  return { semRolagem: document.documentElement.scrollWidth <= innerWidth, blocoVisivel: !!b && vis(b),
    titulo: q('.month-block-title').innerText.trim(),
    valores: [...document.querySelectorAll('.month-block-values span')].map(e => e.innerText.replace(/\s+/g, ' ').trim()),
    dica: [...document.querySelectorAll('.month-block-hint')].filter(vis).map(e => e.innerText.trim()),
    fundo: getComputedStyle(b).backgroundColor, raio: getComputedStyle(b).borderRadius,
    abaixoDoGrafico: b.getBoundingClientRect().top >= q('.evolution-chart').getBoundingClientRect().bottom,
    noPainelEvolucao: q('.chart-panel').contains(b) }; })()
```

Esperado: `semRolagem true`, `blocoVisivel true`, `titulo` = o mes clicado (ex.: `"Março"`), `valores`
`["Receita R$ …", "Despesa R$ …", "Saldo R$ …"]` iguais aos do informativo flutuante daquele mes,
`dica ["Clique em um mês do gráfico para ver os valores."]`, `fundo "rgb(250, 249, 247)"`, `raio "12px"`,
`abaixoDoGrafico true`, `noPainelEvolucao true`. Bundle da 1a rodada: `blocoVisivel false`.
