---
issue: 14
url: https://github.com/thiagodjlz/financeos/issues/14
title: "Alterar lançamentos e categorias"
domains: [categories, transactions]
stage: pr-open
branch: feature/issue-14-tipo-categoria-lancamento
created: 2026-07-07
quality: failed
---

# Alterar lançamentos e categorias

## Historia

Como usuario que registra lancamentos financeiros, quero que o tipo da categoria (receita/despesa) seja usado para filtrar automaticamente as categorias disponiveis ao lancar uma receita ou despesa, e que o campo Status deixe de fazer sentido/aparecer quando o lancamento e uma receita, para que eu nao selecione categorias incompativeis com o tipo do lancamento nem preencha um campo que nao se aplica a receitas.

## Contexto

A issue pede 4 coisas:

1. Adicionar em categorias o campo "tipo do lancamento" (despesa/receita).
2. Migrar as categorias ja existentes: "Salario" vira receita, todas as demais viram despesa.
3. No lancamento, quando o tipo for receita: ocultar o campo Status, salvar Status como `null` no banco, e filtrar a lista de categorias exibida para mostrar somente categorias com tipo = receita.
4. No lancamento, quando o tipo for despesa: filtrar a lista de categorias exibida para mostrar somente categorias com tipo = despesa.

**Achado relevante ao ler `knowledge/categories.md` e o codigo antes de planejar**: os itens 1 e 2 ja estao implementados hoje na base de codigo atual, nao sao trabalho novo:

- `Category` (backend) ja tem o campo `type` (`CategoryType`: `INCOME`/`EXPENSE`), obrigatorio (`CategoryResource`, `CategoryRequest`).
- O endpoint `GET /categories` ja aceita `?type=INCOME|EXPENSE` e filtra no repositorio (`CategoryRepository.listActive(type)`), ou seja, o filtro por tipo ja existe no backend — falta so o frontend de Lancamentos usa-lo.
- A tela de Cadastros (`registers.html`/`registers.ts`) ja tem o seletor "Tipo" (Despesa/Receita) no formulario de categoria.
- O seed (`V2__seed_default_categories.sql`) ja marca `Salario` como `INCOME` e as demais como `EXPENSE` — com uma excecao (`Extras` tambem como `INCOME`), mas o usuario vai apagar as categorias `Extras` e `Investimentos` diretamente no banco (nao serao usadas), entao essa divergencia fica resolvida fora desta implementacao (ver "Fora de escopo").

O que ainda **nao** existe e e o trabalho real desta issue (itens 3 e 4):

- O formulario de novo lancamento (`transactions.html`/`transactions.ts`) sempre exibe o campo Status (Pendente/Pago) independente do tipo escolhido.
- Ao salvar um lancamento, o backend (`TransactionResource.apply`) sempre grava um status nao-nulo (`request.status()` ou, se vier nulo, o default `PENDING`) — nunca grava `null`.
- A coluna `status` da tabela `transactions` e hoje `NOT NULL` (`V1__init.sql`, `status varchar(20) not null default 'PENDING'`), entao permitir `null` para receitas exige alterar essa constraint via nova migration Flyway.
- O dropdown de categoria do formulario de lancamento (`transactions.html`) lista todas as categorias ativas, sem filtrar pelo tipo do lancamento selecionado.
- Regra de dominio existente relevante (`knowledge/categories.md`): categorias sao hoje um catalogo global (nao filtrado por `userId`), entao o filtro por tipo se soma a esse comportamento global existente, sem altera-lo.
- Regra de dominio existente relevante (`knowledge/transactions.md`): `DELETE /transactions/{id}` e um cancelamento (`status = CANCELED`), nao uma exclusao real. Decisao: `status = null` vale somente na criacao/atualizacao (`POST`/`PUT`) de lancamentos de receita; o fluxo de cancelamento (`DELETE`) continua gravando `status = CANCELED` normalmente, mesmo para receitas — nao ha mudanca no cancelamento.

## Criterios de aceite

