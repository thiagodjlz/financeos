# Plano de implementacao

## Abordagem

Duas mudancas independentes, so de frontend e de texto publicado. (1) Marca: um novo simbolo de moeda/carteira desenhado em `favicon.svg` sobre o mesmo `rect` 34x34 `rx=10` `#3b5bdb`; o simbolo e branco e os detalhes sao **furos** (`fill-rule="evenodd"`), para o mesmo `path` funcionar no favicon (furo mostra o `rect`) e no `.mark` do menu e do login (furo mostra o `background: var(--accent)` do `.mark`, SVG inline com `fill="currentColor"` = `--on-accent`) sem cor literal no template e com um unico par de contraste (branco x `#3b5bdb` = 5.67:1). O `.ico` e regerado do mesmo desenho por script fora do repositorio. (2) Ordem: Cadastros passa para antes de Relatorios em todos os lugares que declaram a "ordem do menu" — `main-layout.html` (menu e "Mais"), `ENTRY_ROUTES`, `PROFILE_SCREENS`, Central — mais o item de Novidades reescrito.

## Arquivos a alterar

### Frontend
- `frontend/public/favicon.svg` — simbolo novo (so `rect`/`circle`/`path`, sem `<text>`/`<image>`, nada externo alem do `xmlns`).
- `frontend/public/favicon.ico` — regerado, quadros 16/32/48.
- `frontend/src/index.html` — sem alteracao (conferir as duas declaracoes).
- `frontend/src/app/layout/main-layout/main-layout.html` — `.mark` com SVG inline; secao Cadastros antes de Relatorios no `<nav>` e no `#sheet-more`.
- `frontend/src/app/layout/main-layout/main-layout.scss` — `.mark` sem `font-size`/`font-weight`; SVG preenchendo a caixa.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — listas na nova ordem; teste do `.mark`.
- `frontend/src/app/features/auth/login/login.html`, `login.scss`, `login.spec.ts` — `.mark` com o simbolo + teste.
- `frontend/src/app/core/entry-route.ts`, `entry-route.spec.ts` — `CATEGORIES` antes de `TRANSACTION_REPORTS`.
- `frontend/src/app/features/profiles/profile-screens.ts`, `profiles.spec.ts`, `profile-form.spec.ts` — Categorias antes de Relatorios - Lancamentos.

### Backend (so conteudo publicado)
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — tres trechos de ordem.
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — linhas da matriz.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — item "Icone da guia:" do bloco `1.0.3`.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`, `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java`.

### Migration
Nenhuma.

## Tarefas

- [x] **T1** — Desenhar o simbolo em `favicon.svg`: manter `<rect width="34" height="34" rx="10" fill="#3b5bdb"/>` e trocar o `path` do "F" por formas de moeda ou carteira em `#ffffff`, detalhes como furos `evenodd`; nenhuma terceira cor (se houver, contraste >= 3:1 contra a cor de baixo, calculado e registrado em `implementation-notes.md`). Preferir formas simples (`rect`/`circle`/arcos) para o `.ico` sair do mesmo desenho e ficar legivel a 16 px. Registrar o sha256 novo.
  - Arquivos: `frontend/public/favicon.svg`
  - Criterios: 1, 3
