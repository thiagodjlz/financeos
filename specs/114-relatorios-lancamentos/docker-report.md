# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: stack estava rodando (`financeos-backend` e `financeos-frontend` de pe ha cerca de 55 minutos, com imagens `1.0.2-04`; `financeos-postgres` ativo e saudavel ha 11 horas)
Comando: `docker compose up -d --build`

Resultado do build: `financeos-frontend:1.0.2-04` e `financeos-backend:1.0.2-04` reconstruidas a partir do working tree (inclui a correcao de CSS de impressao). Containers `backend` e `frontend` recriados; `postgres` mantido com o mesmo volume e dados.

## Checagens

- Containers:
  - `financeos-postgres` — Up (healthy), `postgres:16-alpine`, porta `0.0.0.0:5432`
  - `financeos-backend` — Up, porta `127.0.0.1:8080`
  - `financeos-frontend` — Up, porta `0.0.0.0:80`
  - Containers de producao (`financeos-prod-*`) continuam intocados.
- Backend: `GET http://localhost:8080/api/health` -> 200
- Frontend: `GET http://localhost/` -> 200 (bundle `main-YLH25ZK7.js` servido)
- Migrations Flyway: sem erro. Log do backend: "Successfully validated 18 migrations" e "Schema public is up to date. No migration necessary." (versao atual 18, `18 | add transaction reports | t` em `flyway_schema_history`).
- Backend subiu com o codigo novo: "started ... Listening on: http://0.0.0.0:8080" (log mostra `1.0.3-dev`).
- Rotas da feature: `GET /api/transaction-reports` e `GET /api/transaction-reports/preferences` -> 401 sem token (existem, nao 404).
- Swagger: `GET http://localhost:8080/docs/` -> 200.
- Logs do backend: nenhuma excecao; unica ocorrencia de "error" e a flag JVM `ExitOnOutOfMemoryError` na linha de inicializacao.

Observacao: a tag das imagens continua `1.0.2-04` (vem de `APP_VERSION` no compose), enquanto o `VERSION` e `1.0.3-dev`. Nao afeta a validacao, pois o build foi refeito com o codigo atual.

## Onde validar

- Tela: http://localhost (menu Relatorios > Lancamentos; conferir a impressao pelo botao "Imprimir")
- API/Swagger: http://localhost:8080/docs
