#!/bin/sh
# Bloqueia commit que altera o conteudo das telas Documentacao/Novidades sem a
# revisao de linguagem (skill pipeline:revisar-textos). Confirmar a revisao:
#   FINANCEOS_TEXTOS_REVISADOS=1 git commit ...

git_dir=$(git rev-parse --git-dir)
if [ -f "$git_dir/MERGE_HEAD" ] || [ -f "$git_dir/CHERRY_PICK_HEAD" ] ||
   [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; then
    exit 0
fi

[ "$FINANCEOS_TEXTOS_REVISADOS" = "1" ] && exit 0

if git diff --cached --name-only | grep -Eq '(releasenotes|documentation)/content/'; then
    echo "pre-commit: o commit altera o texto de Documentacao ou Novidades por versao." >&2
    echo "Rode a skill pipeline:revisar-textos e, depois da revisao, comite com" >&2
    echo "FINANCEOS_TEXTOS_REVISADOS=1 git commit ..." >&2
    exit 1
fi
exit 0
