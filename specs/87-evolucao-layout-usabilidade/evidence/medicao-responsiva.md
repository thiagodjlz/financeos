# Medição responsiva (T28, CA20–CA22)

Data: 2026-09-24. Build de desenvolvimento do working tree servido por um servidor Node local com respostas fictícias em `/api` (listas de 10 itens com textos longos, 12 categorias, super_admin), medido no Chrome headless via CDP com `Emulation.setDeviceMetricsOverride` (mobile). Emulação — comportamento nativo não reproduzido (acordo da #54). Nenhum `.scss` precisou de correção.

```text
== 360px: document.documentElement.scrollWidth
OK  360  /login (sem sessão)
OK  360  /dashboard
OK  360  /documentation
OK  360  /release-notes
OK  360  /transactions
OK  360  /transactions (filtros abertos)
OK  360  /categories
OK  360  /categories (filtros abertos)
OK  360  /users
OK  360  /users (filtros abertos)
OK  360  /profiles
OK  360  /profiles (filtros abertos)
OK  360  /transactions/new
OK  360  /transactions/t0/edit
OK  360  /categories/new
OK  360  /categories/c3/edit
OK  360  /users/new
OK  360  /users/u0/edit
OK  360  /profiles/new
OK  360  /profiles/p0/edit

== 480px: alturas (px) e font-size dos campos
/transactions {"botoes":["Filtros=44","Incluir=44","Limpar filtros=44","Editar=44","Cancelar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"menorCampo":44}
/categories {"botoes":["Filtros (1)=44","Incluir=44","Remover filtro Situação: Ativos=44","Limpar filtros=44","Editar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"menorCampo":44}
/users {"botoes":["Filtros (1)=44","Incluir=44","Remover filtro Situação: Ativos=44","Limpar filtros=44","Editar=44","Desativar=44","Anterior=44","Próxima=44"],"fontes":["16px"],"menorCampo":44}
/profiles {"botoes":["Filtros=44","Incluir=44","Limpar filtros=44","Editar=44","Excluir=44","Anterior=44","Próxima=44"],"fontes":["16px"],"menorCampo":46}
/transactions/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":44}
/transactions/t0/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":44}
/categories/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":44}
/categories/c3/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":44}
/users/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":44}
/users/u0/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":44}
/profiles/new {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":46}
/profiles/p0/edit {"botoes":["Salvar=44","Cancelar=44"],"fontes":["16px"],"menorCampo":46}

== 1280px: colunas das tabelas
/transactions {"display":"table","th":["Data","Descrição","Categoria","Status","Valor","Ações"]}
/categories {"display":"table","th":["Nome","Tipo","Situação","Ações"]}
/users {"display":"table","th":["Nome","E-mail","Perfil","Status","Ações"]}
/profiles {"display":"table","th":["Nome","Ações"]}

== 680px: cartão
/transactions {"thead":"none","tr":"block","semLabel":0}
/categories {"thead":"none","tr":"block","semLabel":0}
/users {"thead":"none","tr":"block","semLabel":0}
/profiles {"thead":"none","tr":"block","semLabel":0}

== conferência de renderização (360px)
/dashboard {"url":"/dashboard","titulo":"Setembro 2026","sw":360,"blocos":4}
/documentation {"url":"/documentation","titulo":"Documentação","sw":360,"blocos":7}
/release-notes {"url":"/release-notes","titulo":"Novidades por versão","sw":360,"blocos":1}
```
