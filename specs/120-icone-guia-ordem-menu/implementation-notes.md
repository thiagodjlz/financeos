# Notas de implementacao

Branch: `fix/issue-120-icone-guia-ordem-menu` (base: `v1.0.3`, em `16165fb`; `financeosVersionBase=v1.0.3` configurado; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 16 de 16 concluidas (ver `plan.md`; T14-T16 da rodada pos-validacao)

## Arquivos alterados

- `frontend/public/favicon.svg` — moeda com "F" (um `path` branco `evenodd`) no lugar do "F" antigo; fundo `#3b5bdb` `rx=10` mantido.
- `frontend/public/favicon.ico` — regerado do mesmo desenho, quadros 16/32/48.
- `frontend/src/index.html` — `href` dos dois icones com `?v=2` (`sizes` e `type` mantidos).
- `frontend/src/app/layout/main-layout/main-layout.html` — `.mark` com o SVG do simbolo (34x34, sem `xmlns`); Cadastros antes de Relatorios no menu lateral e no painel Mais.
- `frontend/src/app/layout/main-layout/main-layout.scss` — `.mark` sem `font-size`/`font-weight`.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — listas na nova ordem, titulo+item no painel Mais, caso do `.mark` (aberto e recolhido), primeiro item do painel leva a `/categories`.
- `frontend/src/app/features/auth/login/login.html` — `.mark` com o SVG do simbolo (44x44).
- `frontend/src/app/features/auth/login/login.scss` — `.mark` sem `font-size`/`font-weight`.
- `frontend/src/app/features/auth/login/login.spec.ts` — caso do `.mark`.
- `frontend/src/app/core/entry-route.ts` / `entry-route.spec.ts` — `CATEGORIES` antes de `TRANSACTION_REPORTS`; teste de ordem reescrito.
- `frontend/src/app/features/profiles/profile-screens.ts`, `profiles.spec.ts`, `profile-form.spec.ts` — Categorias antes de Relatorios - Lancamentos.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — "Como navegar", painel Mais e tela de entrada na nova ordem.
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — linhas da matriz completas na nova ordem.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — item "Ícone da guia:" do bloco 1.0.3 reescrito.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — `shouldDescribeRegistersBeforeReportsInTheMenuOrder`.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — item do icone: menu lateral, tela de entrada, "uma moeda com a letra F", sem "carteira", unico no bloco.
- `specs/120-icone-guia-ordem-menu/evidence/` — `favicon.md`, `favicon-16.png`, `favicon-16-ampliado.png`, `favicon-svg-chrome-256.png`.

## Decisoes

- Furo `evenodd` em vez de segunda cor: no favicon o furo mostra o `rect` `#3b5bdb`; no `.mark`, o `background: var(--accent)`. Template com `fill="currentColor"` (= `--on-accent`), sem cor literal. Par unico: branco x `#3b5bdb` = 5.67:1.
- O `.mark` nao repete o `rect`: fundo e cantos continuam no CSS (`--radius-md` no menu, `--radius-mark` no login).
- `favicon.svg` com CRLF, como o checkout desta maquina (`core.autocrlf=true`); o sha256 a comparar e o do working tree (ver `evidence/favicon.md`).
- Specs comparam o `d` com uma constante local (specs nao leem disco; importar de outro spec duplicaria os testes dele).

### Revisao de textos (`revisar-textos`)

- Central: "Como navegar" com Cadastros antes de Relatorios (texto igual); painel Mais "(Cadastros, Relatórios, Configurações e Sobre)"; "Entrar no sistema" e linhas da matriz de Perfis com "Categorias, Relatórios - Lançamentos" (Perfis omitia a linha; origem `ENTRY_ROUTES`/`PROFILE_SCREENS`).
- Novidades 1.0.3: ver a rodada pos-validacao abaixo para o texto final.

## Desvios em relacao ao plano

- T6: o teste que clicava no primeiro item do painel Mais passou a esperar `/categories` (efeito da ordem).
- T8: o caso novo usa Usuarios+Relatorio -> `/transaction-reports`; o "so relatorio" ja tinha teste proprio e ficou.
- Linhas do plano (lidas na `main`) conferidas na `v1.0.3`; sem diferenca relevante.

## Ajustes pos-validacao (2026-10-31)

Pedido do usuario: "o icone da Guia ainda não mudou, e eu prefiro um icone mais relacionado a dinheiro, uma moeda talvez e faltou o F" (print com o logo do Angular na guia = cache).

- Simbolo: carteira -> **moeda com "F"** (aro branco, sulco vazado, face branca, "F" vazado), mesmo `d` em `favicon.svg`, `main-layout.html`, `login.html` e nas constantes dos dois specs. Medidas em multiplos de 2.125 (34/16) para aro, sulco e hastes do "F" cairem em pixel inteiro a 16/32/48 px; detalhes, alternativas descartadas e medicoes em `evidence/favicon.md`. Contraste: so branco x `#3b5bdb` (5.67:1), inclusive o "F" sobre a moeda.
- `favicon.ico` regerado (`genD.py F` no scratchpad), 16/32/48; evidencias PNG refeitas.
- `index.html`: `favicon.ico?v=2` e `favicon.svg?v=2`, para o navegador buscar o icone novo.
- Titulos dos testes do `.mark` passaram a citar a moeda com o F desenhado.
- Novidades 1.0.3, revisao `revisar-textos`: antes "Ícone da guia: a guia do navegador, o topo do menu lateral e a tela de entrada passam a mostrar a marca do FinanceOS, uma carteira." -> depois "... a marca do FinanceOS, uma moeda com a letra F." Motivo: descreve o que o usuario ve; as 5 perguntas ok (sem termo tecnico, rotulos da tela). `ReleaseNotesContentTest` exige "uma moeda com a letra F" e proibe "carteira" (a proibicao antiga de "letra" saiu, o F agora faz parte da marca).
- Central: nenhum texto cita a marca, a carteira ou a moeda; sem alteracao.
- Testes: `npm test` 46 arquivos / 573 testes ok; `./mvnw -Dtest=ReleaseNotesContentTest,DocumentationContentTest test` 18 + 23 ok. Varreduras de acentuacao, recurso externo e cor literal em `.scss`: vazias.
