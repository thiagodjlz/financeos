---
issue: 120
url: https://github.com/thiagodjlz/financeos/issues/120
title: "Icone da guia"
domains: [auth, transactions, documentation]
target: v1.0.3
stage: pr-open
branch: fix/issue-120-icone-guia-ordem-menu
created: 2026-10-31
---

# Icone da guia

## História

Como usuário do FinanceOS, quero um ícone de guia que lembre um sistema financeiro e Relatórios depois de Cadastros no menu, para reconhecer o sistema entre as guias e achar as telas na ordem que me faz sentido.

## Contexto

A issue pede, "a partir da versão 1.0.3", trocar o ícone da guia "para algo com a essência do sistema" e pôr Relatórios depois de Cadastros no menu.

**Ícone (`origin/v1.0.3`, build `1.0.3-02`).** A #117 (DEC-6) pôs na guia a marca "F": `favicon.svg` 34×34, `rx="10"`, fundo `#3b5bdb` (`--accent`), "F" branco em `<path>`; `favicon.ico` com 16/32/48 px; `index.html` declara os dois. O mesmo "F" é texto no `.mark` do menu lateral (`main-layout.html`, 34×34, visível também com o menu recolhido) e no `.mark` da tela de login (`login.html`, 44×44). O navegador guarda o ícone em cache: validar sem cache.

**Menu.** Em `main-layout.html`, depois de Resumo e Lançamentos: Relatórios → Cadastros → Configurações → Sobre, no menu lateral e no painel "Mais". Seção aparece se o perfil vê ao menos um item. Só a posição muda.

**Regras amarradas à "ordem do menu"** (`knowledge/auth-and-permissions.md`): `core/entry-route.ts` (tela aberta depois de entrar = primeira permitida na ordem do menu), `features/profiles/profile-screens.ts` (linhas da matriz e do Detalhe de Perfis) e a Central (`OverviewContent`; em `ProfilesAreaContent` a lista das linhas da matriz **já omite** Relatórios - Lançamentos e é corrigida junto).

**Novidades.** O bloco `1.0.3` tem "Ícone da guia: a guia do navegador passa a mostrar a marca do FinanceOS.". Pela regra de `knowledge/documentation.md`, mudança que contradiz item do bloco da versão em que entra **reescreve o item**. O relatório também é novidade da 1.0.3, então sua posição no menu não é mudança.

Depois do merge em `v1.0.3`, a correção vai para a `main`; o bloco `1.0.3` da `main` recebe o mesmo texto e o `1.0.4` não ganha item.

## Critérios de aceite

Ícone da guia e marca:

- [x] 1. `frontend/public/favicon.svg` desenha uma **moeda com a letra "F"** (ver Decisões, ajuste pós-validação): moeda (círculo com borda/aro, lembrando dinheiro) sobre o quadrado de fundo `#3b5bdb` com cantos arredondados, com o "F" desenhado em forma (path) no centro da moeda. Deixa de ser a carteira e difere do "F" antigo: não contém mais o path `M11.5 9.5h11v3.3H15v2.8h5.5v3.2H15v5.7h-3.5z` e o sha256 difere de `84df37f0620c27a5…` e de `74a8374548ca7024…`. Só formas (`path`, `rect`, `circle`...), sem `<text>`, `<image>` ou referência externa além do `xmlns`. O "F" continua legível a 16 px.
- [x] 2. `frontend/public/favicon.ico` vem do mesmo desenho, sha256 diferente de `c2140972d271a12d…` e de `810561d736c68439…`, cabeçalho com três imagens: 16×16, 32×32 e 48×48. Prova: leitura do cabeçalho e extração da 16×16 para PNG mostrando a moeda com o "F".
- [x] 3. Contraste de pelo menos 3:1 (fórmula da WCAG, cores escritas no SVG) entre cada cor do símbolo e a cor sobre a qual ela está desenhada (inclusive o "F" sobre a moeda). Referência: branco sobre `#3b5bdb` = 5.67:1.
- [x] 4. `index.html` continua declarando os dois ícones (ICO com `sizes="16x16 32x32 48x48"`, SVG com `type="image/svg+xml"`), agora com um parâmetro de versão no `href` (ex.: `favicon.svg?v=2`, `favicon.ico?v=2`) para o navegador não continuar mostrando o ícone antigo guardado em cache. Com a stack no ar, `GET http://localhost/favicon.svg?v=2` e `/favicon.ico?v=2` respondem 200 com o sha256 dos arquivos do repositório, e o `index.html` servido traz os `href` versionados.
- [x] 5. O `.mark` do menu lateral mostra o mesmo símbolo do `favicon.svg` (mesma moeda com "F", mesmas formas e cores; o "F" é forma, não texto): em `main-layout.spec.ts`, o texto do `.mark` é vazio e ele contém o símbolo. Não regressão: continua 34×34, com `aria-hidden="true"`, e visível com o menu recolhido.
- [x] 6. O `.mark` da tela de login (`login.html`) mostra o mesmo símbolo do `favicon.svg` (moeda com "F"): em `login.spec.ts`, o texto do `.mark` é vazio e ele contém o símbolo. Não regressão: continua 44×44, com `aria-hidden="true"`.

Ordem do menu:

