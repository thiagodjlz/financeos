# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando (39 minutos)
Comando: `docker compose up -d --build`

## Checagens

- **Containers**: 
  - financeos-postgres (Up 4 days) ✓
  - financeos-backend:1.0.2-dev (Up 6 seconds) ✓
  - financeos-frontend:1.0.2-dev (Up 6 seconds) ✓
  
- **Backend**: `GET http://localhost:8080/api/health` → 200 ✓
  - Log: "financeos-backend 1.0.2-dev on JVM (powered by Quarkus 3.37.0) started in 3.677s. Listening on: http://0.0.0.0:8080"
  - Migrations Flyway: sem erro ✓
  
- **Frontend**: `GET http://localhost/` → 200 ✓

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
- Documentação: http://localhost/documentation
- Release Notes: http://localhost/release-notes

