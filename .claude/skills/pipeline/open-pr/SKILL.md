---
name: open-pr
description: Etapa 8 (final) da esteira de implementacao - empurra a branch para o GitHub e abre o Pull Request. Acao visivel externamente.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `quality-report.md` ou `build-report.md` nao existirem ou indicarem falha, avise o usuario e pare aqui (nao abra PR com qualidade/build falhando).

**Esta etapa faz `git push` e cria um Pull Request publico no GitHub.** Nao peca confirmacao — a esteira roda de ponta a ponta automaticamente e chegar aqui com qualidade e build OK ja e a autorizacao. Apenas informe ao usuario, antes de chamar o agente, o que vai acontecer: branch que sera empurrada, titulo do PR e issue que sera fechada.

1. Chame a tool `Agent` com `subagent_type: pipeline-pr-publisher`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
2. Depois do retorno, leia `pr.md` e mostre ao usuario a URL do Pull Request criado.
3. Informe que a esteira para essa issue esta completa e que o proximo passo (merge, deploy) e uma decisao do usuario no GitHub.
4. Avance sozinho para a etapa final: invoque a skill `pipeline:sync-knowledge` com o numero da issue, sem pedir confirmacao — ela le tudo que foi produzido para essa issue e atualiza `knowledge/*.md` (regras de negocio que mudaram) e os agents/skills da propria esteira, quando o processo revelar algo novo.
