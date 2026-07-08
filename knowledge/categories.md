# Categorias

Fonte: `backend/src/main/java/br/com/financeos/categories/`.

## Campos

`userId(nullable), parentId(auto-FK, subcategorias), name, type(CategoryType), color, icon, active`.
`CategoryType`: `INCOME, EXPENSE`.

## Regras

- Unique `(user_id, parent_id, name, type)`; `parent_id` com `ON DELETE SET NULL` (excluir categoria-pai orfaniza os filhos, nao cascateia exclusao).
- **Atencao, pegadinha do dominio**: diferente de Contas/Cartoes/Transacoes, `CategoryRepository`/`CategoryResource` **nao filtram por `userId`** hoje — `listActive`/`findActiveById` operam globalmente entre todos os usuarios, mesmo a coluna `user_id` existindo na entidade/tabela. Na pratica categorias sao um catalogo global (seed do V2 tem `user_id = NULL`), embora o schema tenha sido desenhado para suportar categorias por usuario. Se uma tarefa pedir "categorias por usuario", isso e uma mudanca de comportamento, nao um bug a corrigir sem confirmar com o dono do produto.
- Soft delete apenas; nada impede desativar uma categoria ainda referenciada por transacoes (FK `ON DELETE SET NULL`, sem erro de referencia orfa).
- `GET /categories?type=INCOME|EXPENSE` (filtro por tipo) e consumido pelo frontend de Lancamentos para restringir o dropdown de categoria ao tipo do lancamento sendo criado/editado (ver [transactions.md](transactions.md)) — e so filtro de exibicao no frontend, o backend de Lancamentos nao valida que a categoria escolhida bate com o tipo.
