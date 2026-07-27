# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reiniciada na etapa anterior — ver `docker-report.md`; `docker ps` confirma `financeos-frontend`, `financeos-backend` e `financeos-postgres` no ar).
Branch: `feature/issue-35-redesign-interface` — mudancas ainda **nao commitadas**.

Observacao sobre a verificacao por API: nao foi possivel autenticar em `POST /api/auth/login`. A senha do usuario de desenvolvimento foi rotacionada na migration `V10__rotate_seeded_user_passwords.sql` e **nao existe em nenhum arquivo do repositorio** (so o hash bcrypt). Os endpoints autenticados retornam `401` sem token (confirmado em `GET /api/dashboard/summary?year=2019&month=1` -> `401`), entao os criterios que dependiam de exercitar a API logada foram para o roteiro manual. Nenhum dado foi criado, alterado ou apagado na stack local.

O que foi exercitado direto na stack (sem autenticacao):

- `GET http://localhost/assets/fonts/inter-latin.woff2` -> `200`, `font/woff2`, 48.256 bytes.
- `GET http://localhost/assets/fonts/inter-latin-ext.woff2` -> `200`, `font/woff2`, 85.068 bytes.
- `GET http://localhost/assets/fonts/README.md` -> `200 text/html` (fallback do SPA, o README **nao** e publicado — o glob do `angular.json` e `**/*.woff2`).
- `GET http://localhost/` -> o `<style>` critico inline ja traz os dois `@font-face` e o bloco `:root` completo; nenhum `<link>` para dominio externo.
- Bundles servidos (`styles-DGIXSX3Y.css`, `main-7LNVDVAO.js`, `chunk-UT0TCT5d.js`) inspecionados para confirmar que o CSS que esta **rodando** corresponde ao codigo do working tree.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Token CSS em `:root` para cada valor do mockup | VERIFICADO | `styles.scss:22-107` cobre linha a linha a tabela de tokens; o `:root` servido em `http://localhost/` traz `--accent:oklch(56% .16 262)` e `--sidebar-bg:oklch(21% .02 260)` |
| 2 | Nenhuma cor literal nos `.scss` de `frontend/src/app` | VERIFICADO | `rg "#[0-9a-fA-F]{3,8}\b\|oklch\(\|rgba?\(" frontend/src/app --glob "*.scss"` -> sem saida (exit 1). Ressalva em "Achado fora dos criterios" |
| 3 | Inter self-hosted (2 `@font-face` + `assets` no `angular.json`) | VERIFICADO | `styles.scss:1-20` (`font-weight: 400 800`, `font-display: swap`, `unicode-range` por subset); `angular.json` +entrada `{"glob":"**/*.woff2","input":"src/assets","output":"assets"}`; `curl -I` dos dois `.woff2` -> `200 font/woff2` |
| 4 | Nenhum recurso externo carregado | VERIFICADO | `rg -n "fonts.googleapis\|fonts.gstatic\|https?://" frontend/src --glob '!**/README.md'` -> sem saida; `index.html` servido sem `<link>`/`@import` externo; varredura do `styles.css` e do `main.js` servidos so acha namespaces XML e um link de doc do Angular dentro de string de erro. Ressalva do README registrada abaixo |
| 5 | Fonte realmente aplicada (`document.fonts.check`) | VALIDACAO MANUAL | ver roteiro item 1 — `body{font-family:var(--font-sans)}` e `--font-sans` comeca por `'Inter'` (servido), mas `document.fonts.check` so no console |
| 6 | Trilho fixo 76px -> 236px, sombra, transicao 0.18s | VERIFICADO | `main-layout.scss:6-27` e o CSS **servido** em `chunk-UT0TCT5d.js`: `z-index:50;width:76px;height:100vh;padding:24px 18px;background:var(--sidebar-bg);transition:width .18s ease` e `.sidebar:focus-within{width:236px;box-shadow:var(--shadow-sidebar)}` (idem `.expanded`/`:hover`) |
| 7 | Sidebar sobrepoe o conteudo (`margin-left` fixo 76px) | VERIFICADO | CSS servido: `.workspace{min-width:0;margin-left:76px;padding:34px 40px}` — regra unica, sem variante para o estado expandido; a sidebar e `position:fixed` |
| 8 | Toggle de minimizar deixa de existir | VERIFICADO | `main-layout.spec.ts:113` (`querySelector('.collapse-toggle')` -> `null`, teste verde em `quality-report.md`); `rg "collapse-toggle" frontend/src` so acha o proprio assert |
| 9 | SVG de 20px por item + cores de ativo/inativo | VERIFICADO *(apos correcao)* | Ver detalhamento abaixo da tabela. Reprovado na 1a rodada (icones de Usuarios/Perfis a 18px); a sobrescrita foi removida e o CSS servido pela stack nao contem mais `.nav-children ... svg{width:18px;height:18px}` |
| 10 | Nav: Resumo, Lancamentos, Categorias, grupo Configuracoes | VERIFICADO | `main-layout.spec.ts:107-128` assere os 4 `aria-label` exatamente como `['Resumo','Lancamentos','Categorias','Configuracoes']` (verde); `main-layout.html:18-95` nao tem "Cadastros" nem "Notas de design" |
| 11 | Grupo recolhido expande e abre sem navegar | VERIFICADO | `main-layout.spec.ts:130-148` (`.sidebar.expanded` presente, subitens visiveis, `router.url` inalterado — verde); alternancia com o trilho aberto em `main-layout.ts:50-58` |
| 12 | Visibilidade por permissao preservada | VERIFICADO | `main-layout.spec.ts:53-105` (5 testes: sem permissao, so USERS, so PROFILES, nenhum dos dois, filhos permitidos) — todos verdes |
| 13 | Trilho acessivel por teclado (`:focus-within`, `title`/`aria-label`) | VALIDACAO MANUAL | ver roteiro item 2 — `title`/`aria-label` ja cobertos por `main-layout.spec.ts:117-121`; falta so exercitar a expansao por Tab (`:focus-within` existe no CSS servido) |
| 14 | Rodape/rotulos so com a sidebar expandida; "Sair" funciona | VERIFICADO | `main-layout.scss:102-106,152-190` (fade de opacidade e `height:0` -> `auto`); borda do "Sair" e `var(--sidebar-border)` = `oklch(38% 0.02 260)` (`styles.scss:37`); `logout()` intocado em `main-layout.ts:68-71` (`authService.logout()` + `navigate(['/login'])`) |
| 15 | Login no tema do mockup | VERIFICADO | `login.scss:11-67` bate valor a valor com o mockup (`FinanceOS-Redesign.dc.html:30-48`): `min(380px,100%)`, radius 16, padding 32, `--surface-login`, `--shadow-login`, marca 44px/radius 12/acento, input `12px 14px` com `--surface-login-input`, "Entrar" 14.5px/700 largura total, rodape 12px; faixa de erro segue em `login.html:11` com `login.ts` intocado. Legibilidade confirmada no roteiro item 1 |
| 16 | Resumo — cabecalho e controles Ano/Mes com `(change)` | VERIFICADO | `dashboard.html:1-14` (`eyebrow`, titulo `<mes> <ano>`, `(change)="load()"` nos dois controles), `dashboard.scss:1-34` (12.5px/700 uppercase `letter-spacing:.04em`, titulo 30px/800, controles radius 10 `10px 12px` vindos do input global); `load()` faz exatamente um `refresh()` (`dashboard.ts:89-100` + `dashboard.service.ts:12-16`) |
| 17 | Resumo — 4 cards, grid de 4 colunas, icone tonal | VERIFICADO | `dashboard.html:19-65` e `dashboard.scss:36-98` reproduzem `FinanceOS-Redesign.dc.html:122-149` inclusive nos `path` dos 4 icones e nos pares tonais (verde/vermelho/amarelo/azul); ordem Receitas, Despesas, Pendentes, Saldo preservada |
| 18 | Resumo — `<svg viewBox="0 0 840 210">` + legenda | VERIFICADO | `dashboard.ts:8-83` usa a mesma geometria do mockup (`FinanceOS-Redesign.dc.html:598-618`: `chartTop=15`, `chartBottom=185`, `groupW=840/12`, `barW=13`, `barGap=3`); `dashboard.html:78-114` = mockup linhas 163-173 (`rx="2.5"`, `stroke-width="2.5"`, `r="3.5"`, rotulos em `y="205"` font-size 11); legenda em `dashboard.html:71-75` + `.legend-marker` |
| 19 | Grafico com dados reais; ano vazio sem erro | VALIDACAO MANUAL | ver roteiro item 4 — fonte de dados ja confirmada estaticamente (`dashboard.ts:49` le `summary()?.monthlyEvolution`, `dashboard.service.ts` intocado, nenhum endpoint novo; o backend zera os 12 meses em `DashboardRepository.java:114-117`), falta o ano vazio renderizado sem erro no console |
| 20 | Resumo — painel "Detalhamento" de 360px | VERIFICADO | `dashboard.scss:100-105,175-257` + `dashboard.html:117-161` = mockup linhas 176-190: coluna 360px, cabecalhos tonais `--income-soft-strong`/`--income-on-soft` e `--expense-soft-strong`/`--expense-on-soft-strong` em 12.5px/800 uppercase com contagem a direita, barra de 6px radius 999 proporcional a `maxAmount(type)`, "Sem dados no periodo" e rodape "Total" |
| 21 | Lancamentos — grid 340px e "Cancelar" ghost sem HTTP | VERIFICADO | `.content-grid{grid-template-columns:340px minmax(0,1fr);gap:20px}` (`styles.scss:328-333`), `.panel` radius 14 + `--shadow-card`; `transactions.html:47` e `class="ghost-button" type="button"`; `transactions.spec.ts:157-167` "nao dispara requisicao ao cancelar" com `httpMock.expectNone(() => true)` (verde) |
| 22 | Lancamentos — tabela, pill de Status, Valor com sinal/cor | VERIFICADO | `styles.scss:349-369` (`th` `0 12px 12px`/11.5px/700 uppercase/`--border-th`; `td` `14px 12px`/13.5px/`--border-td`), `.status-pill` radius 999 `4px 10px` 12px/700; `transactions.ts:152-168` (`pill-income` para Pago, `pill-pending` para Pendente; prefixo `+ `/`- `); `transactions.scss:25-36` (`--income-amount`/`--expense-amount`); "Cancelar" de linha usa `.danger-button` = `--expense-soft`/`--expense-on-soft` (= `dangerSmBtnStyle` do mockup) dentro de `.row-actions` (32px, radius 8) |
| 23 | Edicao inline preservada nas 3 telas, sem mudar largura | VALIDACAO MANUAL | ver roteiro item 5 — comportamento coberto por `categories.spec.ts:152-246` e `users.spec.ts:193-345` (verdes; Lancamentos nao tem teste de edicao inline, mas `transactions.ts` so ganhou 2 helpers de apresentacao e a estrutura do `.html` foi preservada); a **medicao de largura/altura no DevTools** e o risco principal da T23 e nao foi feita |
| 24 | Categorias — Icone preservado, bolinha condicional, pill | VERIFICADO | `categories.html:21-37` (Nome, Tipo, Cor, **Icone**, Situacao), `:70` bolinha so com `*ngIf="category.color"` (D6), `:76-78` pill verde/neutro; `categories.scss:18-29` (dot 10px radius 999), "Editar" ghost em `.row-actions` |
| 25 | Usuarios — formulario, pills, acoes e validacao por campo | VERIFICADO | `users.html:9-70` e `:96-181` (pill de Status, "Editar"/"Desativar" ghost, `field-error` no formulario e na linha em edicao); `users.scss:7-24` (`--expense` na borda invalida, `--expense-on-soft` 12px/600 na legenda); `users.spec.ts:298-327` (violations por campo e 409) verdes |
| 26 | Perfis — layout invertido (formulario a esquerda, lista 320px) | VERIFICADO | `profiles.scss:1-14` (`minmax(0,1fr) 320px`, `.name-field{max-width:320px}`), `profiles.html:5-86` (matriz a esquerda com `th.perm-col`/`.checkbox-cell` centralizados; lista a direita com "Editar"/"Excluir" em `.row-actions` ghost small) |
| 27 | Perfis — switches com a mesma semantica e payload | VALIDACAO MANUAL | ver roteiro item 7 — aparencia conferida (`profiles.scss:29-76`: 38x22 radius 999, `--accent`/`--switch-off`, knob 16px `--shadow-knob`, `left 3px -> 19px` em 0.15s, `:focus-visible`); payload garantido porque `profiles.ts` **nao foi tocado** e `profiles.spec.ts` (10 testes, checkbox como controle real) segue intacto e verde. Falta a operacao por teclado — **ver o alerta sobre a tecla Enter no roteiro** |
| 28 | Perfis — "Cancelar" de dois estagios preservado | VERIFICADO | `profiles.ts` e `profiles.spec.ts` sem nenhuma alteracao no diff; os 6 testes de estagio duplo (`profiles.spec.ts:141-197`, todos com `httpMock.expectNone(() => true)`) verdes; o botao agora e `ghost-button type="button"` (`profiles.html:60`) |
| 29 | Componentes globais consistentes (botoes, pills, bar, modal) | VERIFICADO | `styles.scss:218-268` (42px/radius 10/14px-700), `:392-407` (32px/radius 8/`0 12px`/12.5px-600), `.status-pill` radius 999 `4px 10px` 12px/700, `:409-434` `.modal-backdrop` `position:fixed;inset:0;z-index:200` e `.modal-card` `z-index:201` com `--surface`/`--radius-lg`/`--shadow-modal`. O CSS **servido** confirma `z-index:200`/`:201`, acima do `z-index:50` do trilho, ambos no mesmo contexto de empilhamento raiz (`.app-shell` e `.workspace` nao criam contexto) |
| 30 | Nenhum arquivo de backend alterado, nenhuma migration nova | VERIFICADO | `git status --porcelain` nao lista nenhuma linha sob `backend/` nem nenhum `.sql`; os 24 arquivos modificados sao todos de `frontend/`, mais os untracked `frontend/src/assets/fonts/` e `specs/35-redesign-interface/` |
| 31 | Nenhuma dependencia npm nova | VERIFICADO | `git diff frontend/package.json frontend/package-lock.json` -> vazio |
| 32 | Roteiro funcional manual (a)..(g) verde | VALIDACAO MANUAL | ver roteiro itens 1, 3, 4, 5, 8 e 9 |
| 33 | `npm test` verde com ajuste so de seletor | VERIFICADO | `quality-report.md`: 66 testes em 12 arquivos, verdes. O diff dos specs e so `form button.danger-button` -> `form button.ghost-button` (3 arquivos) e 2 testes do `main-layout.spec.ts`; `afterEach(() => httpMock.verify())` e todos os `expectNone(() => true)` seguem presentes |
| 34 | `npm run build` sem warning de budget e `./mvnw test` verde | VERIFICADO | `quality-report.md` (build em 8.5s, `styles.css` 7.73 kB, nenhum warning de budget; backend 30 testes verdes) e `build-report.md` (os dois `.woff2` no `dist`, README fora do bundle) |
| 35 | Texto em portugues, nenhum rotulo muda de grafia | VERIFICADO | Diff dos `.html`: os unicos textos removidos sao "Cadastros"/"Categoria" (exigido pelo criterio 10) e os glifos `&#9776;`/`&#9881;`/`&#9099;`; os textos novos sao `page-title` (Lancamentos, Categorias, Usuarios, Perfis), legenda Receita/Despesa/Saldo, `aria-label` do grafico e os rotulos ocultos dos switches — todos em portugues e na grafia sem acento ja usada no app (D7) |
| 36 | Responsividade 1440/1080/680 sem rolagem horizontal | VALIDACAO MANUAL | ver roteiro item 10 |
| 37 | Contraste minimo de 4.5:1 | VALIDACAO MANUAL | ver roteiro item 11 |

