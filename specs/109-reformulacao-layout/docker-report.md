# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: Stack estava rodando (containers de 2 dias atrás)  
Comando: `powershell -File scripts/docker-up.ps1`

## Checagens

- **Containers:** 
  - financeos-postgres: Up (healthy)
  - financeos-backend: Up (1.0.2-04, recreated 12 segundos atrás)
  - financeos-frontend: Up (1.0.2-04, recreated 13 segundos atrás)

- **Backend:** `GET http://localhost:8080/api/health` → 200
- **Frontend:** `GET http://localhost/` → 200
- **Migrations Flyway:** Sem erro — "Schema is up to date. No migration necessary."
  - Database: PostgreSQL 16.14
  - Validação: 16 migrations (41ms)
  - Status: Nenhuma migração necessária

Backend startup: 4.247s, Listening on http://0.0.0.0:8080

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
- Health: http://localhost:8080/api/health
