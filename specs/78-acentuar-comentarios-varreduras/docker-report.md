# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: stack estava rodando (containers criados 43 minutos antes da reconstrução)
Comando: `docker compose up -d --build`

## Checagens

- Containers: `financeos-postgres` (healthy), `financeos-backend` (up 4s), `financeos-frontend` (up 4s) — todos no ar
- Backend: `GET http://localhost:8080/api/health` -> **200**
- Frontend: `GET http://localhost/` -> **200**
- Migrations Flyway: sem erro (schema "public" is up to date)

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
