---
issue: 33
url: https://github.com/thiagodjlz/financeos/issues/33
title: "Ajustar menu lateral esquerdo"
slug: menu-lateral
domains: [auth]
stage: pr-opened
branch: feature/issue-33-menu-lateral
created: 2026-07-26
---

# Ajustar menu lateral esquerdo

## Historia

Como usuario do FinanceOS, quero um menu lateral organizado (com as telas administrativas agrupadas em "Configuracoes") e utilizavel tambem quando minimizado, para que eu navegue pelo sistema sem itens soltos e sem o layout quebrar ao recolher o menu.

## Contexto

A issue pede tres coisas no menu lateral esquerdo (shell da aplicacao, `frontend/src/app/layout/main-layout/`):

1. "Criar um menu novo Configuracoes."
2. "Adicionar dentro desse novo menu as telas de Usuarios e Perfis."
3. "Ajustar o layout quando o menu e minimizado, esta quebrando, quando minimizado pode adicionar a letra de cada menu para identificacao."

Situacao atual (lida do codigo):

- O menu tem os itens de nivel superior "Resumo", "Lancamentos", o grupo expansivel "Cadastros" (contendo "Categoria"), "Usuarios" e "Perfis", alem do botao "Sair" e do rodape.
- Ja existe o padrao de grupo expansivel: "Cadastros" usa `nav-group`/`nav-parent`/`nav-children`, com toggle de expansao e destaque de ativo via `isRegistersActive()` (rota atual). "Configuracoes" deve seguir esse mesmo padrao.
- Quando o menu esta minimizado (`collapsed()`), os `<span>` com os rotulos somem via `*ngIf="!collapsed()"` e os botoes ficam **vazios** (sem letra nem icone) — dai a quebra de layout e a impossibilidade de identificar os itens. Os subitens de grupo (`nav-children`) tambem nao sao renderizados quando minimizado.

Regras existentes que se aplicam (de `knowledge/auth-and-permissions.md`):

- A visibilidade de cada item do menu e controlada por `authService.can(screen, 'VIEW')` — hoje "Usuarios" exige `USERS/VIEW` e "Perfis" exige `PROFILES/VIEW`. Isso e **so gate de UX**: a autorizacao real continua no backend (`accessControl.require(...)` em cada endpoint) e nas rotas (`permissionGuard`). Esta issue nao muda nada de permissao no backend — apenas reorganiza a apresentacao, preservando as mesmas condicoes de visibilidade por item.
- Nao ha `Screen` nova: "Configuracoes" e apenas um agrupador visual, nao uma tela com permissao propria.
- Todo texto de UI em portugues (convencao do projeto).

A feature e exclusivamente de frontend (layout/shell); nao ha regra de negocio nova a impor no backend.

## Criterios de aceite

