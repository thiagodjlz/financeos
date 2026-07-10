---
issue: 20
url: https://github.com/thiagodjlz/financeos/issues/20
title: "Ajuste do menu da lateral esquerda"
domains: [auth, categories, transactions, accounts, cards]
stage: pr-open
branch: feature/issue-20-ajuste-menu-lateral
created: 2026-07-08
---

# Ajuste do menu da lateral esquerda

## Historia

Como usuario do FinanceOS, quero um menu lateral mais enxuto e retratil, com Categoria organizada como submenu de Cadastros (com edicao e situacao Ativo/Inativo), e a remocao completa das funcionalidades de Conta e Cartao que nao uso, para que a navegacao fique mais clara e o sistema reflita somente as funcionalidades que realmente utilizo.

## Contexto

A issue pede quatro blocos de mudanca:

1. **Menu lateral**: adicionar um botao no topo da sidebar para recolher/expandir o menu; no estado recolhido, exibir so o "F" da marca (`main-layout.html` ja tem um bloco `mark` com "F" fixo no topo, ao lado do nome "FinanceOS"). Hoje a sidebar (`frontend/src/app/layout/main-layout/`) nao tem nenhum controle de colapso.
2. **Categoria como submenu de Cadastros**: hoje o item "Cadastros" da sidebar leva a uma unica tela (`/registers`, `registers.html`/`registers.ts`) que mistura formularios e listas de Categoria, Conta e Cartao lado a lado — a propria issue chama isso de confuso. A issue pede que Categoria vire um submenu dentro de Cadastros, com tela propria no layout de Lancamentos (formulario de cadastro/edicao a esquerda, "ultimos registros" a direita) — o mesmo padrao ja usado em `frontend/src/app/features/transactions/`.
3. **Edicao e Situacao (Ativo/Inativo) em Categoria**: `CategoryResource.update` (`PUT /categories/{id}`) ja existe no backend, protegido por `accessControl.require(Screen.CATEGORIES, Action.EDIT)` — a lacuna e so no frontend, que hoje (`registers.ts`) so tem `saveCategory()` (criacao), sem nenhum fluxo de edicao. Ja existe uma coluna `active` em `Category` (default `true`), mas ela e usada apenas internamente pelo soft delete (`DELETE /categories/{id}` seta `active=false`) — `CategoryRequest` nao expõe esse campo, entao hoje nao ha como criar/editar uma categoria escolhendo a situacao diretamente pela tela. A issue pede expor esse campo no formulario como "Situacao", com os registros atuais vindo por padrao como Ativo (ja e o default hoje).
4. **Categoria inativa em Lancamentos**: o dropdown de categoria do formulario de lancamento (`GET /categories?type=...`) precisa parar de listar categorias inativas ao incluir ou editar um lancamento — **exceto** quando a edicao e de um lancamento que ja usa uma categoria inativa: nesse caso a categoria inativa pode aparecer pre-selecionada e o save deve ser permitido se ela nao for trocada; se o usuario abrir o dropdown para trocar a categoria, a lista exibida nao deve incluir inativas. Ponto tecnico relevante encontrado no codigo: `CategoryRepository.listActive()` (usada por `GET /categories`, com ou sem filtro `type`) **sempre filtra `active = true`**, sem excecao — ou seja, hoje nao existe nenhuma forma de buscar uma categoria inativa via API. Isso afeta dois lugares que a issue pede que continuem funcionando com categorias inativas: a tabela "Ultimos lancamentos" do frontend (`transactions.ts`, metodo `categoryName(id)`) resolve o nome da categoria buscando em `categoryService.categories()` (carregado via `GET /categories`, sem filtro), entao hoje, assim que uma categoria virar inativa, o nome sumiria da lista (cairia no fallback "Sem categoria") — precisa de ajuste. Ja o painel "Detalhamento" e os totais da aba Resumo (`DashboardRepository.categoryBreakdown`, ver `knowledge/dashboard.md`) fazem `LEFT JOIN categories` direto via SQL cru, sem filtrar por `active`, entao ja funcionam corretamente com categorias inativas sem qualquer mudanca.
5. **Remocao completa de Conta e Cartao**: a issue pede para remover as funcionalidades de Conta e Cartao do sistema. Hoje isso abrange: pacotes de backend `accounts/` e `cards/` (entidades, resources, repositories), tabelas `accounts`/`cards` no banco (`V1__init.sql`), o enum `Screen` (`ACCOUNTS`, `CARDS`, presentes tambem no `check` constraint de `profile_permissions` na V5 e no seed da V6), o tipo `Screen` espelhado no frontend (`core/models.ts`), os formularios/listas de Conta e Cartao em `registers.html`/`registers.ts`, `AccountService`/`CardService` e as condicoes `authService.can('ACCOUNTS'|'CARDS', ...)` na sidebar. Ja confirmado em `knowledge/transactions.md`: os campos `accountId`/`cardId` **ja foram removidos de Lancamentos na V7** (colunas dropadas, campos tirados de entidade/DTOs) — ou seja, Lancamentos ja nao tem nenhum vinculo com Conta/Cartao hoje, entao a remocao pedida aqui nao afeta o dominio de Transacoes alem da limpeza de UI/rotas compartilhadas (tela de Cadastros).

