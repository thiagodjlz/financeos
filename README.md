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
Porta: 5432
Database: financeos
Usuario: financeos
Senha: financeos_dev_password
JDBC: jdbc:postgresql://localhost:5432/financeos
```

Configuracao futura do Quarkus:

```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=financeos
quarkus.datasource.password=financeos_dev_password
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/financeos
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

Por enquanto o frontend usa a API local em:

```text
http://localhost:8080/api
```
