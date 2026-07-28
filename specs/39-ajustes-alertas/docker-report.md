# Relatório do ambiente de teste (Docker)

## AMBIENTE ATUALIZADO E NO AR

**Estado anterior:** Stack estava rodando (containers de pé há 9 horas)

**Comando executado:** `docker compose up -d --build`

## Checagens

- **Containers:** 
  - `financeos-postgres` — Up 2 days (healthy)
  - `financeos-backend` — Up 10 seconds (criado há 12 segundos, rebuild concluído)
  - `financeos-frontend` — Up 10 seconds (criado há 12 segundos, rebuild concluído)

- **Backend API:** `GET http://localhost:8080/api/health` → **200** ✓

- **Frontend:** `GET http://localhost/` → **200** ✓

- **Migrations Flyway:** 
  ```
  Validated 11 migrations
  Current version: 10
  Migrating schema "public" to version "11 - accent seeded category names"
  Successfully applied 1 migration to schema "public", now at version v11
  ```
  ✓ V11 aplicada sem erros

- **Backend listening:** `Listening on: http://0.0.0.0:8080` ✓

## Confirmação técnica

- Rebuild multi-stage de `backend` e `frontend` concluído com sucesso
- Volume do PostgreSQL preservado (dados locais intactos)
- Feature branch `feature/issue-39-ajustes-alertas` sendo executada (código do working tree)

## Onde validar a feature

- **Tela:** http://localhost
- **API/Swagger:** http://localhost:8080/swagger-ui/

A migration V11 que acentua os nomes das categorias semeadas foi aplicada pelo Flyway conforme esperado. O ambiente está pronto para validação manual dos ajustes de alertas (toasts) antes do commit.
