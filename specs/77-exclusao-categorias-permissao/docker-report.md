# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando
Comando: `powershell -File scripts/docker-up.ps1`

## Checagens

- Containers: financeos-postgres (healthy), financeos-backend (up 4s), financeos-frontend (up 4s) — **OK**
- Backend: `GET http://localhost:8080/api/health` -> **200**
- Frontend: `GET http://localhost/` -> **200**
- Migrations Flyway: **sem erro** (Database: jdbc:postgresql://postgres:5432/financeos OK; Listening on http://0.0.0.0:8080)

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
