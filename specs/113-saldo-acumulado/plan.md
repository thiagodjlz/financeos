# Plano de implementacao

## Abordagem

Calculo na hora, todo no `DashboardResource`, sem tabela nem migration. Uma consulta nova no repositorio da o saldo (receitas - despesas pagas) de um intervalo de datas; com ela se obtem o "saldo anterior" de janeiro do ano pedido (intervalo `[01/10/2026, fim de min(dez/(Y-1), C)]`, vazio = 0) e, percorrendo os 12 meses de `monthlyEvolution`, `previous(m+1) = previous(m) + (out/2026 <= m <= C ? balance(m) : 0)` e `accumulated(m) = previous(m) + balance(m)`. O `previousBalance`/`accumulatedBalance` do summary sao os do mes pedido nessa mesma serie, o que garante que card e bloco do mes nunca divergem. O mes corrente `C` vem de um bean `@ApplicationScoped` (`CurrentMonth.current()`), que os testes substituem por `QuarkusMock`; o front so exibe em `money()`.

## Arquivos a alterar

### Backend
- `backend/src/main/java/br/com/financeos/dashboard/CurrentMonth.java` (novo) — `YearMonth current()` = `YearMonth.now()`.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java` — `balanceBetween(userId, startDate, endDate)`: `coalesce(sum(INCOME),0) - coalesce(sum(EXPENSE and status='PAID'),0)`, mesmas condicoes de `totals`.
- `backend/src/main/java/br/com/financeos/dashboard/MonthlySummaryResponse.java` — campo `accumulatedBalance` (`of`/`empty` nascem com `accumulatedBalance = balance`) + `withAccumulatedBalance(BigDecimal)`.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardSummaryResponse.java` — `previousBalance`, `accumulatedBalance`.
- `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` — constante de inicio `YearMonth.of(2026, 10)`, injeta `CurrentMonth`, monta a serie acumulada; default de periodo passa a usar `CurrentMonth` (mesma fonte de "mes corrente").
- `backend/src/main/java/br/com/financeos/documentation/content/SummaryAreaContent.java` — regra publicada.
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — item NEW no `versao_1_0_3()`.
- Testes: `backend/src/test/java/br/com/financeos/dashboard/DashboardAccumulatedBalanceTest.java` (novo), `DocumentationContentTest.java`, `ReleaseNotesContentTest.java`.

### Frontend
- `frontend/src/app/core/models.ts` — `DashboardSummary.previousBalance/accumulatedBalance`, `MonthlySummary.accumulatedBalance` (obrigatorios: a API sempre envia).
- `frontend/src/app/features/dashboard/dashboard.ts` — fallback de `monthlySeries` com `accumulatedBalance: 0`; `ChartMonth` carrega o acumulado; `monthBlock` ganha `accumulated` (tipo proprio estendendo `MonthTooltip`); `activeTooltip`/`announcement` intocados.
- `frontend/src/app/features/dashboard/dashboard.html` — no `.balance-card`, linha "Saldo anterior" e destaque "Saldo acumulado" (`formatMoney(summary()?.previousBalance/accumulatedBalance)`), sem tirar o `.balance-value`; no `.month-block`, `<span><small>Acumulado</small>...`.
- `frontend/src/app/features/dashboard/dashboard.scss` — estilos das linhas novas e do 4o valor do bloco, so com `var(--token)`.
- `frontend/src/app/features/dashboard/dashboard.spec.ts` e `frontend/src/app/core/services/dashboard.service.spec.ts` — fixtures e testes.

### Migration
- Nenhuma (criterio 8; ultima existente `V17__create_audit.sql`, nada muda em `db/migration`).

## Tarefas

- [x] **T1** — Criar `CurrentMonth` e a consulta `balanceBetween` no repositorio
  - Arquivos: `dashboard/CurrentMonth.java`, `dashboard/DashboardRepository.java`
  - Criterios: — (infraestrutura para T2)
- [x] **T2** — Acrescentar os campos aos records e calcular saldo anterior/acumulado (summary e cada mes de `monthlyEvolution`) no `DashboardResource`, com inicio fixo em out/2026 e corte em `min(M-1, C)`
  - Arquivos: `DashboardSummaryResponse.java`, `MonthlySummaryResponse.java`, `DashboardResource.java`
  - Criterios: 1, 2, 3, 4, 5, 6, 7, 8, 9
