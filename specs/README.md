# Esteira de implementacao (issue -> spec -> plano -> implementacao -> qualidade -> build -> ambiente -> validacao -> PR)

Cada issue do GitHub processada pela esteira automatizada vira uma pasta aqui:

```
specs/<numero-da-issue>-<slug>/
  spec.md                    # etapa 1 - /pipeline:spec-from-issue
  context.md                 # etapa 2 - briefing: o que knowledge/ diz sobre ESTA issue
  plan.md                    # etapa 2 - /pipeline:plan-implementation (abordagem + tarefas + cobertura)
  implementation-notes.md    # etapa 3 - /pipeline:implement
  quality-report.md          # etapa 4 - /pipeline:quality-check
  build-report.md            # etapa 5 - /pipeline:build
  docker-report.md           # etapa 6 - /pipeline:docker-restart
  verification-report.md     # etapa 7 - /pipeline:verify   <- PARADA para validacao do usuario
  pr.md                      # etapa 8 - /pipeline:open-pr  (commit + push + PR)
  evidence/                  # anexos longos (saida de teste, tabelas de medicao), so lidos sob demanda
```

`<slug>` e um resumo curto em kebab-case do titulo da issue (ex.: `42-exportar-lancamentos-csv`). Todos os comandos recebem o **numero da issue** e resolvem a pasta via glob `specs/<numero>-*`.

Pastas anteriores a esta versao da esteira tem um `tasks.md` separado (a quebra em tarefas era uma etapa propria) e nao tem `context.md`; as mais antigas tambem tem um `estimate.md`, de uma etapa de estimativa que nao existe mais. Ficam como registro historico — os agentes sabem ler esse formato, mas nao o geram mais.

## Como usar

Rode a primeira etapa e a esteira segue sozinha ate a parada de validacao — cada etapa invoca a proxima, sem pedir confirmacao:

```
/pipeline:spec-from-issue <numero>
/pipeline:plan-implementation <numero>
/pipeline:implement <numero>
/pipeline:quality-check <numero>
/pipeline:build <numero>
/pipeline:docker-restart <numero>
/pipeline:verify <numero>          # para aqui e espera voce
/pipeline:open-pr <numero>
```

A esteira para para perguntar em tres situacoes:

1. **Sempre, na etapa 7** — a parada de validacao (ver abaixo).
2. Quando ha decisao de implementacao que ela nao consegue tomar sozinha ("Pontos em aberto" na spec, abordagens conflitantes, criterio que continua sem cobertura depois de replanejar).
3. Quando testes/build continuam falhando apos 2 rodadas automaticas de correcao.

Se `quality-check`, `build` ou `verify` encontrarem problema, a esteira roda automaticamente uma rodada de correcao (`/pipeline:implement` de novo, com o trecho relevante do relatorio de falha) e repete dali, ate 2 rodadas automaticas. Ajustes que **voce** pede na validacao manual nao contam nesse limite.

## Contexto: quem le `knowledge/` (e quem nao le)

O gasto de contexto da esteira nao vem do codigo — vem de reler as mesmas regras em toda etapa. Por isso:

- **So a etapa 2 le `knowledge/` e varre o codigo.** Ela destila o que restringe *esta* issue em `context.md` (teto de 6 KB): as regras aplicaveis **com a ancora do arquivo de onde vieram**, os arquivos em jogo e as 3 a 5 convencoes que a issue pode violar.
- **As etapas 3 e 7 leem `context.md`, nao `knowledge/`.**
- **A valvula de escape e obrigatoria**: se uma etapa precisar de regra que o briefing nao trouxe, ela abre o arquivo de `knowledge/` correspondente **e registra a falta** na secao "Consultas fora do briefing" do `context.md`. Esse registro e o unico sinal de que o briefing esta saindo incompleto, e a etapa `sync-knowledge` o usa para corrigir a causa. Economia de token nunca justifica implementar sem saber a regra.

`knowledge/` tambem foi quebrado por area (ver [knowledge/README.md](../knowledge/README.md)): `architecture.md` e o nucleo carregado sempre (teto de 10 KB) e o detalhe de backend, frontend, teste e deploy vive em arquivos proprios, carregados so quando a issue toca aquela area.

## Tetos de tamanho dos artefatos

Artefato sem teto vira custo fixo de todas as etapas seguintes. Estourou, o excesso vai para `evidence/` e e citado por caminho — nao some, so deixa de ser carregado por quem nao precisa dele.

| Artefato | Teto |
|---|---|
| `spec.md` | 8 KB |
| `context.md` | 6 KB |
| `plan.md` | 12 KB |
| `implementation-notes.md` | 6 KB |
| `quality-report.md` | 3 KB |
| `verification-report.md` | 8 KB |

