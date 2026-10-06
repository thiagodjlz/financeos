# Notas de implementacao

Branch: `feature/issue-109-reformulacao-layout` (base: `main`; mudanças não commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 32 de 34 concluídas (ver `plan.md`; T23 parcial e T27 retirada, ver Desvios)

## Arquivos alterados

Backend (`backend/src/...br/com/financeos/`):
- `dashboard/{DashboardResource,DashboardSummaryResponse,CategoryBreakdownResponse,DashboardRepository}.java` — `paidExpensePercent`, `sharePercent`.
- `shared/InvalidFormatExceptionMapper.java` (novo) — 400 em português para valor que não converte.
- `documentation/content/{Summary,Transactions,Categories,Users,Profiles}AreaContent.java`, `OverviewContent.java`; `releasenotes/content/ReleaseNotesContent.java`.
- Testes: `DashboardResourceTest`, `TransactionResourceTest`, `DocumentationContentTest`, `ReleaseNotesContentTest`.

Frontend (`frontend/src/`):
- `styles.scss` — tokens, utilitários (toggle, passo de mês, esqueleto, falha, `only-*`), Detalhe global, faixa de filtros, confirmação.
- `app/core/`: `models.ts`, `formatters.{ts,spec.ts}`, `list-feedback/*`, `filter-panel/*`, `month-picker/*`, `confirm-dialog/*`, `record-detail/record-detail.{ts,html,spec.ts}` (novo), `services/transaction.service.ts`, `services/dashboard.service.spec.ts`.
- `app/features/dashboard/dashboard.{ts,html,scss,spec.ts}`.
- `app/features/transactions/`: `transactions.{ts,html,scss,spec.ts}`, `transaction-form.{ts,html,scss,spec.ts}`, `transaction-filters.ts` (novo). `transaction-detail.*` foi criado e depois removido (virou `core/record-detail`).
- `app/features/categories/categories.{ts,html,scss,spec.ts}`, `app/features/users/users.{ts,html,scss,spec.ts}`, `app/features/profiles/{profiles.ts,profiles.html,profiles.scss,profiles.spec.ts,profile-form.ts,profile-screens.ts (novo)}`.

Spec: `specs/109-reformulacao-layout/{plan.md,context.md,spec.md,implementation-notes.md,evidence/revisao-textos.md,evidence/ajustes-2026-10-06.md}`.

## Decisoes

- Percentuais só no `DashboardResource`; o front só formata (`percentLabel`) e limita a barra a 100%.
- Destaque do mês do período com `is-period`, separado de `is-active`; altura do gráfico vem do CSS e é medida (sem medida fica 240).
- Colunas do Resumo por wrappers com `display: contents` abaixo de 1080px + `order`.
- "Ver pendentes" é `<button>` com o quadro inteiro; sem `TRANSACTIONS/VIEW` vira `<div>` sem atalho.
- Lançamentos: passo de mês mostra o aplicado e o Período do painel o rascunho; Status/Categoria com um controle por faixa (`name` distinto).
- `.only-*` sem `!important`, no fim de `styles.scss`, com `@media not all and (max-width: 680px)`.
- Revisão de textos: `evidence/revisao-textos.md`. Decisões de DEC-12/13/14: `evidence/ajustes-2026-10-06.md`.
- Para o sync-knowledge: `knowledge/transactions.md` diz que o formulário "nunca envia o campo nulo"; deixou de valer para o Valor (vazio sai `null`, DEC-7; texto não numérico sai como texto, DEC-14). A Data inicial do cadastro é o dia local (`isoDate`). Malformado no corpo agora tem mapper próprio (`InvalidFormatExceptionMapper`), o que vale registrar em `backend-patterns.md`.

## Desvios em relacao ao plano

- T23 desmarcada: varreduras vazias, `npm test` completo verde e `ng build` sem aviso de budget; o `./mvnw test` completo fica para o `/pipeline:quality-check`.
- T24 (`transaction-filters.ts`), T25 (`confirm-dialog` com `destructive`, ampliada a Categorias por decisão do usuário) e T26 (`TransactionPayload`) foram acrescentadas.
- T27 desmarcada: o item de Correções no 1.0.3 saiu por decisão do usuário; a correção da data continua no código.
- T15: `transaction-detail` substituído pelo `core/record-detail` na T31.

## Ajustes pós-validação (2026-10-06)

- Pedido: Detalhe em todas as telas de cadastro (DEC-12) -> T31, T32; bloco do mês também no desktop (DEC-13) -> T28; Valor sem limpeza, recusado pelo back-end (DEC-14) -> T29, T30; textos -> T33.
- (Superado pela DEC-15, abaixo: Usuários e Perfis passaram a confirmar.) Ver `evidence/ajustes-2026-10-06.md`.
- DEC-15 (T34): o usuário decidiu as dúvidas. "Desativar usuário" e "Excluir perfil" passam a confirmar em estilo de perigo, na linha e no Detalhe ("Deseja desativar o usuário "<nome>"? Ele deixa de entrar no sistema, mas o cadastro é mantido." / "Deseja excluir o perfil "<nome>"? A exclusão não pode ser desfeita."); nada no back-end depende disso (o 409 da própria conta e o de perfil em uso continuam no toast, depois de confirmar). A Cor do Detalhe de Categorias mostra só a bolinha, com `role="img"` e `aria-label` "Cor da categoria"; a mensagem do valor inválido fica como está. Central e 1.0.3 revistos (`evidence/revisao-textos.md`). Para o sync-knowledge: `knowledge/users.md`, `auth-and-permissions.md` e o texto da Central deixam de ter "sem confirmação".
- Testes rodados: `npm test` (41 arquivos, 489 testes) e `ng build` sem aviso; backend `TransactionResourceTest`, `CategoryResourceTest`, `UserResourceTest`, `ProfileResourceTest` (por causa do mapper compartilhado), `DocumentationContentTest`, `DocumentationResourceTest`, `ReleaseNotesContentTest`, todos verdes.
