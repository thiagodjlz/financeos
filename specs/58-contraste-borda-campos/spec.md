---
issue: 58
url: https://github.com/thiagodjlz/financeos/issues/58
title: "Borda dos campos de formulario nao atinge o contraste minimo (1.44:1)"
slug: contraste-borda-campos
domains: [auth, users, categories, transactions, dashboard]
target: v1.0.1
stage: validated
branch: fix/issue-58-contraste-borda-campos
created: 2026-09-20
---

# Borda dos campos de formulario nao atinge o contraste minimo (1.44:1)

## Historia

Como usuario do FinanceOS com baixa visao (ou usando a tela sob luz forte), quero enxergar claramente onde comeca e termina cada campo de formulario, para que eu consiga preencher login, lancamentos, categorias, usuarios e perfis sem ter que adivinhar os limites dos campos.

## Contexto

A issue e uma **divida de acessibilidade herdada da issue #54** (PR #55), deixada de fora de proposito na validacao daquela feature: o par `--border-input` sobre `--surface` mede **1.44:1**, contra os **3:1** que a WCAG 2.1 exige para borda de componente de interface (criterio 1.4.11, Non-text Contrast). Quem delimita o campo e a borda — entao e ela que precisa do contraste, nao o texto digitado. Vale para todo `input`, `select` e `textarea`, desktop e mobile.

A medicao nao e leitura visual: sai dos proprios tokens `oklch` de `frontend/src/styles.scss` por conversao OKLab -> sRGB linear -> luminancia relativa WCAG. A tabela dos 30+ pares auditados esta em `specs/54-responsividade-mobile/implementation-notes.md`; os outros quatro reprovados (`--text-faint`, `--sidebar-text-dim`, `--scroll-shadow-edge` e o `::placeholder`) ja foram corrigidos la, **no token**. Esta e a ultima pendencia da auditoria.

Motivo de ser issue propria (citando a issue): "a mudanca escurece visivelmente a borda de *todo* campo do sistema, inclusive no desktop. Nao e correcao invisivel — e uma decisao de aparencia, que merece ser olhada na tela antes de entrar".

### Estado atual no codigo (branch `v1.0.1`)

