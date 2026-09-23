# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; o jar do container contem os textos novos de `ReleaseNotesContent` e `OverviewContent`).
Branch: `feature/issue-75-botao-voltar-ao-topo` — mudancas ainda **nao commitadas**.
Medicoes de tela no build **servido** (Chrome 153 headless via CDP), com as respostas de `/api/*` substituidas **so na sessao do navegador** por dados sinteticos (nada chegou ao backend; nenhuma chamada nao-GET). JWT proprio para `GET /api/release-notes` e `/api/documentation` (401 sem token) foi bloqueado pelo classificador de permissoes; CA16/CA19 ficam provados pela suite (`@QuarkusTest` chama o endpoint real). Nenhuma escrita ocorreu.

Diff da feature = exatamente os 12 arquivos de `implementation-notes.md`; nada fora deles no working tree.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Oculto e fora do Tab em scrollY 0 | VERIFICADO | `back-to-top.spec.ts` "fica oculto e fora da ordem de Tab..." (passou); navegador: `visibility: hidden`, `tabIndex -1`, Tab nao chega ao botao — `evidence/medicoes-navegador.md` |
| 2 | Limite 300 em constante unica | VERIFICADO | `BACK_TO_TOP_THRESHOLD` (`back-to-top.ts:3`); teste "usa 300px como limite..."; navegador 300 oculto / 301 visivel / 300 oculto |
| 3 | Clique/Enter/Espaco -> `scrollTo` smooth | VERIFICADO | teste "rola suavemente..."; navegador: clique real, Enter e Espaco reais -> `{"top":0,"behavior":"smooth"}` |
| 4 | Reduced motion: `auto` e sem transicao | VERIFICADO | teste "rola sem animação..."; emulacao `prefers-reduced-motion: reduce`: `behavior "auto"`, `transition-duration 0s`, `transform none` |
| 5 | Oculta sozinho ao chegar a 0 | VERIFICADO | teste; navegador: scrollY 2958 -> ... -> 0 em ~800 ms, botao oculto sem acao adicional |
| 6 | Foco na `.workspace` apos o clique | VERIFICADO | teste "move o foco..." (`preventScroll: true`); navegador: `activeElement = SECTION.workspace` apos clique, Enter e Espaco |
| 7 | Tela sem rolagem nunca exibe | VERIFICADO | `/no-access` a 1440 e 390: rolagem max 0, oculto mesmo apos evento `scroll`; Novidades a 1440x900 (rolagem 250) tambem oculto |
| 8 | Instancia unica, nenhum `features/` alterado | VERIFICADO | `rg "app-back-to-top" frontend/src/app --glob '*.html'` = 1 linha (`main-layout.html:222`); `features/`, `app.html` sem diff; botao presente nas 7 rotas do shell (CA11) |
| 9 | Fixo inferior direito com safe area, 1440/1080/768/390 | VERIFICADO | regra efetiva `calc(24px + env(safe-area-inset-*))` (16px ate 680); `position: fixed` nas 4 larguras — safe area real nao reproduzida (emulacao) |
| 10 | Nao altera o layout | VERIFICADO | Lançamentos e Categorias, 1440 e 390: `scrollHeight`/`scrollWidth` e retangulo da `.workspace` identicos visivel x oculto |
| 11 | Tabela de sobreposicao por rota | VERIFICADO | `evidence/ca11-sobreposicao.md` (7 telas x 2 larguras); **nenhum conflito no fim da rolagem**; sobreposicao transitoria reportada abaixo |
| 12 | Tokens, SVG, hover/focus/active | VERIFICADO | varredura de cor em `*.scss` = 0 linhas, sem `white`/`black`; SVG 20px `stroke-width 1.8` `aria-hidden`; `:hover` so em `@media (hover: hover)`; `:focus-visible` e `:active` medidos |
| 13 | `button`, `aria-label`/`title`, Tab, 44px ate 480 | VERIFICADO | teste "é um botão acessível..."; Tab real a partir do ultimo controle chega ao botao; 44x44 a 390, 40x40 no desktop |
| 14 | `z-index` < 70 | VERIFICADO | z 40; gaveta aberta: `elementFromPoint` = `drawer-scrim`; modal "Deseja sair sem salvar?": `modal-backdrop`; clique real nos dois: 0 chamadas a `scrollTo` |
| 15 | Listener unico `passive`, removido no destroy | VERIFICADO | teste "registra um único listener..." e `main-layout.spec.ts` "monta um único botão..."; navegador: apos passar pelas 7 telas, 1 listener `scroll` `passive: true` em `window` |
| 16 | Item em Melhorias do 1.0.2 | VERIFICADO | `ReleaseNotesContentTest#shouldAnnounceTheBackToTopButtonAsImprovementIn102` e `ReleaseNotesResourceTest#shouldListTheBackToTopButtonAmongThe102Improvements` (passaram, surefire 22:18) |
| 17 | Nao-regressao + suites e build | VERIFICADO | `quality-report.md`: 100 testes backend, 307 frontend, build sem warning de budget; `scrollPositionRestoration: 'top'` em `app.config.ts:12`; `styles.scss`/`main-layout.scss` sem diff; camadas medidas: topbar 60, gaveta 80, toasts 999 |
| 18 | Varreduras de acentuacao | VERIFICADO | frontend 2 linhas, backend 6 linhas (= baseline); bytes UTF-8 corretos nos textos novos, sem `Ã`/`Â` |
| 19 | Paragrafo em "Como navegar" | VERIFICADO | `DocumentationContentTest#shouldExplainTheBackToTopButtonInHowToNavigate` + `shouldKeepParagraphsShort` (600) + `shouldNotExposeTechnicalIdentifiers` (passaram); `OverviewContent.java:64-66` |

