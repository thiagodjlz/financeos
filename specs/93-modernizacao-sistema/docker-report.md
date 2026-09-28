# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando (3 dias de uptime)
Comando: `docker compose up -d --build`

## Checagens

- **Containers**: financeos-postgres (Up 4 days, healthy), financeos-backend (Up 4 seconds), financeos-frontend (Up 4 seconds) — todos rodando ✓
- **Backend**: `GET http://localhost:8080/api/health` -> 200 ✓
- **Frontend**: `GET http://localhost/` -> 200 ✓
- **Migrations Flyway**: sem erro (backend iniciou normalmente em 3.412s) ✓
- **Logs backend**: "Listening on: http://0.0.0.0:8080" — compilacao com sucesso, sem erros de deployment ✓

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
