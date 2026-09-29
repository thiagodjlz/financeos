# Briefing — issue 96

## Regras que restringem esta mudanca

- Decisao do usuario (resolve o ponto em aberto 1 da spec): o item de Novidades 1.0.2 e o paragrafo "Como navegar" da Central **sao removidos**. Nao ha veto.
- Novidades: um bloco por `X.Y.Z`; corrigir/remover algo que estreou na versao corrente (1.0.2, nao cortada) nao gera item novo — so se apaga o item (`knowledge/documentation.md`, "Novidades por versao").
- Central e Novidades sao dado tipado escrito a mao; nenhum teste de build acusa texto desatualizado, entao os dois `*Content.java` e seus testes sao ajustados junto (`knowledge/documentation.md`, "Regras de redacao").
- Conteudo publicado nao descreve funcionalidade inexistente (`knowledge/documentation.md`).
- Acentuacao: as duas varreduras de `knowledge/architecture.md` (Idioma) devem sair vazias. Comandos literais:
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Varredura de producao do CA8 (literal): `rg -n -i "voltar ao\s*\"?\s*\+?\s*\"?\s*topo|back-to-top|backtotop" backend/src/main frontend/src` deve retornar vazio. Atencao: como o regex e sensivel a quebra de string, apos remover o paragrafo de `OverviewContent` nao pode sobrar a linha `"Voltar ao "`.
- Toda regra e validada no back-end: aqui nao ha regra de negocio nem endpoint; e remocao de apresentacao e de texto publicado.
- Rolagem que permanece: `withInMemoryScrolling({ scrollPositionRestoration: 'top' })` em `app.config.ts` (coberto por `app.config.spec.ts`, nao tocar) e `.workspace` sem `overflow` proprio.
- Build frontend: `npm run build` sem warning novo de budget; suite: `npm test` (frontend) e `./mvnw test` (backend).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `frontend/src/app/core/back-to-top/` (`.ts`, `.html`, `.scss`, `.spec.ts`) | Botao flutuante com listener `scroll` | Pasta apagada |
| `frontend/src/app/layout/main-layout/main-layout.html` (l.341) | Monta `<app-back-to-top [focusTarget]="workspace" />` | Remove a linha; conferir se a referencia `#workspace` continua usada por outro consumidor |
| `frontend/src/app/layout/main-layout/main-layout.ts` (l.17, 31) | Importa `BackToTop` | Remove import e da lista `imports` |
| `frontend/src/app/layout/main-layout/main-layout.spec.ts` (l.534-549) | Teste "monta um unico botao Voltar ao topo..." | Reescreve: nenhum `app-back-to-top`/`.back-to-top` e nenhum `addEventListener('scroll')` (CA1, CA4) |
| `frontend/src/styles.scss` (l.37) | Comentario de camadas cita "voltar ao topo 40" | Tira o item do comentario |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` (l.44) | Item de Melhorias do bloco 1.0.2 | Remove o item |
| `backend/.../documentation/content/OverviewContent.java` (l.68-70) | Ultimo paragrafo de "Como navegar" | Remove o paragrafo; o anterior passa a terminar a lista de blocos (`));`) |
| `backend/src/test/.../releasenotes/ReleaseNotesContentTest.java` (l.114) | `shouldAnnounceTheBackToTopButtonAsImprovementIn102` | Inverte para afirmar ausencia |
| `backend/src/test/.../releasenotes/ReleaseNotesResourceTest.java` (l.36) | `shouldListTheBackToTopButtonAmongThe102Improvements` | Inverte para afirmar ausencia; limpar imports orfaos |
| `backend/src/test/.../documentation/DocumentationContentTest.java` (l.143) | `shouldExplainTheBackToTopButtonInHowToNavigate` | Inverte para afirmar ausencia |

## Convencoes aplicaveis

- Sem comentario novo no codigo; testes em portugues no front (titulo do `it`), nomes `should...` no backend.
- Texto de teste/fixture no `*.spec.ts` que case com o regex de acentuacao do front precisa ser ajustado junto.
- Nao alterar `frontend/src/app/features/`, `app.config.ts`, migrations, Resources ou servicos (CA10). `knowledge/frontend-ui.md` e `testing.md` citam o botao, mas sao atualizados pela etapa `sync-knowledge`, nao aqui.
- `specs/75-botao-voltar-ao-topo/` permanece como registro historico.

## Consultas fora do briefing

Nenhuma ate agora.
