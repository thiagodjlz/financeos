# Briefing — issue 92

## Regras que restringem esta mudanca

- Nada de regra inventada na Central: toda afirmação publicada tem origem no código ou em `knowledge/`. Linguagem de usuário: rótulos em português como a tela exibe, nenhum valor de enum, classe ou termo de implementação (`knowledge/documentation.md`).
- Seção sem conteúdo é omitida, nunca vazia; parágrafo (bloco `PARAGRAPH`/`HIGHLIGHT`) com no máximo 600 caracteres, coberto por `DocumentationContentTest` (`knowledge/documentation.md`).
- O que o sistema garante hoje: `profileId` é `@NotNull` ("O perfil é obrigatório.") em `UserCreateRequest` **e** `UserUpdateRequest`; perfil inexistente é recusado com 400 "Perfil informado não existe." no create e no update (`knowledge/users.md`).
- `app_users.profile_id` é anulável (V5; a V6 só preencheu `dev@financeos.local`): usuário anterior aos perfis ou inserido direto no banco aparece com "-" na coluna "Perfil" da listagem (`knowledge/users.md`; `frontend/src/app/features/users/users.ts`, `profileName()`).
- Ninguém altera o próprio perfil: PUT próprio com `profileId` diferente do atual (comparação `Objects.equals`, então nulo -> perfil também conta) volta 409 "Você não pode alterar o próprio perfil." — logo, quem está sem perfil só ganha um quando **outra pessoa com permissão na tela de Usuários** edita o cadastro dele (`knowledge/users.md`, "Proteções da própria conta").
- Correção de frase de uma Central que estreia no bloco `1.0.2` ainda não cortado **não** entra em Novidades por versão: nenhum item se repete entre blocos (`knowledge/documentation.md`; decisão da spec, "Fora de escopo").

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` | `regras()` publica "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um." (linha 76) | Substitui esse item por: (a) todo cadastro e toda alteração exigem perfil; (b) por que alguém aparece com "-" em Perfil e como passa a ter um |
| `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` | Fixa áreas, seções, limite de 600, identificadores técnicos, destaque das proteções da própria conta | Novo teste que falha se a frase antiga voltar ou se os itens novos sumirem/ganharem termo técnico |
| `knowledge/users.md` | Linha da regra `UserCreateRequest` diz que a Central "simplifica demais" e "redacao a corrigir na issue #92" | Passa a registrar que a Central publica a regra correta |

Arquivos que **não podem** mudar (CA4): `UserCreateRequest.java`, `UserUpdateRequest.java`, `UserResource.java`, `AccessControl.java`, qualquer coisa em `backend/src/main/resources/db/migration/`.

## Convencoes aplicaveis

- O teste `shouldExplainOwnAccountProtectionsInUsersBusinessRules` pega o **primeiro** bloco `HIGHLIGHT` de "Regras de negócio" de Usuários: o texto novo entra como **itens da lista** existente, nunca como `HIGHLIGHT` antes do atual.
- `TECHNICAL_IDENTIFIER` do `DocumentationContentTest` já barra `Flyway`, `@NotNull` etc. em todo texto exibido; o CA2 acrescenta, só para os itens alterados: "banco", "migração", "migration", "API", "nulo", "null", "profile", "Flyway", "V5", "V6".
- Citar rótulos como a tela os exibe: coluna "Perfil", valor "-", mensagem "O perfil é obrigatório." (se citada, literal).
- Texto exibido acentuado corretamente. Varreduras que precisam continuar **vazias** (CA6; os dois regex são diferentes):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  (fonte: `knowledge/architecture.md`, seção "Idioma"). Nome de método de teste em inglês, como os existentes.
- Sem comentários no código salvo "porquê" não óbvio (`knowledge/architecture.md`).

## Consultas fora do briefing

Nenhuma ate agora.
