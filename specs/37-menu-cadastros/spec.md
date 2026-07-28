---
issue: 37
url: https://github.com/thiagodjlz/financeos/issues/37
title: "Menu Cadastros"
domains: [categories, auth]
stage: validated
branch: feature/issue-37-menu-cadastros
created: 2026-07-27
---

# Menu Cadastros

## Historia

Como usuario do FinanceOS, quero um menu "Cadastros" agrupando a tela de Categorias e uma barra lateral que se recolhe sozinha ao abrir uma tela, para que a navegacao fique organizada por grupos e a barra nao continue ocupando espaco visual depois que eu ja escolhi para onde ir.

## Contexto

A issue pede duas coisas:

> "Adicionar menu Cadastros
> - SubMenu > Categorias"

> "Ajustar comportamento da barra lateral:
> - Quando clicado em um menu sem abertura de tela mantem barra maximixada.
> - Quando clicado em um 'submenu' ou menu que abre uma tela minimizar a bara lateral automaticamente."

**Estado atual do menu** (`frontend/src/app/layout/main-layout/`): desde a issue #35 a sidebar e um trilho fixo de **76px** que expande para **236px**, e "Categorias" e um item de **primeiro nivel** (o grupo "Cadastros" existiu antes da #20/#35 e foi extinto — ver `knowledge/categories.md`). Existe hoje um unico grupo expansivel, "Configuracoes" (subitens "Usuarios" e "Perfis"). Esta issue **reintroduz o grupo "Cadastros"**, movendo "Categorias" de item de primeiro nivel para subitem desse grupo, na posicao onde "Categorias" esta hoje (entre "Lancamentos" e "Configuracoes" — ver Decisoes).

**Convencao de grupos do menu** (`knowledge/auth-and-permissions.md`): grupos sao **agrupadores visuais, sem `Screen` propria** no backend. Cada subitem tem `*ngIf` com o `can(screen, 'VIEW')` da sua tela, e o grupo so renderiza se ao menos um subitem for visivel. Para "Cadastros" (unico filho: Categorias), o grupo renderiza sse `can('CATEGORIES', 'VIEW')`. Isso e so espelho de UX — a rota `/categories` continua protegida pelo `permissionGuard('CATEGORIES', 'VIEW')` e a API pelo `AccessControl` no backend. **Nenhuma mudanca de backend e necessaria nem permitida por esta issue.**

