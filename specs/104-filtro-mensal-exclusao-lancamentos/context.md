# Briefing — issue 104

## Regras que restringem esta mudanca

- Migration nunca se edita: nova `V16`. Check inline da V1 (`status in ('PENDING','PAID','CANCELED')`) tem nome autogerado (`transactions_status_check`, provavel): **confirmar no banco** antes do `DROP CONSTRAINT` — `select conname from pg_constraint where conrelid = 'transactions'::regclass and contype = 'c';`. Nome errado impede a aplicacao de subir. Flyway roda no startup (`migrate-at-start=true`) (`knowledge/architecture.md`)
- `status` nullable desde a V8 (receita `null`); `validateStatus` exige status so para despesa (400 "O status é obrigatório.") — fica (`knowledge/transactions.md`)
- Filtro `status` do `GET /transactions` via `ListParams.enumValue`: fora do enum = 400 "O status informado é inválido."; mensagem de `WebApplicationException` vira texto de tela (`knowledge/backend-patterns.md`)
- Resumo: ordem das checagens e regra — par ano+mes -> mes 1..12 -> ano 1000..9999. Mes sem dados = 200 zerado com `monthlyEvolution` de 12 meses (`knowledge/dashboard.md`)
- Totais: despesa conta so `PAID` (Pendentes so no card Pendente); `balance = income - expense` em todo mes (`knowledge/dashboard.md`)
- `import_rows.transaction_id` e `on delete set null`; efeito do banco nao aparece no contexto de persistencia — reler em transacao nova (`knowledge/testing.md`)
- Confirmacao usa `core/confirm-dialog` (rotulo nomeia a acao; modelo: `categories.html`, "Excluir categoria"). Sucesso = toast fixo; erro via `toast.fromHttpError(err, '<fallback>')`; recarga falha com texto fixo de carga (`knowledge/frontend-ui.md`)
- `PagedList`: `filters` e rascunho, `applied` vai a API; `remove(key)` zera **uma** chave; `clear()`/`clearDraft()` voltam aos `defaults`; estado salvo no `ListStateService` so apos `apply`/`goTo`. No celular (`drafting`) o `change` nao aplica (`knowledge/frontend-ui.md`)
- Controle de filtro fica em `.filter-field`; a 680px vira grade de 1 coluna com campo 48px (`--field-h-mobile`) e fonte 16px; o `.filter-sheet` tem `overflow-y: auto` e o `filter-panel` fecha em `Esc` via `document:keydown.escape` (`knowledge/frontend-ui.md`)
- Breakpoints so 1080/680/480, literal na `@media`; decisao de layout no CSS, nunca `matchMedia`. Utilitario novo vai para `styles.scss` (unico com cor literal; budget de 8 kB por `.scss` de componente) (`knowledge/frontend-ui.md`)
- Nome do mes vem de `longMonthName()`; nenhuma lista de meses escrita a mao (`knowledge/dashboard.md`)
- Texto de `documentation/content/` e `releasenotes/content/` passa pela skill `pipeline:revisar-textos`; commit exige `FINANCEOS_TEXTOS_REVISADOS=1`. Linguagem de usuario, sem enum; Novidades: um bloco por `X.Y.Z`, item nao se repete entre blocos (`knowledge/documentation.md`)

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `db/migration/V16__*.sql` | — | apaga `CANCELED`, recria o check |
| `transactions/TransactionStatus.java` | `PENDING, PAID, CANCELED` | sai `CANCELED` |
| `transactions/TransactionResource.java` | `DELETE` grava `CANCELED`; `validateStatus` trata `CANCELED` | `DELETE` apaga a linha; sai o ramo `CANCELED` |
| `dashboard/DashboardRepository.java` | filtros `status <> 'CANCELED'`; `hasTransactionsInYear` | sem `CANCELED`; metodo removido |
| `dashboard/DashboardResource.java` | recusa ano sem lancamento | recusa sai; `/periods` fica |
| `core/paged-list.ts` | estado inicial = defaults ou salvo | opcao de estado inicial sem estado salvo |
| `core/month-picker/*` | — | seletor de mes/ano compartilhado |
| `features/transactions/transactions.*` | "Data de/até", "Cancelado", "Cancelar lançamento" | campo "Data" mensal, "Excluir lançamento" com confirmacao |
| `features/dashboard/dashboard.*` + `dashboard.service.ts` | passo sobre `/periods`, pontas desabilitadas | seletor + passo de calendario, sem `/periods` |
| `core/models.ts`, `core/formatters.ts` | `CANCELED`, `AvailablePeriod` | removidos; utilitarios de mes |
| `documentation/content/*`, `releasenotes/content/ReleaseNotesContent.java` | regra antiga | texto novo |

## Convencoes aplicaveis

- Todo endpoint comeca com `accessControl.require(...)` (403 vence 400/404).
- Varreduras de acentuacao (C21) devem sair **vazias** — o regex do front tem `periodo` minusculo e o do back tem `lancamento`/`periodo` minusculos: identificador novo fica em ingles:
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Cor literal so em `styles.scss` (deve sair vazia): `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"`
- Testes de componente: `httpMock.verify()` no `afterEach` — mudar a requisicao do `ngOnInit` exige ajustar primeiro os helpers (`render()`/`flush*()`). Relogio: `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()`, nunca `setTimeout` no `toFake`.
- Classe com `@TestSecurity` de classe nao testa 403: classe separada no padrao de `CategoryDeleteSecurityTest` (UUID constante, SQL nativo, limpeza no `@AfterEach`).

## Consultas fora do briefing

Nenhuma ate agora.
