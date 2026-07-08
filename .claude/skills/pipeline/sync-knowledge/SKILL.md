---
name: sync-knowledge
description: Etapa opcional apos o PR - le o que a esteira produziu para uma feature e atualiza knowledge/*.md e os agents/skills da propria esteira com o que mudou ou foi aprendido no processo.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se `pr.md` ainda nao existir (PR nao foi aberto), avise o usuario que esta etapa normalmente roda depois de `/pipeline:open-pr <numero>` e pergunte se quer prosseguir mesmo assim antes de continuar.

1. Chame a tool `Agent` com `subagent_type: pipeline-knowledge-updater`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/`.
2. Depois do retorno, mostre ao usuario exatamente o que foi alterado: liste os arquivos de `knowledge/` tocados (com o motivo) e os agents/skills ajustados, se algum foi.
3. Sugira ao usuario revisar o diff (`git diff -- knowledge/ .claude/agents/ .claude/skills/`) antes de decidir se comita essas mudancas junto com a feature ou em commit separado — esta etapa nao faz commit sozinha.
