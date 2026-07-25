# Arquitetura e convencoes

## Stack

- **Backend**: Java + Quarkus, Panache (JPA simplificado), JAX-RS. Sem camada de "service" separada — as classes `*Resource` (JAX-RS) contem a regra de negocio diretamente e chamam `*Repository` (Panache) para persistencia. Pacote por feature em `backend/src/main/java/br/com/financeos/{auth,categories,dashboard,profiles,shared,transactions,users}` (`accounts`/`cards` existiram ate a issue #20, quando Contas e Cartoes foram removidos por completo do sistema — ver `knowledge/accounts.md`/`knowledge/cards.md`).
- **Migrations**: Flyway, `backend/src/main/resources/db/migration/V<n>__descricao.sql`. Nunca editar uma migration ja commitada — sempre criar uma nova `V<n+1>`. `check` constraints criados inline sem nome explicito (ex.: o de `profile_permissions.screen` na V5) recebem nome autogerado pelo Postgres por convencao (`<tabela>_<coluna>_check`), mas isso deve ser **confirmado no banco** (`select conname from pg_constraint where conrelid = '<tabela>'::regclass and contype = 'c';`) antes de escrever `DROP CONSTRAINT <nome>` numa migration nova — um nome errado quebra a migration e a aplicacao inteira nao sobe (ver issue #20, `V9__remove_accounts_and_cards.sql`).
- **Frontend**: Angular standalone (sem NgModules), em `frontend/src/app`. `core/` = services/guards/interceptors/models compartilhados; `features/<nome>/` = tela (componente + `.html` + `.scss`); `layout/` = shell da aplicacao.
- **Banco**: PostgreSQL via `docker compose up -d postgres`.
- **Auth**: JWT (SmallRye JWT), chaves RSA em `backend/src/main/resources/{privateKey,publicKey}.pem` (gitignored).

## Comandos

```bash
# Backend
cd backend
./mvnw test                    # roda os testes
./mvnw -q package -DskipTests  # gera o jar (validar empacotamento)
./mvnw quarkus:dev             # modo dev com hot reload

# Frontend
cd frontend
npm test          # ng test (vitest)
npm run build     # ng build
npm start         # ng serve (dev)

# Stack completa (Docker) - sempre com --build, senao roda imagem desatualizada
docker compose up -d --build
# ou, no Windows:
powershell -File scripts/docker-up.ps1
```

Com a stack completa no ar: tela em `http://localhost` (nginx, `FRONTEND_PORT`) e API em `http://localhost:8080` (`BACKEND_PORT`), com health em `GET /api/health`. Esse e o ambiente onde a esteira pede validacao manual antes de commitar (ver [specs/README.md](../specs/README.md)).

Swagger/OpenAPI em dev: `http://localhost:8080/docs` e `http://localhost:8080/openapi`.

## Convencoes de codigo

- **Sem comentarios** a menos que expliquem um "porque" nao-obvio (regra geral do projeto, nao so desta esteira).
- Todo endpoint que le ou escreve dado chama `accessControl.require(Screen.X, Action.Y)` como primeira linha do metodo — ver [auth-and-permissions.md](auth-and-permissions.md). Qualquer endpoint novo deve seguir esse padrao.
- Exclusao normalmente e **soft delete** (`active=false`) ou, no caso de transacoes, mudanca de status para `CANCELED` — nao ha hard delete de registros de negocio (so perfis sem uso e usuarios sao excecoes especificas, ver docs de dominio).
- **Botao "Cancelar" nos formularios de cadastro** (issue #28): as quatro telas com formulario (Categorias, Usuarios, Perfis e "Novo lancamento") tem um botao "Cancelar" ao lado de "Salvar" — `type="button"`, rotulo fixo, sempre visivel dentro do `<form>` ja protegido por `authService.can(...)` — que age so no estado local e **nunca dispara requisicao HTTP**. Em modo de criacao e de estagio unico: repoe o formulario ao estado inicial. Nas telas com modo de edicao (Categorias, Usuarios, Perfis) e de **dois estagios**, decididos comparando o formulario com o snapshot do registro como carregado (`isDirty()` via `JSON.stringify`): com alteracao pendente, o 1o clique restaura o snapshot e mantem a edicao; sem alteracao, o clique sai da edicao e limpa (handler `cancel()`). Sem modal de confirmacao. Formulario de cadastro novo deve seguir esse padrao; particularidades por tela nos docs de dominio (Usuarios: limpa mensagens de validacao, snapshot com senha vazia; Perfis: copia profunda da matriz; Lancamentos: estagio unico com cache de categorias).
- Testes de backend usam `quarkus-test-security`/`quarkus-test-security-jwt` para simular usuario autenticado.
- Testes de frontend: alem dos specs de `core/`, ha testes de **componente** em `features/*/<tela>.spec.ts` (primeiros criados na issue #28). Como os membros dos componentes sao `protected`, os testes dirigem tudo pelo DOM (`value` + `dispatchEvent`, `click()`), usam `HttpTestingController` com `httpMock.verify()` no `afterEach` e provam ausencia de chamadas com `httpMock.expectNone(() => true)` — padrao a seguir em testes de componente novos.

## Idioma

- **Commits e Pull Requests em portugues** (convencao ja estabelecida no projeto). Titulo curto e direto, corpo (quando houver) focado no "porque".
- Nomes de variaveis/classes/rotas seguem o que ja existe no codigo (majoritariamente em ingles nos identificadores, portugues nos textos/UI voltados ao usuario).
