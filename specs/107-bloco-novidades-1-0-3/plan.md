# Plano de implementacao

## Abordagem

Abrir o bloco 1.0.3 vazio em `ReleaseNotesContent` (sem tocar no `versao_1_0_2()`), o que ja faz `shouldMatchCurrentVersionWithTheNewestBlock` passar, e desacoplar os testes que tratavam o indice 0 como 1.0.2, fazendo-os achar o bloco pela versao. Provar por teste que um bloco sem grupos sai como `"categories": []` usando um bloco ficticio, independente do 1.0.3. No front, mostrar uma mensagem dentro do bloco sem categorias; na Central, descrever esse caso com o mesmo texto; no `new-version.ps1`, so uma linha a mais em "Proximos passos".

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — `versao_1_0_3()` sem grupos (mesmo esqueleto `ArrayList` + `List.copyOf` do 1.0.2, sem chamada a `addIfPresent`), `build()` = `List.of(versao_1_0_3(), versao_1_0_2())`, comentario do topo reescrito.
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — `novidades()` ganha um `DocumentationBlock.paragraph` novo com o caso do bloco sem mudancas.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — helper `version("1.0.2")` (busca por `version`, `orElseThrow`) no lugar dos 8 `VERSIONS.get(0)`.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java` — 2 testes passam a ler `versions.find { it.version == '1.0.2' }`; teste novo de serializacao de bloco sem grupos.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — `shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes` exige a mensagem nova.

### Frontend
- `frontend/src/app/features/release-notes/release-notes.html` — `<p class="release-empty">` dentro do `article`, logo abaixo do `header`, com `*ngIf="!loading() && !loadError() && !version.categories.length"`.
- `frontend/src/app/features/release-notes/release-notes.scss` — estilo de `.release-empty` so com `var(--token)` (ex.: `--text-soft`, `--fs-body`).
- `frontend/src/app/features/release-notes/release-notes.spec.ts` — casos (a), (b), (c) e o de lista vazia.

### Scripts
- `scripts/new-version.ps1` — uma linha em "Proximos passos:".

### Migration
Nenhuma.

## Tarefas

- [x] **T1** — Criar `versao_1_0_3()` sem grupos, coloca-lo antes de `versao_1_0_2()` em `build()` e reescrever o comentario do topo (o bloco da versao em desenvolvimento e o primeiro; correcao de build entra no bloco existente; bloco novo so quando `X.Y.Z` muda). Nao alterar nenhuma linha do `versao_1_0_2()`. Comentario acentuado ou sem as palavras do regex do backend. Nao publicar item nenhum.
  - Arquivos: `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java`
  - Criterios: 2, 3, 4, 12
- [x] **T2** — Trocar os 8 `VERSIONS.get(0)` de `ReleaseNotesContentTest` por um helper que acha o bloco por `version == "1.0.2"`, mantendo todas as assercoes de conteudo (inclusive os `assertEquals("1.0.2", ...)`); nenhum teste removido.
  - Arquivos: `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java`
  - Criterios: 1, 5
- [x] **T3** — Em `ReleaseNotesResourceTest`, `shouldReturnReleaseNotesForAllowedUser` e `shouldNotListTheBackToTopButtonAmongThe102Improvements` passam a achar o 1.0.2 por `versions.find { it.version == '1.0.2' }` (conferindo que existe e mantendo a assercao de "Voltar ao topo"). O `hasSize(1)` sai: substituir por `versions.version` com `hasItem("1.0.2")` — nao fixar a contagem, que quebraria de novo na 1.0.4. `shouldMatchCurrentVersionWithTheNewestBlock` fica sem alteracao.
  - Arquivos: `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java`
  - Criterios: 1, 5
- [x] **T4** — Teste de bloco sem grupos, independente do 1.0.3: em `ReleaseNotesResourceTest` (`@QuarkusTest`), injetar o `ObjectMapper` do Quarkus e serializar um `ReleaseNotesResponse` com um `ReleaseNoteVersion` ficticio (ex.: `"9.9.9"`, `List.of()`), assertando que `versions[0].categories` e array presente e vazio (`isArray()` e `size() == 0`, nao `null`/ausente). Complementar com uma chamada a `GET /release-notes` assertando que todo bloco traz `categories` nao nulo (`everyItem(notNullValue())`). Nao alterar `shouldNotRepeatAnyItemAcrossVersions` nem `shouldNotPublishEmptyCategory`.
  - Arquivos: `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java`
  - Criterios: 6
- [x] **T5** — Mostrar a mensagem de bloco vazio no front: `<p class="release-empty">` abaixo do `header` do `article`, com `*ngIf="!loading() && !loadError() && !version.categories.length"`, e o estilo em `.scss` so com tokens. Definir o texto final aplicando `.claude/skills/pipeline/revisar-textos/SKILL.md` sobre a base "Ainda não há novidades nesta versão." e registrar o texto aprovado em `implementation-notes.md` (T6 e T7 reusam o mesmo). Nao usar a classe `.empty-state` (os testes existentes a usam para a lista sem bloco).
  - Arquivos: `frontend/src/app/features/release-notes/release-notes.html`, `frontend/src/app/features/release-notes/release-notes.scss`
  - Criterios: 7, 9
- [x] **T6** — Cobrir no `release-notes.spec.ts`: (a) fixture com um bloco sem categorias e outro com -> `.release-empty` so no bloco vazio, dentro do `.release-block` e depois do `.panel-heading`, com o texto exato; (b) bloco com categorias nao tem `.release-empty`; (c) sem `.release-empty` antes da resposta e apos erro 500 — e tambem com o `ReleaseNotesService.content` pre-preenchido com um bloco vazio antes do `createComponent` (simula visita anterior), para a guarda de `loading`/`loadError` ser realmente exercitada; (d) `versions: []` -> `.empty-state` "Nenhuma novidade publicada ainda." e nenhum `.release-empty`. Titulos de teste acentuados (a varredura do front cobre `*.spec.ts`). Testes existentes intactos.
  - Arquivos: `frontend/src/app/features/release-notes/release-notes.spec.ts`
  - Criterios: 7, 8
- [x] **T7** — Em `OverviewContent.novidades()`, acrescentar um `DocumentationBlock.paragraph` novo (o atual ja esta perto dos 600 caracteres) dizendo que a versao sem mudancas publicadas mostra, no proprio bloco, a mensagem aprovada em T5. Revisar se a frase existente "Enquanto nenhuma versão tiver novidades publicadas, a tela mostra Nenhuma novidade publicada ainda." ficou imprecisa (ela vale so para tela sem bloco nenhum) e, se reescrita, manter o trecho "Nenhuma novidade publicada ainda". Texto passa por `.claude/skills/pipeline/revisar-textos/SKILL.md`. Em `DocumentationContentTest.shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes`, acrescentar a mensagem nova a lista exigida.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java`, `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`
  - Criterios: 10
