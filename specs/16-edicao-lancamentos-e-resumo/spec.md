---
issue: 16
url: https://github.com/thiagodjlz/financeos/issues/16
title: "Alterar aba Lançamentos - Botão de edição"
domains: [transactions, dashboard]
stage: pr-open
created: 2026-07-08
branch: feature/issue-16-edicao-lancamentos-resumo
---

# Alterar aba Lançamentos - Botão de edição

## Historia

Como usuario que registra e acompanha seus lancamentos financeiros, quero poder editar um lancamento ja salvo diretamente na lista (sem precisar excluir e recriar) e ver o resumo financeiro sempre atualizado e com nomenclaturas em portugues, para que eu consiga corrigir dados rapidamente e confiar que o saldo exibido reflete apenas o que de fato ja foi pago.

## Contexto

A issue #16 pede mudancas em duas telas: **Lancamentos** (`frontend/src/app/features/transactions`) e **Resumo** (`frontend/src/app/features/dashboard`, rota `/dashboard`).

### Lancamentos — edicao inline

Hoje (`transactions.html`/`transactions.ts`) cada linha da tabela "Ultimos lancamentos" so tem um botao **Cancelar**, que chama `DELETE /transactions/{id}` (cancelamento, `status = CANCELED`, sem hard delete — ver `knowledge/transactions.md`). Nao existe UI de edicao: o backend ja expoe `PUT /transactions/{id}` (`TransactionResource.update`, protegido por `accessControl.require(Screen.TRANSACTIONS, Action.EDIT)`), mas o frontend (`TransactionService`) nao tem metodo de update e nada na tela chama esse endpoint. A spec da issue #14 ja registrou isso explicitamente como fora de escopo daquela entrega ("o desenho deve ja contemplar o comportamento correto para uma futura tela de edicao").

