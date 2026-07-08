---
name: quality-check
description: Etapa 5 da esteira de implementacao - roda os testes de backend e frontend e gera quality-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `implementation-notes.md`, avise o usuario para rodar `/pipeline:implement <numero>` primeiro e pare aqui.

1. Chame a tool `Agent` com `subagent_type: pipeline-quality-checker`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `quality-report.md` e mostre ao usuario o resultado de cada checagem (backend/frontend/build).
3. Se tudo passou, termine informando: "Testes OK. Rode `/pipeline:build <numero>` para gerar o build." Se algo falhou, termine informando o que falhou e que o proximo passo e rodar `/pipeline:implement <numero>` de novo para corrigir. Nao rode o proximo comando sozinho em nenhum dos dois casos.
