---
issue: 97
url: https://github.com/thiagodjlz/financeos/issues/97
title: "Melhorar documentação e notas de versão para linguagem orientada ao usuário"
domains: [documentation]
target: main
stage: validated
branch: feature/issue-97-linguagem-usuario-documentacao-notas
created: 2026-09-28
---

# Melhorar documentação e notas de versão para linguagem orientada ao usuário

## Historia

Como usuario final do FinanceOS, quero ler nas telas "Documentação" e "Novidades por versão" textos que expliquem o que cada funcionalidade faz e o que mudou para mim, para que eu entenda o sistema sem conhecer como ele foi construido ou publicado.

## Contexto

As duas telas do menu "Sobre" servem conteudo tipado escrito a mao no back-end: `documentation/content/*Content.java` (5 areas mais a introducao) e `releasenotes/content/ReleaseNotesContent.java` (bloco unico `1.0.2`). Nao ha tela de manutencao: o conteudo muda por codigo (`knowledge/documentation.md`).

Itens do bloco 1.0.2 que a issue aponta como tecnicos (confirmados em `ReleaseNotesContent.java`):

- Novidades: "Publicar o FinanceOS na internet com endereço próprio (HTTPS automático) ou pela rede privada do Tailscale, sem custo de hospedagem."
- Melhorias: "Mais segurança nas contas ao publicar na internet: administrador com nome fixo, contas de teste removidas do ambiente publicado."

Regras vigentes que **nao mudam**: rotulos da UI, sem enum/classe; nada de regra inventada (toda afirmacao com origem em `knowledge/` ou no codigo, com tabela de rastreamento em `implementation-notes.md`); paragrafo ate 600 caracteres; um bloco por `X.Y.Z`; nenhum item repetido; texto acentuado (`knowledge/architecture.md`, "Idioma"). Reescrever nao pode alterar o significado publicado.

Hoje so a regra escrita e o `ReleaseNotesContentTest` (que barra apenas `JWT`, `Panache`, `INCOME`...) protegem esses textos. Padrao da issue por item: o que mudou, para que serve, como o usuario percebe, regra importante e beneficio, no formato "**Titulo curto:** explicacao funcional".

## Criterios de aceite

Skill:

- [x] Existe `.claude/skills/pipeline/revisar-textos/SKILL.md` (invocada como `pipeline:revisar-textos`, front-matter `name`/`description`); a `description` cita as duas telas e o gatilho (criar, alterar ou revisar seu conteudo).
- [x] O `SKILL.md` separa **conteudo funcional** (fica) de **tecnico** (sai ou vira resultado percebido), cobrindo as categorias da issue: tecnologias/frameworks/servicos, infraestrutura, hospedagem/publicacao/deploy, estrutura de codigo, banco de dados, variaveis/endpoints/APIs/configuracoes e correcao tecnica sem efeito perceptivel (esta **nao gera item**).
- [x] O `SKILL.md` traz as 5 perguntas da issue, o formato "Titulo curto: explicacao", os dois pares tecnico -> usuario da issue e a regra "o que isso significa para mim?".
- [x] O `SKILL.md` exige preservar o significado (afirmacao com origem em `knowledge/` ou codigo, sem regra ou funcionalidade nova) e aponta `knowledge/documentation.md` para as regras de redacao vigentes.

Acionamento:

- [x] `rg -n "revisar-textos"` acha a instrucao de invocar a skill **antes** de gravar texto em `documentation/content/` ou `releasenotes/content/` (texto novo ou modificado) em `knowledge/documentation.md`, `CLAUDE.md`, `pipeline-planner`, `pipeline-implementer` e `pipeline-verifier`; agents seguem em ~9 KB cada e `knowledge/documentation.md` em 25 KB (`wc -c`).
- [x] Hook em `.githooks/` (script chamado pelo `pre-commit` ou bloco nele) **bloqueia o commit** (saida != 0, mensagem em portugues mandando rodar `pipeline:revisar-textos`) quando o indice altera `releasenotes/content/` ou `documentation/content/` sem `FINANCEOS_TEXTOS_REVISADOS=1`. Evidencia em repositorio temporario: (a) staged em `ReleaseNotesContent.java` sem a variavel -> recusado; (b) com a variavel -> passa; (c) so outro arquivo -> passa; (d) durante merge/cherry-pick/rebase -> passa.
- [x] O hook nao muda o `pre-commit` existente: o incremento de build segue igual e a checagem de textos roda **independente** de `FINANCEOS_SKIP_BUILD_BUMP` e do tipo de branch. Hook e variavel estao citados em `knowledge/documentation.md` (ou `architecture.md`, sem passar de 10 KB), e `rg -n "FINANCEOS_TEXTOS_REVISADOS" .claude knowledge` acha a skill e o `pipeline-implementer` dizendo que o commit da esteira o usa apos a revisao.

