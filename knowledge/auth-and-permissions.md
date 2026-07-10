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
- `GET /auth/me` retorna `MeResponse(name, email, superAdmin, permissions[])` — fonte de verdade do frontend para esconder/mostrar UI.

## `AccessControl` (`shared/AccessControl.java`) — o gate central

Chamado como `accessControl.require(Screen.X, Action.Y)` na primeira linha de praticamente todo metodo de resource:

- `user.superAdmin == true` -> libera tudo, ignora `ProfilePermission` completamente.
- Caso contrario, busca a `ProfilePermission` do `profileId` do usuario para a `Screen` pedida e checa o flag da `Action`. **Sem linha de permissao para aquela tela = nega** (default e deny, nao allow).
- 403 (`ForbiddenException`) se negado; 401 (`NotAuthorizedException`) se o subject do JWT nao bate com nenhum usuario.
- `effectivePermissions()` (usado por `/auth/me`) sempre retorna as 5 `Screen` (preenche faltantes com deny-all).

**Regra cruzada**: qualquer endpoint novo (backend) precisa comecar chamando `accessControl.require(...)`. Se a mudanca adicionar uma tela nova, precisa adicionar o valor ao enum `Screen` e considerar seed de permissoes numa migration.

## Usuario "super_admin" oculto (V6 + `AppUserRepository`)

- Semeado via SQL (`owner@financeos.internal`), `super_admin=true`, sem `profile_id`.
- `AppUserRepository.listVisible()`/`findVisibleById()` filtram `superAdmin=false` -> esse usuario nunca aparece em `GET /users` nem pode ser editado pela tela de Usuarios, mas funciona normalmente para login e ignora todo `AccessControl`.
- Diferente do perfil "Administrador" (visivel, com todas as permissoes true, atribuido ao usuario dev semeado) — nao confundir os dois.

## Perfis (`profiles/ProfileResource.java`)

- Update de permissoes e sempre **substituicao total**: deleta todas as `ProfilePermission` do perfil e reinsere as enviadas (sem patch parcial).
- **Nao pode excluir perfil em uso**: `DELETE /profiles/{id}` retorna 409 se existir algum `AppUser` com esse `profileId`.
- `resolvePermissions()` sempre devolve as 5 telas (completa gaps com deny-all) — qualquer consumidor da API pode assumir uma matriz completa.

## Frontend (`frontend/src/app/core`)

- `models.ts`: tipos TS (`Screen`, `Action`, `PermissionEntry`, `MeResponse`) espelham os enums/records do backend 1:1.
- `auth.service.ts`: guarda o JWT em `localStorage` (`financeos_token`); `can(screen, action)` replica a mesma logica de `AccessControl` — **e so gate de UX, a autorizacao real e sempre no backend**.
- `auth.guard.ts`: bloqueia rota se nao autenticado.
- `permission.guard.ts`: `permissionGuard(screen, action)` por rota; redireciona para `/dashboard` (nao `/login`) se autenticado mas sem a permissao especifica.
- `auth.interceptor.ts`: injeta `Authorization: Bearer` em tudo exceto `/auth/login`; em qualquer `401`, forca logout + redirect.
