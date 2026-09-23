# Relatório do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

**Estado anterior:** Stack estava rodando (containers desde 24 horas atrás)  
**Comando:** `docker compose up -d --build`  
**Tempo decorrido:** ~40s (recriação de backend/frontend com novo código-fonte)

## Checagens

- **Containers:**
  - `financeos-postgres`: healthy, 25 horas up
  - `financeos-backend`: Up 26 seconds (recém-recriado)
  - `financeos-frontend`: Up 26 seconds (recém-recriado)

- **Backend:** `GET http://localhost:8080/api/health` → **200 OK**
- **Frontend:** `GET http://localhost/` → **200 OK**
- **Migrations Flyway:** Sem erro — log exibe "Database: jdbc:postgresql://postgres:5432/financeos (PostgreSQL 16.14)" e backend iniciou com sucesso em 2.917s

## Onde validar

- **Tela:** http://localhost (Angular app)
- **API/Swagger:** http://localhost:8080/docs (OpenAPI)
- **Health:** http://localhost:8080/api/health (JSON)

## Branch e código

- **Branch:** `feature/issue-75-botao-voltar-ao-topo`
- **Alterações incluídas no build:**
  - Frontend: novo componente `back-to-top` em `frontend/src/app/core/back-to-top/`
  - Frontend: `main-layout` ajustado para integrar o botão
  - Backend: `ReleaseNotesContent.java` e testes ajustados (CA16)
  - Backend: `OverviewContent.java` e testes ajustados (CA19)
