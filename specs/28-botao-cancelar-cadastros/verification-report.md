# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reiniciada na etapa anterior — ver `docker-report.md`; containers `financeos-frontend`, `financeos-backend`, `financeos-postgres` no ar, Flyway na v10).
Branch: `feature/issue-28-botao-cancelar-cadastros` — mudancas ainda **nao commitadas**.

Execucoes desta etapa (nao apenas leitura do `quality-report.md`):

- `npx ng test --watch=false --reporters=verbose` no `frontend/` — **12 arquivos, 54 testes, 0 falhas**, incluindo os 32 testes novos dos quatro `*.spec.ts` da feature.
- `./mvnw test` no `backend/` — **exit code 0**, 10 migrations validadas.
- `docker exec financeos-frontend grep -l clearTransactionForm /usr/share/nginx/html/*.js` → `chunk-C1eJUrx-.js`: o bundle que esta sendo servido em `http://localhost` contem mesmo o codigo da feature (`main-FNXMQRST.js` bate com o hash do `build-report.md`).

Nao foi feita chamada autenticada a API: os 30 criterios sao de UI (nenhum descreve resposta HTTP de regra de negocio) e, alem disso, a senha do usuario de desenvolvimento foi rotacionada pela migration `V10` que esta no working tree (ver "Achado fora dos criterios"). O unico criterio de back-end (30) foi checado por `git status`/`git diff` + suite do Maven.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Categorias: botao "Cancelar" visivel em modo de criacao | VERIFICADO | `Categories#exibe o botao Cancelar ao lado de Salvar em modo de criacao` (passou); `categories.html:40` — `*ngIf="editingId()"` removido |
| 2 | Usuarios: botao "Cancelar" visivel em modo de criacao | VERIFICADO | `Users#exibe o botao Cancelar ao lado de Salvar em modo de criacao` (passou); `users.html:69` |
| 3 | Perfis: botao "Cancelar" visivel em modo de criacao | VERIFICADO | `Profiles#exibe o botao Cancelar ao lado de Salvar em modo de criacao` (passou); `profiles.html:38` |
| 4 | Lancamentos: "Novo lancamento" passa a ter "Cancelar" ao lado de "Salvar" | VERIFICADO | `Transactions#exibe o botao Cancelar ao lado de Salvar no formulario de novo lancamento` (passou); `transactions.html:43-46` (par dentro de `<div class="two-cols">`, grid de 2 colunas em `styles.scss:77-81`; o override `td .two-cols` de `transactions.scss:20` nao alcanca o formulario) |
| 5 | Rotulo "Cancelar" nas 4 telas e nos 2 estagios | VERIFICADO | rotulo e texto estatico nos 4 templates (`categories.html:40`, `users.html:69`, `profiles.html:38`, `transactions.html:45`); os 4 testes de presenca conferem `textContent === 'Cancelar'` e os testes de restauracao reconferem apos o 1o clique (`categories.spec.ts:150`, `users.spec.ts:183`, `profiles.spec.ts:153`) |
| 6 | Botao com `type="button"` (nao submete o form) | VERIFICADO | os 4 testes de presenca conferem `getAttribute('type') === 'button'`; alem disso todo teste de "Cancelar" termina em `httpMock.expectNone(() => true)` — nenhum `POST` disparado pelo clique |
| 7 | Sem permissao de criacao o botao nao aparece; gate intacto | VERIFICADO | `Categories#nao renderiza o formulario nem o botao Cancelar sem permissao` (checa `form` e `form button.ghost-button` nulos) + testes equivalentes em `Users`, `Profiles`, `Transactions`; `git diff` mostra que os `*ngIf` do `<form>` (`categories.html:6`, `users.html:7`, `profiles.html:4`, `transactions.html:4`) nao foram tocados |
| 8 | Categorias: limpar volta ao estado inicial | VERIFICADO | `Categories#limpa o formulario em modo de criacao` (nome vazio, `EXPENSE`, `#2f7d62`, icone vazio, Situacao no indice 0 = Ativo); `categories.ts:116-118` |
| 9 | Usuarios: limpar volta ao estado inicial | VERIFICADO | `Users#limpa o formulario em modo de criacao` (nome/e-mail/senha vazios, perfil sem selecao); `users.ts:266-269` repoe `active: true` (o campo Situacao so e renderizado em edicao) |
| 10 | Perfis: nome vazio e matriz toda desmarcada | VERIFICADO | `Profiles#limpa o nome e toda a matriz de permissoes em modo de criacao` (20 checkboxes, todos desmarcados) |
| 11 | Lancamentos: estado inicial e dropdown de volta em Despesa | VERIFICADO | `Transactions#limpa o formulario e repoe o dropdown de Despesa sem nova requisicao` (troca para Receita antes de cancelar; apos o clique: data = hoje, descricao vazia, valor 0, Despesa, Pendente, "Sem categoria", opcoes `['Sem categoria','Mercado']`, com `expectNone`) |
| 12 | Usuarios: cancelar em criacao limpa mensagens do backend | VERIFICADO | `Users#limpa as mensagens de validacao do backend ao cancelar em modo de criacao` (400 com `violations[]`; apos o clique `.field-error` = 0 e `.status-bar` ausente) |
| 13 | Categorias: 1o clique restaura os valores do registro | VERIFICADO | `Categories#restaura os valores originais no primeiro clique e mantem a edicao`; `categories.ts:61` (snapshot) e `:64-83` |
| 14 | Usuarios: 1o clique restaura o registro e esvazia a senha | VERIFICADO | `Users#restaura os valores do registro e esvazia a senha no primeiro clique`; snapshot nasce com `password: ''` (`users.ts:87,91`) |
| 15 | Usuarios: so senha digitada ja e alteracao pendente | VERIFICADO | `Users#trata a senha digitada como unica alteracao pendente` (senha volta vazia, titulo continua "Editar usuario") |
| 16 | Perfis: 1o clique restaura nome e matriz | VERIFICADO | `Profiles#restaura nome e matriz de permissoes no primeiro clique` — cobre os dois sentidos (desmarcou `Lancamentos.create` e voltou marcado; marcou `Usuarios.edit` e voltou desmarcado); copia profunda em `profiles.ts:75,83,102-104` |
| 17 | Perfis: um unico checkbox ja e alteracao pendente | VERIFICADO | `Profiles#trata um unico checkbox como alteracao pendente` (titulo continua "Editar perfil") |
| 18 | Apos o 1o clique o formulario continua em edicao | VERIFICADO | assercao de titulo nos tres testes de restauracao: `categories.spec.ts:149`, `users.spec.ts:182`, `profiles.spec.ts:152` — e `cancel()` faz `return` antes de mexer em `editingId` (`categories.ts:67-70`, `users.ts:99-102`, `profiles.ts:81-85`) |
| 19 | Cancelar + Salvar envia `PUT /{recurso}/{id}` do mesmo id | VERIFICADO | `Categories#salva com PUT do mesmo id apos restaurar os valores`, `Users#...`, `Profiles#...` — os tres conferem metodo `PUT`, a URL com o id em edicao e o corpo com os valores originais |
| 20 | Usuarios: restaurar tambem limpa mensagens do backend | VERIFICADO | `Users#limpa as mensagens de validacao ao restaurar e ao sair da edicao` (1a parte); `users.ts:96-97` limpa `fieldErrors` e chama `dismissError()` antes de decidir o estagio |
| 21 | Sem alteracao pendente, o 1o clique ja sai da edicao | VERIFICADO | `Categories#sai da edicao ja no primeiro clique quando nao ha alteracao pendente` + testes equivalentes em `Users` e `Profiles` (titulo volta para "Nova categoria"/"Novo usuario"/"Novo perfil" e formulario em branco) |
| 22 | Categorias: dois cliques (restaura, depois sai) | VERIFICADO | `Categories#restaura os valores originais no primeiro clique e mantem a edicao` (1o clique) + `Categories#sai da edicao no segundo clique, com o formulario em branco` (estado final: "Nova categoria", nome vazio, Despesa, `#2f7d62`, icone vazio, Ativo) |
| 23 | Usuarios: dois cliques (restaura, depois sai) | VERIFICADO | `Users#sai da edicao no segundo clique, com o formulario em branco` (checa "Editar usuario" apos o 1o clique e "Novo usuario" + campos vazios apos o 2o); senha vazia no 1o clique por `Users#restaura os valores do registro e esvazia a senha no primeiro clique` |
| 24 | Perfis: dois cliques (restaura, depois zera a matriz) | VERIFICADO | `Profiles#sai da edicao no segundo clique, zerando a matriz` (1o clique: perfil carregado de volta + "Editar perfil"; 2o: "Novo perfil", nome vazio, todos os checkboxes desmarcados) |
| 25 | Apos sair da edicao, Salvar envia `POST` | VERIFICADO | `Categories#salva com POST apos sair da edicao`, `Users#...`, `Profiles#...` (metodo `POST` na URL de colecao, sem id) |
| 26 | Usuarios: mensagens limpas apos sair da edicao | VERIFICADO | `Users#limpa as mensagens de validacao ao restaurar e ao sair da edicao` (2a parte: `.field-error` = 0 e `.status-bar` ausente com o titulo ja em "Novo usuario") |
| 27 | Lancamentos permanece de estagio unico | VERIFICADO | `Transactions#nao dispara requisicao ao cancelar e mantem o estagio unico` (dois cliques seguidos, sempre "Novo lancamento" e formulario inicial); `transactions.html:6` — o titulo do formulario e fixo, nao ha `editingId()` no form de criacao; `clearTransactionForm()` (`transactions.ts:93-96`) nao toca `editingId`/`requestExit()` |
| 28 | Nenhuma requisicao HTTP ao clicar em "Cancelar" | VERIFICADO | todos os testes de "Cancelar" dos 4 specs terminam com `httpMock.expectNone(() => true)` e os 4 arquivos tem `httpMock.verify()` no `afterEach` — cobre criacao, restauracao e saida da edicao; em Lancamentos o dropdown volta pelo cache `categoriesByType` (`transactions.ts:95,98-102`), sem `GET /categories?type=` |
| 29 | Tabela lateral inalterada nas 4 telas | VERIFICADO | verificacao estatica: as tabelas leem os signals `categories()`/`users()`/`profiles()`/`transactions()`, que so sao escritos dentro de `refresh()` de cada service (`category.service.ts:13`, `user.service.ts:28`, `profile.service.ts:18`, `transaction.service.ts:13`), sempre precedido de HTTP — e o criterio 28 prova que o clique nao faz HTTP. `cancel()`/`clearTransactionForm()` so escrevem em `form`/`name`/`permissions`/`editingId`/`fieldErrors`/`error`/`filteredCategories`; `edit()` copia os objetos (`{ ...existing }`), entao nao ha alias mutavel para os registros da lista |
| 30 | `backend/` intocado e `./mvnw test` verde | NAO ATENDIDO | `./mvnw test` passa (exit 0). Mas `backend/` **nao** esta intocado no working tree desta branch: `backend/src/main/resources/application.properties` (modificado) e `backend/src/main/resources/db/migration/V10__rotate_seeded_user_passwords.sql` (**migration Flyway nova, nao rastreada**). Ver "Achado fora dos criterios" |

