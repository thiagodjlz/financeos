---
name: plan-implementation
description: Etapa 2 da esteira de implementacao - le spec.md e gera context.md (briefing) e plan.md (abordagem, arquivos, tarefas, matriz de cobertura criterio -> tarefa).
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir ou nao tiver `spec.md`, avise o usuario para rodar `/pipeline:spec-from-issue <numero>` primeiro e pare aqui.

Esta etapa e a **unica que le `knowledge/` e varre o codigo**. Ela destila o que importa para esta issue em `context.md` — as etapas seguintes leem esse briefing, nao a base de conhecimento. E ela tambem quebra o plano em tarefas amarradas aos criterios de aceite: criterio esquecido descoberto aqui custa um paragrafo, descoberto na verificacao custa uma rodada inteira de correcao.

1. Chame a tool `Agent` com `subagent_type: pipeline-planner`, `run_in_background: false`, passando no prompt o caminho da pasta `specs/<numero>-<slug>/` resolvida.
2. **Use o retorno do agente** para resumir ao usuario: abordagem, arquivos por camada (backend/frontend/migration), quantas tarefas, cobertura dos criterios e principal risco. Nao releia `plan.md` inteiro para montar esse resumo — o agente ja o produziu.
3. Se a secao "Lacunas" apontar **criterio de aceite sem nenhuma tarefa**, nao siga para a implementacao: o plano esta incompleto. Invoque esta mesma skill de novo informando no prompt exatamente quais criterios ficaram descobertos, para o agente ajustar o plano existente (nao reescrever do zero). Limite a **uma** rodada de replanejamento automatico; persistindo, pare e pergunte ao usuario — pode ser que o proprio criterio esteja mal escrito, e isso e decisao dele.
4. Se a lacuna for de outro tipo (tarefa sem criterio, possivel escopo a mais, regra que ficaria so no frontend) ou se o plano levantar duvida que impeca seguir com seguranca (duas abordagens conflitantes sem criterio para escolher), mostre ao usuario e pergunte antes de seguir.
5. Sem lacunas, avance sozinho: invoque a skill `pipeline:implement` com o numero da issue, sem pedir confirmacao.
