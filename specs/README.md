# Esteira de implementacao (issue -> spec -> plano -> tarefas -> implementacao -> qualidade -> build -> ambiente -> validacao -> PR)

Cada issue do GitHub processada pela esteira automatizada vira uma pasta aqui:

```
specs/<numero-da-issue>-<slug>/
  spec.md                    # etapa 1 - /pipeline:spec-from-issue
  plan.md                    # etapa 2 - /pipeline:plan-implementation
  tasks.md                   # etapa 3 - /pipeline:tasks
  implementation-notes.md    # etapa 4 - /pipeline:implement
  quality-report.md          # etapa 5 - /pipeline:quality-check
  build-report.md            # etapa 6 - /pipeline:build
  docker-report.md           # etapa 7 - /pipeline:docker-restart
  verification-report.md     # etapa 8 - /pipeline:verify   <- PARADA para validacao do usuario
  pr.md                      # etapa 9 - /pipeline:open-pr  (commit + push + PR)
```

`<slug>` e um resumo curto em kebab-case do titulo da issue (ex.: `42-exportar-lancamentos-csv`). Todos os comandos da esteira recebem o **numero da issue** como argumento e resolvem a pasta via glob `specs/<numero>-*`.

Pastas criadas antes de julho/2026 tambem contem um `estimate.md`: era o resultado de uma etapa de estimativa que existiu no inicio da esteira e foi removida. Os arquivos ficam como registro historico; nada na esteira atual le ou gera esse arquivo.

## Como usar

Rode a primeira etapa e a esteira segue sozinha ate a parada de validacao — cada etapa invoca a proxima automaticamente, sem pedir confirmacao:

```
/pipeline:spec-from-issue <numero>
/pipeline:plan-implementation <numero>
/pipeline:tasks <numero>
/pipeline:implement <numero>
/pipeline:quality-check <numero>
/pipeline:build <numero>
/pipeline:docker-restart <numero>
/pipeline:verify <numero>          # para aqui e espera voce
/pipeline:open-pr <numero>
```

A esteira para para perguntar em tres situacoes:

1. **Sempre, na etapa 8** — a parada de validacao (ver abaixo).
2. Quando ha uma decisao de implementacao que ela nao consegue tomar sozinha (ex.: "Pontos em aberto" na spec, abordagens conflitantes no plano, criterio de aceite que continua sem cobertura depois de replanejar).
3. Quando testes/build continuam falhando apos 2 rodadas automaticas de correcao.

Se `quality-check`, `build` ou `verify` encontrarem problema, a esteira roda automaticamente uma rodada de correcao (`/pipeline:implement` de novo — o agente le o relatorio de falha alem do plano e das tarefas) e repete dali, ate no maximo 2 rodadas automaticas; persistindo a falha, ela para e reporta. Ajustes que **voce** pede na validacao manual nao contam nesse limite.

## Rastreabilidade: da spec a tarefa (etapa 3)

`/pipeline:tasks` quebra o `plan.md` em tarefas executaveis (`T1`, `T2`, ...) na ordem de execucao, cada uma declarando os arquivos que toca e **quais criterios de aceite ela atende**. No fim, monta a matriz de cobertura criterio -> tarefas e confere as duas direcoes:

- criterio de aceite sem nenhuma tarefa: o plano esta incompleto. A esteira volta uma vez para `/pipeline:plan-implementation` informando exatamente o que ficou descoberto, e refaz as tarefas. Se a lacuna persistir, ela para e pergunta — pode ser que o criterio esteja mal escrito, e isso e decisao sua.
- tarefa sem criterio nenhum que nao seja infraestrutura declarada (migration, por exemplo): pode ser escopo a mais do que a issue pediu, e a esteira pergunta antes de seguir.

E de proposito que essa checagem venha antes da implementacao: criterio esquecido descoberto aqui custa um paragrafo; descoberto na etapa 8 custa uma rodada inteira de correcao. A etapa 4 marca cada tarefa como concluida conforme avanca, e a etapa 8 usa a matriz para saber onde procurar a evidencia de cada criterio.

## Nada e commitado antes da sua validacao

O commit, o push e o PR acontecem todos na etapa 9, depois que voce aprova a feature. Da etapa 4 a 8 o codigo fica no working tree da branch `feature/issue-<numero>-<slug>`, sem entrar no historico do git.

Isso funciona porque os Dockerfiles do `backend` e do `frontend` sao multi-stage e buildam a partir do codigo-fonte copiado: a stack Docker roda o working tree, sem depender de commit. Consequencia pratica: nenhum agente da esteira deve rodar `git stash`, `git reset --hard` ou `git checkout -- <arquivo>` entre as etapas 4 e 9, porque nao existe commit para onde voltar.

## A parada de validacao (etapa 8)

A ordem das etapas 7 e 8 e proposital: primeiro o ambiente de teste local e atualizado com o codigo da feature, depois a esteira para para voce validar nele.

- **Etapa 7 (`/pipeline:docker-restart`)** roda `docker compose up -d --build` e confirma que o ambiente esta no ar de verdade (containers de pe, `GET /api/health` = 200, frontend respondendo, nenhum erro de migration Flyway). Ela sobe a stack mesmo se ela estiver parada — sem ambiente atualizado nao ha o que validar, e por isso uma falha aqui interrompe a esteira.
- **Etapa 8 (`/pipeline:verify`)** percorre os criterios de aceite da spec um por um e classifica cada um: **VERIFICADO** (com evidencia: teste que passou, chamada HTTP real, ou trecho do diff), **VALIDACAO MANUAL** (depende de ver a tela) ou **NAO ATENDIDO**. Os VERIFICADO ja saem marcados como `- [x]` na spec.
  - Se algum criterio esta NAO ATENDIDO, a esteira volta para `implement` sem te incomodar — a feature esta incompleta.
  - Caso contrario, ela te mostra o roteiro de validacao manual (tela: `http://localhost`; API/Swagger: `http://localhost:8080/docs`) e **espera sua resposta**. Aprovado -> `stage: validated` e segue para commit + push + PR. Ajustes -> volta para `implement` com o que voce pediu.

