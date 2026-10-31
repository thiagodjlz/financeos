# Briefing — issue 120

Alvo `v1.0.3` (branch a partir de `origin/v1.0.3`). Linhas conferidas na `main` (sem shell para `git show`); a spec conferiu os mesmos arquivos na `v1.0.3`, cujo `ReleaseNotesContent.build()` nao tem `versao_1_0_4()`. Confirme cada trecho na branch.

## Regras que restringem esta mudanca

- A ordem do menu e declarada em **um** lugar para a tela de entrada: `ENTRY_ROUTES` de `core/entry-route.ts` (consumido pelo pos-login e pelo `permissionGuard`); tela no menu tem a linha ali "na mesma ordem em que aparece no `<nav>`". `screenForUrl` usa a mesma lista, mas so por rota (a ordem nao o afeta). (`knowledge/auth-and-permissions.md`)
- Secoes do menu sao agrupadores sem `Screen`: cada item tem `*ngIf` com `can(screen,'VIEW')` e a secao so aparece com ao menos um item visivel (`canSeeReports()` = `TRANSACTION_REPORTS/VIEW`; `canSeeRegisters()` = `CATEGORIES/VIEW`). O mesmo gate se repete no menu lateral e no painel "Mais" (`#sheet-more`). (`knowledge/auth-and-permissions.md`, `knowledge/frontend-ui.md`)
- O Detalhe e o cadastro de Perfis listam uma linha por tela "na ordem do menu", via `PROFILE_SCREENS` (`profile-screens.ts`). (`knowledge/auth-and-permissions.md`)
- Icone de UI e SVG inline **sem** `xmlns="http://..."`: a varredura de recurso externo cobre `frontend/src` e acusaria; `frontend/public` (favicon) fica fora dela. (`knowledge/frontend-ui.md`)
- `styles.scss` e o unico arquivo com cor literal; `.scss` de componente usa `var(--token)` (`--accent` = `#3b5bdb`, `--on-accent` = `#ffffff`). (`knowledge/frontend-ui.md`)
- Central e Novidades sao escritas a mao, em linguagem de usuario (rotulos da tela, sem enum). Item do bloco da versao em que a mudanca entra e que ela desmente e **reescrito**, sem item novo. Testes de conteudo acham o bloco pela versao (`version("1.0.3")`). (`knowledge/documentation.md`)
- Texto de `documentation/content/` e `releasenotes/content/` passa pela revisao de `.claude/skills/pipeline/revisar-textos/SKILL.md` (lendo o arquivo) antes de gravar; o `pre-commit` exige `FINANCEOS_TEXTOS_REVISADOS=1`. (`knowledge/documentation.md`)
- jsdom nao aplica CSS: 34x34/44x44 efetivos e visibilidade com o menu recolhido vao para a validacao na tela. (`knowledge/testing.md`)
- O nginx devolve 200 com `index.html` para arquivo inexistente (`try_files`): no favicon, compare o sha256, nao so o status. (`specs/117-desconto-saldo-acumulado/plan.md`)

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `frontend/public/favicon.svg` | "F" branco em `<path>` sobre `rect` 34x34 `rx=10` `#3b5bdb` | moeda/carteira so com formas |
| `frontend/public/favicon.ico` | "F" em 16/32/48 (sha256 `c2140972...`) | regerado do novo desenho |
| `frontend/src/index.html` | declara ICO + SVG | nada (conferir) |
| `layout/main-layout/main-layout.html` | `.mark` com texto "F"; secoes Relatorios -> Cadastros (menu e "Mais") | SVG do simbolo; Cadastros antes de Relatorios |
| `layout/main-layout/main-layout.scss` | `.mark` 34x34, `font-size`/`font-weight` do "F" | ajuste do SVG; fonte sai |
| `layout/main-layout/main-layout.spec.ts` | listas com Relatorios primeiro (l. 134, 342) | nova ordem + teste do `.mark` |
| `features/auth/login/login.html` / `.scss` / `.spec.ts` | `.mark` 44x44 com "F"; nenhum teste do `.mark` | SVG do simbolo + teste |
| `core/entry-route.ts` / `.spec.ts` | `TRANSACTION_REPORTS` antes de `CATEGORIES`; teste l. 44 espera o relatorio | ordem trocada; teste reescrito |
| `features/profiles/profile-screens.ts` | Relatorios - Lancamentos antes de Categorias | ordem trocada |
| `features/profiles/profiles.spec.ts` (l. 99-109), `profile-form.spec.ts` (`SCREEN_ROWS`) | ordem antiga | ordem nova |
| `backend/.../documentation/content/OverviewContent.java` | "Como navegar" (l. 60-61), painel Mais (l. 68), tela de entrada (l. 102-104) | Cadastros antes de Relatorios |
| `backend/.../documentation/content/ProfilesAreaContent.java` (l. 66-68) | linhas da matriz sem Relatorios - Lancamentos | lista completa na nova ordem |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` (l. 65) | "Icone da guia: a guia do navegador passa a mostrar a marca do FinanceOS." | item reescrito |
| `DocumentationContentTest`, `ReleaseNotesContentTest` | asseveram os textos atuais | ajustados |

## Convencoes aplicaveis

- Todo texto exibido em portugues acentuado; titulo de teste e fixture do frontend entram na varredura (ex.: "Icone" sem acento casa). Varreduras (devem sair vazias), literais de `knowledge/architecture.md`:
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Recurso externo (literal de `knowledge/frontend-ui.md`, deve sair vazia): `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'`
- Cor literal em `.scss` (deve sair vazia): `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"`
- Sem comentario no codigo salvo "porque" nao obvio. Nunca editar `VERSION`/`pom.xml`/`version.ts` (o hook sobe a build no commit).

## Consultas fora do briefing

Nenhuma ate agora.
