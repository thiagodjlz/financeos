# Briefing — issue 110

## Regras que restringem esta mudanca

- Endpoint novo comeca com `accessControl.require(Screen.X, Action.Y)`; super_admin passa direto; sem linha de permissao = nega; 403 sai com a mensagem generica "Você não tem permissão para realizar esta ação." (`knowledge/auth-and-permissions.md`)
- Tela nova: valor em `Screen`, migration que recria `profile_permissions_screen_check` com a lista completa (nome real em V13/V14; conferir em `pg_constraint` antes do `drop`) e semeia com `insert ... select ... on conflict on constraint profile_permissions_profile_screen_uk do nothing`; view-only entra so em `VIEW_ONLY_SCREENS` do `ProfileResource` (forca `canCreate/canEdit/canDelete=false`). `effectivePermissions()` ja devolve toda `Screen`. (`knowledge/auth-and-permissions.md`, `knowledge/architecture.md`)
- super_admin oculto (`owner@financeos.internal`, id `...0099`) fica fora de lista e de `totalItems` pelo filtro na consulta (`superAdmin = false`). (`knowledge/users.md`)
- `ProductionBootstrap.hasRelatedRows` le do `information_schema` toda FK para `app_users` e, se houver linha, so desativa a conta; sem linha, `purgeSeededAccounts` apaga. Testes apagam usuarios de teste no `@AfterEach` (`DocumentationSecurityTest`). (`knowledge/auth-and-permissions.md`, `knowledge/testing.md`)
- Login: `POST /auth/login` `@PermitAll`, sem `@Transactional`; credencial errada/inativo = 401 "Credenciais inválidas.". Interceptor do front faz logout local em qualquer 401 (toast "Sua sessão expirou. Entre novamente.", exceto em `/auth/login`). (`knowledge/auth-and-permissions.md`)
- Listagem: `PageResponse` + `ListParams.from` (size 1..10), `require` antes dos parametros, filtros por `ListParams.text/uuid/date/enumValue` (malformado = 400 em portugues), texto "contem" sem caixa/acento por `TextSearch`, ordem desempata por `id`; lista para filtro = `GET /<recurso>/options`. (`knowledge/backend-patterns.md`)
- Toda mensagem de `WebApplicationException` vira texto de tela; DTO novo tem `message` em portugues em cada anotacao; campo exibido precisa de rotulo em `FieldLabels`. (`knowledge/backend-patterns.md`)
- Front: listagem com `PagedList` (`initial` = filtro da 1a abertura; `defaults` = alvo de "Limpar filtros"), `filter-panel`, `pagination`, `list-feedback`, Detalhe em `core/record-detail` so com o que a lista trouxe; tabela vira cartao a <=680px pela regra global com `data-label` em todo `<td>`; erro via `toast.fromHttpError`. (`knowledge/frontend-ui.md`)
- Menu: item de secao com `*ngIf` do `can(screen,'VIEW')` no menu **e** no painel "Mais"; `canSeeSettings()` cobre a secao; `entry-route.ts` e o unico lugar da ordem do menu e nao faz requisicao. (`knowledge/auth-and-permissions.md`)
- Central: area nova = `documentation/content/<Area>Content.java` + uma linha em `DocumentationContent.build()`; `DocumentationContentTest` fixa quantidade/titulos. Texto em linguagem de usuario, sem termo tecnico (testes barram API, endpoint, banco, token, JWT...). Item novo no bloco `versao_1_0_3()` de `ReleaseNotesContent`. Texto passa por `.claude/skills/pipeline/revisar-textos/SKILL.md`; commit exige `FINANCEOS_TEXTOS_REVISADOS=1`. (`knowledge/documentation.md`)
- Teste: `@TestSecurity` de classe impede 401/403 → classe separada; usuario/perfil de teste com UUID constante por SQL nativo e limpeza no `@AfterEach`; efeito de outra transacao se le com `QuarkusTransaction.requiringNew()`. Front: requisicao nova num componente quebra a suite inteira dele (`httpMock.verify()`) — ensinar os helpers primeiro. (`knowledge/testing.md`)

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../profiles/Screen.java` | 7 telas | + `AUDIT`, rotulo em portugues por tela |
| `backend/.../profiles/ProfileResource.java` | CRUD de perfis, `VIEW_ONLY_SCREENS` | + `AUDIT` view-only; audita escrita |
| `backend/.../{categories,transactions,users}/*Resource.java` | escrita sem rastro | `@Audited` + `AuditTrail` |
| `backend/.../auth/AuthResource.java` | login/me | eventos de login; `POST /auth/logout` |
| `backend/.../shared/AccessControl.java` | 403 so em log debug | grava "Acesso negado" em transacao propria |
| `backend/.../audit/*` (novo) | — | entidades, writer, interceptor, consulta, eventos |
| `db/migration/V17__create_audit.sql` (novo) | — | tabelas + check + seed |
| `frontend/.../core/entry-route.ts`, `models.ts` | 7 telas | + `AUDIT` apos `PROFILES` |
| `frontend/.../layout/main-layout/*` | menu, "Sair" local | item Auditoria, logout no servidor, rastreio de tela |
| `frontend/.../features/audit/*` (novo) | — | tela de consulta |
| `backend/.../documentation/content/*`, `releasenotes/content/ReleaseNotesContent.java` | 5 areas; bloco 1.0.3 | area Auditoria; item novo |

## Convencoes aplicaveis

- Varreduras de acentuacao (devem sair vazias):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  O regex do backend pega `lancamento`/`periodo` minusculos ate em identificador e `id`. (`knowledge/architecture.md`)
- Cor literal so em `styles.scss`: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` vazia. (`knowledge/frontend-ui.md`)
- Sem comentario salvo "porque" nao-obvio; nunca editar migration commitada. (`knowledge/architecture.md`)
- Toda regra imposta no back-end; o front so espelha. (`knowledge/architecture.md`)

## Consultas fora do briefing

Nenhuma ate agora.
