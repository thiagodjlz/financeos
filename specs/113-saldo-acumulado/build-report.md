# Relatorio de build

## Backend

PASSOU — `./mvnw -q package -DskipTests` terminou com codigo 0. O pom usa `<packaging>quarkus</packaging>`, entao o artefato executavel e o layout fast-jar: launcher `backend/target/quarkus-app/quarkus-run.jar` (676 bytes), jar da aplicacao `backend/target/quarkus-app/app/backend-1.0.3-dev.jar` (202 KB) e dependencias em `backend/target/quarkus-app/lib/` (`boot` e `main`, 174 jars em `main`). Nao existe jar unico em `backend/target/*.jar`; o caminho do launcher e o artefato a usar.

## Frontend

PASSOU — `npm run build` (ng build) concluiu sem erros nem avisos. Bundle gerado em `frontend/dist/frontend` (entrada `frontend/dist/frontend/browser/index.html`; pacote inicial de 338 KB bruto / 86.5 KB transferido, mais chunks lazy, incluindo `dashboard`).

## Conclusao

Pronto para abrir PR. Ambos os builds passaram e os artefatos foram gerados.
