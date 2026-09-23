---
issue: 75
url: https://github.com/thiagodjlz/financeos/issues/75
title: "Botao \"voltar ao topo\" em todas as telas"
domains: [documentation]
target: main
stage: pr-open
branch: feature/issue-75-botao-voltar-ao-topo
created: 2026-09-22
---

# Botao "voltar ao topo" em todas as telas

## Historia

Como usuário do FinanceOS, quero um botão flutuante "Voltar ao topo" que apareça ao rolar uma tela longa, para voltar ao início sem rolar manualmente.

## Contexto

A issue pede um botão flutuante, **global e reutilizável** (nunca um por tela), que fique oculto no topo, apareça após uma rolagem mínima, role suavemente ao topo no clique e desapareça ao chegar lá. Deve seguir o padrão visual existente, ser acessível (teclado, `aria-label`, foco visível, alvo de toque) e funcionar de desktop a smartphone (iPhone 12), respeitando safe area e sem cobrir elementos importantes.

Regras existentes que se aplicam (ver `knowledge/frontend-ui.md`):

- **Quem rola é o documento**: `.workspace` não tem `overflow` próprio, e `withInMemoryScrolling({ scrollPositionRestoration: 'top' })` já leva a rolagem ao topo a cada troca de tela (issue #70). "Não espalhar `scrollTo` por componente" — o botão é o único ponto novo que rola.
- Não existe hoje limite de rolagem nem utilitário de scroll reaproveitável (nenhum `scrollTo`/listener de scroll em `frontend/src/app` fora do `app.config`). Vale a referência da issue: **300px**.
- Componente global montado uma vez tem precedente: `app-toast-host` vive em `app.html`, irmão do `<router-outlet>`, para alcançar também `/login`.
- Camadas fixas existentes: trilho 50, `.mobile-topbar` 60, scrim da gaveta 70, gaveta 80, modal 200/201, toasts 999 (canto superior direito). O canto inferior direito está livre.
- Design system: só `styles.scss` tem cor literal; ícone é SVG inline de 20px (`viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.8"`), sem biblioteca; `:hover` sempre dentro de `@media (hover: hover)`; alvo de toque `--touch-target` (44px) só até 480px; todo `position: fixed` soma `env(safe-area-inset-*)`; elemento oculto não pode continuar tabulável (lição da gaveta, #54).
- App sem zone.js: a visibilidade precisa ser reativa (signal).
- "Novidades por versão" (`ReleaseNotesContent.java`, bloco `versao_1_0_2()`, `VERSION` = `1.0.2-dev`) recebe itens escritos à mão em linguagem de usuário.

## Criterios de aceite

- [x] CA01 — Com `window.scrollY` = 0 o botão não é exibido: ausente do DOM ou `visibility: hidden`/`display: none`, e fora da ordem de `Tab` (teste de componente).
- [x] CA02 — `window.scrollY` > 300 exibe o botão; <= 300 o oculta como no CA01. O limite é uma constante única (teste de componente nos dois lados do limite).
- [x] CA03 — Clicar (ou Enter/Espaço) chama `window.scrollTo` com `top: 0` e `behavior: 'smooth'` (teste com `scrollTo` espionado).
- [x] CA04 — Com `prefers-reduced-motion: reduce`, o clique usa `behavior: 'instant'` (ou `'auto'`) e a entrada/saída do botão não tem `transition`/`animation` (teste com `matchMedia` simulado; DevTools > Rendering > emular `prefers-reduced-motion`).
- [x] CA05 — Ao chegar a 0 após o clique, o botão volta ao estado oculto sem ação adicional (teste + validação manual em `http://localhost`).
- [x] CA06 — Após o clique, o foco vai para a `<section class="workspace">` (mesmo alvo do `onNavigate()` do menu), e não para `body` (teste: `document.activeElement` após o clique).
- [x] CA07 — Tela sem rolagem vertical (ex.: `/no-access`) nunca exibe o botão (validação manual).
- [x] CA08 — Instância única: o seletor do componente aparece em exatamente um template (`rg` em `frontend/src/app --glob '*.html'` = 1 linha), nenhum arquivo de `features/` foi alterado para incluí-lo, e ele funciona em todas as rotas do shell.
- [x] CA09 — `position: fixed` no canto inferior direito, com `bottom`/`right` somando `env(safe-area-inset-bottom)`/`env(safe-area-inset-right)`, funcional a 1440, 1080, 768 e 390px (DevTools; verificável por emulação — safe area real não reproduzida).
- [x] CA10 — Não altera o layout: `document.documentElement.scrollHeight` e posição/largura de `.workspace` iguais com o botão visível e oculto (DevTools, 2 telas, 1440px e 390px).
- [x] CA11 — Conflito de sobreposição **verificado e reportado**: em cada rota do shell (Resumo, Lançamentos, Categorias, Usuários, Perfis, Documentação, Novidades por versão), a 1440px e 390px, rolada até o fim com o botão visível, registra-se em `verification.md` se o botão cobre algum botão/controle (retângulos via `getBoundingClientRect`). Conflito encontrado **é reportado ao usuário e não é corrigido por conta própria**; o critério se cumpre com a tabela completa, com ou sem conflito.
- [x] CA12 — `.scss` do componente sem cor literal (`rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` segue vazia) nem `white`/`black`; cor, raio e sombra de tokens de `styles.scss`; seta para cima em SVG inline no padrão; `:hover` dentro de `@media (hover: hover)`; `:focus-visible` e `:active` com estilo visível.
- [x] CA13 — `<button type="button">` com `aria-label` e `title` "Voltar ao topo", alcançável por `Tab` quando visível; até 480px, área de toque >= 44x44px (`--touch-target`).
- [x] CA14 — `z-index` menor que 70: com a gaveta mobile ou um modal aberto, o botão fica coberto e não clicável (validação manual).
- [x] CA15 — Um único listener de `scroll` (ou `IntersectionObserver`) no app, `passive`, criado uma vez e removido no destroy; navegar não cria listeners novos (teste contando `add`/`removeEventListener`).
- [x] CA16 — `GET /api/release-notes` traz, no bloco `1.0.2`, a categoria `IMPROVEMENT` com um item sobre o botão "Voltar ao topo" em linguagem de usuário (`ReleaseNotesContentTest`/`ReleaseNotesResourceTest` ajustados e verdes).
- [x] CA17 — Não-regressão: `scrollPositionRestoration: 'top'` segue em `app.config.ts`; toasts, gaveta, `.mobile-topbar` e modais inalterados; `npm test`, `npm run build` (sem novo warning de budget) e `./mvnw test` passam.
- [x] CA18 — Varreduras de acentuação (`architecture.md`, "Idioma") sem ocorrência nova: baselines medidos na `main` em 2026-09-22 (`21d848f`): frontend 2 linhas, backend 6 linhas. O item do CA16 não pode usar "lancamento"/"periodo" sem acento.
- [x] CA19 — `GET /api/documentation` traz, na seção "Como navegar" da introdução ("Como utilizar o sistema"), um parágrafo em linguagem de usuário sobre o botão "Voltar ao topo" (aparece ao rolar a tela e leva de volta ao início), com até 600 caracteres, sem identificador técnico e sem ocorrência nova nas varreduras do CA18 (`DocumentationContentTest` ajustado e verde).

## Fora de escopo

- Rolagem de containers internos (`.table-wrap`, painéis): só a do documento conta.
- Backend além do item de Novidades (CA16) e do parágrafo da Central (CA19); permissões e regras de negócio.
- Resolver conflitos de sobreposição achados no CA11 (vão para o usuário).

## Decisoes

- 2026-09-22 — Posição fixa no canto inferior direito, sem reservar espaço nem esconder perto do fim; conferir tela a tela se cobre algum botão e **avisar o usuário** em caso de conflito (CA11).
- 2026-09-22 — Com `prefers-reduced-motion: reduce`: rolagem instantânea e sem animação de entrada/saída (CA04).
- 2026-09-22 — Após o clique, foco no início da área de conteúdo (`.workspace`), como o menu faz ao navegar (CA06).
- 2026-09-22 — Incluir item em "Melhorias" no bloco da versão corrente de Novidades (CA16).
- 2026-09-22 — Incluir parágrafo sobre o botão "Voltar ao topo" na seção "Como navegar" da Central de Documentação (`OverviewContent.navegacao()`), para a Central não ficar desatualizada em relação à navegação (decisão do usuário no planejamento; CA19).
- 2026-09-22 — O botão fica só nas telas internas do app (layout com `.workspace`); a tela de login **não** recebe o botão.
- Limite de 300px: valor de referência da issue, adotado por não haver regra prévia no projeto.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/75
- Conhecimento: `knowledge/README.md`, `architecture.md`, `frontend-ui.md`, `documentation.md`; código: `app.html`, `app.routes.ts`, `main-layout.scss`, `toast-host.scss`, `ReleaseNotesContent.java`.
