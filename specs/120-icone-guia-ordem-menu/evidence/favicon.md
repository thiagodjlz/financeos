# Evidencia — favicon (criterios 1 a 4)

Rodada atual: ajuste pos-validacao de 2026-10-31 (moeda com "F"). A rodada anterior (carteira) esta descrita no fim, so como historico.

## Arquivos

| Arquivo | sha256 anteriores | sha256 atual (working tree) |
|---|---|---|
| `frontend/public/favicon.svg` | "F": blob `84df37f0620c27a5...`; carteira: `74a8374548ca7024...` | `2b18eb462ec94248fbd1953c2929f691012e3bf49b963f4c0bd8f3feb3423e7c` (CRLF, como o checkout desta maquina; conteudo LF: `80cfcacb5ec0f171...`) |
| `frontend/public/favicon.ico` | "F": `c2140972d271a12d...`; carteira: `810561d736c68439...` | `aa9dd4300579ad7655b5c4e91b88c515df0272f11d2f1016a4eb836d8795a2d5` (5696 bytes) |

Varreduras: o path do "F" antigo (`M11.5 9.5h11v3.3H15v2.8h5.5v3.2H15v5.7h-3.5z`) e o da carteira (`M9.5 9.5L21 5...`) nao aparecem em `frontend/` (`rg -c` sem saida). Unica URL no SVG: `http://www.w3.org/2000/svg` (o `xmlns`); sem `<text>`, `<image>` ou `href`.

## Desenho

Moeda com a letra "F", em `#ffffff` sobre o `rect` 34x34 `rx=10` `#3b5bdb`, num unico `path` com `fill-rule="evenodd"` (quatro contornos aninhados, centro em 17,17):

- aro: anel branco entre r 14.875 e r 12.75;
- sulco do aro: anel vazado (azul) entre r 12.75 e r 10.625;
- face: disco branco de r 10.625;
- "F": poligono `M12.75 10.625h8.5v2.125h-6.375v2.125h4.25V17h-4.25v6.375H12.75z` — furo na face (azul).

Todas as medidas sao multiplos de 2.125 = 34/16: aro, sulco e as hastes do "F" caem em pixel inteiro nos quadros 16 (1 px), 32 (2 px) e 48 (3 px), para o "F" sair nitido na guia. Testei antes um "F" de haste 3.5 (fora da grade) e uma moeda so com anel branco: a 16 px o primeiro borrava e o segundo lia como "©".

O `d` e identico em `favicon.svg`, `main-layout.html`, `login.html` e nas constantes de `main-layout.spec.ts` e `login.spec.ts` (`grep -c` do `d` = 1 em cada).

## Contraste (criterio 3)

Duas cores no SVG: `#ffffff` (aro e face da moeda) e `#3b5bdb` (fundo, sulco do aro e o "F", que sao furos). Cada par — moeda sobre o fundo, sulco sobre a moeda, "F" sobre a moeda — e branco x `#3b5bdb`: 5.67:1 (WCAG, luminancias 1.0 e 0.1353). No `.mark` os furos mostram `background: var(--accent)` (= `#3b5bdb`) e o branco vem de `currentColor` (`--on-accent`), mesmo par.

## ICO (criterio 2)

Gerado por `genD.py F` no scratchpad (fora do repo): mesmas formas desenhadas a 64x (mascaras em XOR = evenodd), reduzidas com LANCZOS para 48/32/16.

```
ICONDIR reserved=0 type=1 count=3 tamanho 5696
 entrada 0: 16x16 bpp=32 bytes=751 offset=54
 entrada 1: 32x32 bpp=32 bytes=1818 offset=805
 entrada 2: 48x48 bpp=32 bytes=3073 offset=2623
```

Quadro 16x16 extraido do `.ico`: `favicon-16.png` e `favicon-16-ampliado.png` (8x, sem suavizacao) — moeda com o "F" legivel.

Mesmo desenho: `favicon.svg` renderizado pelo Chrome headless a 256 px (`favicon-svg-chrome-256.png`) comparado ao render do script na mesma escala: diferenca media 0.76/255, nenhum pixel com diferenca > 64.

## index.html (criterio 4)

`<link rel="icon" href="favicon.ico?v=2" sizes="16x16 32x32 48x48">` e `<link rel="icon" type="image/svg+xml" href="favicon.svg?v=2">`: o `?v=2` muda a URL e o navegador deixa de usar o icone guardado em cache. O `GET http://localhost/favicon.*?v=2` com sha256 fica para as etapas 6/7 (o nginx responde 200 com o `index.html` para arquivo inexistente).

Os `verify-*.png` desta pasta sao da verificacao anterior (carteira) e serao refeitos na etapa 7.

## Historico — rodada da carteira (substituida)

Carteira com nota saindo dela (triangulo + corpo arredondado + fecho vazado), mesmo esquema de `path` unico `evenodd`. Recusada pelo usuario na validacao manual: preferiu uma moeda e sentiu falta do "F".
