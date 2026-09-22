# Base de conhecimento do FinanceOS

Documentacao de dominio e regras de negocio para uso por agentes e por qualquer pessoa entrando no projeto. **Carregue so o que a tarefa em maos exige** — nunca a pasta inteira.

## Como carregar

Duas dimensoes independentes. Uma tarefa tipica carrega 3 ou 4 arquivos, nao dez.

**Por area tecnica** (o que a mudanca toca):

| Arquivo | Carregue quando |
|---|---|
| [architecture.md](architecture.md) | **sempre** — stack, comandos, versionamento, convencoes transversais, idioma |
| [backend-patterns.md](backend-patterns.md) | a issue altera `backend/src/main` (erros, validacao, mensagens, parametros) |
| [frontend-ui.md](frontend-ui.md) | a issue altera tela, estilo ou navegacao (design system, responsividade, toasts, tabelas, menu) |
| [testing.md](testing.md) | a etapa escreve, ajusta ou roda teste |
| [deployment.md](deployment.md) | a issue toca deploy, Compose, Caddy, Tailscale ou modo de exposicao |

**Por dominio de negocio** (o campo `domains` da spec):

| Arquivo | Quando ler |
|---|---|
| [auth-and-permissions.md](auth-and-permissions.md) | login, JWT, perfis, telas (`Screen`) ou permissoes (`Action`) |
| [users.md](users.md) | tela/API de Usuarios |
| [categories.md](categories.md) | Categorias |
| [transactions.md](transactions.md) | Lancamentos/Transacoes |
| [dashboard.md](dashboard.md) | resumo/dashboard |
| [documentation.md](documentation.md) | Central de Documentacao e Novidades por versao (menu "Sobre") — e sempre que mudar uma regra que uma delas publica |
| [accounts.md](accounts.md) | Contas — removida na issue #20; so se for reintroduzir |
| [cards.md](cards.md) | Cartoes — removida na issue #20; so se for reintroduzir |

## Convencao dos "dominios" usados na esteira (`specs/<n>-slug/spec.md` -> `domains:`)

Valores possiveis: `auth`, `users`, `categories`, `transactions`, `dashboard`, `documentation`. Uma spec pode listar mais de um. `accounts`/`cards` nao sao mais dominios ativos.

## Quem le esta pasta na esteira

Na esteira automatizada (ver [specs/README.md](../specs/README.md)), **quem le `knowledge/` e a etapa de planejamento** — ela destila o que importa para aquela issue em `specs/<n>-<slug>/context.md`, e as etapas seguintes (implementacao, verificacao) leem o `context.md`, nao esta pasta.

A excecao e deliberada: se uma etapa posterior precisar de uma regra que o briefing nao trouxe, ela **abre o arquivo de dominio correspondente** e registra a falta no rodape do `context.md` (secao "Consultas fora do briefing"). Esse registro e o que diz, na etapa `sync-knowledge`, qual briefing esta saindo incompleto — e o sinal vale mais do que a economia de token.

## Teto de tamanho

- [architecture.md](architecture.md) e carregado por **toda** etapa de **toda** issue: teto de **10 KB**. Foi por nao ter teto que ele chegou a 44 KB.
- Os demais sao carregados sob demanda por uma ou duas etapas: teto de **25 KB**. Passou disso, quebre por area em vez de continuar acrescentando.

Licao de issue entra como **regra generalizada**, com o numero da issue entre parenteses como referencia — nunca como narrativa do caso.