- [x] **T8** — Em `scripts/new-version.ps1`, acrescentar ao bloco "Proximos passos:" uma linha como `Write-Host "  - abrir o bloco de Novidades da $proximaVersao: criar versao_$($proximaVersao -replace '\.', '_')() em ReleaseNotesContent, antes do anterior em build()"`. Nenhuma outra mudanca (nada em `Invoke-GitCommit`/`Get-FinanceOsVersionFiles`). Conferir sintaxe com `[System.Management.Automation.Language.Parser]::ParseFile('scripts/new-version.ps1', [ref]$null, [ref]$erros)` e `$erros.Count -eq 0`.
  - Arquivos: `scripts/new-version.ps1`
  - Criterios: 11
- [ ] **T9** — Fechamento: `cd backend && ./mvnw test` inteiro (0 falhas/0 erros), `cd frontend && npm test`, as duas varreduras de acentuacao e a de cor literal vazias, `git diff origin/main -- .../ReleaseNotesContent.java` sem linha alterada dentro de `versao_1_0_2()`, e `git rev-parse origin/v1.0.2` = `c292e3d`.
  - Arquivos: — (so verificacao)
  - Criterios: 1, 4, 8, 12, 13

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | `./mvnw test` inteiro verde | T2, T3, T9 |
| 2 | `GET /api/release-notes`: 1.0.3 vazio + 1.0.2 | T1 (validacao manual) |
| 3 | `versao_1_0_3()` sem grupo, antes do 1.0.2 | T1 |
| 4 | Bloco 1.0.2 identico | T1, T9 |
| 5 | Testes por indice passam a achar por versao | T2, T3 |
| 6 | Teste de bloco sem grupos serializado como `[]` | T4 |
| 7 | Mensagem no bloco sem categorias + spec (a)(b)(c) | T5, T6 |
| 8 | `.empty-state` da lista vazia mantido; `npm test` verde | T6, T9 |
| 9 | Tela em `http://localhost` | T1, T5 (validacao manual) |
| 10 | Central descreve o bloco vazio; teste exige o texto | T7 |
| 11 | `new-version.ps1` avisa sobre o bloco | T8 |
| 12 | Comentario de `build()` + varreduras vazias | T1, T9 |
| 13 | `v1.0.2` intocada, PR contra `main` | T9 (e etapa 8) |