A issue pede: botao **Editar** a esquerda do **Cancelar** em cada linha ja salva; ao clicar, a linha entra em modo de edicao permitindo alterar qualquer campo do lancamento (mesmos campos do formulario de criacao: Data, Descricao, Valor, Tipo, Status — oculto quando Tipo = Receita, ver `knowledge/transactions.md` e regra ja implementada na issue #14 — e Categoria, filtrada pelo Tipo selecionado via `GET /categories?type=`). Em modo de edicao, os botoes **Editar** e **Cancelar** dessa linha somem, dando lugar a dois botoes novos: **Salvar** (persiste via `PUT /transactions/{id}`) e **Sair** (com confirmacao "Deseja sair sem salvar?" caso haja alteracao nao salva). Decisao tomada com o usuario: apenas uma linha pode estar em modo de edicao por vez.

Tambem pede traduzir nomenclaturas em ingles visiveis ao usuario — hoje `transactions.html` renderiza `{{ transaction.status }}` cru na tabela (`PENDING`, `PAID`, e potencialmente `CANCELED` para lancamentos cancelados, que continuam aparecendo na lista pois `GET /transactions` nao filtra status por padrao).

### Resumo — pendente some de todo lugar (exceto o card Pendente), ordem dos cards, categorias agrupadas, reload automatico

Hoje (`DashboardRepository.totals`): `balance = totalIncome - totalExpense`, e tanto `totalExpense` quanto o `categoryBreakdown` de despesas somam **PAID + PENDING** (excluem so `CANCELED`); `monthlyEvolution` (painel "Evolucao anual") tambem soma despesas PAID + PENDING por mes. Decisao tomada com o usuario: despesas com status `PENDING` somem de **todo lugar do Resumo, exceto do proprio card "Pendente"** — ou seja, `balance`, `totalExpense`, `categoryBreakdown` (despesas) e `monthlyEvolution` passam a considerar somente despesas `PAID` (alem de continuar excluindo `CANCELED`, como ja ocorre hoje). O card "Pendente" (`pendingExpense`) continua sendo o unico lugar onde despesas pendentes aparecem.

Os 4 cards de metricas hoje aparecem na ordem Receitas, Despesas, **Saldo**, **Pendente**; a issue pede trocar a ordem de Saldo e Pendente (Saldo mais a direita, Pendente mais a esquerda).

O card "Categorias" hoje lista todas as linhas de `categoryBreakdown` (receita e despesa misturadas) numa unica lista, so com um rotulo "Receita"/"Despesa" por linha. A issue pede agrupar visualmente em duas secoes empilhadas: "Receitas > Categorias" em cima e "Despesas > Categorias" embaixo (decisao tomada com o usuario — nao lado a lado, nao em abas).

Por fim, o botao "Atualizar" hoje e o unico jeito de recarregar o resumo apos trocar Ano/Mes (`load()` so roda no clique ou no `ngOnInit`); a issue pede remove-lo e recarregar automaticamente ao mudar Ano ou Mes.

## Criterios de aceite

### Lancamentos — edicao inline

- [ ] Cada linha da tabela de lancamentos ja salvos exibe um botao "Editar" posicionado a esquerda do botao "Cancelar", visivel apenas para usuarios com permissao `TRANSACTIONS`/`EDIT` (`authService.can('TRANSACTIONS', 'EDIT')`, espelhando o padrao ja usado para o botao Cancelar com `DELETE`).
- [ ] Ao clicar em "Editar", a linha correspondente entra em modo de edicao, exibindo campos editaveis para Data, Descricao, Valor, Tipo, Status (oculto quando Tipo = Receita, replicando a regra ja existente no formulario de criacao) e Categoria (dropdown filtrado pelo Tipo selecionado via `GET /categories?type=`), pre-preenchidos com os valores atuais do lancamento.
- [ ] Ao entrar em modo de edicao, os botoes "Editar" e "Cancelar" dessa linha ficam ocultos, dando lugar a dois botoes novos: "Salvar" e "Sair".
- [ ] Apenas uma linha pode estar em modo de edicao por vez: enquanto qualquer linha estiver em edicao, o botao "Editar" das demais linhas fica desabilitado (nao e possivel iniciar edicao em outra linha ate sair do modo de edicao da linha atual, seja salvando ou saindo).
- [ ] Ao trocar o Tipo do lancamento em edicao (Despesa <-> Receita), a lista de categorias exibida e refiltrada pelo novo tipo e, se a categoria selecionada nao pertencer ao novo tipo, a selecao e limpa — mesmo comportamento ja existente no formulario de criacao (issue #14).
- [ ] Clicar em "Salvar" chama `PUT /transactions/{id}` com os valores editados, persiste as alteracoes, sai do modo de edicao (volta a exibir "Editar"/"Cancelar") e atualiza a linha na tabela com os novos valores.
- [ ] Clicar em "Sair" sem nenhuma alteracao pendente (nenhum campo diferente do valor original) sai do modo de edicao imediatamente, sem exibir confirmacao.
- [ ] Clicar em "Sair" havendo pelo menos um campo alterado exibe uma confirmacao em pop-up (modal sobreposto a pagina, nao um bloco dentro da linha da tabela) com o texto "Deseja sair sem salvar?" e as opcoes "Sim" e "Nao".
- [ ] Confirmar "Sim" na mensagem de saida descarta as alteracoes feitas na linha, refaz uma chamada `GET /transactions` para recarregar a lista de lancamentos a partir do servidor (em vez de so restaurar um snapshot local em memoria) e sai do modo de edicao.
- [ ] Confirmar "Nao" na mensagem de saida mantem a linha em modo de edicao, preservando os valores ja alterados pelo usuario.
- [ ] Apos um "Salvar" bem-sucedido, ao navegar para a aba Resumo (rota `/dashboard`), os totais exibidos (Receitas, Despesas, Saldo, Pendente, Evolucao anual, Categorias) refletem os valores do lancamento editado, sem necessidade de recarregar a pagina no navegador.
- [ ] Na tabela de lancamentos (fora e dentro do modo de edicao) e em qualquer dropdown de Status, os valores de status sao exibidos em portugues: "Pendente" para `PENDING`, "Pago" para `PAID`, "Cancelado" para `CANCELED` — nenhum valor cru do enum em ingles (`PENDING`/`PAID`/`CANCELED`) aparece na interface.
- [ ] Um lancamento com status `CANCELED` tambem pode entrar em modo de edicao (botao "Editar" habilitado normalmente, sem tratamento especial); o dropdown de Status na edicao continua oferecendo somente "Pendente"/"Pago" (mesmo comportamento do formulario de criacao); ao clicar "Salvar", o lancamento passa a ter o status escolhido, reativando-o (saindo do estado Cancelado) — decisao tomada com o usuario.

### Resumo — pendente some de todo lugar, exceto o card "Pendente"

- [ ] `GET /dashboard/summary` passa a calcular `balance` como `totalIncome - paidExpense` (em vez de `totalIncome - totalExpense`), ou seja, despesas com status `PENDING` deixam de reduzir o saldo final exibido no card "Saldo".
- [ ] O card "Despesas" (`totalExpense`) passa a somar somente despesas com status `PAID` (excluindo tambem `PENDING`, alem de `CANCELED` como ja ocorre hoje) — deixa de incluir despesas pendentes no total exibido.
- [ ] O card "Categorias" (`categoryBreakdown`) passa a somar, para categorias de despesa, somente lancamentos com status `PAID` (excluindo tambem `PENDING`) — categorias de receita nao sao afetadas, ja que receita nao tem status pendente (status `null`, ver `knowledge/transactions.md`/issue #14).
- [ ] O painel "Evolucao anual" (`monthlyEvolution`) deixa de somar despesas com status `PENDING` no valor de despesa de cada mes — cada mes passa a somar apenas despesas `PAID` (excluindo tambem `CANCELED`, como ja ocorre hoje), e o `balance` mensal exibido reflete esse novo calculo de despesa.
- [ ] Uma despesa com status `PENDING` no periodo/ano consultado nao aumenta o valor de despesa nem reduz o saldo em nenhum lugar do Resumo (card "Despesas", card "Saldo", card "Categorias", evolucao anual) — o unico lugar onde ela continua contabilizada e o card "Pendente" (`pendingExpense`).

### Resumo — ordem dos cards

- [ ] Os 4 cards de metricas do topo do Resumo aparecem na ordem: Receitas, Despesas, Pendente, Saldo (troca de posicao entre os cards Saldo e Pendente em relacao a ordem atual, Saldo passa a ser o ultimo/mais a direita e Pendente o penultimo/mais a esquerda dos dois).

### Resumo — categorias agrupadas por tipo (painel "Detalhamento")

- [ ] O card antes chamado "Categorias" passa a se chamar "Detalhamento" e exibe duas secoes distintas, empilhadas verticalmente (nao lado a lado, nao em abas): uma para receitas e outra para despesas (somente linhas de `categoryBreakdown` com `type = INCOME`/`type = EXPENSE`, respectivamente, ja considerando a exclusao de `PENDING` descrita acima), em vez da lista unica atual misturando os dois tipos.
- [ ] Cada secao tem um cabecalho estilo "titulo" com fundo colorido: a secao de receitas com "Receitas" em verde (mesma cor de destaque usada no card "Receitas"/borda `.income`) e a secao de despesas com "Despesas" em vermelho (mesma cor do card "Despesas"/borda `.expense`); cada cabecalho exibe, alinhado a direita, o total daquele tipo no periodo (`totalIncome` na secao de receitas, `totalExpense` na secao de despesas).
- [ ] Cada secao mantem, para cada categoria, nome e valor total no periodo, como ja exibido hoje (`categoryName`, `totalAmount`); uma secao sem nenhuma categoria daquele tipo no periodo exibe um estado vazio proprio (ex.: "Sem dados no periodo") em vez de esconder a secao inteira.
- [ ] O total que antes aparecia no topo do painel (contagem de `categoryBreakdown`) passa a aparecer no rodape do painel, com o rotulo "Total" alinhado a esquerda.

### Resumo — reload automatico, sem botao Atualizar

- [ ] O botao "Atualizar" e removido da tela de Resumo.
- [ ] Ao alterar o campo Ano, o resumo e recarregado automaticamente (nova chamada a `GET /dashboard/summary` com o novo ano), sem necessidade de clique adicional.
- [ ] Ao alterar o campo Mes, o resumo e recarregado automaticamente (nova chamada a `GET /dashboard/summary` com o novo mes), sem necessidade de clique adicional.

## Fora de escopo

- Validacao no backend de que o `categoryId` enviado no `PUT /transactions/{id}` pertence ao mesmo tipo (`INCOME`/`EXPENSE`) do lancamento — `knowledge/transactions.md` ja registra que hoje nao ha essa validacao cruzada no `POST`; esta issue nao adiciona validacao server-side nova, so consome o `PUT` ja existente do jeito que ele funciona hoje.
- Alterar o significado ou fluxo de cancelamento de lancamentos (`DELETE /transactions/{id}` continua marcando `status = CANCELED`, sem mudanca).
- Qualquer mudanca em como categorias sao filtradas por usuario ou em CRUD de categorias (`knowledge/categories.md` — catalogo global, sem alteracao aqui).
- Edicao em lote (mais de uma linha em modo de edicao simultaneamente) — decisao tomada: apenas uma linha por vez, ver criterios de aceite acima.
- Traducoes de textos fora das telas Lancamentos e Resumo (ex.: Cadastros, Usuarios, Perfis) — fora do escopo desta issue.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/16
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/transactions.md`, `knowledge/dashboard.md`, `knowledge/categories.md`, `knowledge/auth-and-permissions.md`
- Codigo consultado para confirmar comportamento atual: `frontend/src/app/features/transactions/{transactions.html,transactions.ts}`, `frontend/src/app/features/dashboard/{dashboard.html,dashboard.ts}`, `frontend/src/app/core/services/transaction.service.ts`, `backend/src/main/java/br/com/financeos/transactions/TransactionResource.java`, `backend/src/main/java/br/com/financeos/dashboard/{DashboardRepository.java,DashboardResource.java,DashboardSummaryResponse.java}`, `specs/14-tipo-categoria-lancamento/spec.md`
