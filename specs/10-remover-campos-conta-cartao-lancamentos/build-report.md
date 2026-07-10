# Relatorio de build

## Backend

PASSOU — jar gerado em `/c/Projetos/FinanceOS/backend/target/quarkus-app/app/backend-1.0.0-00.jar`

Comando: `cd backend && ./mvnw -q package -DskipTests`

Executado sem erros. O aplicativo Quarkus foi empacotado com sucesso com todas as dependências.

## Frontend

PASSOU — bundle gerado em `/c/Projetos/FinanceOS/frontend/dist/frontend`

Comando: `cd frontend && npm run build`

Executado com sucesso em 4.478 segundos. Bundle contém:
- main-OIQKTWDP.js (276.83 kB, transfer 74.21 kB)
- styles-W3EZLN2B.css (2.14 kB, transfer 680 bytes)
- 9 lazy chunks para módulos de features (registers, transactions, users, dashboard, profiles, main-layout, login)

## Conclusao

Pronto para abrir PR. Ambos os builds foram executados sem erros e todos os artefatos foram gerados conforme esperado.
