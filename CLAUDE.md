# FinanceOS

Sistema financeiro pessoal: backend Java/Quarkus (`backend/`), frontend Angular (`frontend/`), PostgreSQL. Ver [README.md](README.md) para setup/comandos de dev.

## Antes de mexer no dominio

Regras de negocio e modelo de dados nao ficam aqui — ficam em [knowledge/](knowledge/README.md), separado por area (auth/permissoes, usuarios, contas, cartoes, categorias, transacoes, dashboard). Leia o(s) arquivo(s) relevante(s) antes de implementar algo que toque essas areas; varias regras nao sao obvias so lendo o codigo (ex.: categorias sao hoje um catalogo global, o usuario `super_admin` e oculto e ignora perfis, transacoes nunca sao excluidas de verdade).

## Convencoes

- Converse sempre em portugues com o usuario.
- Commits e Pull Requests em portugues.
- Todo texto exibido no front-end deve ser em portugues (labels, botoes, mensagens de erro/validacao, placeholders, titulos, tooltips etc.).
- **Toda regra de negocio e validacao e obrigatoriamente imposta no back-end** (Bean Validation no DTO ou checagem no `Resource`, com erro tratado em portugues). O front-end pode espelhar a regra como UX (`required`, `maxlength`, filtro de dropdown), mas nunca ser o unico lugar dela. Constraints do banco (not null, unique, check) sao so rede de seguranca — quem valida e responde e o back-end; as unicas regras que podem viver apenas no banco sao PKs e FKs.
- Sem comentarios no codigo a menos que expliquem um "porque" nao-obvio.
- Todo endpoint novo do backend comeca chamando `accessControl.require(Screen.X, Action.Y)` — ver [knowledge/auth-and-permissions.md](knowledge/auth-and-permissions.md).
- Detalhes de stack/comandos de build e teste: [knowledge/architecture.md](knowledge/architecture.md).

## Esteira automatizada de features (issue -> PR)

Para transformar uma issue do GitHub em Pull Request, ver [specs/README.md](specs/README.md). Basta rodar a primeira etapa — cada etapa invoca a proxima automaticamente:

```
/pipeline:spec-from-issue <numero-da-issue>
/pipeline:plan-implementation <numero>
/pipeline:tasks <numero>             # quebra o plano em tarefas rastreadas aos criterios
/pipeline:implement <numero>
/pipeline:quality-check <numero>
/pipeline:build <numero>
/pipeline:docker-restart <numero>
/pipeline:verify <numero>            # PARA aqui: validacao manual no ambiente local
/pipeline:open-pr <numero>           # commit + push + PR, so depois do seu aval
```

Cada comando roda um subagente dedicado (`.claude/agents/pipeline-*.md`), grava o resultado em `specs/<numero>-<slug>/` e avanca sozinho para a proxima etapa. Os comandos individuais continuam disponiveis para (re)executar uma etapa especifica.

**Cada tarefa e amarrada a um criterio de aceite.** A etapa 3 gera `tasks.md` com a matriz de cobertura criterio -> tarefas e recusa seguir para a implementacao se algum criterio de aceite ficou sem tarefa (volta uma vez para replanejar; persistindo, pergunta ao usuario). A etapa 4 marca as tarefas conforme conclui, e a etapa 8 usa a matriz para achar a evidencia de cada criterio.

**Nada e commitado antes da validacao do usuario.** Das etapas 4 a 8 o codigo fica no working tree da branch da feature; a etapa 7 atualiza o ambiente de teste local (`docker compose up -d --build`) e a etapa 8 verifica os criterios de aceite um por um e **para**, pedindo que o usuario valide a feature rodando em `http://localhost`. Commit, push e PR acontecem juntos na etapa 9, e `/pipeline:open-pr` recusa rodar se a spec nao estiver em `stage: validated`. Nenhum agente entre as etapas 4 e 9 deve rodar `git stash`, `git reset --hard` ou `git checkout -- <arquivo>`: nao existe commit para onde voltar.

Fora essa parada obrigatoria, a esteira para para perguntar quando ha uma decisao de implementacao que ela nao consegue tomar sozinha (ex.: "Pontos em aberto" na spec, abordagens conflitantes no plano) ou quando testes/build continuam falhando apos 2 rodadas automaticas de correcao.

Ao final do `/pipeline:open-pr`, roda automaticamente `/pipeline:sync-knowledge <numero>` — etapa que atualiza `knowledge/*.md` e os proprios agents/skills da esteira com regras de negocio e padroes de processo que a feature revelou. Ela nao comita sozinha: as mudancas ficam no working tree para voce revisar o diff antes de commitar.
