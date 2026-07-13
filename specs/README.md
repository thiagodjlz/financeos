# Esteira de implementacao (issue -> spec -> plano -> implementacao -> qualidade -> build -> docker -> PR)

Cada issue do GitHub processada pela esteira automatizada vira uma pasta aqui:

```
specs/<numero-da-issue>-<slug>/
  spec.md                   # etapa 1 - /pipeline:spec-from-issue
  plan.md                   # etapa 2 - /pipeline:plan-implementation
  implementation-notes.md    # etapa 3 - /pipeline:implement
  quality-report.md          # etapa 4 - /pipeline:quality-check
  build-report.md            # etapa 5 - /pipeline:build
  docker-report.md           # etapa 6 - /pipeline:docker-restart
  pr.md                       # etapa 7 - /pipeline:open-pr
```

`<slug>` e um resumo curto em kebab-case do titulo da issue (ex.: `42-exportar-lancamentos-csv`). Todos os comandos da esteira recebem o **numero da issue** como argumento e resolvem a pasta via glob `specs/<numero>-*`.

## Como usar

Rode a primeira etapa e a esteira segue sozinha ate o PR aberto — cada etapa invoca a proxima automaticamente, sem pedir confirmacao. Ela so para para perguntar quando ha uma decisao de implementacao que nao consegue tomar sozinha (ex.: "Pontos em aberto" na spec) ou quando testes/build continuam falhando apos 2 rodadas automaticas de correcao. Os comandos individuais continuam disponiveis para (re)executar uma etapa especifica:

```
/pipeline:spec-from-issue <numero>
/pipeline:plan-implementation <numero>
/pipeline:implement <numero>
/pipeline:quality-check <numero>
/pipeline:build <numero>
/pipeline:docker-restart <numero>
/pipeline:open-pr <numero>
```

Se `quality-check` ou `build` falharem, a esteira roda automaticamente uma rodada de correcao (`/pipeline:implement` de novo — o agente le `quality-report.md`/`build-report.md` alem do plano) e repete dali, ate no maximo 2 rodadas automaticas; persistindo a falha, ela para e reporta.

## Contrato de `spec.md` (front-matter = estado da esteira)

`spec.md` sempre comeca com um front-matter YAML que funciona como o "estado" da issue nesta esteira:

```yaml
---
issue: 42
url: https://github.com/thiagodjlz/financeos/issues/42
title: "Titulo original da issue"
domains: [transactions, dashboard]   # ver knowledge/README.md - so os dominios afetados
stage: spec                          # spec | planned | implemented | quality-checked | built | docker-restarted | pr-open
branch: feature/issue-42-exportar-lancamentos-csv   # preenchido a partir da etapa "implement"
created: 2026-07-07
---
```

Cada etapa seguinte:
1. Le esse front-matter para saber o `stage` atual e os `domains`.
2. Carrega **so** os arquivos de `knowledge/` listados em `domains` (nunca a pasta toda) + `knowledge/architecture.md`.
3. Ao terminar, atualiza o campo `stage` (e `branch`, quando aplicavel) e grava seu proprio arquivo de saida.

Isso mantem cada etapa com contexto pequeno e previsivel — e o mecanismo principal de economia de tokens da esteira: nenhum agente relê a conversa inteira nem toda a base de conhecimento, so o que a issue especifica precisa.

## O que cada artefato contem

- **spec.md**: historia no formato "Como / quero / para que", contexto, criterios de aceite testaveis, fora de escopo, dominios afetados. Quando a issue e ambigua em algum ponto, a spec registra isso em "Pontos em aberto"; se o usuario resolver esses pontos durante a conversa, a resposta vira uma secao "Decisoes" (com data) em vez de ficar em aberto — so seguem como "Pontos em aberto" duvidas que ninguem resolveu ainda.
- **plan.md**: abordagem escolhida, arquivos a criar/alterar (backend/frontend/migration), sequencia de implementacao, riscos/pontos de atencao.
- **implementation-notes.md**: branch usada, arquivos efetivamente alterados, decisoes tomadas, desvios em relacao ao `plan.md` e por que.
- **quality-report.md**: resultado de `./mvnw test` e `npm test`/`ng build`, resumo pass/fail, detalhe de falhas.
- **build-report.md**: resultado de `./mvnw package` e `npm run build`, artefatos gerados, sucesso/falha.
- **docker-report.md**: resultado do reinicio da stack Docker local (`docker compose up -d --build`) com a imagem atualizada, ou registro de que a stack estava parada e nada foi feito.
- **pr.md**: URL do Pull Request aberto, resumo do que foi incluido.

## Etapa final apos o PR: sincronizar conhecimento

Depois de `/pipeline:open-pr`, roda automaticamente `/pipeline:sync-knowledge <numero>`. Essa etapa (subagente `pipeline-knowledge-updater`) le tudo que foi produzido pela esteira para aquela issue e atualiza `knowledge/*.md` (regras de negocio que mudaram) e os agents/skills da propria esteira (`.claude/agents/pipeline-*.md`, `.claude/skills/pipeline/*/SKILL.md`) quando o processo revelar um padrao novo (ex.: um tipo de decisao que passou a ser negociada com o usuario, um passo de validacao que se mostrou necessario). Ela nao comita sozinha — as mudancas ficam no working tree para voce revisar o diff antes de decidir commitar. Tambem pode ser rodada manualmente a qualquer momento.
