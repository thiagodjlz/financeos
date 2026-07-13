---
name: spec-from-issue
description: Etapa 1 da esteira de implementacao - le uma issue do GitHub e gera a spec.md (historia + criterios de aceite) em specs/<numero>-<slug>/.
argument-hint: <numero-da-issue>
---

O argumento e o numero de uma issue do GitHub do repo `thiagodjlz/financeos` (`$1` ou `$ARGUMENTS`). Se nao vier nenhum argumento, pergunte ao usuario qual numero de issue usar antes de continuar.

1. Verifique rapidamente que `gh` esta autenticado (`gh auth status`); se nao estiver, avise o usuario que precisa rodar `gh auth login` antes de continuar e pare aqui.
2. Confira se ja existe uma pasta `specs/<numero>-*`. Se existir e ja tiver `spec.md`, avise o usuario que a spec ja existe e pergunte se quer regenerar antes de prosseguir.
3. Chame a tool `Agent` com `subagent_type: pipeline-spec-writer`, `run_in_background: false`, passando um prompt autocontido com: o numero da issue, que o repo e `thiagodjlz/financeos` (remote `origin`), e que o resultado deve ser escrito em `specs/<numero>-<slug>/spec.md` (o proprio agente escolhe o slug e cria a pasta).
4. Depois que o agente retornar, leia o `spec.md` gerado e mostre ao usuario um resumo curto: titulo, dominios identificados, numero de criterios de aceite, e quaisquer "pontos em aberto".
5. Se houver "Pontos em aberto", pergunte ao usuario (via `AskUserQuestion` quando as opcoes forem claras, ou texto livre) como resolver cada um antes de seguir. Se o usuario responder, chame de novo a tool `Agent` com `subagent_type: pipeline-spec-writer`, informando no prompt que e uma regeneracao com decisoes ja tomadas (liste cada pergunta e a resposta do usuario) para a spec incorporar essas decisoes numa secao "Decisoes" e tirar o ponto correspondente de "Pontos em aberto". Se o usuario preferir deixar em aberto por ora, siga sem insistir.
6. Com a spec pronta (e os pontos em aberto resolvidos ou explicitamente deixados de lado pelo usuario), avance sozinho para a proxima etapa: invoque a skill `pipeline:plan-implementation` com o numero da issue. Nao peca confirmacao para avancar — a esteira so para quando precisar de uma decisao de implementacao que voce nao consegue tomar sozinho.
