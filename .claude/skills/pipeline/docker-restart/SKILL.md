---
name: docker-restart
description: Etapa 7 da esteira de implementacao - reinicia a stack Docker local (rebuild) com o build gerado, se ela estiver rodando, e gera docker-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `build-report.md` nao existir ou indicar falha, avise o usuario e confirme se ele quer continuar mesmo assim antes de seguir.

1. Chame a tool `Agent` com `subagent_type: pipeline-docker-restarter`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `docker-report.md` e mostre ao usuario o resultado.
3. Se a stack subiu corretamente (ou estava parada e nada precisava ser feito), avance sozinho: invoque a skill `pipeline:open-pr` com o numero da issue, sem pedir confirmacao. Se o restart falhou, pare e reporte o problema ao usuario.
