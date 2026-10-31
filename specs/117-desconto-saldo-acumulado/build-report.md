# Relatorio de build

## Backend

PASSOU — jar gerado em `backend/target/quarkus-app/quarkus-run.jar` (runner, layout fast-jar do Quarkus; a aplicacao fica em `backend/target/quarkus-app/app/backend-1.0.3-01.jar` e as dependencias em `backend/target/quarkus-app/lib/`). Comando: `cd backend && ./mvnw -q package -DskipTests`, saida 0. Nao ha `backend/target/*.jar` direto porque o pom usa `<packaging>quarkus</packaging>`; o Dockerfile copia `target/quarkus-app/` inteiro.

## Frontend

PASSOU — bundle gerado em `frontend/dist/frontend` (aplicacao em `frontend/dist/frontend/browser/`, index em `frontend/dist/frontend/browser/index.html`). Comando: `cd frontend && npm run build`, saida 0. Bundle inicial 339.72 kB (86.75 kB transferido), sem erros nem avisos.

## Conclusao

Pronto para abrir PR (apos a validacao manual da etapa 7 e o `stage: validated`).
