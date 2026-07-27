# Arquitetura e convencoes

## Stack

- **Backend**: Java + Quarkus, Panache (JPA simplificado), JAX-RS. Sem camada de "service" separada — as classes `*Resource` (JAX-RS) contem a regra de negocio diretamente e chamam `*Repository` (Panache) para persistencia. Pacote por feature em `backend/src/main/java/br/com/financeos/{auth,categories,dashboard,profiles,shared,transactions,users}` (`accounts`/`cards` existiram ate a issue #20, quando Contas e Cartoes foram removidos por completo do sistema — ver `knowledge/accounts.md`/`knowledge/cards.md`).
- **Migrations**: Flyway, `backend/src/main/resources/db/migration/V<n>__descricao.sql`. Nunca editar uma migration ja commitada — sempre criar uma nova `V<n+1>`. `check` constraints criados inline sem nome explicito (ex.: o de `profile_permissions.screen` na V5) recebem nome autogerado pelo Postgres por convencao (`<tabela>_<coluna>_check`), mas isso deve ser **confirmado no banco** (`select conname from pg_constraint where conrelid = '<tabela>'::regclass and contype = 'c';`) antes de escrever `DROP CONSTRAINT <nome>` numa migration nova — um nome errado quebra a migration e a aplicacao inteira nao sobe (ver issue #20, `V9__remove_accounts_and_cards.sql`).
- **Frontend**: Angular standalone (sem NgModules), em `frontend/src/app`. `core/` = services/guards/interceptors/models compartilhados; `features/<nome>/` = tela (componente + `.html` + `.scss`); `layout/` = shell da aplicacao.
- **Banco**: PostgreSQL via `docker compose up -d postgres`.
- **Auth**: JWT (SmallRye JWT), chaves RSA em `backend/src/main/resources/{privateKey,publicKey}.pem` (gitignored). As senhas dos usuarios seed foram rotacionadas para fora do repositorio (`V10__rotate_seeded_user_passwords.sql`, issue #29): nenhuma etapa automatizada consegue autenticar via `POST /api/auth/login` na stack local sem a senha atual, que so o usuario tem — verificacoes de API autenticada devem prever esse limite e cair para validacao manual quando nao houver credencial (constatado na esteira da issue #31).

## Comandos

```bash
# Backend
cd backend
./mvnw test                    # roda os testes
./mvnw -q package -DskipTests  # gera o jar (validar empacotamento)
./mvnw quarkus:dev             # modo dev com hot reload

# Frontend
cd frontend
npm test          # ng test (vitest)
npm run build     # ng build
npm start         # ng serve (dev)

# Stack completa (Docker) - sempre com --build, senao roda imagem desatualizada
docker compose up -d --build
# ou, no Windows:
powershell -File scripts/docker-up.ps1
```

Com a stack completa no ar: tela em `http://localhost` (nginx, `FRONTEND_PORT`) e API em `http://localhost:8080` (`BACKEND_PORT`), com health em `GET /api/health`. Esse e o ambiente onde a esteira pede validacao manual antes de commitar (ver [specs/README.md](../specs/README.md)).

Swagger/OpenAPI em dev: `http://localhost:8080/docs` e `http://localhost:8080/openapi`.

## Convencoes de codigo

- **Sem comentarios** a menos que expliquem um "porque" nao-obvio (regra geral do projeto, nao so desta esteira).
- Todo endpoint que le ou escreve dado chama `accessControl.require(Screen.X, Action.Y)` como primeira linha do metodo — ver [auth-and-permissions.md](auth-and-permissions.md). Qualquer endpoint novo deve seguir esse padrao.
- Exclusao normalmente e **soft delete** (`active=false`) ou, no caso de transacoes, mudanca de status para `CANCELED` — nao ha hard delete de registros de negocio (so perfis sem uso e usuarios sao excecoes especificas, ver docs de dominio).
- **Botao "Cancelar" nos formularios de cadastro** (issues #28/#31): as quatro telas com formulario (Categorias, Usuarios, Perfis e "Novo lancamento") tem um botao "Cancelar" ao lado de "Salvar" — `type="button"`, rotulo fixo, sempre visivel dentro do `<form>` ja protegido por `authService.can(...)` — que age so no estado local e **nunca dispara requisicao HTTP**. Desde a issue #31, os formularios de Lancamentos, Categorias e Usuarios sao **somente de criacao** (a edicao desses registros e inline na tabela — ver bullet abaixo) e o Cancelar deles e de **estagio unico**: repoe o formulario ao estado inicial (em Usuarios, limpando tambem as mensagens de validacao por campo e a faixa de erro do topo). **Perfis** e a unica tela que mantem o modo de edicao no formulario lateral (nome + matriz de permissoes) e, com ele, o Cancelar de **dois estagios** da issue #28: com alteracao pendente em relacao ao snapshot do registro carregado (`isDirty()` via `JSON.stringify`), o 1o clique restaura o snapshot e mantem a edicao; sem alteracao, o clique sai da edicao e limpa. Sem modal de confirmacao nos formularios. Particularidades por tela nos docs de dominio.
- **Edicao inline e layout das tabelas de cadastro** (issue #31): Lancamentos, Categorias e Usuarios editam registros **na propria linha da tabela** (padrao nascido em Lancamentos): "Editar" (visivel com a permissao `EDIT` da tela) vira a linha em modo de edicao, uma linha por vez ("Editar" das demais fica `disabled`), botoes "Salvar" (`PUT` + recarrega a lista) e "Sair" — que, com alteracao pendente vs. snapshot (`JSON.stringify`), abre o modal "Deseja sair sem salvar?" e, sem alteracao, sai direto sem HTTP. Base visual compartilhada em `frontend/src/styles.scss`: `.danger-button` (fundo `#b84a3f`, texto branco, mesmas dimensoes de `.primary-button`/`.ghost-button`) e o padrao para **todo botao com papel de cancelar/descartar** (o "Cancelar" dos formularios, o "Cancelar" da tabela de Lancamentos e o "Sair" da edicao inline); `.row-actions` global da largura fixa de 90px e `min-height: 32px` aos botoes de linha (a coluna de acoes nao muda de tamanho ao alternar leitura/edicao); `.modal-backdrop`/`.modal-card`/`.modal-actions` sao globais; e `table.fixed-layout` (`table-layout: fixed` + `<colgroup>` com larguras por coluna em cada tela, celulas com `white-space: normal` + `overflow-wrap: anywhere`) garante que entrar em edicao **nao altera a largura de nenhuma coluna** — aplicado por classe, e nao no seletor global `table`, de proposito, para nao afetar tabelas fora do padrao (ex.: Perfis). Tabela de cadastro nova deve seguir esses utilitarios.
- **Menu lateral minimizado** (issue #33): com a sidebar recolhida (`collapsed`), todo botao de navegacao exibe um identificador (`<span class="nav-abbr">`) em vez de ficar vazio — letra inicial nos itens simples ("R" Resumo, "L" Lancamentos) e **glifos unicode distintos** nos pais de grupo (`&#9776;` ☰ Cadastros, `&#9881;` ⚙ Configuracoes). O projeto **nao tem biblioteca de icones** — icone de UI e glifo unicode (precedente: `&#9099;` ⏻ no "Sair") ou, se renderizar mal, SVG inline. `title`/`aria-label` em portugues sao aplicados **apenas quando minimizado** (`[attr.title]="collapsed() ? '...' : null"`). Subitens de grupo nunca renderizam minimizados: clicar no pai de um grupo minimizado expande o menu inteiro (`collapsed.set(false)`) e abre aquele grupo, sem navegar — comportamento igual para todos os grupos. Item ou grupo novo no menu deve seguir esse padrao (identificador no modo minimizado + `min-height` consistente via `.nav-abbr`/`.sidebar.collapsed .nav-list button` em `main-layout.scss`).
- **Erros de regra do backend chegam com corpo vazio ao Angular**: os erros de negocio sao lancados como `WebApplicationException(mensagem, status)` **sem entity**, e o projeto nao tem nenhum `ExceptionMapper` — a mensagem do construtor nao vira corpo da resposta (confirmado empiricamente na issue #31: `content-length: 0`). O padrao no frontend e tentar extrair a mensagem do corpo quando existir (string ou `{message}`) e, vazio, usar **fallback por status** com o texto conhecido em portugues daquele endpoint (ex.: 409 do `PUT /api/categories/{id}` -> "Ja existe uma categoria com esse nome e tipo.") — isso e traducao de um status decidido pelo backend, nao regra nova no front. O fallback so vale quando o status e inequivoco para o endpoint (um unico motivo possivel); se o mesmo endpoint puder responder o mesmo status por motivos diferentes, e preciso outra estrategia (ex.: `ExceptionMapper` no backend). Excecao ja tratada: o 400 de Bean Validation tem corpo com `violations[]` normalmente.
- Testes de backend usam `quarkus-test-security`/`quarkus-test-security-jwt` para simular usuario autenticado.
- Testes de frontend: alem dos specs de `core/`, ha testes de **componente** em `features/*/<tela>.spec.ts` (primeiros criados na issue #28). Como os membros dos componentes sao `protected`, os testes dirigem tudo pelo DOM (`value` + `dispatchEvent`, `click()`), usam `HttpTestingController` com `httpMock.verify()` no `afterEach` e provam ausencia de chamadas com `httpMock.expectNone(() => true)` — padrao a seguir em testes de componente novos.

## Idioma

- **Commits e Pull Requests em portugues** (convencao ja estabelecida no projeto). Titulo curto e direto, corpo (quando houver) focado no "porque".
- Nomes de variaveis/classes/rotas seguem o que ja existe no codigo (majoritariamente em ingles nos identificadores, portugues nos textos/UI voltados ao usuario).
