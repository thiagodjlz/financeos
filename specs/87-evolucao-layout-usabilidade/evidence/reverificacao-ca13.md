# Reverificação após a 1ª correção (CA13) — etapa 7

Data: 2026-09-24. Build **servido** em `http://localhost` (`main-WGMT2MX7.js`; o chunk da listagem de Lançamentos contém o rótulo `Categoria: …` da correção). Chrome headless via CDP, com as respostas de `/api` substituídas **só dentro da sessão do navegador** (`Fetch.requestPaused` → `fulfillRequest`/`failRequest`); nenhuma requisição, inclusive `PUT`/`DELETE` simulados, chegou ao backend ou ao banco.

Mesmos dados fictícios da rodada anterior (`verificacao-navegador-e-api.md`): 14 categorias (nº 3 inativa), 13 perfis, páginas de 10 com 25 registros / 3 páginas. "Varredura" = amostra do DOM a cada 50 ms enquanto a resposta atrasada não chega; `maxIndevido` = maior número de células "Sem categoria"/"-" vistas em qualquer amostra.

## CA13 — catálogo atrasado, falha do catálogo, volta do cadastro

```text
== CA13 (reverificacao) — build servido http://localhost/main-WGMT2MX7.js

--- /transactions
1 normal: {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":[],"toasts":[]} GET options: 1
  opcoes do filtro: 15 ["Todas","Categoria 0 com nome comprido","Categoria 1 com nome comprido","Categoria 2 com nome comprido"]
  filtro Tipo=Receita -> opcoes Categoria: ["Todas","Categoria 1 com nome comprido","Categoria 3 com nome comprido (Inativo)","Categoria 5 com nome comprido","Categoria 7 com nome comprido","Categoria 9 com nome comprido","Categoria 11 com nome comprido","Categoria 13 com nome comprido"]
  linha do lancamento 3 (categoria inativa): Categoria 3 com nome comprido
2 /options atrasado 1,5s — varredura 50ms por 1,1s: {"amostras":18,"maxIndevido":0,"amostrasComLinhasELoading":0,"rotulosVistos":[]}
  ainda sem catalogo: {"linhas":0,"indevido":0,"nomes":[],"loading":1,"busy":"true","empty":0,"loadError":[],"chips":[],"toasts":[]}
  depois do catalogo: {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":[],"toasts":[]}
3 antes (filtro + pag 2): {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Categoria: Categoria 0 com nome comprido"],"toasts":[]}
  volta do cadastro com /options atrasado — varredura: {"amostras":17,"maxIndevido":0,"amostrasComLinhasELoading":0,"rotulosVistos":["Categoria: …"]}
  ainda sem catalogo: {"linhas":0,"indevido":0,"nomes":[],"loading":1,"busy":"true","empty":0,"loadError":[],"chips":["Categoria: …"],"toasts":[]} undefined
  depois do catalogo: {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Categoria: Categoria 0 com nome comprido"],"toasts":[]} Página 2 de 3 ["GET /api/transactions?page=2&size=10&categoryId=00000000-0000-0000-0000-0000000000c0","GET /api/categories/options"]
4 listagem atrasada 1,5s — varredura: {"amostras":17,"maxIndevido":0,"amostrasComLinhasELoading":0,"rotulosVistos":[]}
  depois: {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":[],"toasts":[]}
5 falha do catalogo (500): {"linhas":0,"indevido":0,"nomes":[],"loading":0,"busy":"false","empty":0,"loadError":["Não foi possível carregar os lançamentos."],"chips":[],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
  proxima carga (filtro alterado): {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Tipo: Despesa"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]} GET options no total: 2
5 falha do catalogo (network): {"linhas":0,"indevido":0,"nomes":[],"loading":0,"busy":"false","empty":0,"loadError":["Não foi possível carregar os lançamentos."],"chips":[],"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
  proxima carga (filtro alterado): {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Tipo: Despesa"],"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]} GET options no total: 2
7 falha da listagem (500): {"linhas":0,"indevido":0,"nomes":[],"loading":0,"busy":"false","empty":0,"loadError":["Não foi possível carregar os lançamentos."],"chips":[],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
  proxima carga: {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Tipo: Despesa"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]} GET options no total: 1
8 paginacao ida e volta: ["GET /api/transactions?page=2&size=10&type=EXPENSE","GET /api/transactions?page=1&size=10&type=EXPENSE"]

--- /users
1 normal: {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Ativos"],"toasts":[]} GET options: 1
  opcoes do filtro: 14 ["Todos","Perfil de acesso 0 com nome grande","Perfil de acesso 1 com nome grande","Perfil de acesso 2 com nome grande"]
2 /options atrasado 1,5s — varredura 50ms por 1,1s: {"amostras":18,"maxIndevido":0,"amostrasComLinhasELoading":0,"rotulosVistos":[]}
  ainda sem catalogo: {"linhas":0,"indevido":0,"nomes":[],"loading":1,"busy":"true","empty":0,"loadError":[],"chips":["Situação: Ativos"],"toasts":[]}
  depois do catalogo: {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Ativos"],"toasts":[]}
3 antes (filtro + pag 2): {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Perfil: Perfil de acesso 0 com nome grande","Situação: Ativos"],"toasts":[]}
  volta do cadastro com /options atrasado — varredura: {"amostras":17,"maxIndevido":0,"amostrasComLinhasELoading":0,"rotulosVistos":["Perfil: …"]}
  ainda sem catalogo: {"linhas":0,"indevido":0,"nomes":[],"loading":1,"busy":"true","empty":0,"loadError":[],"chips":["Perfil: …","Situação: Ativos"],"toasts":[]} undefined
  depois do catalogo: {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Perfil: Perfil de acesso 0 com nome grande","Situação: Ativos"],"toasts":[]} Página 2 de 3 ["GET /api/users?page=2&size=10&profileId=00000000-0000-0000-0000-000000000200&active=true","GET /api/profiles/options"]
4 listagem atrasada 1,5s — varredura: {"amostras":17,"maxIndevido":0,"amostrasComLinhasELoading":0,"rotulosVistos":[]}
  depois: {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Ativos"],"toasts":[]}
5 falha do catalogo (500): {"linhas":0,"indevido":0,"nomes":[],"loading":0,"busy":"false","empty":0,"loadError":["Não foi possível carregar os usuários."],"chips":["Situação: Ativos"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
  proxima carga (filtro alterado): {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Inativos"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]} GET options no total: 2
5 falha do catalogo (network): {"linhas":0,"indevido":0,"nomes":[],"loading":0,"busy":"false","empty":0,"loadError":["Não foi possível carregar os usuários."],"chips":["Situação: Ativos"],"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
  proxima carga (filtro alterado): {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Inativos"],"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]} GET options no total: 2
7 falha da listagem (500): {"linhas":0,"indevido":0,"nomes":[],"loading":0,"busy":"false","empty":0,"loadError":["Não foi possível carregar os usuários."],"chips":["Situação: Ativos"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
  proxima carga: {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Inativos"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]} GET options no total: 1
8 paginacao ida e volta: ["GET /api/users?page=2&size=10&active=false","GET /api/users?page=1&size=10&active=false"]

9 lancamento legado sem categoria: 1 de 10, linha 10 = Sem categoria
10 Cancelar lancamento: {"linhas":10,"indevido":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":[],"toasts":["Sucesso: Lançamento cancelado com sucesso."]} ["DELETE /api/transactions/00000000-0000-0000-0000-000000000100","GET /api/transactions?page=1&size=10"]
10 Desativar usuario: {"linhas":10,"indevido":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande"],"loading":0,"busy":"false","empty":0,"loadError":[],"chips":["Situação: Ativos"],"toasts":["Sucesso: Usuário desativado com sucesso."]} ["DELETE /api/users/00000000-0000-0000-0000-000000000300","GET /api/users?page=1&size=10&active=true"]
```

