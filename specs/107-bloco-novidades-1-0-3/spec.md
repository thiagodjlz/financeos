---
issue: 107
url: https://github.com/thiagodjlz/financeos/issues/107
title: "Novidades por versão sem o bloco 1.0.3 na main (teste de versão falhando)"
domains: [documentation]
target: main
stage: validated
branch: feature/issue-107-bloco-novidades-1-0-3
created: 2026-09-30
---

# Novidades por versão sem o bloco 1.0.3 na main (teste de versão falhando)

## Historia

Como usuario da versao 1.0.3, quero que Novidades por versao tenha como bloco mais recente ("atual") o da versao em uso, e que um bloco ainda sem mudancas diga isso, para que o historico nao pareca parado. Como mantenedor, quero a suite do backend verde na `main` e o script de versao lembrando de abrir o bloco, para que o problema nao volte na 1.0.4.

## Contexto

- O commit `3cd6b9b` (`scripts/new-version.ps1`) subiu a versao para `1.0.3-dev`, mas `ReleaseNotesContent.build()` segue devolvendo so `versao_1_0_2()`, com comentario dizendo que existe um unico bloco.
- **Remedido** (2026-09-30, `main` em `f3ae7a7`): `./mvnw test -Dtest='ReleaseNotes*Test'` roda 22 testes com 1 falha, `ReleaseNotesResourceTest.shouldMatchCurrentVersionWithTheNewestBlock` (`Expected: 1.0.3 / Actual: 1.0.2`).
- **Alcance maior que o da issue**: com o 1.0.3 em `versions[0]`, quebram os testes que tratam o indice 0 como 1.0.2 — `ReleaseNotesResourceTest.shouldReturnReleaseNotesForAllowedUser` (`hasSize(1)`, `versions[0].version == "1.0.2"`), `shouldNotListTheBackToTopButtonAmongThe102Improvements` e os oito de `ReleaseNotesContentTest` com `VERSIONS.get(0)`.
- Regras de `knowledge/documentation.md`: um bloco por `X.Y.Z`, blocos anteriores sao historico intocavel; **nenhum item se repete entre blocos** (`shouldNotRepeatAnyItemAcrossVersions`) — as correcoes da #104 (via #105/#106) ja estao no 1.0.2 e o #103 e infraestrutura, entao nao ha item exclusivo da 1.0.3; categoria sem item nao entra (`addIfPresent`, `shouldNotPublishEmptyCategory`); `currentVersion` vem de `quarkus.application.version` sem sufixo e o front compara por igualdade; texto de `releasenotes/content/` e `documentation/content/` passa por `.claude/skills/pipeline/revisar-textos/SKILL.md` e o commit exige `FINANCEOS_TEXTOS_REVISADOS=1`.
- Hoje `release-notes.html` renderiza um bloco sem categorias so com o cabecalho "Versão v1.0.3" + "atual". O `.empty-state` "Nenhuma novidade publicada ainda." so vale para lista sem bloco, unico caso descrito em `OverviewContent.novidades()`. `DocumentationContentTest.shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes` confere que a Central cita os textos das telas.
- `scripts/new-version.ps1` termina em "Proximos passos:" sem mencionar Novidades.
- Varreduras de acentuacao (`knowledge/architecture.md`, "Idioma"; regex do backend e do frontend diferentes) medidas na `main`: **0 linhas** nas duas.

## Criterios de aceite

