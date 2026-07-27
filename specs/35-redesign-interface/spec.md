---
issue: 35
url: https://github.com/thiagodjlz/financeos/issues/35
title: "Mudança de desing"
slug: redesign-interface
domains: [auth, users, categories, transactions, dashboard]
stage: pr-open
branch: feature/issue-35-redesign-interface
created: 2026-07-27
---

# Mudanca de design

## Historia

Como usuario do FinanceOS, quero que todas as telas adotem o novo design de referencia (paleta em `oklch`, tipografia Inter, cards com sombra, sidebar em trilho de icones, grafico real de evolucao anual e switches na matriz de permissoes), para que o sistema tenha uma aparencia consistente e moderna sem que nenhuma regra de negocio ou funcionalidade existente pare de funcionar.

## Contexto

A issue tem duas linhas: um link para um projeto de design do Claude (`FinanceOS Redesign.dc.html`) e a instrucao "Altere o desing de acordo com o link acima". Sem labels e sem comentarios.

**O design agora esta disponivel localmente** em `specs/35-redesign-interface/design/FinanceOS-Redesign.dc.html` — esse arquivo e a **fonte da verdade visual** desta issue. Ele e um mockup navegavel com 7 telas (Login, Resumo, Lancamentos, Categorias, Usuarios, Perfis e uma tela "Notas de design" que documenta os tokens). Os estilos estao inline (`style="..."`) e os estilos compartilhados ficam em `renderVals()`, dentro do `<script type="text/x-dc">` no fim do arquivo (`inputStyle`, `primaryBtnStyle`, `ghostBtnStyle`, `ghostSmBtnStyle`, `dangerSmBtnStyle`, `thStyle`, `tdStyle`, `pillStyle`, `switchStyle`, `knobStyle`, `sidebarStyle`, `navBtnStyle`). Todo valor visual usado nesta spec foi extraido de la.

### Tokens extraidos do mockup

| Token | Valor | Origem no arquivo |
|---|---|---|
| Fundo da aplicacao | `oklch(97.3% 0.006 80)` | wrapper raiz + "Notas de design" |
| Superficie (cards/tabelas/inputs) | `#FFFFFF` | cards de todas as telas |
| Superficie do card de login | `oklch(99% 0.002 90)`; input do login `oklch(98.5% 0.003 90)` | tela de Login |
| Sidebar | `oklch(21% 0.02 260)` | `sidebarStyle` |
| Acento / acoes | `oklch(56% 0.16 262)` | `accent` em `renderVals()` |
| Texto principal | `oklch(23% 0.012 80)` | wrapper raiz |
| Texto secundario | `oklch(48% 0.014 80)` | `thStyle`, legendas |
| Texto de label de formulario | `oklch(40% 0.014 80)` | `<label>` de todas as telas |
| Borda de card | `oklch(91% 0.008 80)` | cards |
| Borda de input/botao ghost | `oklch(88% 0.008 80)` | `inputStyle`, `ghostBtnStyle` |
| Linhas de tabela | `th` `oklch(93% 0.008 80)`, `td` `oklch(94% 0.008 80)` | `thStyle`/`tdStyle` |
| Receita | `oklch(56% 0.13 155)`; pill `oklch(93% 0.05 155)` / texto `oklch(38% 0.12 155)`; valor em tabela `oklch(42% 0.12 155)` | "Notas de design", `pillStyle` |
| Despesa | `oklch(58% 0.17 25)`; pill `oklch(94% 0.06 25)` / texto `oklch(42% 0.17 25)`; valor em tabela `oklch(48% 0.16 25)` | idem |
| Pendente | `oklch(72% 0.14 80)`; pill `oklch(94% 0.06 80)` / texto `oklch(45% 0.13 80)` | idem |
| Saldo | `oklch(58% 0.13 230)` | idem |
| Neutro (pill "Inativo") | fundo `oklch(93% 0.01 80)` / texto `oklch(45% 0.014 80)` | `pillStyle` |
| Sombra padrao | `0 8px 24px oklch(30% 0.02 80 / 6%)` | cards |
| Sombra do card de login | `0 20px 50px oklch(30% 0.02 80 / 10%)` | Login |
| Sombra da sidebar expandida | `10px 0 30px oklch(20% 0.02 260 / 30%)` | `sidebarStyle` |
| Raios | 10px inputs/botoes, 8px botoes pequenos e pills tonais, 14px cards, 16px card de login, 999px status pill/switch | `inputStyle`, `ghostSmBtnStyle`, cards |
| Tipografia | Inter 400/500/600/700/800; titulo de pagina 26-30px/800; titulo de painel 15.5-16px/700; corpo/tabela 13.5-14px/400-600; `th` 11.5px/700 uppercase | "Notas de design" |
| Densidade de tabela | `th` padding `0 12px 12px`; `td` padding `14px 12px` | `thStyle`/`tdStyle` |
| Botoes | primario/ghost `min-height:42px`, radius 10px, 14px/700; small `min-height:32px`, padding `0 12px`, radius 8px, 12.5px/600 | `primaryBtnStyle`, `ghostSmBtnStyle`, `dangerSmBtnStyle` |
| Sidebar | 76px colapsada -> 236px no hover, `position:fixed`, `z-index:50`, `transition: width 0.18s ease`, padding `24px 18px`; item ativo `oklch(32% 0.05 262)` + texto branco, inativo `oklch(80% 0.02 260)`, radius 10px, padding `11px 13px`, gap 14px | `sidebarStyle`, `navBtn()` |
| Switch de permissao | trilho 38x22 radius 999 (`accent` ligado / `oklch(90% 0.008 80)` desligado), knob 16px branco com `0 1px 3px rgb(0 0 0 / 20%)`, transicao 0.15s | `switchStyle`/`knobStyle` |
| Grafico | `viewBox 0 0 840 210`, barras 13px (gap 3px) rx 2.5, linha de saldo stroke 2.5 com pontos r 3.5 brancos, rotulos dos meses em `y=205` font-size 11 | painel "Evolucao anual" |

