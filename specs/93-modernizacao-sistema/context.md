# Briefing — issue 93

## Regras que restringem esta mudanca

- Cor so nasce em `:root` de `frontend/src/styles.scss`; `.scss` de tela usa `var(--x)` (nem `white`/`black`). Cor de **dado** (a da categoria) vai por binding (`[style.background]`), nao e tema. Espacamento continua literal (`knowledge/frontend-ui.md`).
- Varreduras literais dos criterios 1 e 13 (todas vazias):
  ```bash
  rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"
  rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  SVG inline **sem** `xmlns="http://..."` e nenhum `url("data:image/svg+xml...")`: casam a 2a (`knowledge/frontend-ui.md`, `architecture.md`).
- Inter ja e self-hosted (`assets/fonts/`); nada externo (`knowledge/frontend-ui.md`).
- Controle redesenhado e aparencia sobre o nativo: Tipo/Status = `input type="radio"`, filtros = `<select>` (`knowledge/frontend-ui.md`).
- Layout decidido no CSS: sem `matchMedia`/medicao no TS, so signal de estado; `@media` com literal 1080/680/480; `:hover` so em `@media (hover: hover)`. Tabela vira cartao pela regra global de 680px (`td[data-label]`), sem template por largura (`knowledge/frontend-ui.md`).
- Camadas: back-to-top 40, trilho 50, topbar 60, scrim 70, gaveta 80, modal 200/201, toast 999; fixo novo entra na escala e soma `env(safe-area-inset-*)`; `100vh` seguido de `100dvh`. Painel sobreposto: `visibility: hidden` fechado, `Esc`, foco retido e devolvido, `body` sem rolagem (`knowledge/frontend-ui.md`).
- Menu: cada item mantem `*ngIf="authService.can('<SCREEN>','VIEW')"`; agrupador sem `Screen` so aparece com algum filho; botao que navega chama `onNavigate()` (`knowledge/auth-and-permissions.md`).
- Botao de acao so com a permissao: `CREATE` novo, `EDIT` editar, `DELETE` cancelar/excluir/desativar (`knowledge/frontend-ui.md`).
- "Cancelar"/voltar do cadastro: `JSON.stringify` igual ao snapshot sai sem HTTP e sem toast; diferente abre `confirm-dialog` "Deseja sair sem salvar?" (`knowledge/frontend-ui.md`).
- Status so para despesa (some com Receita); payload `{...form, amount: Number, status: INCOME ? null : status, categoryId: '' -> null}`; cancelar = `DELETE /transactions/{id}` (`knowledge/transactions.md`).
- 400 com `violations[]`: `invalid` + `<small class="field-error">` com a `message` do back-end; foco no 1o invalido na ordem do DOM; estilo so global (`knowledge/frontend-ui.md`).
- Resumo: Despesas so `PAID`; Saldo = receitas - despesas pagas; Pendentes unico com `PENDING`; trocar periodo chama so `summary`; periodos = `/periods` + mes corrente sempre (`knowledge/dashboard.md`).
- Saudacao sorteada uma vez (signal), nome de `AuthService.me()` sem requisicao nova (`knowledge/dashboard.md`).
- Nome de outro recurso sai por `@Formula`; POST/PUT respondem com a entidade validada (`from(entidade, ...)`) (`knowledge/backend-patterns.md`). `categories.color` e nullable; a API exige cor, legado pode nao ter (`knowledge/categories.md`).
- Toasts: Sucesso 3800 ms, Alerta 5200 ms, Falha sem fechar (`knowledge/frontend-ui.md`).
- Central e Novidades sao consumidores a mao: revisar `<Area>Content.java` e o bloco 1.0.2 (nao cortado) de `ReleaseNotesContent.java` (`knowledge/documentation.md`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `transactions/{FinancialTransaction,TransactionResponse,TransactionResource}.java` | `categoryName` por `@Formula` | + `categoryColor` |
| `dashboard/{CategoryBreakdownResponse,DashboardRepository}.java` | quebra por categoria | + `c.color` |
| `frontend/src/styles.scss` | tokens `oklch` + utilitarios | paleta do mockup + utilitarios |
| `layout/main-layout/*` | trilho + acordeao + gaveta | menu 248 + barra inferior |
| `core/{filter-panel,pagination,paged-list.ts,formatters.ts}` | filtros recolhidos | visiveis / painel inferior |
| `features/{transactions,categories,users,profiles,dashboard,auth/login}/*` | telas | novo visual |
| `documentation/content/*`, `ReleaseNotesContent.java` | citam "Incluir", gaveta, Ano/Mes | reescrita |

## Convencoes aplicaveis

- Budget `anyComponentStyle` 8 kB (erro 12 kB): estilo comum vai para `styles.scss`.
- Requisicao nova no `ngOnInit` exige ensinar os helpers do spec antes (`knowledge/testing.md`).
- jsdom nao aplica CSS: altura/cor/largura vao para validacao manual (`knowledge/testing.md`).
- Texto de tela acentuado; sem comentario salvo "porque" nao-obvio.

## Consultas fora do briefing

Nenhuma ate agora.
