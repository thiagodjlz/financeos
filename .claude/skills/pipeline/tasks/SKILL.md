---
name: tasks
description: Etapa 3 da esteira de implementacao - quebra o plan.md em tarefas executaveis rastreadas aos criterios de aceite e confere a cobertura, gerando tasks.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir ou nao tiver `plan.md`, avise o usuario para rodar `/pipeline:plan-implementation <numero>` primeiro e pare aqui.

1. Chame a tool `Agent` com `subagent_type: pipeline-task-breaker`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` resolvida.
2. Depois do retorno, leia `tasks.md` e mostre ao usuario um resumo curto: quantas tarefas, como estao distribuidas por camada, e se todos os criterios de aceite ficaram cobertos.
3. Se a secao "Lacunas" apontar **criterio de aceite sem nenhuma tarefa**, nao siga para a implementacao: o plano esta incompleto. Invoque a skill `pipeline:plan-implementation` com o numero da issue para replanejar, informando no prompt exatamente quais criterios ficaram descobertos, e depois rode esta etapa de novo. Limite isso a uma rodada de replanejamento automatico; se a lacuna persistir, pare e pergunte ao usuario — pode ser que o proprio criterio de aceite esteja mal escrito, e isso e decisao dele.
4. Se a lacuna for de outro tipo (tarefa sem criterio, possivel escopo a mais, regra que ficaria so no frontend), mostre ao usuario e pergunte antes de seguir — sao os casos em que seguir sozinho custa retrabalho.
5. Sem lacunas, avance sozinho: invoque a skill `pipeline:implement` com o numero da issue, sem pedir confirmacao.
