# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

## Estado anterior

Stack estava rodando (3 containers: postgres, backend, frontend, criados há ~8 horas).

## Comando executado

```
docker compose up -d --build
```

Recriou `financeos-backend:1.0.0` e `financeos-frontend:1.0.0` com o código da feature; volume do PostgreSQL mantido (dados locais preservados).

## Checagens

### Containers

```
financeos-postgres    Up 3 days (healthy)
financeos-backend     Up 12 seconds
financeos-frontend    Up 12 seconds
```

Todos os 3 containers estão de pé.

### Backend — Flyway e inicialização

```
Successfully validated 12 migrations (execution time 00:00.031s)
Successfully applied 1 migration to schema "public", now at version v12 (execution time 00:00.018s)
financeos-backend 1.0.0 on JVM started in 3.616s. Listening on: http://0.0.0.0:8080
```

- ✅ Migration `V12` (drop column `categories.icon`) foi aplicada com sucesso pelo Flyway
- ✅ Nenhum erro de migration
- ✅ Backend escutando em `http://0.0.0.0:8080`

### Endpoints

- `GET http://localhost:8080/api/health` → **200**
- `GET http://localhost/` (frontend/nginx) → **200**

## Onde validar

- **Tela do app**: http://localhost
- **API/Swagger**: http://localhost:8080/docs

Ambiente pronto para a validação da feature (`/pipeline:verify`).
