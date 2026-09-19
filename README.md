# FinanceOS

Sistema financeiro pessoal com backend Java/Quarkus, frontend Angular e banco PostgreSQL.

## Banco local

Pre-requisito:

- Docker Desktop instalado e em execucao

### Setup Docker no Windows

Instalacao via winget:

```powershell
winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
```

Se o WSL ainda nao estiver habilitado, abra o PowerShell como Administrador e rode:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
```

Ou execute o script do projeto em uma janela elevada:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-wsl-docker.ps1
```

Depois reinicie o Windows, abra o Docker Desktop e conclua a tela inicial.

Subir o PostgreSQL:

```bash
docker compose up -d postgres
```

Verificar status:

```bash
docker compose ps
```

Parar o banco:

```bash
docker compose down
```

Apagar o banco local e os dados:

```bash
docker compose down -v
```

Conexao local:

```text
Host: localhost
Porta: 5432 (POSTGRES_PORT)
Database: financeos (POSTGRES_DB)
Usuario: financeos (POSTGRES_USER)
Senha: POSTGRES_PASSWORD do seu .env
JDBC: jdbc:postgresql://localhost:5432/financeos
```

Nenhuma senha fica no repositorio: copie `.env.example` para `.env` e defina um `POSTGRES_PASSWORD` proprio antes de subir a stack. O `docker-compose.yml` e o `application.properties` nao tem valor padrao para essa variavel — se ela faltar, a stack falha na hora em vez de subir com uma senha conhecida.

Configuracao do Quarkus (as credenciais vem do ambiente):

```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=${POSTGRES_USER:financeos}
quarkus.datasource.password=${POSTGRES_PASSWORD}
quarkus.datasource.jdbc.url=${JDBC_URL:jdbc:postgresql://localhost:5432/financeos}
quarkus.flyway.migrate-at-start=true
```

## Backend Quarkus

Entrar na pasta do backend:

```bash
cd backend
```

Rodar testes:

```bash
./mvnw test
```

Subir API em modo desenvolvimento:

```bash
./mvnw quarkus:dev
```

O modo dev le o `.env` do diretorio de onde o comando roda, entao crie um `backend/.env` (gitignored) com o mesmo `POSTGRES_PASSWORD` do `.env` da raiz — ou exporte a variavel no shell. Sem ela a aplicacao nao sobe, de proposito. `./mvnw test` nao precisa de nada disso: o perfil de teste usa um Postgres efemero do Dev Services.

URLs locais:

```text
API health: http://localhost:8080/api/health
Contas: http://localhost:8080/api/accounts
Cartoes: http://localhost:8080/api/cards
Categorias: http://localhost:8080/api/categories
Lancamentos: http://localhost:8080/api/transactions
Dashboard: http://localhost:8080/api/dashboard/summary?year=2026&month=6
Swagger UI: http://localhost:8080/docs
OpenAPI: http://localhost:8080/openapi
```

Endpoints iniciais:

```text
GET    /api/health

POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}

GET    /api/profiles
POST   /api/profiles
PUT    /api/profiles/{id}
DELETE /api/profiles/{id}

GET    /api/accounts
GET    /api/accounts?type=CHECKING
GET    /api/accounts/{id}
POST   /api/accounts
PUT    /api/accounts/{id}
DELETE /api/accounts/{id}

GET    /api/cards
GET    /api/cards/{id}
POST   /api/cards
PUT    /api/cards/{id}
DELETE /api/cards/{id}

GET    /api/categories
GET    /api/categories?type=EXPENSE
GET    /api/categories/{id}
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

GET    /api/transactions
GET    /api/transactions?type=EXPENSE&status=PENDING
GET    /api/transactions/{id}
POST   /api/transactions
PUT    /api/transactions/{id}
DELETE /api/transactions/{id}

GET    /api/dashboard/summary
GET    /api/dashboard/summary?year=2026&month=6
```

## Autenticacao e controle de acesso

A API exige login (JWT) em todos os endpoints, exceto `/api/health` e `/api/auth/login`. Nao existe cadastro publico: novos usuarios sao criados por quem ja tem acesso a tela de Usuarios (`POST /api/users`), cada um vinculado a um Perfil que define, por tela do sistema (Dashboard, Lancamentos, Categorias, Contas, Cartoes, Usuarios, Perfis), as permissoes de visualizar/incluir/alterar/excluir.

