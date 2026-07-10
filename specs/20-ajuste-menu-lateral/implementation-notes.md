# Notas de implementacao

Branch: `feature/issue-20-ajuste-menu-lateral`

## Arquivos alterados

- `backend/src/main/resources/db/migration/V9__remove_accounts_and_cards.sql` — nova migration: limpa `profile_permissions` de `ACCOUNTS`/`CARDS`, troca o `check` constraint (nome confirmado no banco local: `profile_permissions_screen_check`) e dropa `cards`/`accounts` (nessa ordem).
- `backend/src/main/java/br/com/financeos/profiles/Screen.java` — remove `ACCOUNTS`/`CARDS` do enum.
- `backend/src/main/java/br/com/financeos/accounts/`, `backend/src/main/java/br/com/financeos/cards/` — pacotes apagados por completo.
- `backend/src/test/java/br/com/financeos/accounts/AccountResourceTest.java`, `backend/src/test/java/br/com/financeos/cards/CardResourceTest.java` — apagados.
- `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java` — campo opcional `Boolean active`.
- `backend/src/main/java/br/com/financeos/categories/CategoryResource.java` — `apply()` grava `active` (default `true` se nao vier no request); `update()` passa a buscar por `findByIdOptional` (permite reativar categoria hoje inativa); `list()` chama o metodo renomeado do repository.
- `backend/src/main/java/br/com/financeos/categories/CategoryRepository.java` — `listActive(type)` renomeado para `list(type)`; ramo sem `type` deixa de filtrar `active = true` (catalogo completo), ramo com `type` continua filtrando so ativas.
- `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java` — testes novos: criar categoria com `active: false`, reativar via `PUT`, e confirmar que `GET /categories?type=` exclui inativa enquanto `GET /categories` (sem filtro) inclui.
- `frontend/src/app/core/models.ts` — remove `AccountType`, `Account`, `Card`; remove `'ACCOUNTS'`/`'CARDS'` do tipo `Screen`.
- `frontend/src/app/core/services/account.service.ts(.spec.ts)`, `card.service.ts(.spec.ts)` — apagados.
- `frontend/src/app/core/services/category.service.ts(.spec.ts)` — adiciona `update(id, payload)` (`PUT /categories/{id}`) com teste correspondente.
- `frontend/src/app/features/registers/` — pasta apagada por completo (Categoria, Conta e Cartao saem dessa tela).
- `frontend/src/app/features/categories/` — tela nova (`categories.ts/html/scss`), no padrao de `features/users/`: form unico a esquerda (criar/editar via `editingId`) com campo Situacao (`Ativo`/`Inativo`, pre-selecionado Ativo), tabela "Ultimos registros" a direita com botao "Editar" por linha.
- `frontend/src/app/app.routes.ts` — rota `registers` trocada por `categories`, protegida por `permissionGuard('CATEGORIES', 'VIEW')`.
- `frontend/src/app/features/profiles/profiles.ts` — remove `ACCOUNTS`/`CARDS` do array `SCREENS`.
- `frontend/src/app/layout/main-layout/main-layout.ts` — signals `collapsed`/`registersExpanded`, metodos `toggleCollapsed()`/`toggleRegisters()`/`isRegistersActive()`.
- `frontend/src/app/layout/main-layout/main-layout.html` — botao de colapsar junto ao `.brand-block`; textos de marca/nav/usuario/rodape ocultos com `*ngIf="!collapsed()"`; "Cadastros" vira botao (`toggleRegisters()`) com filho "Categoria" (`routerLink="/categories"`), condicao de exibicao passa a ser so `authService.can('CATEGORIES', 'VIEW')`.
- `frontend/src/app/layout/main-layout/main-layout.scss` — `.shell-collapsed`/`.sidebar.collapsed` (largura reduzida a 72px), `.collapse-toggle`, `.nav-group`/`.nav-children` para o submenu indentado.
- `frontend/src/app/features/transactions/transactions.ts` — signal `editPreselectedInactiveCategory`; `startEdit()` fixa a categoria inativa da transacao (se houver) via `updatePreselectedInactiveCategory()`; `onEditCategoryIdChange()` limpa o pin quando o usuario troca a selecao; `onEditTypeChange()` tambem limpa o pin.
- `frontend/src/app/features/transactions/transactions.html` — `<select name="editCategoryId">` ganha `(ngModelChange)="onEditCategoryIdChange()"` e uma `<option>` fixa (rotulo "(Inativo)") antes da lista filtrada, condicionada a `editPreselectedInactiveCategory()`.

## Decisoes

- Nome do `check` constraint de `profile_permissions.screen` confirmado via consulta direta no Postgres local (`profile_permissions_screen_check`) antes de escrever o `DROP CONSTRAINT` na V9, conforme risco apontado no plano.
- Campo "Situacao" na tela de Categoria implementado como `<select>` com `[ngValue]="true"`/`[ngValue]="false"` (booleano nativo, nao string), evitando conversao manual no submit.
- Botao "Sair" (logout) do rodape da sidebar nao foi listado nos criterios de aceite como algo a ocultar no estado recolhido; mantido visivel (com um icone no lugar do texto quando recolhido) para nao remover a unica forma de logout da tela quando a sidebar esta recolhida.

## Desvios em relacao ao plano

Nenhum desvio relevante. A sequencia e os arquivos executados seguiram `plan.md` (backend -> migration -> testes -> frontend). O passo 20 do plano (validacao manual no navegador) fica fora deste agente, a cargo de quem validar a feature depois.
