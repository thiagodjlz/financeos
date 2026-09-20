---
issue: 54
url: https://github.com/thiagodjlz/financeos/issues/54
title: "Ajuste de Responsividade e Melhoria de UX/UI — Mobile"
slug: responsividade-mobile
domains: [auth, users, categories, transactions, dashboard]
target: main
stage: validated
branch: feature/issue-54-responsividade-mobile
created: 2026-09-19
---

# Ajuste de Responsividade e Melhoria de UX/UI — Mobile

## Historia

Como usuario do FinanceOS que acessa o sistema pelo celular (referencia: iPhone 12 no Safari, em portrait e tambem em landscape), quero que todas as telas se adaptem de verdade a tela pequena — sem rolagem horizontal, com alvos de toque confortaveis, formularios usaveis com o teclado virtual aberto e navegacao que funcione sem mouse —, para que eu consiga consultar o resumo e lancar despesas no celular com a mesma facilidade que tenho no desktop, sem que a experiencia de desktop piore.

## Contexto

A issue nao relata um bug pontual: ela pede uma **revisao estrutural da camada de apresentacao do frontend Angular** com foco em mobile, explicitamente nao limitada ao iPhone 12 ("o layout deve utilizar uma abordagem responsiva que funcione adequadamente tambem em outros smartphones"). A diretriz central e "resolver a causa dos problemas, e nao apenas mascarar seus efeitos": se varios componentes quebram pelo mesmo motivo, corrigir na origem (global/componente base) em vez de empilhar media query corretiva. A issue tambem exige explicitamente que **o desktop nao seja prejudicado** e que nao sejam introduzidos hacks (`!important` desnecessario, valores para uma unica resolucao, duplicacao de componentes) — e que **nenhuma regra de negocio mude**.

O frontend hoje e o resultado do redesign da issue #35 (tokens `oklch` em `:root`, Inter self-hosted, trilho de icones de 76px) com os ajustes das issues #37 (acordeao/recolhimento do menu), #39 (toasts), #45 (destaque de campo invalido) e #48 (grafico do Resumo). Esse redesign nasceu de um mockup **que nao definia breakpoints** — a spec da #35 registrou isso em "Fora de escopo" ("Redesenho mobile-first (drawer, bottom nav): o mockup nao define breakpoints"). Esta issue e exatamente a continuacao que ficou pendente la.

### Inventario real do frontend (o que existe hoje)

Telas (`frontend/src/app/features/`): `auth/login`, `dashboard`, `transactions`, `categories`, `users`, `profiles` — **6 telas**. Shell em `layout/main-layout/`, feedback transitorio em `core/toast/toast-host`, tema e utilitarios globais em `frontend/src/styles.scss` (488 linhas) e `frontend/src/app/app.scss`, documento em `frontend/src/index.html`. Nao ha framework CSS nem biblioteca de componentes/icones — todo o layout e CSS proprio (grid/flex) e os icones sao SVG inline.

**Todo o frontend tem hoje 4 blocos de `@media`**: `styles.scss` (1080px e 680px), `dashboard.scss` (1080px e 680px), `profiles.scss` (1080px) e `main-layout.scss` (680px). Nao ha nenhuma regra abaixo de 680px, nenhum uso de `dvh`/`svh` e nenhum uso de `env(safe-area-inset-*)` no projeto inteiro.

### Causas-raiz mapeadas no codigo (nao suposicoes)