- [ ] Toda categoria possui um campo `tipo` com valor `RECEITA` (`INCOME`) ou `DESPESA` (`EXPENSE`), obrigatorio no cadastro — comportamento ja existente, este criterio serve para confirmar que nao regrediu.
- [ ] A tela de Cadastros continua permitindo escolher o tipo (Despesa/Receita) ao criar uma categoria — comportamento ja existente, confirmar que nao regrediu.
- [ ] A categoria "Salario" esta marcada com tipo = Receita no banco.
- [ ] Todas as categorias do catalogo padrao exceto "Salario" estao marcadas com tipo = Despesa no banco (categorias "Extras" e "Investimentos" ficam fora desta verificacao — serao removidas manualmente pelo usuario, ver "Fora de escopo").
- [ ] No formulario de novo lancamento, ao selecionar tipo = Receita, o campo Status fica oculto (nao aparece no formulario).
- [ ] No formulario de novo lancamento, ao selecionar tipo = Despesa, o campo Status permanece visivel, com o comportamento atual (Pendente/Pago).
- [ ] Ao salvar (`POST /transactions`) um lancamento com `type = INCOME`, o registro persistido no banco tem `status = null`, independente do que veio no corpo da requisicao.
- [ ] Ao atualizar (`PUT /transactions/{id}`) um lancamento para `type = INCOME`, o `status` persistido passa a ser `null`.
- [ ] Ao salvar/atualizar um lancamento com `type = EXPENSE`, o comportamento atual e mantido: `status` recebido e persistido, e se vier nulo assume `PENDING` como default.
- [ ] Cancelar (`DELETE /transactions/{id}`) um lancamento de receita continua gravando `status = CANCELED`, sem alteracao no fluxo de cancelamento existente.
- [ ] No formulario de novo lancamento, quando o tipo selecionado e Receita, o dropdown de categoria exibe somente categorias com tipo = Receita (usa `GET /categories?type=INCOME`).
- [ ] No formulario de novo lancamento, quando o tipo selecionado e Despesa, o dropdown de categoria exibe somente categorias com tipo = Despesa (usa `GET /categories?type=EXPENSE`).
- [ ] Ao trocar o tipo do lancamento no formulario (de Despesa para Receita ou vice-versa) depois de uma categoria ja estar selecionada, se a categoria selecionada nao pertencer ao novo tipo, a selecao e limpa (nao fica uma categoria de tipo incompativel selecionada silenciosamente).
- [ ] A tabela `transactions` no banco permite `status IS NULL` (constraint de coluna/CHECK ajustada via nova migration Flyway), sem quebrar os lancamentos de despesa existentes (que continuam com status nao-nulo).

## Fora de escopo

- Validacao no backend de que o `categoryId` enviado pertence ao mesmo tipo (`INCOME`/`EXPENSE`) do lancamento — a issue pede apenas "filtro na exibicao", nao bloqueio server-side. `knowledge/transactions.md` ja registra que hoje nao ha validacao de posse/consistencia de `categoryId`/`accountId`/`cardId`; esta issue nao muda isso.
- Qualquer mudanca em como categorias sao filtradas por usuario (`knowledge/categories.md` confirma que categorias sao hoje um catalogo global, nao por usuario) — o filtro pedido aqui e por tipo, nao por dono da categoria.
- Tela/fluxo de edicao de lancamento no frontend — hoje `transactions.ts`/`transaction.service.ts` so implementam criacao e cancelamento (nao ha UI de edicao chamando `PUT /transactions/{id}`); os criterios sobre `PUT` cobrem o comportamento da API, nao uma tela nova.
- Alterar o significado ou fluxo de cancelamento de lancamentos (`DELETE /transactions/{id}` continua marcando `status = CANCELED`, inclusive para receitas).
- Remover/ajustar as categorias "Extras" e "Investimentos" no banco — o usuario vai apagar essas duas categorias manualmente, fora desta esteira; nenhuma migration ou codigo desta issue precisa trata-las.

## Pontos em aberto

Nenhum. Decisoes tomadas com o usuario:

- **Categoria "Extras"**: nao ajustada por esta issue — o usuario vai apagar "Extras" e "Investimentos" do banco manualmente.
- **Status e cancelamento**: `status = null` vale so para criacao/atualizacao (`POST`/`PUT`) de receitas; o cancelamento (`DELETE`) continua gravando `status = CANCELED` mesmo para receitas, sem excecao.
- **Escopo de edicao**: apesar de nao existir UI de edicao hoje, o desenho (frontend e backend) deve ja contemplar o comportamento correto para uma futura tela de edicao — por isso os criterios de aceite cobrem tanto `POST` quanto `PUT`.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/14
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/categories.md`, `knowledge/transactions.md`
