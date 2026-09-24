# Verificação no navegador e na API (etapa 7)

Data: 2026-09-24. Build **servido** em `http://localhost` (bundle `main-HJRCJLFB.js`, cujos chunks contêm "Nenhum registro encontrado." e "Deseja sair sem salvar?"), Chrome headless via CDP. As respostas de `http://localhost/api/*` (e de `:8080`) foram substituídas **dentro da sessão do navegador** (`Fetch.requestPaused` → `fulfillRequest`/`failRequest`): nenhuma requisição, inclusive os `PUT` simulados, chegou ao backend ou ao banco. Emulação mobile — comportamento nativo não reproduzido (acordo da #54).

Dados fictícios: 14 categorias (a nº 3 inativa), 13 perfis, páginas de 10 com `totalItems` 25 / `totalPages` 3; termo `zzz` responde página vazia.

## Rodada 1 — CA20, CA21, CA22, CA1, CA2, CA13, CA17, CA19 e fluxos de filtro/paginação/cadastro

```text
== CA20 360px scrollWidth
/login (sem sessao) 360 /login
/dashboard 360
/documentation 360
/release-notes 360
/transactions 360
/transactions (filtros abertos) 360 paginacao= true
/transactions (filtro sem resultado) 360 Nenhum registro encontrado.Limpar filtros
/categories 360
/categories (filtros abertos) 360 paginacao= true
/categories (filtro sem resultado) 360 Nenhum registro encontrado.Limpar filtros
/users 360
/users (filtros abertos) 360 paginacao= true
/users (filtro sem resultado) 360 Nenhum registro encontrado.Limpar filtros
/profiles 360
/profiles (filtros abertos) 360 paginacao= true
/profiles (filtro sem resultado) 360 Nenhum registro encontrado.Limpar filtros
/transactions/new 360
/transactions/00000000-0000-0000-0000-000000000100/edit 360
/categories/new 360
/categories/00000000-0000-0000-0000-0000000000c3/edit 360
/users/new 360
/users/00000000-0000-0000-0000-000000000300/edit 360
/profiles/new 360
/profiles/00000000-0000-0000-0000-000000000200/edit 360

== CA21 480px
/transactions {"botoes":["Filtros=44","Incluir=44","Limpar filtros=44","Editar=44","Cancelar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"campos":6}
/transactions (estado vazio filtrado) ["Limpar filtros=44"]
/categories {"botoes":["Filtros (1)=44","Incluir=44","Remover filtro Situação: Ativos=44","Limpar filtros=44","Editar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"campos":3}
/categories (estado vazio filtrado) ["Limpar filtros=44"]
/users {"botoes":["Filtros (1)=44","Incluir=44","Remover filtro Situação: Ativos=44","Limpar filtros=44","Editar=44","Desativar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"campos":4}
/users (estado vazio filtrado) ["Limpar filtros=44"]
/profiles {"botoes":["Filtros=44","Incluir=44","Limpar filtros=44","Editar=44","Excluir=44","Anterior=44","Próxima=44"],"fontes":["16px"],"campos":1}
/profiles (estado vazio filtrado) ["Limpar filtros=44"]
/transactions/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":6}
/transactions/00000000-0000-0000-0000-000000000100/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":6}
/categories/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":4}
/categories/00000000-0000-0000-0000-0000000000c3/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":4}
/users/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":4}
/users/00000000-0000-0000-0000-000000000300/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":5}
/profiles/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":1}
/profiles/00000000-0000-0000-0000-000000000200/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"campos":1}

== CA22
1280 /transactions {"table":"table","fixed":true,"th":["Data","Descrição","Categoria","Status","Valor","Ações"]}
1280 /categories {"table":"table","fixed":true,"th":["Nome","Tipo","Situação","Ações"]}
1280 /users {"table":"table","fixed":true,"th":["Nome","E-mail","Perfil","Status","Ações"]}
1280 /profiles {"table":"table","fixed":true,"th":["Nome","Ações"]}
680 /transactions {"thead":"none","tr":"block","tdSemLabel":0,"labelsBatemComTh":"Data|Descrição|Categoria|Status|Valor"}
680 /categories {"thead":"none","tr":"block","tdSemLabel":0,"labelsBatemComTh":"Nome|Tipo|Situação"}
680 /users {"thead":"none","tr":"block","tdSemLabel":0,"labelsBatemComTh":"Nome|E-mail|Perfil|Status"}
680 /profiles {"thead":"none","tr":"block","tdSemLabel":0,"labelsBatemComTh":"Nome"}

== CA1 (perms completas)
/transactions {"camposNoTbody":0,"formNaListagem":0,"incluir":["Incluir"],"editar":10,"linhas":10}
/categories {"camposNoTbody":0,"formNaListagem":0,"incluir":["Incluir"],"editar":10,"linhas":10}
/users {"camposNoTbody":0,"formNaListagem":0,"incluir":["Incluir"],"editar":10,"linhas":10}
/profiles {"camposNoTbody":0,"formNaListagem":0,"incluir":["Incluir"],"editar":10,"linhas":10}
== CA1 (so VIEW)
/transactions {"incluir":0,"botoesNaLinha":[]}
/categories {"incluir":0,"botoesNaLinha":[]}
/users {"incluir":0,"botoesNaLinha":[]}
/profiles {"incluir":0,"botoesNaLinha":[]}
== CA2 guard: /transactions/new e /users/:id/edit sem CREATE/EDIT
{"url":"/dashboard","pag":null,"filtros":null,"chips":[],"toasts":["Alerta: Você não tem permissão para acessar esta tela."],"modal":null}
{"url":"/dashboard","pag":null,"filtros":null,"chips":[],"toasts":["Alerta: Você não tem permissão para acessar esta tela."],"modal":null}
404 na edicao: {"url":"/transactions","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":["Alerta: Lançamento não encontrado."],"modal":null}
edicao por URL (recarga): {"titulo":"Editar lançamento","descricao":"Descrição bem comprida de um lançamento com texto que não quebra facilmente_supercalifragilistico 0","categoria":"Categoria 0 com nome comprido"}

== CA13 nomes e opcoes com 14 categorias / 13 perfis
{"semCategoria":0,"nomes":["Categoria 0 com nome comprido","Categoria 1 com nome comprido","Categoria 2 com nome comprido"]}
dropdown Categoria (Despesa): 8 ativas EXPENSE no mock = 7
{"traco":0,"nomes":["Perfil de acesso 12 com nome grande","Perfil de acesso 11 com nome grande","Perfil de acesso 10 com nome grande"]}
dropdown Perfil: 14 (13 perfis + Selecione)
Lancamentos com /categories/options atrasado 1,5s, aos 600ms: ["Sem categoria","Sem categoria","Sem categoria"]
  depois da resposta: ["Categoria 0 com nome comprido","Categoria 1 com nome comprido","Categoria 2 com nome comprido"]
Usuarios com /profiles/options atrasado 1,5s, aos 600ms: ["-","-","-"]

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
/categories abre: {"url":"/categories","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/categories?page=1&size=10&active=true"]
  selects: ["filterType:Todos/Despesa/Receita =","filterActive:Ativos/Inativos/Todos =true"] Limpar habilitado? false
  remove rotulo Situacao -> {"url":"/categories","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":[],"modal":null} ["GET /api/categories?page=1&size=10"] select= 
  Limpar filtros -> {"url":"/categories","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/categories?page=1&size=10&active=true"]
  vazio so com padrao -> {"texto":"Nenhum registro encontrado.","botao":false}
  vazio sem filtro nenhum -> Nenhuma categoria cadastrada
/users abre: {"url":"/users","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/users?page=1&size=10&active=true"]
  selects: ["filterProfileId:Todos/Perfil de acesso 0 com nome grande/Perfil de acesso 1 com nome grande/Perfil de acesso 2 com nome grande/Perfil de acesso 3 com nome grande/Perfil de acesso 4 com nome grande/Perfil de acesso 5 com nome grande/Perfil de acesso 6 com nome grande/Perfil de acesso 7 com nome grande/Perfil de acesso 8 com nome grande/Perfil de acesso 9 com nome grande/Perfil de acesso 10 com nome grande/Perfil de acesso 11 com nome grande/Perfil de acesso 12 com nome grande =","filterActive:Ativos/Inativos/Todos =true"] Limpar habilitado? false
  remove rotulo Situacao -> {"url":"/users","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":[],"modal":null} ["GET /api/users?page=1&size=10"] select= 
  Limpar filtros -> {"url":"/users","pag":"Página 1 de 3","filtros":"Filtros (1)","chips":["Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/users?page=1&size=10&active=true"]
  vazio so com padrao -> {"texto":"Nenhum registro encontrado.","botao":false}
  vazio sem filtro nenhum -> Nenhum usuário cadastrado
/profiles abre: {"url":"/profiles","pag":"Página 1 de 3","filtros":"Filtros","chips":[],"toasts":[],"modal":null} ["GET /api/profiles?page=1&size=10"]
  selects: [] Limpar habilitado? false
```

Leitura do bloco CA13: com `/categories/options` (ou `/profiles/options`) respondendo depois da listagem, as linhas mostram "Sem categoria" (ou "-") até o catálogo chegar — ver `verification-report.md`, CA13.

## Rodada 2 — CA3, CA4 e CA7 nas demais telas

```text
== CA3 inclusao
/transactions/new {"titulo":"Novo lançamento","campos":["Data=2026-09-24 (required)","Descrição= (required)","Valor=0 (required)","Tipo=Despesa [Despesa/Receita]","Status=Pendente [Pendente/Pago]","Categoria=Selecione [Selecione/Categoria 0 com nome comprido/Categoria 2 com nome comprido/Categoria 4 com nome comprido/Categoria 6 com nome comprido/Categoria 8 com nome comprido/Categoria 10 com nome comprido/Categoria 12 com nome comprido] (required)"],"botoes":["Salvar","Cancelar"]}
/categories/new {"titulo":"Nova categoria","campos":["Nome= (required)","Tipo=Despesa [Despesa/Receita]","Cor=#2f7d62","Situação=Ativo [Ativo/Inativo]"],"botoes":["Salvar","Cancelar"]}
/users/new {"titulo":"Novo usuário","campos":["Nome= (required)","E-mail= (required)","Senha= (required)","Perfil=Selecione [Selecione/Perfil de acesso 0 com nome grande/Perfil de acesso 1 com nome grande/Perfil de acesso 2 com nome grande/Perfil de acesso 3 com nome grande/Perfil de acesso 4 com nome grande/Perfil de acesso 5 com nome grande/Perfil de acesso 6 com nome grande/Perfil de acesso 7 com nome grande/Perfil de acesso 8 com nome grande/Perfil de acesso 9 com nome grande/Perfil de acesso 10 com nome grande/Perfil de acesso 11 com nome grande/Perfil de acesso 12 com nome grande] (required)"],"botoes":["Salvar","Cancelar"]}
/profiles/new {"titulo":"Novo perfil","campos":["Nome= (required)","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on","=on"],"botoes":["Salvar","Cancelar"]}
Lancamento Tipo=Receita: {"titulo":"Novo lançamento","campos":["Data=2026-09-24 (required)","Descrição= (required)","Valor=0 (required)","Tipo=Receita [Despesa/Receita]","Categoria=Selecione [Selecione/Categoria 1 com nome comprido/Categoria 5 com nome comprido/Categoria 7 com nome comprido/Categoria 9 com nome comprido/Categoria 11 com nome comprido/Categoria 13 com nome comprido] (required)"],"botoes":["Salvar","Cancelar"]}
== CA3/CA4 edicao
lancamento com categoria inativa (c3): {"titulo":"Editar lançamento","campos":["Data=2026-09-04 (required)","Descrição=Descrição bem comprida de um lançamento com texto que não quebra facilmente_supercalifragilistico 3 (required)","Valor=123456.78 (required)","Tipo=Receita [Despesa/Receita]","Categoria=Categoria 3 com nome comprido (Inativo) [Selecione/Categoria 3 com nome comprido (Inativo)/Categoria 1 com nome comprido/Categoria 5 com nome comprido/Categoria 7 com nome comprido/Categoria 9 com nome comprido/Categoria 11 com nome comprido/Categoria 13 com nome comprido] (required)"],"botoes":["Salvar","Cancelar"]}
lancamento despesa: {"titulo":"Editar lançamento","campos":["Data=2026-09-01 (required)","Descrição=Descrição bem comprida de um lançamento com texto que não quebra facilmente_supercalifragilistico 0 (required)","Valor=123456.78 (required)","Tipo=Despesa [Despesa/Receita]","Status=Pendente [Pendente/Pago]","Categoria=Categoria 0 com nome comprido [Selecione/Categoria 0 com nome comprido/Categoria 2 com nome comprido/Categoria 4 com nome comprido/Categoria 6 com nome comprido/Categoria 8 com nome comprido/Categoria 10 com nome comprido/Categoria 12 com nome comprido] (required)"],"botoes":["Salvar","Cancelar"]}
categoria inativa: {"titulo":"Editar categoria","campos":["Nome=Categoria 3 com nome comprido (required)","Tipo=Receita [Despesa/Receita]","Cor=#2f7d62","Situação=Inativo [Ativo/Inativo]"],"botoes":["Salvar","Cancelar"]}
usuario: {"titulo":"Editar usuário","campos":["Nome=Usuária 0 com nome e sobrenome compridos (required)","E-mail=usuaria.email.bem.comprido.0@financeos.local (required)","Nova senha (opcional)=","Perfil=Perfil de acesso 12 com nome grande [Selecione/Perfil de acesso 0 com nome grande/Perfil de acesso 1 com nome grande/Perfil de acesso 2 com nome grande/Perfil de acesso 3 com nome grande/Perfil de acesso 4 com nome grande/Perfil de acesso 5 com nome grande/Perfil de acesso 6 com nome grande/Perfil de acesso 7 com nome grande/Perfil de acesso 8 com nome grande/Perfil de acesso 9 com nome grande/Perfil de acesso 10 com nome grande/Perfil de acesso 11 com nome grande/Perfil de acesso 12 com nome grande] (required)","Status=Ativo [Ativo/Inativo]"],"botoes":["Salvar","Cancelar"]}
perfil: {"titulo":"Editar perfil","nome":"Perfil de acesso 0 com nome grande","switches":22,"linhas":["Resumo","Lançamentos","Categorias","Usuários","Perfis","Documentação","Novidades por versão"]}

== CA7 nas outras telas (pagina 2 + filtro -> Editar -> Cancelar/Salvar)
/categories antes: {"url":"/categories","pag":"Página 2 de 3","filtros":"Filtros (2)","chips":["Tipo: Receita","Situação: Ativos"],"toasts":[],"modal":null} 
   depois do Cancelar: {"url":"/categories","pag":"Página 2 de 3","filtros":"Filtros (2)","chips":["Tipo: Receita","Situação: Ativos"],"toasts":[],"modal":null} ["GET /api/categories/00000000-0000-0000-0000-0000000000c0","GET /api/categories?page=2&size=10&type=INCOME&active=true"]
   depois do Salvar: {"url":"/categories","pag":"Página 2 de 3","filtros":"Filtros (2)","chips":["Tipo: Receita","Situação: Ativos"],"toasts":["Sucesso: Categoria atualizada com sucesso."],"modal":null} ["PUT /api/categories/00000000-0000-0000-0000-0000000000c0","GET /api/categories?page=2&size=10&type=INCOME&active=true"]
/users antes: {"url":"/users","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Situação: Inativos"],"toasts":[],"modal":null} 
   depois do Cancelar: {"url":"/users","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Situação: Inativos"],"toasts":[],"modal":null} ["GET /api/users/00000000-0000-0000-0000-000000000300","GET /api/users?page=2&size=10&active=false"]
   depois do Salvar: {"url":"/users","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Situação: Inativos"],"toasts":["Sucesso: Usuário atualizado com sucesso."],"modal":null} ["PUT /api/users/00000000-0000-0000-0000-000000000300","GET /api/users?page=2&size=10&active=false"]
/profiles antes: {"url":"/profiles","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Nome: acesso"],"toasts":[],"modal":null} 
   depois do Cancelar: {"url":"/profiles","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Nome: acesso"],"toasts":[],"modal":null} ["GET /api/profiles/00000000-0000-0000-0000-000000000200","GET /api/profiles?page=2&size=10&name=acesso"]
   depois do Salvar: {"url":"/profiles","pag":"Página 2 de 3","filtros":"Filtros (1)","chips":["Nome: acesso"],"toasts":["Sucesso: Perfil atualizado com sucesso."],"modal":null} ["PUT /api/profiles/00000000-0000-0000-0000-000000000200","GET /api/profiles?page=2&size=10&name=acesso"]
```

## API real da stack (`http://localhost:8080`), só `GET`, JWT assinado localmente com a chave do repositório (issue #69)

```text
categories?size=11            -> 400 {"message":"O tamanho da página deve ser um número entre 1 e 10."}
categories?page=abc           -> 400 {"message":"A página deve ser um número inteiro maior ou igual a 1."}
categories?active=talvez      -> 400 {"message":"A situação informada é inválida."}
transactions?status=XYZ       -> 400 {"message":"O status informado é inválido."}
transactions?startDate=abc    -> 400 {"message":"A data inicial informada é inválida."}
transactions?categoryId=nao-uuid -> 400 {"message":"A categoria informada é inválida."}
profiles?page=99              -> 200 {"items":[],"page":99,"size":10,"totalItems":2,"totalPages":1}
categories page=1 / 5 / 6     -> 10 / 6 / 0 itens; totalItems 46, totalPages 5 (banco: 46 categorias)
categories?name=CARTAO itau   -> 1 item: "Cartão Itaú"
categories/options            -> 46 (todas; > 10)     profiles/options -> 2 (banco: 2)
users                         -> totalItems 3 (banco: 3 não super_admin; 1 super_admin fora)
transactions                  -> totalItems 2 (banco: 2 do usuário do token, 488 no total)
bytes de "página" na resposta 400 -> 70 c3a1 67 69 6e 61 (UTF-8 correto, sem c383c2)
documentation (4 áreas)       -> sem "à esquerda"/"na própria linha"; citam Incluir, Editar, tela própria, Filtros, Anterior/Próxima
banco: flyway V15 "enable unaccent" success=t; pg_extension unaccent presente; unaccent('Açaí') ilike '%acai%' = t
sem token: GET /api/{categories,transactions,users,profiles,profiles/options} -> 401
```
