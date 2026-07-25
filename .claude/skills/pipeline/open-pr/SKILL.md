---
name: open-pr
description: Etapa 9 (final) da esteira de implementacao - comita o trabalho validado, empurra a branch para o GitHub e abre o Pull Request. Acao visivel externamente.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*` e confira os pre-requisitos, parando aqui se algum falhar:

- `quality-report.md` e `build-report.md` existem e nao indicam falha (nao abra PR com qualidade/build falhando);
- o front-matter de `spec.md` esta em `stage: validated`. Se estiver em `stage: verified` ou anterior, **pare**: o usuario ainda nao validou a feature. Avise que a validacao acontece em `/pipeline:verify <numero>` e nao contorne essa checagem — a parada para validacao humana e o ponto do processo.

**Esta etapa cria o commit, faz `git push` e abre um Pull Request publico no GitHub.** Nao peca confirmacao: a autorizacao e o `stage: validated`, ou seja, o usuario ja disse na etapa `/pipeline:verify` que a implementacao esta correta. Apenas informe antes de chamar o agente o que vai acontecer: arquivos que entram no commit, branch que sera empurrada, titulo do PR e issue que sera fechada.

1. Chame a tool `Agent` com `subagent_type: pipeline-pr-publisher`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
2. Depois do retorno, leia `pr.md` e mostre ao usuario a URL do Pull Request criado.
3. Informe que a esteira para essa issue esta completa e que o proximo passo (merge, deploy) e uma decisao do usuario no GitHub.
4. Avance sozinho para a etapa pos-PR: invoque a skill `pipeline:sync-knowledge` com o numero da issue, sem pedir confirmacao — ela le tudo que foi produzido para essa issue e atualiza `knowledge/*.md` (regras de negocio que mudaram) e os agents/skills da propria esteira, quando o processo revelar algo novo. Ela nao e uma etapa numerada da esteira: roda depois do PR e nao comita nada sozinha.
