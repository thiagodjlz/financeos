# Briefing — issue 117

## Regras que restringem esta mudanca

- Totais do Resumo: receita conta toda; despesa so `PAID`; `PENDING` so no card Pendentes; sempre do `user_id` logado (`knowledge/dashboard.md`).
- Saldo anterior(M) = soma de (receitas − despesas pagas) de cada mes de out/2026 (`ACCUMULATION_START`) ate `min(M-1, C)`, 0 com intervalo vazio; C = `CurrentMonth.current()`; mes alem de C+1 nao soma os meses entre C e ele; calculado a cada consulta (editar/excluir antigo muda os seguintes); o carregado ate janeiro do ano vem de `DashboardRepository.balanceBetween` (`knowledge/dashboard.md`). DEC-1: Saldo do mes = Saldo anterior + receitas − despesas pagas — a soma do anterior usa o resultado cru de cada mes, nunca o Saldo novo (criterio 2).
- O saldo de cada mes e derivado dentro de `MonthlySummaryResponse`, nunca chega solto; fixture (inclusive de front) que nao bate com o que a API produz prova estado impossivel (issue #48 D6) (`knowledge/dashboard.md`).
- Percentuais nascem no back (`paidExpensePercent`, uma casa `HALF_UP`, `null` sem receita); o front so formata (`knowledge/dashboard.md`).
- `balanceBetween` tem segundo consumidor: Saldo atual do relatorio (01/10/2026 ate hoje). Nao muda (`knowledge/transactions.md`, DEC-4). O relatorio usa `TransactionReportRepository`, com ordem propria (fora de escopo).
- `GET /transactions`: paginado, escopo do usuario na consulta, ordenacao sempre desempata por `id` (`knowledge/backend-patterns.md`).
- Ate 680px a tabela vira cartao por regra global; sem template por largura; decisao de layout no CSS, nunca `matchMedia` (`knowledge/frontend-ui.md`).
- `dashboard.scss` esta a 7,95 kB do aviso de 8 kB: reaproveitar classe; esta issue deve remover regra, nao acrescentar (`knowledge/dashboard.md`).
- Central/Novidades: linguagem de usuario, sem identificador nem termo de infraestrutura; paragrafo ate 600 caracteres; vale o rotulo da tela; revisao por `.claude/skills/pipeline/revisar-textos/SKILL.md` (lendo o arquivo); commit exige `FINANCEOS_TEXTOS_REVISADOS=1`. Item do bloco corrente que a mudanca desmente e reescrito nele; bloco 1.0.2 (inclusive "agrupada por dia") e intocavel; nenhum item se repete entre blocos (`knowledge/documentation.md`).
- Nada externo em runtime; a varredura `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` cobre so `frontend/src` (SVG em `frontend/public` pode ter `xmlns`). Cor literal so em `styles.scss` (`knowledge/frontend-ui.md`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/.../dashboard/DashboardResource.java` | `withAccumulatedBalance`, summary com `accumulatedBalance` | Saldo novo; anterior pela soma crua |
| `backend/.../dashboard/MonthlySummaryResponse.java` | `balance = income - expense` + `accumulatedBalance` | `previousBalance` + `balance` derivado |
| `backend/.../dashboard/DashboardSummaryResponse.java` | tem `accumulatedBalance` | campo sai |
| `backend/.../transactions/TransactionRepository.java` | `order by transactionDate desc, createdAt desc, id` | `amount desc` na frente |
| `backend/.../documentation/content/{Summary,Transactions,TransactionReports}AreaContent.java` | acumulado, ordem por data, dias | texto novo |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` | bloco 1.0.3 com "Saldo acumulado:" | reescrito + 3 itens |
| `frontend/src/app/core/models.ts` | `accumulatedBalance` nos dois modelos | contrato novo |
| `frontend/src/app/features/dashboard/dashboard.{ts,html,scss,spec.ts}` | linha "Saldo acumulado", bloco com Acumulado | legenda nova, bloco com 3 valores |
| `frontend/src/app/features/transactions/transactions.{ts,html,scss,spec.ts}` | `tr.day-row` + `dayHeading`, data oculta no celular | sem titulo de dia, data em cada linha |
| `frontend/src/app/layout/main-layout/main-layout.{html,scss,spec.ts}` | `FinanceOS · vX` numa linha | duas linhas, versao `nowrap` |
| `frontend/src/index.html`, `frontend/public/favicon.{ico,svg}` | favicon do Angular | marca "F" |

## Convencoes aplicaveis

- Toda regra de negocio no back-end; o front so exibe o que a API manda (sem recalcular saldo) (`CLAUDE.md`).
- Sem comentario exceto "porque"; comentario que ficou falso e corrigido: D1 da #48 em `dashboard.ts`, `models.ts`, `TransactionReportResource.java` linha 29.
- Texto exibido acentuado; as duas varreduras de `knowledge/architecture.md` saem vazias (cobrem `*.spec.ts` e titulos de teste):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  E a de cor literal: `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` (vazia).
- Testes front em vitest + jsdom: nenhum CSS aplicado nem largura de viewport (390px, `nowrap` vao para a validacao manual); `httpMock.verify()` no `afterEach` (`knowledge/testing.md`).
- Teste back com soma exata sobre o usuario `...0001`: limpeza por prefixo de descricao no `@BeforeEach` e no `@AfterEach`; "agora" fixado por `QuarkusMock.installMockForType(new FixedCurrentMonth(...), CurrentMonth.class)` (`knowledge/testing.md`).

## Consultas fora do briefing

Nenhuma ate agora.
