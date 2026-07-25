# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando (3 containers ativos)
Comando: `docker compose up -d --build`

## Checagens

- **Containers**: 
  - financeos-postgres (16-alpine) — Up 3 minutes (healthy)
  - financeos-backend (1.0.0) — Up 5 seconds
  - financeos-frontend (1.0.0) — Up 5 seconds

- **Backend**: `GET http://localhost:8080/api/health` → 200 OK
- **Frontend**: `GET http://localhost/` → 200 OK
- **Migrations Flyway**: sem erro
  - Database: PostgreSQL 16.14
  - Servidor iniciou: "Listening on: http://0.0.0.0:8080"

## Onde validar

- **Tela**: http://localhost (frontend em execução)
- **API/Swagger**: http://localhost:8080/docs

Ambiente pronto para validação manual das funcionalidades.
