# Plano de implementacao

## Abordagem

Correção só de conteúdo da Central: em `UsersAreaContent.regras()`, o item "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um." é substituído por dois itens na mesma lista — um com a garantia real (todo cadastro e toda alteração exigem perfil) e outro explicando o "-" na coluna Perfil e que a pessoa passa a ter perfil quando outra pessoa com permissão na tela de Usuários alterar o cadastro dela. Um teste novo em `DocumentationContentTest` trava a frase antiga, a presença dos itens novos e a ausência de termos técnicos neles. Por fim, `knowledge/users.md` deixa de registrar o ponto como pendente. Nenhum código de regra, endpoint, tela ou migration é tocado.

Redação sugerida (a implementação pode ajustar, mantendo os pontos do CA1-CA3):

- "Todo cadastro e toda alteração de usuário exigem um perfil; sem ele, o sistema recusa com O perfil é obrigatório."
- "Pessoas cadastradas antes de o sistema ter perfis podem estar sem perfil e aparecem com - na coluna Perfil. Elas passam a ter um perfil quando outra pessoa com permissão na tela de Usuários alterar o cadastro delas."

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — troca do item da linha 76 de `regras()` por dois itens (lista `DocumentationBlock.list`, sem mexer no `HIGHLIGHT`).
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — novo `@Test` (ex.: `shouldDescribeProfileRequirementAndUsersWithoutProfileInUsersBusinessRules`).

### Conhecimento
- `knowledge/users.md` — linha 7 (regra de `UserCreateRequest`): remove "simplifica demais" / "redacao a corrigir na issue #92" e registra que a Central publica a regra correta.

### Frontend
- Nenhum.

### Migration
- Nenhuma (proibido pelo CA4).

## Tarefas

- [x] **T1** — Substituir, em `UsersAreaContent.regras()`, o item "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um." por dois itens: (a) todo cadastro e toda alteração de usuário exigem um perfil; (b) pessoas cadastradas antes de o sistema ter perfis podem aparecer com "-" na coluna Perfil e passam a ter um quando **outra pessoa com permissão na tela de Usuários** alterar o cadastro delas. Sem "banco", "migração", "migration", "API", "nulo", "null", "profile", "Flyway", "V5", "V6"; acentuação correta; itens na lista, não em `HIGHLIGHT` novo.
  - Arquivos: `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java`
  - Criterios: 1, 2, 3
- [x] **T2** — Criar em `DocumentationContentTest` um teste que, na área "Usuários" / seção "Regras de negócio": (a) falha se qualquer item/texto contiver "não existe pessoa cadastrada sem um" (ou "precisa de um perfil: não existe"); (b) exige um item contendo "Todo cadastro e toda alteração" e "perfil"; (c) exige um item contendo "Perfil", "-" e "outra pessoa"; (d) confere que esses itens não casam `(?i)\b(banco|migração|migration|API|nulo|null|profile|Flyway|V5|V6)\b`.
  - Arquivos: `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`
  - Criterios: 1, 2, 3
- [x] **T3** — Atualizar a regra de `UserCreateRequest` em `knowledge/users.md`: tirar "simplifica demais" e "redacao a corrigir na issue #92"; registrar que a Central (`UsersAreaContent`, "Regras de negócio") publica que todo cadastro e toda alteração exigem perfil e que usuário antigo pode aparecer com "-" até outra pessoa alterar o cadastro dele (issue #92).
  - Arquivos: `knowledge/users.md`
  - Criterios: 7
- [x] **T4** — Rodar `./mvnw test -Dtest='Documentation*Test,User*Test'` (pacotes `documentation/` e `users/`), as duas varreduras de acentuação do `context.md` e `git diff --name-only main` para confirmar que só os três arquivos acima (mais `specs/92-*`) mudaram.
  - Arquivos: — (verificação)
  - Criterios: 4, 5, 6

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Frase antiga some; item "todo cadastro e toda alteração exigem perfil" + teste | T1, T2 |
| 2 | Explica o "-" na coluna Perfil sem termo técnico | T1, T2 |
| 3 | Coerente com "Campos" (Obrigatório) e com "ninguém altera o próprio perfil" | T1, T2 |
| 4 | Nenhuma regra/DTO/Resource/AccessControl/migration alterada; testes users/documentation passam | T4 |
| 5 | Suíte de Documentação passa (600 caracteres, nada vazio) | T4 |
| 6 | Varreduras de acentuação continuam vazias | T1, T4 |
| 7 | `knowledge/users.md` sem pendência, com a regra correta | T3 |

## Superficie de validacao

- Criterio 1 — `DocumentationContentTest#shouldDescribeProfileRequirementAndUsersWithoutProfileInUsersBusinessRules` (T2); na tela: menu "Sobre" -> "Documentação" -> área Usuários -> "Regras de negócio", o item novo aparece e a frase antiga não.
- Criterio 2 — mesmo teste (regex de termos técnicos + "Perfil" e "-"); leitura do item na tela.
- Criterio 3 — mesmo teste ("outra pessoa"); leitura conjunta com a linha "Perfil" de "Campos" e o destaque das proteções da própria conta.
- Criterio 4 — `git diff --name-only main` sem `UserCreateRequest.java`, `UserUpdateRequest.java`, `UserResource.java`, `AccessControl.java`, `db/migration/`; `./mvnw test` verde nos pacotes `users/` e `documentation/` sem asserção alterada (só o teste novo acrescentado).
- Criterio 5 — `DocumentationContentTest`, `DocumentationResourceTest`, `DocumentationSecurityTest` verdes (suíte completa na etapa 4).
- Criterio 6 — as duas varreduras de `knowledge/architecture.md` ("Idioma"), copiadas no `context.md`, saem vazias.
- Criterio 7 — leitura da linha 7 de `knowledge/users.md` no diff.

## Validacao manual (etapa 7)

- Criterio 3 — leitura humana da área Usuários na Central (`http://localhost` -> "Sobre" -> "Documentação" -> Usuários): o texto novo não sugere que a própria pessoa sem perfil corrige o cadastro e não contradiz "Obrigatório" em "Campos". O teste só verifica palavras; coerência de sentido é leitura.

## Riscos e pontos de atencao

- **Principal**: redação que volta a afirmar algo falso ou técnico — por ex., dizer que a própria pessoa escolhe o perfil (é recusado com 409 "Você não pode alterar o próprio perfil.", e sem perfil ela não tem permissão nenhuma) ou citar "banco"/"migração" (`knowledge/documentation.md`, `knowledge/users.md`).
- Não descrever o que um usuário sem perfil consegue ver/fazer nem mexer na linha "Perfil" de "Campos": ambos estão em "Fora de escopo" da spec.
- `shouldExplainOwnAccountProtectionsInUsersBusinessRules` lê o primeiro `HIGHLIGHT` de "Regras de negócio": não criar destaque novo antes dele.
- O regex do CA2 com "API" sem `\b` e sem caixa casaria sílabas de palavras comuns; usar fronteira de palavra no teste para não gerar falso positivo.
- A "Descrição" ("recebe um perfil") e `ProfilesAreaContent` ("atribui um deles a cada usuário") descrevem o fluxo de cadastro, não afirmam impossibilidade de usuário sem perfil — ficam como estão (fora do CA1/CA3).
- Novidades por versão: sem item, por decisão da spec (`knowledge/documentation.md`, "nenhum item se repete entre blocos").

## Lacunas

- Nenhuma.