- [x] **T3** — Criar `DashboardAccumulatedBalanceTest` (`@TestSecurity` de classe com sub `...0001`, prefixo `Teste acumulado`, limpeza em qualquer usuario no `@AfterEach`, `QuarkusMock.installMockForType` fixando `CurrentMonth`) com um teste por cenario: criterio 2 (nov e dez com C = dez), 3 (C = nov e C = dez), 4 (receita em 15/09/2026), 5 (`?year=2026&month=9` e jan-set da evolucao), 6 (pendente em out), 7 (lancamento do usuario `...0099`), 8 (alterar valor e excluir lancamento de out entre duas consultas), 9 (campos antigos com os mesmos valores e `monthlyEvolution[].balance = income - expense`); manter `DashboardResourceTest` verde sem alteracao
  - Arquivos: `backend/src/test/java/br/com/financeos/dashboard/DashboardAccumulatedBalanceTest.java`
  - Criterios: 1, 2, 3, 4, 5, 6, 7, 8, 9
- [x] **T4** — Atualizar `models.ts` e `dashboard.ts` (serie, `ChartMonth`, `monthBlock` com acumulado; informativo inalterado)
  - Arquivos: `frontend/src/app/core/models.ts`, `frontend/src/app/features/dashboard/dashboard.ts`
  - Criterios: 9, 11
- [x] **T5** — Exibir "Saldo anterior" e "Saldo acumulado" no quadro Saldo do mes e "Acumulado" no bloco do mes, com estilos em tokens (bloco com 4 valores cabendo em 320px)
  - Arquivos: `dashboard.html`, `dashboard.scss`
  - Criterios: 10, 11, 12
- [x] **T6** — Ajustar fixtures e testes de front: `evolution()` deriva `accumulatedBalance` (= balance antes de out/2026, soma a partir de out — fixture alcancavel), `payload()` com `previousBalance: 0`/`accumulatedBalance: 0` (julho, coerente), literal tipado de `dashboard.service.spec.ts`; atualizar os asserts de `.month-block-values span` para 4 valores; novos testes: cenario do criterio 2 em nov e dez mostrando "R$ 200,00" acumulado e "R$ 400,00"/"R$ 200,00" anterior (10), bloco trocando o Acumulado ao tocar outro mes com `httpMock.expectNone(() => true)` (11), saldo anterior e acumulado negativos com "-R$" (12), informativo sem "Acumulado" e "plota o saldo do próprio mês, e não um acumulado" intocado (9)
  - Arquivos: `frontend/src/app/features/dashboard/dashboard.spec.ts`, `frontend/src/app/core/services/dashboard.service.spec.ts`
  - Criterios: 9, 10, 11, 12
- [x] **T7** — Descrever a regra na area Resumo da Central (Funcionalidades: as linhas novas do quadro; Indicadores: linhas Saldo anterior e Saldo acumulado; Regras: vale desde 1º de outubro de 2026, receitas menos despesas pagas, saldo negativo passa adiante, mes futuro soma so ate o mes atual, editar/excluir lancamento antigo muda o acumulado; Particularidades: quadro abaixo do grafico com o acumulado, linha e informativo seguem mensais) e acrescentar asserts em `DocumentationContentTest`. Texto revisado por `.claude/skills/pipeline/revisar-textos/SKILL.md`
  - Arquivos: `SummaryAreaContent.java`, `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java`
  - Criterios: 13
- [x] **T8** — Item NEW "Saldo acumulado" no bloco `1.0.3` de `ReleaseNotesContent` e assert por `version("1.0.3")` em `ReleaseNotesContentTest`; conferir que nenhum item do `1.0.3` fica desmentido ("Resumo redesenhado" e "Mês em destaque no gráfico" continuam verdadeiros). Texto revisado por `.claude/skills/pipeline/revisar-textos/SKILL.md`
  - Arquivos: `ReleaseNotesContent.java`, `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java`
  - Criterios: 13
