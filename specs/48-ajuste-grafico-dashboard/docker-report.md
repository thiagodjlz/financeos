# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando (12 horas)
Comando: `docker compose up -d --build`

## Checagens

- **Containers**: financeos-postgres (Up 12 hours, healthy), financeos-backend (Up 5 seconds), financeos-frontend (Up 5 seconds) ✓
- **Backend**: `GET http://localhost:8080/api/health` -> 200 ✓
- **Frontend**: `GET http://localhost/` -> 200 ✓
- **Migrations Flyway**: Database successfully validated (12 migrations), schema "public" is up to date, no migration necessary ✓

## Onde validar

- **Tela**: http://localhost
- **API/Swagger**: http://localhost:8080/docs
