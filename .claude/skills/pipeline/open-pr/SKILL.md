---
name: open-pr
description: Etapa 7 (final) da esteira de implementacao - empurra a branch para o GitHub e abre o Pull Request. Acao visivel externamente.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `quality-report.md` ou `build-report.md` nao existirem ou indicarem falha, avise o usuario e pare aqui (nao abra PR com qualidade/build falhando).

**Esta etapa faz `git push` e cria um Pull Request publico no GitHub** — confirme com o usuario que ele realmente quer abrir o PR agora antes de chamar o agente (o simples fato de ele ter rodado este comando ja e a confirmacao esperada pela esteira, mas repita o que vai acontecer: branch, titulo do PR, issue que sera fechada).

1. Chame a tool `Agent` com `subagent_type: pipeline-pr-publisher`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
2. Depois do retorno, leia `pr.md` e mostre ao usuario a URL do Pull Request criado.
3. Informe que a esteira para essa issue esta completa e que o proximo passo (merge, deploy) e uma decisao do usuario no GitHub.
4. Pergunte ao usuario se ele quer rodar agora `/pipeline:sync-knowledge <numero>` — etapa opcional que le tudo que foi produzido para essa issue e atualiza `knowledge/*.md` (regras de negocio que mudaram) e os agents/skills da propria esteira, quando o processo revelar algo novo. Deixe claro que e opcional e que nada roda sem essa confirmacao. Se o usuario confirmar, invoque a skill `/pipeline:sync-knowledge <numero>`; caso contrario, encerre por aqui.