- [x] 1. O menu lateral exibe um grupo "Configuracoes" no padrao visual/comportamental do grupo "Cadastros" (item pai que expande/recolhe ao clicar), contendo os subitens "Usuarios" (rota `/users`) e "Perfis" (rota `/profiles`); esses dois itens deixam de existir como itens de nivel superior do menu.
- [x] 2. Visibilidade por permissao preservada: o subitem "Usuarios" so aparece com `USERS/VIEW`, o subitem "Perfis" so aparece com `PROFILES/VIEW`, e o grupo "Configuracoes" so aparece se o usuario tiver ao menos uma das duas; sem nenhuma delas, o grupo inteiro nao e renderizado. (Espelho de UX — as rotas continuam protegidas pelo `permissionGuard` e a API pelo `AccessControl`, sem alteracao de backend.)
- [x] 3. Clicar em "Usuarios"/"Perfis" dentro do grupo navega para `/users`/`/profiles` e o subitem clicado recebe o destaque de ativo (`routerLinkActive`); o item pai "Configuracoes" aparece destacado como ativo quando a rota atual comeca com `/users` ou `/profiles` (mesmo padrao de `isRegistersActive()` para Cadastros).
- [x] 4. Com o menu minimizado, cada item de navegacao exibe um identificador visivel e centralizado no botao, em vez de um botao vazio: "Resumo" e "Lancamentos" mostram sua letra inicial ("R" e "L"), e os grupos "Cadastros" e "Configuracoes" mostram **icones distintos** entre si (decisao 1). Os botoes mantem altura e alinhamento consistentes entre si (sem colapso de altura nem desalinhamento).
- [x] 5. Com o menu minimizado, o layout nao quebra: a sidebar mantem a largura reduzida fixa, nenhum texto transborda ou e cortado pela metade, e o botao de expandir/recolher (`«`/`»`), o bloco da marca ("F") e o botao "Sair" permanecem visiveis e clicaveis. Alternar minimizado/expandido varias vezes seguidas mantem o layout integro (resultado observavel na tela em `http://localhost`).
- [x] 6. Com o menu minimizado, os itens continuam funcionais: clicar em "Resumo"/"Lancamentos" navega normalmente; clicar no icone de um grupo ("Cadastros" ou "Configuracoes") **expande o menu lateral inteiro e abre esse grupo** (subitens visiveis, prontos para clique), sem navegar ainda (decisao 2).
- [x] 7. O item pai destacado como ativo continua identificavel tambem no modo minimizado (a classe/estilo de ativo se aplica ao botao com a letra/icone).
- [x] 8. O botao "Sair" e o rodape da sidebar (nome do usuario/versao) permanecem exatamente com o comportamento atual nos dois modos — nenhuma alteracao neles (decisao 3).
- [x] 9. Todos os textos novos ou alterados do menu estao em portugues ("Configuracoes", rotulos, `aria-label`s — os icones dos grupos tem `aria-label`/`title` em portugues no modo minimizado).
- [x] 10. Os testes de componente do frontend cobrem: (a) grupo "Configuracoes" visivel/oculto conforme as permissoes do criterio 2; (b) subitens renderizados so com a respectiva permissao; (c) no modo minimizado, os botoes de navegacao renderizam o identificador (letra/icone) em vez de ficarem vazios; (d) clicar num grupo minimizado expande o menu e abre o grupo. `npm test` passa.
- [x] 11. `npm run build` (frontend) conclui sem erros; nenhum arquivo de backend e alterado por esta feature.

## Fora de escopo

- Qualquer mudanca de permissao, `Screen` ou endpoint no backend — "Configuracoes" e agrupador visual, nao tela nova.
- Mudar o conteudo do grupo "Cadastros" (a tela "Categoria" permanece nele) ou criar/remover rotas.
- Persistir o estado minimizado/expandido do menu entre sessoes (hoje e apenas estado local; a issue nao pede mudanca).
- Alteracoes no botao "Sair" e no rodape da sidebar (decisao 3).

## Decisoes

- 2026-07-26 — Diferenciacao de "Cadastros" e "Configuracoes" no modo minimizado (ambos comecam com "C"): usar **icones distintos** para cada grupo em vez de letras. Itens simples ("Resumo", "Lancamentos") seguem com a letra inicial, conforme o texto da issue.
- 2026-07-26 — Comportamento dos grupos com o menu minimizado: clicar no grupo **expande o menu lateral inteiro e abre o grupo** (nao havera flyout nem subitens renderizados no modo minimizado).
- 2026-07-26 — Botao "Sair" e rodape do menu minimizado: **manter como estao hoje**, nenhuma mudanca; o escopo fica restrito ao agrupamento dos itens e ao ajuste do modo minimizado dos itens de navegacao.

## Pontos em aberto

Nao ha pontos em aberto — os tres pontos levantados na versao inicial da spec foram resolvidos com o usuario (ver "Decisoes").

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/33
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/auth-and-permissions.md`, `knowledge/users.md`
- Codigo consultado: `frontend/src/app/layout/main-layout/main-layout.html`, `frontend/src/app/layout/main-layout/main-layout.ts`
