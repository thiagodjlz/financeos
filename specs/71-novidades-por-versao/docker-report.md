# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

Estado anterior: stack estava rodando (containers de pé há ~1 hora)
Comando: `powershell -File scripts/docker-up.ps1` (equivalente a `docker compose up -d --build`)

## Checagens

- **Containers**: 
  - `financeos-postgres` - UP (healthy)
  - `financeos-backend` - UP
  - `financeos-frontend` - UP

- **Backend**: `GET http://localhost:8080/api/health` -> 200 ✓

- **Frontend**: `GET http://localhost/` -> 200 ✓

- **Migrations Flyway**: V14 "add release notes screen" aplicada com sucesso (schema em v14), sem erros ✓

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs
- Menu "Sobre" > "Novidades por versão": http://localhost (após login)
