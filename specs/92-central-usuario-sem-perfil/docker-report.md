# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando
Comando: `docker compose up -d --build` (via PowerShell `scripts/docker-up.ps1`)

## Checagens

- Containers: 
  - `financeos-postgres` ✓ Up 10 hours (healthy)
  - `financeos-backend` ✓ Up 12 seconds
  - `financeos-frontend` ✓ Up 12 seconds
- Backend: `GET http://localhost:8080/api/health` → **200**
- Frontend: `GET http://localhost/` → **200**
- Migrations Flyway: sem erro (backend iniciou com sucesso em 3.334s)
- Backend listening: `Listening on: http://0.0.0.0:8080` confirmado

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs

Ambiente pronto para validação da feature #92.
