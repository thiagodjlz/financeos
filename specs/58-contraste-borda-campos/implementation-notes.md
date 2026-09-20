# Notas de implementacao

Branch: `fix/issue-58-contraste-borda-campos` (base: `v1.0.1`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 5 de 5 concluidas (ver `tasks.md`)

Branch criada a partir de `origin/v1.0.1` (nao da `main`), com `branch.fix/issue-58-contraste-borda-campos.financeosVersionBase = v1.0.1` configurado para o hook `pre-commit` incrementar a build (`VERSION` hoje em `1.0.1-05`). `core.hooksPath` ja apontava para `.githooks` neste clone. `VERSION`, `backend/pom.xml` e `frontend/src/app/core/version.ts` **nao** foram tocados.

## Arquivos alterados

- `frontend/src/styles.scss` — **unica alteracao de producao**, uma linha (linha 72): `--border-input: oklch(88% 0.008 80)` passa a `--border-input: oklch(64% 0.008 80)` (`#8f8c87`, `rgb(143, 140, 135)`). Nenhuma outra linha do arquivo mudou: as quatro regras consumidoras (`input, select` na linha 253, `.ghost-button` na 327, `--chart-zero` na 151 e `.loading-state::before` na 439) e os blocos de foco (271-276) e de invalido (278-288) ficaram intactos e apenas herdam o tom novo.
- `specs/58-contraste-borda-campos/implementation-notes.md` — este arquivo (evidencia dos criterios 1, 2 e 11).
- `specs/58-contraste-borda-campos/tasks.md` — tarefas marcadas conforme concluidas.
- `specs/58-contraste-borda-campos/spec.md` — front-matter para `stage: implemented` / `branch:`.

## Contraste — metodo e medicao

**Metodo** (o mesmo da auditoria da issue #54): `oklch(L% C H)` -> OKLab (`a = C·cos H`, `b = C·sin H`) -> cone LMS (`l_`, `m_`, `s_` elevados ao cubo) -> **sRGB linear** pela matriz inversa de Bjorn Ottosson, com clamp em `[0, 1]` -> **luminancia relativa WCAG 2.1** direto do linear (`Y = 0.2126·R + 0.7152·G + 0.0722·B`, ja que os canais estao em sRGB linear, que e exatamente o espaco que a formula da WCAG exige apos a linearizacao) -> razao `(Y_claro + 0.05) / (Y_escuro + 0.05)`. O hex/`rgb()` de cada token sai do mesmo pipeline com a codificacao gamma sRGB e arredondamento para 8 bits. O script de calculo ficou no scratchpad da sessao, fora do repositorio.

**Conferencia de ancoragem** — antes de escrever o valor novo, o metodo foi validado reproduzindo, a partir dos tokens reais de `frontend/src/styles.scss`, tres numeros publicados na tabela da #54:

| Token | Valor no `styles.scss` | Calculado aqui vs `--surface` | Publicado na #54 |
|---|---|---|---|
| `--text-muted` | `oklch(48% 0.014 80)` | **6.543:1** | 6.54:1 |
| `--text-faint` | `oklch(53% 0.014 80)` | **5.284:1** | 5.28:1 |
| `--accent` | `oklch(56% 0.16 262)` | **4.756:1** | 4.76:1 |

Os tres batem no centesimo — o metodo esta reproduzido corretamente.

**Fundos de campo do app** (os tres sobre os quais uma borda de `input`/`select` pode aparecer):

| Token | Valor | Hex | `Y` |
|---|---|---|---|
| `--surface` | `#ffffff` | `#ffffff` | 1.0000 |
| `--surface-login-input` | `oklch(98.5% 0.003 90)` | `#fbfaf8` | 0.9558 |
| `--card-row-bg` (= `--bg-app`) | `oklch(97.3% 0.006 80)` | `#f8f6f2` | 0.9210 |

**Candidatos de `--border-input`** (minimo WCAG 2.1 SC 1.4.11 Non-text Contrast = **3:1**):

| Valor | Hex / `rgb()` | vs `--surface` | vs `--surface-login-input` | vs `--card-row-bg` | Veredito |
|---|---|---|---|---|---|
| `oklch(88% 0.008 80)` (anterior) | `#dad7d2` / `rgb(218, 215, 210)` | 1.436:1 | 1.375:1 | 1.328:1 | **FALHA** nos tres — e o defeito da issue |
| `oklch(72% 0.008 80)` (sugerido na issue) | `#a7a49f` | 2.482:1 | 2.377:1 | 2.295:1 | FALHA — descartado na Decisao 2 da spec |
| `oklch(66% 0.008 80)` | `#95928d` | 3.112:1 | 2.981:1 | 2.878:1 | FALHA no login e no cartao — preterido |
| **`oklch(64% 0.008 80)` (adotado)** | **`#8f8c87` / `rgb(143, 140, 135)`** | **3.365:1** | **3.223:1** | **3.112:1** | **OK apos correcao** |

### Linha de encerramento da auditoria da #54

| Par | Antes | Depois | Minimo | Situacao |
|---|---|---|---|---|
| `--border-input` / `--surface` | 1.44:1 | **3.36:1** | 3:1 | **OK** (era o unico item ainda reprovado da auditoria da #54) |
| `--border-input` / `--surface-login-input` | 1.38:1 | **3.22:1** | 3:1 | **OK** |
| `--border-input` / `--card-row-bg` | 1.33:1 | **3.11:1** | 3:1 | **OK** |

Com isso, **o unico item reprovado que restava da auditoria de contraste da issue #54 esta encerrado**. A tabela de `specs/54-responsividade-mobile/implementation-notes.md` fica como esta (registro historico daquela execucao, nao se reescreve), e a nota de divida em `knowledge/architecture.md` nao foi tocada nesta branch — a secao "Responsividade e mobile" so existe na `main` e a remocao e trabalho do `/pipeline:sync-knowledge`, depois de a correcao ser levada para la.

Pares vizinhos que **nao** mudaram e seguem distinguindo os estados do campo: foco `--accent` / `--surface` = 4.76:1 (`outline: 2px solid var(--accent)`, `outline-offset: 1px`) e invalido `--expense` / `--surface` = 4.66:1 (`border-color` + `box-shadow 0 0 0 1px`). Nenhuma regra `input:disabled` / `select:disabled` foi criada (Decisao tecnica 2 do plano) — o app nao possui `input`/`select` desabilitado, entao nenhum par de contraste novo nasceu.

## Varreduras e comandos de conferencia

| Conferencia | Comando | Resultado |
|---|---|---|
| Criterio 1 | `grep -rn "border-input" frontend/src --include="*.scss"` | `styles.scss:72` com `oklch(64% 0.008 80)` e as derivacoes intactas nas linhas 151, 253, 327 e 439 |
| Criterio 3 | `grep -rEn "#[0-9a-fA-F]{3,8}\b\|oklch\(\|rgba?\(" frontend/src/app --include="*.scss"` | **sem saida** — nenhum `.scss` de tela ganhou cor literal |
| Criterio 3 | `grep -rn "border-input" frontend/src --include="*.scss"` | ocorrencias **so** em `frontend/src/styles.scss` |
| Criterios 5 e 6 | `git diff frontend/src/styles.scss` | **1 linha alterada** (`1 insertion(+), 1 deletion(-)`) — blocos `:focus-visible` e `.invalid` comprovadamente intactos |
| Criterio 7 | `grep -rn "input:disabled\|select:disabled" frontend/src --include="*.scss"` | **sem saida** |
| Criterio 9 | `git diff --name-only` | apenas `frontend/src/styles.scss` (mais a pasta `specs/58-contraste-borda-campos/`, untracked) — nada sob `backend/`, nenhum `.ts`, nenhum `.html` |
| Criterio 10 | `git diff --name-only -- "frontend/**/*.spec.ts"` | **vazio** |

## Testes e build

- `cd frontend && npm test` -> **22 arquivos / 215 testes, todos verdes**, sem alterar nenhum `.spec.ts`.
- `cd frontend && npm run build` -> **bundle gerado sem erro e sem warning de orcamento** (`anyComponentStyle` nao disparou). `styles-*.css` em 12.16 kB (2.96 kB transferido); total inicial 302.36 kB.

Nenhum teste automatizado enxerga esta mudanca: a suite roda em jsdom, que nao aplica a folha global nem resolve `var()` em cascata. Por isso **nao** foi criado `.spec.ts` lendo `getComputedStyle(input).borderColor` (voltaria vazio e violaria o criterio 10). Os criterios 4 a 8 se decidem na tela, apos `docker compose up -d --build` — o rebuild e pre-requisito, senao o nginx serve o `styles.css` antigo e o Computed continua em `rgb(218, 215, 210)`.

## Decisoes

- **Metodo de luminancia sem arredondamento para 8 bits.** A luminancia foi calculada direto do sRGB **linear** produzido pela conversao OKLab, sem passar por `#rrggbb`. Foi essa variante que reproduziu as tres ancoras da #54 no centesimo (6.543 / 5.284 / 4.756 contra os publicados 6.54 / 5.28 / 4.76); arredondando para 8 bits antes da luminancia os mesmos pares dao 6.529 / 5.287 / 4.733, que nao batem com o publicado. O `rgb(143, 140, 135)` do criterio 4 continua vindo do pipeline com gamma e arredondamento de 8 bits, que e o que o DevTools mostra. Os dois caminhos concordam no veredito de todos os candidatos.
- **Nenhum consumidor do token foi poupado.** `.ghost-button`, `--chart-zero` e `.loading-state::before` continuam derivando de `--border-input` e escurecem junto, conforme a Decisao 2 da spec. Nenhum token novo (`--border-soft` ou equivalente) foi criado e nenhuma cor literal entrou em `.scss` de tela.
- **Nenhuma regra `input:disabled` criada** (Decisao tecnica 2 do plano): o app nao tem campo desabilitado, e a regra abriria um par de contraste que a spec nao mediu.

## Desvios em relacao ao plano e as tarefas

- **Duas celulas da tabela da spec para o valor *anterior* nao se reproduziram.** A spec (e a T3) registram o `oklch(88% 0.008 80)` atual como 1.44 / **1.42** / **1.38** contra `--surface` / `--surface-login-input` / `--card-row-bg`. O recalculo com os tokens reais da 1.436 / **1.375** / **1.328** — o 1.44 bate, as duas outras ficam ~0.05 abaixo do anotado na spec. As tabelas acima trazem os valores recalculados. O desvio nao afeta criterio nenhum: os numeros que os criterios 1 e 2 exigem sao os do **valor novo** (3.36 / 3.22 / 3.11), e esses reproduziram exatamente; as celulas divergentes descrevem o estado reprovado que esta sendo corrigido, e continuam muito abaixo de 3:1 nas duas leituras.
- Fora isso, nenhum desvio: as 5 tarefas de `tasks.md` foram executadas na ordem, nenhuma tarefa foi acrescentada ou deixada de fora, e a mudanca de producao ficou na unica linha prevista pelo plano.
