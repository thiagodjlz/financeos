---
issue: 28
url: https://github.com/thiagodjlz/financeos/issues/28
title: "Adicionar botão de cancelar"
domains: [categories, users, auth, transactions]
stage: validated
branch: feature/issue-28-botao-cancelar-cadastros
created: 2026-07-25
---

# Adicionar botão de cancelar

## Historia

Como usuario que preenche formularios de cadastro no FinanceOS, quero um botao "Cancelar" ao lado do botao "Salvar", para que eu possa descartar de uma vez o que digitei — voltando ao formulario vazio quando estou criando, ou aos valores originais do registro quando estou editando — sem precisar apagar campo por campo nem recarregar a pagina.

## Contexto

A issue pede, textualmente:

> Em todas as telas de cadastro do sistema adicione um botão de cancelar ao lado do botão salvar.
> Botão deve limpar as informações preenchidas no cadastro.

Situacao atual no codigo (`frontend/src/app/features/`):

- **Categorias** (`categories.html:39-40`), **Usuarios** (`users.html:68-69`) e **Perfis** (`profiles.html:37-38`) ja tem um botao "Cancelar" ao lado de "Salvar", mas ele esta condicionado a `*ngIf="editingId()"` — ou seja, **so aparece quando o formulario esta em modo de edicao**. Em modo de criacao (o caso mais comum) o usuario nao tem como limpar o formulario. O handler existente (`cancelEdit()`) faz `editingId.set(null)` + `resetForm()`.
- **Lancamentos** (`transactions.html:43`): o formulario "Novo lancamento" tem **apenas** o botao "Salvar" — nao existe nenhum botao de cancelar. Alem disso, hoje o proprio salvamento limpa so `description` e `amount` (`transactions.ts:100-101`), mantendo data, tipo, status e categoria.
- **Usuarios** e a unica tela com mensagens de validacao por campo vindas do backend (`fieldErrors`, issues #22/#24 — ver `knowledge/users.md`) e faixa de erro no topo; `cancelEdit()` hoje **nao** limpa essas mensagens, so os campos. Note tambem que `edit()` nunca carrega a senha do registro: o campo Senha entra em edicao sempre vazio.
- A edicao inline de Lancamentos (por linha da tabela) tem um fluxo proprio "Salvar"/"Sair" com modal de confirmacao quando ha alteracao pendente (`requestExit()`, ver `knowledge/transactions.md`) — fluxo diferente do que a issue pede e que nao se confunde com o formulario de criacao.
- Ainda em Lancamentos, a palavra "Cancelar" ja e usada na tabela (`transactions.html:87`) com outro significado: cancelar o lancamento (mudar o status para Cancelado — transacoes nunca sao excluidas, ver `knowledge/transactions.md`). O botao novo desta issue vive no formulario "Novo lancamento", nao na tabela, e nao altera nada dessa acao existente.
- O formulario de cada tela ja e renderizado sob permissao (`*ngIf="authService.can('CATEGORIES','CREATE') || ..."` etc., ver `knowledge/auth-and-permissions.md`), entao o botao novo herda esse gate naturalmente por estar dentro do `<form>`.

Definido com o usuario (ver "Decisoes"), o botao tem comportamento **dependente do estado do formulario**:

- **Modo de criacao** (nenhum registro em edicao): estagio unico. "Cancelar" limpa o formulario, devolvendo todos os campos ao estado inicial.
- **Modo de edicao** de um registro existente (Categorias, Usuarios, Perfis): **dois estagios**, decididos pela comparacao entre o formulario e o registro carregado.
  1. **Com alteracoes pendentes** (formulario diferente do registro carregado): o clique **restaura** os valores originais e **mantem o registro em edicao**.
  2. **Sem alteracoes pendentes** (formulario identico ao registro carregado — seja porque o usuario nao mexeu em nada, seja porque acabou de restaurar no clique anterior): o clique **sai do modo de edicao** e limpa o formulario, voltando ao modo de criacao (exatamente o `cancelEdit()` atual: `editingId.set(null)` + `resetForm()`).

Ou seja: o comportamento hoje existente (sair da edicao) nao desaparece, ele passa a ser o **segundo** estagio; o primeiro clique ganha o papel novo de desfazer as alteracoes. Isso preserva o unico caminho existente para voltar de "Editar X" ao formulario de criacao sem salvar.

A comparacao "tem alteracoes pendentes?" precisa considerar o estado do registro **como foi carregado no formulario**, o que importa em dois casos particulares:

- **Usuarios**: o campo Senha entra em edicao sempre vazio (`edit()` nunca carrega a senha). Logo, senha vazia = sem alteracao pendente; qualquer caractere digitado nela = alteracao pendente, e a restauracao devolve o campo ao estado vazio.
- **Perfis**: a comparacao inclui a matriz de permissoes inteira (VIEW/CREATE/EDIT/DELETE de cada tela), nao so o Nome — marcar ou desmarcar um unico checkbox ja conta como alteracao pendente.

Ponto importante para as etapas seguintes: **esta issue e exclusivamente de UI/UX e nao introduz nenhuma regra de negocio nova**. Nada e enviado ao servidor ao cancelar; nao ha campo novo, validacao nova nem endpoint novo. Por isso nao ha (e nao deve haver) criterio de aceite em termos de resposta HTTP de regra de negocio — a convencao do CLAUDE.md ("toda regra e imposta no back-end") continua valendo, so nao ha regra nova a impor aqui. O criterio de back-end relevante e o oposto: garantir que o botao **nao** dispare chamada nenhuma a API, inclusive na restauracao (os valores originais ja estao em memoria na lista carregada).

Abrangencia de "todas as telas de cadastro", confirmada com o usuario: os quatro formularios existentes hoje — Categorias, Usuarios, Perfis e "Novo lancamento". A tela de Login nao e cadastro e o Resumo/Dashboard nao tem formulario.

## Criterios de aceite

### Presenca do botao

- [x] Na tela **Categorias**, com o formulario em modo de criacao (nenhum registro sendo editado), aparece um botao "Cancelar" ao lado do botao "Salvar" (hoje ele so aparece em modo de edicao).
- [x] Na tela **Usuarios**, com o formulario em modo de criacao, aparece um botao "Cancelar" ao lado do botao "Salvar".
- [x] Na tela **Perfis**, com o formulario em modo de criacao, aparece um botao "Cancelar" ao lado do botao "Salvar".
- [x] Na tela **Lancamentos**, o formulario "Novo lancamento" passa a exibir um botao "Cancelar" ao lado do botao "Salvar" (hoje o formulario tem so "Salvar").
- [x] O rotulo do botao e "Cancelar" (portugues, convencao do projeto) nas quatro telas, e permanece "Cancelar" nos dois estagios do modo de edicao.
- [x] O botao "Cancelar" e declarado com `type="button"` nas quatro telas, de modo que o clique nao submeta o `<form>` (nao dispara `ngSubmit`/`save()`).
- [x] Um usuario sem permissao de criacao na tela (formulario nao renderizado) tambem nao ve o botao "Cancelar" — o botao vive dentro do `<form>` ja protegido por `authService.can(...)`, e nenhum gate de permissao existente e afrouxado.

### Modo de criacao: limpar o formulario

- [x] Em **Categorias**, preenchendo Nome/Cor/Icone e alterando Tipo e Situacao e clicando em "Cancelar", os campos voltam ao estado inicial de criacao: nome vazio, tipo "Despesa", cor `#2f7d62`, icone vazio, situacao "Ativo".
- [x] Em **Usuarios**, preenchendo Nome/E-mail/Senha/Perfil/Situacao e clicando em "Cancelar", os campos voltam ao estado inicial: nome, e-mail e senha vazios, perfil sem selecao, situacao "Ativo".
- [x] Em **Perfis**, preenchendo o Nome e marcando permissoes na matriz e clicando em "Cancelar", o nome fica vazio e **todos** os checkboxes de permissao (VIEW/CREATE/EDIT/DELETE de todas as telas) ficam desmarcados.
- [x] Em **Lancamentos**, preenchendo Data/Descricao/Valor/Tipo/Status/Categoria e clicando em "Cancelar", os campos voltam ao estado inicial: data = data de hoje, descricao vazia, valor 0, tipo "Despesa", status "Pendente", categoria "Sem categoria"; o dropdown de categoria volta a listar as categorias de Despesa (mesmo se o tipo estava em "Receita" antes do cancelamento).
- [x] Em **Usuarios**, apos uma tentativa de salvar que retornou erro de validacao do backend (mensagens vermelhas por campo e/ou faixa de erro no topo), clicar em "Cancelar" remove essas mensagens junto com a limpeza dos campos.

### Modo de edicao, 1o estagio: com alteracoes pendentes, restaurar os valores originais

- [x] Em **Categorias**, clicando em "Editar" numa categoria existente, alterando Nome/Tipo/Cor/Icone/Situacao e clicando em "Cancelar", cada um desses campos volta a exibir exatamente o valor que veio do registro ao entrar em edicao (o mesmo estado de logo apos o clique em "Editar"), sem nenhum salvamento.
- [x] Em **Usuarios**, clicando em "Editar" num usuario existente, alterando Nome/E-mail/Perfil/Situacao e clicando em "Cancelar", esses campos voltam aos valores do registro carregado e o campo Senha volta a ficar vazio (mesmo estado de logo apos o clique em "Editar", onde a senha nunca e carregada).
- [x] Em **Usuarios**, clicando em "Editar" num usuario existente e digitando **apenas** uma senha (sem tocar em nenhum outro campo), clicar em "Cancelar" limpa o campo Senha e mantem o formulario em edicao do mesmo usuario (titulo continua "Editar usuario") — digitar senha conta como alteracao pendente.
- [x] Em **Perfis**, clicando em "Editar" num perfil existente, alterando o Nome e marcando/desmarcando permissoes na matriz e clicando em "Cancelar", o nome volta ao valor do registro e **cada** checkbox da matriz volta ao estado do perfil carregado — permissoes marcadas a mais ficam desmarcadas e permissoes desmarcadas a mais voltam marcadas.
- [x] Em **Perfis**, clicando em "Editar" num perfil existente e marcando (ou desmarcando) **um unico** checkbox da matriz, sem alterar o Nome, clicar em "Cancelar" devolve esse checkbox ao estado do perfil carregado e mantem o formulario em edicao (titulo continua "Editar perfil") — a comparacao de alteracoes pendentes cobre a matriz de permissoes inteira, nao so o Nome.
- [x] Nas tres telas (Categorias, Usuarios, Perfis), apos esse primeiro clique em "Cancelar" o formulario **continua em edicao do mesmo registro**: o titulo do formulario continua "Editar categoria" / "Editar usuario" / "Editar perfil" (nao volta para "Nova categoria" / "Novo usuario" / "Novo perfil") e o formulario nao fica vazio.
- [x] Nas tres telas, clicando em "Cancelar" com alteracoes pendentes e em seguida em "Salvar" sem alterar mais nada, a requisicao enviada e um `PUT /api/{categories|users|profiles}/{id}` do **mesmo id** que estava em edicao (nao um `POST` de criacao), e o registro permanece com os valores originais.
- [x] Em **Usuarios**, com o formulario em modo de edicao com alteracoes pendentes e mensagens de validacao do backend na tela, clicar em "Cancelar" tambem remove essas mensagens (por campo e faixa do topo) ao restaurar os valores.

### Modo de edicao, 2o estagio: sem alteracoes pendentes, sair da edicao

- [x] Nas tres telas (Categorias, Usuarios, Perfis), clicando em "Editar" num registro e clicando em "Cancelar" **sem ter alterado nada**, o formulario sai da edicao ja nesse primeiro clique: o titulo volta para "Nova categoria" / "Novo usuario" / "Novo perfil" e os campos voltam ao estado inicial de criacao descrito nos criterios de "Modo de criacao".
- [x] Em **Categorias**, clicando em "Editar", alterando campos e clicando em "Cancelar" **duas vezes**: no 1o clique os valores originais voltam e o titulo continua "Editar categoria"; no 2o clique o formulario sai da edicao — titulo "Nova categoria", nome vazio, tipo "Despesa", cor `#2f7d62`, icone vazio, situacao "Ativo".
- [x] Em **Usuarios**, clicando em "Editar", alterando campos e clicando em "Cancelar" **duas vezes**: no 1o clique os valores do registro voltam (senha vazia) e o titulo continua "Editar usuario"; no 2o clique o formulario sai da edicao — titulo "Novo usuario", nome/e-mail/senha vazios, perfil sem selecao, situacao "Ativo".
- [x] Em **Perfis**, clicando em "Editar", alterando Nome e permissoes e clicando em "Cancelar" **duas vezes**: no 1o clique nome e matriz voltam ao estado do perfil carregado e o titulo continua "Editar perfil"; no 2o clique o formulario sai da edicao — titulo "Novo perfil", nome vazio e **todos** os checkboxes da matriz desmarcados.
- [x] Nas tres telas, apos o clique que sai da edicao, preencher o formulario e clicar em "Salvar" dispara um `POST /api/{categories|users|profiles}` (criacao) e **nao** um `PUT` do registro que estava em edicao.
- [x] Em **Usuarios**, apos o clique que sai da edicao, as mensagens de validacao do backend (por campo e faixa do topo) tambem ficam limpas.
- [x] Em **Lancamentos**, o botao continua sendo de estagio unico (limpar): o formulario "Novo lancamento" nao tem modo de edicao, entao nao existe estado "em edicao" a restaurar nem do qual sair.

### Efeitos colaterais proibidos

- [x] Clicar em "Cancelar" **nao dispara nenhuma requisicao HTTP ao backend** (nenhum POST/PUT/DELETE/GET), em nenhum dos estagios — nem em modo de criacao, nem na restauracao, nem na saida da edicao — verificavel pela aba Network do navegador ou por teste de componente com o cliente HTTP mockado.
- [x] Clicar em "Cancelar" nao cria nem altera registro: a tabela lateral ("Ultimos registros" / "Usuarios" / "Perfis" / "Ultimos lancamentos") permanece com o mesmo conteudo e a mesma contagem de antes do clique, nas quatro telas.
- [ ] Nenhum arquivo de `backend/` e alterado por esta issue (nem migration Flyway, nem DTO, nem `*Resource`), e `./mvnw test` continua passando sem alteracoes.

## Fora de escopo

- **Tela de Login** (`features/auth/login/`): nao e uma tela de cadastro, nao recebe botao "Cancelar".
- **Resumo/Dashboard**: nao possui formulario de cadastro.
- **Edicao inline de Lancamentos** (linha da tabela "Ultimos lancamentos"): mantem exatamente o fluxo atual "Salvar"/"Sair" com o modal de confirmacao "Deseja sair sem salvar?" (`knowledge/transactions.md`). Nao ha renomeacao de "Sair" para "Cancelar", nem botao adicional nessa linha, nem mudanca no comportamento de descarte dessa edicao. Como o formulario "Novo lancamento" nao tem modo de edicao (a edicao de lancamento e sempre inline), o botao novo dessa tela so tem o estagio de limpar.
- **Acao "Cancelar" da tabela de Lancamentos** (cancelar o lancamento, mudando o status para Cancelado): nao e alterada nem renomeada.
- **Modal de confirmacao antes de descartar** ("tem certeza?"): decidido que nao havera — cada clique age na hora, sem dialogo. Os dois estagios do modo de edicao nao sao um mecanismo de confirmacao: sao duas acoes distintas (restaurar e, depois, sair da edicao), ver "Decisoes".
- **Botao ou link separado "Novo" / "Sair da edicao"**: descartado — sair da edicao e o 2o estagio do proprio "Cancelar", nao um controle novo na tela.
- **Indicacao visual do estagio atual** (mudar o rotulo do botao, desabilita-lo quando nao ha alteracoes pendentes, tooltip explicativo): fora de escopo. O rotulo permanece "Cancelar" e o botao permanece sempre habilitado nos dois estagios.
- **Qualquer mudanca de backend, contrato de API ou banco**: a issue e de UI e nao cria regra de negocio nova a ser imposta no servidor.
- **Comportamento pos-salvamento dos formularios**: o que cada tela limpa (ou deixa preenchido) apos um "Salvar" bem-sucedido nao muda — em particular o formulario de Lancamentos, que hoje mantem data/tipo/status/categoria apos salvar, continua assim. Salvar em modo de edicao continua saindo da edicao e voltando ao formulario de criacao.
- Redesenho visual dos formularios, alteracao de estilos alem do necessario para posicionar o botao ao lado de "Salvar", e qualquer mudanca de navegacao (o botao age sobre o formulario, nao sai da tela).

## Decisoes

- **Abrangencia de "telas de cadastro"** (2026-07-25): o botao vale para as **quatro telas com formulario** — Categorias, Usuarios, Perfis e "Novo lancamento" —, mesmo Lancamentos e Perfis nao estando sob o menu "Cadastros" da sidebar. Confirma a interpretacao inicial da spec.
- **Confirmacao antes de descartar** (2026-07-25): **sem modal de confirmacao**. O clique age na hora, mesmo com campos preenchidos. Confirma a interpretacao inicial da spec.
- **Comportamento em modo de edicao** (2026-07-25): em vez de manter o `cancelEdit()` atual (`editingId.set(null)` + `resetForm()`) como unica acao, o botao passa a **restaurar os valores originais do registro em edicao** quando ha alteracoes pendentes, desfazendo as mudancas do formulario e **mantendo o registro em edicao**. Em modo de criacao, "Cancelar" continua sendo "limpar o formulario para o estado inicial". Esta decisao **muda o comportamento hoje existente** em Categorias, Usuarios e Perfis.
- **Como sair do modo de edicao sem salvar** (2026-07-25): **segundo clique sai**. Em modo de edicao, "Cancelar" e um botao de **dois estagios**: com alteracoes pendentes em relacao ao registro carregado, o clique restaura os valores e mantem a edicao ativa; com o formulario ja identico ao registro carregado (nao alterou nada, ou acabou de restaurar no clique anterior), o clique sai da edicao e limpa o formulario, voltando ao modo de criacao — o `cancelEdit()` atual. Ficam descartadas as alternativas de aceitar o usuario preso na edicao e de criar um botao/link separado "Novo"/"Sair da edicao". Em modo de criacao o botao continua de estagio unico. Consequencia para as etapas seguintes: cada uma das tres telas precisa guardar o **snapshot do registro como carregado no formulario** para fazer a comparacao — em Usuarios com o campo Senha vazio no snapshot, em Perfis com a matriz de permissoes inteira no snapshot.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/28
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/categories.md`, `knowledge/users.md`, `knowledge/auth-and-permissions.md`, `knowledge/transactions.md`
- Codigo inspecionado: `frontend/src/app/features/{categories,users,profiles,transactions}/`, `frontend/src/app/layout/main-layout/main-layout.html`
