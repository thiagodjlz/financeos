# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: stack estava rodando (containers criados há 7 horas com código 1.0.3-dev)
Comando: `docker compose up -d --build`

## Checagens

- Containers: 
  - `financeos-postgres` UP (healthy) ✓
  - `financeos-backend` UP ✓
  - `financeos-frontend` UP ✓

- Backend: `GET http://localhost:8080/api/health` -> 200 ✓
- Frontend: `GET http://localhost/` -> 200 ✓
- Migrations Flyway: sem erro ✓

## Logs do backend

```
2026-09-30 18:50:25,403 INFO  [org.flywaydb.core.FlywayExecutor] (main) Database: jdbc:postgresql://postgres:5432/financeos (PostgreSQL 16.14)
2026-09-30 18:50:26,180 INFO  [io.quarkus] (main) financeos-backend 1.0.3-dev on JVM (powered by Quarkus 3.37.0) started in 3.753s. Listening on: http://0.0.0.0:8080
```

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