### Detalhamento do criterio 9 (reprovado na 1a rodada, corrigido e re-verificado)

O que **esta** correto: os seis SVGs de Resumo, Lancamentos, Categorias, Usuarios, Perfis e "Sair" em `main-layout.html:27-108` sao byte a byte os do mockup (`FinanceOS-Redesign.dc.html:70-96`), com `stroke="currentColor"` e `stroke-width="1.8"`; item ativo com `--sidebar-item-active` (`oklch(32% 0.05 262)`) e texto `--surface`, inativos com `--sidebar-text` (`oklch(80% 0.02 260)`), radius 10px e padding `11px 13px` (`main-layout.scss:77-99`).

O que **falta**: o criterio exige o icone de **20px** tambem para "Usuarios" e "Perfis", mas esses dois sao subitens do grupo "Configuracoes" e recebem uma reducao de tamanho nao prevista em lugar nenhum (nem no mockup, nem na spec, nem em `implementation-notes.md`):

```
frontend/src/app/layout/main-layout/main-layout.scss:122-125
  .nav-children button svg { width: 18px; height: 18px; }
```

Confirmado no CSS que esta rodando: `chunk-UT0TCT5d.js` traz `.nav-children[...] button[...] svg[...]{width:18px;height:18px}`. Os atributos do HTML dizem `width="20" height="20"`, mas o CSS sobrescreve. Correcao: remover essas duas declaracoes de `main-layout.scss` (ou registrar a reducao como decisao consciente na spec, o que muda o criterio e nao a implementacao).

