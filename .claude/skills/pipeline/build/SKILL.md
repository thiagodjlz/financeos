---
name: build
description: Etapa 6 da esteira de implementacao - gera o build (jar backend, bundle frontend) e gera build-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `quality-report.md` nao existir ou indicar falha, avise o usuario e confirme se ele quer buildar mesmo assim antes de continuar.

1. Chame a tool `Agent` com `subagent_type: pipeline-builder`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `build-report.md` e mostre ao usuario o resultado (backend/frontend) e os caminhos dos artefatos gerados.
3. Se tudo passou, termine informando: "Build OK. Rode `/pipeline:open-pr <numero>` para abrir o Pull Request (isso vai empurrar a branch para o GitHub)." Se algo falhou, informe o que falhou e que o proximo passo e `/pipeline:implement <numero>` de novo. Nao rode o proximo comando sozinho.
