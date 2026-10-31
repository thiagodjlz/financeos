# Evidencia da verificacao (etapa 7, rodada pos-validacao) — medicoes na stack local

Rodada de 2026-10-31 08:33, depois do ajuste "moeda com F" e do `?v=2`. Substitui a rodada da carteira.

## Build servido

- `curl http://localhost/` cita `main-XGEWVGYF.js`, o mesmo script carregado pelo Chrome headless (`document.scripts`). Os `<link rel="icon">` servidos sao `href="favicon.ico?v=2" sizes="16x16 32x32 48x48"` e `type="image/svg+xml" href="favicon.svg?v=2"`; no DOM, `link.href` resolve para `http://localhost/favicon.ico?v=2` e `http://localhost/favicon.svg?v=2`.
- Bundle servido (31 arquivos, `main` + chunks): o `d` da moeda (`M2.125 17a14.875...`) aparece em `chunk-Bq_8ih5m.js` (login, `width/height` 44) e `chunk-C7Io-4Vs.js` (menu, `width/height` 34). O path do "F" antigo (`M11.5 9.5h11v3.3...`) e o da carteira (`M9.5 9.5L21 5...`) nao aparecem em nenhum arquivo; nenhum tem `Ã`/`Â`. `ENTRY_ROUTES` em `main-XGEWVGYF.js`: DASHBOARD, TRANSACTIONS, CATEGORIES, TRANSACTION_REPORTS, USERS, PROFILES, AUDIT, DOCUMENTATION, RELEASE_NOTES. `PROFILE_SCREENS` em `chunk-D9cDjuM4.js`: Resumo, Lançamentos, Categorias, Relatórios - Lançamentos, Usuários.
- Jar do container (`/deployments/app/backend-1.0.3-02.jar`, copiado e lido por `zipfile`, bytes UTF-8): o item "Ícone da guia: ... uma moeda com a letra F." 1 ocorrencia; "carteira" 0; "(Cadastros, Relatórios, Configurações e Sobre)" 1; "(Relatórios, Cadastros" 0; a frase da tela de entrada e a da matriz de Perfis na nova ordem, 1 cada; `Ã` 0.

## Favicons

| Recurso | Status | Content-Type | sha256 servido = repo |
|---|---|---|---|
| `/favicon.svg?v=2` | 200 | image/svg+xml | `2b18eb462ec94248...3423e7c` = sim |
| `/favicon.ico?v=2` | 200 | image/x-icon | `aa9dd4300579ad76...8795a2d5` = sim |

`favicon.svg`: elementos `svg`, `rect`, `path` (1 cada); cores `#3b5bdb` e `#ffffff`; unica URL o `xmlns`; path do "F" antigo 0 ocorrencias. O mesmo `d` aparece 1 vez em `favicon.svg`, `main-layout.html`, `login.html`, `main-layout.spec.ts` e `login.spec.ts`.

ICO lido por script: `reserved=0 type=1 count=3`, entradas 16x16 (751 B), 32x32 (1818 B), 48x48 (3073 B), 32 bpp, PNG. Quadro 16 extraido (`verify-ico-16-extraido-12x.png`), mapa de pixels (W branco, B azul, + borda suavizada, . transparente):

```
..BBBBBBBBBBBB..
.BBBB+WWWW+BBBB.
BBB+W+BBBB+W+BBB
BB+WBB+WW+BBW+BB
BBWB+WWWWWW+BWBB
B++BWWBBBBWWB++B
BWB+WWBWWWWW+BWB
BWBWWWBBBWWWWBWB
BWBWWWBWWWWWWBWB
BWB+WWBWWWWW+BWB
B++BWWBWWWWWB++B
BBWB+WWWWWW+BWBB
BB+WBB+WW+BBW+BB
BBB+W+BBBB+W+BBB
.BBBB+WWWW+BBBB.
..BBBBBBBBBBBB..
```

O "F" (haste na coluna 6, barra de cima na linha 5, barra do meio na linha 7) sai em pixels azuis inteiros, cercado de branco. Contraste WCAG `#ffffff` x `#3b5bdb` = 5.67:1 (luminancia 0.1353), unico par do desenho.

`verify-favicon-servido.png`: `favicon.svg?v=2` desenhado pelo Chrome a 16, 32 e 128 px e `favicon.ico?v=2` a 16 px, os dois buscados de `http://localhost`.

## Chrome headless (CDP)

Todas as chamadas `*/api/*` foram respondidas dentro da sessao do navegador (`Fetch.fulfillRequest`), com token falso no `localStorage`; nada chegou ao backend e nao houve `/api/auth/login`. Interceptadas: `GET /api/auth/me` (superAdmin), `POST /api/audit/screen-access`, `GET /api/categories?page=1&size=10&active=true`.

| Medida | 1440 | 1024 | 768 | 390 | 320 |
|---|---|---|---|---|---|
| Login `.mark` (WxH, raio) | 44x44, 12px | — | 44x44 | 44x44 | 44x44 |
| Menu `.mark` (WxH, raio) | 34x34, 10px | 34x34 | 34x34 | (menu lateral oculto) | (oculto) |
| Titulos de secao do menu | Cadastros, Relatórios, Configurações, Sobre | idem | idem | — | — |
| Painel Mais (titulos + itens) | — | — | — | Cadastros, Categorias, Relatórios, Lançamentos, Configurações, Usuários, Perfis, Auditoria, Sobre, ... | idem, `scrollWidth` 320 |

Login e menu, em todas as larguras: `textContent` vazio, `aria-hidden="true"`, fundo `rgb(59, 91, 219)`, `path` com `fill` `rgb(255, 255, 255)` e `fill-rule` evenodd, `d` identico ao do favicon, SVG do mesmo tamanho do `.mark`, `elementFromPoint` no centro cai no `.mark`.

Menu recolhido (1440): `.app-shell.menu-collapsed`, menu com 76px, `.mark` 34x34 visivel (`visibility: visible`, `opacity: 1`, dentro da tela). O botao do relatorio tem `title` e `aria-label` "Relatórios - Lançamentos".

Capturas: `verify-login-1440.png`, `verify-menu-1440.png`, `verify-menu-1440-recolhido.png`, `verify-mais-390.png`, `verify-marca-menu-zoom.png` e `verify-marca-login-zoom.png` (ampliadas 6x), `verify-favicon-servido.png`.

## Varreduras (criterio 14)

As quatro varreduras de `context.md` (acentuacao no front, acentuacao no back, recurso externo, cor literal em `.scss`) sairam vazias pelo Grep (ripgrep). Controle positivo: `Cadastros` em `main-layout.html` = 2 ocorrencias.