- [x] 7. Menu lateral, para quem vê tudo: Cadastros, Relatórios, Configurações, Sobre, depois de Resumo e Lançamentos. Teste em `main-layout.spec.ts`: `sectionTitles` igual a `['Cadastros', 'Relatórios', 'Configurações', 'Sobre']`.
- [x] 8. Painel "Mais": `sheetSectionTitles` igual à mesma lista, com Categorias logo abaixo de Cadastros e Relatórios - Lançamentos logo abaixo de Relatórios.
- [x] 9. Não regressão: sem `TRANSACTION_REPORTS/VIEW` a seção Relatórios some no menu e no painel; sem `CATEGORIES/VIEW`, some Cadastros. O menu recolhido mantém `title`/`aria-label` "Relatórios - Lançamentos". Os testes existentes passam com as listas ajustadas só na ordem.
- [x] 10. `resolveEntryRoute` segue `DASHBOARD → TRANSACTIONS → CATEGORIES → TRANSACTION_REPORTS → USERS → PROFILES → AUDIT → DOCUMENTATION → RELEASE_NOTES`. Teste em `entry-route.spec.ts`: perfil com `CATEGORIES` e `TRANSACTION_REPORTS` (sem Resumo nem Lançamentos) entra em `/categories`; perfil só com `TRANSACTION_REPORTS` continua entrando em `/transaction-reports`.
- [x] 11. `PROFILE_SCREENS` segue a mesma ordem, e o cadastro e o Detalhe de Perfis mostram Categorias antes de Relatórios - Lançamentos (teste da tela de Perfis).

Textos publicados:

- [x] 12. Central (`OverviewContent`): "Como navegar" lista Cadastros antes de Relatórios; o painel Mais diz "(Cadastros, Relatórios, Configurações e Sobre)"; a tela de entrada cita "Resumo, Lançamentos, Categorias, Relatórios - Lançamentos, Usuários, Perfis, Auditoria, Documentação e Novidades por versão". `ProfilesAreaContent` lista as linhas da matriz na nova ordem, com Relatórios - Lançamentos. `DocumentationContentTest` cobre as afirmações novas.
- [x] 13. Novidades, bloco `1.0.3`: o item "Ícone da guia:" é reescrito (sem item novo) para dizer que a guia do navegador, o topo do menu lateral e a tela de entrada (login) mostram a marca do FinanceOS, uma moeda com a letra F; não cita mais "carteira". `ReleaseNotesContentTest` é ajustado; "Relatório de lançamentos" continua verdadeiro. Textos novos passam por `.claude/skills/pipeline/revisar-textos/SKILL.md`.
- [x] 14. As duas varreduras de acentuação de `knowledge/architecture.md` continuam vazias, e a de recursos externos de `knowledge/frontend-ui.md` também (com `frontend/public` fora dela, como hoje).

## Fora de escopo

- A ordem das áreas dentro da Central de Documentação, que não é declarada como "ordem do menu".
- A barra inferior do celular (Resumo, Lançamentos, +, Mais).
- Ícones de PWA (`manifest`, `apple-touch-icon`), inexistentes hoje.
- Permissão, rota ou back-end além dos textos da Central e de Novidades.

## Decisões

- 2026-10-31 — PA-1: o símbolo é uma moeda ou carteira estilizada, só com formas, sobre o fundo `#3b5bdb` de cantos arredondados, que continua; contraste ≥ 3:1 e ICO 16/32/48 px (critérios 1-3).
- 2026-10-31 — PA-2: o `.mark` do menu lateral acompanha o ícone e passa a usar o mesmo símbolo, deixando a marca única (critérios 5 e 13).
- 2026-10-31 — O usuário confirmou os efeitos da nova ordem: a tela de entrada depois do login (`entry-route.ts`) e a matriz/Detalhe de Perfis também põem Cadastros antes de Relatórios (critérios 10 e 11).
- 2026-10-31 — PA-3: a marca "F" da tela de login (`.mark` 44×44 de `login.html`) também troca para o símbolo de moeda/carteira: marca única em guia, menu lateral e login (critérios 6 e 13).
- 2026-10-31 — Ajuste pós-validação manual (pedido do usuário, textual: "o icone da Guia ainda não mudou, e eu prefiro um icone mais relacionado a dinheiro, uma moeda talvez e faltou o F"): (a) o símbolo deixa de ser a carteira e passa a ser uma **moeda com a letra "F"** no centro, mantendo o fundo `#3b5bdb` arredondado e a marca única em guia, menu lateral e login (critérios 1-3, 5, 6 e 13); (b) na guia do usuário ainda aparecia um ícone antigo (o logo do Angular), sinal de cache de favicon do navegador: o `index.html` passa a versionar o `href` dos ícones (`?v=2`) para forçar o navegador a buscar o novo (critério 4).

## Referências

- Issue: https://github.com/thiagodjlz/financeos/issues/120
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `auth-and-permissions.md`, `frontend-ui.md`, `documentation.md`, `transactions.md`
- Antecedente: `specs/117-*/spec.md` (critério 10, DEC-6)
- Código conferido em `origin/v1.0.3`: favicon, `index.html`, `main-layout`, `login`, `entry-route.ts`, `profile-screens.ts`, `OverviewContent`, `ProfilesAreaContent`, `ReleaseNotesContent`
