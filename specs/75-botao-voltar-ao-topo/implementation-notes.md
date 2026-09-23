# Notas de implementacao

Branch: `feature/issue-75-botao-voltar-ao-topo` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 7 de 8 concluidas (ver `plan.md`) — T7 parcial, ver desvios.

## Arquivos alterados

- `frontend/src/app/core/back-to-top/back-to-top.ts` — novo: componente `BackToTop` (`BACK_TO_TOP_THRESHOLD = 300`, signal `visible`, listener `scroll` passivo unico em `ngOnInit`/`ngOnDestroy`, `scrollTo` smooth/auto conforme `prefers-reduced-motion`, foco em `focusTarget` com `preventScroll`).
- `frontend/src/app/core/back-to-top/back-to-top.html` — novo: `<button type="button">` com `aria-label`/`title` "Voltar ao topo", SVG de seta, `aria-hidden`/`tabindex=-1` quando oculto.
- `frontend/src/app/core/back-to-top/back-to-top.scss` — novo: fixo inferior direito com safe area, `z-index: 40`, 40px (44px/`--touch-target` ate 480px), tokens, `visibility`+`opacity` no padrao da gaveta, hover em `@media (hover: hover)`, `:focus-visible`, `:active`, sem transicao sob reduced motion.
- `frontend/src/app/core/back-to-top/back-to-top.spec.ts` — novo: 8 testes (CA01-CA06, CA13, CA15).
- `frontend/src/app/layout/main-layout/main-layout.html` — `<app-back-to-top [focusTarget]="workspace" />` apos a `<section class="workspace">`.
- `frontend/src/app/layout/main-layout/main-layout.ts` — `BackToTop` nos `imports`.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — caso: navegar entre rotas mantem 1 botao e 1 listener de `scroll`.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — item em `IMPROVEMENT` do 1.0.2.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — paragrafo sobre "Voltar ao topo" em `navegacao()` ("Como navegar").
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — teste do item em IMPROVEMENT do 1.0.2.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java` — assercao via `GET /release-notes`.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste do paragrafo em "Como navegar".

## Decisoes

- Visibilidade reavaliada tambem no `ngOnInit` (nao so no evento `scroll`): se o shell montar com a pagina ja rolada, o botao aparece sem esperar o primeiro evento. Coberto por teste.
- Oculto = `opacity: 0` + `visibility: hidden` + `aria-hidden="true"` + `tabindex=-1` (fica no DOM para a transicao de saida funcionar); transicao de `visibility` com `0s linear 0.18s` ao ocultar e `0s` ao exibir (licao da #54).
- Cores: fundo `--accent`, icone `--surface` (mesma dupla do `.primary-button`), hover/`:active` em `--accent-hover`; `:active` tambem aplica `scale(0.94)` (anulado sob reduced motion). `:focus-visible` com `outline-offset: 3px` para o anel nao colar no circulo.
- Offset 24px no desktop e 16px no bloco de 680px, sempre somando `env(safe-area-inset-*)`.
- Comentario unico no codigo: o porque do `preventScroll` (sem ele o foco rola ate o alvo e interrompe a rolagem suave).
- Textos: Novidades usa a sugestao do plano; Central: "Nas telas longas, ao rolar a página aparece no canto inferior direito o botão Voltar ao topo, que leva de volta ao início da tela." (<600 caracteres).

## Verificacoes feitas

- `npm test` completo: 31 arquivos, 307 testes verdes. `npm run build`: sem warning.
- Backend escopado (`ReleaseNotesContentTest`, `ReleaseNotesResourceTest`, `DocumentationContentTest`, `DocumentationResourceTest`): verdes.
- Varredura de cor em `*.scss`: vazia; sem `white`/`black`. `app-back-to-top` em 1 template (`main-layout.html`). `features/`, `app.html`, `app.config.ts` sem diff; `scrollPositionRestoration: 'top'` mantido.
- Acentuacao: frontend 2 linhas, backend 6 linhas (= baseline).

## Desvios em relacao ao plano

- T7 fica **desmarcada**: tudo foi feito exceto `./mvnw test` da suite completa, que por regra desta etapa e o portao de `/pipeline:quality-check` (aqui so rodei as classes tocadas e vizinhas).
- Fora isso, nenhum desvio.