Nao conta como falha, por decisao ja registrada em `tasks.md` ("Lacunas") e em `implementation-notes.md`: o icone do **pai** "Configuracoes" nao tem contraparte no mockup (a nav do mockup e plana) e reusa o SVG da tela "Notas de design" (`FinanceOS-Redesign.dc.html:90`), sem inventar desenho novo.

**Correcao aplicada (2026-07-27).** As duas declaracoes foram removidas de `main-layout.scss`. A reducao era apenas reforco visual de aninhamento e nao tinha justificativa funcional: `.nav-children` so e renderizado com `settingsExpanded() && expanded()`, ou seja, exclusivamente com o trilho em 236px — nunca no estado colapsado de 76px —, entao nao havia risco de estouro que os 18px resolvessem. Re-verificado apos `docker compose up -d --build`: o bundle servido pela stack nao contem mais a regra, e o unico tamanho em vigor para os SVGs dos subitens passa a ser o `width="20" height="20"` do HTML. `npm test` seguiu com 66 testes verdes e `npm run build` sem warnings — nenhum teste dependia desse valor. Criterio 9 passa a **VERIFICADO**.

## Achado fora dos criterios

- ~~**Nomes de teste desatualizados.**~~ `categories.spec.ts` e `users.spec.ts` se chamavam "...e Cancelar vermelho" depois de o botao virar ghost. Nenhuma assercao dependia da cor. **Corrigido em 2026-07-27**: renomeados para "...e Cancelar secundario".
- ~~**Cor literal fora do bloco de tokens.**~~ `styles.scss` tinha `::selection{background:oklch(85% 0.06 262)}` fora do `:root`. Nao violava o criterio 2 (cujo comando varre so `frontend/src/app`), mas contrariava a frase "as unicas cores literais do frontend ficam no bloco de tokens de `styles.scss`". **Corrigido em 2026-07-27**: virou o token `--accent-selection` no `:root`, consumido por `var()`, sem mudar o valor renderizado.
- **Ressalva do criterio 4.** `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src` **sem** filtro casa duas linhas de `frontend/src/assets/fonts/README.md` (a origem da fonte e o `curl` usado para baixa-la). Sao URLs de documentacao, nao recurso carregado — e o `angular.json` publica so `**/*.woff2`, entao o README nem vai para o bundle (`build-report.md` confirma). Criterio nao violado.
- **Escopo do commit limpo.** No momento desta verificacao o working tree tem exclusivamente arquivos da feature (24 modificados em `frontend/`) mais os untracked `frontend/src/assets/fonts/` e `specs/35-redesign-interface/`. As alteracoes em `.claude/` e `knowledge/` que apareciam no inicio da sessao nao estao mais no `git status` — nao ha trabalho paralelo a separar na etapa `open-pr`.

