# Autenticacao e permissoes

Fontes: `backend/src/main/java/br/com/financeos/{auth,profiles,shared,users}`, migrations V5/V6, `frontend/src/app/core/{guards,services/auth.service.ts}`.

## Modelo

- `AppUser` (`users/AppUser.java`): `id, name, email(unico), passwordHash, active, profileId, superAdmin, createdAt, updatedAt`.
- `Profile` (`profiles/Profile.java`): `id, name, active` — representa um perfil/papel.
- `ProfilePermission`: linha por `(profileId, screen)` com flags `canView/canCreate/canEdit/canDelete`. Unique `(profile_id, screen)` (V5).
- `Screen` enum: `DASHBOARD, TRANSACTIONS, CATEGORIES, USERS, PROFILES` (`ACCOUNTS`/`CARDS` removidos na issue #20, junto com a remocao completa de Contas/Cartoes do sistema — ver `knowledge/accounts.md`/`knowledge/cards.md`).
- `Action` enum (`shared/Action.java`): `VIEW, CREATE, EDIT, DELETE`.

## Login e JWT (`auth/AuthResource.java`)

- `POST /auth/login` (`@PermitAll`): valida `active=true` + bcrypt, emite JWT (issuer `https://financeos.local/issuer`, `subject=user.id`, `upn=email`, TTL 12h). **Sem roles/claims de permissao no token** — permissao e sempre resolvida no servidor, a cada request.
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

## Perfis (`profiles/ProfileResource.java`)

- Update de permissoes e sempre **substituicao total**: deleta todas as `ProfilePermission` do perfil e reinsere as enviadas (sem patch parcial).
- **Nao pode excluir perfil em uso**: `DELETE /profiles/{id}` retorna 409 ("Perfil em uso por usuários.") se existir algum `AppUser` com esse `profileId` — a mensagem chega no corpo e a tela a exibe como Alerta; criar/editar/excluir com 2xx dispara toast de Sucesso.
- `resolvePermissions()` sempre devolve as 5 telas (completa gaps com deny-all) — qualquer consumidor da API pode assumir uma matriz completa.
- Frontend (`features/profiles/`): o botao "Cancelar" da tela (issue #28) segue o padrao comum dos formularios de cadastro (dois estagios em edicao, sem HTTP — ver `knowledge/architecture.md`), com duas particularidades: a comparacao de alteracao pendente cobre **nome + matriz de permissoes inteira** (um unico checkbox marcado/desmarcado ja conta), e o snapshot do registro em edicao usa **copia profunda** (`clonePermissions()`) na captura e na restauracao — os checkboxes usam `[(ngModel)]` mutando os objetos de `permissions`, entao com referencia compartilhada o snapshot mudaria junto e a deteccao de alteracao nunca dispararia. Desde a issue #35 a matriz e desenhada como **switch** (trilho + knob deslizante) e o layout da tela inverteu (formulario/matriz a esquerda, lista de perfis numa coluna de 320px a direita), mas o controle real continua sendo o `<input type="checkbox" [(ngModel)]="permission.canX">` dentro de um `<label class="perm-switch">` com rotulo acessivel por celula — teclado, `[(ngModel)]` e o payload `canView/canCreate/canEdit/canDelete` inalterados (ver `knowledge/architecture.md`).

## Frontend (`frontend/src/app/core`)

- `models.ts`: tipos TS (`Screen`, `Action`, `PermissionEntry`, `MeResponse`) espelham os enums/records do backend 1:1.
- `auth.service.ts`: guarda o JWT em `localStorage` (`financeos_token`); `can(screen, action)` replica a mesma logica de `AccessControl` — **e so gate de UX, a autorizacao real e sempre no backend**.
- Menu lateral (`layout/main-layout/`): itens de nivel superior "Resumo" e "Lancamentos" e dois grupos expansiveis, na ordem **"Cadastros"** (subitem "Categorias" — grupo reintroduzido na issue #37, quando "Categorias" deixou de ser item de primeiro nivel) e **"Configuracoes"** (subitens "Usuarios" e "Perfis", agrupados na issue #33). Os grupos funcionam em **acordeao** (no maximo um aberto por vez, issue #37 — ver `knowledge/architecture.md`) e sao **agrupadores visuais, sem `Screen` propria**: cada subitem tem `*ngIf` com o `can(screen, 'VIEW')` da sua tela e o grupo so renderiza se ao menos um subitem for visivel (`canSeeRegisters()` = `CATEGORIES/VIEW`; `canSeeSettings()` = `USERS/VIEW || PROFILES/VIEW`); sem nenhuma permissao dos filhos, o grupo inteiro some. Isso continua sendo so espelho de UX — as rotas seguem protegidas pelo `permissionGuard` e a API pelo `AccessControl`. Tela nova que entrar num grupo do menu segue esse padrao (nao criar `Screen` para o agrupador).
- `auth.guard.ts`: bloqueia rota se nao autenticado.
- `permission.guard.ts`: `permissionGuard(screen, action)` por rota; redireciona para `/dashboard` (nao `/login`) se autenticado mas sem a permissao especifica, exibindo antes um toast de **Alerta** ("Você não tem permissão para acessar esta tela.") — texto fixo do front porque nesse caso nao ha resposta HTTP nenhuma, so o redirect. Nao confundir com o 403 de endpoint, cuja mensagem vem do `AccessControl`: os dois textos convivem descrevendo situacoes diferentes (abrir uma tela x executar uma acao).
- `auth.interceptor.ts`: injeta `Authorization: Bearer` em tudo exceto `/auth/login`; em qualquer `401`, forca logout + redirect e re-lanca o erro. Desde a issue #39 tambem exibe um toast de **Alerta** ("Sua sessão expirou. Entre novamente.") — **exceto** quando o 401 veio do proprio `/auth/login`, que e avisado pela tela de login.
