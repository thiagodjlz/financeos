# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR — PÓS CORREÇÃO 1**

## Estado anterior
Stack local estava rodando com as imagens da rodada anterior (verificação inicial).

## Comando executado
```
docker compose up -d --build
```

## Checagens

### Containers
Todos três containers principais estão de pé e saudáveis:
- `financeos-postgres`: Up 34 minutes (healthy) ✓
- `financeos-backend`: Up 34 seconds ✓ (reconstruído)
- `financeos-frontend`: Up 34 seconds ✓ (reconstruído)

### Backend
- `GET http://localhost:8080/api/health` → **200 OK** ✓
- Migrations Flyway: **Sem erro** — schema versão 12, "up to date. No migration necessary."
- Logging: "Listening on: http://0.0.0.0:8080" ✓

### Frontend
- `GET http://localhost/` → **200 OK** ✓
- Bundle servido (pós-correção): 
  - `main-PO3IU6M4.js` (antes: `main-3DK3EO6W.js` — **hash mudou** ✓)
  - `styles-RRIGFJIJ.css` (antes: `styles-JZEJNVUY.css` — **hash mudou** ✓)
  - Meta viewport: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` ✓

### Verificacao das 3 correcoes da rodada 1
Confirmado que o CSS servido contém:
- ✓ `.table-wrap{position:relative` — presente no bundle

(Os demais dois ajustes — foco da gaveta via `afterNextRender` + transição de `visibility` e `form-actions` — são validados na tela durante a verificação de aceite.)

### Dados persistidos
Volume `postgres` preservado — usuário descartável `verify-temp-54@financeos.local` criado pela verificação anterior permanece disponível para reutilização.

## Endpoints de validacao

- **Frontend (UI)**: http://localhost
- **Backend (API)**: http://localhost:8080
- **Swagger/Docs**: http://localhost:8080/docs

## Resumo
- Stack local completamente operacional pós-reconstrução
- Containers saudáveis e respondendo
- **Bundle do Angular realmente reconstruído** (hashes do main.js e styles.css mudaram, não foi aproveitado do cache)
- CSS contém a primeira correção (`.table-wrap{position:relative`)
- Sem erros de migration ou inicialização
- Pronto para validação da feature na etapa 8 (verificação pós-correção 1)
