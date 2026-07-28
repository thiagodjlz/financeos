---
issue: 39
url: https://github.com/thiagodjlz/financeos/issues/39
title: "Ajustes de alertas"
domains: [auth, users, categories, transactions, dashboard]
stage: pr-open
branch: feature/issue-39-ajustes-alertas
created: 2026-07-27
---

# Ajustes de alertas

## Historia

Como usuario do FinanceOS, quero receber uma mensagem clara e padronizada em cada acao que executo — inclusive quando ela da certo, e dizendo qual campo faltou quando ela nao da —, para que eu saiba se o sistema registrou o que eu pedi sem precisar conferir a tabela na mao.

## Contexto

A issue pede: *"Ajuste e adicione as menagens no sistema de acordo com o link compartilhado"*, apontando para o projeto de design `Toast Notifications.dc.html` (copia local em `specs/39-ajustes-alertas/design/`, fonte da verdade visual). Sao, portanto, duas frentes:

**(a) Ajustar o que ja existe.** Hoje o unico canal de feedback do app e uma faixa `.status-bar` no topo da tela (`styles.scss:144`), sempre na paleta vermelha (`--expense-soft` / `--expense-on-soft`), usada em 6 telas:

| Tela | Onde | Mensagens de hoje |
|---|---|---|
| Login (`features/auth/login/login.ts:37`) | faixa no card | "E-mail ou senha invalidos." |
| Resumo (`features/dashboard/dashboard.ts:96`) | faixa no topo | "API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080." |
| Lancamentos (`features/transactions/transactions.ts:75,120,134,235`) | faixa no topo | falha de carga, "Nao foi possivel salvar. Revise os campos e tente novamente.", "Nao foi possivel cancelar o lancamento." |
| Categorias (`features/categories/categories.ts:55,161,175`) | faixa no topo | falha de carga, falha ao salvar, fallback 409 "Ja existe uma categoria com esse nome e tipo." |
| Usuarios (`features/users/users.ts:85,193,305,313,327`) | faixa **dismissivel** (botao `×`) com auto-fechamento de 5000 ms + legendas `field-error` por campo | falha de carga, "Nao foi possivel desativar o usuario.", "Revise o(s) campo(s) invalido(s): ...", fallback 409 "E-mail ja cadastrado." |
| Perfis (`features/profiles/profiles.ts:60,125,139`) | faixa no topo | falha de carga, "Nao foi possivel salvar o perfil.", "Nao foi possivel excluir o perfil (pode estar em uso por usuarios)." |

**(b) Adicionar o que falta.** Uma varredura em `frontend/src/app` nao encontra **nenhuma** mensagem de sucesso (`grep -i "sucesso|success"` sai vazio) nem nenhum estado de "alerta": criar lancamento, salvar edicao inline, cancelar lancamento, criar/editar categoria, criar/editar usuario, desativar usuario, criar/editar/excluir perfil — todas terminam em silencio. Tambem sao silenciosos o logout forcado por 401 (`core/interceptors/auth.interceptor.ts:20`) e o redirecionamento do `permissionGuard` para `/dashboard` quando o usuario abre uma rota sem permissao (`core/guards/permission.guard.ts:22`).

O design substitui esse canal por **toasts flutuantes no canto superior direito**, em tres estados (Sucesso / Alerta / Falha), com auto-fechamento so nos dois primeiros. Os tres pares de cor do mockup ja existem como token no `styles.scss` do redesign da issue #35 (`--income-soft`/`--income-icon`, `--pending-soft`/`--pending-icon`, `--expense-soft`/`--expense-on-soft`) — o design foi construido sobre a paleta do proprio projeto, entao esta etapa nao introduz cor nova.

**A semantica dos tres estados foi definida pelo usuario** (ver "Decisoes") e nao segue a leitura literal dos exemplos do mockup: Sucesso = gravacao persistida, **Alerta = recusa que o usuario consegue corrigir** (campo obrigatorio ausente/invalido em primeiro lugar), Falha = erro tecnico inesperado. A tabela canonica esta em "Taxonomia dos tres estados".

Restricoes de dominio que atravessam a issue:

