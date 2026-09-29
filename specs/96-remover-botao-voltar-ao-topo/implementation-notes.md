# Notas de implementacao

Branch: `feature/issue-96-remover-botao-voltar-ao-topo` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 6 de 6 concluidas (ver `plan.md`)

## Arquivos alterados

- `frontend/src/app/core/back-to-top/` (4 arquivos) — apagados
- `frontend/src/app/layout/main-layout/main-layout.html` — removida a tag do botao
- `frontend/src/app/layout/main-layout/main-layout.ts` — removidos import e item em `imports`
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — teste reescrito: sem botao de rolagem e sem listener `scroll`
- `frontend/src/styles.scss` — comentario de camadas sem "voltar ao topo 40"
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — removido item do 1.0.2
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — removido ultimo paragrafo de "Como navegar"
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — teste invertido (`shouldNotAnnounceTheBackToTopButtonIn102`)
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java` — teste invertido com `not(hasItem(...))`, import `not`
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste invertido com `noneMatch`

## Decisoes

- O teste do layout evita os literais `back-to-top`/`Voltar ao topo` (CA8 varre `frontend/src`); procura por botoes com "topo" em `title`/`aria-label`.
- `#workspace` mantido (usado pelo `ViewChild`); `app.config.ts` intocado.

## Verificacao

- `npm test` 408 verdes; `npm run build` ok; testes backend escopados (3 classes) verdes.
- Varredura CA8 vazia; duas varreduras de acentuacao vazias (baseline e final).
- Suite completa do backend fica para `/pipeline:quality-check`.

## Desvios em relacao ao plano

Nenhum desvio.
