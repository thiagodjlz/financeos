# Plano de implementacao

## Abordagem

Um componente standalone novo, `core/back-to-top` (`app-back-to-top`), montado **uma unica vez** em `layout/main-layout/main-layout.html` como irmao da `<section class="workspace">` — o shell persiste entre as rotas filhas, entao o listener e criado uma vez, e `/login` (rota irma do shell) fica sem o botao, como a spec decidiu. O componente registra um unico listener `scroll` `passive` em `window` (removido no destroy), guarda `visible` num signal (`window.scrollY > BACK_TO_TOP_THRESHOLD`, constante de 300), chama `window.scrollTo({ top: 0, behavior })` no clique (`'smooth'`, ou `'auto'` quando `matchMedia('(prefers-reduced-motion: reduce)')` casa — com guarda porque jsdom nao tem `matchMedia`) e foca o elemento recebido por `input()` (`[focusTarget]="workspace"`, a mesma `<section>` do `onNavigate()`) com `focus({ preventScroll: true })`. No backend, so um item em "Melhorias" do bloco 1.0.2 de Novidades.

## Arquivos a alterar

### Frontend
- `frontend/src/app/core/back-to-top/back-to-top.ts` — novo: `BACK_TO_TOP_THRESHOLD = 300`, signal `visible`, listener unico em `ngOnInit`/`ngOnDestroy` (ou `DestroyRef`), `scrollToTop()`, `input<HTMLElement | null>` `focusTarget`.
- `frontend/src/app/core/back-to-top/back-to-top.html` — novo: `<button type="button" class="back-to-top" aria-label="Voltar ao topo" title="Voltar ao topo" [class.visible]="visible()" [attr.aria-hidden]="visible() ? null : 'true'" [attr.tabindex]="visible() ? null : -1">` com SVG de seta para cima (20px, padrao do projeto).
- `frontend/src/app/core/back-to-top/back-to-top.scss` — novo: `position: fixed`, `right`/`bottom` = `calc(24px + env(safe-area-inset-right|bottom))` (16px no bloco de 680px), `z-index: 40`, 40x40 no desktop e `var(--touch-target)` ate 480px, `--accent`/`--surface`/`--shadow-card`/`--radius-pill`; oculto = `opacity: 0; visibility: hidden` com transicao no padrao da gaveta; `:hover` em `@media (hover: hover)`; `:focus-visible` e `:active` explicitos; `@media (prefers-reduced-motion: reduce) { transition: none; }`.
- `frontend/src/app/core/back-to-top/back-to-top.spec.ts` — novo.
- `frontend/src/app/layout/main-layout/main-layout.html` — `<app-back-to-top [focusTarget]="workspace" />` logo apos a `<section class="workspace">`, dentro do `<main>`.
- `frontend/src/app/layout/main-layout/main-layout.ts` — `BackToTop` em `imports`.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — caso novo de navegacao x listener.

### Backend
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — item novo em `Kind.IMPROVEMENT` de `versao_1_0_2()`, sugestao: `"Botão \"Voltar ao topo\" nas telas longas: aparece ao rolar a página e leva de volta ao início."`
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — teste do item em IMPROVEMENT do 1.0.2.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java` — assercao via `GET /release-notes`.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — paragrafo novo em `navegacao()` ("Como navegar"), apos o paragrafo da gaveta; sugestao: `"Nas telas longas, ao rolar a página aparece no canto inferior direito o botão Voltar ao topo, que leva de volta ao início da tela."` (CA19).
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste do paragrafo na secao "Como navegar" da introducao.

### Migration
- Nenhuma.

## Tarefas

- [x] **T1** — Criar o componente `BackToTop` (`.ts` + `.html`): constante de limite, signal `visible` avaliado no init e a cada `scroll` (listener unico, `{ passive: true }`, removido no destroy), `scrollToTop()` com `behavior` conforme `prefers-reduced-motion` (guardado para ausencia de `matchMedia`), foco em `focusTarget` com `preventScroll`, `<button type="button">` com `aria-label`/`title` "Voltar ao topo", SVG de seta, `aria-hidden`/`tabindex=-1` quando oculto.
  - Arquivos: `frontend/src/app/core/back-to-top/back-to-top.ts`, `back-to-top.html`
  - Criterios: 1, 2, 3, 4, 5, 6, 7, 13, 15
- [x] **T2** — Escrever `back-to-top.scss`: posicao fixa inferior direita com safe area, `z-index: 40`, tamanhos (40px / `--touch-target` ate 480px), tokens de cor/raio/sombra, oculto via `visibility`+`opacity` no padrao da gaveta, hover em `@media (hover: hover)`, `:focus-visible`/`:active`, sem transicao sob `prefers-reduced-motion`.
  - Arquivos: `frontend/src/app/core/back-to-top/back-to-top.scss`
  - Criterios: 1, 4, 9, 10, 11, 12, 13, 14
- [x] **T3** — Montar o componente uma vez no shell: import em `MainLayout` e `<app-back-to-top [focusTarget]="workspace" />` em `main-layout.html` (sem tocar `app.html`, `app.config.ts` nem `features/`).
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`, `main-layout.html`
  - Criterios: 6, 7, 8, 11, 17
