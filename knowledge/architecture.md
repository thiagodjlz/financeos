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

Swagger/OpenAPI em dev: `http://localhost:8080/docs` e `http://localhost:8080/openapi`.

## Convencoes de codigo

- **Sem comentarios** a menos que expliquem um "porque" nao-obvio (regra geral do projeto, nao so desta esteira).
- Todo endpoint que le ou escreve dado chama `accessControl.require(Screen.X, Action.Y)` como primeira linha do metodo — ver [auth-and-permissions.md](auth-and-permissions.md). Qualquer endpoint novo deve seguir esse padrao.
- Exclusao normalmente e **soft delete** (`active=false`) ou, no caso de transacoes, mudanca de status para `CANCELED` — nao ha hard delete de registros de negocio (so perfis sem uso e usuarios sao excecoes especificas, ver docs de dominio).
- Testes de backend usam `quarkus-test-security`/`quarkus-test-security-jwt` para simular usuario autenticado.

## Idioma

- **Commits e Pull Requests em portugues** (convencao ja estabelecida no projeto). Titulo curto e direto, corpo (quando houver) focado no "porque".
- Nomes de variaveis/classes/rotas seguem o que ja existe no codigo (majoritariamente em ingles nos identificadores, portugues nos textos/UI voltados ao usuario).
