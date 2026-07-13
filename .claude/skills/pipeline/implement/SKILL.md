---
name: implement
description: Etapa 4 da esteira de implementacao - implementa o codigo seguindo plan.md numa branch dedicada e commita.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `plan.md`, avise o usuario para rodar `/pipeline:plan-implementation <numero>` primeiro e pare aqui.

1. Informe ao usuario (sem pedir confirmacao) que esta etapa vai criar/usar uma branch git e fazer commits locais (nao push, isso e so na etapa `/pipeline:open-pr`).
2. Se `specs/<numero>-<slug>/quality-report.md` ja existir e indicar falha, ou `build-report.md` indicar falha, informe ao agente no prompt que esta e uma rodada de correcao (passe o conteudo relevante do relatorio de falha).
3. Chame a tool `Agent` com `subagent_type: pipeline-implementer`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
4. Depois do retorno, leia `implementation-notes.md` e mostre ao usuario um resumo: branch usada, arquivos alterados, desvios do plano.
5. Se o agente reportar uma duvida de implementacao que ele nao conseguiu resolver sozinho, pergunte ao usuario antes de seguir. Caso contrario, avance sozinho: invoque a skill `pipeline:quality-check` com o numero da issue, sem pedir confirmacao.
