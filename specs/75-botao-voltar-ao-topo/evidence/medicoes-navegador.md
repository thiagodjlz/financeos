# Medicoes no navegador (issue 75)

Build servido em `http://localhost`, Chrome 153 headless via CDP, respostas de `/api/*` substituidas so na sessao do navegador (nenhuma escrita, nenhuma chamada nao-GET). Valores lidos com `getComputedStyle`/`getBoundingClientRect`/`document.activeElement`.

| Medicao | Resultado |
|---|---|
| scrollY 0 (Lançamentos, 1440) | sem `.visible`, `visibility: hidden`, `opacity: 0`, `aria-hidden="true"`, `tabIndex -1`; Tab a partir do ultimo controle da tela **nao** chega ao botao |
| scrollY 300 / 301 / 300 | oculto / visivel (`visibility: visible`, sem `aria-hidden`, `tabIndex 0`) / oculto |
| Clique real do mouse a scrollY 3000 | `scrollTo({"top":0,"behavior":"smooth"})` 1 vez; scrollY a cada 80 ms: 2958, 2546, 1512, 786, 432, 255, 122, 55, 12, 0 (rolagem suave nao interrompida); no fim oculto e `activeElement = SECTION.workspace` |
| Enter / Espaco com o botao focado | `scrollTo` smooth, termina em 0, oculto, foco na `.workspace` |
| `prefers-reduced-motion: reduce` (Emulation) | visivel: `transition-duration 0s`, `transition-property none`, `transform none`, sem `animation`; clique -> `scrollTo({"top":0,"behavior":"auto"})`, scrollY 0 em 60 ms; oculto: `transition-duration 0s`. Sem a emulacao: `opacity 0.18s, transform 0.18s, visibility 0s linear 0.18s` |
| Posicao a 1440 / 1080 / 768 / 390 | `position: fixed`; distancia a direita/baixo 39/24, 39/24, 39/24 (24 px + barra de rolagem classica de 15 px), 16/16 a 390 (barra sobreposta); regra efetiva `right: calc(24px + env(safe-area-inset-right)); bottom: calc(24px + env(safe-area-inset-bottom))` e, em `@media (max-width: 680px)`, `calc(16px + env(...))` |
| Tamanho | 40x40 a 1440/1080/768; 44x44 a 390 |
| Layout visivel x oculto (Lançamentos e Categorias, 1440 e 390) | `scrollHeight`, `scrollWidth`, `left`/`width`/topo absoluto/altura da `.workspace` identicos nos 4 pares |
| Cores | normal `oklch(0.56 0.16 262)`; `:hover` (forcado) `oklch(0.46 0.16 262)`; `:active` (forcado) `oklch(0.46 0.16 262)` + `matrix(0.94, 0, 0, 0.94, 0, 0)`; icone `rgb(255, 255, 255)` (`--surface`); `:focus-visible` apos Tab `solid 2px oklch(0.56 0.16 262)`, offset 3px; raio 999px; sombra `oklch(0.3 0.02 80 / 0.06) 0px 8px 24px 0px` |
| Regras de CSS efetivas | `:hover` so dentro de `@media (hover: hover)`; `transition: none` dentro de `@media (prefers-reduced-motion: reduce)` |
| `z-index` | botao 40; `.mobile-topbar` 60; gaveta 80; toasts 999 |
| Gaveta aberta (390, scrollY 2000) | `elementFromPoint` no centro do botao = `DIV.drawer-scrim`; clique real ali: 0 chamadas a `scrollTo` (fechou a gaveta) |
| Modal "Deseja sair sem salvar?" (1440, scrollY 1500) | `elementFromPoint` no centro = `DIV.modal-backdrop` (z 200); clique real: 0 chamadas a `scrollTo`, scrollY continua 1500 |
| `/no-access` (1440 e 390) | rolagem maxima 0; apos `scrollTo(9999)` + evento `scroll`, continua oculto |
| Listeners apos navegar pelo menu por todas as 7 telas | `DOMDebugger.getEventListeners(window)`: exatamente 1 listener `scroll`, `passive: true`; 1 `.back-to-top` no DOM |
