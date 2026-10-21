# Relatorio de build

## Backend

PASSOU — jar gerado em `backend/target/quarkus-app/quarkus-run.jar` (runner do Quarkus), com o jar da aplicacao em `backend/target/quarkus-app/app/backend-1.0.3-dev.jar` e as dependencias em `backend/target/quarkus-app/lib/`. O comando `./mvnw -q package -DskipTests` saiu com codigo 0. O pom usa `<packaging>quarkus</packaging>`, por isso o artefato nao fica em `backend/target/*.jar`.

## Frontend

PASSOU — bundle gerado em `frontend/dist/frontend` (`browser/index.html`, `browser/`, `prerendered-routes.json`, `3rdpartylicenses.txt`). O `npm run build` (`ng build`) saiu com codigo 0. Bundle inicial de 339,74 kB brutos (86,69 kB transferidos), com chunk lazy `transaction-reports` de 34,27 kB brutos.

## Conclusao

Pronto para abrir PR (ambos os builds passaram; a PR continua condicionada ao aval do usuario na etapa `verify`, conforme a esteira).
