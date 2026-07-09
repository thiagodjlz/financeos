# Base de conhecimento do FinanceOS

Documentacao de dominio e regras de negocio para uso por agentes e por qualquer pessoa entrando no projeto. Cada arquivo cobre uma area; leia so o que for relevante para a tarefa em maos (o objetivo e nao carregar tudo de uma vez).

| Arquivo | Quando ler |
|---|---|
| [architecture.md](architecture.md) | Sempre que for planejar, implementar, testar ou buildar algo — stack, comandos, convencoes |
| [auth-and-permissions.md](auth-and-permissions.md) | Qualquer mudanca que toque login, JWT, perfis, telas (`Screen`) ou permissoes (`Action`) |
| [users.md](users.md) | Mudancas na tela/API de Usuarios |
| [accounts.md](accounts.md) | Mudancas em Contas |
| [cards.md](cards.md) | Mudancas em Cartoes |
| [categories.md](categories.md) | Mudancas em Categorias |
| [transactions.md](transactions.md) | Mudancas em Lancamentos/Transacoes |
| [dashboard.md](dashboard.md) | Mudancas no resumo/dashboard |

## Convencao dos "dominios" usados na esteira (`specs/<n>-slug/spec.md` -> `domains:`)

Valores possiveis: `auth`, `users`, `accounts`, `cards`, `categories`, `transactions`, `dashboard`. Uma spec pode listar mais de um. As etapas de planejamento/implementacao da esteira automatizada (ver `specs/README.md`) usam essa lista para saber quais destes arquivos carregar — nunca a pasta inteira.
