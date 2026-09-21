# Relatório do ambiente local

`docker compose up -d --build` executado na raiz do projeto, na branch `feature/issue-69-selecao-validacao-ano-mes` (código no working tree, sem commit).

## Imagens e containers

PASSOU — imagens `financeos-backend:1.0.2-dev` e `financeos-frontend:1.0.2-dev` reconstruídas; os três containers de pé:

| Serviço | Estado |
|---|---|
| postgres | Up (healthy) |
| backend | Up |
| frontend | Up |

## Migrations

Sem migration nova, como a spec previa: o Flyway validou 12 migrations e registrou "Schema public is up to date. No migration necessary." (versão corrente 12). O critério 40 (ausência de migration) segue verdadeiro no ambiente.

## Backend

Subiu em 7,5 s, perfil `prod`, ouvindo em `0.0.0.0:8080`, sem erro no log.

Endpoint novo confirmado no ar:
- `GET /api/dashboard/periods` sem token → **401** (existe e está protegido)
- `GET /api/dashboard/naoexiste` → **404** (prova que o 401 acima não é rota inexistente)

Observação: `GET /q/health` e `GET /q/openapi` respondem 404 neste ambiente porque `smallrye-health` não faz parte das extensões instaladas e o OpenAPI não está publicado nesse caminho — não é sintoma da feature. O Swagger segue em `http://localhost:8080/docs` (302 para a UI).

## Frontend

`http://localhost/` respondendo **200**.

## Endereços para validação

- Tela: http://localhost (Painel Financeiro / Resumo)
- API: http://localhost:8080/docs

## Conclusão

Ambiente de teste atualizado e saudável. Pronto para a verificação dos critérios de aceite e a validação manual.