Existe um usuario de desenvolvimento ja semeado (`dev@financeos.local`, perfil "Administrador", acesso total) e um usuario administrador oculto (`super_admin`), que nao aparece na tela de Usuarios e tem acesso total independente de perfil — usado para nunca ficar sem acesso ao sistema.

**As senhas desses dois usuarios nao ficam em nenhum arquivo do repositorio** — so o hash bcrypt vai nas migrations. Quem sobe o projeto do zero define a propria senha: suba a stack, e com o banco no ar troque o hash do usuario que for usar.

```bash
docker exec -it financeos-postgres psql -U financeos -d financeos \
  -c "update app_users set password_hash = crypt('SUA_SENHA_AQUI', gen_salt('bf', 10)) where email = 'dev@financeos.local';"
```

### Chaves RSA (assinatura dos JWTs)

O backend precisa de um par de chaves RSA em `backend/src/main/resources/privateKey.pem`/`publicKey.pem` (gitignored — nao ficam no repositorio). Para gerar um par novo:

```bash
cd backend/src/main/resources
openssl genrsa -out privateKey.pem 2048
openssl rsa -in privateKey.pem -pubout -out publicKey.pem
```

## Frontend Angular

Pre-requisito:

- Node.js 22.23 ou superior

Entrar na pasta do frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Subir a tela em modo desenvolvimento:

```bash
npm start
```

URL local:

```text
http://localhost:4200
```

O frontend fala com a API por caminho relativo (`/api`). Em `ng serve`, um proxy (`frontend/proxy.conf.json`) encaminha `/api` para `http://localhost:8080`; em producao (Docker), quem faz esse papel e o nginx do container do frontend.

## Docker (stack completa)

Sobe Postgres + backend + frontend, cada um em sua propria imagem. Use sempre `--build` (ou o script abaixo) — `docker compose up` sozinho **nao reconstroi as imagens**, entao um container pode continuar rodando codigo antigo silenciosamente depois de um merge, e ate falhar ao subir se uma migration nova ja foi aplicada no banco por outra imagem/execucao mais recente:

```bash
docker compose up -d --build
```

Ou, no Windows:

```powershell
powershell -File scripts/docker-up.ps1
```

```text
Frontend: http://localhost (porta configuravel via FRONTEND_PORT)
Backend:  http://127.0.0.1:8080 (porta configuravel via BACKEND_PORT; exposto so localmente, sem --build o nginx do frontend ja fala com o backend pela rede interna do compose)
```

Parar a stack (mantem os dados do Postgres):

```bash
docker compose down
```

