# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reiniciada na etapa anterior — ver `docker-report.md`; containers `financeos-frontend`/`financeos-backend` UP, `GET /api/health` -> 200).
Branch: `feature/issue-33-menu-lateral` — mudancas ainda **nao commitadas**.

Confirmado que o codigo servido em `http://localhost` e o da feature: o chunk implantado (`/usr/share/nginx/html/chunk-CgryR9H4.js` no container `financeos-frontend`) contem `Configuracoes`, `nav-abbr`, `isSettingsActive` e `settingsExpanded`.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Grupo "Configuracoes" no padrao de "Cadastros", com subitens Usuarios/Perfis fora do nivel superior | VERIFICADO | `main-layout.html:34-47` (nav-group espelhando Cadastros; botoes de nivel superior removidos no diff); testes `should render the FinanceOS shell...` (4 botoes de topo, "Configuracoes" presente, "Usuarios"/"Perfis" ausentes) — 66 testes passaram (`quality-report.md`) |
| 2 | Visibilidade por permissao (USERS/VIEW, PROFILES/VIEW, grupo com ao menos uma) | VERIFICADO | `main-layout.ts` `canSeeSettings()` (`USERS/VIEW \|\| PROFILES/VIEW`), `*ngIf` por subitem em `main-layout.html:40,43`; testes `shows the Configuracoes group when the user can view only users/only profiles`, `hides the Configuracoes group when...neither`, `renders only the permitted children...` (passaram) |
| 3 | Navegacao dos subitens e destaque de ativo (subitem via `routerLinkActive`, pai via `isSettingsActive()`) | VERIFICADO | Estatico, mesmo padrao de "Cadastros" ja em producao: `routerLink="/users"`/`"/profiles"` + `routerLinkActive="active"` (`main-layout.html:40,43`), `[class.active]="isSettingsActive()"` (`main-layout.html:35`), `isSettingsActive()` = `url.startsWith('/users') \|\| startsWith('/profiles')` (`main-layout.ts`) |
| 4 | Minimizado: "R"/"L" nos itens simples, icones distintos nos grupos, altura/alinhamento consistentes | VERIFICADO | `main-layout.html:17,21,26,37` (`nav-abbr` com R, L, `&#9776;` ☰ e `&#9881;` ⚙ — distintos); `main-layout.scss:94-105` (`min-height: 45px`, `text-align: center`, `line-height: 21px` — 12+21+12 = 45px, igual entre letra e glifo); teste `renders an identifier on every nav button when the sidebar is collapsed` (passou) |
| 5 | Minimizado: layout integro (largura fixa, sem corte, toggle/marca/Sair clicaveis, alternancia repetida) | VALIDACAO MANUAL | ver roteiro itens 1 e 2 (a propria spec define este criterio como observavel na tela) |
| 6 | Minimizado: itens funcionais; clicar num grupo expande o menu e abre o grupo, sem navegar | VERIFICADO | Teste `expands the sidebar and opens the group when a collapsed group is clicked, without navigating` (remove `collapsed`, renderiza subitens, `router.url` inalterada — passou); `toggleRegisters()` tem a mesma logica de `toggleSettings()` (`main-layout.ts`); `routerLink` permanece nos botoes simples quando minimizado (`main-layout.html:15,19`) |
| 7 | Pai ativo identificavel tambem no modo minimizado | VALIDACAO MANUAL | ver roteiro item 3 (`[class.active]` aplica-se ao botao independente de `collapsed` e a regra `.sidebar.collapsed .nav-list button` nao sobrescreve `background`, mas a identificacao visual e conferida na tela) |
| 8 | "Sair" e rodape inalterados nos dois modos | VERIFICADO | `git diff` de `main-layout.html`/`.scss`: nenhuma linha dos blocos `logout-button`, `sidebar-footer` e `brand-block` alterada (aparecem apenas como contexto no diff) |
| 9 | Textos novos em portugues (rotulos, `title`/`aria-label`) | VERIFICADO | `main-layout.html:15,19,24,35-36` — "Configuracoes", "Usuarios", "Perfis" e `title`/`aria-label` "Resumo", "Lancamentos", "Cadastros", "Configuracoes" (sem acento, padrao do restante do menu) |
| 10 | Testes de componente (a)-(d) e `npm test` passando | VERIFICADO | `main-layout.spec.ts` reescrito com 9 testes cobrindo (a) visibilidade do grupo, (b) subitens por permissao, (c) identificadores no modo minimizado, (d) expandir grupo minimizado sem navegar; `npm test`: 66 testes em 12 arquivos, 0 falhas (`quality-report.md`) |
| 11 | `npm run build` sem erros; nenhum arquivo de backend alterado | VERIFICADO | `build-report.md`: frontend PASSOU (bundle em `frontend/dist/frontend`); `git status`: o diff da feature toca apenas os 4 arquivos de `frontend/src/app/layout/main-layout/` — zero arquivos em `backend/` |

