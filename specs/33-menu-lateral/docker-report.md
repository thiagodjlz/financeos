# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando (3 containers de pé)
Comando: `docker compose up -d --build`

## Checagens

- Containers:
  - `financeos-postgres`: UP (healthy)
  - `financeos-backend`: UP
  - `financeos-frontend`: UP

- Backend: `GET http://localhost:8080/api/health` -> 200
- Frontend: `GET http://localhost/` -> 200
- Migrations Flyway: sem erro (schema "public" is up to date)

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs

## Detalhes do build

- Frontend: `npm run build` completou com sucesso
- Backend: multi-stage build com Maven, JARs copiados corretamente
- Containers: recreados com novo código da feature (menu lateral)