- [x] **T2** — Regerar `favicon.ico` do mesmo desenho com quadros 16x16, 32x32 e 48x48 (script no scratchpad, fora do repo, como na #117); ler o cabecalho (3 entradas), extrair o 16x16 para PNG e guardar a evidencia; conferir que `index.html` segue com `sizes="16x16 32x32 48x48"` e `type="image/svg+xml"`.
  - Arquivos: `frontend/public/favicon.ico`, `frontend/src/index.html` (so leitura)
  - Criterios: 2, 4
- [x] **T3** — Menu lateral: trocar o texto "F" do `.mark` por `<svg viewBox="0 0 34 34" width="34" height="34" fill="currentColor" aria-hidden="true">` com o mesmo `path` (mesmo `d`, mesmo `fill-rule`) do `favicon.svg`, **sem `xmlns`**; o `.mark` mantem `aria-hidden="true"`, 34x34, `var(--accent)`/`var(--on-accent)`; tirar `font-size`/`font-weight` mortos do `.scss`.
  - Arquivos: `main-layout.html`, `main-layout.scss`
  - Criterios: 5
- [x] **T4** — Login: mesmo SVG no `.mark` de `login.html`, com `width="44" height="44"` (mesmo `viewBox`), sem `xmlns`, `aria-hidden="true"` mantido; tirar a fonte morta do `.mark` em `login.scss`.
  - Arquivos: `login.html`, `login.scss`
  - Criterios: 6
- [x] **T5** — Mover o bloco `nav-section` de Cadastros para antes do de Relatorios no `<nav>`, e no `#sheet-more` o par titulo+item de Cadastros para antes do de Relatorios; gates, `title`/`aria-label` "Relatórios - Lançamentos" e icones intocados.
  - Arquivos: `main-layout.html`
  - Criterios: 7, 8, 9
- [x] **T6** — `main-layout.spec.ts`: `navLabels` (Categorias antes do segundo Lancamentos), `sectionTitles` e `sheetSectionTitles` = `['Cadastros', 'Relatórios', 'Configurações', 'Sobre']`, `sheetItems` com Categorias antes de Lancamentos; testes de "sem permissao" so com a ordem ajustada (titulos de teste que citam ordem acompanham); novo caso do `.mark`: `textContent` vazio, `aria-hidden="true"`, contem `svg path` com o `d` do favicon, `svg` com `width`/`height` 34, e continua no DOM com o menu recolhido.
  - Arquivos: `main-layout.spec.ts`
  - Criterios: 5, 7, 8, 9
- [x] **T7** — `login.spec.ts`: caso do `.mark` — `textContent` vazio, `aria-hidden="true"`, `svg path` com o `d` do favicon, `svg` com `width`/`height` 44.
  - Arquivos: `login.spec.ts`
  - Criterios: 6
- [x] **T8** — `ENTRY_ROUTES`: `CATEGORIES` antes de `TRANSACTION_REPORTS`; reescrever o teste da l. 44 ("põe o relatório depois de Categorias..."): `CATEGORIES`+`TRANSACTION_REPORTS` -> `/categories`; manter "so `TRANSACTION_REPORTS`" -> `/transaction-reports` e `TRANSACTION_REPORTS`+`TRANSACTIONS` -> `/transactions`.
  - Arquivos: `core/entry-route.ts`, `core/entry-route.spec.ts`
  - Criterios: 10
- [x] **T9** — `PROFILE_SCREENS`: Categorias antes de Relatorios - Lancamentos (comentario "na ordem do menu" continua verdadeiro); ajustar a ordem em `profiles.spec.ts` (Detalhe, l. 99-109) e `SCREEN_ROWS` de `profile-form.spec.ts` (o `indexOf` dos helpers segue valido).
  - Arquivos: `profile-screens.ts`, `profiles.spec.ts`, `profile-form.spec.ts`
  - Criterios: 11
- [x] **T10** — Central: em `OverviewContent`, lista de "Como navegar" com Cadastros antes de Relatorios, painel Mais "(Cadastros, Relatórios, Configurações e Sobre)", tela de entrada "Resumo, Lançamentos, Categorias, Relatórios - Lançamentos, Usuários, Perfis, Auditoria, Documentação e Novidades por versão"; em `ProfilesAreaContent`, linhas da matriz "Resumo, Lançamentos, Categorias, Relatórios - Lançamentos, Usuários, Perfis, Auditoria, Documentação e Novidades por versão". Revisar com `.claude/skills/pipeline/revisar-textos/SKILL.md`.
  - Arquivos: `OverviewContent.java`, `ProfilesAreaContent.java`
  - Criterios: 12
- [x] **T11** — `DocumentationContentTest`: asseverar as tres frases novas de `OverviewContent` (inclusive a ordem: indice de "Cadastros:" < "Relatórios:" na lista) e a lista da matriz de `ProfilesAreaContent`; manter a assercao existente "Relatórios: seção com o relatório de Lançamentos.".
  - Arquivos: `DocumentationContentTest.java`
  - Criterios: 12
- [x] **T12** — Reescrever o item "Ícone da guia:" do bloco `1.0.3` (sem item novo, sem item no `1.0.4`): a guia do navegador, o topo do menu lateral e a tela de entrada mostram a marca do FinanceOS, uma moeda/carteira (conforme T1), sem citar "F"; revisar com `.claude/skills/pipeline/revisar-textos/SKILL.md`. Em `ReleaseNotesContentTest#shouldAnnounceAmountOrderTabIconAndVersionFixIn103`, exigir "marca do FinanceOS", "menu lateral", "tela de entrada" e ausencia de `"F"`/"letra"; `shouldAnnounceTheTransactionReportAsNewIn103` intocado.
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: 13
- [x] **T13** — Rodar as tres varreduras de `context.md` (acentuacao front e back, recurso externo) e a de cor literal em `.scss`; todas vazias.
  - Arquivos: — (conferencia)
  - Criterios: 14
- [x] **T14** — (pos-validacao) Redesenhar o simbolo como moeda com a letra "F" (aro, sulco vazado, face, "F" vazado; so `path` `evenodd`, legivel a 16 px) em `favicon.svg`, no `.mark` do menu e do login e nas constantes dos specs; regerar `favicon.ico` 16/32/48 e as evidencias PNG; contraste de cada par >= 3:1.
  - Arquivos: `favicon.svg`, `favicon.ico`, `main-layout.html`, `login.html`, `main-layout.spec.ts`, `login.spec.ts`, `evidence/favicon*`
  - Criterios: 1, 2, 3, 5, 6
- [x] **T15** — (pos-validacao) Versionar o `href` dos icones em `index.html` (`favicon.ico?v=2`, `favicon.svg?v=2`), mantendo `sizes` e `type`, para o navegador nao usar o icone em cache.
  - Arquivos: `frontend/src/index.html`
  - Criterios: 4
- [x] **T16** — (pos-validacao) Reescrever o item "Ícone da guia:" do bloco 1.0.3 para "uma moeda com a letra F" (sem "carteira"), com revisao `revisar-textos`; ajustar `ReleaseNotesContentTest`; conferir que a Central nao cita a carteira.
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`
  - Criterios: 13

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | `favicon.svg` moeda com "F", so formas | T1, T14 |
| 2 | `favicon.ico` 16/32/48 do mesmo desenho | T2, T14 |
| 3 | contraste >= 3:1 de cada cor do simbolo | T1, T14 |
| 4 | `index.html` declara os dois com `?v=2`; 200 com sha256 do repo | T2, T15 (+ etapa 6/7) |
| 5 | `.mark` do menu com o simbolo, 34x34, recolhido | T3, T6, T14 |
| 6 | `.mark` do login com o simbolo, 44x44 | T4, T7, T14 |
| 7 | menu lateral Cadastros, Relatorios, Configuracoes, Sobre | T5, T6 |
| 8 | painel Mais na mesma ordem, itens abaixo das secoes | T5, T6 |
| 9 | gates e `title`/`aria-label` preservados | T5, T6 |
| 10 | `resolveEntryRoute` com Categorias antes do relatorio | T8 |
| 11 | `PROFILE_SCREENS` e telas de Perfis na nova ordem | T9 |
| 12 | Central (Overview + Perfis) + teste | T10, T11 |
| 13 | item "Icone da guia:" reescrito + teste | T12, T16 |
| 14 | varreduras vazias | T13 |

## Superficie de validacao

- 1 — `rg -c "M11.5 9.5h11v3.3H15v2.8h5.5v3.2H15v5.7h-3.5z" frontend/public/favicon.svg` = 0; `rg "<text|<image|href|https?://" frontend/public/favicon.svg` so casa o `xmlns`; sha256 diferente de `84df37f0620c27a5...`.
- 2 — leitura do cabecalho ICONDIR (3 entradas 16/32/48), sha256 diferente de `c2140972d271a12d...`, PNG do 16x16 extraido.
- 3 — calculo WCAG com as cores escritas no SVG (branco x `#3b5bdb` = 5.67:1), registrado em `implementation-notes.md`.
- 4 — `GET http://localhost/favicon.svg` e `/favicon.ico` -> 200 e sha256 igual ao do arquivo do repo (status sozinho nao prova: `try_files`).
- 5 — `main-layout.spec.ts` (caso novo do `.mark`); 6 — `login.spec.ts` (caso novo). Igualdade de formas com o favicon: o `d` do `path` em `main-layout.html` e `login.html` igual ao de `favicon.svg` (grep).
- 7, 8, 9 — `main-layout.spec.ts` (listas e casos de permissao existentes).
- 10 — `entry-route.spec.ts`. 11 — `profiles.spec.ts` (Detalhe) e `profile-form.spec.ts` (matriz).
- 12 — `DocumentationContentTest`; tela Sobre > Documentacao, "Como utilizar o sistema" > "Como navegar" / "Entrar no sistema" e area Perfis.
- 13 — `ReleaseNotesContentTest`; tela Sobre > Novidades por versao, bloco 1.0.3.
- 14 — saida vazia das varreduras.

## Validacao manual (etapa 7)

- 1, 2, 4 — guia do navegador em `http://localhost` **sem cache** (aba anonima ou hard reload; o `?v=2` do `index.html` ja forca a busca): moeda com o "F", nao o logo do Angular nem a carteira; legivel no tamanho da guia.
- 5 — menu lateral acima de 680px: `.mark` 34x34 no Computed, simbolo identico ao da guia; "Recolher menu" e o `.mark` continua visivel no trilho.
- 6 — `/login`: `.mark` 44x44 no Computed com o mesmo simbolo.
- 7, 8 — menu lateral e, a <= 680px, painel "Mais": Cadastros antes de Relatorios.

## Riscos e pontos de atencao

- Gerar o `.ico` depende de ferramenta local (a #117 usou PIL no scratchpad); sem ela, simbolo de formas simples permite redesenhar nos quadros com outra ferramenta. O 16 px e o teste real de legibilidade.
- `xmlns` no SVG inline quebra a varredura de recurso externo (`knowledge/frontend-ui.md`); cor literal em `fill` so no `favicon.svg` (o template usa `currentColor`).
- Central: nenhuma area descreve a marca hoje, entao o icone nao gera texto na Central; so a ordem muda (T10). Novidades: decisao escrita — reescrever o item `1.0.3` (T12), sem item novo; a posicao do relatorio no menu nao e item porque o relatorio e novidade da propria 1.0.3 (spec).
- Backport para a `main` depois do merge (bloco `1.0.3` com o mesmo texto, `1.0.4` sem item) fica fora desta branch (CLAUDE.md).
- `knowledge/auth-and-permissions.md` (menu e `entry-route`) passa a descrever a ordem antiga — corrigir no `sync-knowledge`.
- Linhas citadas vem da `main`; confirmar na branch da `v1.0.3` antes de editar.

## Lacunas

Nenhuma.