Leitura: em nenhuma amostra aparece linha com "Sem categoria"/"-" indevido; com `/options` atrasado a área fica em `.loading-state` (`aria-busy=true`, 0 linhas, 0 `.empty-state`) e o rótulo do filtro mostra `…`; na falha do catálogo sai `.load-error` com um único toast e a próxima carga repete `/options` e acerta os nomes; paginação, Cancelar lançamento e Desativar usuário não repetem `/options`. O único "Sem categoria" medido (item 9) é o lançamento legado com `categoryId: null`, que é o comportamento correto.

## Não-regressão em Lançamentos e Usuários (CA1, CA2, CA7, CA14–CA22)

```text
== CA20 360px scrollWidth
/login (sem sessao) 360 /login
/transactions 360
/transactions (filtros abertos) 360 paginacao= true
/transactions (filtro sem resultado) 360 Nenhum registro encontrado.Limpar filtros
/users 360
/users (filtros abertos) 360 paginacao= true
/users (filtro sem resultado) 360 Nenhum registro encontrado.Limpar filtros
/transactions/new 360
/transactions/00000000-0000-0000-0000-000000000100/edit 360
/users/new 360
/users/00000000-0000-0000-0000-000000000300/edit 360

== CA21 480px
/transactions {"botoes":["Filtros=44","Incluir=44","Limpar filtros=44","Editar=44","Cancelar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"campos":6}
/transactions (estado vazio filtrado) ["Limpar filtros=44"]
/users {"botoes":["Filtros (1)=44","Incluir=44","Remover filtro Situação: Ativos=44","Limpar filtros=44","Editar=44","Desativar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"campos":4}
/users (estado vazio filtrado) ["Limpar filtros=44"]
/transactions/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":6}
/transactions/00000000-0000-0000-0000-000000000100/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":6}
/users/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":4}
/users/00000000-0000-0000-0000-000000000300/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":5}

== CA22
1280 /transactions {"table":"table","fixed":true,"th":["Data","Descrição","Categoria","Status","Valor","Ações"]}
1280 /users {"table":"table","fixed":true,"th":["Nome","E-mail","Perfil","Status","Ações"]}
680 /transactions {"thead":"none","tr":"block","tdSemLabel":0,"labelsBatemComTh":"Data|Descrição|Categoria|Status|Valor"}
680 /users {"thead":"none","tr":"block","tdSemLabel":0,"labelsBatemComTh":"Nome|E-mail|Perfil|Status"}

== CA1 (perms completas)
/transactions {"camposNoTbody":0,"formNaListagem":0,"incluir":["Incluir"],"editar":10,"linhas":10}
/users {"camposNoTbody":0,"formNaListagem":0,"incluir":["Incluir"],"editar":10,"linhas":10}
== CA1 (so VIEW)
/transactions {"incluir":0,"botoesNaLinha":[]}
/users {"incluir":0,"botoesNaLinha":[]}
== CA2 guard: /transactions/new e /users/:id/edit sem CREATE/EDIT
{"url":"/dashboard","pag":null,"filtros":null,"chips":[],"toasts":["Alerta: Você não tem permissão para acessar esta tela."],"modal":null}
{"url":"/dashboard","pag":null,"filtros":null,"chips":[],"toasts":["Alerta: Você não tem permissão para acessar esta tela."],"modal":null}
404 na edicao: {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":["Alerta: Lançamento não encontrado."],"modal":null}
edicao por URL (recarga): {"titulo":"Editar lançamento","descricao":"Descrição bem comprida de um lançamento com texto que não quebra facilmente_supercalifragilistico 0","categoria":"Categoria 0 com nome comprido"}

== CA17 carga (resposta atrasada 2s)
/transactions {"loading":1,"loadingDentroDeAriaBusyTrue":true,"empty":0}
/categories {"loading":1,"loadingDentroDeAriaBusyTrue":true,"empty":0}
/users {"loading":1,"loadingDentroDeAriaBusyTrue":true,"empty":0}
/profiles {"loading":1,"loadingDentroDeAriaBusyTrue":true,"empty":0}
/dashboard {"loading":2,"loadingDentroDeAriaBusyTrue":true,"empty":0}
/documentation {"loading":1,"loadingDentroDeAriaBusyTrue":true,"empty":0}
/release-notes {"loading":1,"loadingDentroDeAriaBusyTrue":true,"empty":0}

== CA19 falha de carga
500 /transactions {"loadError":["Não foi possível carregar os lançamentos."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
500 /categories {"loadError":["Não foi possível carregar as categorias."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
500 /users {"loadError":["Não foi possível carregar os usuários."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
500 /profiles {"loadError":["Não foi possível carregar os perfis."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
500 /dashboard {"loadError":["Não foi possível carregar o resumo."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
500 /documentation {"loadError":["Não foi possível carregar a documentação."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
500 /release-notes {"loadError":["Não foi possível carregar as novidades por versão."],"empty":0,"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."]}
network /transactions {"loadError":["Não foi possível carregar os lançamentos."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
network /categories {"loadError":["Não foi possível carregar as categorias."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
network /users {"loadError":["Não foi possível carregar os usuários."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
network /profiles {"loadError":["Não foi possível carregar os perfis."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
network /dashboard {"loadError":["Não foi possível carregar o resumo."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
network /documentation {"loadError":["Não foi possível carregar a documentação."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}
network /release-notes {"loadError":["Não foi possível carregar as novidades por versão."],"empty":0,"toasts":["Falha: Não foi possível falar com o servidor. Verifique sua conexão e tente novamente."]}

== Fluxo Lancamentos
abre: {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":[],"modal":null}
Status opcoes: ["Todos=","Pendente=PENDING","Pago=PAID","Cancelado=CANCELED"] selecionado=
Tipo=Despesa: {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Tipo: Despesa"],"toasts":[],"modal":null} ["GET /api/transactions?page=1&size=10&type=EXPENSE"]
Anterior desabilitado? Anterior:off Próxima:on
Proxima: {"url":"/transactions","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Tipo: Despesa"],"toasts":[],"modal":null} ["GET /api/transactions?page=2&size=10&type=EXPENSE"]
ultima pagina: Anterior:on Próxima:off ["GET /api/transactions?page=3&size=10&type=EXPENSE"]
alterar Status na pag 2 -> {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros (2)","chips":["Tipo: Despesa","Status: Pago"],"toasts":[],"modal":null} ["GET /api/transactions?page=1&size=10&type=EXPENSE&status=PAID"]
remover 1o rotulo -> {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Status: Pago"],"toasts":[],"modal":null} ["GET /api/transactions?page=1&size=10&status=PAID"]
Limpar filtros -> {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":[],"modal":null} ["GET /api/transactions?page=1&size=10"]
Editar -> {"url":"/transactions/00000000-0000-0000-0000-000000000100/edit","pag":null,"filtros":null,"chips":[],"toasts":[],"modal":null} ["GET /api/transactions/00000000-0000-0000-0000-000000000100","GET /api/categories/options?type=EXPENSE"]
Cancelar sem alteracao -> {"url":"/transactions","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Tipo: Despesa"],"toasts":[],"modal":null} ["GET /api/transactions?page=2&size=10&type=EXPENSE","GET /api/categories/options"]
Cancelar com alteracao -> {"url":"/transactions/00000000-0000-0000-0000-000000000100/edit","pag":null,"filtros":null,"chips":[],"toasts":[],"modal":"Deseja sair sem salvar?Continuar editandoSair sem salvar"} HTTP: []
Continuar editando -> Texto alterado na verificação {"url":"/transactions/00000000-0000-0000-0000-000000000100/edit","pag":null,"filtros":null,"chips":[],"toasts":[],"modal":null} HTTP: []
Sair sem salvar -> {"url":"/transactions","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Tipo: Despesa"],"toasts":[],"modal":null} ["GET /api/transactions?page=2&size=10&type=EXPENSE","GET /api/categories/options"]
Salvar 400 -> {"url":"/transactions/00000000-0000-0000-0000-000000000100/edit","invalid":["description"],"fieldError":["A descrição é obrigatória."],"foco":"description"} {"url":"/transactions/00000000-0000-0000-0000-000000000100/edit","pag":null,"filtros":null,"chips":[],"toasts":["Alerta: A descrição é obrigatória."],"modal":null} ["PUT /api/transactions/00000000-0000-0000-0000-000000000100"]
Salvar 200 -> {"url":"/transactions","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Tipo: Despesa"],"toasts":["Alerta: A descrição é obrigatória.","Sucesso: Lançamento atualizado com sucesso."],"modal":null} ["PUT /api/transactions/00000000-0000-0000-0000-000000000100","GET /api/transactions?page=2&size=10&type=EXPENSE","GET /api/categories/options"]

== Categorias / Usuarios / Perfis: padrao e rotulos
/users abre: {"url":"/users","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/users?page=1&size=10&active=true"]
  selects: ["filterProfileId:Todos/Perfil de acesso 0 com nome grande/Perfil de acesso 1 com nome grande/Perfil de acesso 2 com nome grande/Perfil de acesso 3 com nome grande/Perfil de acesso 4 com nome grande/Perfil de acesso 5 com nome grande/Perfil de acesso 6 com nome grande/Perfil de acesso 7 com nome grande/Perfil de acesso 8 com nome grande/Perfil de acesso 9 com nome grande/Perfil de acesso 10 com nome grande/Perfil de acesso 11 com nome grande/Perfil de acesso 12 com nome grande =","filterActive:Ativos/Inativos/Todos =true"] Limpar habilitado? false
  remove rotulo Situacao -> {"url":"/users","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":[],"modal":null} ["GET /api/users?page=1&size=10"] select= 
  Limpar filtros -> {"url":"/users","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/users?page=1&size=10&active=true"]
  vazio so com padrao -> {"texto":"Nenhum registro encontrado.","botao":false}
  vazio sem filtro nenhum -> Nenhum usuário cadastrado

== CA7 Usuarios (pagina 2 + filtro -> Editar -> Cancelar/Salvar)
/users antes: {"url":"/users","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Situação: Inativos"],"toasts":[],"modal":null} 
   depois do Cancelar: {"url":"/users","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Situação: Inativos"],"toasts":[],"modal":null} ["GET /api/profiles/options","GET /api/users/00000000-0000-0000-0000-000000000300","GET /api/users?page=2&size=10&active=false","GET /api/profiles/options"]
   depois do Salvar: {"url":"/users","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Situação: Inativos"],"toasts":["Sucesso: Usuário atualizado com sucesso."],"modal":null} ["PUT /api/users/00000000-0000-0000-0000-000000000300","GET /api/users?page=2&size=10&active=false","GET /api/profiles/options"]

== Rotulo do filtro do catalogo quando o catalogo falha na volta do cadastro
/transactions {"url":"/transactions","pag":null,"filtros":"Filtros (1)","chips":["Categoria: …"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."],"modal":null} {"loadError":["Não foi possível carregar os lançamentos."],"linhas":0}
/users {"url":"/users","pag":null,"filtros":"Filtros (2)","chips":["Perfil: …","Situação: Ativos"],"toasts":["Falha: Erro inesperado do sistema. Tente novamente em instantes."],"modal":null} {"loadError":["Não foi possível carregar os usuários."],"linhas":0}
```

Varreduras de idioma de `context.md` (front e back) e de cor literal em `.scss`: 0 / 0 / 0 linhas. `transactions.ts` e `users.ts` em UTF-8, sem `Ã`/`Â`.