### Mapa telas -> codigo

| Tela do mockup | Arquivos do app |
|---|---|
| Login | `frontend/src/app/features/auth/login/` |
| Resumo (Dashboard) | `frontend/src/app/features/dashboard/` |
| Lancamentos | `frontend/src/app/features/transactions/` |
| Categorias | `frontend/src/app/features/categories/` |
| Usuarios | `frontend/src/app/features/users/` |
| Perfis | `frontend/src/app/features/profiles/` |
| Shell/sidebar | `frontend/src/app/layout/main-layout/` |
| Tokens globais | `frontend/src/styles.scss` (+ `frontend/src/app/app.scss`) |

### Estado atual da interface

- Tema atual em `frontend/src/styles.scss` (275 linhas) e `app.scss`: cores hex hardcoded (`#f4f1ea` fundo, `#fffdf8` painel, `#2f7d62` primario, `#b84a3f` perigo), **sem custom properties CSS**, fonte `Inter` apenas como nome na stack (nao ha `@font-face` nem link externo — hoje cai no fallback do sistema).
- Utilitarios globais ja consolidados: `.panel`, `.panel-heading`, `.form-panel`, `.content-grid`, `.primary-button`/`.ghost-button`/`.danger-button`, `.row-actions`, `table`/`table.fixed-layout`, `.modal-backdrop`/`.modal-card`/`.modal-actions`, `.status-bar`, `.status-pill`, `.empty-state`, breakpoints em 680px e 1080px.
- Sem biblioteca de icones ou de UI nas dependencias; icone hoje e glifo unicode (`&#9776;`, `&#9881;`, `&#9099;`).
- Assets estaticos sao servidos hoje de `frontend/public/` (unica entrada `assets` do `angular.json`). A pasta `frontend/src/assets/fonts/` **ja foi criada e versionada** com os arquivos da Inter (`inter-latin.woff2`, `inter-latin-ext.woff2` e um `README.md` com origem, tamanhos e `unicode-range`), mas ainda **nao ha entrada correspondente no `angular.json`** nem `@font-face` em `styles.scss` — e isso que esta issue precisa ligar.
- `GET /api/dashboard/summary` **ja retorna `monthlyEvolution` com os 12 meses do ano** (`{year, month, income, expense, balance}`, zero-preenchido) — hoje o frontend renderiza isso como uma lista de barras binarias (0% ou 100%). O grafico do mockup e alimentado por esse mesmo campo, **sem endpoint novo**.

