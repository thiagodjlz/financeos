# Notas de implementacao

Branch: `feature/issue-78-acentuar-comentarios-varreduras` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 4 de 5 concluidas (ver `plan.md`); T5 parcial — ver "Desvios"

## Arquivos alterados

- `frontend/src/styles.scss` — acentuadas as linhas 23, 24, 27, 30 e 33 do comentario de breakpoints (CA3.1-2, CA4.1-3).
- `backend/src/main/java/br/com/financeos/bootstrap/ProductionBootstrap.java` — acentuadas as linhas 177, 178 e 179 do comentario acima de `hasRelatedRows` (CA4.4, CA3.3-4).
- `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` — acentuadas as linhas 41, 42, 85, 86, 124 e 125 (CA3.5-8, CA4.5-6); linha 43 intacta.

## Decisoes

- Edicao so com a ferramenta Edit, trecho por trecho, com o texto alvo copiado do CA3/CA4. Fim de linha medido antes e depois por contagem de bytes CR/LF: `styles.scss` 747 CR / 747 LF, `ProductionBootstrap.java` 211/211 (CRLF puro), `DashboardResource.java` 0/133 (LF puro) — iguais antes e depois. `file` informa "UTF-8" nos tres.
- Conferencia do texto: script comparou cada uma das 14 linhas com o texto da spec (posicao e conteudo) — todas batem.
- Varreduras literais do `context.md`: as duas retornam zero linhas (rg exit 1). `git diff --stat`: 3 arquivos, 14 insertions / 14 deletions (5 + 3 + 6); `git diff -U0` so tem hunks nas 14 linhas. Busca por mojibake (`Ã£`, `Ã©`, `Ã§`, `Ã¡`, `Ãª`, `Ã³`, `Ãº`, `Ã­`, `�`) no diff: nada (o unico `Ã` do diff e o `NÃO` legitimo da linha 33 do `styles.scss`).
- O `git diff` emite `warning: ... DashboardResource.java, LF will be replaced by CRLF the next time Git touches it`. E consequencia do `core.autocrlf=true` local sobre um arquivo que ja estava em LF no working tree antes da mudanca (0 CR medido antes da edicao); o plano manda preservar o LF, entao o aviso e esperado e nao altera o conteudo commitado (indice em LF).

## Desvios em relacao ao plano

- **T5 fica desmarcada (parcial).** Frontend completo: `npm run build` gerou o bundle (compila o `styles.scss`) e `npm test` passou (31 arquivos, 325 testes). Backend: rodei so o escopo tocado, `./mvnw -Dtest=DashboardResourceTest,DashboardPeriodsSecurityTest test` (compila o modulo inteiro, incluindo `ProductionBootstrap.java`; 15 testes verdes). A suite completa `./mvnw test` pedida pela T5/CA7 nao foi rodada aqui porque, pela regra da etapa de implementacao, ela e o portao do `/pipeline:quality-check`. `ProductionBootstrap` nao tem teste proprio (nenhum teste o referencia).
- A contagem "285 testes" citada nas instrucoes da etapa esta desatualizada: a suite do frontend tem hoje 325.
