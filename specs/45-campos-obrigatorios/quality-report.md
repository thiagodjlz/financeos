# Relatório de qualidade

## Backend (`./mvnw test`)

PASSOU — 51 testes distribuídos em 7 classes (HealthResourceTest, AuthResourceTest, CategoryResourceTest, DashboardResourceTest, ProfileResourceTest, TransactionResourceTest, UserResourceTest). Sem falhas. A migration V12 foi aplicada com sucesso (`Successfully applied 12 migrations to schema "public", now at version v12`), confirmando a remoção da coluna `categories.icon` do banco de dados.

## Frontend (`npm test`)

PASSOU — 161 testes distribuídos em 20 arquivos de componentes e serviços. Sem falhas. Cobertura inclui os novos testes de validação com erro 400, destaque de campos, limpeza por campo, foco no primeiro inválido, estado separado para linhas de edição inline e comportamento do botão Cancelar.

## Frontend build (`npm run build`)

PASSOU — Build completado sem erros de tipo. A aplicação foi compilada com sucesso gerando 14 chunks com tamanho total de ~295,78 kB (inicial) + lazy-loaded chunks. Nenhum erro de TypeScript ou de compilação Angular.

## Conclusão

Pronto para build. Todos os critérios técnicos de qualidade foram atendidos:
- Backend: validações de campo em português, mensagens agregadas corretas, remoção do campo `icon` concluída, obrigatoriedades implementadas (Categorias, Perfis, Transações).
- Frontend: padrão de destaque de erro replicado para Categorias, Perfis e Novo Lançamento; estilos migrados para global; campo Ícone removido; dropdown de Categoria sem "Sem categoria"; testes cobrindo comportamentos pedidos.
- Schema: migration V12 aplicada e validada pelo Flyway.
