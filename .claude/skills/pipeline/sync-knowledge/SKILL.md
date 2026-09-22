---
name: sync-knowledge
description: Etapa pos-PR (nao numerada) - le o que a esteira produziu para uma feature e atualiza knowledge/*.md e os agents/skills da propria esteira com o que mudou ou foi aprendido no processo.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `pr.md` ainda nao existir (PR nao foi aberto), avise o usuario que esta etapa normalmente roda depois de `/pipeline:open-pr <numero>` e pergunte se quer prosseguir mesmo assim antes de continuar.

1. Chame a tool `Agent` com `subagent_type: pipeline-knowledge-updater`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. **Use o retorno do agente** para mostrar exatamente o que foi alterado: os arquivos de `knowledge/` tocados (com o motivo), os agents/skills ajustados se algum foi, e **o que ele consolidou ou removeu** para caber no orcamento de tamanho. Essa ultima parte importa: esta e a etapa que faz a esteira crescer, e o orcamento (`architecture.md` 10 KB, demais `knowledge/` 25 KB, cada agent ~9 KB) e o que impede que o contexto de toda issue futura pague por uma licao de uma issue so.
3. Sugira ao usuario revisar o diff (`git diff -- knowledge/ .claude/agents/ .claude/skills/`) antes de commitar — esta etapa nao faz commit sozinha. O commit da feature ja foi criado e empurrado na etapa anterior, entao estas mudancas vao num commit proprio (na mesma branch, se o PR ainda estiver aberto, ou direto na `main` depois do merge).
4. Lembre o usuario de olhar tambem `git status` da pasta `specs/<numero>-<slug>/`: o `pr.md` e a atualizacao de `stage: pr-open` em `spec.md` sao escritos **depois** do commit da feature, entao ficam sempre pendentes — o natural e que entrem neste mesmo commit de revisao, junto com o que esta etapa mudou.
