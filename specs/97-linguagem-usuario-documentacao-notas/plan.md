# Plano de implementacao

## Abordagem

Tres frentes independentes: (1) a skill `pipeline:revisar-textos` como fonte unica do criterio funcional x tecnico; (2) acionamento em tres camadas: instrucao nos agents/`CLAUDE.md`/`knowledge`, hook de git que bloqueia o commit sem `FINANCEOS_TEXTOS_REVISADOS=1` e lista de bloqueio nos testes de conteudo; (3) reescrita dos textos aplicando a skill. Os testes ampliados ficam **depois** da reescrita para nao nascerem vermelhos. A lista de bloqueio e a da spec inteira (medicao na `main` em `context.md`: so o item de hospedagem casa).

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — reescrever itens em "Titulo: explicacao"; trocar os dois itens tecnicos por resultado percebido (ou remover se sem efeito perceptivel)
- `backend/src/main/java/br/com/financeos/documentation/content/*Content.java` (6 arquivos) — revisar todo texto; reescrever so o necessario
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — padrao proibido ampliado; ajustar so assercoes ligadas a textos reescritos que citam frase literal (ex.: contraste, "própria conta"/"próprio perfil", "Excluir", "tela própria", "não consegue carregar")
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — padrao proibido ampliado (mesma lista)

### Processo (fora de backend/frontend)
- `.claude/skills/pipeline/revisar-textos/SKILL.md` — novo
- `.githooks/pre-commit` e `.githooks/check-texts.sh` (novo, chamado antes do bump)
- `knowledge/documentation.md`, `CLAUDE.md`, `.claude/agents/pipeline-planner.md`, `pipeline-implementer.md`, `pipeline-verifier.md`, `pipeline-pr-publisher.md`

### Migration
- Nenhuma.

## Tarefas

- [x] **T1** — Criar `SKILL.md` de `pipeline:revisar-textos`: front-matter `name`/`description` (cita as duas telas e o gatilho criar/alterar/revisar), separacao funcional x tecnico com as 7 categorias (correcao tecnica sem efeito nao gera item), 5 perguntas da issue, formato "**Titulo curto:** explicacao", os dois pares tecnico -> usuario, regra "o que isso significa para mim?", preservar significado com origem em `knowledge/`/codigo, apontar `knowledge/documentation.md`, e citar `FINANCEOS_TEXTOS_REVISADOS=1` para o commit da esteira
  - Arquivos: `.claude/skills/pipeline/revisar-textos/SKILL.md`
  - Criterios: 1, 2, 3, 4, 7 (variavel citada na skill)
- [x] **T2** — Criar `.githooks/check-texts.sh` e chama-lo no topo do `pre-commit`, **antes** do `exit 0` do `FINANCEOS_SKIP_BUILD_BUMP`: bloqueia (exit 1, mensagem em portugues mandando rodar `pipeline:revisar-textos`) se `git diff --cached --name-only` tocar `releasenotes/content/` ou `documentation/content/` sem `FINANCEOS_TEXTOS_REVISADOS=1`; passa em merge/cherry-pick/rebase (mesmos marcadores do hook atual). Resto do `pre-commit` intacto
  - Arquivos: `.githooks/check-texts.sh`, `.githooks/pre-commit`
  - Criterios: 6, 7
- [x] **T3** — Validar o hook em repositorio temporario (`git init` no scratchpad, copiando `.githooks`): (a) staged sem variavel -> recusado; (b) com variavel -> passa; (c) so outro arquivo -> passa; (d) com `MERGE_HEAD`/`CHERRY_PICK_HEAD` -> passa; e com `FINANCEOS_SKIP_BUILD_BUMP=1` sem variavel de textos -> ainda recusa. Gravar em `specs/97-.../evidence/hook.md`
  - Arquivos: `specs/97-linguagem-usuario-documentacao-notas/evidence/hook.md`
  - Criterios: 6, 7