## Superficie de validacao

- Criterio 1 — `./mvnw test` inteiro na etapa 4; `ReleaseNotesResourceTest#shouldMatchCurrentVersionWithTheNewestBlock` passa sem diff.
- Criterio 2 — `GET /api/release-notes` autenticado: 200, `currentVersion == "1.0.3"`, `versions` com 2, `versions[0].categories == []`, `versions[1].version == "1.0.2"` (manual se nao houver credencial).
- Criterio 3/4 — leitura do diff de `ReleaseNotesContent.java`; `ReleaseNotesContentTest` com os 8 testes do 1.0.2 verdes.
- Criterio 5 — `ReleaseNotesContentTest` e `ReleaseNotesResourceTest` sem `get(0)`/`versions[0]` para o 1.0.2, mesma quantidade de testes.
- Criterio 6 — teste novo de T4 em `ReleaseNotesResourceTest`.
- Criterio 7/8 — casos novos de `release-notes.spec.ts` + `npm test`.
- Criterio 10 — `DocumentationContentTest#shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes`.
- Criterio 11 — `ParseFile` sem erros; diff do script limitado a uma linha em "Proximos passos".
- Criterio 12/13 — varreduras e `git rev-parse origin/v1.0.2`.

## Validacao manual (etapa 7)

- Criterio 2 — chamada autenticada a `GET http://localhost:8080/api/release-notes` (ou aba Rede do navegador ao abrir Sobre > Novidades por versão): conferir os campos do criterio, com `categories: []` presente.
- Criterio 9 — `http://localhost`, Sobre > Novidades por versão: primeiro "Versão v1.0.3" com "atual" e a mensagem de bloco vazio abaixo do cabecalho; depois "Versão v1.0.2" sem "atual" e com os mesmos itens de antes. Conferir tambem a 680px que a mensagem nao estoura o bloco.
- Criterio 10 — Sobre > Documentação > Como utilizar o sistema > Novidades por versão cita a mesma mensagem da tela.

## Riscos e pontos de atencao

- **Novidades por versao: sem item no bloco 1.0.3.** Decisao da spec (CA3, "Decisoes"): nao ha mudanca exclusiva da 1.0.3 (as correcoes da #104 ja estao no 1.0.2 e repeti-las viola "nenhum item se repete entre blocos"); a propria abertura do bloco e a mensagem de bloco vazio sao o que o usuario percebe. Central atualizada em T7. (`knowledge/documentation.md`)
- `hasSize(1)` de `shouldReturnReleaseNotesForAllowedUser` nao sobrevive (agora sao 2 blocos): T3 troca por presenca do 1.0.2, sem fixar contagem. E a unica assercao que muda de forma; as de conteudo ficam.
- Mesma mensagem em dois lugares (template e `OverviewContent`) sem nada no build ligando os dois: T6 e T7 assertam o mesmo literal aprovado em T5.
- Frase existente de `novidades()` sobre "nenhuma versão tiver novidades publicadas" pode ficar ambigua com um bloco vazio na tela (T7 decide, mantendo o trecho exigido pelo teste).
- Comentario novo de `build()` em portugues sem acento casa a varredura do backend (`\bnao\b`) e quebra o CA12.
- Commit tocando `releasenotes/content/` e `documentation/content/` exige `FINANCEOS_TEXTOS_REVISADOS=1` (etapa 8).
- `shouldOrderVersionsFromNewestToOldest` compara por string: "1.0.3" > "1.0.2" funciona; versoes de dois digitos estao fora de escopo.

## Lacunas

Nenhuma.