| # | Causa | Onde | Efeito no iPhone 12 |
|---|---|---|---|
| C1 | Menu lateral e um trilho `position: fixed` de 76px que **so expande por `mouseenter`/`focusin`**, e `.workspace` tem `margin-left: 76px` fixo | `main-layout.scss` (`.sidebar`, `.workspace`), `main-layout.html` | Em 390px de largura, 76px (19,5% da tela) ficam permanentemente gastos com um trilho de icones; sem mouse, a expansao depende do `mouseenter` sintetico do Safari — navegacao por toque nao e projetada |
| C2 | `height: 100vh` + `overflow: hidden` na sidebar | `main-layout.scss:14` | Em landscape (844x390) a lista de itens nao cabe e os ultimos itens ficam **cortados sem rolagem** |
| C3 | `min-height: 100vh` no shell, no `app.scss` e no login | `app.scss:3`, `main-layout.scss:3`, `login.scss:7` | `100vh` no Safari iOS e maior que a area visivel (barra de URL): sobra/corte de conteudo e "pulo" ao rolar |
| C4 | `<meta name="viewport">` sem `viewport-fit=cover` | `index.html` | `env(safe-area-inset-*)` sempre 0: nao ha como respeitar notch/Dynamic Island nem a barra inferior |
| C5 | Tabelas com largura minima grande dentro de `.table-wrap { overflow-x: auto }`: global 760px, Lancamentos 1000px, Usuarios 960px, matriz de Perfis 520px | `styles.scss:378`, `transactions.scss:2`, `users.scss:8`, `profiles.scss:17` | Em 390px toda tabela vira rolagem horizontal interna de 2,5x a largura da tela; acoes ("Editar"/"Cancelar") ficam fora de vista |
| C6 | `input`/`select` com `font-size: var(--fs-body)` = **14px** | `styles.scss:193-203` | Safari iOS **zoom automatico** ao focar qualquer campo (dispara abaixo de 16px), desalinhando a tela |
| C7 | Botoes de linha com `min-height: 32px` e seletor de cor inline de 34px | `styles.scss` (`.row-actions`), `categories.scss` | Abaixo dos 44px recomendados para toque |
| C8 | Grid de duas colunas so colapsa em 1080px; nada abaixo de 680px alem de padding | `styles.scss` (`.content-grid`), `profiles.scss` | Formularios e paineis ficam com espacamento/densidade de desktop numa tela de 390px |
| C9 | Grafico do Resumo ja e responsivo (`ResizeObserver`, `MIN_CHART_WIDTH = 320`), mas desenha **12 rotulos de mes** em `font-size: 11` | `dashboard.ts`, `dashboard.html` | Com ~280px uteis, sobram ~23px por mes: rotulos colidem |
| C10 | `button:hover` da sidebar e dos itens sem tratamento para toque | `main-layout.scss` | Estado de hover "preso" apos o toque no iOS |

### Escopo concreto desta issue (arquivos)

- **Documento**: `frontend/src/index.html` (meta viewport).
- **Tema e utilitarios globais**: `frontend/src/styles.scss` (tokens, breakpoints, `input`/`select`, `table`/`.table-wrap`, `.content-grid`, `.row-actions`, `.modal-*`, `.two-cols`), `frontend/src/app/app.scss`.
- **Shell**: `frontend/src/app/layout/main-layout/` (`.html`, `.ts`, `.scss`, `.spec.ts`).
- **Feedback**: `frontend/src/app/core/toast/toast-host.{html,scss}`.
- **Telas**: `features/auth/login/`, `features/dashboard/`, `features/transactions/`, `features/categories/`, `features/users/`, `features/profiles/` (`.html`/`.scss` e, quando o padrao de navegacao/tabela exigir, `.ts` e `.spec.ts`).
- **Nao entra**: qualquer arquivo sob `backend/`.

### Regras existentes que restringem o ajuste

Este trabalho e **camada de apresentacao**: nenhuma regra de negocio, endpoint, DTO, permissao ou migration muda (CLAUDE.md — toda validacao continua imposta no back-end). Precisam sobreviver, sem regressao (ver `knowledge/architecture.md`, `auth-and-permissions.md`, `transactions.md`, `categories.md`, `users.md`, `dashboard.md`):