- [x] **T4** — Acrescentar a instrucao de invocar `pipeline:revisar-textos` antes de gravar texto em `documentation/content/`/`releasenotes/content/`, e documentar hook + `FINANCEOS_TEXTOS_REVISADOS` em `knowledge/documentation.md` e `CLAUDE.md` (fundir com linhas existentes; conferir tetos com `wc -c`: 25 KB)
  - Arquivos: `knowledge/documentation.md`, `CLAUDE.md`
  - Criterios: 5, 7
- [x] **T5** — Acrescentar a instrucao nos agents `pipeline-planner`, `pipeline-implementer` (dizendo tambem que o commit da esteira, feito em `open-pr`, usa `FINANCEOS_TEXTOS_REVISADOS=1` apos a revisao), `pipeline-verifier` e `pipeline-pr-publisher` (exporta a variavel no `git commit` quando a revisao foi registrada nas notas). Frases curtas; conferir `wc -c` (~9 KB cada)
  - Arquivos: `.claude/agents/pipeline-planner.md`, `.claude/agents/pipeline-implementer.md`, `.claude/agents/pipeline-verifier.md`, `.claude/agents/pipeline-pr-publisher.md`
  - Criterios: 5, 7
- [x] **T6** — Aplicar a skill a `ReleaseNotesContent.java`: reescrever todos os itens em "Titulo: explicacao"; os dois itens da issue sem hospedagem, HTTPS, Tailscale, "ambiente publicado" nem "contas de teste"; remover item tecnico sem efeito perceptivel; preservar significado
  - Arquivos: `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java`
  - Criterios: 8, 9, 11
- [x] **T7** — Aplicar a skill as areas da Central: `OverviewContent`, `SummaryAreaContent`, `TransactionsAreaContent`
  - Arquivos: `.../documentation/content/OverviewContent.java`, `SummaryAreaContent.java`, `TransactionsAreaContent.java`
  - Criterios: 9, 11
- [x] **T8** — Aplicar a skill as areas restantes: `CategoriesAreaContent`, `UsersAreaContent`, `ProfilesAreaContent`
  - Arquivos: `.../documentation/content/CategoriesAreaContent.java`, `UsersAreaContent.java`, `ProfilesAreaContent.java`
  - Criterios: 9, 11
- [x] **T9** — Escrever `implementation-notes.md` com a tabela de rastreamento: uma linha por texto alterado (antes -> depois, motivo), por item removido (motivo) e por arquivo sem alteracao; medicao da lista de bloqueio
  - Arquivos: `specs/97-linguagem-usuario-documentacao-notas/implementation-notes.md`
  - Criterios: 9, 11
- [x] **T10** — Ampliar o padrao proibido nos dois testes com a lista de bloqueio (`Tailscale|HTTPS|Docker|deploy|hospedagem|Flyway|migration|endpoint|API|banco de dados|token|Caddy|Swagger|framework|JWT`, com limites de palavra em `API`/`token`); ajustar assercoes literais afetadas pela reescrita; rodar `./mvnw -Dtest=ReleaseNotesContentTest,DocumentationContentTest,DocumentationResourceTest,ReleaseNotesResourceTest test`. Revisar `PROFILE_RULE_TECHNICAL_TERM` (ja proibe `API`/`banco` so na regra de perfil; nao afrouxar)
  - Arquivos: `backend/src/test/java/.../ReleaseNotesContentTest.java`, `backend/src/test/java/.../DocumentationContentTest.java`
  - Criterios: 10, 11, 12
- [x] **T11** — Rodar as duas varreduras de acentuacao (comandos em `context.md`) e conferir `git diff --stat` so em `content/`, testes, `.githooks/`, `.claude/`, `knowledge/`, `CLAUDE.md`, `specs/`
  - Arquivos: — (verificacao)
  - Criterios: 13, 14

## Cobertura dos criterios de aceite

