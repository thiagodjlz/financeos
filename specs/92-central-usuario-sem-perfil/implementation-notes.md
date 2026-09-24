# Notas de implementacao

Branch: `feature/issue-92-central-usuario-sem-perfil` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 4 de 4 concluidas (ver `plan.md`)

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — em `regras()`, o item "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um." virou dois itens da mesma lista: exigência de perfil em todo cadastro e toda alteração, e explicação do traço (-) na coluna Perfil.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — novo teste `shouldDescribeProfileRequirementAndUsersWithoutProfileInUsersBusinessRules` (frase antiga ausente, itens novos presentes, sem termo técnico).
- `knowledge/users.md` — regra de `UserCreateRequest` sem a pendência da #92; registra o que a Central publica agora.

## Decisoes

- Redação final dos itens:
  - "Todo cadastro e toda alteração de usuário exigem um perfil; sem ele, a gravação é recusada com O perfil é obrigatório." — segue o formato dos itens vizinhos ("... é recusado com <mensagem>"), citando a mensagem literal do `@NotNull` de `UserCreateRequest`/`UserUpdateRequest`.
  - "Pessoas cadastradas antes de o sistema ter perfis podem estar sem perfil e aparecem com um traço (-) na coluna Perfil. Elas passam a ter um perfil quando outra pessoa com permissão na tela de Usuários alterar o cadastro delas." — "um traço (-)" em vez de "-" solto, para a frase ler bem; "outra pessoa com permissão na tela de Usuários" repete a expressão do destaque das proteções da própria conta (CA3).
- Itens entram na lista existente, sem `HIGHLIGHT` novo (o teste `shouldExplainOwnAccountProtectionsInUsersBusinessRules` lê o primeiro destaque da seção).
- O regex de termos técnicos do teste novo usa `\b` com `UNICODE_CHARACTER_CLASS` + caixa ignorada, para "migração" casar como palavra e "API" não casar dentro de palavras comuns.
- Verificação (T4): `./mvnw -Dtest='Documentation*Test,User*Test' test` verde (`DocumentationContentTest` 14, `DocumentationResourceTest` 1, `DocumentationSecurityTest` 5, `UserResourceTest` 25); as duas varreduras de acentuação vazias (rodadas pela ferramenta Grep, pois `rg` não está no PATH do Git Bash); `git status` só mostra os três arquivos acima mais `specs/92-*` — nenhum DTO, `UserResource`, `AccessControl` ou migration tocado.

## Desvios em relacao ao plano

- Nenhum desvio.