**Comportamento atual de expansao/recolhimento** (`knowledge/architecture.md`, issue #35): a expansao e a uniao de tres gatilhos que **so abrem, nunca fecham** — `:hover`, `:focus-within` e clique num pai de grupo com o trilho recolhido. O recolhimento so acontece em `mouseleave` (se o foco nao estiver dentro do `<aside>`) e `focusout` (se o novo foco estiver fora). Ou seja: hoje, clicar num item que navega **nao** recolhe o trilho — ele continua expandido enquanto o ponteiro estiver sobre ele. A issue muda isso: navegar deve recolher automaticamente, e o trilho permanece recolhido ate o ponteiro sair da sidebar e reentrar (ver Decisoes). Com a introducao do segundo grupo, os grupos passam a se comportar como **acordeao**: abrir um fecha o outro automaticamente (ver Decisoes).

**Restricao tecnica relevante para o plano**: a largura de 236px hoje e aplicada tanto pela classe `.sidebar.expanded` (estado do signal) quanto pelos seletores CSS `.sidebar:hover` e `:focus-within` diretamente em `main-layout.scss` (linhas 22-25 e 173-175). Apenas zerar o signal `expanded` no clique **nao** recolhe visualmente o trilho enquanto o ponteiro continuar sobre ele (o `:hover` do CSS mantem 236px) — o mecanismo de expansao precisara ser reorganizado para o recolhimento automatico funcionar de fato (ex.: expandir somente via classe controlada pelo signal). O mesmo vale para o foco: apos um clique, o botao clicado retem o foco dentro do `<aside>`, entao a logica atual de `onMouseLeave`/`onFocusOut` tambem seguraria o trilho aberto — pela decisao 4, ao navegar o foco deve ser movido para a area de conteudo da tela aberta.

**Comportamentos existentes que devem sobreviver** (nao-regressao):

- Clicar num pai de grupo com o trilho **recolhido** expande o trilho e abre o grupo **sem navegar** (issue #35).
- Subitens de grupo so renderizam com o trilho expandido (`grupoAberto && expanded()`), com icone SVG inline de 20px + `<span class="nav-label">` sempre no DOM, `title`/`aria-label` em portugues so no estado recolhido.
- Visibilidade por permissao: "Configuracoes" so aparece com `USERS/VIEW || PROFILES/VIEW`; cada subitem com o `can` da propria tela.
- `.workspace` mantem `margin-left: 76px` fixo (o trilho sobrepoe o conteudo ao expandir, `z-index: 50`; modais em 200/201 continuam cobrindo o trilho).
- Acesso por teclado continua expandindo o trilho enquanto o usuario **percorre** o menu por Tab (`focusin`/`:focus-within`).

## Criterios de aceite

- [x] 1. Com um usuario que tem `CATEGORIES/VIEW`, o menu lateral exibe o grupo "Cadastros" com o subitem "Categorias"; o item "Categorias" de primeiro nivel deixa de existir (o `textContent` do menu contem "Cadastros" e "Categorias" aparece apenas como subitem do grupo).
- [x] 2. Clicar no subitem "Categorias" navega para `/categories` e a tela de Categorias abre exatamente como hoje (rota, guard `permissionGuard('CATEGORIES','VIEW')` e componente inalterados).
- [x] 3. Com um usuario **sem** `CATEGORIES/VIEW`, o grupo "Cadastros" inteiro nao e renderizado (nenhum botao "Cadastros" no DOM) — mesmo padrao do grupo "Configuracoes".
- [x] 4. O grupo "Cadastros" nao cria `Screen` nova, endpoint novo nem migration: **nenhum arquivo de `backend/` e alterado** por esta issue (verificavel por `git diff --stat`).
- [x] 5. O pai "Cadastros" segue o padrao visual dos itens do trilho (issue #35): icone SVG inline 20px (`viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.8"`), rotulo em `<span class="nav-label">` sempre no DOM, e `title`/`aria-label` "Cadastros" presentes apenas com o trilho recolhido (`[attr.title]="expanded() ? null : 'Cadastros'"`).
- [x] 6. Subitens de "Cadastros" so renderizam com o trilho expandido e o grupo aberto (equivalente ao `settingsExpanded() && expanded()` de Configuracoes); no estado recolhido de 76px nenhum subitem aparece.
- [x] 7. O pai "Cadastros" recebe o estado visual ativo (classe `active`) quando a URL atual comeca com `/categories`, como "Configuracoes" faz para `/users` e `/profiles`.
- [x] 8. O grupo "Cadastros" aparece entre "Lancamentos" e "Configuracoes": a ordem dos itens do menu, de cima para baixo, e Resumo, Lancamentos, Cadastros, Configuracoes (decisao 3).
- [x] 9. Clicar num **pai de grupo** ("Cadastros" ou "Configuracoes") com o trilho **expandido** alterna a abertura do grupo e **mantem o trilho expandido** (largura 236px) — nenhuma navegacao ocorre.
- [x] 10. Os grupos se comportam como **acordeao** (decisao 2): abrir "Cadastros" com "Configuracoes" aberto fecha "Configuracoes" automaticamente, e vice-versa — no maximo um grupo aberto por vez, inclusive quando o grupo e aberto pelo clique no pai com o trilho recolhido.
- [x] 11. Clicar num **pai de grupo** com o trilho **recolhido** expande o trilho e abre o grupo, sem navegar (comportamento da issue #35 preservado).
- [x] 12. Clicar (mouse) num item que **abre uma tela** — "Resumo", "Lancamentos", o subitem "Categorias", "Usuarios" ou "Perfis" — navega para a rota correspondente **e** recolhe o trilho automaticamente para 76px, mesmo com o ponteiro do mouse ainda sobre a sidebar (o `<aside>` fica sem a largura expandida ate um novo gatilho de expansao).
- [x] 13. Ativar por **teclado** (Enter) um item que abre uma tela tem o mesmo efeito do clique (decisao 4): navega, recolhe o trilho para 76px mesmo com o foco previamente dentro da sidebar, e o **foco e movido para a area de conteudo** da tela aberta (o elemento com foco apos a navegacao esta fora do `<aside>`).
- [x] 14. Apos o recolhimento automatico dos criterios 12/13, o trilho **permanece recolhido enquanto o ponteiro nao sair da sidebar** (decisao 1): manter ou mover o mouse dentro dela nao reexpande; somente apos o ponteiro sair e reentrar (`mouseenter` novo) — ou um novo foco por teclado entrar na sidebar — o trilho volta a expandir para 236px.
- [x] 15. Nao-regressao de permissao: "Configuracoes" continua visivel apenas com `USERS/VIEW || PROFILES/VIEW`, e "Usuarios"/"Perfis" cada um com o `can` da propria tela; "Resumo" e "Lancamentos" continuam condicionados a `DASHBOARD/VIEW` e `TRANSACTIONS/VIEW`.
- [x] 16. Nao-regressao de layout: `.workspace` mantem `margin-left: 76px` nos dois estados do trilho (a expansao sobrepoe o conteudo, nao o empurra).
- [x] 17. Os testes de frontend passam (`npm test` verde), com `main-layout.spec.ts` atualizado cobrindo ao menos: grupo "Cadastros" visivel/oculto conforme `CATEGORIES/VIEW`, acordeao entre os grupos, e recolhimento automatico ao ativar um item que navega.

## Fora de escopo

- Qualquer mudanca de backend: enum `Screen`, permissoes, migrations, endpoints (grupo de menu e agrupador visual sem `Screen`, por convencao do projeto).
- Novas telas ou novos subitens em "Cadastros" alem de "Categorias" (a issue so cita Categorias).
- Mudancas na tela de Categorias em si (formulario, tabela, edicao inline) — apenas o ponto de entrada no menu muda.
- Reintroduzir botao de minimizar/fixar a sidebar (removido na issue #35).
- Comportamento do menu em telas pequenas alem do que ja existe (`@media (max-width: 680px)` atual permanece como esta, salvo ajuste minimo necessario para os criterios acima).

## Decisoes

- 2026-07-27 — **Recolhimento automatico com o ponteiro ainda sobre a sidebar**: apos navegar, o trilho permanece recolhido ate o ponteiro sair da sidebar e entrar de novo; so entao o hover volta a expandir (criterio 14).
- 2026-07-27 — **Grupos em acordeao**: abrir um grupo recolhe automaticamente o grupo que estava aberto — no maximo um grupo aberto por vez (criterio 10; substitui a proposta original de grupos independentes).
- 2026-07-27 — **Posicao do grupo "Cadastros"**: no lugar onde o item "Categorias" esta hoje, entre "Lancamentos" e "Configuracoes" (criterio 8).
- 2026-07-27 — **Navegacao por teclado**: Enter num item que abre tela recolhe a sidebar mesmo com o foco dentro dela, e o foco move para a area de conteudo da tela aberta, consistente com o clique de mouse (criterio 13).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/37
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/categories.md`, `knowledge/auth-and-permissions.md`
- Codigo consultado: `frontend/src/app/layout/main-layout/main-layout.ts`, `main-layout.html`, `main-layout.scss`
