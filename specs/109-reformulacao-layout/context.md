# Briefing — issue 109

## Regras que restringem esta mudanca

- Toda regra e imposta no back-end; o front so espelha/formata. Os % do Saldo (DEC-2) e de cada categoria sobre o total do tipo (DEC-11, `sharePercent`) nascem no `DashboardResource` (1 casa, HALF_UP, nulo com divisor zero), com teste; o front so formata (`knowledge/architecture.md`).
- Totais do Resumo: `paidExpense` = despesas `PAID`; `totalIncome` = todas as receitas; `PENDING` so em `pendingExpense`; `balance = totalIncome - paidExpense`. Mes sem lancamento = 200 zerado (logo % nulo) (`knowledge/dashboard.md`).
- Fixture de teste (inclusive de front) tem de ser alcancavel: `balance = income - expense` em cada mes, e o % coerente com `paidExpense/totalIncome` (issue #48) (`knowledge/dashboard.md`).
- Saudacao fica (D2): so le `AuthService.me()`, frase sorteada uma vez; nenhuma requisicao nova no Resumo. Botoes de mes do Resumo nunca desabilitados (`knowledge/dashboard.md`).
- Grafico: teclado, `month-hit` por mouse/toque, nenhum handler chama a API; `ResizeObserver` com guarda e fallback (jsdom mede 0) (`knowledge/dashboard.md`).
- `TransactionRequest.amount`: `@NotNull` "O valor é obrigatório." + `@DecimalMin 0.01` "O valor deve ser maior que zero."; frase agregada na ordem de `FieldLabels` (`knowledge/transactions.md`).
- Receita: `status = null` no back e no payload; Status some com Receita; `categoryId: '' -> null`; filtro Categoria do cadastro por tipo (`knowledge/transactions.md`).
- Filtro de mes: chave unica `month` (`YYYY-MM`), `initial` = mes atual, `defaults` sem mes; "Limpar filtros"/remover "Data" listam tudo; conta como filtro ativo (`knowledge/transactions.md`).
- Excluir: `confirm-dialog` com `Deseja excluir o lançamento "<descrição>"? A exclusão não pode ser desfeita.`, "Cancelar"/"Excluir lançamento"; recusar sem HTTP; Sucesso "Lançamento excluído com sucesso."; falha da recarga separada da falha da escrita (`knowledge/transactions.md`, `knowledge/frontend-ui.md`).
- Permissao por botao: "Novo lançamento" so `CREATE`, editar so `EDIT`, excluir so `DELETE`; filtro Categoria oculto sem `CATEGORIES/VIEW` (`knowledge/frontend-ui.md`).
- `filter-panel`: acima de 680 aplica no `change`; ate 680 painel sobre rascunho (`beginDraft/applyDraft/discardDraft`), X/scrim/Esc descartam (`knowledge/frontend-ui.md`).
- Sobreposicao nova (Detalhe): `role="dialog"`, `aria-modal`, foco no 1o item por `afterNextRender`, `Tab` retido, Esc/scrim/X fecham e devolvem o foco, `body.overlay-open`; camadas scrim 70, painel 80, modal 200 (`knowledge/frontend-ui.md`).
- Cor literal so em `styles.scss` (token em `:root`); utilitario compartilhado e global; budget 8 kB por `.scss` de componente; breakpoints 1080/680/480 escritos literais; quem decide a faixa e o CSS (sem `matchMedia`, sem template por largura); `:hover` dentro de `@media (hover: hover)` (`knowledge/frontend-ui.md`).
- Controle nativo estilizado, nunca substituido (radio para Tipo/Status do cadastro); destaque de campo invalido por `FieldErrorState`, foco no 1o invalido na ordem do DOM (`knowledge/frontend-ui.md`).
- Central e Novidades: linguagem de usuario, paragrafo <= 600 caracteres, nada de termo tecnico; texto passa por `.claude/skills/pipeline/revisar-textos/SKILL.md` (lido como arquivo); bloco `1.0.3` e o da versao corrente; blocos anteriores sao historico (`knowledge/documentation.md`).
- `DocumentationContentTest` fixa termos obrigatorios por area (Resumo **nao** pode conter "desabilitado"; ver `shouldDescribeMonthStepAndCategoryPanelInSummary` e `shouldDescribeDefinitiveTransactionDeletionAndMonthFilter`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `dashboard/DashboardResource.java`, `DashboardSummaryResponse.java`, `CategoryBreakdownResponse.java`, `DashboardRepository.java` | totais do Resumo | `paidExpensePercent`, `sharePercent` |
| `core/models.ts`, `core/formatters.ts` | contrato e formatacao | campo novo; `%`, Valor, `dayHeading` com dia da semana |
| `src/styles.scss` | tokens e utilitarios | tokens novos, segmentado, passo de mes, esqueleto, modal |
| `core/list-feedback`, `core/filter-panel`, `core/month-picker` | estados, filtros, seletor | esqueleto + "Tentar novamente"; slots fora do painel; placeholder |
| `features/dashboard/dashboard.*` | 4 cartoes + grafico + categoria | Saldo/Pendentes, %, destaque, 2 colunas |
| `features/transactions/transactions.*` | lista + filtros | passo, Tipo segmentado, total, Detalhe |
| `features/transactions/transaction-detail.*` | nao existe | painel Detalhe |
| `features/transactions/transaction-form.*` | cadastro | ordem DEC-8, Valor texto, Hoje/Ontem, "Salvando…" |
| `documentation/content/{Summary,Transactions}AreaContent.java`, `OverviewContent.java`, `releasenotes/content/ReleaseNotesContent.java` | Central e Novidades | descrevem o layout novo |

## Convencoes aplicaveis

- Identificador novo nao pode casar as varreduras (`periodo`, `Lancamento`, `obrigatori` etc.); texto exibido acentuado.
- Requisicao nova ou `Router`/permissao nova numa tela: ensine antes os helpers do `.spec.ts` (`render()`, permissao setada antes do `createComponent`, rota coringa ao clicar em `routerLink`) (`knowledge/testing.md`).
- vitest: so `Date` no `toFake`; jsdom nao aplica CSS (largura/camada vao para validacao manual) (`knowledge/testing.md`).
- Varreduras (devem sair vazias), literais:
  ```bash
  rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"
  rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  rg -n "Quatro indicadores" backend/src/main/java
  ```

## Consultas fora do briefing

- Implementação (2026-10-03): `knowledge/frontend-ui.md` — se `!important` era aceito nos utilitários `.only-mobile`/`.only-desktop` (não é: a cascata se resolve por especificidade e ordem; os utilitários ficaram no fim de `styles.scss`, sem `!important`). O briefing não dizia como esconder parte exclusiva de uma faixa.
- Implementação (2026-10-03): `knowledge/documentation.md`, seção de Novidades por versão — onde entra correção de comportamento que já existia na versão anterior (Correções do bloco da versão corrente) e se algum teste fixava o bloco 1.0.3 vazio (não fixa: os testes usam bloco fictício). O briefing só dizia "bloco 1.0.3 é o da versão corrente".
- Ajustes pós-validação (2026-10-06): `knowledge/categories.md` (campos e Situação, exclusão definitiva com confirmação), `knowledge/users.md` ("Desativar" sem hard delete e sem confirmação, só usuário ativo, `super_admin` fora da lista) e `knowledge/auth-and-permissions.md` (Perfis: exclusão sem confirmação, 409 em uso, matriz por tela) — o briefing não cobria Categorias, Usuários e Perfis, que entraram com a DEC-12. Também `knowledge/backend-patterns.md` (padrão "O/A <campo> informado(a) é inválido(a)." para valor malformado), usado na mensagem da DEC-14.
