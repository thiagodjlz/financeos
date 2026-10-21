# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: estava parada (nenhum container local `financeos-postgres`, `financeos-backend` ou `financeos-frontend`). Apenas a producao (`financeos-prod-*`, projeto `C:\FinanceOS-prod`) estava rodando; ela nao foi tocada.
Comando: `docker compose up -d --build`

## Checagens

- Containers: `financeos-postgres` (Up, healthy), `financeos-backend` (Up), `financeos-frontend` (Up)
- Backend: `GET http://localhost:8080/api/health` -> 200
- Frontend: `GET http://localhost/` -> 200
- Migrations Flyway: sem erro (17 migrations validadas, schema "public" na versao 17, nenhuma migration pendente)
- Log do backend: "Listening on: http://0.0.0.0:8080", perfil `prod` ativo

## Observacao

- A imagem foi tagueada como `financeos-backend:1.0.2-04` porque `APP_VERSION` no `.env` esta fixado nesse valor, enquanto `VERSION` e o `pom.xml` estao em `1.0.3-dev`. Isso afeta so o nome da tag; o codigo rodando e o working tree da feature.

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
