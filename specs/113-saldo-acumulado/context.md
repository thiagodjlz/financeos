# Briefing — issue 113

## Regras que restringem esta mudanca

- Saldo do mes: `balance = totalIncome - paidExpense`; receita conta toda, despesa so `status = 'PAID'`; `PENDING` so entra no card Pendentes. O mesmo vale para `monthlyEvolution` (`knowledge/dashboard.md`, "Totais").
- Invariante: em todo mes `balance = income - expense`, derivado em `MonthlySummaryResponse.of`. Fixture de teste (inclusive de front) que nao fecha com dados que o back-end produz e invalida (issue #48, D6) (`knowledge/dashboard.md`).
- Resumo e escopado pelo `user_id` logado e comeca com `accessControl.require(Screen.DASHBOARD, Action.VIEW)`; periodo sem lancamento responde 200 zerado, nunca erro (`knowledge/dashboard.md`).
- A linha do grafico plota o `balance` do proprio mes, sem recalculo no front (D1 da #48); o informativo flutuante mostra Receita/Despesa/Saldo; o bloco abaixo do grafico mostra o mes escolhido (`pinnedMonth`) e troca sem HTTP (`knowledge/dashboard.md`).
- Toda regra de negocio e calculada no back-end; o front so formata (`money()`), como ja faz com os percentuais (issue #109) (`knowledge/architecture.md`, `knowledge/dashboard.md`).
- Lancamento pode ser editado e excluido (hard delete); o Resumo e 100% derivado de `transactions` (`knowledge/transactions.md`, `knowledge/dashboard.md`).
- Mudanca visivel exige revisar a area Resumo da Central (`SummaryAreaContent`) e o bloco da versao corrente (`1.0.3`) de Novidades; item do bloco corrente que a mudanca desmente e reescrito. Texto passa pela revisao de `.claude/skills/pipeline/revisar-textos/SKILL.md`; linguagem de usuario, paragrafo <= 600 caracteres, sem termos barrados (API, banco de dados, endpoint, migration...) (`knowledge/documentation.md`).
- Testes de conteudo acham o bloco pela versao (`version("1.0.3")`), nunca por indice (`knowledge/documentation.md`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../dashboard/DashboardResource.java` | monta o summary; `YearMonth.now()` no default | calcula `previousBalance`/`accumulatedBalance` e o acumulado de cada mes; mes corrente vem de bean injetavel |
| `backend/.../dashboard/DashboardRepository.java` | SQL cru (totais, quebra, evolucao) | nova consulta de saldo de um intervalo de datas |
| `backend/.../dashboard/DashboardSummaryResponse.java` | record do summary | + `previousBalance`, `accumulatedBalance` |
| `backend/.../dashboard/MonthlySummaryResponse.java` | record do mes | + `accumulatedBalance` |
| `backend/.../dashboard/CurrentMonth.java` (novo) | — | bean `@ApplicationScoped` com `YearMonth current()` |
| `backend/.../documentation/content/SummaryAreaContent.java` | area Resumo da Central | descreve a regra |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` | blocos de Novidades | item no `1.0.3` |
| `frontend/src/app/core/models.ts` | `DashboardSummary`, `MonthlySummary` | campos novos |
| `frontend/src/app/features/dashboard/dashboard.{ts,html,scss}` | quadro Saldo do mes, grafico, bloco do mes | linhas Saldo anterior/Saldo acumulado; "Acumulado" no bloco |
| `frontend/src/app/features/dashboard/dashboard.spec.ts` | testes da tela | helpers `evolution()`/`payload()` e asserts de 3 valores do bloco |

## Convencoes aplicaveis

- Sem comentario no codigo salvo "porque" nao-obvio; identificadores em ingles, texto de tela em portugues acentuado (`knowledge/architecture.md`).
- `styles.scss` e o unico arquivo com cor literal: `.scss` da tela so usa `var(--token)`. Varredura (vazia): `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"`. Budget `anyComponentStyle`: 8 kB aviso / 12 kB erro por `.scss` (`knowledge/frontend-ui.md`).
- Decisao de layout mora no CSS (breakpoints 1080/680/480, literais nas `@media`); `.only-mobile`/`.only-desktop` globais (`knowledge/frontend-ui.md`).
- Testes de front: tudo pelo DOM, `httpMock.verify()` no `afterEach`, ausencia de chamada com `httpMock.expectNone(() => true)`. Teste de back que fixa o mes corrente: `QuarkusMock.installMockForType(...)` sobre bean `@ApplicationScoped` (padrao de `AuditChangeRecordingTest`). Usuario `...0001` e compartilhado entre classes: fixture com prefixo de descricao proprio e limpeza no `@AfterEach` (`knowledge/testing.md`).
- Varreduras de idioma (criterio 14), ambas devem sair vazias — o regex do back pega `lancamento`/`periodo` minusculos sem acento, o do front pega titulo de `*.spec.ts` (`knowledge/architecture.md`, "Idioma"):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```

## Consultas fora do briefing

- (implement) O briefing citava o budget de 8 kB do `.scss`, mas nao que o `dashboard.scss` ja estava a ~130 bytes do aviso nem que existe o utilitario global `.tabular` (`font-variant-numeric: tabular-nums`) para aliviar o budget. Achado em `knowledge/frontend-ui.md` ("Utilitarios globais primeiro") e em `frontend/src/styles.scss`.
