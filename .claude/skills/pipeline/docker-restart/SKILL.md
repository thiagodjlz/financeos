---
name: docker-restart
description: Etapa 7 da esteira de implementacao - atualiza o ambiente de teste local (stack Docker) com o codigo da feature, para o usuario validar antes do commit, e gera docker-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `build-report.md` nao existir ou indicar falha, avise o usuario e confirme se ele quer continuar mesmo assim antes de seguir.

Esta etapa deixa o ambiente de teste local rodando o codigo da feature — e nele que o usuario valida a implementacao na etapa seguinte, antes de qualquer commit. Por isso ela **sobe a stack mesmo se estiver parada**, em vez de apenas reiniciar uma que ja estava de pe.

1. Chame a tool `Agent` com `subagent_type: pipeline-docker-restarter`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `docker-report.md` e mostre ao usuario o resultado e os enderecos do ambiente (`http://localhost` para a tela, `http://localhost:8080/docs` para a API).
3. Se a stack subiu corretamente, avance sozinho: invoque a skill `pipeline:verify` com o numero da issue, sem pedir confirmacao. Se falhou (build da imagem, migration Flyway, container que nao ficou de pe), pare e reporte o problema — sem ambiente de teste atualizado nao ha como o usuario validar, e a esteira nao deve seguir para a validacao.