## Achado para o usuario (CA11 — sobreposicao, nao corrigida)

Com a pagina **rolada ate o fim**: nenhum conflito em nenhuma tela, a 1440 e a 390 px. Ha sobreposicao **transitoria** enquanto a pagina esta no meio da rolagem:

- Lançamentos, 1440: cobre parte de "Editar" e "Cancelar" da linha que passa pelo canto inferior direito (em 53 de 55 posicoes medidas; ate 21x30 px).
- Usuários, 1440: cobre "Desativar" da linha no canto (ate 40x27 px).
- Perfis, 1440: 1 px da borda de "Excluir"; no fim da rolagem fica a 6 px do botao.
- Perfis, 390: cobre as chaves de permissao da coluna direita (Alterar/Excluir) e a borda de "Salvar" do formulario ao passarem pelo canto.
- Resumo, 390: cobre o canto do grafico "Evolução anual" logo apos aparecer (scrollY ~301-330).

## Roteiro de validacao manual

Todos os criterios foram medidos; os itens abaixo sao a sua conferencia com os seus dados reais e a decisao sobre o achado acima.

1. Abra `http://localhost` num navegador desktop (janela larga), entre com seu usuario e va em Lançamentos. Role devagar ate o meio da lista. Esperado: o botao redondo azul com seta aparece no canto inferior direito depois de ~300 px de rolagem; a linha que passa pelo canto fica com "Editar"/"Cancelar" parcialmente sob o botao. Decida se isso e aceitavel ou se quer abrir correcao. (criterio 11)
2. Ainda em Lançamentos, role ate o fim. Esperado: o botao nao cobre nenhum botao da ultima linha nem outro controle. Clique nele. Esperado: rolagem suave ate o topo, o botao some sozinho. (criterios 5, 11)
3. Se o botao nao aparecer ou tiver outra cor: DevTools > Elements > selecione o botao > Computed > `background-color`. Esperado: `oklch(0.56 0.16 262)` (equivale a `rgb(61, 112, 209)`); com o mouse em cima, `oklch(0.46 0.16 262)` (`rgb(33, 81, 176)`). Valor em `rgb(...)` no Computed ou botao sem cor de destaque indica CSS antigo. Se o elemento `app-back-to-top` nem existir no DOM, o navegador esta com bundle antigo em cache: recarregue com Ctrl+Shift+R.
4. No celular (ou DevTools > Toggle device toolbar > iPhone 12, 390 px), abra Perfis, edite um perfil e role pelo formulario. Esperado: as chaves de permissao da direita e o "Salvar" passam por baixo do botao durante a rolagem; no fim da pagina nada fica coberto. Decida junto com o item 1. (criterio 11)

## Dados de teste criados

Nenhum.

## Conclusao

19 de 19 criterios verificados automaticamente; nenhum NAO ATENDIDO. A validacao manual e a sua conferencia com dados reais e a decisao sobre a sobreposicao transitoria do CA11 (Lançamentos/Usuários a 1440, Perfis a 390), que por decisao da spec nao foi corrigida.

Validado pelo usuario em 2026-09-22.
