# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior; `financeos-backend` e `financeos-frontend` recriados as 18:33).
Branch: `feature/issue-92-central-usuario-sem-perfil` — mudancas ainda **nao commitadas** (HEAD = `main` = `5143432`, entao o diff do working tree e o diff da branch contra `main`).
Nenhuma resposta de API foi substituida e nenhum JWT foi assinado. `GET /api/documentation` exige autenticacao (401 sem token, conferido); o conteudo servido foi provado pelos **bytes** da classe dentro do jar que esta rodando no container (`docker cp financeos-backend:/deployments/app/backend-1.0.2-dev.jar`) e pelos testes da suite. Consultas ao banco somente de leitura (`select`); nenhuma escrita ocorreu.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Frase antiga some; item "todo cadastro e toda alteração exigem perfil"; teste trava | VERIFICADO | `DocumentationContentTest#shouldDescribeProfileRequirementAndUsersWithoutProfileInUsersBusinessRules` (existe, linha 182; passou no surefire da suite completa, 157 testes, 0 falhas). No jar servido, `UsersAreaContent.class` tem 0 ocorrencias de "não existe pessoa cadastrada sem um" e 1 de "Todo cadastro e toda alteração de usuário exigem um perfil; sem ele, a gravação é recusada com O perfil é obrigatório." (bytes UTF-8, `ç`/`ã` = `c3 a7`/`c3 a3`). Frase antiga ausente tambem em `backend/src/main/java` e `frontend/src/app` (grep). Mensagem citada e literal de `UserCreateRequest.java:14` e `UserUpdateRequest.java:13` |
| 2 | Explica o "-" na coluna Perfil, sem termo técnico, com os rótulos da tela | VERIFICADO | `UsersAreaContent.java:78-80`, presente byte a byte no jar servido. Mesmo teste aplica `\b(banco\|migração\|migration\|API\|nulo\|null\|profile\|Flyway\|V5\|V6)\b` (caixa ignorada, Unicode) aos dois itens e exige "Perfil", "-" e "outra pessoa". Rótulos conferidos na tela: cabeçalho `<th>Perfil</th>` (`users.html:69`) e `profileName()` devolve `'-'` (`users.ts:142`) |
| 3 | Coerente com "Campos" (Perfil "Obrigatório") e com "ninguém altera o próprio perfil" | VALIDACAO MANUAL | Parte objetiva conferida: o item novo diz "exigem um perfil" (`:76`), alinhado a "Obrigatório." (`:59`), e atribui a correção a "outra pessoa com permissão na tela de Usuários" (`:79-80`), a mesma expressão do destaque (`:92-93`); o teste exige "outra pessoa". Coerência de sentido é leitura humana: roteiro item 1 |
| 4 | Nenhuma regra muda (DTOs, `UserResource`, `AccessControl`, migrations); testes `users/` e `documentation/` passam sem asserção alterada | VERIFICADO | `git diff main --name-only` = só `UsersAreaContent.java`, `DocumentationContentTest.java`, `knowledge/users.md`; o mesmo comando restrito aos arquivos proibidos, a `db/migration/` e a `src/test/.../users/` sai vazio. Diff de `DocumentationContentTest` só acrescenta linhas. `UserResourceTest` 25/0 falhas, `Documentation*Test` 20/0 falhas |
| 5 | Suíte de Documentação passa (600 caracteres, nada vazio) | VERIFICADO | Surefire: `DocumentationContentTest` 14 testes, `DocumentationResourceTest` 1, `DocumentationSecurityTest` 5 — 0 falhas/erros; inclui `#shouldKeepParagraphsShort` e `#shouldNotPublishEmptySection`. Relatórios gerados às 18:29, depois das edições (18:27) |
| 6 | As duas varreduras de acentuação continuam vazias | VERIFICADO | Regex do frontend (`frontend/src`, sem `*.md`) e do backend (`backend/src/main/java`, `*.java`) rodados pela ferramenta Grep (ripgrep): 0 ocorrências. Controle positivo: "obrigatório" acha 17 ocorrências em 10 arquivos, então a busca estava funcionando |
| 7 | `knowledge/users.md` sem pendência, com a regra correta | VERIFICADO | `knowledge/users.md:7`: sem "simplifica demais" nem "corrigir na issue #92" (grep vazio); registra que a Central publica "todo cadastro e toda alteracao exigem perfil" e que pessoa cadastrada antes dos perfis pode aparecer com "-" |

## Roteiro de validacao manual

1. Abra `http://localhost`, entre com a sua conta de administrador e, no menu lateral, clique em **Sobre** -> **Documentação**. Abra a área **Usuários** e vá até a seção **Regras de negócio**. Esperado: (a) nenhum item diz que "não existe pessoa cadastrada sem um"; (b) o 2º item da lista diz "Todo cadastro e toda alteração de usuário exigem um perfil; sem ele, a gravação é recusada com O perfil é obrigatório."; (c) o 3º item diz "Pessoas cadastradas antes de o sistema ter perfis podem estar sem perfil e aparecem com um traço (-) na coluna Perfil. Elas passam a ter um perfil quando outra pessoa com permissão na tela de Usuários alterar o cadastro delas.". Leia esses dois itens junto com a linha **Perfil** da tabela da seção **Campos** ("Obrigatório. ...") e com o destaque logo abaixo da lista ("... ninguém altera o próprio perfil ... por outra pessoa com permissão na tela de Usuários."). Esperado: nada ali se contradiz e em nenhum ponto o texto sugere que a própria pessoa sem perfil resolve a situação. Se ainda aparecer "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um.", a página está com resposta antiga: recarregue com Ctrl+F5. (criterio 3)

Obs.: na base local o único usuário sem perfil é o `super_admin` oculto, que não aparece na listagem — por isso não há linha com "-" para conferir na tela de Usuários; isso não faz parte dos critérios.

## Dados de teste criados

Nenhum.

## Achados fora dos criterios

- Já registrado em "Fora de escopo" da spec, sem ação nesta issue: o item novo diz que a pessoa ganha perfil quando "outra pessoa com permissão na tela de Usuários" altera o cadastro; se quem edita não puder ver a tela de Perfis, o PUT desse usuário sem perfil volta 400 "O perfil é obrigatório.". Caso raro, mesmo ponto da linha "Perfil" de "Campos".

## Conclusao

6 de 7 criterios verificados automaticamente; 1 (criterio 3, leitura de coerência do texto) depende do usuário. Nenhum criterio NAO ATENDIDO.

Validado pelo usuario em 2026-09-24.
