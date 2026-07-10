# Estimativa

| Area | Horas |
|---|---|
| Backend | 2 |
| Frontend | 0 |
| Migration/dados | 0 |
| Testes | 0 |
| **Total** | **2** |

## Confianca

**Alta** — escopo e execucao sao triviais: apenas adicionar atributo `message` em ~9 annotations existentes em 2 DTOs pequenos + criar 1 arquivo de teste novo seguindo pattern consolidado (CategoryResourceTest). Nenhuma regra de negocio complexa, nenhuma autorizacao afetada, nenhuma mudanca de schema ou frontend. Validacao e visual e confirma imediatamente se funcionou.

## Premissas

- Os textos das mensagens em portugues da spec sao os definitivos (criterios de aceite verificam string literal).
- O pattern de teste `CategoryResourceTest` (Quarkus Test + @TestSecurity + REST Assured) continua disponivel e funcionando.
- O mecanismo do frontend de exibicao de `violation.message` ja esta correto (implementado em issues #22 e #24) e nao precisa de ajustes.
- Nenhuma regra de Bean Validation nos DTOs de usuarios sera alterada durante a implementacao (mudam so os textos das mensagens).
- `password` em `UserUpdateRequest` continua opcional (apenas `@Size`, sem `@NotBlank`) e o frontend continua enviando `null` quando em branco.
