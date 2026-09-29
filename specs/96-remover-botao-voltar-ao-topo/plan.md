# Plano de implementacao

## Abordagem

Remocao pura, sem codigo novo: apagar o componente `BackToTop` e seu uso no `MainLayout`, e tirar do conteudo publicado (Novidades 1.0.2 e "Como navegar" da Central) os dois textos que anunciam o botao, conforme decisao do usuario. Os tres testes de backend que exigiam esses textos passam a afirmar a ausencia; o teste do layout passa a afirmar que nenhum botao nem listener de scroll existe. `#workspace` e `scrollPositionRestoration` ficam intactos.

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — remove o item "Botao Voltar ao topo..." das Melhorias 1.0.2.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — remove o ultimo paragrafo de `navegacao()` (incluindo as duas linhas de string) e fecha o bloco anterior com `));`.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — inverte `shouldAnnounceTheBackToTopButtonAsImprovementIn102` (ex.: `shouldNotAnnounceTheBackToTopButtonIn102`).
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java` — inverte `shouldListTheBackToTopButtonAmongThe102Improvements` com `not(hasItem(containsString(...)))`.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — inverte `shouldExplainTheBackToTopButtonInHowToNavigate` para `noneMatch`.

### Frontend
- `frontend/src/app/core/back-to-top/` — apagar a pasta inteira (4 arquivos).
- `frontend/src/app/layout/main-layout/main-layout.html` — remove `<app-back-to-top ... />` (l.341); mantem `#workspace` (usado no `ViewChild`).
- `frontend/src/app/layout/main-layout/main-layout.ts` — remove import e `BackToTop` de `imports`.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — reescreve o teste da l.534.
- `frontend/src/styles.scss` — tira "voltar ao topo 40" do comentario de camadas.

## Tarefas

- [x] **T1** — Medir baseline: rodar as duas varreduras de acentuacao de `knowledge/architecture.md` e anotar o resultado (esperado: vazias).
  - Arquivos: nenhum (so leitura)
  - Criterios: 9
- [x] **T2** — Remover o botao do frontend: apagar `core/back-to-top/`, a linha em `main-layout.html`, o import/`imports` em `main-layout.ts` e a mencao em `styles.scss`.
  - Arquivos: `frontend/src/app/core/back-to-top/`, `main-layout.html`, `main-layout.ts`, `frontend/src/styles.scss`
  - Criterios: 1, 2, 3, 4, 5, 8, 10
- [x] **T3** — Reescrever o teste de `main-layout.spec.ts` (l.534): espia `window.addEventListener`, monta, navega `/transactions` -> `/documentation`, simula `scrollY` > 300 + evento `scroll`, e afirma zero `app-back-to-top`, zero `.back-to-top` e zero chamadas com `'scroll'`.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 1, 3, 4
- [x] **T4** — Remover o item do bloco 1.0.2 de `ReleaseNotesContent` e inverter os dois testes de release notes (Content e Resource), limpando imports orfaos.
  - Arquivos: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`, `ReleaseNotesResourceTest.java`
  - Criterios: 6, 8
- [x] **T5** — Remover o paragrafo de `OverviewContent.navegacao()` e inverter `DocumentationContentTest#shouldExplainTheBackToTopButtonInHowToNavigate`.
  - Arquivos: `OverviewContent.java`, `DocumentationContentTest.java`
  - Criterios: 7, 8
- [x] **T6** — Rodar as varreduras CA2/CA8 (literais no briefing), as de acentuacao (comparar com T1), `git diff --stat` (sem `features/`, `app.config.ts`, migrations, Resources), `npm test`, `npm run build` e `./mvnw test`.
  - Arquivos: nenhum
  - Criterios: 2, 5, 8, 9, 10

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Nenhum botao no DOM apos rolar | T2, T3 |
| 2 | Pasta removida e varredura vazia | T2, T6 |
| 3 | Layout sem import/tag; teste reescrito | T2, T3 |
| 4 | Nenhum listener `scroll` | T2, T3 |
| 5 | Rolagem preservada | T2, T6 |
| 6 | Novidades 1.0.2 sem o item | T4 |
| 7 | Central sem o paragrafo | T5 |
| 8 | Varredura de producao vazia | T2, T4, T5, T6 |
| 9 | Suite, build, acentuacao | T1, T6 |
| 10 | Sem alteracao fora do escopo, mobile intacto | T2, T6 |

## Superficie de validacao

- CA1 — `MainLayout` spec (T3), teste reescrito; e na tela: rolar Lancamentos alem de 300 px em `http://localhost` e ver que nao surge botao.
- CA2, CA8 — `rg` literais do briefing retornam vazio.
- CA3 — inspecao de `main-layout.ts`/`.html` + teste de T3.
- CA4 — mesmo teste de T3 (`addSpy` filtrado por `'scroll'` com 0 chamadas).
- CA5 — `app.config.spec.ts` continua verde; `git diff` sem `app.config.ts`; na tela, roda do mouse rola o documento.
- CA6 — `ReleaseNotesContentTest#shouldNotAnnounceTheBackToTopButtonIn102` e `ReleaseNotesResourceTest` (versao invertida); `GET /api/release-notes` sem "Voltar ao topo" em `versions[0]`.
- CA7 — `DocumentationContentTest` (versao invertida); `GET /api/documentation` sem o texto na introducao.
- CA9 — `npm test`, `./mvnw test`, `npm run build`, duas varreduras de acentuacao vazias.
- CA10 — `git diff --stat`; tela em ≤ 680 px.

## Validacao manual (etapa 7)

- CA1/CA5: em `http://localhost`, telas Resumo, Lancamentos, Categorias, Usuarios, Perfis, Documentacao e Novidades — rolar alem de 300 px e observar ausencia do botao; roda do mouse rola normalmente.
- CA10: emulacao ≤ 680 px — barra inferior e espaco inferior da `.workspace` como antes, nada sobreposto.
- CA6/CA7: na tela Novidades (1.0.2, Melhorias) e Documentacao (Como utilizar o sistema > Como navegar), o texto sobre "Voltar ao topo" nao aparece.

## Riscos e pontos de atencao

- `OverviewContent`: o paragrafo removido e o ultimo argumento de `DocumentationSection.of(...)`; errar o fechamento de parenteses quebra a compilacao. Outros testes da Central (limite de 600 caracteres, contagem de areas) nao dependem dele.
- `ReleaseNotesContentTest` tem outros testes sobre as Melhorias (l.107-129) e o de itens nao repetidos (l.65); conferir que nenhum assume quantidade fixa de itens.
- `ReleaseNotesResourceTest`: imports `hasItem`/`containsString` podem ficar em uso ou orfaos conforme a inversao; limpar so os orfaos.
- `frontend-ui.md` e `testing.md` continuam citando o botao ate a etapa `sync-knowledge` (`knowledge/documentation.md` e as demais regras nao mudam).

## Lacunas

Nenhuma.