- [x] CA1. `cd backend && ./mvnw test` passa inteiro na branch da feature (0 falhas, 0 erros), incluindo `shouldMatchCurrentVersionWithTheNewestBlock` sem alteracao nesse teste.
- [x] CA2. `GET /api/release-notes` (stack local, usuario com permissao de ver Novidades) responde 200 com `currentVersion == "1.0.3"`, `versions` de tamanho 2, `versions[0].version == "1.0.3"` com `versions[0].categories == []` (lista vazia presente, nao `null` nem ausente) e `versions[1].version == "1.0.2"`.
- [x] CA3. O metodo `versao_1_0_3()` existe em `ReleaseNotesContent`, sem grupo nenhum, e vem antes de `versao_1_0_2()` em `build()`; nenhum item novo e publicado.
- [x] CA4. Bloco 1.0.2 identico: `git diff origin/main -- backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` nao altera linha do metodo `versao_1_0_2()`, e os itens por categoria do 1.0.2 em `GET /api/release-notes` sao os mesmos de antes.
- [x] CA5. Os testes que leem o 1.0.2 por indice (`shouldReturnReleaseNotesForAllowedUser`, `shouldNotListTheBackToTopButtonAmongThe102Improvements` e os de `ReleaseNotesContentTest` com `VERSIONS.get(0)`) passam a achar o bloco por `version == "1.0.2"`, mantendo todas as asserções de conteudo; nenhum e removido.
- [x] CA6. Existe teste de backend provando que a API aceita e devolve um bloco sem grupos: a resposta serializa um `ReleaseNoteVersion` com `categories` vazia como `"categories": []`. O teste nao pode depender de o 1.0.3 continuar vazio (deve seguir valido quando o bloco ganhar itens). `shouldNotRepeatAnyItemAcrossVersions` e `shouldNotPublishEmptyCategory` continuam passando.
- [x] CA7. Front: um bloco de versao com `categories` vazia mostra, dentro do proprio bloco e abaixo do cabecalho, uma mensagem em portugues (redacao-base "Ainda não há novidades nesta versão.", final definida pela revisao de textos). `release-notes.spec.ts` cobre: (a) a mensagem aparece no bloco sem categorias; (b) nao aparece em bloco com categorias; (c) nao aparece durante o carregamento nem com erro de carga.
- [x] CA8. Nao-regressao do front: com `versions` vazia, a tela continua mostrando "Nenhuma novidade publicada ainda." e nao a mensagem de bloco vazio; os testes existentes de `release-notes.spec.ts` continuam passando (`npm test` do frontend verde).
- [x] CA9. Em `http://localhost`, a tela mostra primeiro "Versão v1.0.3" com o rotulo "atual" e a mensagem de bloco vazio, e depois "Versão v1.0.2" sem "atual" e com os mesmos itens de antes.
- [x] CA10. `OverviewContent.novidades()` ganha frase que descreve o bloco de versao sem mudancas, citando a mensagem com o mesmo texto exibido pelo front; `DocumentationContentTest.shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes` passa a exigir esse texto na Central (e continua exigindo "Nenhuma novidade publicada ainda").
- [x] CA11. `scripts/new-version.ps1`: o bloco "Proximos passos:" ganha uma linha que avisa que falta criar o bloco de Novidades da versao nova (`versao_X_Y_Z()` montado a partir de `$proximaVersao`) em `ReleaseNotesContent`, colocado antes do anterior em `build()`. O script nao gera nem edita codigo: o commit "Abre o desenvolvimento da versao X" continua tocando so `Get-FinanceOsVersionFiles`, e o diff do script se limita a essa saida. O arquivo continua sem erro de sintaxe (`[System.Management.Automation.Language.Parser]::ParseFile` sem erros).
- [x] CA12. O comentario do topo de `build()` deixa de afirmar que existe um unico bloco 1.0.2, e as duas varreduras de acentuacao (backend e frontend) continuam saindo vazias.
- [x] CA13. Nenhuma mudanca na branch `v1.0.2`: `git rev-parse origin/v1.0.2` continua em `c292e3d` ao fim da esteira, e o PR tem base `main`.

## Fora de escopo

- Qualquer alteracao no bloco 1.0.2 ou na branch `v1.0.2`.
- Publicar itens no bloco 1.0.3 (nao ha mudanca exclusiva da 1.0.3 hoje).
- Gerar o bloco da versao nova automaticamente pelo `new-version.ps1`.
- Ordenacao de versoes com dois digitos (`1.0.10`; o teste compara por string).
- Mudar o contrato da API (`ReleaseNotesResponse`/`ReleaseNoteVersion`) ou o calculo de `currentVersion`.

## Decisoes

- 2026-09-30 — **Conteudo inicial do bloco 1.0.3: bloco vazio + mensagem na tela.** `versao_1_0_3()` nasce sem grupos; o front mostra mensagem em portugues quando um bloco nao tem itens (redacao final pela revisao de textos); a Central descreve esse caso em `OverviewContent.novidades()`; a API aceitar/devolver bloco sem grupos fica coberto por teste; os testes que leem o 1.0.2 pela posicao 0 passam a acha-lo pela versao, com as mesmas verificacoes. Descartadas: repetir as correcoes da #104 no 1.0.3 (viola "nenhum item se repete entre blocos") e bloco vazio sem mensagem.
- 2026-09-30 — **`scripts/new-version.ps1` so avisa em "Proximos passos"** que falta criar o bloco de Novidades da versao nova em `ReleaseNotesContent` (antes do anterior em `build()`); nao gera codigo. Descartadas: so documentar fora do script, e gerar o bloco sozinho (editaria Java por texto e exigiria `FINANCEOS_TEXTOS_REVISADOS=1` no script).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/107
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/documentation.md`
- Codigo conferido: `releasenotes/` (main e test), `OverviewContent.java`, `DocumentationContentTest.java`, `features/release-notes/`, `scripts/new-version.ps1`
