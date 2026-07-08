---
name: estimate
description: Etapa 3 da esteira de implementacao - le spec.md e plan.md e gera estimate.md (horas estimadas).
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `plan.md`, avise o usuario para rodar `/pipeline:plan-implementation <numero>` primeiro e pare aqui.

1. Chame a tool `Agent` com `subagent_type: pipeline-estimator`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `estimate.md` e mostre ao usuario a tabela de horas e o nivel de confianca.
3. Termine informando: "Quando estiver de acordo com a estimativa, rode `/pipeline:implement <numero>` para comecar a implementacao." Nao rode o proximo comando sozinho.
