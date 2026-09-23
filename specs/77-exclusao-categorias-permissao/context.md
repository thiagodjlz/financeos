# Briefing — issue 77

## Regras que restringem esta mudanca

- Todo endpoint comeca com `accessControl.require(Screen.X, Action.Y)`; negado -> 403 com a mensagem generica "Você não tem permissão para realizar esta ação." (sem `Screen`/`Action` no texto). `super_admin` ignora perfis. (`knowledge/auth-and-permissions.md`)
- Regra de negocio so vale se imposta no backend; `can(...)` do front e so gate de UX. (`knowledge/architecture.md`)
- Sem hard delete de registro de negocio, **exceto** onde o dominio decide — perfis sem uso ja sao excluidos de verdade (`DELETE /profiles/{id}` -> 409 "Perfil em uso por usuários." se houver `AppUser` com o perfil). A PA-1 da spec abre a mesma excecao para categoria sem lancamento. (`knowledge/architecture.md`, `knowledge/auth-and-permissions.md`)
- Categorias sao catalogo global (nao filtram por `userId`); transacoes sao por usuario — a contagem de bloqueio **nao** pode usar `listByFilters` (escopado por `userId`). `CANCELED` e so status: o lancamento continua existindo. (`knowledge/categories.md`, `knowledge/transactions.md`)
- `PUT /categories/{id}` usa `findByIdOptional` de proposito (reativacao pelo Situacao); nao mexer. `GET /categories` sem `type` lista ativas e inativas; com `type` so ativas (dropdown de Lancamentos). (`knowledge/categories.md`)
- Toda mensagem passada a `WebApplicationException` vira texto de tela via `BusinessExceptionMapper` (`{"message"}`, status preservado): portugues acentuado, sem tabela/coluna/enum/classe. (`knowledge/backend-patterns.md`)
- Toast: 2xx de escrita -> Sucesso (texto fixo do front); 409 de regra -> Alerta com a `message` do corpo via `toast.fromHttpError(err, fallback)`, nunca classificacao propria. Acao sem HTTP (cancelar modal) nao gera toast. (`knowledge/frontend-ui.md`)
- Confirmacao usa `core/confirm-dialog` (inputs `message`/`confirmLabel`/`cancelLabel`, outputs `confirm`/`cancel`, Esc = cancelar); rotulo de confirmacao nomeia a acao, nunca "Sim"/"Não". Icone de UI = SVG inline 20px (`viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.8"`), sem biblioteca. (`knowledge/frontend-ui.md`)
- `.danger-button` so em botao de linha que descarta ("Sair"); `.row-actions` e utilitario global; ate 480px botao de linha tem alvo `var(--touch-target)`. Nenhuma cor literal fora de `styles.scss` — varredura deve sair vazia: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"`. (`knowledge/frontend-ui.md`)
- Central e Novidades sao escritas a mao: linguagem de usuario, sem identificador tecnico (`DocumentationContentTest`/`ReleaseNotesContentTest` barram `CANCELED`, `Screen.` etc.), paragrafo <= 600 caracteres, sem citar subcategorias (funcionalidade inexistente na UI). Um bloco por `X.Y.Z`; versao corrente `1.0.2`. (`knowledge/documentation.md`)
- CA18 — varreduras de acentuacao, baseline 2 linhas frontend (`styles.scss` 24, 30) e 6 backend (`DashboardResource.java` 41, 85, 124, 125; `ProductionBootstrap.java` 178, 179); nenhuma ocorrencia nova. O regex do backend casa `lancamento`/`periodo` **minusculos** — nao usar identificador Java em portugues; o do front cobre `*.spec.ts` (titulos e fixtures acentuados). (`knowledge/architecture.md`)
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../categories/CategoryResource.java` | `DELETE` = soft delete via `findActiveById` | exclusao fisica com checagem de vinculos, 409/404 |
| `backend/.../categories/CategoryUsage.java`, `CategoryUsageCheck.java` | nao existem | lista de tipos de vinculo + montagem da mensagem |
| `backend/.../transactions/TransactionRepository.java` | filtros sempre por `userId` | so consumido (`count("categoryId", id)`, sem usuario) |
| `backend/.../documentation/content/CategoriesAreaContent.java`, `ProfilesAreaContent.java` | publicam "Excluir = tornar Inativa" | exclusao definitiva + bloqueio |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` | bloco `1.0.2` | +1 item em Melhorias |
| `frontend/src/app/core/services/category.service.ts` | sem `DELETE` | `remove(id)` |
| `frontend/src/app/features/categories/categories.{ts,html,scss}` | so "Editar" na linha | lixeira + modal + handlers |
| `frontend/src/app/core/toast/toast-host.scss` | `.toast-message` colapsa `\n` | `white-space: pre-line` |

FKs para `categories(id)` (todas `on delete set null`, `V1__init.sql`): `transactions.category_id`, `categories.parent_id`, `planning_items.category_id` (sem entidade JPA). Nenhuma migration necessaria.

## Convencoes aplicaveis

- Sem service layer: regra no `Resource`, persistencia no `Repository` (Panache); `ProfileResource.delete` e o modelo (checa uso, 409, `deleteById`).
- Teste de 403 fica em classe **sem** `@TestSecurity` de classe, usuario/perfil com UUID constante inseridos por SQL nativo e removidos no `@AfterEach` (modelo: `DocumentationSecurityTest`; UUIDs `...9a*`–`...9d*` ja usados). (`knowledge/testing.md`)
- Specs de componente dirigem pelo DOM, `httpMock.verify()` no `afterEach`, `httpMock.expectNone(() => true)` para provar ausencia de HTTP; jsdom nao aplica CSS — `white-space` computado nao se prova em teste. (`knowledge/testing.md`)
- Sem comentarios no codigo salvo "porque" nao-obvio.

## Consultas fora do briefing

- Ajuste pos-validacao (T13): o briefing citava o baseline das varreduras de acentuacao, mas nao o regex do frontend — necessario para conferir comentario/titulo novo em `categories.spec.ts`. Achado em `knowledge/architecture.md` (bloco de varreduras, linhas 62-65).