## Roteiro de validacao manual

Abra o DevTools antes de comecar (aba Network com "Disable cache" ligado e o Console visivel).

1. **Login e fonte** — abra `http://localhost`. Tente entrar com uma senha errada. Esperado: a faixa de erro aparece no topo do card, em vermelho tonal sobre fundo rosado, com o texto perfeitamente legivel. Entre com a credencial valida (`dev@financeos.local`). Esperado: entra no Resumo. Ainda com a Network aberta, confirme que **nenhuma** requisicao saiu para dominio fora de `localhost` (ordene pela coluna Domain). No Console, rode `document.fonts.check('700 14px Inter')` (esperado `true`) e `getComputedStyle(document.body).fontFamily` (esperado comecar por `Inter`). (criterios 5, 4, 15, 32a)

2. **Trilho lateral** — com o ponteiro longe do trilho, inspecione o `<aside class="sidebar">`. Esperado: largura 76px, so os icones visiveis. Passe o mouse sobre ele. Esperado: expande para 236px em ~0.18s, ganha sombra a direita e os rotulos surgem em fade; **inspecione `.workspace` durante a expansao — `margin-left` continua 76px e o conteudo nao se desloca** (o trilho passa por cima). Tire o mouse e, a partir da barra de enderecos, pressione Tab ate o primeiro botao do trilho receber foco. Esperado: o trilho expande sozinho (`:focus-within`) e o botao focado mostra tooltip/rotulo em portugues. (criterios 6, 7, 13)

