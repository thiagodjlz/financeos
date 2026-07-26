---
issue: 31
url: https://github.com/thiagodjlz/financeos/issues/31
title: "Alterar função do editar e ajuste de layout"
domains: [transactions, categories, users]
stage: validated
branch: feature/issue-31-edicao-inline-cadastros
created: 2026-07-25
---

# Alterar função do editar e ajuste de layout

## Historia

Como usuario do FinanceOS, quero editar qualquer registro diretamente na linha da tabela (como ja faco em Lancamentos), com as colunas mantendo a largura e os botoes padronizados, para que a edicao seja rapida, consistente entre as telas e sem "pulos" de layout que cortem informacoes.

## Contexto

A issue pede tres coisas: "Alterar a função de todos editar, deixando igual ao Lançamentos, onde a edição ocorre na linha do registro. Ajustar o layout da linha, quando clicado no editar as colunas da linha devem manter o mesmo tamnho (que não corte as infomrações). Botões também devem seguir o padrão e ficarem do mesmo tamanho."

Por decisao do usuario (ver "Decisoes"), a mudanca cobre **Categorias e Usuarios** (alem do ajuste de layout comum e da conferencia de Lancamentos); **Perfis fica fora do escopo** e mantem a edicao via formulario lateral como hoje.

### Como a edicao funciona hoje em cada tela