Rebuildar so um servico depois de mudar codigo:

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
```

Ou, no Windows:

```powershell
powershell -File scripts/docker-up.ps1 -Servico backend
powershell -File scripts/docker-up.ps1 -Servico frontend
```

Para desenvolvimento com hot-reload continua valendo o fluxo de sempre — só o Postgres em container, backend via `mvnw quarkus:dev` e frontend via `npm start`:

```bash
docker compose up -d postgres
```

## Versionamento e branches

Cada versao do sistema tem a sua propria branch; dentro dela, cada correcao gera uma build nova.

```text
main       versao em desenvolvimento (X.Y.Z-dev) - nunca e publicada
v1.0.1     branch da versao 1.0.1 - builds 1.0.1-01, 1.0.1-02, 1.0.1-03 ...
v1.0.2     branch da versao 1.0.2 - builds 1.0.2-01, ...
```

- **`main`** e a versao em desenvolvimento. O `VERSION` dela sempre termina em `-dev` (ex.: `1.0.1-dev`) e indica a proxima versao a ser cortada. Funcionalidades novas entram aqui.
- **`vX.Y.Z`** e a branch de uma versao cortada — e dela que sai o deploy. O `VERSION` dela e `X.Y.Z-NN`, onde `NN` e o numero da build.
- **Correcao de bug** de uma versao ja publicada e feita na branch daquela versao (ou numa branch curta criada a partir dela) e **sobe a build automaticamente**, sem ninguem lembrar de editar numero nenhum.

O arquivo `VERSION` na raiz e a fonte da verdade. A versao completa aparece no rodape do login e do sistema, em `GET /api/health` (campo `version`) e nas tags das imagens Docker (`financeos-backend:1.0.1-03`).

### O hook da build

O incremento automatico da build depende de um hook versionado em `.githooks/`. Git nao instala hooks sozinho — por isso o clone se vira sozinho em tres pontos, e nenhum deles e um comando que voce precisa lembrar de rodar:

- `npm install` no `frontend/` (script `prepare` -> `scripts/ensure-hooks.js`);
- qualquer script de versao (`bump-build.ps1`, `new-version.ps1`, `update-environment.ps1`) confere e ativa se faltar;
- a esteira, na etapa de implementacao, confere antes de criar a branch.

Para forcar na mao (ou desligar), continua existindo:

```powershell
powershell -File scripts/install-hooks.ps1
powershell -File scripts/install-hooks.ps1 -Desinstalar
```

Com o hook ativo, todo commit feito numa branch de versao (ou numa branch criada a partir de uma) incrementa a build e inclui os arquivos de versao no proprio commit:

```text
pre-commit: commit pertence a versao v1.0.1 - incrementando a build...
Build: 1.0.1-02 -> 1.0.1-03
```

O hook reconhece que um commit pertence a uma versao quando: a branch atual e `vX.Y.Z`; **ou** a branch tem `branch.<nome>.financeosVersionBase` apontando para uma (a esteira grava isso ao criar branch de correcao); **ou** o upstream da branch e `origin/vX.Y.Z`. Em `main` e em branches de feature nada acontece.

Ele nao incrementa em merge, rebase ou cherry-pick — nesses casos a build ja foi contada no commit de origem. Para pular pontualmente:

```bash
FINANCEOS_SKIP_BUILD_BUMP=1 git commit -m "..."
```

Para incrementar na mao (sem commitar): `powershell -File scripts/bump-build.ps1`.

### Cortar uma versao nova

O "atualizador de versao" faz os dois lados da operacao: cria a branch da versao e devolve a `main` para a proxima:

```powershell
powershell -File scripts/new-version.ps1 -Versao 1.0.1
```

1. Confere que o working tree esta limpo, vai para a `main` e atualiza com o origin.
2. Cria `v1.0.1`, grava `VERSION = 1.0.1-01` e commita ("Inicia a versao 1.0.1 (build 01)").
3. Volta para a `main`, grava `VERSION = 1.0.2-dev` e commita ("Abre o desenvolvimento da versao 1.0.2").

Sem `-Versao`, ele usa a versao que ja esta na `main` (o `-dev` vira a versao cortada). `-Proxima 1.1.0` escolhe outro numero para a `main` (o padrao e somar 1 ao patch). `-Push` empurra as duas branches; sem ele, nada vai para o origin.

### Publicar/atualizar um ambiente

O "atualizador de ambiente" leva uma stack Docker que ja esta rodando de uma versao para outra:

```powershell
powershell -File scripts/update-environment.ps1 -Versao 1.0.1
```

1. Faz backup do banco em `backups/<data>-antes-de-<versao>.sql` (pule com `-SemBackup`).
2. Troca para a branch da versao, atualiza com o origin e sincroniza `APP_VERSION` no `.env`.
3. Roda `docker compose up -d --build` (as imagens saem tagueadas com a versao completa).
4. Espera o ambiente ficar saudavel: `GET /api/health` respondendo `UP` **com a versao esperada** e o frontend respondendo 200.
5. Se nao ficar saudavel dentro do timeout, mostra os logs do backend e **faz rollback** para a versao anterior (`-SemRollback` desliga isso).

Atencao: rollback devolve o codigo, nao o banco — migracoes Flyway ja aplicadas continuam aplicadas. Por isso o backup do passo 1; o comando de restauracao aparece na tela quando o rollback acontece.

### Conflito de build

Duas correcoes em paralelo para a mesma versao geram conflito em `VERSION`, `backend/pom.xml` e `frontend/src/app/core/version.ts` na hora do merge. Resolva **ficando com o numero de build maior** (ou rode `scripts/bump-build.ps1` depois do merge para gerar o proximo). Isso e esperado: a build conta correcoes publicadas na versao, entao ela tem que ser unica.

### O que os scripts atualizam

`VERSION`, `backend/pom.xml`, `frontend/src/app/core/version.ts`, `frontend/package.json`, `frontend/package-lock.json` e `APP_VERSION` em `.env`/`.env.example`.

`package.json`/`package-lock.json` recebem so `X.Y.Z`, sem o sufixo de build: o npm exige semver estrito e `1.0.1-02` tem zero a esquerda no identificador numerico, o que invalidaria a versao. Quem carrega a versao completa e o `VERSION`, o `pom.xml` (e portanto o `/api/health`), o rodape do frontend e as tags Docker.

Nota: `.env` nao e versionado (so `.env.example`) — numa maquina nova, copie `.env.example` para `.env` antes de subir a stack.