Textos:

- [ ] Os dois itens citados na issue nao mencionam mais hospedagem, HTTPS, Tailscale, "ambiente publicado" nem "contas de teste" e descrevem o resultado para o usuario no formato "Titulo: explicacao" (`ReleaseNotesContent.java`, `GET /api/release-notes`).
- [ ] Todos os itens de `ReleaseNotesContent.java` e todo paragrafo, item e celula de `documentation/content/` foram revisados pela skill e reescritos quando preciso; itens tecnicos sem impacto perceptivel foram removidos. `implementation-notes.md` registra uma linha por texto alterado (antes -> depois, motivo), por item removido (motivo) e por arquivo sem alteracao.
- [x] Nenhum texto das duas telas contem termos da lista de bloqueio provisoria: `Tailscale`, `HTTPS`, `Docker`, `deploy`, `hospedagem`, `Flyway`, `migration`, `endpoint`, `API`, `banco de dados`, `token`, `Caddy`, `Swagger`, `framework`, `JWT`. Imposto por `ReleaseNotesContentTest` e `DocumentationContentTest` (padrao proibido ampliado) em `./mvnw test`. Antes de fechar a lista, medir na `main` quais termos ja ocorrem na documentacao (ex.: "API", "token"); termo que for uso legitimo sai da lista, com medicao e justificativa em "Decisoes". A lista final e a do teste.
- [ ] O significado de cada texto alterado foi preservado: nenhuma afirmacao nova sem origem (rastreamento em `implementation-notes.md`) e nenhum item removido descreve comportamento perceptivel.

Nao-regressao:

- [ ] Passam, sem mudar assercao (salvo o padrao proibido ampliado): contagem e titulos das 5 areas, 600 caracteres por paragrafo, `data-label` em toda `<td>`, bloco unico `1.0.2`, categorias vazias omitidas, sem item repetido; `GET /api/documentation` e `GET /api/release-notes` mantem 200/401/403; DTOs inalterados.
- [x] As duas varreduras de acentuacao (`knowledge/architecture.md`, "Idioma") saem **sem ocorrencia nova** vs `main` (ambas vazias hoje).
- [x] Nenhum arquivo de frontend, migration ou enum alterado (`git diff --stat` so lista `backend/src/main/.../content/`, testes, `.githooks/`, `.claude/`, `knowledge/`, `CLAUDE.md`, `specs/`).

## Fora de escopo

- Tela ou endpoint para editar o conteudo; mudar estrutura, categorias, layout ou permissoes das telas.
- Areas, funcionalidades ou versoes novas; reescrever o `knowledge/` tecnico interno.
- Validacao em CI/servidor: o hook e local e contornavel (variavel, `--no-verify`); o teste de lista de bloqueio e a rede de seguranca.

## Decisoes

- Alvo `main` (2026-09-28): melhoria de conteudo e processo.
- "Evitar termo tecnico" virou criterio verificavel por lista de bloqueio em teste; a issue nao sugere valor numerico a remedir.
- Acionamento (usuario, 2026-09-28): instrucao em agents/`CLAUDE.md`/`knowledge`, teste de back-end com lista de bloqueio e hook de git. A spec escolheu **bloquear** em vez de so avisar, com confirmacao por `FINANCEOS_TEXTOS_REVISADOS=1`, porque aviso ignoravel nao cumpre o "sempre" da issue (detalhe de desenho, ajustavel no plano).
- Skill (usuario, 2026-09-28): `pipeline:revisar-textos`, em `.claude/skills/pipeline/revisar-textos/`.
- Escopo (usuario, 2026-09-28): reescrever todos os textos das duas telas e remover, sem consultar, itens tecnicos sem impacto perceptivel.
- Lista de bloqueio (usuario, 2026-09-28): provisoria; calibrar medindo a `main` na implementacao.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/97
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/documentation.md`; codigo: `ReleaseNotesContent.java`, `ReleaseNotesContentTest.java`, `documentation/content/`, `.githooks/pre-commit`.