- **Edicao inline** em Lancamentos, Categorias e Usuarios (#31): uma linha por vez, "Salvar" (`PUT` + recarrega), "Sair" com modal "Deseja sair sem salvar?" quando ha alteracao pendente e sem HTTP quando nao ha; no desktop, entrar em edicao nao altera a largura de nenhuma coluna (`table.fixed-layout` + `<colgroup>`).
- **Botao "Cancelar" dos formularios** (#28/#31): `type="button"`, **nunca dispara HTTP**; estagio unico em Lancamentos/Categorias/Usuarios, dois estagios em Perfis.
- **Menu lateral** (#35/#37): sem `.collapse-toggle`; expansao 100% por estado (`.sidebar.expanded`, **sem `:hover`/`:focus-within` no SCSS**); acordeao com no maximo um grupo aberto; clicar no grupo com o trilho recolhido expande e abre **sem navegar**; `onNavigate()` recolhe e move o foco para `.workspace`; grupos "Cadastros" e "Configuracoes" visiveis por `can(screen, 'VIEW')`.
- **Resumo** (#48): recarga automatica com uma unica `GET /api/dashboard/summary` por mudanca de Ano/Mes, `.empty-state` "Sem dados no período" inline (nao vira toast), invariante `balance = income - expense`.
- **Toasts** (#39): taxonomia Sucesso/Alerta/Falha, maximo 3 vivos, de-duplicacao, acao sem HTTP nao dispara toast; legendas `field-error` por campo (#45) convivem com o toast.
- **Design system** (#35): toda decisao visual nasce como custom property em `styles.scss`; `frontend/src/app/**/*.scss` nao tem cor literal; nenhum recurso externo em runtime; sem dependencia de UI/icones; tema unico (sem dark mode).
- **Todo texto exibido em portugues acentuado.**

## Decisoes

- **2026-09-19 — PA1: navegacao no mobile vira gaveta sobreposta (opcao "a").** Abaixo do breakpoint mobile o trilho de 76px deixa de ocupar largura permanente: um botao "Menu" num cabecalho abre a sidebar **por cima** do conteudo, com scrim (fundo escurecido) sobre o resto da tela; a gaveta fecha ao tocar fora dela/no scrim e ao navegar para outra tela. **No desktop nada muda**: o trilho de 76px que expande para 236px continua como esta hoje (issues #35/#37).
- **2026-09-19 — PA2: no mobile, cada linha de tabela vira card empilhado (opcao "a").** Abaixo do breakpoint mobile, Lancamentos, Categorias e Usuarios exibem cada registro como um card com rotulo + valor por campo e as acoes agrupadas, em vez de tabela com rolagem horizontal. Acima do breakpoint continuam tabelas, sem mudanca.
- **2026-09-19 — Derivacao da Decisao 2 (nao e escolha do usuario): matriz de permissoes de Perfis.** A matriz nao tem "linha = registro" (e uma grade tela x acao), entao o formato de card nao se aplica diretamente. Para ficar coerente com a Decisao 2 e com a meta de nao haver rolagem horizontal indevida, esta spec adota **um bloco por tela** no mobile (nome da tela + os quatro controles rotulados Ver/Incluir/Alterar/Excluir), eliminando o `min-width: 520px` nessa faixa. O usuario **nao** optou por esconder colunas; se preferir outro formato (acordeao, por exemplo), o criterio 22 e o ponto a ajustar.
- **2026-09-19 — PA3: a revisao de UX/UI inclui hierarquia, tipografia e espacamento tambem no desktop (opcao "b"), item a item.** Nenhum ajuste discricionario entra como texto generico: cada um esta escrito como criterio verificavel na secao "Revisao de UX/UI (tambem no desktop)" (criterios 33 a 41), levantado a partir do codigo atual. Continua valendo a diretriz da issue de **nao alterar regra de negocio nem funcionalidade** — todos os ajustes sao de apresentacao, acessibilidade e rotulo.
- **2026-09-19 — PA4: validacao aceita por emulacao.** A esteira valida em 390x844 e 844x390 no navegador (DevTools). Os criterios que dependem de comportamento nativo do Safari iOS — zoom automatico ao focar campo, barra de URL dinamica, safe area real e hover preso apos toque — permanecem na spec com a ressalva **"(verificavel por emulacao — comportamento nativo do Safari nao reproduzido)"** e nao sao motivo para reprovar a feature na etapa 8.

## Criterios de aceite

### Fundacao responsiva

- [x] 1. `frontend/src/index.html` declara `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` e `rg -n "user-scalable|maximum-scale" frontend/src/index.html` nao retorna nada (o zoom manual do usuario continua permitido — requisito de acessibilidade).
- [x] 2. Nenhuma altura de tela depende de `100vh` sozinho: em `frontend/src/**/*.scss`, cada ocorrencia de `100vh` e apenas declaracao de fallback **imediatamente seguida, no mesmo bloco, pela mesma propriedade em `100dvh` ou `100svh`**. Verificavel por `rg -n "100vh|100dvh|100svh" frontend/src --glob "*.scss"`, conferindo os 4 pontos que hoje nao tem fallback (`app.scss:3`, `login.scss:7`, `main-layout.scss:3`, `main-layout.scss:14`).
- [x] 3. Abrindo `/login` e `/dashboard` em 390x844 com emulacao de barra de navegador dinamica, nao sobra faixa vazia abaixo do conteudo nem o rodape fica cortado ao rolar: o shell ocupa exatamente a altura visivel. *(Verificavel por emulacao — comportamento nativo do Safari nao reproduzido.)*
- [x] 4. Os breakpoints sao um conjunto unico e declarado: `frontend/src/styles.scss` documenta (em comentario junto aos tokens) a lista de larguras de corte usadas no projeto, e **toda** `@media` do frontend usa uma dessas larguras — `rg -n "@media" frontend/src --glob "*.scss"` nao mostra nenhum valor fora do conjunto (nada de corte em 390px ou em outra largura de aparelho especifico).
- [x] 5. `rg -n "!important" frontend/src --glob "*.scss"` nao retorna nenhuma ocorrencia.
- [x] 6. Elementos com `position: fixed` respeitam a safe area do iOS: o cabecalho mobile, a gaveta de navegacao e a pilha de toasts usam `env(safe-area-inset-*)` (`rg -n "safe-area-inset" frontend/src --glob "*.scss"` lista pelo menos esses elementos) e, em 390x844 com notch simulado, nenhum controle interativo fica sob a Dynamic Island nem sob a barra inferior. *(Verificavel por emulacao — safe area real do aparelho nao reproduzida.)*

### Sem overflow e sem corte

- [x] 7. Em 390x844 (portrait) e 844x390 (landscape), nas 6 telas (`/login`, `/dashboard`, `/transactions`, `/categories`, `/users`, `/profiles`), o console retorna `document.documentElement.scrollWidth <= window.innerWidth` — nenhuma rolagem horizontal da pagina.
- [x] 8. Nas mesmas telas e larguras, nenhum texto aparece cortado ou sobreposto: titulo da pagina, rotulos de formulario, valores monetarios (ex.: `- R$ 12.480,00`) e nomes longos de categoria/usuario quebram linha ou truncam com reticencias **dentro** do seu container.
- [x] 9. Em 320px de largura (menor viewport suportado, `body { min-width: 320px }`) as 6 telas continuam sem rolagem horizontal da pagina e com a acao primaria de cada tela (Entrar, Salvar, Editar) visivel sem zoom.

### Navegacao mobile — gaveta sobreposta (Decisao 1)

- [x] 10. Em 390x844 o trilho de 76px **nao ocupa largura permanente**: o `margin-left: 76px` de `.workspace` nao se aplica nessa faixa e a largura util do conteudo e >= 90% da largura da viewport (medida no DevTools no elemento `.workspace`).
- [x] 11. Em 390x844 existe um cabecalho com botao "Menu" (alvo >= 44x44 px, `aria-label` em portugues, `aria-expanded` refletindo o estado e `aria-controls` apontando para a gaveta); um unico toque nele abre a gaveta **sobreposta ao conteudo**, com scrim escurecido cobrindo o restante da tela.
- [x] 12. A gaveta fecha nas tres situacoes: tocando no scrim/fora dela, tocando num item de navegacao (que tambem navega para a tela correspondente) e acionando `Esc`. Em nenhum caso a abertura ou o fechamento depende de `hover`.
- [x] 13. Com a gaveta aberta em 390x844 o conteudo atras **nao rola**; e em landscape (844x390) todos os itens visiveis para o usuario sao alcancaveis, com o proprio conteudo da gaveta rolando quando exceder a altura (hoje `height: 100vh` + `overflow: hidden` corta os ultimos itens, incluindo o "Sair").
- [x] 14. Acessibilidade da gaveta: ao abrir, o foco vai para o primeiro item; enquanto aberta, `Tab`/`Shift+Tab` nao alcancam o conteudo atras; ao fechar, o foco volta para o botao "Menu".
- [x] 15. Apos tocar num item e navegar, nenhum item fica com o destaque de `hover` preso. *(Verificavel por emulacao de toque — comportamento nativo do Safari nao reproduzido.)*
- [x] 16. A visibilidade por permissao continua valendo na gaveta: usuario sem `VIEW` de `USERS` e de `PROFILES` nao ve o grupo "Configuracoes"; sem `VIEW` de `CATEGORIES` nao ve o grupo "Cadastros" — coberto por `main-layout.spec.ts` (atualizado so nos seletores, sem afrouxar assercao).

### Formularios e teclado virtual

- [x] 17. Em viewport <= 480px o `font-size` computado de todo `input`, `select` e `textarea` e **>= 16px** (evita o zoom automatico do Safari iOS ao focar um campo); acima desse corte a tipografia dos campos permanece a atual (`--fs-body`, 14px). *(A medida do `font-size` e verificavel no DevTools; o zoom em si e comportamento nativo do Safari, nao reproduzido na emulacao.)*
- [x] 18. Com o teclado virtual aberto (emulado reduzindo a altura da viewport para ~390x400), o campo focado permanece visivel e o botao primario do formulario continua alcancavel por rolagem em `/login`, no formulario de novo lancamento, de categoria, de usuario e de perfil. *(Verificavel por emulacao — teclado nativo do iOS nao reproduzido.)*
- [x] 19. Em 390x844 os grids de duas colunas ficam em coluna unica (`.content-grid` em Lancamentos/Categorias/Usuarios e `.profiles-grid` em Perfis), com o formulario ocupando a largura util e cada campo com altura de toque >= 44px.
- [x] 20. Em `/login` a 390x844 o card cabe inteiro na altura visivel sem rolagem, com o rodape `FinanceOS · v<versao>` visivel; a mensagem de credencial invalida (toast de Alerta) continua legivel e nao cobre o botao "Entrar".

### Tabelas e conteudo denso — cards empilhados (Decisao 2)

- [x] 21. Em 390x844, cada registro das tabelas de Lancamentos, Categorias e Usuarios e exibido como **card empilhado**: um bloco por registro, cada campo com rotulo visivel (o mesmo texto do `<th>` correspondente) + valor, e as acoes agrupadas no fim do card. Nessa faixa nenhum container da tela rola horizontalmente — as larguras minimas de hoje (760px global, 1000px em Lancamentos, 960px em Usuarios) nao se aplicam, e o `min-width` computado da tabela e menor ou igual a largura util.
- [x] 22. A matriz de permissoes de `/profiles` em 390x844 e exibida como **um bloco por tela** (nome da tela + os quatro controles rotulados Ver, Incluir, Alterar e Excluir), sem `min-width: 520px` e sem rolagem horizontal; cada controle continua sendo o mesmo `<input type="checkbox">` com seu `name` e `[(ngModel)]`, e o payload `canView`/`canCreate`/`canEdit`/`canDelete` enviado no `POST`/`PUT` nao muda (conferido em `profiles.spec.ts`).
- [x] 23. A edicao inline continua completa no formato card em 390x844, nas tres telas: "Editar" abre o card em edicao (um por vez, os demais "Editar" ficam `disabled`), os campos aparecem empilhados com rotulo, "Salvar" e "Sair" ficam visiveis sem rolagem horizontal, "Salvar" envia `PUT` e recarrega a lista, e "Sair" com alteracao pendente abre o modal de confirmacao.

### Resumo (dashboard)

- [x] 24. Em 390x844 os 4 cards do Resumo ficam em 1 ou 2 colunas, com rotulo e valor completos (sem truncar `R$ 12.480,00`), na ordem atual Receitas, Despesas, Pendentes, Saldo.
- [x] 25. Em 390x844 o grafico "Evolucao anual" nao ultrapassa a largura do painel e os rotulos dos 12 meses **nao se sobrepoem** (abreviacao, rotacao ou exibicao alternada — a escolha e do plano; o resultado observavel e nao haver colisao); barras e linha de saldo continuam distinguiveis.
- [x] 26. O tooltip do grafico continua funcionando por toque (`pointerdown` ja existente) e, com o primeiro e o ultimo mes selecionados a 390px, nao ultrapassa as bordas do painel.
- [x] 27. Os controles de periodo (Ano e Mes) permanecem visiveis e operaveis a 390px, e trocar qualquer um deles continua disparando **uma unica** `GET /api/dashboard/summary` (conferivel na aba Network).

### Toque e acessibilidade

- [x] 28. Em viewport <= 480px todo elemento interativo tem area de toque >= 44x44 CSS px (medida no DevTools): acoes dos cards de registro (hoje `.row-actions` com `min-height: 32px`), itens da gaveta, botao "Menu", botao de fechar do toast, seletor de cor da edicao inline de Categorias (hoje 34px), controles da matriz de permissoes e botoes dos modais.
- [x] 29. Alvos de toque adjacentes tem pelo menos 8px de separacao em `.row-actions`, `.modal-actions` e `.form-actions` a 390px.
- [x] 30. Contraste medido (DevTools ou Lighthouse) de **todos** os pares texto/fundo alterados: >= 4.5:1 para texto normal e >= 3:1 para texto >= 18.66px/700 e para bordas de controle de formulario.
- [x] 31. Nenhuma informacao passa a depender exclusivamente de cor: tipo e status de lancamento e situacao de categoria/usuario continuam com rotulo textual (pill) alem da cor, inclusive no formato card.
- [x] 32. Em 390x844 a pilha de toasts nao cobre a acao primaria da tela nem o cabecalho mobile, respeita a safe area superior e seu botao de fechar atende ao criterio 28.

### Revisao de UX/UI (tambem no desktop) — Decisao 4

- [x] 33. **Foco visivel padronizado em botoes.** Hoje `styles.scss` so define `:focus-visible` para `input`/`select` (linhas 206-209) e os botoes caem no contorno default do navegador. Passa a existir regra global de `:focus-visible` para `button`, com o mesmo anel de 2px do acento e `outline-offset`; navegando por `Tab` a 1440px, todos os botoes (primario, ghost, danger, acoes de linha, itens do menu, fechar do toast) exibem o mesmo indicador.
- [x] 34. **Estado desabilitado consistente.** Hoje so `.primary-button:disabled` e `.danger-button:disabled` tem estilo — `.ghost-button` nao tem nenhum, e e justamente ele o "Editar" que fica `disabled` nas demais linhas durante a edicao inline. As tres variantes passam a compartilhar o mesmo tratamento (mesma opacidade e `cursor: not-allowed`, com `cursor: wait` reservado ao botao em operacao de salvamento). Verificavel: com uma linha em edicao a 1440px, os demais "Editar" ficam visivelmente atenuados; hoje ficam identicos aos habilitados.
- [x] 35. **`hover` deixa de ser identico ao `active` no menu.** Hoje `.nav-list button.active` e `.nav-list button:hover` compartilham `background: var(--sidebar-item-active)` + texto branco, entao passar o ponteiro sobre um item inativo o faz parecer a tela atual. Os dois estados passam a ser visualmente distinguiveis (o ativo mantem o destaque mais forte — indicador proprio ou fundo mais solido). Verificavel: estando em `/dashboard`, com o ponteiro sobre "Lancamentos", da para dizer qual dos dois e a tela atual.
- [x] 36. **Coluna de acoes com rotulo e largura unica.** Os tres `<th></th>` vazios (`transactions.html:128`, `categories.html:80`, `users.html:87`) passam a ter rotulo "Ações" (visivel ou em `.sr-only`), e a largura da coluna vem de um token unico em `styles.scss` em vez dos valores soltos de hoje (200px em `transactions.scss`, 200px em `categories.scss`, 210px em `users.scss`).
- [x] 37. **Entrelinha definida.** Hoje `styles.scss` nao declara `line-height` em lugar nenhum e o texto herda o default do navegador. Passam a existir tokens de entrelinha em `:root` (corpo/tabela e titulo), aplicados globalmente: no DevTools a 1440px, o `line-height` computado do texto de corpo e >= 1.45 e o dos titulos de pagina/painel <= 1.3.
- [x] 38. **Estado de carregamento visivel.** O signal `loading` existe em `categories.ts`, `profiles.ts` e `dashboard.ts` e **nunca e consumido no template** (`rg -n "loading" frontend/src/app/features --glob "*.html"` hoje nao retorna nada). Cada tela de lista (Resumo, Lancamentos, Categorias, Usuarios, Perfis) passa a exibir indicador de carregamento enquanto a requisicao inicial nao responde, e o `.empty-state` ("Nenhuma categoria cadastrada", "Sem lançamentos cadastrados", "Nenhum usuário cadastrado", "Nenhum perfil cadastrado", "Sem dados no período") so aparece **depois** da resposta — hoje ele pisca durante o carregamento.
- [x] 39. **Modal de confirmacao acessivel.** Os tres modais "Deseja sair sem salvar?" (Lancamentos, Categorias, Usuarios) ganham `role="dialog"`, `aria-modal="true"` e `aria-labelledby` apontando para a pergunta; ao abrir, o foco vai para o primeiro botao; `Esc` fecha equivalendo a continuar editando; enquanto aberto, o foco nao alcanca o conteudo atras; ao fechar, o foco volta ao botao que abriu. O clique no backdrop continua fechando como hoje, sem requisicao HTTP.
- [x] 40. **Rotulos do modal passam a nomear a acao.** "Não"/"Sim" (que nao dizem o que acontece) viram rotulos explicitos — "Continuar editando" e "Sair sem salvar" — nos tres modais. Os handlers `confirmExitNo()`/`confirmExitYes()` e o efeito de cada botao **nao mudam**; os specs sao ajustados apenas no texto procurado.
- [x] 41. **Rolagem de tabela com affordance.** Entre 681px e 1080px as tabelas ainda podem exceder o painel (largura minima global de 760px): o container rolavel passa a indicar visualmente que ha conteudo alem da borda (sombra/gradiente lateral que some ao chegar ao fim da rolagem). Verificavel a 900px de largura em `/transactions`.

### Nao regressao — desktop e comportamento

- [x] 42. Desktop preservado a 1440px e a 1280px nas 6 telas: trilho de 76px que expande para 236px sobrepondo o conteudo (`.workspace` com `margin-left: 76px` nos dois estados), `.content-grid` em `340px minmax(0, 1fr)`, `.profiles-grid` em `minmax(0, 1fr) 320px`, 4 cards do Resumo em 4 colunas, tabelas como tabelas (nao cards) e densidade `th` `0 12px 12px` / `td` `14px 12px`. As unicas mudancas visuais de desktop sao as dos criterios 33 a 41.
- [x] 43. Comportamento do menu no desktop intacto: nao existe `.collapse-toggle` no DOM; a expansao continua vindo **so** da classe `.sidebar.expanded` (`rg -n "sidebar:hover|sidebar:focus-within" frontend/src/app/layout/main-layout/main-layout.scss` **sem saida** — a varredura mira so esse arquivo de producao, nao os specs); no maximo um grupo aberto por vez; clicar num grupo com o trilho recolhido expande e abre **sem mudar a URL**; acionar um item recolhe o trilho e move o foco para `.workspace`.
- [x] 44. Edicao inline intacta no desktop: apenas uma linha em edicao por vez, "Salvar" envia `PUT` e recarrega a lista, "Sair" com alteracao pendente abre o modal e sem alteracao sai **sem nenhuma requisicao**, e entrar em edicao continua sem alterar a largura de nenhuma coluna (`table.fixed-layout` + `<colgroup>`).
- [x] 45. "Cancelar" dos formularios continua `type="button"` e **sem disparar HTTP** — estagio unico em Lancamentos/Categorias/Usuarios e dois estagios em Perfis (restaura o snapshot com alteracao pendente; sai da edicao sem alteracao) —, com os `httpMock.expectNone(() => true)` dos specs existentes continuando a passar.
- [x] 46. Toasts preservados: taxonomia Sucesso/Alerta/Falha, limite de 3 vivos com de-duplicacao, e as legendas `field-error` por campo continuam aparecendo junto do toast nos 400 de Bean Validation.
- [x] 47. Zero alteracao no backend: `git status --porcelain` no working tree da branch nao lista nada sob `backend/` e nenhuma migration `V<n>__*.sql` e criada; nenhuma validacao ou regra de negocio e movida para o front-end.
- [x] 48. Nenhuma dependencia nova: `git diff frontend/package.json` nao adiciona entradas em `dependencies` nem `devDependencies` (nada de framework CSS, biblioteca de componentes ou de icones).
- [x] 49. Design system preservado: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` nao retorna nenhuma cor literal, toda medida nova de tema (breakpoint, alvo minimo de toque, altura do cabecalho mobile, entrelinha) nasce como custom property em `frontend/src/styles.scss`, e `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/*.md'` continua sem saida.
- [x] 50. Todo texto exibido continua em portugues acentuado. As **unicas** mudancas de texto permitidas sao os rotulos dos modais (criterio 40) e os rotulos/`aria-label` novos da navegacao mobile e da coluna de acoes (criterios 11 e 36); nenhum outro rotulo existente muda.
- [x] 51. `npm test` e `npm run build` (frontend) passam — os ajustes nos specs sao apenas de seletor/texto procurado, sem afrouxar assercao, e sem warning novo de orcamento (`anyComponentStyle`, 8 kB por `.scss` de componente) — e `./mvnw test` (backend) continua verde sem alteracao de codigo.

## Fora de escopo

- Qualquer mudanca de regra de negocio, endpoint, DTO, permissao, migration ou comportamento de API — a issue e explicitamente de apresentacao ("Nao alterar regras de negocio ou funcionalidades sem necessidade").
- Campos, telas ou funcionalidades novas; remocao de campo ou coluna existente por "nao caber no celular" (reorganizar a apresentacao no mobile e layout; remover e mudanca funcional).
- App nativo, PWA, instalacao na tela inicial, service worker e uso offline.
- Dark mode, seletor de tema e suporte a `prefers-color-scheme` (fora desde a #35).
- Troca da identidade visual definida na #35: a paleta `oklch`, a tipografia Inter, os raios e as sombras permanecem. O que a Decisao 4 autoriza mexer no desktop sao hierarquia, entrelinha, espacamento, estados (foco/desabilitado/carregamento) e rotulos — e **so** nos pontos listados nos criterios 33 a 41.
- Adocao de framework CSS, biblioteca de componentes ou de icones.
- Internacionalizacao / troca de idioma da UI.
- Reintroduzir Contas/Cartoes (removidos na issue #20).
- Otimizacao de performance de rede/bundle, exceto o que decorrer naturalmente do CSS alterado.
- Validacao no aparelho fisico como condicao de aceite (Decisao 5: a verificacao e por emulacao).

## Pontos em aberto

Nenhum. Os quatro pontos da versao anterior desta spec (PA1 navegacao mobile, PA2 tabelas densas, PA3 amplitude da revisao de UX/UI e PA4 validacao no aparelho de referencia) foram resolvidos pelas decisoes registradas acima. O unico item que nao veio diretamente do usuario e o formato da matriz de permissoes no mobile (criterio 22), derivado da Decisao 2 e sinalizado como tal na secao "Decisoes".

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/54
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/auth-and-permissions.md`, `knowledge/users.md`, `knowledge/categories.md`, `knowledge/transactions.md`, `knowledge/dashboard.md`
- Specs anteriores relacionadas: `specs/35-redesign-interface/spec.md` (design system e o "fora de escopo" mobile-first que originou esta issue), `specs/37-menu-cadastros/spec.md` (comportamento do menu), `specs/48-ajuste-grafico-dashboard/spec.md` (grafico do Resumo)
- Codigo inventariado: `frontend/src/index.html`, `frontend/src/styles.scss`, `frontend/src/app/app.scss`, `frontend/src/app/layout/main-layout/`, `frontend/src/app/core/toast/toast-host.*`, `frontend/src/app/features/{auth/login,dashboard,transactions,categories,users,profiles}/`