3. **Grupo Configuracoes** — com o trilho expandido, clique em "Configuracoes". Esperado: abre os subitens Usuarios/Perfis **sem mudar a URL**; clicar de novo fecha. Navegue por Usuarios e volte: o grupo continua marcado como ativo. (criterio 11)

4. **Resumo, grafico e periodo** — no Resumo, troque o Mes e depois o Ano. Esperado: a cada alteracao **uma unica** chamada `GET /api/dashboard/summary` na Network, e cards, grafico e Detalhamento se atualizam juntos. Agora ponha o Ano em `2019` (ou outro ano sem lancamentos). Esperado: o grafico continua desenhando os 12 rotulos Jan..Dez, todas as barras com altura 0, a linha de saldo reta na base e **nenhum erro vermelho no Console**. Volte ao ano corrente e confirme que a serie redesenha. (criterios 19, 16, 32e)

5. **Edicao inline e larguras de coluna (risco principal)** — em **Categorias**, com o inspetor sobre a `<table class="fixed-layout">`, anote a largura de cada coluna em modo leitura. Clique "Editar" na primeira linha. Esperado: **nenhuma coluna muda de largura**, a altura da coluna de acoes nao "estoura" (os botoes "Salvar" e "Sair" de 32px cabem lado a lado, sem quebrar em duas linhas), os campos Nome/Cor/Icone cabem na celula e os demais "Editar" ficam desabilitados. Altere o Nome e clique "Sair". Esperado: modal "Deseja sair sem salvar?"; "Nao" mantem a edicao, "Sim" descarta e recarrega a lista. Repita em **Usuarios** e em **Lancamentos** — nesta, confira em especial a coluna Valor (130px, precisa caber `- R$ 12.480,00` sem quebrar) e a de acoes (200px, "Salvar" + "Sair"). Aproveite e crie, edite e desative/cancele um registro em cada tela. (criterios 23, 32b, 32c, 32d)

