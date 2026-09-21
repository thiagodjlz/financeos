# Relatório de build

## Backend

PASSOU — `./mvnw -B -q package -DskipTests` sem erro; jar gerado em `backend/target/quarkus-app/quarkus-run.jar` (empacotamento Quarkus fast-jar, com as dependências em `backend/target/quarkus-app/lib`).

## Frontend

PASSOU — `npm run build` sem erro de tipo e sem nenhum warning de orçamento; bundle gerado em `frontend/dist/frontend` (main 280,82 kB, styles 12,22 kB, chunk lazy do dashboard 28,55 kB).

## Conclusão

Pronto para atualizar o ambiente local e validar na tela. Nenhum ajuste pendente de build.
