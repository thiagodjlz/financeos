# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: Stack estava rodando (11 horas)
Comando: `docker compose up -d --build`

## Checagens

- Containers:
  - financeos-postgres: Up 6 days (healthy)
  - financeos-backend: Up 7 seconds
  - financeos-frontend: Up 7 seconds
  - STATUS: OK
- Backend: `GET http://localhost:8080/api/health` -> 200
- Frontend: `GET http://localhost/` -> 200
- Migrations Flyway: Sucesso — 17 migrations validadas, schema up to date ("Schema "public" is up to date. No migration necessary.")
- Backend logs: "financeos-backend 1.0.3-dev on JVM (powered by Quarkus 3.37.0) started in 3.016s. Listening on: http://0.0.0.0:8080" — sem erros
- Bundle frontend: main-NQQ3ELCF.js

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
- Auditoria: http://localhost/#/audit
