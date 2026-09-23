# Plano de implementacao

## Abordagem

Mudanca so de texto de comentario: acentuar 14 linhas exatas em 3 arquivos, uma edicao pontual por linha com a ferramenta Edit, copiando o texto alvo do CA3/CA4 da spec. Nenhum codigo, identificador, teste, migration ou texto de tela muda. Depois, conferir as duas varreduras (vazias), o `git diff` (14 linhas, sem troca de fim de linha/codificacao) e rodar build + suites completas.

## Arquivos a alterar

### Frontend
- `frontend/src/styles.scss` — linhas 23, 24, 27, 30, 33 do comentario de breakpoints (CRLF).

### Backend
- `backend/src/main/java/br/com/financeos/bootstrap/ProductionBootstrap.java` — linhas 177, 178, 179 (CRLF).
- `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` — linhas 41, 42, 85, 86, 124, 125 (LF).

### Migration
- Nenhuma.

## Tarefas

- [x] **T1** — Acentuar as 5 linhas do comentario de breakpoints em `styles.scss` com o texto exato de CA3.1, CA3.2, CA4.1, CA4.2 e CA4.3 (linhas 26, 28, 31, 34, 35 nao mudam).
  - Arquivos: `frontend/src/styles.scss`
  - Criterios: 1, 3, 4
- [x] **T2** — Acentuar as 3 linhas do comentario acima de `hasRelatedRows` em `ProductionBootstrap.java` com o texto exato de CA4.4, CA3.3 e CA3.4.
  - Arquivos: `backend/src/main/java/br/com/financeos/bootstrap/ProductionBootstrap.java`
  - Criterios: 2, 3, 4
- [x] **T3** — Acentuar as 6 linhas dos tres comentarios de `DashboardResource.java` com o texto exato de CA3.5, CA4.5, CA3.6, CA4.6, CA3.7 e CA3.8 (linha 43 nao muda).
  - Arquivos: `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java`
  - Criterios: 2, 3, 4
- [x] **T4** — Conferir: as duas varreduras literais do `context.md` retornam zero linhas; `git diff --stat` lista so os 3 arquivos com 14 insercoes/14 remocoes (5 + 3 + 6); `git diff` mostra apenas as 14 linhas, com acentos legiveis e sem `Ã£`/`Ã©`/`�`; `file <arquivo>` informa UTF-8 nos tres.
  - Arquivos: — (so leitura)
  - Criterios: 1, 2, 3, 4, 5, 6
- [x] **T5** — Rodar `cd backend && ./mvnw test` (suite completa) e `cd frontend && npm run build` + `npm test`.
  - Arquivos: — (so execucao)
  - Criterios: 7

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Varredura do frontend vazia | T1, T4 |
| 2 | Varredura do backend vazia | T2, T3, T4 |
| 3 | 8 linhas da varredura com o texto exato | T1, T2, T3, T4 |
| 4 | 6 linhas adjacentes com o texto exato | T1, T2, T3, T4 |
| 5 | Diff restrito a 3 arquivos / 14 linhas, sem troca de EOL | T4 (garantido pela forma de editar em T1-T3) |
| 6 | UTF-8 valido, sem mojibake | T4 |
| 7 | Backend compila e testa; frontend builda e testa | T5 |

Conferencia reversa: T1-T3 cobrem 1-4; T4 e T5 sao verificacao, cada uma amarrada a criterios. Nenhuma tarefa sem criterio.

## Superficie de validacao

- Criterio 1 — `rg` do frontend (literal no `context.md`) com saida vazia.
- Criterio 2 — `rg` do backend (literal no `context.md`) com saida vazia.
- Criterio 3, 4 — `git diff` linha a linha contra o texto do CA3/CA4; numeros de linha iguais aos da spec (`git diff -U0` mostra os hunks `@@ -23 +23 @@` etc.).
- Criterio 5 — `git diff --stat` (3 arquivos, `14 insertions(+), 14 deletions(-)`) e `git diff -U0` sem hunk fora das 14 linhas.
- Criterio 6 — `file frontend/src/styles.scss backend/src/main/java/br/com/financeos/bootstrap/ProductionBootstrap.java backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` -> "UTF-8"; `git diff` sem sequencias de mojibake.
- Criterio 7 — `./mvnw test` verde; `npm run build` gera o bundle; `npm test` verde.

## Validacao manual (etapa 7)

Nenhum. Todos os criterios sao verificaveis por comando (varreduras, `git diff`, `file`, build/testes). Nao ha mudanca visivel em `http://localhost`.

## Riscos e pontos de atencao

- **Principal: diff inflado por fim de linha ou codificacao** (CA5/CA6). `styles.scss` e `ProductionBootstrap.java` estao em CRLF no working tree; reescrever o arquivo inteiro (`Write`, `Set-Content`, editor que normalize EOL) faria o `git diff` acusar o arquivo todo ou gravar em ANSI/UTF-16. Mitigacao: so Edit pontual; conferir `git diff --stat` logo apos cada arquivo. Com `* text=auto`, uma troca CRLF->LF pode nao aparecer no `git diff` mas aparece em `git status`/aviso de EOL — conferir tambem que nao surge warning `LF will be replaced by CRLF` inesperado.
- Digitar acento errado ou "corrigir" palavra fora do texto alvo (ex.: acentuar `tipografia`/`colapsam` nas linhas 26/28, que ja estao certas) quebra o CA5. Copiar literalmente do CA3/CA4.
- Os comentarios descrevem regras vivas (`knowledge/dashboard.md`, ordem mes -> ano; `knowledge/auth-and-permissions.md`, "Travas de ambiente de producao"); o texto alvo da spec preserva o sentido, entao nao ha risco de regra se seguido a risca.
- Central de Documentacao / Novidades por versao: mudanca invisivel ao usuario final e sem regra alterada — nenhum ajuste em `documentation/content/*Content.java` nem em `ReleaseNotesContent.java`.
- `knowledge/architecture.md` ("Idioma") fica desatualizado ate o `sync-knowledge` (baseline 2 + 6 -> "sai vazia"); deliberado pela spec.

## Lacunas

Nenhuma.
