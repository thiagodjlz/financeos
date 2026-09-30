# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

## Estado anterior
Stack estava rodando com containers `financeos-backend:1.0.2-dev`, `financeos-frontend:1.0.2-dev` e `financeos-postgres`.

## Comando executado
`powershell -File scripts/docker-up.ps1` (equivalente a `docker compose up -d --build`)

## Checagens

### Containers em execução
- `financeos-postgres` (postgres:16-alpine) - Status: Up 19 seconds (healthy)
- `financeos-backend` (financeos-backend:1.0.3-dev) - Status: Up 8 seconds
- `financeos-frontend` (financeos-frontend:1.0.3-dev) - Status: Up 8 seconds

### Backend - Flyway Migrations
- Validadas: 16 migrations
- Aplicadas: 1 migration (V16 - "remove canceled transactions") com sucesso
- Log: `Successfully applied 1 migration to schema "public", now at version v16`
- Backend iniciou corretamente: `Listening on: http://0.0.0.0:8080`

### Endpoints HTTP
- `GET http://localhost:8080/api/health` -> **200** (OK)
- `GET http://localhost/` -> **200** (OK)

### Verificacao no Postgres - Migration V16

```sql
SELECT version, description, success FROM flyway_schema_history 
  WHERE version = 16;
```

Resultado:
```
version |         description          | success 
---------+------------------------------+---------
 16      | remove canceled transactions | t
```

A migration foi aplicada com sucesso.

### Verificacao no Postgres - Transacoes por Status

Antes da migration: CANCELED 2, PAID 258, PENDING 144, null 85
Esperado apos migration: CANCELED 0, PAID 258, PENDING 144, null 85

```sql
SELECT status, COUNT(*) as count FROM transactions 
  GROUP BY status ORDER BY status;
```

Resultado:
```
status  | count 
---------+-------
 PAID    |   258
 PENDING |   144
         |    85
(3 rows)
```

**Confirmado**: Os 2 lançamentos com status CANCELED foram removidos pela migration V16. Os demais status mantiveram suas contagens exatamente iguais.

### Verificacao no Postgres - Check Constraint

```sql
SELECT con.conname, pg_get_constraintdef(con.oid) 
  FROM pg_constraint con 
  WHERE con.conrelid = 'transactions'::regclass 
    AND con.contype = 'c' 
    AND con.conname LIKE '%status%';
```

Resultado:
```
transactions_status_check | CHECK (((status IS NULL) OR ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying])::text[]))))
```

**Confirmado**: O check constraint foi criado corretamente, permitindo apenas NULL, PENDING ou PAID. CANCELED foi removido completamente.

## Onde validar

- **Tela do sistema**: http://localhost
- **API/Swagger**: http://localhost:8080/docs
- **Health check**: http://localhost:8080/api/health