## Achado fora dos criterios (bloqueia o commit, nao a feature)

O working tree da branch `feature/issue-28-botao-cancelar-cadastros` contem, **alem** da feature, um conjunto de mudancas de rotacao de credenciais que nao tem nenhuma relacao com o botao "Cancelar" e nao aparece em `plan.md`/`tasks.md`/`implementation-notes.md`:

- `backend/src/main/resources/db/migration/V10__rotate_seeded_user_passwords.sql` (novo) — troca o hash da senha de `dev@financeos.local`.
- `backend/src/main/resources/application.properties` — `POSTGRES_PASSWORD` sem valor padrao.
- `docker-compose.yml` — `${POSTGRES_PASSWORD:?...}` nos dois services.
- `.env.example`, `.gitignore`, `README.md` — instrucoes/segredos.
- `frontend/src/app/core/services/auth.service.spec.ts` — senha literal trocada por `'senha-de-teste'`.

Os arquivos foram alterados entre 09:48 e 09:50 de 25/07/2026 (a branch foi criada as 09:38 e a implementacao da feature terminou as 09:49), ou seja, em paralelo a esteira. O conteudo confirma que nao foram produzidos pela implementacao do botao. Ainda assim, como **nada esta commitado** e `/pipeline:open-pr` comita o working tree, esse pacote entraria no PR da issue #28 — misturando uma rotacao de segredo com uma mudanca de UI e violando o criterio 30 literalmente ("nem migration Flyway").