## Rastreabilidade: da spec a tarefa (etapa 2)

A etapa 2 quebra o plano em tarefas (`T1`, `T2`, ...) na ordem de execucao, cada uma declarando os arquivos que toca e **quais criterios de aceite ela atende**, e monta a matriz de cobertura criterio -> tarefas, conferindo as duas direcoes:

- **criterio de aceite sem nenhuma tarefa**: o plano esta incompleto. A esteira replaneja uma vez informando exatamente o que ficou descoberto. Se a lacuna persistir, para e pergunta — pode ser que o criterio esteja mal escrito, e isso e decisao sua.
- **tarefa sem criterio nenhum** que nao seja infraestrutura declarada (migration, por exemplo): pode ser escopo a mais do que a issue pediu, e a esteira pergunta antes de seguir.

A conferencia vem antes da implementacao de proposito: criterio esquecido descoberto aqui custa um paragrafo; descoberto na etapa 7 custa uma rodada inteira. A etapa 3 marca as tarefas conforme conclui, e a etapa 7 usa a matriz para achar a evidencia de cada criterio.

## Testes: loop rapido na implementacao, suite completa no portao

- **Etapa 3 (implementacao)** roda so o que tocou — `./mvnw -Dtest=<ClasseTocada>,<ClasseVizinha> test` — para iterar rapido. O frontend roda inteiro mesmo assim (285 testes em ~9s; escopar nao compensa).
- **Etapa 4 (`quality-check`)** roda a **suite completa**, sempre, sem excecao. E o portao, e existe para pegar o que ninguem previu: na issue #45, tornar um campo obrigatorio em Lancamentos quebrou um teste de **Dashboard**. Escopo por dominio teria deixado passar.

Escopar e para iterar; nunca para aprovar.

## Feature na `main`, correcao numa versao (`target`)

O campo `target` do front-matter diz em cima de que branch a issue e implementada (ver README.md, secao "Versionamento e branches"):

| `target` | Quando | Branch de trabalho | Base do PR | Build |
|---|---|---|---|---|
| `main` | funcionalidade nova, melhoria, refatoracao | `feature/issue-<n>-<slug>` | `main` | nao muda (`main` fica em `X.Y.Z-dev`) |
| `vX.Y.Z` | bug de uma versao ja cortada | `fix/issue-<n>-<slug>` | `vX.Y.Z` | sobe sozinha no commit (`X.Y.Z-NN`) |

Quem decide e a etapa 1: para bug que afeta versao ja cortada, ela pergunta ao usuario se a correcao sai numa build daquela versao ou so na proxima versao. As demais etapas apenas seguem o `target`.

Na correcao de versao, a etapa 3 cria a branch a partir de `vX.Y.Z` e grava `branch.<nome>.financeosVersionBase = vX.Y.Z` — e isso que faz o hook `pre-commit` incrementar a build quando a etapa 8 commita. A etapa 8 abre o PR com `--base vX.Y.Z` e lembra de levar a correcao para a `main` depois do merge.

## Nada e commitado antes da sua validacao

O commit, o push e o PR acontecem todos na etapa 8, depois que voce aprova a feature. Das etapas 3 a 7 o codigo fica no working tree da branch de trabalho, sem entrar no historico do git.

Isso funciona porque os Dockerfiles do `backend` e do `frontend` sao multi-stage e buildam a partir do codigo-fonte copiado: a stack Docker roda o working tree, sem depender de commit. Consequencia pratica: **nenhum agente da esteira deve rodar `git stash`, `git reset --hard` ou `git checkout -- <arquivo>` entre as etapas 3 e 8** — nao existe commit para onde voltar.

## A parada de validacao (etapa 7)

A ordem das etapas 6 e 7 e proposital: primeiro o ambiente de teste local e atualizado com o codigo da feature, depois a esteira para para voce validar nele.

- **Etapa 6 (`/pipeline:docker-restart`)** roda `docker compose up -d --build` e confirma que o ambiente esta no ar de verdade (containers de pe, `GET /api/health` = 200, frontend respondendo, nenhum erro de migration Flyway). Ela sobe a stack mesmo se estiver parada — sem ambiente atualizado nao ha o que validar, e por isso uma falha aqui interrompe a esteira.
- **Etapa 7 (`/pipeline:verify`)** percorre os criterios de aceite um por um e classifica cada um: **VERIFICADO** (com evidencia: teste que passou, chamada HTTP real, medicao na pagina renderizada, ou trecho do diff), **VALIDACAO MANUAL** (depende de juizo humano) ou **NAO ATENDIDO**. Os VERIFICADO ja saem marcados como `- [x]` na spec.
  - Algum criterio NAO ATENDIDO: a esteira volta para `implement` sem te incomodar — a feature esta incompleta.
  - Caso contrario, ela mostra o roteiro de validacao manual (tela: `http://localhost`; API/Swagger: `http://localhost:8080/docs`) e **espera sua resposta**. Aprovado -> `stage: validated` e segue para commit + push + PR. Ajustes -> volta para `implement` com o que voce pediu.

