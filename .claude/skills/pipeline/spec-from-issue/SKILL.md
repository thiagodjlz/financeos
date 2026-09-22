---
name: spec-from-issue
description: Etapa 1 da esteira de implementacao - le uma issue do GitHub e gera a spec.md (historia + criterios de aceite) em specs/<numero>-<slug>/.
argument-hint: <numero-da-issue>
---

O argumento e o numero de uma issue do GitHub do repo `thiagodjlz/financeos` (`$1` ou `$ARGUMENTS`). Se nao vier nenhum argumento, pergunte ao usuario qual numero de issue usar antes de continuar.

1. Verifique rapidamente que `gh` esta autenticado (`gh auth status`); se nao estiver, avise o usuario que precisa rodar `gh auth login` antes de continuar e pare aqui.
2. Confira se ja existe uma pasta `specs/<numero>-*`. Se existir e ja tiver `spec.md`, avise o usuario que a spec ja existe e pergunte se quer regenerar antes de prosseguir.
3. Se o corpo da issue (`gh issue view <numero> --json body,comments`) apontar para um **design/mockup**, baixe o artefato voce mesmo antes de acionar o agente — o subagente nao tem as tools para isso. Um link de projeto de design do Claude (`claude.ai/design/p/<uuid>`) responde **403 para `curl`/`WebFetch`**, mas e legivel pela tool **DesignSync** (`get_project` / `list_files` / `get_file`, usando o UUID que esta na propria URL); so declare um anexo de design inacessivel depois de tentar por ai. Salve o conteudo em `specs/<numero>-<slug>/design/` (crie a pasta) e informe no prompt do agente que esse arquivo local e a fonte da verdade visual da issue. Se nem assim der para ler, diga ao agente para registrar o design como "Ponto em aberto" em vez de supor valores.
4. Decida o **alvo** da issue — a branch onde ela sera implementada (ver README.md, secao "Versionamento e branches"):
   - Se a issue e funcionalidade nova, melhoria ou refatoracao, o alvo e `main` (a versao em desenvolvimento). Siga sem perguntar.
   - Se a issue descreve um **bug que afeta uma versao ja cortada** (existe branch `vX.Y.Z` — confira com `git branch -r --list "origin/v*"`), pergunte ao usuario com `AskUserQuestion` se a correcao deve sair numa build da versao (uma opcao por branch de versao encontrada) ou so na proxima versao (`main`). Se nao existir nenhuma branch `vX.Y.Z`, o alvo e `main` e nao ha o que perguntar.
   - Informe o alvo escolhido no prompt do agente, para ele gravar `target` no front-matter.
5. Chame a tool `Agent` com `subagent_type: pipeline-spec-writer`, `run_in_background: false`, passando um prompt autocontido com: o numero da issue, que o repo e `thiagodjlz/financeos` (remote `origin`), e que o resultado deve ser escrito em `specs/<numero>-<slug>/spec.md` (o proprio agente escolhe o slug e cria a pasta; se voce ja criou a pasta no passo anterior para o design, informe o slug escolhido).
6. **Use o retorno do agente** para mostrar ao usuario um resumo curto: titulo, dominios identificados, numero de criterios de aceite, e quaisquer "pontos em aberto".
7. Se houver "Pontos em aberto", pergunte ao usuario (via `AskUserQuestion` quando as opcoes forem claras, ou texto livre) como resolver cada um antes de seguir. Se o usuario responder, chame de novo a tool `Agent` com `subagent_type: pipeline-spec-writer`, informando no prompt que e uma regeneracao com decisoes ja tomadas (liste cada pergunta e a resposta do usuario) para a spec incorporar essas decisoes numa secao "Decisoes" e tirar o ponto correspondente de "Pontos em aberto". Se o usuario preferir deixar em aberto por ora, siga sem insistir.
8. Com a spec pronta (e os pontos em aberto resolvidos ou explicitamente deixados de lado pelo usuario), avance sozinho para a proxima etapa: invoque a skill `pipeline:plan-implementation` com o numero da issue. Nao peca confirmacao para avancar — a esteira so para quando precisar de uma decisao de implementacao que voce nao consegue tomar sozinho.
