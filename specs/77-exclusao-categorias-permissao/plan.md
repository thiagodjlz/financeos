# Plano de implementacao

## Abordagem

O `DELETE /api/categories/{id}` deixa de ser soft delete: busca por `findByIdOptional` (404 so para id inexistente, inativa tambem entra), consulta uma lista de tipos de vinculo (`CategoryUsageCheck`, hoje so "Lançamentos", contando `transactions.category_id` de todos os usuarios e status) e, havendo contagem > 0, responde 409 com a mensagem agrupada por tela; sem vinculo, `repository.delete(category)` e o banco aplica o `on delete set null` em subcategorias e `planning_items`. Modelo: `ProfileResource.delete`. Na tela, uma lixeira por linha em leitura (mesmo gate e mesmo `disabled` do "Editar") abre o `confirm-dialog`; o toast passa a preservar quebra de linha. Central, Perfis e Novidades sao reescritos para a regra nova.

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/categories/CategoryUsage.java` (novo) — `record CategoryUsage(String screenLabel, long count)`.
- `backend/src/main/java/br/com/financeos/categories/CategoryUsageCheck.java` (novo, `@ApplicationScoped`) — lista de tipos de vinculo (rotulo + contador `ToLongFunction<UUID>`), hoje `("Lançamentos", id -> transactionRepository.count("categoryId", id))`; `List<CategoryUsage> usagesOf(UUID)`; e `static Optional<String> blockingMessage(List<CategoryUsage>)`: omite contagem zero, vazio -> `Optional.empty()`, senao `"Não é possível excluir a categoria. Ela está em uso em:"` + uma linha por tela (`"\nLançamentos: 3 registros"`, singular "1 registro"). Identificadores em ingles (varredura do backend casa `lancamento` minusculo).
- `backend/src/main/java/br/com/financeos/categories/CategoryResource.java` — `deactivate` vira `delete`: `require(CATEGORIES, DELETE)` na 1a linha, `findByIdOptional` -> 404, `blockingMessage` -> `WebApplicationException(msg, CONFLICT)`, senao `repository.delete(category)` + 204. Injeta `CategoryUsageCheck`.
- `backend/src/main/java/br/com/financeos/documentation/content/CategoriesAreaContent.java` — Funcionalidades (+ excluir definitivamente categoria sem lancamentos), Regras (troca o item "Excluir ... torná-la Inativa" por: exclusao definitiva; bloqueio enquanto houver lancamento de qualquer pessoa, inclusive cancelado, com a quantidade na mensagem; desativar/reativar continua pelo Situação), Ações (+ "Excluir (linha)" com confirmacao). Sem citar subcategorias.
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — linha "Excluir" da tabela sem o trecho "uma desativação em Categorias" (ex.: "a exclusão de categoria sem lançamentos em Categorias, uma desativação em Usuários ...").
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — +1 item em `Kind.IMPROVEMENT` do `1.0.2` (nao em `FIX`: `ReleaseNotesContentTest` fixa `fixes.size() == 2`).
- Testes: `categories/CategoryResourceTest.java` (ajuste + casos novos), `categories/CategoryDeleteSecurityTest.java` (novo), `categories/CategoryUsageCheckTest.java` (novo, JUnit puro), `documentation/DocumentationContentTest.java`, `releasenotes/ReleaseNotesContentTest.java`.

### Frontend
- `frontend/src/app/core/services/category.service.ts` — `remove(id): Promise<void>` (`http.delete`).
- `frontend/src/app/features/categories/categories.html` — na `<tr>` de leitura, apos "Editar": `<button type="button" class="icon-button" aria-label="Excluir" title="Excluir" *ngIf="authService.can('CATEGORIES','DELETE')" [disabled]="editingId() !== null" (click)="requestDelete(category)">` com SVG de lixeira 20px; segundo `<app-confirm-dialog *ngIf="deletingCategory()">` com `message` citando o nome, `confirmLabel="Excluir categoria"`, `cancelLabel="Cancelar"`.
- `frontend/src/app/features/categories/categories.ts` — signal `deletingCategory`, `requestDelete`, `cancelDelete` (sem HTTP), `confirmDelete` (`remove` -> `refresh` -> `toast.success('Categoria excluída com sucesso.')`; `catch` -> `toast.fromHttpError(err, DELETE_FALLBACK)` sem recarregar).
- `frontend/src/app/features/categories/categories.scss` — `.row-actions .icon-button` (32px, so `var(--token)`) + alvo `var(--touch-target)` em `@media (max-width: 480px)`. Classe propria, **nao** `ghost-button`/`danger-button`: os specs atuais contam `tbody button.ghost-button` (linhas 114, 164, 202) e pegam o primeiro `button.danger-button` como "Sair".
- `frontend/src/app/core/toast/toast-host.scss` — `.toast-message { white-space: pre-line; }`. Nenhum outro produtor de mensagem tem `\n` hoje (conferido em `backend/src/main/java` e `frontend/src/app`), entao toasts de uma linha nao mudam.
- Testes: `features/categories/categories.spec.ts`, `core/toast/toast-host.spec.ts`.

### Migration
Nenhuma — as tres FKs para `categories(id)` ja sao `on delete set null` (`V1__init.sql`). Proximo numero livre seria `V15`.

## Tarefas

- [x] **T1** — Criar a estrutura de vinculos: `CategoryUsage` e `CategoryUsageCheck` (lista de tipos, contagem de Lancamentos sem filtro de usuario/status, `blockingMessage`).
  - Arquivos: `categories/CategoryUsage.java`, `categories/CategoryUsageCheck.java`
  - Criterios: 4, 5, 7
- [x] **T2** — Reescrever o `DELETE` de `CategoryResource` como exclusao fisica com 404/409.
  - Arquivos: `categories/CategoryResource.java`
  - Criterios: 1, 2, 3, 4, 6, 8
- [x] **T3** — Teste unitario da mensagem com dois tipos simulados (um com zero omitido, uma linha por tela, sem nome de tabela/coluna/enum/classe) e lista toda zerada -> vazio.
  - Arquivos: `categories/CategoryUsageCheckTest.java`
  - Criterios: 7
- [x] **T4** — Testes de API em `CategoryResourceTest`: 204 + `findByIdOptional` vazio + ausente de `GET /categories` (ativa e inativa); 404 id inexistente; 409 inativa com lancamento; 409 com N lancamentos (categoria e lancamentos inalterados, `message` com "Não é possível excluir a categoria.", "Lançamentos" e N) por chamada direta; CA5 com lancamentos do usuario `...0001` e do `...0099`, um `CANCELED` (criados pelo `TransactionRepository` em `QuarkusTransaction.requiringNew()`), total conferido e mensagem sem descricao/nome/e-mail; CA6 com subcategoria (`parentId`) e `planning_items` (insert nativo, `user_id` `...0001`) -> 204, relendo em transacao nova (`parent_id`/`category_id` nulos). Renomear `shouldCreateUpdateAndDeactivateCategory` para refletir a exclusao. Limpeza por prefixo de descricao/titulo no `@AfterEach`, lancamentos antes das categorias.
  - Arquivos: `categories/CategoryResourceTest.java`
  - Criterios: 2, 3, 4, 5, 6, 8
- [x] **T5** — Classe de seguranca sem `@TestSecurity` de classe: perfil com `CATEGORIES` ver=true/excluir=false (UUIDs `...0000000009e1`/`...9e2`) -> 403 com a mensagem generica e categoria ainda existente e ativa.
  - Arquivos: `categories/CategoryDeleteSecurityTest.java`
  - Criterios: 1
- [x] **T6** — Acrescentar `remove(id)` ao `CategoryService`.
  - Arquivos: `core/services/category.service.ts`
  - Criterios: 12
- [x] **T7** — Lixeira na linha de leitura, modal de confirmacao e handlers de exclusao.
  - Arquivos: `features/categories/categories.html`, `categories.ts`, `categories.scss`
  - Criterios: 9, 10, 11, 12, 13
- [x] **T8** — Preservar quebra de linha no toast e cobrir no spec (mensagem com `\n` chega intacta ao `textContent` de `.toast-message`; mensagem de uma linha inalterada).
  - Arquivos: `core/toast/toast-host.scss`, `core/toast/toast-host.spec.ts`
  - Criterios: 13, 15
- [x] **T9** — Specs de Categorias: lixeira presente com `superAdmin` e com `permissions` so `canView`+`canDelete`; ausente do DOM sem `DELETE` (e com `EDIT` sem `DELETE`); `aria-label`/`title` "Excluir" e `svg[width="20"]`; ausente na linha em edicao e `disabled` nas demais; modal cita o nome e o rotulo "Excluir categoria"; cancelar -> `expectNone` e sem toast; confirmar -> `DELETE` + `GET` + toast Sucesso; 409 -> toast `warning` com a `message` multilinha intacta, sem novo `GET`, linha ainda na tabela. Specs existentes (criar, editar, Sair com modal, Situacao) seguem verdes sem troca de seletor. Titulos/fixtures acentuados.
  - Arquivos: `features/categories/categories.spec.ts`
  - Criterios: 9, 10, 11, 12, 13, 14
- [x] **T10** — Reescrever a area Categorias e a linha "Excluir" de Perfis na Central; teste de conteudo garantindo a ausencia das duas frases antigas e a presenca de exclusao definitiva, bloqueio por lancamentos e Situação.
  - Arquivos: `documentation/content/CategoriesAreaContent.java`, `ProfilesAreaContent.java`, `documentation/DocumentationContentTest.java`
  - Criterios: 16
- [x] **T11** — Item em Melhorias do bloco `1.0.2` sobre a exclusao de categorias e teste que o localiza.
  - Arquivos: `releasenotes/content/ReleaseNotesContent.java`, `releasenotes/ReleaseNotesContentTest.java`
  - Criterios: 17
- [ ] **T12** — Rodar as duas varreduras de acentuacao (baseline 2/6) e a de cor literal (vazia), e as suites completas `./mvnw test` + `npm test` (Dashboard, Lancamentos e demais telas intactos).
  - Arquivos: — (verificacao)
  - Criterios: 14, 15, 18
- [x] **T13** — Ajuste pos-validacao pedido pelo usuario (achado fora dos criterios no `verification-report.md`): separar, em criar/editar (inclui mudar a Situação)/excluir, o erro da operacao do erro do recarregamento da lista; operacao gravada mostra o toast de sucesso e, se so o recarregamento falhar, um aviso proprio "Não foi possível carregar as categorias." — nunca a mensagem de falha da operacao. Specs: exclusao, criacao e edicao com `GET` 500 depois da operacao OK; `GET` 401 sem aviso extra.
  - Arquivos: `features/categories/categories.ts`, `features/categories/categories.spec.ts`
  - Criterios: 12, 14 (ajuste do usuario)

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | 403 sem `CATEGORIES/DELETE`, categoria intacta | T2, T5 |
| 2 | sem lancamento -> 204 e remocao fisica | T2, T4 |
| 3 | inativa com lancamento -> 409; inexistente -> 404 | T2, T4 |
| 4 | N lancamentos -> 409 com mensagem acentuada e N | T1, T2, T4 |
| 5 | N soma todos os usuarios e status | T1, T4 |
| 6 | subcategoria e `planning_items` nao bloqueiam | T2, T4 |
| 7 | lista de tipos, mensagem agrupada por tela | T1, T3 |
| 8 | regra no backend, 409 por chamada direta | T2, T4 |
| 9 | lixeira com `aria-label`/`title`, so com `DELETE` | T7, T9 |
| 10 | some na linha em edicao, `disabled` nas demais | T7, T9 |
| 11 | modal cita o nome; cancelar sem HTTP | T7, T9 |
| 12 | confirmar -> `DELETE`, recarrega, toast Sucesso | T6, T7, T9 |
| 13 | 409 -> Alerta multilinha, categoria continua | T7, T8, T9 |
| 14 | criar/editar/Sair/Situacao seguem funcionando | T9, T12 |
| 15 | Lancamentos, Resumo e toasts de uma linha iguais | T8, T12 |
| 16 | Central sem as frases antigas, com a regra nova | T10 |
| 17 | item no bloco `1.0.2` | T11 |
| 18 | varreduras sem ocorrencia nova | T12 |

## Superficie de validacao

- Criterio 1 — `CategoryDeleteSecurityTest#shouldDenyDeleteWithoutPermission`.
- Criterios 2, 3, 4, 5, 6, 8 — casos novos de `CategoryResourceTest` (T4); na stack, `DELETE /api/categories/{id}` de uma categoria com lancamento -> 409 com `message` em linhas.
- Criterio 7 — `CategoryUsageCheckTest`.
- Criterios 9 a 13 — `categories.spec.ts`; na tela Cadastros > Categorias: lixeira nas linhas, modal, exclusao e bloqueio.
- Criterio 16 — `DocumentationContentTest`; `GET /api/documentation`. Criterio 17 — `ReleaseNotesContentTest`; `GET /api/release-notes`.
- Criterio 18 — saida das duas varreduras comparada ao baseline.