## Criterios NAO ATENDIDO

Nenhum.

## Roteiro de validacao manual

1. Abra `http://localhost`, faca login e clique no botao `«` no topo da sidebar para minimizar o menu. Esperado: a sidebar encolhe para a largura reduzida fixa (72px); os botoes de navegacao mostram, centralizados e com a mesma altura, **R** (Resumo), **L** (Lancamentos), **☰** (Cadastros) e **⚙** (Configuracoes); nenhum texto aparece cortado ou transbordando; o bloco da marca ("F"), o botao `»` e o botao de sair (⏻) continuam visiveis e clicaveis; passar o mouse sobre cada botao mostra o nome em portugues no tooltip. (criterio 5)
2. Alterne expandir/minimizar (`»`/`«`) umas 5 vezes seguidas. Esperado: o layout permanece integro a cada alternancia — sem botoes vazios, sem desalinhamento, sem a area de conteudo pular. (criterio 5)
3. Com o menu expandido, clique em "Configuracoes" e depois em "Usuarios" (voce vai para `/users`). Agora minimize o menu com `«`. Esperado: o botao **⚙** aparece destacado como ativo (fundo mais claro, igual ao destaque dos demais itens ativos). Repita indo para "Perfis" (`/profiles`) e minimize de novo — ⚙ segue destacado. Para contraprova, navegue para "Resumo" e minimize: o destaque sai do ⚙ e o **R** fica destacado. (criterio 7)
4. (Confirmacao visual do que os testes ja cobrem, opcional) Com o menu minimizado, clique no ⚙. Esperado: o menu inteiro expande e o grupo "Configuracoes" ja abre mostrando "Usuarios" e "Perfis", sem navegar para nenhuma tela. (criterio 6)

## Achado fora dos criterios

O working tree contem modificacoes em 4 arquivos de `knowledge/` (`architecture.md`, `categories.md`, `transactions.md`, `users.md`) que **nao pertencem a esta feature**: sao a saida ainda nao commitada do `/pipeline:sync-knowledge` da issue #31 (edicao inline nos cadastros), aguardando revisao do usuario. Isso **nao** reprova o criterio 11 — o diff da implementacao da feature (arquivos listados em `implementation-notes.md`) toca apenas `frontend/src/app/layout/main-layout/`. Risco para a etapa `open-pr`: o commit desta feature deve ser seletivo (os 4 arquivos do layout + `specs/33-menu-lateral/`), sem arrastar os `knowledge/*.md` da issue #31.

## Dados de teste criados

Nenhum — a verificacao nao criou, alterou nem apagou dados de negocio na stack local (feature exclusivamente de frontend; nenhuma chamada de escrita a API foi necessaria).

## Conclusao

9 de 11 criterios verificados automaticamente; 2 (criterios 5 e 7, ambos de layout/CSS) dependem de validacao manual do usuario em `http://localhost`. Nenhum criterio NAO ATENDIDO — do ponto de vista desta verificacao, a feature esta pronta para a validacao manual e, apos o OK do usuario, para commit/PR.

Validado pelo usuario em 2026-07-26.