`/pipeline:open-pr` recusa rodar se a spec nao estiver em `stage: validated`. Essa checagem e o que garante que a parada nao seja contornada.

## Contrato de `spec.md` (front-matter = estado da esteira)

`spec.md` sempre comeca com um front-matter YAML que funciona como o "estado" da issue nesta esteira:

```yaml
---
issue: 42
url: https://github.com/thiagodjlz/financeos/issues/42
title: "Titulo original da issue"
domains: [transactions, dashboard]   # ver knowledge/README.md - so os dominios afetados
stage: spec                          # ver lista abaixo
branch: feature/issue-42-exportar-lancamentos-csv   # preenchido a partir da etapa "implement"
created: 2026-07-07
---
```

Valores de `stage`, na ordem: `spec` -> `planned` -> `tasked` -> `implemented` -> `quality-checked` -> `built` -> `docker-restarted` -> `verified` -> `validated` -> `pr-open`.

`verified` significa "a esteira verificou o que dava para verificar automaticamente"; `validated` significa "o usuario validou no ambiente local" e **so o comando `/pipeline:verify` aplica esse valor**, nunca um agente.

Ha uma unica flag transitoria: `quality: failed`, adicionada por `/pipeline:quality-check` quando algo falha, para a rodada de correcao saber que precisa corrigir. Ela e **removida** pela propria etapa quando os testes voltam a passar — front-matter nao deve guardar falha antiga.

Cada etapa seguinte:
1. Le esse front-matter para saber o `stage` atual e os `domains`.
2. Carrega **so** os arquivos de `knowledge/` listados em `domains` (nunca a pasta toda) + `knowledge/architecture.md`.
3. Ao terminar, atualiza o campo `stage` (e `branch`, quando aplicavel) e grava seu proprio arquivo de saida.

Isso mantem cada etapa com contexto pequeno e previsivel — e o mecanismo principal de economia de tokens da esteira: nenhum agente rele a conversa inteira nem toda a base de conhecimento, so o que a issue especifica precisa.

## O que cada artefato contem

- **spec.md**: historia no formato "Como / quero / para que", contexto, criterios de aceite testaveis, fora de escopo, dominios afetados. Quando a issue e ambigua em algum ponto, a spec registra isso em "Pontos em aberto"; se o usuario resolver esses pontos durante a conversa, a resposta vira uma secao "Decisoes" (com data) em vez de ficar em aberto — so seguem como "Pontos em aberto" duvidas que ninguem resolveu ainda. Os checkboxes dos criterios de aceite sao marcados na etapa 8, conforme cada criterio e verificado (nunca antes).
- **plan.md**: abordagem escolhida, arquivos a criar/alterar (backend/frontend/migration), ordem geral entre as camadas, como cada criterio de aceite sera verificado ("Superficie de validacao"), riscos/pontos de atencao. O passo a passo executavel nao fica aqui — fica em `tasks.md`.
- **tasks.md**: tarefas numeradas (`T1`, `T2`, ...) na ordem de execucao, cada uma com os arquivos que toca e os criterios de aceite que atende; matriz de cobertura criterio -> tarefas; secao "Lacunas". Os checkboxes sao marcados pela etapa 4 conforme cada tarefa e concluida — tarefa marcada e o registro de onde a implementacao chegou, entao nunca se marca o que nao foi feito.
- **implementation-notes.md**: branch usada, quantas tarefas foram concluidas, arquivos efetivamente alterados, decisoes tomadas, desvios em relacao ao `plan.md`/`tasks.md` e por que, e ajustes pos-validacao quando o usuario pede algo na etapa 8. A lista de arquivos alterados e o que a etapa 9 usa para montar o commit.
- **quality-report.md**: resultado de `./mvnw test` e `npm test`/`ng build`, resumo pass/fail, detalhe de falhas.
- **build-report.md**: resultado de `./mvnw package` e `npm run build`, artefatos gerados, sucesso/falha.
- **docker-report.md**: resultado de `docker compose up -d --build`, checagens de saude do ambiente e os enderecos onde validar.
- **verification-report.md**: tabela criterio a criterio (status + evidencia), roteiro de validacao manual, dados de teste descartaveis criados, e a linha "Validado pelo usuario em <data>" depois do seu OK.
- **pr.md**: URL do Pull Request aberto, hash do commit e resumo do que foi incluido.

## Etapa apos o PR: sincronizar conhecimento

Depois de `/pipeline:open-pr`, roda automaticamente `/pipeline:sync-knowledge <numero>` — etapa pos-PR, nao numerada. O subagente `pipeline-knowledge-updater` le tudo que foi produzido pela esteira para aquela issue e atualiza `knowledge/*.md` (regras de negocio que mudaram) e os agents/skills da propria esteira (`.claude/agents/pipeline-*.md`, `.claude/skills/pipeline/*/SKILL.md`) quando o processo revelar um padrao novo (ex.: um criterio que ficou como validacao manual mas daria para automatizar, um ajuste que voce pediu duas vezes em features diferentes). Ela nao comita sozinha — as mudancas ficam no working tree para voce revisar o diff antes de decidir commitar. Tambem pode ser rodada manualmente a qualquer momento.
