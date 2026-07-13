---
name: quality-check
description: Etapa 5 da esteira de implementacao - roda os testes de backend e frontend e gera quality-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `implementation-notes.md`, avise o usuario para rodar `/pipeline:implement <numero>` primeiro e pare aqui.

1. Chame a tool `Agent` com `subagent_type: pipeline-quality-checker`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `quality-report.md` e mostre ao usuario o resultado de cada checagem (backend/frontend/build).
3. Se tudo passou, avance sozinho: invoque a skill `pipeline:build` com o numero da issue, sem pedir confirmacao. Se algo falhou, informe o que falhou e invoque automaticamente a skill `pipeline:implement` com o numero da issue para uma rodada de correcao — mas no maximo 2 rodadas automaticas de correcao por issue nesta conversa; se a falha persistir depois disso, pare e reporte ao usuario o que esta falhando e o que voce ja tentou.
