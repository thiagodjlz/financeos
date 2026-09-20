# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

Feature de camada de apresentacao: uma linha de producao (`frontend/src/styles.scss:72`) mais a evidencia. Sem backend, sem migration, sem `.ts`/`.html`, sem `.spec.ts` — por isso a lista e unica, sem secoes por camada.

- [x] **T1** — Recalcular o contraste de `oklch(64% 0.008 80)` pelo metodo da #54 (OKLab -> sRGB linear -> luminancia relativa WCAG 2.1) contra `--surface`, `--surface-login-input` e `--card-row-bg`, conferindo antes o metodo ao reproduzir as tres ancoras publicadas na #54 a partir dos tokens reais (`--text-muted` 6.54:1, `--text-faint` 5.28:1, `--accent` 4.76:1).
  - Arquivos: nenhum do repositorio — script de calculo fica no scratchpad da sessao (plano, "Evidencia")
  - Criterios: 1, 2 (produz os numeros; quem os registra e T3)
  - Precede T2 de proposito: e o que evita repetir o engano do `72%` sugerido na issue, que mede 2.48:1

- [x] **T2** — Trocar **somente a linha 72** de `frontend/src/styles.scss`: `--border-input: oklch(88% 0.008 80)` passa a `oklch(64% 0.008 80)`. Nao tocar nas linhas 151 (`--chart-zero`), 249-253 (`input, select`), 271-276 (`:focus-visible`), 278-288 (`.invalid`), 326-327 (`.ghost-button`) e 435-439 (`.loading-state::before`) — elas apenas herdam o tom novo. Nao criar token novo (`--border-soft`) nem regra `input:disabled` (Decisoes tecnicas 1 e 2 do plano).
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 1, 3, 4, 5, 6, 7, 8

- [x] **T3** — Criar `implementation-notes.md` no padrao da esteira com a tabela de contraste do token novo (`--surface` 3.36:1, `--surface-login-input` 3.22:1, `--card-row-bg` 3.11:1, minimo 3, veredito **OK apos correcao**, era 1.44 / 1.42 / 1.38), o metodo de calculo, a conferencia de ancoragem de T1 e a declaracao de que o unico item reprovado da auditoria da #54 esta encerrado (sem reescrever `specs/54-responsividade-mobile/implementation-notes.md`).
  - Arquivos: `specs/58-contraste-borda-campos/implementation-notes.md` (novo)
  - Criterios: 1, 2, 11

- [x] **T4** — Rodar as varreduras e os comandos de conferencia e registrar o resultado em `implementation-notes.md`: `rg -n "border-input" frontend/src --glob "*.scss"` so com ocorrencias em `styles.scss`; `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` sem saida; `rg -n "input:disabled|select:disabled" frontend/src --glob "*.scss"` sem saida; `git diff frontend/src/styles.scss` com uma unica linha alterada; `git diff --name-only` sem nada sob `backend/` e sem `.ts`/`.html`; `git diff --name-only -- "frontend/**/*.spec.ts"` vazio.
  - Arquivos: `specs/58-contraste-borda-campos/implementation-notes.md`
  - Criterios: 3, 5, 7, 9

- [x] **T5** — Rodar `cd frontend && npm test` (mesmo total de testes de hoje, verde, **sem alterar nenhum `.spec.ts`**) e `cd frontend && npm run build` (sem warning novo de budget `anyComponentStyle`), registrando ambos em `implementation-notes.md`. Falha em `npm test` significa que algo alem do token foi tocado — nao que o teste precisa mudar.
  - Arquivos: `specs/58-contraste-borda-campos/implementation-notes.md`
  - Criterios: 10

## Validacao manual (etapa 8)

Pre-requisito de todos os itens abaixo: `docker compose up -d --build` (etapa 7). Sem o `--build`, o nginx serve o `styles.css` antigo e o criterio 4 reprova por motivo errado.

Nenhum teste automatizado enxerga esta mudanca: a suite roda em jsdom, que nao aplica a folha global nem resolve `var()` em cascata. **Nao** criar `.spec.ts` que leia `getComputedStyle(input).borderColor` — o valor volta vazio e o teste violaria o criterio 10. Por isso os criterios 4 a 8 nao tem tarefa de teste e se decidem na tela:

