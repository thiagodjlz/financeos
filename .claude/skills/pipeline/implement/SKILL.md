---
name: implement
description: Etapa 4 da esteira de implementacao - executa as tarefas de tasks.md numa branch dedicada, sem commitar.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `tasks.md`, avise o usuario para rodar `/pipeline:tasks <numero>` primeiro (ou `/pipeline:plan-implementation <numero>`, se nem o plano existir) e pare aqui.

1. Informe ao usuario (sem pedir confirmacao) que esta etapa vai criar/usar uma branch git e deixar as mudancas no working tree — **sem commit**. O commit e o push acontecem so na etapa `/pipeline:open-pr`, depois de voce validar a feature rodando (`/pipeline:verify`).
2. Se `specs/<numero>-<slug>/quality-report.md` ou `build-report.md` ja existirem e indicarem falha, ou `verification-report.md` apontar criterio NAO ATENDIDO, informe ao agente no prompt que esta e uma rodada de correcao (passe o conteudo relevante do relatorio). Se o prompt que chegou aqui trouxer ajustes pedidos pelo usuario apos a validacao manual, repasse-os textualmente ao agente.
3. Chame a tool `Agent` com `subagent_type: pipeline-implementer`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
4. Depois do retorno, leia `implementation-notes.md` e `tasks.md` e mostre ao usuario um resumo: branch usada, quantas tarefas foram concluidas de quantas, arquivos alterados, desvios do plano. Se sobrou tarefa nao marcada, diga qual e por que.
5. Se o agente reportar uma duvida de implementacao que ele nao conseguiu resolver sozinho, pergunte ao usuario antes de seguir. Caso contrario, avance sozinho: invoque a skill `pipeline:quality-check` com o numero da issue, sem pedir confirmacao.
