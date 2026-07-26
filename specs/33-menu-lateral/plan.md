# Plano de implementacao

## Abordagem

Reorganizar o menu lateral em `frontend/src/app/layout/main-layout/` replicando o padrao ja existente do grupo "Cadastros" (`nav-group`/`nav-parent`/`nav-children` + signal de expansao + funcao `is*Active()`) para um novo grupo "Configuracoes" que absorve os itens "Usuarios" e "Perfis". Para o modo minimizado, cada botao de navegacao passa a renderizar um identificador quando `collapsed()` (letra inicial para itens simples, glifo unicode distinto para cada grupo — o projeto nao tem biblioteca de icones; o precedente e o `&#9099;` do botao "Sair"), e clicar num grupo minimizado expande o menu inteiro e abre aquele grupo. A feature e **exclusivamente frontend** (confirmado no codigo: os unicos usos de `isRegistersActive`/`registersExpanded` estao no proprio componente de layout; nenhuma `Screen` nova, nenhum endpoint, nenhuma migration). Nao ha regra de negocio nova: a visibilidade por `authService.can(screen, 'VIEW')` e so espelho de UX — a autorizacao real ja esta no backend (`AccessControl`) e nas rotas (`permissionGuard`), que nao mudam.

## Arquivos a alterar

### Backend

Nenhum. Nao ha regra de negocio nova: "Configuracoes" e agrupador visual, sem `Screen` propria, e as permissoes `USERS/VIEW` e `PROFILES/VIEW` ja sao impostas hoje pelo `AccessControl` nos endpoints e pelo `permissionGuard` nas rotas `/users` e `/profiles` (criterio 11 exige explicitamente zero alteracao de backend).

### Frontend

- `frontend/src/app/layout/main-layout/main-layout.ts` — adicionar signal `settingsExpanded` e metodos `toggleSettings()`, `isSettingsActive()` (`router.url` comeca com `/users` ou `/profiles`, mesmo padrao de `isRegistersActive()`) e `canSeeSettings()` (`can('USERS','VIEW') || can('PROFILES','VIEW')`). Alterar os toggles dos grupos para tratar o modo minimizado: quando `collapsed()`, o clique no pai do grupo faz `collapsed.set(false)` e `<grupo>Expanded.set(true)` (expande o menu inteiro e abre o grupo, sem navegar — decisao 2); quando expandido, mantem o toggle atual. Aplicar o mesmo comportamento a `toggleRegisters()` para os dois grupos ficarem consistentes (criterio 6 cita ambos).
- `frontend/src/app/layout/main-layout/main-layout.html` — (1) remover os botoes de nivel superior "Usuarios" e "Perfis" e criar o `nav-group` "Configuracoes" com `*ngIf="canSeeSettings()"` no grupo, `*ngIf="authService.can('USERS','VIEW')"` no subitem "Usuarios" (`routerLink="/users"`, `routerLinkActive="active"`) e `*ngIf="authService.can('PROFILES','VIEW')"` no subitem "Perfis" (`routerLink="/profiles"`); pai com `[class.active]="isSettingsActive()"`, filhos renderizados so com `settingsExpanded() && !collapsed()` — espelho exato do bloco "Cadastros". (2) Nos botoes de navegacao, adicionar o identificador do modo minimizado: `<span class="nav-abbr" *ngIf="collapsed()">R</span>` em "Resumo", `L` em "Lancamentos", e nos pais dos grupos glifos unicode distintos (ex.: `&#9776;` para "Cadastros" e `&#9881;` para "Configuracoes") com `title` e `aria-label` em portugues ("Cadastros"/"Configuracoes") quando minimizado. O botao "Sair", o rodape e o `brand-block` nao mudam (decisao 3).
- `frontend/src/app/layout/main-layout/main-layout.scss` — estilos do modo minimizado: no estado `.sidebar.collapsed`, botoes de `.nav-list` com identificador centralizado (`text-align: center`, `padding` lateral reduzido) e altura minima consistente (ex.: `min-height` igual a do botao expandido) para evitar colapso de altura/desalinhamento; garantir que nada transborde a largura de 72px (`overflow: hidden` onde preciso). A classe `active` ja existente cobre o destaque do pai no modo minimizado (criterio 7) sem estilo novo alem do posicionamento.
- `frontend/src/app/layout/main-layout/main-layout.spec.ts` — atualizar os 2 testes existentes (a contagem `.nav-list button` muda: "Usuarios" e "Perfis" saem do nivel superior e entra o pai "Configuracoes") e adicionar os testes do criterio 10, dirigidos pelo DOM como manda o padrao do projeto (membros `protected`; usar `authService.superAdmin.set(true)` ou `authService.permissions.set([...])` para montar cenarios de permissao): (a) grupo "Configuracoes" visivel com `USERS/VIEW` apenas, com `PROFILES/VIEW` apenas, e ausente sem nenhuma das duas; (b) subitens renderizados so com a respectiva permissao apos clicar no pai; (c) com o menu minimizado (clicar no `.collapse-toggle`), os botoes exibem letra/glifo (textContent nao vazio) em vez de vazios; (d) clicar no pai de um grupo minimizado remove o estado colapsado da sidebar e renderiza os subitens do grupo, sem navegar.