- [x] **T9** — Rodar as duas varreduras de idioma e a de cor literal (comandos no `context.md`) e corrigir o que surgir
  - Arquivos: — (conferencia)
  - Criterios: 14

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | campos novos no summary e em `monthlyEvolution`; out/2026 anterior 0 | T2, T3 |
| 2 | cenario out/nov, negativo levado adiante | T2, T3 |
| 3 | mes futuro soma so ate C | T2, T3 |
| 4 | antes de 01/10/2026 nao entra | T2, T3 |
| 5 | mes anterior a out/2026: acumulado = saldo | T2, T3 |
| 6 | pendente fora do anterior | T2, T3 |
| 7 | escopo por usuario | T2, T3 |
| 8 | calculado na hora, sem migration | T2, T3 |
| 9 | nao-regressao (campos, linha, informativo) | T2, T3, T4, T6 |
| 10 | Saldo anterior e Saldo acumulado no quadro | T5, T6 |
| 11 | Acumulado no bloco do mes, sem HTTP | T4, T5, T6 |
| 12 | negativos com sinal | T5, T6 |
| 13 | Central e Novidades 1.0.3 | T7, T8 |
| 14 | varreduras de idioma vazias | T9 |

## Superficie de validacao

- Criterios 1-9 — `DashboardAccumulatedBalanceTest` (um metodo por criterio) + `DashboardResourceTest` inteiro sem alteracao (9); `GET /api/dashboard/summary?year=2026&month=11` na stack local mostra os campos novos.
- Criterio 9 (front) — `dashboard.spec.ts` "plota o saldo do próprio mês, e não um acumulado" e testes do informativo passando; teste novo de informativo sem "Acumulado".
- Criterios 10-12 — testes novos em `dashboard.spec.ts`.
- Criterio 13 — `DocumentationContentTest`, `ReleaseNotesContentTest` (+ asserts novos); telas Sobre > Documentação > Resumo e Sobre > Novidades por versão.
- Criterio 14 — as duas varreduras do `context.md` vazias.

## Validacao manual (etapa 7)

- Criterios 10 e 12 — Resumo em `http://localhost`, desktop e 390px/320px: quadro Saldo do mês com valor principal ainda em destaque maior, linha "Saldo anterior" e destaque "Saldo acumulado" legiveis, sem quebra ruim; um mes com acumulado negativo mostra "-R$".
- Criterio 11 — bloco abaixo do grafico com 4 valores (Receita, Despesa, Saldo, Acumulado) cabendo a 320px; tocar/clicar outro mes troca o Acumulado (DevTools > Network sem chamada nova).
- Criterio 13 — leitura dos textos nas duas telas.

## Riscos e pontos de atencao

- **Isolamento do usuario `...0001` nos testes**: os asserts de `previousBalance` sao exatos e somam tudo de out/2026 ate C desse usuario; qualquer lancamento deixado por outra classe em out/2026+ (ex.: `AuditChangeRecordingTest` cria em 2026-10-01 e limpa por prefixo) contamina. Fixar sempre C em out/2026-jan/2027 e limpar por prefixo no `@AfterEach`; se aparecer interferencia, apagar no `@BeforeEach` tambem (`knowledge/testing.md`).
- **Fuso do "mes corrente"**: `YearMonth.now()` usa o fuso da JVM do container; na virada do mes o C pode diferir do mes local do usuario por algumas horas — mesmo comportamento do default de periodo atual, nao corrigido aqui.
- **Budget do `dashboard.scss`** (625 linhas, aviso 8 kB / erro 12 kB): estilos novos enxutos; reaproveitar utilitarios globais. `npm run build` acusa.
- **Fixtures do front**: `evolution()` precisa produzir acumulado coerente com a regra (issue #48); fixture com `accumulatedBalance` arbitrario prova estado impossivel.
- **Varredura do back**: texto novo da Central em `.java` nao pode ter `lancamento`/`periodo` sem acento (acentuado nao casa).
- **Novidades**: decisao — item NEW no `1.0.3` (mudanca visivel ao usuario); nenhum item existente e desmentido.
- Mudanca so acrescenta campos ao contrato (nao aperta): consumidores sao `models.ts` e os dois specs tipados, ja inventariados.

## Lacunas

Nenhuma.
