---
name: docker-restart
description: Etapa 7 da esteira de implementacao - reinicia a stack Docker local (rebuild) com o build gerado, se ela estiver rodando, e gera docker-report.md.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `build-report.md` nao existir ou indicar falha, avise o usuario e confirme se ele quer continuar mesmo assim antes de seguir.

1. Chame a tool `Agent` com `subagent_type: pipeline-docker-restarter`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, leia `docker-report.md` e mostre ao usuario o resultado.
3. Termine informando: "Rode `/pipeline:open-pr <numero>` para abrir o Pull Request." Nao rode o proximo comando sozinho.

Se `plan.md` tiver um passo de validacao manual no navegador e voce (nao um subagente) for fazer essa validacao com a tool de preview: ela so consegue iniciar processos novos (via `launch.json`), nao atachar a um servidor ja rodando fora dela — nao da para apontar o preview para a stack Docker recem-reiniciada (porta 80). Aponte o preview para o dev server do frontend (`npm start`, porta 4200, com `proxy.conf.json` cobrindo o backend em `localhost:8080`) em vez disso.
