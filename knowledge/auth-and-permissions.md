# Autenticacao e permissoes

Fontes: `backend/src/main/java/br/com/financeos/{auth,profiles,shared,users}`, migrations V5/V6, `frontend/src/app/core/{guards,services/auth.service.ts}`.

## Modelo

- `AppUser` (`users/AppUser.java`): `id, name, email(unico), passwordHash, active, profileId, superAdmin, createdAt, updatedAt`.
- `Profile` (`profiles/Profile.java`): `id, name, active` — representa um perfil/papel.
- `ProfilePermission`: linha por `(profileId, screen)` com flags `canView/canCreate/canEdit/canDelete`. Unique `(profile_id, screen)` (V5).
- `Screen` enum: `DASHBOARD, TRANSACTIONS, CATEGORIES, USERS, PROFILES` (`ACCOUNTS`/`CARDS` removidos na issue #20, junto com a remocao completa de Contas/Cartoes do sistema — ver `knowledge/accounts.md`/`knowledge/cards.md`).
- `Action` enum (`shared/Action.java`): `VIEW, CREATE, EDIT, DELETE`.

## Login e JWT (`auth/AuthResource.java`)

- `POST /auth/login` (`@PermitAll`): valida `active=true` + bcrypt, emite JWT (`subject=user.id`, `upn=email`, TTL 12h). O issuer **nao e mais constante no codigo**: sai de `mp.jwt.verify.issuer` (default `https://financeos.local/issuer`, sobrescrito por `JWT_ISSUER`), lido por `@ConfigProperty` no proprio `AuthResource` — assinatura e verificacao precisam do mesmo valor, entao ha um unico lugar para muda-lo. **Sem roles/claims de permissao no token** — permissao e sempre resolvida no servidor, a cada request.
- Credencial errada continua respondendo **401**, agora com corpo (`{"message":"Credenciais inválidas."}`) e com `LoginRequest` validado em portugues acentuado. Na tela isso e um **Alerta**, nao uma Falha (decisao do usuario na issue #39: senha errada nao e bug do sistema, e erro que ele corrige redigitando) — ver a taxonomia em `knowledge/architecture.md`.
- `GET /auth/me` retorna `MeResponse(name, email, superAdmin, permissions[])` — fonte de verdade do frontend para esconder/mostrar UI.

## `AccessControl` (`shared/AccessControl.java`) — o gate central

Chamado como `accessControl.require(Screen.X, Action.Y)` na primeira linha de praticamente todo metodo de resource:

- `user.superAdmin == true` -> libera tudo, ignora `ProfilePermission` completamente.
- Caso contrario, busca a `ProfilePermission` do `profileId` do usuario para a `Screen` pedida e checa o flag da `Action`. **Sem linha de permissao para aquela tela = nega** (default e deny, nao allow).
- 403 (`ForbiddenException`) se negado; 401 (`NotAuthorizedException`) se o subject do JWT nao bate com nenhum usuario.
- **A mensagem do 403 e generica e em portugues** (`ACCESS_DENIED_MESSAGE = "Você não tem permissão para realizar esta ação."`, issue #39): desde que existe o `BusinessExceptionMapper`, essa mensagem e serializada e chega ao usuario, entao ela nao pode carregar `Screen`/`Action`, que sao nomes de enum em ingles. O par tela+acao nao se perdeu — foi para o log do servidor (`LOG.debugf("Acesso negado para o usuario %s: %s em %s", ...)`, unico logger explicito do projeto, em nivel `debug` de proposito: acesso negado e rotineiro numa UI guiada por permissao).
- `effectivePermissions()` (usado por `/auth/me`) sempre retorna as 5 `Screen` (preenche faltantes com deny-all).

**Regra cruzada**: qualquer endpoint novo (backend) precisa comecar chamando `accessControl.require(...)`. Se a mudanca adicionar uma tela nova, precisa adicionar o valor ao enum `Screen` e considerar seed de permissoes numa migration.

## Usuario "super_admin" oculto (V6 + `AppUserRepository`)

- Semeado via SQL (`owner@financeos.internal`), `super_admin=true`, sem `profile_id`.
- `AppUserRepository.listVisible()`/`findVisibleById()` filtram `superAdmin=false` -> esse usuario nunca aparece em `GET /users` nem pode ser editado pela tela de Usuarios, mas funciona normalmente para login e ignora todo `AccessControl`.
- Diferente do perfil "Administrador" (visivel, com todas as permissoes true, atribuido ao usuario dev semeado) — nao confundir os dois.

## Travas de ambiente de producao (`bootstrap/ProductionBootstrap.java`)

O ambiente local e o de producao rodam o **mesmo perfil Quarkus (`prod`)** — o que separa os dois e a config `financeos.deployment` (`FINANCEOS_DEPLOYMENT`, default `local`). Com o valor `production`, um observer de `StartupEvent` roda **depois das migrations** e, antes de qualquer request:

- **Exige chave RSA propria.** `JWT_PRIVATE_KEY_LOCATION`/`JWT_PUBLIC_KEY_LOCATION` precisam apontar para arquivos legiveis fora do classpath. Sem isso o backend **nao sobe**: a chave do classpath e a que foi gerada na maquina de quem desenvolve e pode ter sido copiada para a imagem durante o build — nao pode assinar token de producao.
- **Exige um administrador vindo do ambiente.** `FINANCEOS_ADMIN_EMAIL` + `FINANCEOS_ADMIN_PASSWORD` (minimo 12 caracteres) sao obrigatorios; o e-mail e normalizado (`trim` + minusculas). O usuario e criado se nao existir e tem senha **e nome** reaplicados a cada subida, sempre com `superAdmin = true` e `active = true` — e por isso que trocar a variavel e reiniciar e a forma de recuperar acesso perdido. O nome e a constante `ADMIN_NAME = "Administrator"` e vale tambem para usuario preexistente (antes so era gravado na criacao, entao um `owner@financeos.internal` ja semeado continuava "System Owner"). Trocar o e-mail **nao** renomeia nem remove a conta anterior: o upsert so alcanca o e-mail atual.
- **E-mail recomendado: `owner@financeos.internal`** (valor que o `.env.prod.example` ja traz). O e-mail e so identificador de login — nao ha envio de mensagem —, entao um endereco pessoal ali so expoe quem administra a instancia. Apontar para o e-mail da conta de bootstrap semeada pela V6 tambem a reaproveita: o upsert troca o hash publicado pelo do `.env` **antes** da varredura abaixo, e ela deixa de ser uma conta exposta.
- **Desativa as contas cujo hash foi publicado.** O repositorio e publico, entao os hashes bcrypt semeados pelas migrations V3/V6/V10 sao de conhecimento geral e ficam sujeitos a ataque offline. Toda conta que ainda carregue um deles (`dev@financeos.local`, `owner@financeos.internal`) recebe `active = false` e um hash aleatorio. A comparacao e **por hash, nao por e-mail**: quem ja trocou a senha pelo `psql` nao e afetado, e o administrador definido no ambiente nunca e alcancado (ele e gravado antes da varredura).

A operacao inteira e idempotente — na segunda subida nao ha nada a desativar e nenhum usuario a criar. Em `local` o observer retorna na primeira linha, entao a stack Docker de desenvolvimento e a esteira continuam com as contas semeadas intactas.

**Regra cruzada**: migration nova que semeie usuario com hash fixo precisa ter esse hash acrescentado a `SEEDED_PASSWORD_HASHES` — senao a conta sobrevive ativa num ambiente exposto.

## Perfis (`profiles/ProfileResource.java`)

- `ProfileRequest`: `name` `@NotBlank` ("O nome é obrigatório.") e `permissions` `@NotEmpty` — os dois obrigatorios no `POST` e no `PUT`. A issue #45 confirmou o `@NotEmpty` de `permissions` (DEC-3): "somente o nome e obrigatorio" ali trata do que entra no alerta e no destaque de campo, nao da API; a UI sempre envia a matriz completa. Consequencia pratica: a matriz de permissoes **nao recebe destaque de campo invalido** na tela — uma violacao em `permissions[...]` aparece so no toast de Alerta.
- Update de permissoes e sempre **substituicao total**: deleta todas as `ProfilePermission` do perfil e reinsere as enviadas (sem patch parcial).
- **Nao pode excluir perfil em uso**: `DELETE /profiles/{id}` retorna 409 ("Perfil em uso por usuários.") se existir algum `AppUser` com esse `profileId` — a mensagem chega no corpo e a tela a exibe como Alerta; criar/editar/excluir com 2xx dispara toast de Sucesso.
- `resolvePermissions()` sempre devolve as 5 telas (completa gaps com deny-all) — qualquer consumidor da API pode assumir uma matriz completa.
- Frontend (`features/profiles/`): o botao "Cancelar" da tela (issue #28) segue o padrao comum dos formularios de cadastro (dois estagios em edicao, sem HTTP — ver `knowledge/architecture.md`), com duas particularidades: a comparacao de alteracao pendente cobre **nome + matriz de permissoes inteira** (um unico checkbox marcado/desmarcado ja conta), e o snapshot do registro em edicao usa **copia profunda** (`clonePermissions()`) na captura e na restauracao — os checkboxes usam `[(ngModel)]` mutando os objetos de `permissions`, entao com referencia compartilhada o snapshot mudaria junto e a deteccao de alteracao nunca dispararia. Desde a issue #35 a matriz e desenhada como **switch** (trilho + knob deslizante) e o layout da tela inverteu (formulario/matriz a esquerda, lista de perfis numa coluna de 320px a direita), mas o controle real continua sendo o `<input type="checkbox" [(ngModel)]="permission.canX">` dentro de um `<label class="perm-switch">` com rotulo acessivel por celula — teclado, `[(ngModel)]` e o payload `canView/canCreate/canEdit/canDelete` inalterados (ver `knowledge/architecture.md`). Desde a issue #45 o campo Nome recebe o **destaque de campo invalido** do padrao comum (classe `invalid` + legenda `field-error` + foco), limpo ao digitar e nos **dois** estagios do Cancelar; o `FieldErrorState` da tela conhece so o campo `name`, e e esse filtro que mantem uma violacao de `permissions[0].screen` fora do destaque.

## Frontend (`frontend/src/app/core`)

- `models.ts`: tipos TS (`Screen`, `Action`, `PermissionEntry`, `MeResponse`) espelham os enums/records do backend 1:1.
- `auth.service.ts`: guarda o JWT em `localStorage` (`financeos_token`); `can(screen, action)` replica a mesma logica de `AccessControl` — **e so gate de UX, a autorizacao real e sempre no backend**.
- Menu lateral (`layout/main-layout/`): itens de nivel superior "Resumo" e "Lancamentos" e dois grupos expansiveis, na ordem **"Cadastros"** (subitem "Categorias" — grupo reintroduzido na issue #37, quando "Categorias" deixou de ser item de primeiro nivel) e **"Configuracoes"** (subitens "Usuarios" e "Perfis", agrupados na issue #33). Os grupos funcionam em **acordeao** (no maximo um aberto por vez, issue #37 — ver `knowledge/architecture.md`) e sao **agrupadores visuais, sem `Screen` propria**: cada subitem tem `*ngIf` com o `can(screen, 'VIEW')` da sua tela e o grupo so renderiza se ao menos um subitem for visivel (`canSeeRegisters()` = `CATEGORIES/VIEW`; `canSeeSettings()` = `USERS/VIEW || PROFILES/VIEW`); sem nenhuma permissao dos filhos, o grupo inteiro some. Isso continua sendo so espelho de UX — as rotas seguem protegidas pelo `permissionGuard` e a API pelo `AccessControl`. Tela nova que entrar num grupo do menu segue esse padrao (nao criar `Screen` para o agrupador).
- `auth.guard.ts`: bloqueia rota se nao autenticado.
- `permission.guard.ts`: `permissionGuard(screen, action)` por rota; redireciona para `/dashboard` (nao `/login`) se autenticado mas sem a permissao especifica, exibindo antes um toast de **Alerta** ("Você não tem permissão para acessar esta tela.") — texto fixo do front porque nesse caso nao ha resposta HTTP nenhuma, so o redirect. Nao confundir com o 403 de endpoint, cuja mensagem vem do `AccessControl`: os dois textos convivem descrevendo situacoes diferentes (abrir uma tela x executar uma acao).
- `auth.interceptor.ts`: injeta `Authorization: Bearer` em tudo exceto `/auth/login`; em qualquer `401`, forca logout + redirect e re-lanca o erro. Desde a issue #39 tambem exibe um toast de **Alerta** ("Sua sessão expirou. Entre novamente.") — **exceto** quando o 401 veio do proprio `/auth/login`, que e avisado pela tela de login.