6. **Modal acima do trilho** — com o modal "Deseja sair sem salvar?" aberto, mova o ponteiro sobre a area do trilho. Esperado: o fundo escurecido cobre **tambem** o trilho, o trilho nao aparece por cima do backdrop e o card do modal fica centralizado acima de tudo. (criterio 29)

7. **Switches de Perfis** — em Perfis, clique "Editar" num perfil. Clique num switch com o mouse. Esperado: o trilho fica azul-acento e o knob branco desliza para a direita em ~0.15s. Pressione Tab ate um switch. Esperado: anel de foco visivel em volta do controle. Com o switch focado, pressione **Espaco**. Esperado: alterna o switch. Agora, com o switch focado, pressione **Enter**. Esperado pelo criterio: alterna o switch. **Atencao:** o controle e um `<input type="checkbox">` nativo dentro de um `<form>` com botao de submit — se ao pressionar Enter o formulario for submetido (aparece um `PUT`/`POST` na Network) em vez de alternar a flag, o criterio 27 **nao esta atendido na parte do Enter**; anote e reporte. Por fim salve e confira na Network que o corpo do `PUT` leva `canView`/`canCreate`/`canEdit`/`canDelete` como antes. (criterio 27)

8. **"Cancelar" sem HTTP** — em Lancamentos, Categorias, Usuarios e Perfis: preencha algo no formulario e clique "Cancelar". Esperado: o formulario limpa (em Perfis, o primeiro clique restaura o snapshot e mantem a edicao; o segundo sai) e **nenhuma requisicao aparece na Network**. (criterio 32g)