- [x] **T4** — Testes do componente (`back-to-top.spec.ts`): `scrollY` 0 -> sem classe `visible`, `aria-hidden`, `tabindex=-1`; 300 oculto e 301 visivel; clique chama `scrollTo({ top: 0, behavior: 'smooth' })` (`vi.spyOn(window, 'scrollTo').mockImplementation`); com `matchMedia` simulado `reduce` -> `behavior: 'auto'`; `scroll` com `scrollY` 0 apos clique volta a ocultar; `document.activeElement` = alvo de foco (host de teste com `<section tabindex="-1">`); `aria-label`/`title`/`type`; exatamente 1 `addEventListener('scroll', ..., { passive: true })` e o `removeEventListener` do mesmo handler no destroy. `scrollY` via `Object.defineProperty(window, 'scrollY', { configurable: true, value })`, restaurado no `afterEach`.
  - Arquivos: `frontend/src/app/core/back-to-top/back-to-top.spec.ts`
  - Criterios: 1, 2, 3, 4, 5, 6, 13, 15
- [x] **T5** — Em `main-layout.spec.ts`, caso que navega entre duas rotas (`router.navigateByUrl`) e confere que `addEventListener('scroll', ...)` foi chamado uma unica vez e que o botao existe uma vez no shell.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 8, 15
- [x] **T6** — Acrescentar o item em "Melhorias" do bloco 1.0.2 e cobri-lo em `ReleaseNotesContentTest` (item presente em `Kind.IMPROVEMENT` contendo "Voltar ao topo") e `ReleaseNotesResourceTest` (`versions[0].categories.find { it.kind == 'IMPROVEMENT' }.items` com `hasItem(containsString("Voltar ao topo"))`).
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`, `ReleaseNotesResourceTest.java`
  - Criterios: 16, 18
- [x] **T8** — Acrescentar em `OverviewContent.navegacao()` um `DocumentationBlock.paragraph(...)` sobre o botao "Voltar ao topo" (linguagem de usuario, <= 600 caracteres, sem "lancamento"/"periodo" sem acento) e, em `DocumentationContentTest`, um teste que localiza a secao "Como navegar" em `CONTENT.introduction()` e confere um bloco com "Voltar ao topo". Executar antes de T7.
  - Arquivos: `OverviewContent.java`, `DocumentationContentTest.java`
  - Criterios: 18, 19
- [ ] **T7** — Conferencia final: `npm test`, `npm run build` (sem warning novo de budget), `./mvnw test`, varredura de cor (`rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` vazia; sem `white`/`black`), `rg "app-back-to-top" frontend/src/app --glob "*.html"` = 1 linha, `git diff --stat -- frontend/src/app/features frontend/src/app/app.html frontend/src/app/app.config.ts` vazio e varreduras de acentuacao (baseline 2 front / 6 back).
  - Arquivos: — (verificacao)
  - Criterios: 8, 12, 17, 18

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | oculto e fora do Tab com scrollY 0 | T1, T2, T4 |
| 2 | limite 300 em constante unica | T1, T4 |
| 3 | clique/Enter/Espaco -> scrollTo smooth | T1, T4 |
| 4 | reduced motion: instantaneo e sem transicao | T1, T2, T4 |
| 5 | volta a ocultar ao chegar a 0 | T1, T4 |
| 6 | foco na `.workspace` apos o clique | T1, T3, T4 |
| 7 | tela sem rolagem nunca exibe | T1, T3 |
| 8 | instancia unica, nenhum `features/` alterado | T3, T5, T7 |
| 9 | fixo inferior direito com safe area | T2 |
| 10 | nao altera layout | T2 |
| 11 | tabela de sobreposicao por rota | T2, T3 (evidencia na etapa 7) |
| 12 | sem cor literal, tokens, SVG, hover/focus/active | T2, T7 |
| 13 | button, aria-label/title, Tab, 44px ate 480px | T1, T2, T4 |
| 14 | z-index < 70 | T2 |
| 15 | listener unico passive, removido no destroy | T1, T4, T5 |
| 16 | item em Melhorias do 1.0.2 | T6 |
| 17 | nao-regressao + suites e build | T3, T7 |
| 18 | varreduras de acentuacao sem ocorrencia nova | T6, T8, T7 |
| 19 | paragrafo em "Como navegar" da Central | T8 |

## Superficie de validacao

- CA01, CA02, CA05 — `back-to-top.spec.ts`: classe `visible`, `aria-hidden` e `tabindex` com `scrollY` 0 / 300 / 301 / volta a 0 + evento `scroll`.
- CA03, CA04 — `back-to-top.spec.ts`: espia em `window.scrollTo`; `matchMedia` simulado para `reduce`.
- CA06 — `back-to-top.spec.ts`: `document.activeElement` = `<section>` alvo.
- CA13 — `back-to-top.spec.ts`: `type="button"`, `aria-label` e `title` "Voltar ao topo", sem `tabindex=-1` quando visivel.
- CA15 — `back-to-top.spec.ts` (contagem add/remove) e `main-layout.spec.ts` (navegar nao cria listener).
- CA08 — `rg "app-back-to-top" frontend/src/app --glob "*.html"` = 1 linha (`main-layout.html`); `git status` sem arquivo de `features/`.
- CA12 — varredura de cor vazia; leitura do `.scss`.
- CA16 — `ReleaseNotesContentTest`/`ReleaseNotesResourceTest`; `GET /api/release-notes` (se houver credencial) com o item em `IMPROVEMENT` do `1.0.2`.
- CA19 — `DocumentationContentTest` (paragrafo em "Como navegar", limite de 600 caracteres e sem identificador tecnico pelos testes ja existentes); na tela, Sobre > Documentação > "Como utilizar o sistema" > "Como navegar" mostra o paragrafo.
- CA17, CA18 — suites, build e varreduras (T7).

## Validacao manual (etapa 7)

- CA03 — Enter e Espaco com o botao focado por `Tab` rolam ao topo (nativo do `<button>`; jsdom nao sintetiza).
- CA04 — DevTools > Rendering > `prefers-reduced-motion: reduce`: salto instantaneo e botao aparece/some sem fade.
- CA05 — em `http://localhost`, rolar Lancamentos/Documentacao, clicar: rolagem suave ate 0 e botao some sozinho (foco com `preventScroll` nao interrompe a rolagem suave).
- CA07 — `/no-access` (e tela curta) nunca mostra o botao.
- CA09, CA10 — 1440, 1080, 768, 390px: canto inferior direito; `document.documentElement.scrollHeight` e `getBoundingClientRect()` da `.workspace` iguais com o botao visivel e oculto (2 telas, 1440 e 390).
- CA11 — Resumo, Lancamentos, Categorias, Usuarios, Perfis, Documentacao, Novidades, a 1440 e 390px, rolado ate o fim: tabela em `verification.md` com os retangulos do botao x controles; conflito e **reportado**, nao corrigido.
- CA12, CA13 — hover so com ponteiro, anel de `:focus-visible` visivel, `:active` perceptivel; a 390px (ate 480px) caixa de 44x44 em DevTools > Computed.
- CA14 — gaveta mobile aberta (scrim 70) e modal "Deseja sair sem salvar?" (200) cobrem o botao e ele nao recebe clique.
- CA17 — toasts, gaveta, `.mobile-topbar` e modais com o mesmo comportamento.

