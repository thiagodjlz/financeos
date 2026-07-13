# Categorias

Fonte: `backend/src/main/java/br/com/financeos/categories/`.

## Campos

`userId(nullable), parentId(auto-FK, subcategorias), name, type(CategoryType), color, icon, active`.
`CategoryType`: `INCOME, EXPENSE`.

`active` e exposto na API desde a issue #20 (`CategoryRequest.active`, opcional — `null` vira `true` em `CategoryResource.apply()`) e na UI como campo "Situacao" (Ativo/Inativo); antes disso o campo so era manipulado internamente pelo soft delete.

## Regras

- Unique `(user_id, parent_id, name, type)`; `parent_id` com `ON DELETE SET NULL` (excluir categoria-pai orfaniza os filhos, nao cascateia exclusao). **A constraint do banco na pratica nao dispara** (Postgres trata NULLs como distintos e `user_id` e sempre NULL hoje), entao a unicidade real e garantida em Java: `CategoryResource.validateDuplicate` rejeita nome+tipo+pai repetidos (409 "Ja existe uma categoria com esse nome e tipo."), comparacao exata de nome (apos trim), excluindo a propria categoria no update.
- `parentId`, se informado (a UI atual nem expoe subcategorias), e validado em Java (`CategoryResource.validateParent`): precisa existir (400 "Categoria pai informada nao existe.") e nao pode ser a propria categoria (400 "Uma categoria nao pode ser pai dela mesma.").
- **Atencao, pegadinha do dominio**: diferente de Transacoes, `CategoryRepository`/`CategoryResource` **nao filtram por `userId`** hoje — `list`/`findActiveById` operam globalmente entre todos os usuarios, mesmo a coluna `user_id` existindo na entidade/tabela. Na pratica categorias sao um catalogo global (seed do V2 tem `user_id = NULL`), embora o schema tenha sido desenhado para suportar categorias por usuario. Se uma tarefa pedir "categorias por usuario", isso e uma mudanca de comportamento, nao um bug a corrigir sem confirmar com o dono do produto.
- Soft delete via `DELETE /categories/{id}` (seta `active=false`) ou diretamente pelo campo Situacao no formulario de edicao (`PUT /categories/{id}` com `active: false`) — mesmo efeito pratico; nada impede desativar uma categoria ainda referenciada por transacoes (FK `ON DELETE SET NULL`, sem erro de referencia orfa).
- **`PUT /categories/{id}` busca por `findByIdOptional` (sem filtro de `active`)**, diferente de `GET /categories/{id}` e `DELETE /categories/{id}` que usam `findActiveById` (404 se ja inativa) — e o que permite reativar uma categoria inativa escolhendo "Ativo" no campo Situacao; nao "consertar" isso para usar `findActiveById` sem confirmar que a reativacao deixaria de funcionar.
- `CategoryRepository.list(type)`: com `type` informado continua filtrando `active = true` (usado por `GET /categories?type=INCOME|EXPENSE`, o dropdown de Lancamentos); **sem `type`** (`GET /categories`, usado por `CategoryService.refresh()` para o catalogo completo no frontend) devolve **todas** as categorias, ativas e inativas — necessario para exibir corretamente o nome de categorias inativas ja usadas em lancamentos existentes (ver [transactions.md](transactions.md)).
- `GET /categories?type=INCOME|EXPENSE` (filtro por tipo) e consumido pelo frontend de Lancamentos para restringir o dropdown de categoria ao tipo do lancamento sendo criado/editado, e ja exclui categorias inativas (ver [transactions.md](transactions.md)). O backend de Lancamentos valida a mesma regra no POST/PUT (categoria existe, tipo compativel, ativa — com excecao da categoria inativa ja gravada no lancamento em edicao); detalhes em [transactions.md](transactions.md).

## Frontend (`frontend/src/app/features/categories/`)

- Tela dedicada de Categoria (issue #20), acessada via submenu "Categoria" dentro de "Cadastros" na sidebar — antes disso Categoria dividia uma unica tela (`features/registers/`, removida) com os formularios de Conta/Cartao (tambem removidos, ver `knowledge/architecture.md`). Segue o mesmo padrao de `features/users/`: formulario unico a esquerda (cria ou edita via `editingId`) e tabela "Ultimos registros" a direita com botao "Editar" por linha.
- Campo "Situacao" no formulario e um `<select>` com `[ngValue]="true"`/`[ngValue]="false"` (booleano nativo); pre-selecionado "Ativo" ao abrir o formulario vazio (criacao).