- **Lancamentos** (`frontend/src/app/features/transactions/`) — ja e o padrao-alvo: botao "Editar" por linha da tabela "Ultimos lancamentos"; ao clicar, a linha vira modo de edicao (inputs/selects nas celulas), so uma linha por vez (botao "Editar" das demais fica desabilitado), os botoes da linha viram "Salvar"/"Sair", "Sair" com alteracao pendente (comparacao com snapshot via `JSON.stringify`) abre o modal "Deseja sair sem salvar?", e "Salvar" chama `PUT /api/transactions/{id}` e recarrega a lista. O formulario lateral e so de criacao ("Novo lancamento"), com "Cancelar" de estagio unico (issue #28).
- **Categorias** (`features/categories/`): botao "Editar" na tabela "Ultimos registros" carrega o registro no **formulario lateral** (titulo muda para "Editar categoria"); campos nome, tipo, cor, icone, situacao. Colunas da tabela: Nome, Tipo, Situacao.
- **Usuarios** (`features/users/`): mesmo padrao de formulario lateral ("Editar usuario"); campos nome, e-mail, senha (opcional em edicao), perfil, ativo. As mensagens de validacao do backend aparecem por campo, abaixo de cada input (issues #22/#24/#26). Colunas da tabela: Nome, E-mail, Perfil, Status. A linha tambem tem botao "Desativar".
- **Perfis** (`features/profiles/`): botao "Editar" numa lista compacta (so nome + botoes Editar/Excluir) carrega o registro no formulario lateral, que contem o nome **e a matriz de permissoes inteira** (5 telas x 4 acoes em checkboxes) — fora do escopo desta issue (ver "Decisoes").

### Problemas de layout hoje

- A tabela usa layout automatico (`table` sem `table-layout: fixed`, celulas `white-space: nowrap`): em Lancamentos, quando uma linha entra em modo de edicao, os inputs/selects mudam as larguras das colunas da tabela inteira, deslocando/cortando o conteudo das demais linhas — e o que a issue chama de "as colunas da linha devem manter o mesmo tamanho (que nao corte as informacoes)".
- Os botoes de acao de linha alternam de rotulo ("Editar"/"Cancelar" -> "Salvar"/"Sair") e, como a largura vem do texto (`padding: 0 10px`), mudam de tamanho entre si e entre os modos, deslocando a coluna de acoes. A issue pede que "sigam o padrao e fiquem do mesmo tamanho".

### Regras existentes que se aplicam (knowledge/)

- Esta issue **nao cria regra de negocio nova**: os endpoints `PUT /api/categories/{id}` e `PUT /api/users/{id}` ja existem com todas as validacoes no backend (nome duplicado 409 em categorias; Bean Validation com mensagens em portugues e e-mail duplicado 409 em usuarios). A edicao inline deve consumir esses mesmos endpoints — nenhuma validacao pode passar a existir so no front.
- Padrao do botao "Cancelar" (issue #28, `knowledge/architecture.md`): nas telas que perderem o modo de edicao do formulario lateral, o "Cancelar" do formulario deixa de ter dois estagios e vira estagio unico (repoe o estado inicial, sem HTTP), como ja e em Lancamentos.
- Em Usuarios, `edit()` nunca carrega a senha (branco = mantem a atual) e um usuario nao pode desativar a si mesmo (409 no backend).
- Em Lancamentos, particularidades da edicao inline ja existentes (categoria inativa "pinada" com sufixo "(Inativo)", status oculto para receitas) devem ser preservadas.

## Criterios de aceite

### Categorias — edicao inline

- [x] 1. Na tabela "Ultimos registros", clicar em "Editar" (visivel so com permissao `CATEGORIES/EDIT`) transforma a propria linha em modo de edicao, com controles editaveis nas celulas correspondentes (Nome como input de texto, Tipo e Situacao como selects com rotulos em portugues) e **controles compactos na linha para Cor (seletor de cor) e Icone** (que nao tem coluna propria — ver "Decisoes"); o registro **nao** e mais carregado no formulario lateral.
- [x] 2. O formulario lateral de Categorias passa a ser somente de criacao: titulo fixo "Nova categoria", nunca alterna para "Editar categoria", e o botao "Cancelar" dele age em estagio unico (repoe o estado inicial do formulario, sem nenhuma requisicao HTTP).
- [x] 3. Em modo de edicao, os botoes da linha viram "Salvar" e "Sair". "Salvar" envia `PUT /api/categories/{id}` com os valores editados (incluindo cor e icone), recarrega a lista e devolve a linha ao modo leitura com os novos valores.
- [x] 4. Apenas uma linha por vez entra em edicao: com uma linha em edicao, o botao "Editar" das demais linhas fica desabilitado (`disabled`).
- [x] 5. "Sair" com alteracao pendente (qualquer campo diferente do snapshot capturado ao entrar em edicao, incluindo cor e icone) abre o modal "Deseja sair sem salvar?"; "Sim" descarta e recarrega da API, "Nao" mantem a linha em edicao. "Sair" sem alteracao pendente sai direto, sem modal e sem requisicao HTTP.
- [x] 6. Salvar a edicao inline com nome+tipo ja existentes em outra categoria recebe o 409 do backend ("Ja existe uma categoria com esse nome e tipo.") e a mensagem e exibida em portugues na tela, com a linha permanecendo em modo de edicao.

### Usuarios — edicao inline

- [x] 7. Na tabela de Usuarios, clicar em "Editar" (visivel so com permissao `USERS/EDIT`) transforma a propria linha em modo de edicao (Nome e E-mail como inputs, Perfil como select carregado com os perfis existentes, Status como controle Ativo/Inativo, e **um campo compacto de Senha na linha, opcional, que entra sempre vazio** — vazio = mantem a senha atual, preenchido = redefine); o registro nao e mais carregado no formulario lateral.
- [x] 8. O formulario lateral de Usuarios passa a ser somente de criacao: titulo fixo "Novo usuario", campo Senha obrigatorio (comportamento de criacao atual), e "Cancelar" em estagio unico (limpando tambem as mensagens de validacao por campo e a faixa de erro do topo, sem HTTP).
- [x] 9. Os mesmos comportamentos dos criterios 3, 4 e 5 valem para Usuarios, com "Salvar" enviando `PUT /api/users/{id}` (senha em branco = mantem a atual; o campo de senha vazio nao conta como alteracao pendente para o "Sair").
- [x] 10. Erros de validacao do backend ao salvar a edicao inline (400 com `violations[]`, ex.: nome em branco -> "O nome e obrigatorio."; 409 de e-mail duplicado -> "E-mail ja cadastrado.") sao exibidos em portugues **em dois lugares**: na faixa de erro do topo (padrao de Lancamentos) **e** como mensagem junto a cada campo da linha (para os erros de `violations[]` mapeaveis a um campo), com a linha permanecendo em modo de edicao. Nenhuma validacao nova e criada apenas no front-end.
- [x] 11. O botao "Desativar" continua presente na linha em modo leitura (visivel so com `USERS/DELETE` e usuario ativo) e some/da lugar a "Salvar"/"Sair" quando a linha esta em edicao, como em Lancamentos.

### Lancamentos e layout comum das tabelas

- [x] 12. Em todas as tabelas com edicao inline (Lancamentos, Categorias, Usuarios), entrar em modo de edicao **nao altera a largura de nenhuma coluna**: a largura renderizada de cada `th`/coluna e a mesma (em px, medida via DevTools ou teste de layout) antes e durante a edicao de uma linha.
- [x] 13. Com uma linha em edicao, o conteudo das demais linhas (modo leitura) continua integralmente visivel — nenhum texto passa a ser cortado/truncado por causa da linha em edicao; os controles de edicao cabem na largura das celulas sem estourar a tabela.
- [x] 14. Todos os botoes de acao de linha ("Editar", "Cancelar", "Desativar", "Salvar", "Sair") seguem o mesmo padrao visual (`primary-button`/`ghost-button` ja existentes, com a excecao de cor do criterio 17) e tem **as mesmas dimensoes entre si** (mesma altura e mesma largura) dentro da mesma tabela, de forma que alternar entre modo leitura e edicao nao muda o tamanho da coluna de acoes.
- [x] 15. Os comportamentos ja existentes da edicao inline de Lancamentos permanecem intactos apos o ajuste de layout: categoria inativa pinada com sufixo "(Inativo)", campo Status oculto quando tipo = Receita, "Cancelar" da tabela ainda cancela o lancamento via `DELETE /api/transactions/{id}`, e o modal "Deseja sair sem salvar?" segue funcionando (suite `npm test` do frontend verde, incluindo os specs de componente existentes).

### Backend

- [x] 16. Nenhum endpoint novo e criado e nenhuma regra de negocio muda no backend: a edicao inline consome os `PUT` existentes de cada dominio, e `./mvnw test` continua verde.

### Botoes "Cancelar" em vermelho

- [x] 17. Nas telas afetadas (Lancamentos, Categorias, Usuarios), todo botao com o papel de cancelar/descartar e exibido em **vermelho** (tom unico definido no projeto, verificavel via DevTools na cor de fundo/borda/texto do botao): o "Cancelar" dos formularios de criacao, o "Cancelar" da tabela de Lancamentos (que cancela o lancamento) e o "Sair" da edicao inline (que cancela a edicao). O vermelho nao altera as dimensoes exigidas pelo criterio 14.

## Fora de escopo

- **Perfis**: mantem a edicao via formulario lateral (nome + matriz de permissoes) exatamente como hoje — decisao do usuario em 2026-07-25 (ver "Decisoes").
- Qualquer mudanca de regra de negocio, validacao ou endpoint no backend (os `PUT` existentes ja cobrem a edicao).
- Dashboard e tela de login (nao tem botao "Editar").
- Reintroducao de Contas/Cartoes (removidos na issue #20).
- Mudancas no fluxo de criacao dos registros alem da simplificacao do botao "Cancelar" (os formularios "Novo X" continuam existindo e funcionando como hoje).
- Responsividade/mobile alem do comportamento atual das tabelas (`overflow-x: auto`).

## Decisoes

- 2026-07-25 — **Perfis fica fora do escopo**: a edicao de Perfis (nome + matriz de permissoes 5x4) continua no formulario lateral como hoje; a issue cobre apenas Categorias e Usuarios, alem do ajuste de layout comum e da conferencia de Lancamentos. O dominio `auth` foi removido do frontmatter por consequencia.
- 2026-07-25 — **Campos sem coluna na tabela ganham controles compactos na linha** em modo de edicao: em Categorias, seletor de cor e campo de icone; em Usuarios, campo de senha opcional para redefinir (vazio = mantem a senha atual).
- 2026-07-25 — **Mensagens de validacao na edicao inline de Usuarios aparecem nos dois lugares**: faixa de erro no topo (padrao de Lancamentos) e mensagem por campo junto a cada campo da linha.
- 2026-07-25 — **Todos os botoes "Cancelar" das telas afetadas devem ser vermelhos** (decisao adicional do usuario: "nas edicoes inline e onde mais aparecerem"): inclui os "Cancelar" dos formularios de criacao, o "Cancelar" da tabela de Lancamentos e o "Sair" da edicao inline, que cumpre o papel de cancelar a edicao (criterio 17).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/31
- Documentos de conhecimento consultados: `knowledge/architecture.md`, `knowledge/transactions.md`, `knowledge/categories.md`, `knowledge/users.md`, `knowledge/auth-and-permissions.md`
- Codigo analisado: `frontend/src/app/features/{transactions,categories,users,profiles}/` e `frontend/src/styles.scss`
