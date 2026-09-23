# Briefing — issue 75

## Regras que restringem esta mudanca

- Quem rola e o **documento**: `.workspace` nao tem `overflow` proprio e `withInMemoryScrolling({ scrollPositionRestoration: 'top' })` em `app.config.ts` leva ao topo a cada troca de tela. "Nao espalhar `scrollTo` por componente": o botao e o unico ponto novo que rola, e o `scrollPositionRestoration` tem de continuar la (`knowledge/frontend-ui.md`).
- `onNavigate()` do menu move o foco para `<section class="workspace" #workspace tabindex="-1">` (`.workspace:focus { outline: none }`) — e o mesmo alvo de foco do CA06 (`knowledge/frontend-ui.md`).
- Camadas fixas existentes: trilho 50, `.mobile-topbar` 60, scrim da gaveta 70, gaveta 80, modal 200/201, toasts 999 (canto superior direito). O botao precisa ficar abaixo de 70 (`knowledge/frontend-ui.md`).
- Todo elemento `position: fixed` soma `env(safe-area-inset-*)` (`knowledge/frontend-ui.md`, "Responsividade e mobile").
- Elemento oculto nao pode continuar tabulavel: a gaveta fechada e `visibility: hidden`, com transicao de `visibility` `0s linear 0s` ao abrir e `0s linear <duracao>` ao fechar (licao da #54) (`knowledge/frontend-ui.md`).
- Alvo de toque `--touch-target` (44px) **so ate 480px**; aplicar no desktop muda a densidade. Breakpoints unicos 1080/680/480, sempre literais na `@media` (custom property nao funciona em media query) (`knowledge/frontend-ui.md`).
- `styles.scss` e o unico arquivo com cor literal; `.scss` de componente usa `var(--token)`, nunca `white`/`black`. Tokens uteis: `--accent`, `--accent-hover`, `--surface`, `--shadow-card`, `--radius-pill`, `--touch-target` (`knowledge/frontend-ui.md`, "Design system").
- Todo `:hover` dentro de `@media (hover: hover)`. Icone = SVG inline 20px, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, `aria-hidden="true"`; sem biblioteca (`knowledge/frontend-ui.md`).
- App **zoneless**: visibilidade em signal. `TestBed.createComponent` ja dispara o ciclo por auto-deteccao (`knowledge/testing.md`).
- jsdom: **nao tem `window.matchMedia`**, nao aplica CSS, `getBoundingClientRect` vem 0 e `window.scrollTo` nao e implementado. Codigo que consulta `matchMedia` precisa de guarda; teste de visibilidade observa atributo/classe, nunca CSS computado; o que so fecha com pixel vai para validacao manual (`knowledge/testing.md`).
- Testes de componente: vitest (sem `jasmine`), dirigidos pelo DOM (membros `protected`); em `main-layout.spec.ts` a navegacao usa `provideRouter([{ path: '**', component: BlankPage }])` (`knowledge/testing.md`).
- Novidades por versao: dado tipado em `ReleaseNotesContent.java`; um bloco por `X.Y.Z` (corrente: `versao_1_0_2()`), item em linguagem de usuario, sem identificador tecnico (o `ReleaseNotesContentTest` barra `JWT`, enums etc.) e sem repetir item entre blocos (`knowledge/documentation.md`).
- Acentuacao: texto exibido acentuado; varreduras com **baseline** (frontend 2, backend 6 linhas) e nenhuma ocorrencia nova — o regex do backend pega `lancamento`/`periodo` minusculos; o do front cobre `*.spec.ts` (titulo de teste nao pode ter `nao`, `possivel` etc. sem acento) (`knowledge/architecture.md`, "Idioma").
- A Central documenta a navegacao em `OverviewContent.navegacao()` ("Como navegar"); mudanca visivel tem dois consumidores escritos a mao (Central e Novidades), e esta issue atualiza os dois. Conteudo da Central: linguagem de usuario com os rotulos da UI, nada inventado, paragrafo curto (<= 600 caracteres, coberto por teste) (`knowledge/documentation.md`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `frontend/src/app/core/back-to-top/back-to-top.{ts,html,scss}` | nao existe | componente novo `app-back-to-top` (signal `visible`, listener unico, `scrollTo`, foco no alvo recebido por `input()`) |
| `frontend/src/app/core/back-to-top/back-to-top.spec.ts` | nao existe | testes de CA01-CA06, CA13, CA15 |
| `frontend/src/app/layout/main-layout/main-layout.html` | shell: topbar, gaveta, `<section class="workspace" #workspace>` | monta `<app-back-to-top [focusTarget]="workspace" />` uma vez |
| `frontend/src/app/layout/main-layout/main-layout.ts` | `imports` do shell | acrescenta `BackToTop` aos `imports` |
| `frontend/src/app/layout/main-layout/main-layout.spec.ts` | testes do shell | caso: navegar entre rotas nao cria listener de `scroll` novo |
| `frontend/src/app/app.html` | `<router-outlet />` + `<app-toast-host />` | **nao muda** (login nao recebe o botao) |
| `frontend/src/app/app.config.ts` | `scrollPositionRestoration: 'top'` | **nao muda** |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` | bloco 1.0.2 com NEW/IMPROVEMENT/FIX | 1 item novo em `Kind.IMPROVEMENT` |
| `backend/src/test/.../releasenotes/ReleaseNotesContentTest.java` e `ReleaseNotesResourceTest.java` | contrato do conteudo e do endpoint | assercao do item novo em IMPROVEMENT do 1.0.2 |
| `backend/.../documentation/content/OverviewContent.java` | `navegacao()` = secao "Como navegar" da introducao (menu, gaveta) | paragrafo novo sobre o botao "Voltar ao topo" (CA19) |
| `backend/src/test/.../documentation/DocumentationContentTest.java` | limita paragrafo a 600 caracteres, barra identificador tecnico | teste do paragrafo em "Como navegar" |

## Convencoes aplicaveis

- Componente global montado uma vez (precedente `app-toast-host`), aqui no shell `main-layout.html` para nao alcancar `/login`; nenhum arquivo de `features/` muda.
- Sem comentarios no codigo, salvo "porque" nao-obvio (ex.: `preventScroll` no foco).
- Texto exibido em portugues acentuado: `aria-label`/`title` "Voltar ao topo".
- Budget `anyComponentStyle` 8 kB por `.scss` de componente; `npm run build` sem warning novo.
- Signal inputs (`input()`), no padrao de `core/confirm-dialog`.

## Consultas fora do briefing

- Etapa 7 (verify): abri `knowledge/architecture.md` ("Idioma") para copiar os dois comandos `rg` das varreduras de acentuacao do CA18 — o briefing traz os baselines, mas nao os comandos.
