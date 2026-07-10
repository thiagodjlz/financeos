# Relatorio de reinicio do Docker

REINICIADA COM SUCESSO

## Detalhes

- **Stack status anterior**: 3 containers rodando (`financeos-frontend`, `financeos-backend`, `financeos-postgres`)
- **Acao executada**: `docker compose up -d --build` (rebuild + recreate de backend e frontend)
- **Imagens rebuidas**: `financeos-backend:1.0.0`, `financeos-frontend:1.0.0`
- **Containers recriados**: `financeos-backend`, `financeos-frontend`
- **Verificacao de startup**:
  - Backend iniciou com sucesso: "Listening on: http://0.0.0.0:8080" (tempo de startup: 3.105s)
  - Flyway validou 9 migrations, schema "public" estava up to date — nenhuma nova migracao necessaria
  - Perfil prod ativado
  - Nenhum erro de migration ou startup

## Containers finais

```
financeos-frontend:1.0.0   Up (porta 80)
financeos-backend:1.0.0    Up (porta 8080)
financeos-postgres:16-alpine  Up (porta 5432, healthy)
```

Stack pronta para testar a feature issue #22 (Destaque de erro de validacao de usuario).