### Migration (se houver mudanca de schema)

Nenhuma — nao ha mudanca de schema.

## Ordem geral

Tudo em uma camada so (componente de layout). Ordem natural: primeiro o `.ts` (signals/metodos novos), depois o `.html` (que depende dos metodos), depois o `.scss` (estiliza a estrutura nova), e por ultimo o `.spec.ts` (testa o resultado final). `npm test` e `npm run build` fecham a verificacao.

## Superficie de validacao

- Criterio 1 — teste de componente (`main-layout.spec.ts`: grupo "Configuracoes" com subitens "Usuarios"/"Perfis" e ausencia deles no nivel superior) + validacao na tela: em `http://localhost`, logado como admin, ver o menu com "Resumo", "Lancamentos", "Cadastros", "Configuracoes"; clicar em "Configuracoes" e ver "Usuarios" e "Perfis" como subitens.
- Criterio 2 — teste de componente cobrindo as 4 combinacoes de permissao (so `USERS/VIEW`, so `PROFILES/VIEW`, ambas, nenhuma). Validacao adicional na tela exige um usuario com perfil restrito — se houver um disponivel no ambiente local, logar com ele e conferir o menu; senao, a evidencia fica nos testes (limite conhecido: as senhas seed foram rotacionadas, a esteira nao autentica sozinha).
- Criterio 3 — validacao na tela: com o menu expandido, abrir "Configuracoes", clicar em "Usuarios" (deve carregar `/users` com o subitem destacado e o pai "Configuracoes" destacado) e depois "Perfis" (idem para `/profiles`).
- Criterio 4 — teste de componente (item c do criterio 10: botoes minimizados com textContent/glifo nao vazio) + validacao na tela: minimizar o menu pelo botao `«` e conferir "R", "L" e dois icones distintos para os grupos, todos centralizados e com a mesma altura.
- Criterio 5 — validacao na tela: com o menu minimizado, conferir largura reduzida estavel, nenhum texto cortado, `»`, marca "F" e "Sair" visiveis/clicaveis; alternar minimizado/expandido ~5 vezes seguidas e conferir que o layout se mantem.
- Criterio 6 — teste de componente (item d: clicar no pai de grupo minimizado expande a sidebar e renderiza os subitens, sem navegacao) + validacao na tela: minimizado, clicar em "Resumo"/"Lancamentos" (navega) e no icone de "Configuracoes" (menu expande com o grupo aberto, rota inalterada); idem para "Cadastros".
- Criterio 7 — validacao na tela: navegar para `/users`, minimizar o menu e conferir que o icone de "Configuracoes" esta com o destaque de ativo; repetir com `/categories` e o icone de "Cadastros".
- Criterio 8 — validacao na tela: nos dois modos, conferir que "Sair" e o rodape (nome do usuario + versao) estao identicos ao comportamento atual (rodape some minimizado, "Sair" mostra o glifo `⏻` atual); reforcado pelo diff (nenhuma linha desses blocos alterada).
- Criterio 9 — inspecao do diff do `.html` (rotulos, `title`/`aria-label` em portugues) + validacao na tela: hover nos icones minimizados mostra tooltip em portugues.
- Criterio 10 — `npm test` passa com os testes novos (a)-(d) presentes em `main-layout.spec.ts`.
- Criterio 11 — `npm run build` no `frontend/` conclui sem erros; `git status` mostra zero arquivos alterados fora de `frontend/` e `specs/`.

## Riscos e pontos de atencao

- **Testes existentes quebram por design**: os dois specs atuais contam `.nav-list button` (5 com super admin). A reorganizacao muda essa contagem e, alem disso, os subitens de "Configuracoes" so aparecem apos expandir o grupo — os testes precisam ser atualizados junto, nao apenas acrescidos.
- **Media queries do sidebar** (`main-layout.scss`, breakpoints 1080px/680px): o layout muda para horizontal/grid em telas estreitas e os estilos novos do modo minimizado (`.sidebar.collapsed`) nao devem vazar para esses breakpoints nem ser quebrados por eles — conferir visualmente ao menos o comportamento em janela estreita.
- **Sem biblioteca de icones no projeto**: os "icones distintos" da decisao 1 serao glifos unicode (precedente: `&#9099;` no "Sair"). Se o glifo escolhido renderizar mal em algum navegador/fonte, a alternativa e SVG inline — decisao local de implementacao, sem impacto de arquitetura.
- **Nao esquecer o par do "Cadastros"**: o criterio 6 exige o comportamento "expandir e abrir" tambem para "Cadastros" minimizado; alterar so o grupo novo deixaria os dois grupos inconsistentes.
- Nenhum risco de regra de negocio: `knowledge/auth-and-permissions.md` confirma que `can()` e so gate de UX e que rotas/API continuam protegidas por `permissionGuard`/`AccessControl` sem alteracao.