- `frontend/src/styles.scss:72` — `--border-input: oklch(88% 0.008 80)` (`#dad7d2`).
- **Quatro consumidores do token**, todos em `styles.scss`: a regra unica `input, select { border: 1px solid var(--border-input) }` (linha 253), a borda do `.ghost-button` (linha 327), `--chart-zero: var(--border-input)` (linha 151, linha do zero do grafico do Resumo) e o anel do `.loading-state::before` (linha 439). Nenhum `.scss` de tela declara borda de campo propria (convencao do design system da #35: `styles.scss` e o unico arquivo com cor literal).
- Estados vizinhos que precisam continuar distinguiveis: foco (`input:focus-visible` -> `outline: 2px solid var(--accent)`, `outline-offset: 1px`; `--accent`/`--surface` = 4.76:1), invalido (`input.invalid` -> `border-color: var(--expense)` + `box-shadow 0 0 0 1px var(--expense)`; 4.66:1, da #45) e desabilitado.
- **Nao existe hoje nenhum `input`/`select` com `disabled` no app** — os unicos controles desabilitados sao botoes (`[disabled]="saving()"` e o "Editar" das demais linhas durante a edicao inline). A unica superficie desabilitada que consome `--border-input` e o `.ghost-button:disabled` (opacidade 0.55, isento de contraste pela WCAG 1.4.3, que dispensa componente inativo).
- Fundos adjacentes a um campo no app, alem de `--surface` (`#ffffff`): `--surface-login-input` (`oklch(98.5% 0.003 90)`, fundo dos campos do login) e `--card-row-bg` = `--bg-app` (`oklch(97.3% 0.006 80)`, fundo do cartao no modo mobile, onde os campos da edicao inline aparecem).

### Medicao dos valores candidatos (mesmo metodo da #54)

O metodo foi validado reproduzindo tres numeros publicados na tabela da #54 a partir dos tokens reais — `--text-muted: oklch(48% 0.014 80)` = 6.54:1, `--text-faint: oklch(53% 0.014 80)` = 5.28:1 e `--accent: oklch(56% 0.16 262)` = 4.76:1 — batendo exatamente.

| `--border-input` | Hex | vs `--surface` | vs `--surface-login-input` | vs `--card-row-bg` | Situacao |
|---|---|---|---|---|---|
| `oklch(88% 0.008 80)` (atual) | `#dad7d2` | **1.44:1** | 1.42:1 | 1.38:1 | Reprovado — e o defeito desta issue |
| `oklch(72% 0.008 80)` (sugerido na issue) | `#a7a49f` | **2.48:1** | 2.38:1 | 2.29:1 | **Descartado** — nao atinge os 3:1 |
| `oklch(66% 0.008 80)` | `#95928d` | 3.11:1 | 2.98:1 | 2.88:1 | Preterido — falha nos fundos do login e do cartao |
| **`oklch(64% 0.008 80)`** (escolhido) | `#8f8c87` | **3.36:1** | **3.22:1** | **3.11:1** | **Adotado** (ver "Decisoes") |

O valor sugerido na issue foi escrito como "por volta de" e nao fecha a meta: `72%` mede 2.48:1. O valor adotado e `oklch(64% 0.008 80)`, unico candidato que passa dos 3:1 contra os **tres** fundos de campo existentes no app.

### Regras existentes que restringem a correcao

- **Correcao de contraste se faz no token, nunca em cor literal na tela** (`knowledge/architecture.md`, secao "Responsividade e mobile", registrada pela #54).
- **`styles.scss` e o unico arquivo do frontend com cor literal** (design system da #35).
- Este trabalho e **camada de apresentacao**: nenhuma regra de negocio, endpoint, DTO, permissao ou migration muda (CLAUDE.md — toda validacao continua imposta no back-end). Nada sob `backend/` e tocado.
- Precisam sobreviver sem regressao: destaque de campo invalido (#45), edicao inline com "Salvar"/"Sair" (#31), botao "Cancelar" sem HTTP (#28/#31), grafico do Resumo (#48).
- Alvo `v1.0.1`: correcao de versao ja cortada. Branch `fix/issue-58-contraste-borda-campos` a partir de `origin/v1.0.1`, PR contra `v1.0.1`, build incrementada sozinha pelo hook no commit (`VERSION` hoje em `1.0.1-05`) — nunca editar `VERSION`/`pom.xml`/`version.ts` na mao. Depois do merge, levar a correcao para a `main`.

## Criterios de aceite

- [x] 1. Em `frontend/src/styles.scss`, `--border-input` passa de `oklch(88% 0.008 80)` para **`oklch(64% 0.008 80)`** (`#8f8c87`), cuja razao de contraste contra `--surface` (`#ffffff`), calculada pelo metodo da #54 (OKLab -> sRGB linear -> luminancia relativa WCAG 2.1), e **3.36:1** — acima do minimo de 3:1 (hoje 1.44:1). O calculo que produz o numero fica registrado em `specs/58-contraste-borda-campos/implementation-notes.md`.
- [x] 2. O mesmo valor mede **>= 3.0:1** tambem contra `--surface-login-input` (**3.22:1**) e contra `--card-row-bg` (**3.11:1**), os outros dois fundos adjacentes de campo no app (login e cartao do modo mobile), com as razoes registradas na mesma tabela.
- [x] 3. A correcao e **so no token**: a regra unica `input, select { border: 1px solid var(--border-input) }` continua em `frontend/src/styles.scss` e nenhum `.scss` sob `frontend/src/app` ganha borda ou cor de campo propria — a varredura de cor literal do design system em `frontend/src/app` (`*.scss`) continua sem saida. A varredura mira so estilo de producao, e nenhum outro criterio desta spec exige cor literal ali.
- [x] 4. Com a stack em `http://localhost`, o DevTools mostra a cor computada `#8f8c87` (`rgb(143, 140, 135)`) na borda dos campos das telas Login, Lancamentos, Categorias, Usuarios e Perfis — nenhum campo permanece em `#dad7d2`.
- [x] 5. Estado de foco continua distinguivel do normal: as regras `input:focus-visible, select:focus-visible` seguem inalteradas (`outline: 2px solid var(--accent)`, `outline-offset: 1px`), e ao chegar com Tab no campo "Descricao" de Lancamentos o anel azul aparece **alem** da borda (par `--accent`/`--surface` segue em 4.76:1).
- [x] 6. Estado invalido continua distinguivel do normal: `input.invalid`/`select.invalid` mantem `border-color: var(--expense)` + `box-shadow: 0 0 0 1px var(--expense)`; submeter o cadastro de Usuarios com "Nome" vazio marca o campo em vermelho, visivelmente diferente dos campos normais (comportamento da #45, sem regressao).
- [x] 7. Estado desabilitado continua distinguivel: com uma linha de Categorias em edicao inline, o botao "Editar" das demais linhas continua com `opacity: 0.55` e `cursor: not-allowed` inalterados em `styles.scss` e permanece visivelmente mais apagado que um "Editar" habilitado. (O app nao possui `input`/`select` desabilitado; se a implementacao introduzir uma regra `input:disabled`, ela precisa ser citada em `implementation-notes.md` com o par medido.)
- [x] 8. Os demais consumidores do token escurecem junto e sao conferidos na tela: no Resumo, a linha do zero do grafico (`--chart-zero`) continua distinguivel das linhas de grade (`--chart-grid` = `--border-th`, que nao muda) e o grafico renderiza sem erro no console do navegador; a borda do `.ghost-button` e o anel do `.loading-state` continuam legiveis.
- [x] 9. Nenhuma regra de negocio muda: `git diff --name-only` nao lista arquivo algum sob `backend/` nem nenhum `.ts`/`.html` do frontend (arquivos de versao alterados pelo hook no commit — `VERSION`, `backend/pom.xml`, `frontend/src/app/core/version.ts` — nao contam).
- [x] 10. `cd frontend && npm test` passa sem que nenhum `.spec.ts` precise ser alterado, e `cd frontend && npm run build` conclui sem estourar budget.
- [x] 11. `specs/58-contraste-borda-campos/implementation-notes.md` traz a tabela de contraste atualizada com a linha `--border-input` / `--surface` marcada como **OK**, encerrando o unico item reprovado da auditoria da #54.

## Fora de escopo

- `--border-card` sobre `--card-row-bg` (1.21:1): na #54 foi classificado como **nao** sendo borda de controle de formulario nem texto (a separacao do cartao vem do fundo tonal mais a borda). Nao entra aqui.
- Contraste de componente desabilitado: a opacidade 0.55 de `.primary-button:disabled`/`.ghost-button:disabled`/`.danger-button:disabled` **nao muda** (isenta pela WCAG 1.4.3).
- Criar um token separado (ex.: `--border-soft`) para preservar o tom atual em algum consumidor do `--border-input` — descartado na Decisao 2.
- Revisao da paleta `oklch`, dark mode ou `prefers-color-scheme`.
- Qualquer mudanca de tamanho, raio, padding, tipografia ou layout dos campos — so a cor da borda.
- Qualquer arquivo sob `backend/`.
- Editar `knowledge/architecture.md` nesta branch: a secao "Responsividade e mobile" (onde a divida esta anotada) so existe na `main` — a remocao da nota de divida acontece na etapa de sync de conhecimento, depois de a correcao ser levada para a `main`.

## Decisoes

- **2026-09-20 — Alvo `v1.0.1`.** O usuario escolheu tratar a issue como correcao de uma versao ja cortada: branch `fix/issue-58-contraste-borda-campos` a partir de `origin/v1.0.1`, PR contra `v1.0.1`, build incrementada pelo hook no commit. Depois do merge, a correcao precisa ser levada para a `main`.
- **2026-09-20 — Valor do token: `--border-input: oklch(64% 0.008 80)` (`#8f8c87`).** O valor sugerido na issue (`oklch(72% 0.008 80)`) foi **descartado** por medir 2.48:1 contra `--surface`, abaixo dos 3:1 exigidos — a sugestao era aproximada ("por volta de"). O usuario optou pela alternativa que cobre os **tres** fundos de campo do app: 3.36:1 contra `--surface`, 3.22:1 contra `--surface-login-input` e 3.11:1 contra `--card-row-bg`. Por isso o criterio 2 **permanece no escopo** (nao virou opcional). A medicao foi reconferida por fora reproduzindo, com os tokens reais, os valores publicados na auditoria da #54 (6.54 / 5.28 / 4.76).
- **2026-09-20 — Os outros tres consumidores do token escurecem junto.** Borda do `.ghost-button`, `--chart-zero` (linha do zero do grafico do Resumo) e anel do `.loading-state` continuam derivando de `--border-input`, mantendo a convencao "correcao de contraste se faz no token". **Nao** sera criado token separado (`--border-soft` ou equivalente). O criterio 8 segue valendo como esta, conferindo os tres na tela.
- **2026-09-20 — Criterio que dependa de comportamento nativo nao reproduzido pelo ambiente de validacao nao reprova a feature na etapa de verificacao** (padrao acordado na issue #54). Nesta spec nenhum criterio depende disso: o contraste e medido a partir dos tokens e conferido no computed style, o que o ambiente reproduz.

## Pontos em aberto

- Nenhum.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/58
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md` (secoes "Comandos", "Design system do frontend (issue #35)" e, na `main`, "Responsividade e mobile (issue #54)"), `CLAUDE.md` (convencoes e versionamento).
- Specs anteriores: `specs/54-responsividade-mobile/spec.md` e `specs/54-responsividade-mobile/implementation-notes.md` (tabela de contraste e registro da divida), `specs/45-campos-obrigatorios/` (estado invalido), `specs/35-redesign-interface/` (design system em tokens).
- Codigo: `frontend/src/styles.scss` (linhas 72, 151, 253, 327, 439), `frontend/src/app/features/auth/login/login.scss`.