O roteiro manual e para **juizo humano** (tom de texto, aparencia com os dados reais), nao para o que a esteira nao teve paciencia de medir: layout, CSS efetivo, foco e geometria se medem na pagina renderizada, e criterios de API se exercitam com chamada real.

`/pipeline:open-pr` recusa rodar se a spec nao estiver em `stage: validated`. Essa checagem e o que garante que a parada nao seja contornada.

## Contrato de `spec.md` (front-matter = estado da esteira)

```yaml
---
issue: 42
url: https://github.com/thiagodjlz/financeos/issues/42
title: "Titulo original da issue"
domains: [transactions, dashboard]   # ver knowledge/README.md - so os dominios afetados
target: main                         # main (versao em desenvolvimento) ou vX.Y.Z (correcao de versao)
stage: spec                          # ver lista abaixo
branch: feature/issue-42-exportar-lancamentos-csv   # preenchido a partir da etapa "implement"
created: 2026-07-07
---
```

Valores de `stage`, na ordem: `spec` -> `planned` -> `implemented` -> `quality-checked` -> `built` -> `docker-restarted` -> `verified` -> `validated` -> `pr-open`.

`verified` significa "a esteira verificou o que dava para verificar automaticamente"; `validated` significa "o usuario validou no ambiente local" e **so o comando `/pipeline:verify` aplica esse valor**, nunca um agente.

Ha uma unica flag transitoria: `quality: failed`, adicionada por `/pipeline:quality-check` quando algo falha, para a rodada de correcao saber que precisa corrigir. Ela e **removida** pela propria etapa quando os testes voltam a passar.

## O que cada artefato contem

- **spec.md**: historia "Como / quero / para que", contexto, criterios de aceite testaveis, fora de escopo, dominios. Ambiguidade vira "Pontos em aberto"; resolvida com o usuario, vira "Decisoes" (com data). Os checkboxes sao marcados na etapa 7, nunca antes.
- **context.md**: o briefing — regras de negocio que restringem esta issue (com a ancora do `knowledge/` de origem), tabela de arquivos em jogo, convencoes aplicaveis, e a secao "Consultas fora do briefing" que as etapas seguintes alimentam.
- **plan.md**: abordagem, arquivos a criar/alterar por camada, **tarefas na ordem de execucao** (com arquivos e criterios de cada uma), matriz de cobertura, superficie de validacao, o que fica para validacao manual, riscos e lacunas.
- **implementation-notes.md**: branch, quantas tarefas concluidas, **arquivos efetivamente alterados** (e essa lista que monta o commit da etapa 8), decisoes, desvios do plano e ajustes pos-validacao.
- **quality-report.md**: resultado de `./mvnw test`, `npm test` e `ng build` — veredito e falhas, com saida longa em `evidence/`.
- **build-report.md**: resultado de `./mvnw package` e `npm run build`, artefatos gerados.
- **docker-report.md**: resultado de `docker compose up -d --build`, checagens de saude e enderecos onde validar.
- **verification-report.md**: tabela criterio a criterio (status + evidencia), roteiro de validacao manual, dados de teste descartaveis criados, e a linha "Validado pelo usuario em <data>" depois do seu OK.
- **pr.md**: URL do Pull Request, hash do commit e resumo do que entrou.

## Etapa apos o PR: sincronizar conhecimento

Depois de `/pipeline:open-pr`, roda automaticamente `/pipeline:sync-knowledge <numero>` — etapa pos-PR, nao numerada. Ela le **secoes especificas** do que a esteira produziu (decisoes, desvios, lacunas, consultas fora do briefing, achados da verificacao) e atualiza `knowledge/*.md` e, quando o processo revelar um padrao novo, os proprios agents/skills da esteira.

Ela trabalha **com orcamento**: para acrescentar, precisa caber nos tetos (`architecture.md` 10 KB, demais `knowledge/` 25 KB, cada agent 9 KB). Licao de issue entra como **regra generalizada** com o numero da issue como referencia, nunca como narrativa; regra nova que generaliza uma anterior **funde** as duas. Licao de area tecnica vai para `knowledge/` (carregado sob demanda), nao para o prompt do agent (carregado em toda issue). Foi por nao ter orcamento que `architecture.md` chegou a 44 KB sendo lido por toda etapa de toda issue.

Ela nao comita sozinha — as mudancas ficam no working tree para voce revisar o diff antes de decidir. Tambem pode ser rodada manualmente a qualquer momento.