- **Toda regra de negocio e validacao e imposta no back-end** (CLAUDE.md), e **a mensagem exibida vem dele**. Hoje isso so acontece de fato em Usuarios (400 com `violations[]` e `message` em portugues, issue #26 — `knowledge/users.md`). `TransactionRequest`, `CategoryRequest`, `ProfileRequest` e `LoginRequest` **nao tem `message` customizado**: suas violacoes saem em ingles (default do Hibernate Validator), o que e incompativel com o Alerta que precisa nomear os campos em portugues.
- Os erros de negocio sao `WebApplicationException(mensagem, status)` **sem entity** e o projeto nao tem `ExceptionMapper`, entao a resposta chega ao Angular com `content-length: 0` e o front cai em fallback por status (`knowledge/architecture.md`). Esse fallback so e legitimo quando o status e inequivoco; em `POST/PUT /api/transactions` **nao e**: o mesmo 400 cobre "Categoria informada nao existe.", "A categoria deve ser do mesmo tipo do lancamento." e "O status Cancelado so pode ser aplicado pelo cancelamento do lancamento." (`knowledge/transactions.md`).

Os textos do mockup ("Lançamento salvo com sucesso.", "Categoria sem transações neste período.", "Credenciais inválidas. Tente novamente.") sao **exemplos de cada estado**, nao a lista completa de mensagens do sistema.

## Decisoes

Todas tomadas com o usuario em **2026-07-27**, respondendo aos pontos que estavam em aberto na primeira versao desta spec.

- **Alerta = erro de validacao, nomeando os campos.** Verbatim: *"Alerta e no contexto onde o usuario tenta salvar um registro sem informar algum campo obrigatorio, se possivel adicionar o nome(s) do campo junto a mensagem de alerta"*. Sempre que o backend recusar a gravacao por campo obrigatorio ausente/invalido, o toast e de **Alerta** (nao Falha) e a mensagem nomeia o(s) campo(s) — ex.: "Informe os campos obrigatórios: Descrição, Valor.". Como a regra e a mensagem sao do back-end, a frase e montada **la** (Bean Validation no DTO + `ExceptionMapper`), e o front so renderiza o que recebe.
- **"Categoria sem transações neste período." deixa de ser o caso canonico de Alerta.** O `.empty-state` inline do Resumo ("Sem dados no periodo") **continua exatamente como esta hoje** e nao vira toast.
- **Sucesso = toda escrita persistida com exito.** Verbatim: *"Ao salvar um registro com sucesso, contexto ao gravar uma categoria, gravar um perfil novo, gravar um lancamento novo, sempre que o registro for persistido no banco com sucesso, exibir"*. Cobre criacao **e** edicao.
- **Interpretacao derivada (contestavel na revisao): exclusao tambem dispara Sucesso** — incluindo os soft deletes do projeto (cancelamento de lancamento via `DELETE /api/transactions/{id}`, desativacao de usuario, desativacao de categoria e exclusao de perfil). Derivado de *"sempre que o registro for persistido no banco com sucesso"*: a gravacao acontece, ainda que como mudanca de estado.
- **Correcao de escopo (fato do dominio):** a lista de telas repassada mencionava **Contas** e **Cartoes**, que **nao existem mais** — foram removidas por completo do sistema na issue #20 (`knowledge/accounts.md`, `knowledge/cards.md`; o enum `Screen` nao tem mais `ACCOUNTS`/`CARDS`). O escopo real de Sucesso sao as quatro telas de cadastro existentes: **Lancamentos, Categorias, Usuarios e Perfis**.
- **Falha = erro tecnico inesperado.** Verbatim: *"falha e sempre que houver algo inesperado pelo sistema, time out, erro na chamada de um end-point esse tipo de situacao, que o usuario nao pode realizar nenhuma acao para corrigir, de fato um bug no sistema"*. Cobre 5xx, timeout, falha de rede, endpoint indisponivel e resposta malformada. **Erro de validacao nunca e Falha.**
- **Interpretacao derivada (contestavel na revisao): recusa de negocio que o usuario consegue corrigir e Alerta, nao Falha.** Como Falha ficou reservada a bug/indisponibilidade, os 409 de duplicidade ("Ja existe uma categoria com esse nome e tipo.", "E-mail ja cadastrado."), o 409 de perfil em uso, o 409 de autodesativacao, os 400 de regra de Lancamentos e o 403/redirect por falta de permissao entram como **Alerta** — o usuario tem uma acao possivel (mudar o nome, escolher outra categoria, pedir permissao).
- **Credenciais invalidas no login e Alerta — decisao do usuario em 28/07/2026, revertendo a excecao do coordenador.** A primeira versao desta spec mantinha o literal do mockup, que rotula "Credenciais inválidas. Tente novamente." como Falha (`Toast Notifications.dc.html:157`). Na validacao manual o usuario reverteu, verbatim: *"altere o item 1, login com senha errada deve emitir alerta nao falha, ou seja, amarelo"*. Vale a taxonomia, nao o literal do design: senha errada nao e bug do sistema, e erro que o usuario corrige redigitando. **O 401 de `POST /api/auth/login` e Alerta** (paleta `--pending-*`, titulo "Alerta") e, por consequencia ja aceita pelo usuario, passa a **auto-fechar em 5200 ms com barra de progresso**, em vez de ficar na tela ate ser fechado. O **401 fora do login** (sessao expirada, interceptor que desloga) continua **Alerta**, como sempre esteve. O status HTTP nao muda: `POST /api/auth/login` com senha errada continua respondendo **401**.
- **Maximo de 3 toasts simultaneos.** Verbatim: *"Maximo 3"*. Ao chegar o quarto, o mais antigo sai (mesma animacao de saida), independentemente do tipo.
- **Acentuar o app inteiro nesta feature.** Todos os textos exibidos ao usuario passam a ter acentuacao correta em portugues — labels, botoes, placeholders, titulos, tooltips, menu lateral, mensagens de erro/validacao e os textos vindos do backend que sao exibidos. **Nao** se renomeia identificador de codigo, chave de i18n, nome de rota, valor de enum nem dado do banco: so texto exibido.

## Taxonomia dos tres estados (canonica para esta issue)

| Situacao | Estado | Origem da mensagem |
|---|---|---|
| `POST`/`PUT`/`DELETE` respondendo 2xx (registro persistido) | **Sucesso** | Texto fixo do front, por acao |
| 400 de Bean Validation (campo obrigatorio ausente / formato invalido / tamanho) | **Alerta** nomeando o(s) campo(s) | **Backend** (`ExceptionMapper` sobre as violacoes) |
| 400 de regra de negocio de Lancamentos (categoria inexistente, tipo incompativel, status `CANCELED` via POST/PUT) | **Alerta** | **Backend** (corpo da resposta) |
| 409 (categoria duplicada, e-mail duplicado, perfil em uso, autodesativacao) | **Alerta** | **Backend** (corpo da resposta) |
| 403 do `AccessControl` ou redirect do `permissionGuard` por falta de permissao | **Alerta** | Texto fixo do front (nao ha corpo) |
| 401 fora do login (sessao expirada / token invalido) | **Alerta** | Texto fixo do front |
| 401 de `POST /api/auth/login` (credenciais invalidas) | **Alerta** (D12 revertida pelo usuario em 28/07/2026, ver "Decisoes") | Texto fixo do front |
| 5xx, timeout, falha de rede, API fora do ar, corpo malformado | **Falha** | Texto fixo do front |

## Tokens extraidos do mockup

Origem = arquivo `specs/39-ajustes-alertas/design/Toast Notifications.dc.html` (`:linha`). Coluna "Token" indica a custom property ja existente em `frontend/src/styles.scss` cujo valor e **identico** ao do mockup.

| Item | Valor exato no mockup | Origem | Token existente |
|---|---|---|---|
| Container | `position: fixed; top: 24px; right: 24px; z-index: 999` | `:88` | — (geometria) |
| Largura da coluna | `width: 340px; max-width: calc(100vw - 32px)` | `:88` | — |
| Direcao da pilha | `display: flex; flex-direction: column` (novos entram no fim, empilhando para baixo) | `:88`, `:134` | — |
| Espaco entre toasts | `margin-bottom: 12px` no wrapper de cada toast | `:90` | — |
| Fundo do card | `#fff` | `:91` | `--surface` |
| Borda do card | `1px solid oklch(91% 0.008 80)` | `:91` | `--border-card` |
| Raio do card | `14px` | `:91` | `--radius-lg` |
| Sombra do card | `0 20px 50px oklch(30% 0.02 80 / 10%)` | `:91` | `--shadow-login` (= `--shadow-modal`) |
| Padding do card | `16px 16px 18px` + `overflow: hidden` | `:91` | — |
| Layout interno | `display: flex; align-items: flex-start; gap: 12px` | `:91` | — |
| Quadrado do icone | `36x36`, `border-radius: 9px`, flex centrado | `:92` | `--radius-icon` |
| Icone | `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">`, `stroke="currentColor"`, `stroke-width="1.8"` | `:94`, `:97`, `:100` | — (mesmo padrao de icone da issue #35) |
| Icone de sucesso | circulo `r=9` + check `M8 12.5l2.5 2.5L16 9.5` | `:94` | — |
| Icone de alerta | triangulo `M12 3.5l9.5 16.5H2.5L12 3.5z` + barra `12,10→12,14` + ponto `r=1.1` em `12,17` | `:97` | — |
| Icone de falha | circulo `r=9` + X (`9,9→15,15` e `15,9→9,15`) | `:100` | — |
| Titulo | `font-size: 14px; font-weight: 700` | `:104` | `--fs-body` |
| Mensagem | `font-size: 13px; color: oklch(48% 0.014 80); margin-top: 3px; line-height: 1.4` | `:105` | cor = `--text-muted`; **13px nao tem token** (ver D6) |
| Botao fechar | `<svg width="16" height="16">` X com `stroke-width: 2`, `color: oklch(55% 0.014 80)`, `border: 0`, `background: transparent`, `padding: 2px`, `margin-top: 1px`, `aria-label="Fechar"` | `:107-108` | `--text-faint` |
| Barra de progresso | `position: absolute; left: 0; bottom: 0; height: 3px; width: 100%`, cor = cor do icone do estado, `opacity: 0.35`, `animation: toastBar {duracao}ms linear forwards`; renderizada **so** quando o toast auto-fecha | `:110-112` | — |
| Sucesso | titulo `Sucesso`; fundo do icone `oklch(93% 0.05 155)`; icone `oklch(40% 0.13 155)`; duracao `3800 ms` | `:155`, `:129` | `--income-soft` / `--income-icon` |
| Alerta | titulo `Alerta`; fundo do icone `oklch(94% 0.06 80)`; icone `oklch(48% 0.14 80)`; duracao `5200 ms` | `:156`, `:129` | `--pending-soft` / `--pending-icon` |
| Falha | titulo `Falha`; fundo do icone `oklch(94% 0.06 25)`; icone `oklch(42% 0.17 25)`; **sem auto-fechamento** | `:157`, `:130` | `--expense-soft` / `--expense-on-soft` |
| Animacao de entrada | `toastIn 0.3s ease`: `opacity 0 → 1`, `translateX(24px) scale(0.98) → translateX(0) scale(1)` | `:19-22`, `:173` | — |
| Animacao de saida | `toastOut 0.25s ease forwards`: `opacity 1 → 0`, `translateX(0) → translateX(24px)`, `max-height 200px → 0`, `margin-bottom 12px → 0` | `:23-26`, `:173` | — |
| Remocao do DOM | `260 ms` depois de iniciar a saida | `:141` | — |
| Animacao da barra | `toastBar`: `width 100% → 0%` | `:27-30` | — |
| Fechar manualmente | cancela o timer de auto-fechamento e inicia a mesma animacao de saida | `:148-151` | — |
| Coexistencia | varios toasts vivem simultaneamente na pilha (`toasts: [...s.toasts, toast]`) | `:134` | limitado a **3** por decisao do usuario (D11) |

## Mapa: mockup -> arquivos do app

O mockup nao desenha telas do FinanceOS; desenha o **componente de feedback** (a pilha de toasts) e uma galeria de referencia dos tres estados. O mapeamento e por elemento:

| Elemento do mockup | Onde vive/vivera no app |
|---|---|
| Pilha fixa de toasts (`:88-116`) | Componente novo em `frontend/src/app/core/` (ex.: `core/toast/`), com o host montado em `frontend/src/app/app.html` — **nao** em `layout/main-layout/main-layout.html`: `/login` e rota irma do shell (`app.routes.ts:8`) e precisa dos mesmos toasts |
| Estado do toast (`state.toasts`, `addToast`, `startLeave`, `removeToast`, `handleClose`, `:126-151`) | Service Angular novo em `core/services/` (ex.: `toast.service.ts`), com API `success()/warning()/error()`, consumido pelas 6 telas, pelo interceptor e pelo `permissionGuard` |
| Tokens de cor/raio/sombra (`:91-92`, `:155-157`) | `frontend/src/styles.scss` (`:root`) — todos ja existem, exceto o degrau de 13px (D6) |
| Exemplo "Credenciais inválidas." (`:157`, rotulado Falha no mockup e **Alerta** aqui, D12) | `features/auth/login/login.ts` (substitui a faixa de `login.html:11`) |
| Estado "Sucesso" — exemplo "Lançamento salvo com sucesso." (`:155`) | `features/transactions/transactions.ts` (`saveTransaction`, `saveEdit`, `cancelTransaction`) |
| Estado "Alerta" | `backend/src/main/java/br/com/financeos/shared/` (`ExceptionMapper` que nomeia os campos) + as 4 telas de cadastro, `core/guards/permission.guard.ts` e `core/interceptors/auth.interceptor.ts` |
| Faixa `.status-bar` substituida | `styles.scss:144-152`, `features/*/*.html:3` (5 telas) + `login.html:11`; `.status-bar.dismissible`/`.status-close` de `features/users/users.scss:47-63` |
| Mensagem de validacao/negocio no corpo da resposta | `backend/src/main/java/br/com/financeos/shared/` (`ExceptionMapper` novo) + `transactions/TransactionRequest.java`, `categories/CategoryRequest.java`, `profiles/ProfileRequest.java`, `auth/LoginRequest.java` (mensagens em portugues) e os `*Resource.java` correspondentes |

## Divergencias entre o mockup e o app atual

| # | Divergencia | Como a spec resolve |
|---|---|---|
| D1 | O app da feedback numa faixa `.status-bar` fixa no topo da tela; o mockup so tem toasts flutuantes no canto superior direito | **Mockup prevalece**: todo feedback **transitorio de resultado de acao ou de carga** migra para toast e a `.status-bar` deixa de ser usada (regra e estilo removidos de `styles.scss`) |
| D2 | Em Usuarios a faixa de erro fecha sozinha em 5000 ms (`ERROR_DISMISS_MS`, `users.ts:19`) | **Mockup prevalece** nas duracoes: 3800 ms (Sucesso), 5200 ms (Alerta), sem auto-fechamento (Falha). O `×` proprio da faixa (`users.scss:52`) e substituido pelo botao Fechar do toast |
| D3 | O app so tem feedback em vermelho; nao existe sucesso nem alerta | **Mockup prevalece na forma**; **a semantica e a da decisao do usuario** (ver "Taxonomia"), nao a leitura literal dos exemplos |
| D4 | O mockup usa "Categoria sem transações neste período." como exemplo de Alerta, mas nao desenha o `.empty-state` do Resumo (`dashboard.html:136,154`) | **Decisao do usuario prevalece sobre o exemplo do mockup**: Alerta passa a ser o estado de validacao/recusa corrigivel; o `.empty-state` do Resumo **permanece inalterado** e nao vira toast |
| D5 | O mockup nao desenha as legendas `field-error` por campo de Usuarios (`users.html:23,36,49,64,134,145,154,167`) nem o modal "Deseja sair sem salvar?" nem o `.empty-state` das tabelas | **Omissao nao autoriza remocao**: os tres permanecem. O toast e canal **adicional**, nao substituto da validacao por campo |
| D6 | A mensagem do toast e `13px`; o app nao tem esse degrau (`--fs-table` e `13.5px`, `--fs-pill` e `12px`) | **Mockup prevalece**: cria-se um token novo em `:root` (ex.: `--fs-toast-msg: 13px`) — nenhum valor literal pode nascer no `.scss` do componente (`knowledge/architecture.md`) |
| D7 | O mockup usa `z-index: 999`; no app a sidebar e `50` e o modal e `200/201` (issue #35) | **Mockup prevalece**: `999` mantem o toast acima do modal e do trilho |
| D8 | O mockup escreve com acentuacao plena; os textos do app hoje sao sem acento ("Nao foi possivel salvar", "Usuarios", "Configuracoes") | **Mockup prevalece e o usuario ampliou o escopo**: acentuacao correta em **todo** texto exibido do app (front e mensagens do backend), nao so nos toasts — ver a secao propria de criterios |
| D9 | O mockup e um `.dc.html` com fonte Inter carregada de `fonts.gstatic.com` (`:17`) e helpers `sc-for`/`sc-if` | Detalhe do formato do mockup: a Inter ja e self-hosted (`styles.scss:1-20`) e a implementacao usa `*ngFor`/`*ngIf`. **Nenhum recurso externo em runtime** continua valendo |
| D10 | O mockup nao desenha de onde o **texto** da mensagem vem | Regra do projeto prevalece: validacao e regra de negocio tem texto vindo do **backend**; textos fixos no front so para Sucesso e para recusas/falhas sem corpo (rede, timeout, 401/403) |
| D11 | O mockup permite pilha ilimitada de toasts (`:134`) | **Decisao do usuario prevalece**: maximo de **3** simultaneos; o quarto empurra o mais antigo para fora |
| D12 | O mockup rotula "Credenciais inválidas. Tente novamente." como **Falha**, mas a taxonomia do usuario reserva Falha a bug/indisponibilidade | **A taxonomia prevalece** (o coordenador tinha mantido o literal do mockup; o usuario reverteu na validacao manual em 28/07/2026): 401 do login = **Alerta**, com auto-fechamento de 5200 ms; 401 fora do login = Alerta |

## Regras existentes que restringem esta mudanca

Adicionar um canal de feedback e camada de apresentacao. O unico efeito legitimo no backend e **fazer a mensagem existente chegar ao cliente** (e traduzi-la/acentua-la): **nenhuma regra de negocio, status HTTP, endpoint ou validacao muda de comportamento**. Precisam sobreviver intactos:

- Edicao inline em Lancamentos, Categorias e Usuarios (issue #31): uma linha por vez, "Salvar" faz `PUT` + recarrega, "Sair" com alteracao pendente abre o modal "Deseja sair sem salvar?" e, sem alteracao, sai sem HTTP (`knowledge/architecture.md`).
- "Cancelar" dos formularios (issues #28/#31): estagio unico em Lancamentos/Categorias/Usuarios, dois estagios em Perfis, **nunca dispara requisicao HTTP**.
- Em qualquer erro de `saveEdit`, a linha **permanece em edicao** (`knowledge/users.md`, `knowledge/categories.md`).
- Legendas de validacao por campo em Usuarios, alimentadas por `violations[]` do 400 (issues #22/#24/#26).
- Visibilidade de menu/botao por permissao e `accessControl.require(...)` em todo endpoint (`knowledge/auth-and-permissions.md`).
- Interceptor: qualquer `401` continua forcando logout + redirect para `/login`.
- Recargas automaticas: Resumo recarrega ao trocar Ano/Mes via `(change)` (`knowledge/dashboard.md`).
- Regras de dominio que produzem os erros (categoria ativa/mesmo tipo, `status = null` para receitas, `CANCELED` so via `DELETE`, unicidade de categoria e de e-mail, perfil em uso) permanecem **identicas**, inclusive nos status HTTP.
- `styles.scss` e o **unico** arquivo do front com cor literal; nenhum recurso externo em runtime.

## Criterios de aceite

### Componente e comportamento do toast

- [x] Existe um servico de toast no front com tres chamadas (sucesso, alerta, falha) e um unico host montado em `frontend/src/app/app.html`, de modo que um toast disparado na tela de **login** (fora do `main-layout`) aparece igual ao disparado nas telas internas.
- [x] O toast renderiza no canto superior direito com `position: fixed; top: 24px; right: 24px; z-index: 999`, coluna de `width: 340px` e `max-width: calc(100vw - 32px)` (`Toast Notifications.dc.html:88`).
- [x] O card do toast usa `background: var(--surface)`, `border: 1px solid var(--border-card)`, `border-radius: var(--radius-lg)` (14px), `box-shadow: var(--shadow-login)` e `padding: 16px 16px 18px`.
- [x] Toast de **Sucesso**: titulo "Sucesso", quadrado de icone 36x36 com `border-radius: var(--radius-icon)`, fundo `var(--income-soft)`, icone (circulo + check, SVG 20px, `stroke-width: 1.8`) em `var(--income-icon)`; fecha sozinho em **3800 ms**.
- [x] Toast de **Alerta**: titulo "Alerta", fundo do icone `var(--pending-soft)`, icone (triangulo + "!") em `var(--pending-icon)`; fecha sozinho em **5200 ms**.
- [x] Toast de **Falha**: titulo "Falha", fundo do icone `var(--expense-soft)`, icone (circulo + X) em `var(--expense-on-soft)`; **permanece indefinidamente** ate o usuario clicar em Fechar (verificavel por teste de componente com timers falsos e observavel na tela).
- [x] Todo toast tem um botao Fechar com `aria-label="Fechar"` (SVG X de 16px, `stroke-width: 2`, cor `var(--text-faint)`); clicar nele remove o toast, inclusive antes do fim do auto-fechamento (o timer e cancelado, sem erro no console).
- [x] Sucesso e alerta exibem uma barra de progresso de `3px` na base do card, na cor do icone com `opacity: 0.35`, animando de `width: 100%` a `0%` em `linear` pela duracao do toast; o toast de Falha **nao** exibe essa barra.
- [x] Entrada anima com `toastIn 0.3s ease` (de `opacity: 0; translateX(24px) scale(0.98)`) e saida com `toastOut 0.25s ease forwards` (para `opacity: 0; translateX(24px)`, colapsando `max-height` e `margin-bottom` a 0), com o elemento saindo do DOM ~260 ms depois de iniciar a saida.
- [x] Disparar tres toasts em sequencia empilha os tres simultaneamente na coluna, separados por `12px`, sem sobreposicao; o mais antigo fica no topo.
- [x] Disparar um **quarto** toast com tres na tela deixa exatamente **3** cards no DOM: o mais antigo sai (com a animacao de saida) e o novo entra ao final da pilha — inclusive quando o mais antigo e um toast de Falha (teste de componente).
- [x] A mensagem do toast usa o token novo de 13px criado em `:root` e a cor `var(--text-muted)`; a varredura `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` continua saindo **vazia**.

### Sucesso: toda escrita persistida

- [x] `POST /api/transactions` com resposta 2xx exibe toast de **Sucesso** com "Lançamento salvo com sucesso." (texto do mockup, `:155`).
- [x] `PUT /api/transactions/{id}` (edicao inline) com resposta 2xx exibe toast de **Sucesso**.
- [x] `DELETE /api/transactions/{id}` (botao "Cancelar" da tabela, soft delete para `CANCELED`) com resposta 2xx exibe toast de **Sucesso** informando que o lancamento foi cancelado.
- [x] `POST` e `PUT /api/categories` com resposta 2xx exibem toast de **Sucesso** (o `PUT` com "Situação: Inativo" — desativacao — tambem).
- [x] `POST` e `PUT /api/users` com resposta 2xx exibem toast de **Sucesso**.
- [x] `DELETE /api/users/{id}` (botao "Desativar") com resposta 2xx exibe toast de **Sucesso**.
- [x] `POST`, `PUT` e `DELETE /api/profiles` com resposta 2xx exibem toast de **Sucesso**.
- [x] Nenhuma acao **sem** requisicao HTTP dispara toast: clicar "Cancelar" nos formularios das 4 telas de cadastro e clicar "Sair" na edicao inline sem alteracao pendente nao mostram toast nenhum (`httpMock.expectNone(() => true)` + ausencia do card no DOM).

### Alerta: validacao com o nome dos campos (mensagem vinda do backend)

- [x] `POST /api/transactions` sem `description` e sem `amount` responde **400** com corpo JSON contendo (a) a lista de violacoes por campo e (b) uma mensagem agregada em portugues nomeando os campos, no formato "Informe os campos obrigatórios: Descrição, Valor." — a frase e montada no **backend**, nao no Angular.
- [x] O front exibe essa mensagem agregada num toast de **Alerta** (titulo "Alerta", paleta `--pending-*`), **nao** de Falha, e o texto exibido e exatamente o recebido do backend.
- [x] As anotacoes de Bean Validation de `TransactionRequest`, `CategoryRequest`, `ProfileRequest` e `LoginRequest` passam a ter `message` em portugues acentuado (mesmo padrao da issue #26 em `UserCreateRequest`/`UserUpdateRequest`): nenhuma resposta 400 desses endpoints contem texto default do Hibernate Validator em ingles (ex.: "must not be blank", "must not be null").
- [x] `POST /api/categories` sem `name` responde 400 e a tela de Categorias mostra Alerta nomeando o campo "Nome".
- [x] `POST /api/users` sem `name`/`email`/`password`/`profileId` continua respondendo 400 com `violations[]` no formato de hoje (campo + mensagem), as legendas `field-error` continuam aparecendo abaixo de cada campo **e** um toast de Alerta nomeia os campos — os dois canais convivem.
- [x] `POST /api/transactions` com `amount = 0` (abaixo do `@DecimalMin("0.01")`) gera Alerta com a mensagem de limite em portugues nomeando "Valor" — campo invalido, e nao so ausente, tambem e Alerta.

### Alerta: recusas de negocio e de permissao

- [x] `POST/PUT /api/categories` com nome+tipo ja existentes (409) exibe toast de **Alerta** com "Já existe uma categoria com esse nome e tipo." vinda do corpo da resposta, e a linha em edicao **continua em edicao**.
- [x] `POST/PUT /api/users` com e-mail ja cadastrado (409) exibe toast de **Alerta** com "E-mail já cadastrado." vinda do corpo.
- [x] `DELETE /api/users/{id}` no proprio usuario (409) exibe toast de **Alerta** com "Você não pode desativar a própria conta." vinda do corpo.
- [x] `DELETE /api/profiles/{id}` de um perfil em uso (409) exibe toast de **Alerta** com a mensagem de negocio do backend.
- [x] `POST /api/transactions` com `categoryId` inexistente responde 400 com "Categoria informada não existe." **no corpo** (hoje o corpo vem vazio) e o toast de Alerta exibe esse texto.
- [x] `POST /api/transactions` com categoria de tipo diferente do lancamento responde 400 com "A categoria deve ser do mesmo tipo do lançamento." no corpo, e o toast exibe **esse** texto — os tres motivos de 400 desse endpoint deixam de ser indistinguiveis para o front.
- [x] `POST /api/transactions` com `status: "CANCELED"` responde 400 com "O status Cancelado só pode ser aplicado pelo cancelamento do lançamento." no corpo.
- [x] Abrir uma rota sem a permissao `VIEW` da tela (ex.: `/users` com perfil sem `USERS/VIEW`) continua redirecionando para `/dashboard` **e** exibe toast de **Alerta** em portugues informando a falta de permissao.
- [x] Uma resposta **401 fora do login** (sessao expirada) continua forcando logout + redirect para `/login` **e** exibe toast de **Alerta** informando que a sessao expirou (nao Falha — decisao do usuario).
- [x] O tratamento de erro do front exibe a mensagem do corpo quando ela existir e so usa texto fixo quando nao houver corpo (401/403/rede), mantendo o padrao ja adotado em `categories.ts:164` e `users.ts:316`.

### Falha: erro tecnico inesperado

- [x] Com a API fora do ar, carregar qualquer uma das telas (Resumo, Lancamentos, Categorias, Usuarios, Perfis) exibe toast de **Falha** (nao Alerta), que **nao** desaparece sozinho.
- [x] Uma resposta **5xx** de qualquer endpoint exibe toast de **Falha** com texto em portugues indicando erro inesperado do sistema (teste de componente com `HttpTestingController` devolvendo 500).
- [x] Erro de rede/timeout (`HttpErrorResponse` com `status = 0`) exibe toast de **Falha**.
- [x] Login com credenciais invalidas (401 em `POST /api/auth/login`) exibe toast de **Alerta** — titulo "Alerta", paleta `--pending-*`, auto-fechamento de 5200 ms com barra de progresso — com "Credenciais inválidas. Tente novamente." e a faixa vermelha do card de login deixa de existir. (Criterio mantido nesta secao para preservar a numeracao; a classificacao passou a Alerta com a reversao de D12 em 28/07/2026 — ver "Decisoes".)
- [x] Nenhum 400/409 de validacao ou de regra de negocio produz toast de **Falha** em nenhuma tela — verificavel nos testes de componente dos casos acima: o card renderizado tem titulo "Alerta".

### Remocao da faixa `.status-bar`

- [x] `rg "status-bar|status-close|dismissible" frontend/src` nao retorna nenhuma ocorrencia (regra global de `styles.scss:144-152`, os 6 templates e as regras de `users.scss:47-63` removidas).
- [x] O aparecimento de uma mensagem nao empurra mais o conteudo da tela: a posicao do primeiro painel abaixo do titulo e a mesma com e sem toast na tela.
- [x] O auto-fechamento proprio de Usuarios (`ERROR_DISMISS_MS`, `errorTimeout`, `dismissError`) deixa de existir no componente — quem controla tempo de exibicao e o servico de toast.

### Acentuacao de todo o texto exibido

- [ ] Todo texto exibido nas 6 telas esta acentuado corretamente em portugues, cobrindo no minimo: menu lateral (`layout/main-layout/main-layout.html`: "Lançamentos", "Configurações", "Usuários", "Sair", incluindo os `title`/`aria-label` do estado recolhido), titulos de pagina e de painel, cabecalhos de tabela, labels e placeholders de formulario, textos de botao, `.empty-state`, textos do modal de confirmacao e todas as strings de mensagem nos `.ts` das 6 telas.
- [x] Varredura de conferencia sai **vazia** em `frontend/src`: `rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'` (specs de teste atualizados junto quando asseverarem texto).
- [x] As mensagens do **backend** exibidas ao usuario estao acentuadas: as `message` de Bean Validation de `UserCreateRequest`/`UserUpdateRequest` (issue #26), as novas de Transacoes/Categorias/Perfis/Login e as mensagens de negocio dos `Resource` de Usuarios, Categorias, Lancamentos, Perfis e Dashboard — `rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'` nao retorna texto de mensagem sem acento.
- [x] Os testes de backend que asseveram texto de mensagem sao atualizados para o texto acentuado e `./mvnw test` passa.
- [x] Nenhum identificador de codigo, nome de rota, chave de objeto, valor de enum (`INCOME`, `PENDING`, `Screen`, `Action`) ou dado do banco foi renomeado: o `git diff` nao mostra alteracao em `app.routes.ts` (caminhos), em `core/models.ts` (tipos) nem em migrations do Flyway.
- [x] Nenhum caractere corrompido (mojibake) aparece na aplicacao rodando em `http://localhost`: os arquivos alterados continuam em UTF-8 e `index.html` mantem `<meta charset="utf-8">`.

### Nao-regressao

- [x] "Cancelar" dos formularios das 4 telas de cadastro continua sem disparar requisicao HTTP (`httpMock.expectNone(() => true)` nos specs existentes segue passando) e mantem o comportamento de estagio unico (Lancamentos/Categorias/Usuarios) e de dois estagios (Perfis).
- [x] "Sair" da edicao inline com alteracao pendente continua abrindo o modal "Deseja sair sem salvar?"; sem alteracao, sai direto sem HTTP.
- [x] As legendas `field-error` por campo de Usuarios continuam aparecendo abaixo do campo invalido, no formulario de criacao e na linha de edicao, com o texto vindo do backend.
- [x] Os `.empty-state` das tabelas ("Nenhuma categoria cadastrada", "Sem lançamentos cadastrados", "Nenhum usuário cadastrado", "Nenhum perfil cadastrado") e os do Resumo ("Sem dados no período") continuam existindo — so a acentuacao muda.
- [x] O `401` do JWT ausente/expirado continua sendo `401` (o `ExceptionMapper` novo **nao** altera o status de nenhuma resposta) e o interceptor continua deslogando — validado por teste de backend e pelo teste do interceptor.
- [x] Os status HTTP de todas as regras de negocio continuam os mesmos (400/409 onde ja eram), com os testes de backend existentes passando alem dos novos.
- [x] O modal de confirmacao continua por cima do trilho lateral (`z-index` 200/201 sobre a sidebar 50) e o toast (`z-index: 999`) aparece por cima do modal.
- [x] `npm test` (frontend) e `./mvnw test` (backend) passam; `npm run build` nao gera warning de budget `anyComponentStyle` novo.

## Pontos em aberto

Nenhum. As quatro duvidas da primeira versao foram respondidas pelo usuario e estao registradas em "Decisoes". Dos tres pontos **derivados** que ficaram para ele contestar na revisao, dois foram confirmados na validacao manual — (1) exclusao/soft delete tambem dispara Sucesso e (2) recusa de negocio corrigivel (409, 400 de regra, falta de permissao) e Alerta e nao Falha — e o terceiro foi **revertido**: (3) credenciais invalidas no login deixaram de ser Falha e passaram a **Alerta** em 28/07/2026 (D12).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/39
- Design (fonte da verdade visual): `specs/39-ajustes-alertas/design/Toast Notifications.dc.html`, resumo em `specs/39-ajustes-alertas/design/NOTAS.md`
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/auth-and-permissions.md`, `knowledge/users.md`, `knowledge/categories.md`, `knowledge/transactions.md`, `knowledge/dashboard.md`, `knowledge/accounts.md` e `knowledge/cards.md` (para confirmar a remocao de Contas/Cartoes)
- Codigo inspecionado: `frontend/src/styles.scss`, `frontend/src/index.html`, `frontend/src/app/app.html`, `app.routes.ts`, `core/formatters.ts`, `core/interceptors/auth.interceptor.ts`, `core/guards/permission.guard.ts`, `layout/main-layout/`, `features/auth/login/`, `features/dashboard/`, `features/transactions/`, `features/categories/`, `features/users/`, `features/profiles/`, `backend/src/main/java/br/com/financeos/{transactions,categories,profiles,auth,shared}/`
