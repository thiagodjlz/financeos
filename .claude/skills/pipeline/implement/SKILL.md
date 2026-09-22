---
name: implement
description: Etapa 3 da esteira de implementacao - executa as tarefas de plan.md numa branch dedicada, sem commitar.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `plan.md`, avise o usuario para rodar `/pipeline:plan-implementation <numero>` primeiro e pare aqui.

1. Informe ao usuario (sem pedir confirmacao) que esta etapa vai criar/usar uma branch git e deixar as mudancas no working tree — **sem commit**. O commit e o push acontecem so na etapa `/pipeline:open-pr`, depois de ele validar a feature rodando.
2. Se `quality-report.md` ou `build-report.md` ja existirem e indicarem falha, ou `verification-report.md` apontar criterio NAO ATENDIDO, diga no prompt do agente que esta e uma rodada de correcao e passe **o trecho relevante** do relatorio (o que falhou), nao o arquivo inteiro. Se o prompt que chegou aqui trouxer ajustes pedidos pelo usuario apos a validacao manual, repasse-os textualmente.
3. Chame a tool `Agent` com `subagent_type: pipeline-implementer`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
4. **Use o retorno do agente** para resumir ao usuario: branch, tarefas concluidas de quantas, arquivos alterados, desvios do plano. Sobrou tarefa desmarcada, diga qual e por que. Nao releia `implementation-notes.md` para montar o resumo.
5. Se o agente reportar duvida de implementacao que nao conseguiu resolver sozinho, pergunte ao usuario antes de seguir. Caso contrario, avance sozinho: invoque a skill `pipeline:quality-check` com o numero da issue, sem pedir confirmacao.