## Riscos e pontos de atencao

- **Principal**: `focus()` na `.workspace` sem `preventScroll` faz o navegador rolar o elemento para a vista e pode **cancelar a rolagem suave** logo apos iniciada (sintoma so na tela, jsdom nao mostra). Usar `focus({ preventScroll: true })` (`knowledge/frontend-ui.md`, `onNavigate()`).
- `matchMedia` no TS: a regra do shell ("quem decide o modo e o CSS", `knowledge/frontend-ui.md`) vale para layout; aqui e preferencia de movimento no momento do clique, sem alternativa em CSS para o `behavior` do `scrollTo`. Guardar `typeof window.matchMedia === 'function'` senao a suite quebra em jsdom (`knowledge/testing.md`).
- `window.scrollTo` nao e implementado em jsdom (loga erro): todo teste que clica precisa do spy com `mockImplementation`; `scrollY` sobrescrito tem de ser restaurado para nao vazar para `main-layout.spec.ts`/`app.config.spec.ts`.
- Oculto por `visibility: hidden` + `tabindex=-1`: sem a transicao `visibility 0s linear <dur>` no estado oculto o fade de saida some; sem `0s` no visivel o botao pode receber foco ainda invisivel (licao da gaveta, #54).
- `body.drawer-open { overflow: hidden }` pode emitir `scroll`/zerar a rolagem no mobile; o botao fica sob o scrim (z 40 < 70) de qualquer forma.
- Titulos de teste em portugues sem acento (`nao`, `possivel`) acrescentam ocorrencia na varredura do front (CA18).

## Lacunas

- CA11 nao tem entrega de codigo: a evidencia (tabela em `verification.md`) e produzida na etapa 7; T2/T3 so posicionam o botao.
- Nenhum criterio sem tarefa; nenhuma tarefa sem criterio (T7 e verificacao); nenhuma regra de negocio so no frontend (feature e puramente de UI, sem validacao de dado).