## Validacao manual (etapa 7)

- CA13 — em Categorias, excluir uma categoria usada em lancamento: o toast de Alerta mostra cada linha separada; DevTools > Computed de `.toast-message` = `white-space: pre-line`.
- CA15 — um toast de uma linha qualquer (ex.: salvar categoria) segue igual; dropdown de categoria em Lancamentos e Detalhamento do Resumo sem diferenca para categorias nao excluidas.
- CA9/CA10 visual — lixeira alinhada ao "Editar", a 1440px (colunas nao mudam de largura ao entrar em edicao) e a 390px (modo cartao, alvo de 44px); foco visivel e `Esc` fechando o modal.
- CA14 — criar, editar inline, "Sair" com "Deseja sair sem salvar?" e desativar/reativar pelo Situação na stack.

## Riscos e pontos de atencao

- **Contrato do `DELETE` muda de soft para hard delete** (`knowledge/categories.md`, `architecture.md`): nenhum consumidor de frontend chamava o endpoint; o unico teste afetado e `shouldCreateUpdateAndDeactivateCategory` (segue 204 + 404). `TransactionResourceTest` apaga categorias pelo repositorio e nao passa pelo endpoint.
- **Canal novo de quebra de linha no toast** (`knowledge/frontend-ui.md`): `pre-line` e global ao host; hoje nenhuma mensagem tem `\n`, mas mensagem futura com `\n` passa a quebrar.
- Corrida entre a contagem e o `delete`: um lancamento criado nesse intervalo ficaria com `category_id` nulo pelo `set null`. Janela minima e aceita; nao ha lock no `TransactionResource.validateCategory`.
- `planning_items` nao tem entidade: o teste de CA6 usa SQL nativo e precisa limpar a linha no `@AfterEach`. Releitura do `parent_id` exige transacao nova (o set null e do banco, fora do contexto de persistencia).
- `ReleaseNotesContentTest` fixa 2 correcoes no `1.0.2` — por isso o item entra em Melhorias.

## Lacunas

Nenhuma.
