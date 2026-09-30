# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; imagens criadas 15:49-15:50, depois da ultima edicao de codigo, 15:44).
Branch: `feature/issue-107-bloco-novidades-1-0-3` (HEAD = `origin/main` = `f3ae7a7`) — mudancas ainda **nao commitadas**.
Chamadas autenticadas feitas com JWT assinado localmente com a chave do repo (`sub` = `dev@financeos.local`), **so GET**. A tela foi aberta num Chrome headless com esse token e dados reais (respostas **nao** substituidas); a sessao falharia qualquer requisicao nao-GET e nenhuma foi tentada. Nenhuma escrita ocorreu. Detalhes: `evidence/tela-e-api-novidades.md`.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `./mvnw test` inteiro verde, `shouldMatchCurrentVersionWithTheNewestBlock` sem alteracao | VERIFICADO | `quality-report.md`: 172 testes, 0 falhas/0 erros; surefire (15:45-15:46, apos a ultima edicao) soma 18 suites / 172 / 0 / 0; `ReleaseNotesResourceTest#shouldMatchCurrentVersionWithTheNewestBlock` passou e nao aparece no diff |
| 2 | `GET /api/release-notes`: 1.0.3 vazio + 1.0.2 | VERIFICADO | Chamada real: 200, `currentVersion "1.0.3"`, 2 blocos, `versions[0] = {"categories":[],"version":"1.0.3"}`, `versions[1].version "1.0.2"` |
| 3 | `versao_1_0_3()` sem grupo, antes do 1.0.2; nenhum item novo | VERIFICADO | `ReleaseNotesContent.java:21-29` (diff): `List.of(versao_1_0_3(), versao_1_0_2())`, metodo sem `addIfPresent`; API: 1.0.3 com `[]` e 1.0.2 com os 23 itens de antes |
| 4 | Bloco 1.0.2 identico | VERIFICADO | `git diff origin/main -- .../ReleaseNotesContent.java`: um hunk (linhas 13-31), nenhuma linha de `versao_1_0_2()`; os 23 itens do 1.0.2 na API existem literalmente no arquivo da `origin/main` (0 ausentes); 4/15/4 por grupo |
| 5 | Testes por indice passam a achar o 1.0.2 por versao | VERIFICADO | `ReleaseNotesContentTest`: 8 `VERSIONS.get(0)` -> `version("1.0.2")`, 14 testes antes e depois, todos verdes; `ReleaseNotesResourceTest#shouldReturnReleaseNotesForAllowedUser` e `#shouldNotListTheBackToTopButtonAmongThe102Improvements` usam `versions.find { it.version == '1.0.2' }` (so `hasSize(1)` saiu, previsto na spec) |
| 6 | Teste de bloco sem grupos serializado como `[]` | VERIFICADO | `ReleaseNotesResourceTest#shouldSerializeAVersionWithoutCategoriesAsAnEmptyList` (bloco ficticio `9.9.9`, independente do 1.0.3) e `#shouldAlwaysReturnTheCategoriesListOfEveryVersion` passaram; `ReleaseNotesContentTest#shouldNotRepeatAnyItemAcrossVersions` e `#shouldNotPublishEmptyCategory` passaram |
| 7 | Mensagem no bloco sem categorias + spec (a)(b)(c) | VERIFICADO | `release-notes.html:13-15`; 4 casos novos em `release-notes.spec.ts` (bloco vazio abaixo do cabecalho; ausente em bloco com categorias; ausente na carga e apos erro 500, com o servico pre-preenchido); `npm test` 435/435. Tela real: mensagem no bloco 1.0.3, abaixo do `h3`, nas 6 larguras |
| 8 | `.empty-state` da lista vazia mantido; `npm test` verde | VERIFICADO | Caso "com a lista sem versões mostra Nenhuma novidade publicada ainda, e não a mensagem de bloco vazio" em `release-notes.spec.ts`; testes antigos intactos; `npm test` 40 arquivos / 435 testes verdes |
| 9 | Tela em `http://localhost` | VERIFICADO | Chrome headless na tela servida, dados reais, 1440/1280/1024/768/390/320: "Versão v1.0.3" + "atual" + mensagem; depois "Versão v1.0.2" sem "atual", com Novidades 4 / Melhorias 15 / Correções 4; sem estouro horizontal |
| 10 | Central descreve o bloco vazio; teste exige o texto | VERIFICADO | `OverviewContent.java:182-185` (paragrafo novo, mesmo literal da tela); `DocumentationContentTest#shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes` passou exigindo o texto novo e "Nenhuma novidade publicada ainda"; `GET /api/documentation` real contem os dois. Revisao `revisar-textos` registrada (antes -> depois) em `implementation-notes.md` |
| 11 | `new-version.ps1` avisa sobre o bloco | VERIFICADO | Diff do script = 1 linha em "Proximos passos:" (`scripts/new-version.ps1:111`); `Get-FinanceOsVersionFiles`/`Invoke-GitCommit` intocados; `ParseFile` com 0 erros; a linha, avaliada com `1.0.4`/`main`, imprime `...criando versao_1_0_4() em ReleaseNotesContent antes do bloco anterior em build()` |
| 12 | Comentario de `build()` + varreduras vazias | VERIFICADO | `ReleaseNotesContent.java:16-20` nao fala mais em bloco unico; varreduras de acentuacao do backend e do frontend (e a de cor literal em `.scss`) sem nenhuma ocorrencia (grep PCRE em UTF-8, com controle positivo) |
| 13 | `v1.0.2` intocada, PR contra `main` | VERIFICADO | `git ls-remote origin refs/heads/v1.0.2` = `c292e3d17340...`; branch saiu de `origin/main`; `target: main` na spec, que o `pipeline-pr-publisher` usa como `--base` (a base do PR em si so existe na etapa 8) |

## Roteiro de validacao manual

Nenhum criterio depende do usuario. Conferencia opcional (juizo de redacao, nao bloqueia):

1. Abra `http://localhost` (Ctrl+F5 para descartar cache), entre com a sua conta e va em Sobre > Novidades por versão. Esperado: primeiro "Versão v1.0.3" com "atual" e, logo abaixo, "Ainda não há mudanças publicadas nesta versão." em cinza (DevTools > Computed > `color` = `rgb(107, 103, 96)`); depois "Versão v1.0.2" sem "atual", com Novidades, Melhorias e Correções como antes. Se o bloco 1.0.3 aparecer so com o titulo, sem a mensagem, e bundle antigo em cache. Avalie se a redacao escolhida pela revisao de textos ("mudanças" em vez da base "novidades", para nao confundir com o grupo Novidades) esta boa.

## Dados de teste criados

Nenhum.

## Nao-regressao das correcoes

Nao se aplica (primeira verificacao).

## Achado fora dos criterios

Nenhum: o working tree contem exatamente os 9 arquivos listados em `implementation-notes.md` mais `specs/107-bloco-novidades-1-0-3/`.

## Conclusao

13 de 13 criterios verificados automaticamente; 0 dependem do usuario; 0 nao atendidos. A feature esta pronta para o aval do usuario e a etapa `open-pr` (o commit precisa de `FINANCEOS_TEXTOS_REVISADOS=1`, por tocar `releasenotes/content/` e `documentation/content/`).

Validado pelo usuario em 2026-09-30.
