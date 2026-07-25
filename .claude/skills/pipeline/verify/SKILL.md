---
name: verify
description: Etapa 8 da esteira de implementacao - verifica criterio por criterio se a implementacao atende a spec, gera verification-report.md e PARA para a validacao manual do usuario antes de qualquer commit ou PR.
argument-hint: <numero-da-issue>
---

O argumento (`$1`/`$ARGUMENTS`) e o numero da issue. Resolva a pasta via glob `specs/<numero>-*`; se nao existir `build-report.md`, avise o usuario para rodar `/pipeline:build <numero>` primeiro e pare aqui. Se `docker-report.md` nao existir ou indicar falha, avise que o ambiente de validacao pode nao estar com o codigo novo e sugira `/pipeline:docker-restart <numero>` antes de continuar.

**Esta e a parada obrigatoria da esteira.** Nada foi commitado ate aqui: o codigo da feature esta no working tree da branch e a stack Docker local ja foi reconstruida com ele. O commit, o push e o PR so acontecem depois que o usuario disser que validou.

1. Chame a tool `Agent` com `subagent_type: pipeline-verifier`, `run_in_background: false`, passando o caminho da pasta `specs/<numero>-<slug>/` e o numero da issue.
2. Leia `verification-report.md` e mostre ao usuario, em texto (nao mande ele abrir o arquivo):
   - quantos criterios ficaram VERIFICADO, VALIDACAO MANUAL e NAO ATENDIDO;
   - a lista completa dos NAO ATENDIDO, se houver;
   - o **roteiro de validacao manual na integra**, com os enderecos do ambiente (`http://localhost` para a tela, `http://localhost:8080` para a API).
3. Se houver criterio **NAO ATENDIDO**, nao peca validacao ao usuario ainda — a feature esta incompleta. Excecao: se o relatorio deixar claro que o problema **nao e defeito da implementacao** (ex.: mudanca alheia a feature no working tree, decisao de escopo do commit — ver "Achado fora dos criterios"), nao invoque `pipeline:implement`, pois nao ha codigo a corrigir; apresente o achado ao usuario e decida com ele como separar o trabalho antes de seguir. Fora essa excecao, informe o que falta e invoque automaticamente a skill `pipeline:implement` com o numero da issue para uma rodada de correcao, respeitando o mesmo limite global de 2 rodadas automaticas de correcao por issue nesta conversa; se persistir, pare e reporte. Depois da correcao a esteira volta por `quality-check` -> `build` -> `docker-restart` -> `verify`, entao o ambiente de validacao sempre reflete o codigo mais recente.
4. Se todos os criterios estiverem VERIFICADO ou VALIDACAO MANUAL, **pare e espere o usuario**. Pergunte com `AskUserQuestion` se a validacao no ambiente local passou, com as opcoes:
   - **Validado, seguir para commit e PR** — o usuario testou o roteiro e esta tudo certo;
   - **Precisa de ajustes** — algo nao ficou como ele esperava (peca o detalhe do que ajustar).

   Nao avance sozinho e nao interprete silencio como aprovacao. Esta etapa nunca invoca `pipeline:open-pr` por conta propria.
5. Conforme a resposta:
   - **Validado**: marque `- [x]` nos criterios que estavam como VALIDACAO MANUAL em `spec.md` (os VERIFICADO ja vem marcados pelo agente), acrescente no fim de `verification-report.md` uma linha `Validado pelo usuario em <AAAA-MM-DD>.`, atualize o front-matter para `stage: validated` e invoque a skill `pipeline:open-pr` com o numero da issue — a partir daqui a esteira segue sozinha (commit, push, PR, sync-knowledge).
   - **Precisa de ajustes**: nao mexa no `stage`. Invoque a skill `pipeline:implement` com o numero da issue, informando no prompt que sao ajustes pedidos pelo usuario apos a validacao manual (liste o que ele pediu, textualmente). Esses ajustes nao contam no limite de 2 rodadas automaticas de correcao — o limite vale para falhas de teste/build, nao para pedidos do usuario.
   - Se o usuario apontar que um criterio de aceite estava errado ou incompleto (nao a implementacao dele), isso e mudanca de spec: atualize a secao "Decisoes" de `spec.md` com a data antes de mandar para `pipeline:implement`.