Consequencia pratica ja visivel no ambiente local: o backend em execucao esta na versao **v10** do Flyway (`docker logs financeos-backend`), entao a senha antiga do usuario `dev@financeos.local` que estava no README **nao vale mais** — use a senha que voce definiu ao rotacionar, ou o `super_admin`.

## Roteiro de validacao manual

Os 29 criterios de UI ja estao verificados por teste de componente rodando sobre os templates reais. O roteiro abaixo e a confirmacao na tela (aparencia e sensacao de uso), que os testes de DOM nao cobrem: posicionamento visual do botao e ausencia de requisicoes na aba Network.

1. Abra `http://localhost` e entre com um usuario de acesso total (perfil "Administrador" ou `super_admin`). Se o login falhar com a senha antiga do README, e por causa da migration `V10` citada acima. Abra o DevTools (F12) na aba **Network** e deixe aberto durante todo o roteiro. Esperado ao final de cada clique em "Cancelar": **nenhuma nova requisicao** para `localhost:8080`. (criterios 28, 6)
2. Va em **Cadastros > Categorias**. Confira que o formulario "Nova categoria" mostra "Cancelar" ao lado direito de "Salvar", mesma largura, sem quebra de linha. Preencha Nome, mude Tipo para "Receita", troque a Cor e o Icone, mude Situacao para "Inativo" e clique em "Cancelar". Esperado: nome vazio, Tipo "Despesa", cor de volta ao verde padrao (`#2f7d62`), icone vazio, Situacao "Ativo", titulo continua "Nova categoria"; a tabela "Ultimos registros" a direita mantem a mesma contagem. (criterios 1, 5, 8, 29)
3. Ainda em Categorias, clique em "Editar" numa categoria existente, altere Nome e Tipo e clique em "Cancelar". Esperado: os valores originais da categoria voltam e o titulo continua "Editar categoria". Clique em "Cancelar" de novo. Esperado: titulo volta para "Nova categoria" e o formulario fica em branco. (criterios 13, 18, 21, 22)
4. Repita o teste do item 3 em **Cadastros > Usuarios**, com uma diferenca: no modo de edicao digite **apenas** uma senha, sem tocar em mais nada, e clique em "Cancelar". Esperado: o campo Senha esvazia e o titulo continua "Editar usuario"; um segundo clique sai da edicao para "Novo usuario". (criterios 2, 14, 15, 23)
5. Ainda em Usuarios, em modo de criacao, digite um e-mail invalido (ex.: `abc`) e uma senha curta (ex.: `123`), clique em "Salvar" e espere as mensagens vermelhas por campo e a faixa de erro no topo. Clique em "Cancelar". Esperado: mensagens por campo e faixa do topo somem junto com a limpeza dos campos. (criterios 9, 12)
6. Va em **Perfis**. Em modo de criacao, preencha o Nome e marque varias permissoes na matriz; clique em "Cancelar". Esperado: nome vazio e **todos** os 20 checkboxes desmarcados. Depois clique em "Editar" num perfil existente, marque **um unico** checkbox e clique em "Cancelar". Esperado: o checkbox volta ao estado do perfil e o titulo continua "Editar perfil"; um segundo clique volta para "Novo perfil" com a matriz zerada. (criterios 3, 10, 16, 17, 24)
7. Ainda em Perfis (ou em Categorias/Usuarios), entre em "Editar" num registro, altere um campo, clique em "Cancelar" uma vez e em seguida em "Salvar" sem mexer em mais nada. Esperado, na aba Network: um `PUT /api/profiles/{id}` (nao um `POST`), e o registro na lista continua com os valores originais. Repita entrando em "Editar", clicando "Cancelar" ate sair da edicao, preenchendo um registro novo e salvando. Esperado: `POST /api/profiles`. (criterios 19, 25)
8. Va em **Lancamentos**. Confira que o formulario "Novo lancamento" agora tem "Cancelar" ao lado de "Salvar". Mude o Tipo para "Receita" (o dropdown Categoria passa a listar categorias de receita), preencha Data, Descricao e Valor, escolha uma categoria e clique em "Cancelar". Esperado: data volta para hoje, descricao vazia, valor 0, Tipo "Despesa", Status "Pendente", Categoria "Sem categoria" e o dropdown listando de novo as categorias de **Despesa** — sem nenhuma requisicao na aba Network. Clique em "Cancelar" outra vez: nada mais acontece (estagio unico). (criterios 4, 11, 27, 28)
9. Ainda em Lancamentos, confirme que nada do fluxo antigo mudou: o botao "Cancelar" da **linha da tabela** continua cancelando o lancamento (status vai para "Cancelado") e a edicao inline continua com "Salvar"/"Sair" e o modal "Deseja sair sem salvar?". (fora de escopo da issue — checagem de regressao)

