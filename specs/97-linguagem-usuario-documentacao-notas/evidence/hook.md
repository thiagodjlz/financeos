# Evidencia do hook check-texts.sh

Repositorio temporario com `.githooks/pre-commit` e `check-texts.sh` copiados, `core.hooksPath=.githooks`. Arquivo staged em `backend/x/documentation/content/A.java`.

| Situacao | Resultado |
|---|---|
| (a) staged sem `FINANCEOS_TEXTOS_REVISADOS` | recusado, exit 1, mensagem em portugues |
| (a2) `FINANCEOS_SKIP_BUILD_BUMP=1` sem variavel de textos | recusado, exit 1 (independente do SKIP) |
| (b) com `FINANCEOS_TEXTOS_REVISADOS=1` | passa, exit 0 |
| (c) staged so `other.txt` | passa, exit 0 |
| (d) com `CHERRY_PICK_HEAD` | passa, exit 0 |
| (d2) com `MERGE_HEAD` | passa, exit 0 |
