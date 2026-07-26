# Tarefas

Ordem de execucao. `/pipeline:implement` marca cada tarefa como concluida conforme avanca.

## Frontend

- [x] **T1** — Adicionar ao componente de layout o estado e a logica do grupo "Configuracoes" e o comportamento dos grupos no modo minimizado: signal `settingsExpanded`, metodos `toggleSettings()`, `isSettingsActive()` (rota atual comeca com `/users` ou `/profiles`, mesmo padrao de `isRegistersActive()`) e `canSeeSettings()` (`can('USERS','VIEW') || can('PROFILES','VIEW')`); alterar os toggles de **ambos** os grupos ("Cadastros" e "Configuracoes") para, quando `collapsed()`, expandir o menu inteiro (`collapsed.set(false)`) e abrir o grupo clicado, sem navegar.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.ts`
  - Criterios: 1, 2, 3, 6
- [x] **T2** — Reorganizar o template do menu: remover os botoes de nivel superior "Usuarios" e "Perfis" e criar o `nav-group` "Configuracoes" espelhando o bloco "Cadastros" — grupo com `*ngIf="canSeeSettings()"`, pai com `[class.active]="isSettingsActive()"`, filhos renderizados so com `settingsExpanded() && !collapsed()`, subitem "Usuarios" (`routerLink="/users"`, `routerLinkActive="active"`, `*ngIf="authService.can('USERS','VIEW')"`) e subitem "Perfis" (`routerLink="/profiles"`, idem com `PROFILES/VIEW`); todos os rotulos em portugues.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 1, 2, 3, 9
- [x] **T3** — Adicionar os identificadores do modo minimizado nos botoes de navegacao: `<span class="nav-abbr" *ngIf="collapsed()">` com "R" em "Resumo" e "L" em "Lancamentos", e glifos unicode distintos nos pais dos grupos (ex.: `&#9776;` para "Cadastros" e `&#9881;` para "Configuracoes"), com `title` e `aria-label` em portugues quando minimizado; nao tocar no botao "Sair", no rodape nem no `brand-block` (decisao 3).
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.html`
  - Criterios: 4, 6, 7, 9
- [x] **T4** — Estilizar o modo minimizado em `.sidebar.collapsed`: identificador centralizado nos botoes de `.nav-list` (`text-align: center`, padding lateral reduzido), `min-height` consistente com o botao expandido (sem colapso de altura/desalinhamento), `overflow: hidden` onde preciso para nada transbordar a largura reduzida; garantir que os estilos novos nao vazem para os breakpoints 1080px/680px nem sejam quebrados por eles.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.scss`
  - Criterios: 4, 5, 7

## Testes e verificacao

- [x] **T5** — Atualizar os 2 testes existentes do layout (a contagem de `.nav-list button` muda com a reorganizacao) e adicionar os testes do criterio 10, dirigidos pelo DOM no padrao do projeto (`authService.superAdmin.set(...)`/`authService.permissions.set([...])`): (a) grupo "Configuracoes" visivel so com `USERS/VIEW`, so com `PROFILES/VIEW`, e ausente sem nenhuma das duas; (b) subitens renderizados so com a respectiva permissao apos clicar no pai; (c) com o menu minimizado, os botoes exibem letra/glifo (textContent nao vazio) em vez de vazios; (d) clicar no pai de um grupo minimizado remove o estado colapsado e renderiza os subitens do grupo, sem navegar.
  - Arquivos: `frontend/src/app/layout/main-layout/main-layout.spec.ts`
  - Criterios: 1, 2, 4, 6, 10
- [x] **T6** — Rodar `npm test` e `npm run build` no `frontend/` e conferir no diff (`git status`/`git diff`) que nenhum arquivo de backend foi alterado e que os blocos do botao "Sair", do rodape e do `brand-block` estao intactos.
  - Arquivos: nenhum (verificacao; `frontend/` como um todo)
  - Criterios: 8, 10, 11

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Grupo "Configuracoes" com subitens Usuarios/Perfis, fora do nivel superior | T1, T2, T5 |
| 2 | Visibilidade por permissao (USERS/VIEW, PROFILES/VIEW, grupo com ao menos uma) | T1, T2, T5 |
| 3 | Navegacao e destaque de ativo (subitem e pai via `isSettingsActive()`) | T1, T2 |
| 4 | Minimizado: letra "R"/"L" e icones distintos nos grupos, altura/alinhamento consistentes | T3, T4, T5 |
| 5 | Minimizado: layout integro (largura fixa, sem corte, toggle/marca/Sair clicaveis) | T4 |
| 6 | Minimizado: itens funcionais; clicar em grupo expande o menu e abre o grupo | T1, T3, T5 |
| 7 | Pai ativo identificavel tambem minimizado | T3, T4 |
| 8 | "Sair" e rodape inalterados nos dois modos | T6 |
| 9 | Textos novos em portugues (rotulos, `title`/`aria-label`) | T2, T3 |
| 10 | Testes de componente (a)-(d) e `npm test` passando | T5, T6 |
| 11 | `npm run build` sem erros; zero alteracao de backend | T6 |

## Lacunas

- Nenhuma — todos os criterios de aceite estao cobertos por ao menos uma tarefa, e nenhuma tarefa ficou sem criterio.
- Observacoes de cobertura (nao sao lacunas): os criterios 5 e 7 nao tem teste automatizado — a propria spec/plano os define como validacao visual em `http://localhost` na etapa `/pipeline:verify` (comportamento de CSS/layout). O criterio 8 e um criterio de "nao mudanca", coberto por verificacao de diff (T6), nao por codigo novo. Nao ha regra de negocio ficando so no frontend: a visibilidade por `can(...)` e espelho de UX e a autorizacao real ja existe no backend (`AccessControl`) e nas rotas (`permissionGuard`), sem alteracao nesta feature.