## Criterios de aceite

### Menu lateral

- [ ] A sidebar exibe um botao no topo (proximo ao bloco de marca "F" / "FinanceOS") que alterna entre estado expandido e recolhido.
- [ ] No estado recolhido, a sidebar mostra apenas o "F" da marca no topo; os rotulos de texto dos itens de navegacao (Resumo, Lancamentos, Cadastros, Usuarios, Perfis), o nome "FinanceOS"/subtitulo, o nome do usuario logado e o rodape de versao ficam ocultos, mas os itens de navegacao continuam clicaveis e levam as mesmas rotas de hoje.
- [ ] No estado expandido, a sidebar volta a exibir todos os itens e textos como hoje, sem nenhuma mudanca de comportamento de navegacao.
- [ ] O botao de recolher/expandir funciona em qualquer tela da aplicacao (nao e especifico de uma rota).

### Categoria como submenu de Cadastros

- [ ] O item "Cadastros" da sidebar passa a ter um submenu/opcao "Categoria", visivel com a mesma condicao de permissao ja usada hoje para Categoria (`authService.can('CATEGORIES', 'VIEW')`).
- [ ] "Cadastros" continua sendo um item pai expansivel na sidebar (nao navega direto para nenhuma rota ao ser clicado): ao ser expandido, exibe "Categoria" como filho clicavel, que entao leva a tela dedicada. Essa estrutura de submenu se mantem mesmo com um unico item filho.
- [ ] Ao acessar o submenu "Categoria", o usuario chega a uma tela dedicada de Categoria, com o formulario de cadastro/edicao a esquerda e a lista de "ultimos registros" (categorias) a direita — mesmo padrao visual/estrutural ja usado em Lancamentos (`frontend/src/app/features/transactions/`).
- [ ] A tela de Categoria continua protegida pelas mesmas permissoes ja existentes (`Screen.CATEGORIES`, acoes `VIEW`/`CREATE`/`EDIT`/`DELETE`), sem introduzir nenhuma tela nova no enum `Screen`.

### Edicao e Situacao (Ativo/Inativo) em Categoria

- [ ] O formulario de cadastro/edicao de categoria (na nova tela de Categoria) tem um campo "Situacao" com as opcoes "Ativo" e "Inativo".
- [ ] Ao abrir o formulario para criar uma nova categoria, o campo "Situacao" vem pre-selecionado como "Ativo" por padrao.
- [ ] `POST /categories` e `PUT /categories/{id}` aceitam e persistem o valor de situacao enviado no corpo da requisicao (hoje `CategoryRequest` nao expoe esse campo; o backend ignora qualquer valor de `active` recebido).
- [ ] Todas as categorias ja existentes no banco continuam com situacao "Ativo" apos a mudanca (comportamento ja garantido pelo default atual de `Category.active = true`; este criterio confirma que nao ha regressao).
- [ ] Na nova tela de Categoria, e possivel editar uma categoria existente (nome, tipo, cor, icone, situacao) atraves de um fluxo de edicao (inline ou em formulario, espelhando o padrao ja usado em Lancamentos), persistindo via `PUT /categories/{id}`.
- [ ] Marcar uma categoria como "Inativo" pelo campo Situacao produz o mesmo efeito pratico que o soft delete ja existente (`DELETE /categories/{id}`, que seta `active=false`) — uma categoria inativa nao aparece mais nas listas de selecao ativas (ver criterios de Lancamentos abaixo).

### Categoria inativa em Lancamentos

- [ ] No formulario de novo lancamento, o dropdown de categoria (`GET /categories?type=...`) nao lista categorias com situacao Inativo.
- [ ] Ao abrir a edicao de um lancamento cuja categoria ja e Inativa, sem que o usuario altere a categoria, o formulario de edicao exibe a categoria inativa pre-selecionada e permite salvar normalmente (sem erro de validacao por categoria inativa).
- [ ] Se, durante essa mesma edicao, o usuario abrir o dropdown de categoria para trocar a selecao, a lista exibida nao inclui categorias inativas (inclusive a que estava selecionada antes da troca).
- [ ] A lista "Ultimos lancamentos" (tela de Lancamentos) continua exibindo o nome correto de categorias inativas usadas em lancamentos ja existentes, em vez de cair no fallback "Sem categoria".
- [ ] O painel "Detalhamento" e os 4 cards de metricas da aba Resumo continuam somando/exibindo corretamente lancamentos cuja categoria esta inativa (comportamento ja correto hoje via SQL cru do `DashboardRepository`; criterio serve para confirmar que nao regride).

### Remocao completa de Conta e Cartao

