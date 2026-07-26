# Relatorio de build

## Backend

**PASSOU** — jar gerado em `backend/target/quarkus-app/app/backend-1.0.0.jar`

O comando `./mvnw -q package -DskipTests` executou com sucesso, gerando o aplicativo Quarkus empacotado em estrutura runnable com todas as dependencias.

## Frontend

**PASSOU** — bundle gerado em `frontend/dist/frontend/`

O comando `npm run build` completou com sucesso, gerando o bundle de producao do Angular com todos os chunks otimizados:
- main chunk: 277.01 kB (raw), 74.15 kB (gzip)
- Lazy chunks para cada modulo (transactions, users, categories, dashboard, profiles, login, etc.)
- Assets e styles comprimidos

## Conclusao

**Pronto para abrir PR** — Ambos os artefatos foram gerados com sucesso. A feature esta pronta para prosseguir para a proxima etapa da esteira (docker-restart e verificacao de criterios de aceite).