Numeracao pela ordem da spec (14 criterios): 1-4 skill; 5 `rg revisar-textos` nos 5 locais; 6 hook bloqueia (a-d); 7 pre-commit intacto/independente + hook e variavel documentados; 8 dois itens reescritos; 9 tudo revisado + notas; 10 lista de bloqueio em teste; 11 significado preservado; 12 nao-regressao; 13 acentuacao; 14 sem frontend/migration/enum.

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Skill existe com front-matter | T1 |
| 2 | Funcional x tecnico | T1 |
| 3 | 5 perguntas, formato, pares | T1 |
| 4 | Preservar significado | T1 |
| 5 | Instrucao nos 5 locais | T4, T5 |
| 6 | Hook bloqueia (a-d) | T2, T3 |
| 7 | Pre-commit intacto, independente, documentado | T1, T2, T3, T4, T5 |
| 8 | Dois itens reescritos | T6 |
| 9 | Tudo revisado + notas | T6, T7, T8, T9 |
| 10 | Lista de bloqueio em teste | T10 |
| 11 | Significado preservado | T6, T7, T8, T9, T10 |
| 12 | Nao-regressao testes/API | T10 |
| 13 | Varreduras sem ocorrencia nova | T11 |
| 14 | Sem frontend/migration/enum | T11 |

## Superficie de validacao

- 1 a 4 — abrir `SKILL.md` e conferir cada elemento; `rg -n "revisar-textos" .claude`.
- 5 — `rg -n "revisar-textos" knowledge/documentation.md CLAUDE.md .claude/agents`; `wc -c` nos agents (~9 KB) e em `knowledge/documentation.md` (25 KB).
- 6 — `specs/97-.../evidence/hook.md` com as quatro situacoes (a-d). 7 — mesmo arquivo (SKIP sem variavel ainda recusa), `git diff .githooks/pre-commit` so acrescenta a chamada, e `rg -n "FINANCEOS_TEXTOS_REVISADOS" .claude knowledge` acha a skill e o implementer.
- 8 — `GET /api/release-notes` (200) sem os termos; `ReleaseNotesContentTest`.
- 9, 11 — tabela em `implementation-notes.md`.
- 10 — `ReleaseNotesContentTest#shouldNotExposeTechnicalIdentifiers` e `DocumentationContentTest#shouldNotExposeTechnicalIdentifiers` ampliados.
- 12 — `./mvnw test` completo; `DocumentationResourceTest`, `ReleaseNotesResourceTest`, `*SecurityTest` sem alteracao de assercao.
- 13 — os dois `rg` de `context.md`, ambos vazios. 14 — `git diff --stat`.

## Validacao manual (etapa 7)

- 8, 9 — ler as telas "Documentação" e "Novidades por versão" em `http://localhost` (menu Sobre) e avaliar se o texto e compreensivel sem conhecimento tecnico e nao perdeu significado (julgamento que teste nao faz).

## Riscos e pontos de atencao

- Reescrever textos quebra assercoes literais dos testes de conteudo (frases como "própria conta", "Você não pode desativar a própria conta.", "remove definitivamente"); manter as frases-chave nas reescritas em vez de afrouxar teste.
- Item removido nao pode descrever comportamento perceptivel; item repetido entre blocos e proibido (`knowledge/documentation.md`).
- Hook bloqueante vale tambem para o commit da esteira (`open-pr`): sem `FINANCEOS_TEXTOS_REVISADOS=1` no `git commit` do publisher, todo PR que toque conteudo fica travado. Por isso T5 inclui o publisher.
- Tetos de tamanho: nao ha como medir bytes com as ferramentas do planejamento; a implementacao deve conferir com `wc -c` e fundir texto em vez de empilhar.
- Fim de linha do `.sh` no Windows: salvar com LF, senao o hook falha em `sh`.

## Lacunas

- Criterio 7 pede o `pipeline-implementer` dizendo que o commit da esteira usa a variavel, mas quem comita e o `pipeline-pr-publisher` (o implementer nunca roda `git commit`). O plano cobre o pedido literal (frase no implementer) e acrescenta o publisher (T5), escopo alem do literal, para o hook nao travar a esteira. Confirmar.
- Nenhum criterio sem tarefa; T11 e verificacao, ligada aos criterios 13 e 14. Nenhuma regra de negocio so no frontend.