- [ ] Os formularios e listas de Conta e Cartao deixam de existir em qualquer tela do frontend (incluindo a tela/rota que hoje e `registers.html`/`registers.ts`).
- [ ] Os endpoints REST `/accounts` e `/cards` deixam de existir (pacotes de backend `accounts/` e `cards/` removidos, incluindo entidades, resources, repositories e DTOs).
- [ ] Uma nova migration Flyway remove (drop) as tabelas `accounts` e `cards` do banco de dados; os dados hoje cadastrados nelas sao perdidos definitivamente, sem impacto na integridade referencial de `transactions` (que ja nao referencia essas tabelas desde a V7).
- [ ] Os valores `ACCOUNTS` e `CARDS` sao removidos do enum `Screen` (backend `profiles/Screen.java` e do tipo espelho `Screen` em `frontend/src/app/core/models.ts`), incluindo do `check` constraint de `profile_permissions` (nova migration ajustando o constraint criado na V5).
- [ ] A tela de Perfis (matriz de permissoes) nao exibe mais linhas para Conta/Cartao, e `GET /auth/me` nao retorna mais entradas de permissao para essas telas; perfis que hoje tem permissoes configuradas para `ACCOUNTS`/`CARDS` simplesmente perdem essas linhas (perda de configuracao aceita).
- [ ] A sidebar nao referencia mais Conta/Cartao em nenhuma condicao de exibicao de menu.
- [ ] `AccountService`/`CardService` (frontend) e qualquer import/uso de `Account`/`Card`/`AccountType` deixam de existir no codigo do frontend.
- [ ] Apos a remocao, `./mvnw -q package -DskipTests` (backend) e `npm run build` (frontend) completam sem erros de compilacao/build.

## Decisoes

- **Remocao de Conta/Cartao no banco** (2026-07-08): as tabelas `accounts` e `cards` sao dropadas via nova migration Flyway, perdendo definitivamente os dados hoje cadastrados nelas. Como `transactions` ja nao referencia essas tabelas desde a V7, nao ha risco de integridade referencial.
- **Remocao de `ACCOUNTS`/`CARDS` do enum `Screen`** (2026-07-08): os valores saem do enum `Screen` no backend e do tipo espelho no frontend, e das permissoes de perfis (incluindo o `check` constraint de `profile_permissions`). A perda de configuracao de permissoes para essas duas telas em perfis existentes e aceita.
- **Layout do submenu "Categoria" em "Cadastros"** (2026-07-08): "Cadastros" continua como item pai expansivel na sidebar, que ao expandir mostra "Categoria" como filho clicavel — mantendo a estrutura de submenu pedida na issue mesmo com um unico item, em vez de navegar direto para a tela de Categoria ao clicar em "Cadastros".
- **Default do campo Situacao na criacao de categoria** (2026-07-08): o formulario de criacao de uma nova categoria vem com "Ativo" pre-selecionado por padrao, consistente com o default atual do banco (`Category.active = true`).

## Fora de escopo

- Persistir o estado recolhido/expandido do menu entre sessoes (localStorage) ou reintroduzi-lo automaticamente apos login — a issue nao especifica isso.
- Qualquer mudanca em subcategorias (`parentId`) ou no comportamento de categorias como catalogo global (`knowledge/categories.md`) alem da adicao do campo Situacao — categorias continuam nao-filtradas por `userId`.
- Alterar a logica ja existente de filtro por tipo de categoria em Lancamentos (issue #14, `GET /categories?type=`) — o filtro por Situacao se soma a esse filtro existente, sem substitui-lo.
- Reintroduzir qualquer vinculo entre Lancamentos e Conta/Cartao — esse vinculo ja foi removido intencionalmente na V7 (`accountId`/`cardId`), antes desta issue, e nao volta a existir.
- Migrar, exportar ou preservar em outro lugar os dados historicos hoje cadastrados em Conta/Cartao antes do drop das tabelas — a migration remove os dados definitivamente, sem qualquer backup ou exportacao automatica.
- Qualquer nova funcionalidade de conciliacao bancaria, saldo por conta ou fatura de cartao — essas funcionalidades nunca existiram no sistema (accounts.md ja registra que nao ha calculo de saldo corrente) e nao sao reintroduzidas por esta issue.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/20
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/auth-and-permissions.md`, `knowledge/categories.md`, `knowledge/transactions.md`, `knowledge/accounts.md`, `knowledge/cards.md`, `knowledge/dashboard.md`
- Codigo consultado: `frontend/src/app/layout/main-layout/main-layout.html`, `frontend/src/app/layout/main-layout/main-layout.ts`, `frontend/src/app/features/registers/registers.html`, `frontend/src/app/features/registers/registers.ts`, `frontend/src/app/features/transactions/transactions.ts`, `frontend/src/app/core/services/category.service.ts`, `frontend/src/app/core/models.ts`, `frontend/src/app/app.routes.ts`, `backend/src/main/java/br/com/financeos/categories/CategoryResource.java`, `backend/src/main/java/br/com/financeos/categories/CategoryRepository.java`, `backend/src/main/java/br/com/financeos/categories/CategoryRequest.java`, `backend/src/main/java/br/com/financeos/profiles/Screen.java`, `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java`, `backend/src/main/resources/db/migration/V1__init.sql`, `V5__create_profiles.sql`, `V6__seed_profiles_and_admin.sql`, `V7__remove_transactions_account_and_card_columns.sql`
