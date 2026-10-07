# Auditoria

Leia quando a issue acrescentar endpoint de escrita, tipo de evento, tela nova ou mexer em login/logout/permissao. Tela "Auditoria" (`Screen.AUDIT`, menu "Configurações", após Perfis) criada na issue #110.

## Modelo (`V17__create_audit.sql`, pacote `audit/`)

- `audit_records` (uma linha por registro) + `audit_record_changes` (campo/anterior/novo, `position`). Linha guarda o **usuario do momento** (`user_id`, `user_name`, `user_email`, `user_super_admin`) e o **rotulo do registro do momento** (`record_id`, `record_label`): renomear ou excluir a conta/registro nao muda o que foi gravado.
- **Sem FK para `app_users` de proposito** (so `audit_record_changes -> audit_records`, sem cascade): com FK, `ProductionBootstrap.hasRelatedRows` passaria a so desativar conta semeada com auditoria e os `@AfterEach` que apagam usuario de teste quebrariam. Imutavel: entidades `@Immutable`, nenhum endpoint de manutencao (`PUT`/`DELETE /audit` = 405), sem expurgo.
- `event_type`, `action` e `screen` sao texto **sem check**: tipo novo entra so no enum Java (`AuditEventType`, `AuditAction`, cada um com `label()` em portugues), sem migration. A consulta devolve `typeLabel`/`actionLabel`/`screenLabel` prontos (codigo desconhecido sai pelo proprio codigo) e a tela exibe sem mapa proprio. `Screen` ganhou `label()` ("Resumo", "Lançamentos"...).

## Alteracao: endpoint de escrita novo audita (obrigatorio)

- Todo `@POST/@PUT/@DELETE/@PATCH` de `*Resource` leva **`@Audited`** e chama **`AuditTrail.created/updated/deleted(screen, id, rotulo, valores)`** depois das validacoes. `AuditCoverageTest` varre `target/classes` e falha se faltar a anotacao; excecao so para quem grava **evento** (`AuthResource.login/logout`, `AuditResource.screenAccess` — lista `EVENT_ENDPOINTS` do teste).
- `AuditInterceptor` (prioridade `APPLICATION`, dentro do `@Transactional`) captura o usuario **antes** do metodo e lanca `IllegalStateException` se o metodo retornar sem chamar o `AuditTrail` (500 + rollback). `AuditWriter.writeChange` e `MANDATORY`: registro e operacao na mesma transacao — recusa 400/404/409 nao grava, falha da auditoria desfaz a operacao.
- Valores por `AuditValues` (rotulo -> texto legivel: `text`, `yesNo` "Sim/Não", `money` "R$ 1.234,56", `date` dd/MM/yyyy, `number`); referencia a outro cadastro grava o **nome** (categoria, pai, perfil). Inclusao/exclusao omitem campo nulo; alteracao grava so o que mudou (PUT sem mudanca = Alteracao sem campos). **Nunca senha nem hash** (troca so de senha = Alteracao sem campos). Snapshot do "antes" e tirado antes do `apply`; `@Formula` (nome da categoria/perfil) da o valor anterior, o novo vem da entidade ja validada.
- Casos fixados: `DELETE /users/{id}` = Alteracao "Ativo" Sim -> Não; Perfis = "Nome" + uma linha "Permissões: <tela>" ("Ver, Incluir, Alterar, Excluir" ou "Sem acesso"), na alteracao so as telas que mudaram.

## Eventos (transacao propria, `AuditWriter.writeEvent` em `requiringNew`)

- Persistem apesar do 401/403. Tipo novo de evento: valor no `AuditEventType` + chamada a `writeEvent` no emissor; "Impressão" (`PRINT`) existe sem emissor.
- `LOGIN`/`LOGIN_FAILED` (`AuthResource`): a falha grava o **e-mail digitado** (sem senha), vinculado a conta se o e-mail existir; 400 de campos vazios nao e tentativa e nao grava. Consequencia: qualquer `curl`/teste manual de login contra a stack local deixa registro imutavel no banco do usuario. `LOGOUT`: `POST /auth/logout` (`@Authenticated`, sem `require` — como o `/me`; `@Consumes(WILDCARD)` porque o POST vazio do front nao manda Content-Type), chamado pelo "Sair" (`AuthService.signOut`) **antes** de descartar o token; o logout forcado pelo 401 do interceptor nao chama.
- `ACCESS_DENIED`: o proprio `AccessControl.require` grava (tela + `AuditAction.of(action)`) antes do 403.
- `SESSION_EXPIRED`: `ExpiredSessionAuditor` (`@ObservesAsync AuthenticationFailureEvent` + `@ActivateRequestContext`; o evento chega na thread de I/O) grava quando a cadeia de causas tem `InvalidJwtException.hasExpired()` — o jose4j confere a assinatura antes das claims, entao o `sub` e confiavel. Token malformado/assinatura invalida nao gera evento. Requisicoes paralelas com o token vencido geram um evento cada.
- `SCREEN_ACCESS`: `POST /audit/screen-access {screen}` comeca com `require(<tela>, VIEW)` (sem a permissao = 403 + Acesso negado); tela invalida = 400 "A tela informada é inválida." (`InvalidFormatExceptionMapper`). Front: `core/screen-access-tracker.ts`, provido pelo `MainLayout` (login novo zera o estado), registra so quando muda o **primeiro segmento** da rota (`screenForUrl` em `entry-route.ts`); cadastro/detalhe da mesma tela, aba e paginacao nao geram evento.

## Consulta (`GET /audit`, `GET /audit/options`)

- `require(AUDIT, VIEW)` (view-only em Perfis; seed so no "Administrador"). Paginada no padrao de [backend-patterns.md](backend-patterns.md); filtros `startDate`/`endDate` lidos no fuso `timeZone` (o front manda o do navegador; padrao `America/Sao_Paulo`), `user` (nome **ou** e-mail, `TextSearch`, independe de `USERS/VIEW`), `type`, `action`, `screen`; inicial > final = 400; sem periodo = tudo; ordem `occurredAt desc, id desc`.
- **Registros do `super_admin` sao gravados mas nunca devolvidos** (nem no `totalItems`, nem para ele): filtro na consulta por `user_super_admin` do momento **e** por quem e super_admin hoje.
- Tela `features/audit`: `initial` = hoje-30..hoje, `defaults` vazios ("Limpar filtros" = tudo); opcoes de Tipo/Ação/Funcionalidade vindas de `/audit/options` (ate 9 itens), como `select.filter-select` no desktop e grupos de botoes no painel do celular (padrao em [frontend-ui.md](frontend-ui.md)); Detalhe com tabela Campo/Anterior/Novo; data por `dateTimeLabel` (fuso do navegador). Cor de Categoria aparece no detalhe como codigo hexadecimal (aceito na validacao da #110).
