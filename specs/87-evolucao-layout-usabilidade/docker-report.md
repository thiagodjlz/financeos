# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

## Estado anterior
Stack estava rodando (37 minutos)

## Comando executado
```
docker compose up -d --build
```

## Checagens

### Containers
- `financeos-postgres`: Up 2 days (healthy) ✓
- `financeos-backend`: Up 3 seconds (recreado) ✓
- `financeos-frontend`: Up 3 seconds (recreado) ✓

### Backend
- `GET http://localhost:8080/api/health` -> **200** ✓
- Log: "Listening on: http://0.0.0.0:8080" ✓
- Migrations Flyway: sem erro ✓

### Frontend
- `GET http://localhost/` -> **200** ✓
- Build: sucesso (Angular ng build completou)

## Onde validar

- **Tela principal**: http://localhost
- **API / Swagger**: http://localhost:8080/docs

## Detalhes do build

- Backend: imagem `financeos-backend:1.0.2-dev` reconstruída
- Frontend: imagem `financeos-frontend:1.0.2-dev` reconstruída
  - Build Angular: 9.6s
  - Chunk files: 15 lazy chunks
  - Output: `/build/dist/frontend/browser/`
  - Servido por nginx em porta 80

Stack pronta para validacao da feature.
