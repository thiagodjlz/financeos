# Notas de implementacao

Branch: `feature/issue-77-exclusao-categorias-permissao` (base: `main`; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 12 de 13 concluidas (ver `plan.md`; T13 e o ajuste pos-validacao); T12 fica aberta — ver "Desvios".

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/categories/CategoryUsage.java` (novo) — record `(screenLabel, count)`.
- `backend/src/main/java/br/com/financeos/categories/CategoryUsageCheck.java` (novo) — lista de tipos de vinculo (hoje so "Lançamentos", `count("categoryId", id)` sem filtro de usuario/status), `usagesOf(UUID)` e `blockingMessage(List)`.
- `backend/src/main/java/br/com/financeos/categories/CategoryResource.java` — `deactivate` vira `delete`: `findByIdOptional` (404 so para inexistente), 409 com a mensagem do `CategoryUsageCheck`, senao `repository.delete` + 204.
- `backend/src/main/java/br/com/financeos/documentation/content/CategoriesAreaContent.java` — Funcionalidades, Regras, Particularidades e Acoes descrevem a exclusao definitiva e o bloqueio; sai a frase "Excluir ... torná-la Inativa".
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — linha "Excluir" da matriz sem "uma desativação em Categorias".
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — +1 item em Melhorias do bloco `1.0.2`.
- `backend/src/test/java/br/com/financeos/categories/CategoryResourceTest.java` — teste renomeado para `shouldCreateUpdateAndDeleteCategory` + 6 casos novos (CA2, CA3, CA4, CA5, CA6, CA8); limpeza de lancamentos e `planning_items` por prefixo.
- `backend/src/test/java/br/com/financeos/categories/CategoryDeleteSecurityTest.java` (novo) — 403 sem `CATEGORIES/DELETE` (UUIDs `...9e1`/`...9e2`), categoria intacta.
- `backend/src/test/java/br/com/financeos/categories/CategoryUsageCheckTest.java` (novo) — JUnit puro, dois/tres tipos simulados.
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — `shouldDescribeDefinitiveCategoryDeletion`.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — `shouldAnnounceCategoryDeletionAsImprovementIn102`.
- `frontend/src/app/core/services/category.service.ts` — `remove(id)`.
- `frontend/src/app/features/categories/categories.html` — lixeira (SVG 20px, `aria-label`/`title` "Excluir") na linha de leitura e segundo `app-confirm-dialog`.
- `frontend/src/app/features/categories/categories.ts` — `deletingCategory`, `requestDelete`, `cancelDelete`, `confirmDelete`, `deleteMessage`.
- `frontend/src/app/features/categories/categories.scss` — `.row-actions .icon-button` (32px; `var(--touch-target)` ate 480px), so tokens.
- `frontend/src/app/features/categories/categories.spec.ts` — 8 casos novos (CA9 a CA13).
- `frontend/src/app/core/toast/toast-host.scss` — `.toast-message { white-space: pre-line; }`.
- `frontend/src/app/core/toast/toast-host.spec.ts` — mensagem multilinha intacta e mensagem de uma linha inalterada.

## Decisoes

- Mensagem de bloqueio: `"Não é possível excluir a categoria. Ela está em uso em:"` + uma linha por tela `"\nLançamentos: N registros"` (singular "1 registro"). So o total, nada de terceiros (CA5).
- `CategoryUsageCheck` tem um construtor package-private que recebe a lista de tipos (`UsageType(rotulo, ToLongFunction<UUID>)`): e por ele que `CategoryUsageCheckTest` simula mais de um tipo sem Quarkus. O construtor CDI (`@Inject`) monta a lista real.
- Modal: mensagem `Deseja excluir a categoria "<nome>"? A exclusão não pode ser desfeita.`, `confirmLabel="Excluir categoria"`, `cancelLabel="Cancelar"`. O modal fecha ja no clique de confirmar (antes do HTTP), e no 409 a lista nao e recarregada.
- Lixeira com classe propria `icon-button` (borda neutra, icone na cor de despesa, hover `--expense-soft`), sem `ghost-button`/`danger-button`, para nao mexer nos seletores dos specs existentes.
- Exclusao usa `repository.delete(category)`; o `on delete set null` do banco solta subcategoria e `planning_items` (CA6 provado relendo em transacao nova).
- CA13: o `white-space: pre-line` nao se prova em jsdom; os specs provam que o `\n` chega intacto ao `textContent` de `.toast-message` e ao toast. A conferencia visual fica para a etapa 7 (DevTools > Computed).

## Desvios em relacao ao plano

- T12 ficou **desmarcada**: as varreduras rodaram (acentuacao frontend 2 linhas e backend 6, iguais ao baseline; cor literal vazia) e o `npm test` completo passou (31 arquivos, 321 testes), mas a suite completa do backend (`./mvnw test`) nao foi rodada aqui — pelas regras da etapa de implementacao ela e o portao de `/pipeline:quality-check`. No backend rodaram, verdes: `CategoryUsageCheckTest`, `CategoryResourceTest` (23), `CategoryDeleteSecurityTest`, `TransactionResourceTest`, `DocumentationContentTest`, `DocumentationResourceTest`, `ReleaseNotesContentTest`, `ReleaseNotesResourceTest`.
- T9 acrescentou um caso extra: perfil com `canDelete` e sem `canEdit` ve a lixeira sem o "Editar" (gates independentes).

## Ajustes pos-validacao (2026-09-23)

Pedido: corrigir o achado do `verification-report.md` (operacao e recarregamento no mesmo `catch`: operacao ja gravada com `GET` falho aparecia como falha da operacao). Tarefa **T13**.

- `categories.ts` — `save`, `saveEdit` (inclui Situação) e `confirmDelete`: o `catch` cobre so a operacao; gravada, limpa o formulario / sai da edicao, mostra o sucesso e chama `refreshAfterChange()`, que em falha mostra `toast.error(LOAD_FALLBACK)` ("Não foi possível carregar as categorias.") e em 401 nada (o interceptor ja avisa). Texto fixo em vez de `fromHttpError`: num 500 este trocaria por "Erro inesperado...", sem dizer que foi a lista.
- `categories.spec.ts` — 4 casos: excluir, criar e editar OK + `GET` 500 -> sucesso + aviso da lista, sem a falha da operacao; excluir OK + `GET` 401 -> so sucesso.
- Fora do pedido: `confirmExitYes` e Usuarios/Perfis/Lancamentos (mesmo padrao).
- `npm test`: 325 verdes (321 + 4); varredura de acentuacao do front no baseline.
