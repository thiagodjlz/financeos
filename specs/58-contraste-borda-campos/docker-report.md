# Relatorio do ambiente de teste (Docker)

**AMBIENTE ATUALIZADO E NO AR**

## Estado anterior

Stack estava rodando (containers `financeos-postgres`, `financeos-backend` e `financeos-frontend` já existiam e estavam em execução).

## Comando executado

```bash
docker compose up -d --build
```

## Checagens

- **Containers**: 
  - `financeos-postgres` ✓ (Up 17 minutes, healthy)
  - `financeos-backend:1.0.1-05` ✓ (Up 5 seconds, port 127.0.0.1:8080->8080/tcp)
  - `financeos-frontend:1.0.1-05` ✓ (Up 4 seconds, port 0.0.0.0:80->80/tcp)

- **Backend health**: `GET http://localhost:8080/api/health` → **200** ✓
  - Log confirma: "financeos-backend 1.0.1-05 on JVM (powered by Quarkus 3.37.0) started in 2.673s. Listening on: http://0.0.0.0:8080"
  - Migrations Flyway: sem erro ✓

- **Frontend**: `GET http://localhost/` → **200** ✓
  - CSS novo compilado e servido: `--border-input:oklch(64% .008 80)` presente no bundle ✓
  - Valor antigo `oklch(88% .008 80)` **não está mais** presente ✓
  - Arquivo CSS: `styles-CRIAA4CN.css`

## Confirmacao do criterio CSS

A folha de estilos publicada contém:

```css
--border-input:oklch(64% .008 80);
--chart-zero:var(--border-input);
```

**Novo valor (esperado)**: `oklch(64% 0.008 80)` ✓  
**Valor antigo (descartado)**: `oklch(88% 0.008 80)` ✓ não encontrado

## Onde validar

- **Frontend**: http://localhost
- **API Health**: http://localhost:8080/api/health
- **API Docs/Swagger**: http://localhost:8080/docs

## Resumo

Stack local pronta para validacao visual. O CSS foi reconstruido com o novo token de contraste `--border-input: oklch(64% 0.008 80)`, e todos os tres containers estao rodando sem erros. O usuario pode verificar a visibilidade das bordas dos campos em Login, Lancamentos, Categorias, Usuarios e Perfis.
