# Briefing — issue 97

## Regras que restringem esta mudanca

- Conteudo das duas telas e dado tipado escrito a mao no back-end, nunca Markdown; nao ha tela de manutencao (`knowledge/documentation.md`, "O conteudo e dado tipado").
- Nada de regra inventada: toda afirmacao publicada tem origem em `knowledge/*.md` ou no codigo; reescrever nao pode alterar o significado (`knowledge/documentation.md`, "Regras de redacao"). Rastreamento vai em `implementation-notes.md` da issue.
- Linguagem de usuario: rotulos da UI em portugues, nenhum valor de enum, nome de classe ou termo de implementacao (`knowledge/documentation.md`).
- Paragrafo ate 600 caracteres; toda `<td>` com `data-label`; secao/categoria vazia e omitida (`knowledge/documentation.md`).
- Um bloco por `X.Y.Z` (hoje so `1.0.2`); nenhum item repetido entre blocos; corrigir o que estreou na versao corrente nao gera item (`knowledge/documentation.md`, "Novidades por versao").
- Mudanca em texto visivel tem dois consumidores manuais: `documentation/content/*Content.java` e `ReleaseNotesContent.java` (`knowledge/documentation.md`).
- Texto exibido e acentuado. Varreduras literais, que devem sair **sem ocorrencia** (ambas vazias hoje) (`knowledge/architecture.md`, "Idioma"):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  Atencao: o regex do backend casa `lancamento`/`periodo` em minuscula sem acento; nao introduza slug/id assim em `.java`.
- Hook de versao: `.githooks/pre-commit` incrementa a build em branch de versao, sai cedo com `FINANCEOS_SKIP_BUILD_BUMP=1` e em merge/cherry-pick/rebase (`MERGE_HEAD`, `CHERRY_PICK_HEAD`, `rebase-merge`, `rebase-apply`). A checagem nova de textos roda **antes** desse `exit 0` do SKIP, independente dele e do tipo de branch, mas tambem passa em merge/cherry-pick/rebase (`knowledge/architecture.md`, "Versionamento e branches").
- Tetos: `knowledge/documentation.md` 25 KB, `architecture.md` 10 KB, cada agent ~9 KB (`CLAUDE.md`, esteira).
- Nao alterar frontend, migration, enum nem DTO (spec, nao-regressao).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` | Bloco unico 1.0.2, itens NEW/IMPROVEMENT/FIX | Reescrever no formato "Titulo: explicacao"; itens de hospedagem e "contas de teste" viram resultado percebido ou saem |
| `backend/src/main/java/br/com/financeos/documentation/content/{Overview,Summary,Transactions,Categories,Users,Profiles}*Content.java` | Introducao + 5 areas tipadas | Revisar cada paragrafo/item/celula; reescrever so o preciso |
| `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` | `TECHNICAL_IDENTIFIER` barra JWT, Flyway etc. | Ampliar padrao com a lista de bloqueio; nao mudar demais assercoes |
| `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` | `TECHNICAL_IDENTIFIER` e `PROFILE_RULE_TECHNICAL_TERM` | Ampliar padrao proibido com a lista de bloqueio |
| `.githooks/pre-commit` (+ novo script `.githooks/check-texts.sh`, opcional) | Bump de build | Chamar checagem de textos antes do bump |
| `.claude/skills/pipeline/revisar-textos/SKILL.md` | nao existe | Criar (criterios 1 a 4 da spec) |
| `knowledge/documentation.md`, `CLAUDE.md`, `.claude/agents/pipeline-{planner,implementer,verifier,pr-publisher}.md` | Regras de redacao / instrucoes das etapas | Instrucao de invocar `pipeline:revisar-textos` antes de gravar texto; hook e `FINANCEOS_TEXTOS_REVISADOS` |

## Convencoes aplicaveis

- Sem comentarios no codigo, salvo "porque" nao obvio. Textos, mensagens do hook e skill em portugues.
- Commits/PR em portugues; o commit da esteira e feito por `pipeline-pr-publisher` (nao pelo implementer), entao e la que `FINANCEOS_TEXTOS_REVISADOS=1` e usado.
- Nao editar `VERSION`/`pom.xml`/`version.ts` na mao.
- Medicao da lista de bloqueio na `main` (feita no planejamento, regex case-insensitive sobre `**/content/*.java`): unica ocorrencia e o item de hospedagem em `ReleaseNotesContent.java` (`HTTPS`, `Tailscale`, `hospedagem`); `API`, `token` etc. nao ocorrem na documentacao. Lista inteira pode ser mantida; registrar em "Decisoes" da spec.

## Consultas fora do briefing

Nenhuma ate agora.
