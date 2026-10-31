# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: stack estava parada (containers `financeos-postgres`, `financeos-backend` e `financeos-frontend` existiam, todos `Exited`). A stack de producao (`financeos-prod-*`, projeto `financeos-prod` em `C:\FinanceOS-prod`) continua rodando na mesma maquina e nao foi tocada.
Comando: `docker compose up -d --build`

## Checagens

- Containers: `financeos-postgres` — Up, healthy (porta 5432); `financeos-backend` — Up (127.0.0.1:8080); `financeos-frontend` — Up (porta 80)
- Backend: `GET http://localhost:8080/api/health` -> 200
- Frontend: `GET http://localhost/` -> 200
- Migrations Flyway: sem erro (18 migrations validadas, schema ja na versao 18, nenhuma migration nova)
- Log do backend: "Listening on: http://0.0.0.0:8080" presente; jar reporta `financeos-backend 1.0.3-01`

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs

Observacao: `.env` tem `APP_VERSION=1.0.4-dev`, por isso a imagem foi tagueada `financeos-backend:1.0.4-dev` e `financeos-frontend:1.0.4-dev`, enquanto o `VERSION` e o conteudo do jar sao `1.0.3-01`. Nao impede a validacao; o `.env` pode ser ajustado se quiser a tag alinhada.
