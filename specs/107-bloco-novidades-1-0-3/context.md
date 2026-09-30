# Briefing — issue 107

## Regras que restringem esta mudanca

- Um bloco por `X.Y.Z`; so blocos de versoes **anteriores** sao historico intocavel — o `versao_1_0_2()` nao muda linha nenhuma. (`knowledge/documentation.md`, "Novidades por versao")
- **Nenhum item se repete entre blocos** (`shouldNotRepeatAnyItemAcrossVersions`); categoria sem item nao entra na lista (`addIfPresent`, `shouldNotPublishEmptyCategory`). Bloco sem categoria nenhuma e permitido — nao ha regra contra. (`knowledge/documentation.md`)
- `currentVersion` vem de `quarkus.application.version` sem sufixo; o front so compara por igualdade de string com o `version` de cada bloco para o rotulo "atual", sem fallback. Nao mexer no contrato nem no calculo. (`knowledge/documentation.md`)
- Texto de `documentation/content/` e `releasenotes/content/` passa antes pela revisao de `.claude/skills/pipeline/revisar-textos/SKILL.md` (ler o arquivo; nao e invocavel pelo nome). O hook recusa o commit sem `FINANCEOS_TEXTOS_REVISADOS=1`. Linguagem de usuario, sem termo tecnico; os testes de conteudo barram Tailscale, HTTPS, Docker, deploy, hospedagem, Flyway, migration, endpoint, API, banco de dados, token, Caddy, Swagger, framework e JWT. (`knowledge/documentation.md`, "Regras de redacao")
- Paragrafo da Central tem limite de 600 caracteres, coberto por teste (`MAX_PARAGRAPH_LENGTH` em `DocumentationContentTest`). O paragrafo atual de `novidades()` ja tem ~510 — frase nova vai em bloco novo. (`knowledge/documentation.md`)
- O que nao pertence a uma area vira secao da introducao (Novidades ja e a secao `novidades()` do `OverviewContent`). (`knowledge/documentation.md`)
- Estados de carga: `.loading-state` + `aria-busy` na carga; `.empty-state` so **depois** de resposta bem-sucedida; falha mostra `.load-error` no lugar dele. A mensagem de bloco vazio segue a mesma logica (nunca na carga nem na falha). (`knowledge/frontend-ui.md`, "Estados de carga")
- `.scss` de componente so consome `var(--token)`; varredura que deve sair vazia: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` (`knowledge/frontend-ui.md`)
- Todo texto exibido acentuado. Varreduras (devem sair **vazias**; hoje saem vazias; o regex do backend pega `nao`, `lancamento`, `periodo` minusculos inclusive em **comentario** Java; o do front cobre `*.spec.ts`, inclusive titulos de teste): (`knowledge/architecture.md`, "Idioma")
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Testes de componente do front dirigem tudo pelo DOM, com `HttpTestingController` e `httpMock.verify()` no `afterEach`; o app e zoneless (`createComponent` ja dispara o `ngOnInit`). (`knowledge/testing.md`)
- Verificacao de API autenticada na stack local depende da senha que so o usuario tem: sem credencial, cai para validacao manual. (`knowledge/architecture.md`, "Auth")

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` | `build()` devolve so `versao_1_0_2()`; comentario diz que ha bloco unico | ganha `versao_1_0_3()` sem grupos, antes do 1.0.2; comentario reescrito |
| `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` | 8 testes leem o 1.0.2 por `VERSIONS.get(0)` | acham o bloco por `version == "1.0.2"` |
| `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesResourceTest.java` | 2 testes leem `versions[0]` como 1.0.2 (`hasSize(1)`) | acham por versao; + teste de bloco sem grupos |
| `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` | `novidades()` descreve so a tela sem bloco | + frase do bloco sem mudancas |
| `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` | exige "Nenhuma novidade publicada ainda" | exige tambem a mensagem de bloco vazio |
| `frontend/src/app/features/release-notes/release-notes.html` / `.scss` | bloco sem categorias mostra so o cabecalho | mensagem dentro do bloco |
| `frontend/src/app/features/release-notes/release-notes.spec.ts` | 8 testes | + casos da mensagem e do `.empty-state` |
| `scripts/new-version.ps1` | "Proximos passos:" com 2 linhas | + linha lembrando o bloco de Novidades |

## Convencoes aplicaveis

- Sem comentario salvo "porque" nao-obvio; comentario novo em `.java` nao pode casar a varredura do backend (acentue ou evite `nao`/`lancamento`/`periodo`).
- A mensagem exibida no front e a citada em `OverviewContent` tem **o mesmo texto**, definido uma vez pela revisao de textos.
- Nao reordenar versoes no front: o backend ja entrega da mais recente para a mais antiga.
- `scripts/new-version.ps1` so imprime: nao gera nem edita codigo, nao muda a lista de arquivos do commit.
- Nenhuma mudanca na branch `v1.0.2` (`origin/v1.0.2` em `c292e3d`); PR com base `main`.

## Consultas fora do briefing

Nenhuma ate agora.