### Regras existentes que restringem o redesign

- **Nenhuma regra de negocio muda.** Redesign e camada de apresentacao: validacao e autorizacao continuam no backend (`accessControl.require(Screen, Action)` + Bean Validation) e o frontend so espelha (CLAUDE.md). Espera-se **zero alteracao em `backend/`**.
- Comportamentos que precisam sobreviver (ver `knowledge/architecture.md`, `categories.md`, `users.md`, `transactions.md`, `auth-and-permissions.md`, `dashboard.md`):
  - **Edicao inline** em Lancamentos, Categorias e Usuarios: uma linha por vez, "Salvar"/"Sair", modal "Deseja sair sem salvar?", coluna de acoes com largura fixa e `table.fixed-layout` para nenhuma coluna mudar de largura ao entrar em edicao (#31).
  - **Botao "Cancelar"** dos formularios: `type="button"`, **nunca dispara HTTP**; estagio unico em Lancamentos/Categorias/Usuarios, dois estagios em Perfis (#28/#31).
  - **Menu lateral**: visibilidade por `authService.can(screen, 'VIEW')`, grupo "Configuracoes" com Usuarios e Perfis, clique em grupo colapsado expande e abre o grupo **sem navegar** (#33).
  - **Resumo**: ordem dos 4 cards (Receitas, Despesas, Pendente, Saldo), painel "Detalhamento" com "Receitas" e "Despesas" empilhadas e estado vazio "Sem dados no periodo", recarga automatica ao trocar Ano/Mes via `(change)` nativo.
  - **Erros**: faixa `.status-bar` no topo, legendas de validacao por campo (`violations[]` do 400) e, em Usuarios, erro por campo na linha em edicao.
  - **Todo texto de UI em portugues.**

### Divergencias entre o mockup e o app atual (registradas, nao assumidas)

| # | Divergencia | Como esta spec resolve |
|---|---|---|
| D1 | O mockup tem navegacao **plana** (Resumo, Lancamentos, Categorias, Usuarios, Perfis); o app tem os grupos "Cadastros" (so Categoria) e "Configuracoes" (Usuarios, Perfis). | Pela Decisao 2, o mockup prevalece **exceto** em Usuarios/Perfis: Categorias vira item de primeiro nivel e o grupo "Cadastros" deixa de existir; o grupo "Configuracoes" permanece. |
| D2 | O mockup expande a sidebar **so no hover** (`onMouseEnter`/`onMouseLeave`), sem botao de minimizar e sem alternativa por teclado. | O trilho por hover substitui o toggle (Decisao 2). Para nao regredir o acesso por teclado que existe hoje (botao real), a expansao tambem ocorre em `:focus-within` e os botoes colapsados mantem `title`/`aria-label` — **extensao de comportamento nao coberta pelo mockup**, registrada aqui de proposito. |
| D3 | O mockup tem um item de menu "Notas de design". | Nao vira tela do sistema (Decisao 2) — e so referencia de tokens. |
| D4 | O mockup **nao desenha** a linha de tabela em modo de edicao inline nem o modal "Deseja sair sem salvar?". | O comportamento e mantido integralmente; a linha em edicao e o modal reutilizam os tokens do mockup (`inputStyle`, botoes small, card branco/radius 14/sombra padrao). Nenhuma aparencia nova e inventada alem dessa reutilizacao. |
| D5 | O formulario de Categorias do mockup tem Nome, Tipo, Cor e Situacao — **nao tem o campo "Icone"** que existe hoje. | O campo "Icone" **permanece** (remover campo e mudanca funcional, fora de escopo) e adota os mesmos tokens dos demais inputs. |
| D6 | O mockup pinta uma bolinha de cor antes do nome da categoria assumindo que toda categoria tem cor; no app `Category.color` pode ser `null`. | Com `color` nulo a bolinha simplesmente **nao e renderizada** (nenhuma cor default e inventada). |
| D7 | Os rotulos do mockup usam acentuacao ("Lancamentos" -> "Lançamentos", "Situacao" -> "Situação"); os textos do app hoje sao sem acento. | A grafia atual dos textos do app e **mantida** — esta issue e visual; mudanca de acentuacao seria alteracao de conteudo e fica fora de escopo. |
| D8 | O mockup usa `<div onClick>` como switch de permissao, sem semantica acessivel. | A semantica funcional continua sendo um controle de formulario real (checkbox nativo estilizado ou `role="switch"` com `aria-checked`), operavel por teclado e com rotulo acessivel por celula; a **aparencia** e a do mockup. |
| D9 | O mockup usa `<link>` para Google Fonts. | Substituido por Inter self-hosted (Decisao 3): nenhum recurso externo. |
| D10 | O mockup mostra o layout de Perfis com o formulario largo a esquerda e a lista de perfis (320px) a direita — invertido em relacao ao `.profiles-grid` atual. | Segue o mockup (Decisao 2). |

## Decisoes

- **2026-07-27 — Design disponivel localmente.** O artefato foi baixado para `specs/35-redesign-interface/design/FinanceOS-Redesign.dc.html` e e a fonte da verdade visual desta issue; nenhum valor visual pode ser inventado fora dele.
- **2026-07-27 — Seguir o mockup a risca, inclusive nas mudancas estruturais, com uma unica excecao.** A excecao e o menu lateral: **Usuarios e Perfis continuam agrupados dentro de "Configuracoes"** (comportamento entregue na issue #33). Em consequencia: (a) a sidebar vira trilho de icones de 76px que expande para 236px no hover e **sobrepoe** o conteudo (`position: fixed` + `z-index`, `main` com `margin-left: 76px` fixo), substituindo o toggle de minimizar; (b) a navegacao mantem o grupo "Configuracoes" funcionando tanto colapsado quanto expandido; (c) o Resumo ganha o grafico SVG real de evolucao anual (barras receita/despesa + linha de saldo, 12 meses) com dados reais do backend; (d) Perfis troca os checkboxes da matriz por switches, com a mesma semantica; (e) a tela "Notas de design" **nao** vira tela do sistema.
- **2026-07-27 — Fonte Inter self-hosted.** Os arquivos `.woff2` ficam em `frontend/src/assets/fonts/` e sao declarados via `@font-face` em `styles.scss`. Sem dependencia npm nova e **sem** `<link>` para Google Fonts ou qualquer CDN externo — o app roda em Docker local e deve funcionar offline. Sao **2 arquivos de fonte variavel** (subsets `latin` e `latin-ext`), cada um cobrindo todos os pesos de 400 a 800 — nao um arquivo por peso (ver `frontend/src/assets/fonts/README.md`).
- **2026-07-27 — Em conflito com os padroes visuais das issues #28/#31, o design prevalece.** Onde o mockup mostrar outra apresentacao para o "Cancelar" dos formularios (ghost, nao vermelho) ou para os botoes de linha, vale o mockup. Isso e estritamente visual/UX: **nenhuma regra de negocio, validacao de back-end ou comportamento de HTTP muda por causa disso** (o "Cancelar" continua sem disparar requisicao, a edicao inline continua existindo).
- **2026-07-27 — Tema unico, sem dark mode.** O mockup nao define tema escuro; nao ha seletor de tema nem suporte a `prefers-color-scheme` nesta issue.

## Criterios de aceite

### Fundacao (tokens e fonte)

- [x] 1. `frontend/src/styles.scss` declara em `:root` uma custom property CSS para **cada** valor da tabela "Tokens extraidos do mockup" (fundo, superficie, sidebar, acento, texto, texto secundario, texto de label, bordas de card/input, linhas de tabela, receita/despesa/pendente/saldo com suas variantes tonais, neutro, sombras, raios 8/10/14/16/999). Verificavel: abrir o DevTools em `http://localhost`, inspecionar `:root` e confirmar que o token de acento computa `oklch(56% 0.16 262)` e o de sidebar `oklch(21% 0.02 260)`.
- [x] 2. Os estilos de tela consomem os tokens em vez de literais: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` nao retorna nenhuma cor literal (as unicas cores literais do frontend ficam no bloco de tokens de `styles.scss`); valores de **dado**, como a cor default do input `type="color"` de Categorias, nao contam como tema.
- [x] 3. Inter e self-hosted: os arquivos `.woff2` da fonte variavel Inter (cada um cobrindo os pesos 400 a 800) estao em `frontend/src/assets/fonts/` — `inter-latin.woff2` e `inter-latin-ext.woff2` —, `styles.scss` tem um `@font-face` **por subset** (`font-family: 'Inter'`, `font-weight: 400 800`, `font-display: swap` e o `unicode-range` do subset conforme o `README.md` da pasta) e `angular.json` inclui essa pasta na lista `assets` (hoje so ha `public/`). Verificavel: `curl -I http://localhost/assets/fonts/inter-latin.woff2` e `curl -I http://localhost/assets/fonts/inter-latin-ext.woff2` respondem `200`.
- [x] 4. Nenhum recurso externo e carregado: `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src` nao retorna nenhum `<link>`/`@import` de fonte ou CDN (as unicas ocorrencias aceitaveis sao as URLs de documentacao no `frontend/src/assets/fonts/README.md`, que nao sao recurso carregado), e a aba Network do DevTools em `http://localhost` nao mostra requisicao para dominio fora de `localhost` ao abrir qualquer tela.
- [x] 5. A fonte esta realmente aplicada: no console do DevTools, `document.fonts.check('700 14px Inter')` retorna `true` e o `font-family` computado do `body` comeca por `Inter`.

### Shell e menu lateral

- [x] 6. A sidebar e um trilho fixo: largura 76px em repouso, 236px com o ponteiro sobre ela, `position: fixed` com `z-index` acima do conteudo, fundo `oklch(21% 0.02 260)`, padding `24px 18px` e transicao de largura de 0.18s; expandida ganha a sombra `10px 0 30px oklch(20% 0.02 260 / 30%)`.
- [x] 7. A sidebar **sobrepoe** o conteudo: o `margin-left` do container principal permanece 76px tanto com a sidebar recolhida quanto expandida (medido no DevTools), ou seja, o conteudo nao se desloca ao expandir.
- [x] 8. O toggle de minimizar deixa de existir: `document.querySelector('.collapse-toggle')` retorna `null` em `http://localhost` e nao ha nenhum botao de recolher/expandir no DOM da sidebar.
- [x] 9. Cada item de navegacao tem o icone SVG inline de 20px (`stroke="currentColor"`, `stroke-width="1.8"`) exatamente com os `path`/`rect`/`circle` do mockup para Resumo, Lancamentos, Categorias, Usuarios, Perfis e "Sair"; o item ativo tem fundo `oklch(32% 0.05 262)` e texto branco, os inativos `oklch(80% 0.02 260)`, todos com radius 10px e padding `11px 13px`.
- [x] 10. A navegacao final e: Resumo, Lancamentos, **Categorias como item de primeiro nivel** (o grupo "Cadastros" nao existe mais) e o grupo **"Configuracoes"** com Usuarios e Perfis. Nao existe item "Notas de design".
- [x] 11. O grupo "Configuracoes" funciona nos dois estados: com a sidebar recolhida, clicar nele **expande a sidebar e abre o grupo sem navegar** (a URL nao muda); com a sidebar expandida, clicar alterna abrir/fechar os subitens.
- [x] 12. A visibilidade por permissao e preservada: um usuario sem `VIEW` de USERS e sem `VIEW` de PROFILES nao ve o grupo "Configuracoes"; com apenas um dos dois, ve o grupo com apenas o subitem permitido (validavel no `main-layout.spec.ts` existente, atualizado so nos seletores).
- [x] 13. Acessibilidade do trilho (extensao registrada em D2): navegando so pelo teclado (Tab), ao primeiro item da sidebar receber foco a sidebar expande (`:focus-within`) e cada botao mantem `title`/`aria-label` em portugues quando recolhido.
- [x] 14. O rodape da sidebar (nome do usuario logado + `FinanceOS · v<versao>`) e os rotulos textuais so aparecem com a sidebar expandida (fade de opacidade), e o botao "Sair" tem borda `oklch(38% 0.02 260)` e continua deslogando e redirecionando para `/login`.

### Telas

- [x] 15. **Login** (`/login`): card de `min(380px, 100%)` com radius 16px, fundo `oklch(99% 0.002 90)`, borda `oklch(91% 0.008 80)`, sombra `0 20px 50px oklch(30% 0.02 80 / 10%)` e padding 32px; marca "F" de 44px, radius 12px, fundo acento; campos com radius 10px, padding `12px 14px` e fundo `oklch(98.5% 0.003 90)`; botao "Entrar" acento, largura total, 14.5px/700; rodape `FinanceOS · v<versao>` em 12px. Com credencial invalida, a faixa de erro continua sendo exibida, legivel no tema novo.
- [x] 16. **Resumo** (`/dashboard`) — cabecalho: linha "Painel financeiro" em 12.5px/700 uppercase com `letter-spacing: 0.04em` na cor secundaria, titulo `<mes> <ano>` em 30px/800, e os controles Ano (input number) e Mes (select) a direita com radius 10px e padding `10px 12px`; trocar Ano ou Mes continua recarregando o resumo via `(change)` (uma unica chamada a `GET /api/dashboard/summary` por alteracao, visivel na aba Network).
- [x] 17. **Resumo** — os 4 cards continuam na ordem Receitas, Despesas, Pendentes, Saldo, em grid de 4 colunas com gap 18px, cada um com fundo branco, borda `oklch(91% 0.008 80)`, radius 14px, padding 20px, sombra padrao, icone de 34px em quadro tonal radius 9px na cor semantica do card (verde/vermelho/amarelo/azul do mockup), rotulo 13px/700 secundario e valor 25px/800.
- [x] 18. **Resumo** — o painel "Evolucao anual" renderiza um `<svg viewBox="0 0 840 210">` com, para cada um dos 12 meses: uma barra de receita `oklch(56% 0.13 155)` e uma de despesa `oklch(58% 0.17 25)` de 13px de largura, `rx="2.5"`, com alturas proporcionais ao maior valor do ano; uma `polyline` de saldo `oklch(58% 0.13 230)` com `stroke-width="2.5"` e um `circle` branco de `r="3.5"` por mes; e o rotulo do mes (Jan..Dez) em `y="205"`, font-size 11. O cabecalho do painel traz a legenda Receita / Despesa / Saldo com os marcadores coloridos do mockup.
- [x] 19. **Resumo** — o grafico usa dados reais: os valores vem de `summary().monthlyEvolution` retornado por `GET /api/dashboard/summary` (nenhum endpoint novo, nenhum dado mockado no frontend); trocar o Ano redesenha o grafico com a serie do novo ano; um ano sem lancamentos renderiza os 12 rotulos com barras de altura 0 e sem erro no console.
- [x] 20. **Resumo** — painel "Detalhamento" (coluna de 360px a direita do grafico): cabecalhos tonais empilhados "Receitas" (fundo `oklch(94% 0.04 155)`, texto `oklch(38% 0.12 155)`) e "Despesas" (fundo `oklch(95% 0.05 25)`, texto `oklch(42% 0.15 25)`) em 12.5px/800 uppercase com a contagem a direita; cada categoria exibe nome, valor e uma barra de 6px radius 999 proporcional ao maior valor da propria secao; o estado vazio "Sem dados no periodo" e o rodape "Total" continuam existindo.
- [x] 21. **Lancamentos** (`/transactions`): grid de `340px` (formulario) + coluna flexivel (tabela) com gap 20px, ambos em card branco radius 14px com sombra padrao; o formulario mantem todos os campos atuais (Data, Descricao, Valor, Tipo, Status condicional, Categoria) com o input do tema; "Salvar" e primario acento (42px) e "Cancelar" e **ghost** (borda `oklch(88% 0.008 80)`, fundo branco), permanecendo `type="button"` e **sem disparar HTTP** (verificavel pelo `expectNone` ja existente em `transactions.spec.ts`).
- [x] 22. **Lancamentos** — tabela no padrao do mockup: `th` em 11.5px/700 uppercase, cor secundaria, padding `0 12px 12px`, borda inferior `oklch(93% 0.008 80)`; `td` com padding `14px 12px`, 13.5px e borda inferior `oklch(94% 0.008 80)`; Status como pill radius 999 padding `4px 10px` 12px/700 (verde para "Pago", amarelo para "Pendente"); coluna Valor alinhada a direita em 700, com prefixo `- ` e cor `oklch(48% 0.16 25)` para despesa e `+ ` com `oklch(42% 0.12 155)` para receita; acoes com "Editar" ghost small (32px, radius 8px) e "Cancelar" tonal vermelho (`oklch(94% 0.06 25)` / `oklch(42% 0.17 25)`).
- [x] 23. **Edicao inline preservada** (issue #31) nas tres telas (Lancamentos, Categorias, Usuarios): "Editar" abre a linha em edicao, apenas uma por vez (os demais "Editar" ficam desabilitados), "Salvar" faz `PUT` e recarrega a lista, "Sair" com alteracao pendente abre o modal "Deseja sair sem salvar?" e sem alteracao sai sem nenhuma requisicao. Medido no DevTools, **entrar em modo de edicao nao altera a largura de nenhuma coluna** nem a altura da coluna de acoes.
- [x] 24. **Categorias** (`/categories`): formulario de 340px com Nome, Tipo, Cor, **Icone** (preservado, ver D5) e Situacao; tabela com bolinha de 10px radius 999 na cor da categoria antes do nome (omitida quando `color` e nulo, ver D6), coluna Tipo, pill de Situacao (verde "Ativo" / neutro `oklch(93% 0.01 80)` "Inativo") e "Editar" ghost small.
- [x] 25. **Usuarios** (`/users`): formulario de 340px (Nome, E-mail, Senha, Perfil) + tabela com Nome, E-mail, Perfil, Status (pill) e acoes "Editar"/"Desativar" como ghost small; as mensagens de validacao por campo (do `violations[]` do 400) e o erro por campo na linha em edicao continuam sendo exibidos, legiveis no tema novo.
- [x] 26. **Perfis** (`/profiles`): layout do mockup — formulario largo a esquerda (nome com `max-width: 320px` + matriz de permissoes) e lista de perfis em coluna de 320px a direita, com "Editar" e "Excluir" como ghost small; a matriz mantem as colunas Tela, Ver, Incluir, Alterar, Excluir centralizadas.
- [x] 27. **Perfis** — os checkboxes da matriz viram switches: trilho 38x22 radius 999 (acento quando ligado, `oklch(90% 0.008 80)` quando desligado), knob branco de 16px com sombra `0 1px 3px rgb(0 0 0 / 20%)` deslizando com transicao de 0.15s. A semantica nao muda: clicar (mouse) ou acionar com Espaco/Enter (teclado, controle com foco visivel e rotulo acessivel) alterna a mesma flag, e o `POST`/`PUT` de perfil envia exatamente o mesmo payload de permissoes de hoje (`canView`/`canCreate`/`canEdit`/`canDelete`) — confirmado em `profiles.spec.ts`.
- [x] 28. **Perfis** — o "Cancelar" de dois estagios da issue #28 continua funcionando (com alteracao pendente restaura o snapshot e mantem a edicao; sem alteracao, sai da edicao e limpa), agora com a aparencia ghost do mockup e sem nenhuma requisicao HTTP.
- [x] 29. Componentes globais consistentes entre telas: `.primary-button`/`.ghost-button` com `min-height: 42px`, radius 10px e 14px/700; botoes de linha com `min-height: 32px`, radius 8px, padding `0 12px` e 12.5px/600; `.status-pill` radius 999 com padding `4px 10px` e 12px/700; a faixa `.status-bar` e o `.modal-card` (centralizado, backdrop cobrindo a tela inteira, acima do conteudo) adotam a superficie, o radius e a sombra do tema novo.

### Nao regressao e qualidade

- [x] 30. Nenhum arquivo de backend e alterado: `git status --porcelain` no working tree da branch da feature nao lista nada sob `backend/`, e nenhuma migration `V<n>__*.sql` nova e criada.
- [x] 31. Nenhuma dependencia nova: `git diff frontend/package.json` nao adiciona entradas em `dependencies` nem `devDependencies` (icones sao SVG inline, a fonte e um arquivo local).
- [x] 32. Roteiro funcional manual em `http://localhost`, todos verdes: (a) login com credencial valida entra e com invalida mostra o erro; (b) criar, editar inline e desativar uma Categoria; (c) criar, editar inline e desativar um Usuario; (d) criar, editar inline e cancelar um Lancamento; (e) trocar Ano/Mes no Resumo atualiza cards, grafico e Detalhamento; (f) editar e salvar um Perfil, com o efeito da permissao refletido no menu apos novo login; (g) os "Cancelar" dos formularios nao geram nenhuma requisicao na aba Network.
- [x] 33. `npm test` (frontend) passa com os specs existentes (`categories.spec.ts`, `users.spec.ts`, `profiles.spec.ts`, `transactions.spec.ts`, `main-layout.spec.ts`, `app.spec.ts`); os ajustes sao apenas de seletor/estrutura de DOM (ex.: o teste que hoje clica em `.collapse-toggle` passa a exercitar o novo trilho), **sem afrouxar nenhuma assercao de comportamento** — as chamadas `httpMock.verify()` e `expectNone(() => true)` continuam presentes.
- [x] 34. `npm run build` (frontend) conclui sem erro e sem warning novo de orcamento de CSS/bundle (a fonte self-hosted nao pode estourar os budgets do `angular.json`), e `./mvnw test` (backend) continua verde sem alteracao de codigo.
- [x] 35. Todo texto exibido continua em portugues e nenhum rotulo existente muda de texto por causa do redesign (ver D7); nenhum texto em outro idioma e introduzido.
- [x] 36. Responsividade: nas larguras de viewport 1440px, 1080px e 680px nenhuma tela apresenta rolagem horizontal da pagina (a rolagem interna do wrapper das tabelas e esperada e permitida) nem texto sobreposto/cortado; o grid de 4 cards do Resumo e os grids de duas colunas (formulario + tabela) colapsam para menos colunas em telas estreitas; o trilho de 76px continua sem cobrir o conteudo.
- [x] 37. Contraste minimo de 4.5:1 (medido no DevTools ou Lighthouse) para: texto principal e secundario sobre a superficie branca, texto branco sobre o acento (botao primario), texto dos itens da sidebar sobre `oklch(21% 0.02 260)` e texto de cada status pill sobre seu proprio fundo tonal.

## Fora de escopo

- Qualquer mudanca de regra de negocio, endpoint, DTO, permissao ou migration — esta issue e exclusivamente de apresentacao.
- A tela "Notas de design" do mockup: nao vira tela do sistema.
- Dark mode, seletor de tema ou suporte a `prefers-color-scheme`.
- Novos dados ou novos campos: nada alem do que a API atual ja retorna (o grafico usa `monthlyEvolution`, que ja existe). Remover o campo "Icone" de Categorias tambem fica fora (seria mudanca funcional).
- Mudar a grafia/acentuacao dos textos ja existentes na UI (ver D7).
- Reintroduzir Contas/Cartoes, removidos na issue #20.
- Internacionalizacao / troca de idioma da UI.
- Persistir preferencias visuais do usuario no backend.
- Redesenho mobile-first (drawer, bottom nav): o mockup nao define breakpoints; vale apenas o criterio 36 de nao-regressao de responsividade.

## Pontos em aberto

Nenhum. Os cinco pontos da versao anterior desta spec (design inacessivel, escopo estrutural, dependencias novas, conflito com os padroes de #28/#31 e dark mode) foram resolvidos pelas decisoes registradas acima; as diferencas remanescentes entre mockup e app estao tratadas na tabela "Divergencias" (D1-D10).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/35
- Design (fonte da verdade visual, local): `specs/35-redesign-interface/design/FinanceOS-Redesign.dc.html`
- Design (origem, inacessivel para a esteira): https://claude.ai/design/p/ee4df58e-e221-40e7-8ffa-565ccb43c369?file=FinanceOS+Redesign.dc.html&via=share
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/auth-and-permissions.md`, `knowledge/users.md`, `knowledge/categories.md`, `knowledge/transactions.md`, `knowledge/dashboard.md`
- Codigo consultado: `frontend/src/styles.scss`, `frontend/src/app/app.scss`, `frontend/src/index.html`, `frontend/angular.json`, `frontend/src/assets/fonts/README.md`, `frontend/src/app/core/models.ts`, `frontend/src/app/layout/main-layout/` (`.html`, `.ts`, `.spec.ts`), `frontend/src/app/features/{auth/login,dashboard,transactions,categories,users,profiles}/`
