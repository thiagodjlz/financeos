# Pull Request

URL: https://github.com/thiagodjlz/financeos/pull/21

## Resumo

PR aberto para a issue #20, branch `feature/issue-20-ajuste-menu-lateral` -> `main`.

- Sidebar ganha botao para recolher/expandir (estado recolhido mostra so o "F" da marca, itens de navegacao continuam clicaveis).
- "Cadastros" vira item pai expansivel com submenu "Categoria", levando a tela dedicada (formulario a esquerda, "ultimos registros" a direita), no padrao ja usado em Lancamentos.
- Categoria ganha campo "Situacao" (Ativo/Inativo) com fluxo de edicao completo; categorias inativas somem do dropdown de novo lancamento mas continuam pre-selecionaveis na edicao de lancamentos que ja as usam, e nas listagens/resumo existentes.
- Remocao completa de Conta e Cartao: pacotes de backend, endpoints REST, tabelas do banco (migration `V9`), enum `Screen` (backend e frontend), telas/servicos do frontend e linhas na matriz de permissoes.

## Qualidade no momento da abertura

- Backend (`./mvnw test`): PASSOU — 10 testes, migration V9 aplicada corretamente no ambiente de teste.
- Frontend (`npm test`): PASSOU — 21 testes em 8 arquivos, sem falhas.
- Frontend build (`npm run build`): PASSOU — sem erros de tipo.
- Backend build (`./mvnw -q package -DskipTests`): PASSOU — jar gerado em `backend/target/quarkus-app/app/backend-1.0.0.jar`.