9. **Permissao refletida no menu** — edite um perfil retirando o "Ver" de Categorias e salve. Saia (botao "Sair" do trilho — esperado: volta para `/login`) e entre com um usuario desse perfil. Esperado: o item "Categorias" some do trilho. Restaure a permissao depois. (criterios 32f, 14)

10. **Responsividade** — no modo dispositivo do DevTools, passe pelas 6 telas (Login, Resumo, Lancamentos, Categorias, Usuarios, Perfis) nas larguras **1440px**, **1080px** e **680px**. Esperado, em todas: sem barra de rolagem horizontal **da pagina** (a rolagem interna do wrapper das tabelas e esperada), sem texto cortado ou sobreposto; os 4 cards do Resumo viram 2 colunas em 1080px e 1 em 680px; formulario + tabela empilham em 1080px; o conteudo continua comecando depois dos 76px do trilho, sem ficar por baixo dele. (criterio 36)

11. **Contraste** — com o Lighthouse ou o seletor de cor do inspetor, meca >= 4.5:1 em: (a) texto principal e texto secundario sobre o card branco; (b) texto branco do botao "Salvar" sobre o acento; (c) rotulo de um item do trilho sobre o fundo da sidebar; (d) o texto de **cada** status pill sobre o proprio fundo tonal — "Pago" (verde), "Pendente" (amarelo), "Ativo" (verde), "Inativo" (neutro). (criterio 37)

12. **Confirmacao da correcao do criterio 9** — expanda o grupo "Configuracoes" e inspecione o `<svg>` do item "Usuarios". Esperado agora: **20x20 renderizado**, igual aos itens de primeiro nivel. Se ainda aparecer 18x18, o navegador esta servindo CSS em cache — recarregue com "Disable cache" ligado.

## Dados de teste criados

Nenhum. Nao foi possivel autenticar na API (senha do usuario de dev rotacionada e fora do repositorio), entao nenhuma escrita foi feita no banco; toda a verificacao automatica se apoiou em codigo, testes, diffs e recursos publicos servidos pelo frontend.

## Conclusao

**29 de 37 criterios verificados automaticamente; 8 dependem de validacao manual do usuario (5, 13, 19, 23, 27, 32, 36, 37); nenhum criterio nao atendido.**

Historico: a 1a rodada reprovou o criterio 9 (icones dos subitens a 18px). A correcao foi aplicada, a stack Docker reconstruida e o criterio re-verificado no bundle servido — ver "Detalhamento do criterio 9". Os dois achados fora dos criterios (nomes de teste desatualizados e `::selection` com cor literal) tambem foram corrigidos na mesma rodada. `npm test` 66 verdes, `npm run build` sem warnings, `./mvnw test` 30 verdes, `backend/` intocado.

A feature esta pronta para a validacao manual do usuario. Commit, push e PR so depois do aval dele.

Alem disso, dois pontos merecem atencao do usuario durante a validacao manual, ambos ja detalhados no roteiro: a **medicao das larguras de coluna na edicao inline** (item 5, risco principal registrado na T23) e o **acionamento do switch de Perfis com Enter** (item 7), que tende a submeter o formulario em vez de alternar a flag por se tratar de um checkbox nativo.

Validado pelo usuario em 2026-07-27.
