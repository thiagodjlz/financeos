---
name: build
description: Etapa 6 da esteira de implementacao - gera o build (jar backend, bundle frontend) e gera build-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `quality-report.md` nao existir ou indicar falha, avise o usuario e confirme se ele quer buildar mesmo assim antes de continuar.

1. Chame a tool `Agent` com `subagent_type: pipeline-builder`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `build-report.md` e mostre ao usuario o resultado (backend/frontend) e os caminhos dos artefatos gerados.
3. Se tudo passou, avance sozinho: invoque a skill `pipeline:docker-restart` com o numero da issue, sem pedir confirmacao. Se algo falhou, informe o que falhou e invoque automaticamente a skill `pipeline:implement` com o numero da issue para uma rodada de correcao — respeitando o mesmo limite global de 2 rodadas automaticas de correcao por issue nesta conversa; se a falha persistir, pare e reporte ao usuario.
