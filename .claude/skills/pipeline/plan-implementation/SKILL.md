---
name: plan-implementation
description: Etapa 2 da esteira de implementacao - le spec.md e gera plan.md (arquivos a alterar, sequencia, riscos).
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir ou nao tiver `spec.md`, avise o usuario para rodar `/pipeline:spec-from-issue <numero>` primeiro e pare aqui.

1. Chame a tool `Agent` com `subagent_type: pipeline-planner`, `run_in_background: false`, passando no prompt o caminho da pasta `specs/<numero>-<slug>/` resolvida.
2. Depois do retorno, leia `plan.md` gerado e mostre ao usuario um resumo curto: abordagem, quantos arquivos por camada (backend/frontend/migration), principal risco apontado.
3. Se o plano levantar alguma duvida de implementacao que impeca seguir com seguranca (ex.: duas abordagens conflitantes sem criterio para escolher), pergunte ao usuario antes de avancar. Caso contrario, avance sozinho: invoque a skill `pipeline:implement` com o numero da issue, sem pedir confirmacao.