- **Criterio 4** — Em `http://localhost`, DevTools > Elements > Computed, conferir `border-color` de um campo em cada tela: `/login` (Usuario e Senha), `/transactions` (campo "Descricao" do formulario **e** um campo da linha em edicao inline, que no modo mobile fica sobre `--card-row-bg`), `/categories` ("Nome"), `/users` ("Nome"), `/profiles` ("Nome do perfil"). Esperado `rgb(143, 140, 135)` em todos; nenhum campo em `rgb(218, 215, 210)`.
- **Criterio 5** — Em `/transactions` a 1440px, navegar por `Tab` ate "Descricao": o anel azul de 2px deve aparecer **por fora** da borda (`outline-offset: 1px`), visivelmente distinto do estado normal ja escurecido.
- **Criterio 6** — Em `/users`, submeter o cadastro com "Nome" vazio: borda vermelha + `box-shadow` + legenda `.field-error`, nitidamente diferente dos campos normais.
- **Criterio 7** — Em `/categories`, clicar "Editar" numa linha e conferir no Computed que o "Editar" das demais mantem `opacity: 0.55` e `cursor: not-allowed`, visivelmente mais apagado que um habilitado.
- **Criterio 8** — Tres pontos: (a) `/dashboard` com dados no periodo — a linha do zero do grafico continua distinguivel das linhas de grade (`--chart-grid` = `--border-th`, que nao muda) **e nao passa a competir com a serie de dados**, console sem erro; (b) o "Cancelar" (`.ghost-button`) de `/categories` continua legivel e ainda se le como secundario ao lado do "Salvar" primario; (c) com throttling "Slow 3G", abrir `/transactions` e ver o anel do `.loading-state` durante a carga.
- **Aparencia geral** — A mudanca escurece a borda de todo campo do sistema, inclusive no desktop; e a razao de a issue existir separada da #54. Se o resultado parecer pesado demais, isso e **decisao de aparencia do usuario**, nao defeito: o valor sai de medicao e a alternativa mais clara (`66%`) reprova nos fundos do login e do cartao.

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | `--border-input` vai a `oklch(64% 0.008 80)`, 3.36:1 vs `--surface`, com calculo registrado | T1, T2, T3 |
| 2 | Mesmo valor >= 3.0:1 vs `--surface-login-input` (3.22) e `--card-row-bg` (3.11) | T1, T3 |
| 3 | Correcao so no token; nenhum `.scss` de tela ganha cor/borda propria | T2, T4 |
| 4 | Computed `rgb(143, 140, 135)` nos campos das cinco telas | T2 (+ validacao manual) |
| 5 | Foco continua distinguivel; bloco `:focus-visible` intacto | T2, T4 (+ validacao manual) |
| 6 | Invalido continua distinguivel; bloco `.invalid` intacto | T2 (+ validacao manual) |
| 7 | Desabilitado continua distinguivel; nenhuma regra `input:disabled` criada | T2, T4 (+ validacao manual) |
| 8 | Ghost-button, `--chart-zero` e `.loading-state` escurecem junto e seguem legiveis | T2 (+ validacao manual) |
| 9 | Nenhuma regra de negocio muda: nada sob `backend/`, nenhum `.ts`/`.html` | T4 |
| 10 | `npm test` e `npm run build` verdes sem alterar `.spec.ts` | T5 |
| 11 | `implementation-notes.md` encerra o item reprovado da auditoria da #54 | T3 |

## Lacunas

- Nenhuma — todos os 11 criterios de aceite estao cobertos por ao menos uma tarefa, e nenhuma tarefa existe sem criterio.
- **Nao e lacuna, e aviso**: os criterios 4 a 8 ficam sem tarefa de teste automatizado por limitacao do ambiente (jsdom nao aplica a folha global), nao por falta de plano — estao antecipados na secao "Validacao manual (etapa 8)". A convencao "toda regra de negocio e imposta no back-end" nao e afetada: nenhum criterio desta spec descreve regra de negocio, e o criterio 9 proibe explicitamente qualquer mudanca de comportamento.
- **Exemplos numericos conferidos**: `oklch(64% 0.008 80)` foi reconvertido por fora nesta etapa (OKLab -> sRGB linear -> luminancia WCAG) e da `rgb(143, 140, 135)` = `#8f8c87` com Y = 0.2620, produzindo 3.365:1 vs `--surface` (`#ffffff`), 3.22:1 vs `--surface-login-input` (`oklch(98.5% 0.003 90)`) e 3.11:1 vs `--card-row-bg` (= `--bg-app`, `oklch(97.3% 0.006 80)`). Os tres numeros da spec e o `rgb()` do criterio 4 sao alcancaveis pelo algoritmo do plano com os tokens reais do repositorio.