## Dados de teste criados

Nenhum. Nenhuma chamada de escrita foi feita a stack local nesta etapa; os testes rodaram com o cliente HTTP mockado. Se voce seguir o roteiro manual, os itens 7 e 9 escrevem no banco (um `PUT`/`POST` de perfil e o cancelamento de um lancamento) — use um perfil descartavel.

## Conclusao

29 de 30 criterios verificados automaticamente (testes de componente sobre os templates reais, todos executados e verdes nesta etapa); 0 dependem exclusivamente de validacao manual — o roteiro acima e confirmacao visual/Network do que ja foi verificado. 1 criterio NAO ATENDIDO.

**A feature nao esta pronta para commit/PR como esta.** O motivo nao e o botao "Cancelar" — a implementacao dele atende a todos os criterios funcionais. O motivo e o criterio 30: o working tree que `/pipeline:open-pr` vai commitar contem arquivos de `backend/` alterados por outro trabalho (rotacao de credenciais), que entrariam no PR da issue #28:

- `backend/src/main/resources/db/migration/V10__rotate_seeded_user_passwords.sql` — migration Flyway nova, explicitamente proibida pelo criterio 30.
- `backend/src/main/resources/application.properties` — `POSTGRES_PASSWORD` sem valor padrao.
- `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`, `frontend/src/app/core/services/auth.service.spec.ts` — o resto do mesmo pacote de credenciais.

Nao ha correcao de codigo a fazer em `/pipeline:implement`: e uma decisao de escopo do commit. Antes de seguir para `/pipeline:open-pr`, decida com o usuario entre (a) commitar a rotacao de credenciais separadamente (commit proprio, de preferencia em outra branch/PR) e deixar o PR da #28 so com os 8 arquivos de `frontend/src/app/features/` + `specs/28-botao-cancelar-cadastros/`, ou (b) aceitar conscientemente o PR misto e registrar isso na descricao. Sem essa decisao, um `git add -A` publica uma rotacao de segredo dentro de um PR intitulado "botao de cancelar".
