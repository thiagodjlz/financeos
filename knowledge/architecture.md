# Arquitetura e convencoes

## Stack

- **Backend**: Java + Quarkus, Panache (JPA simplificado), JAX-RS. Sem camada de "service" separada — as classes `*Resource` (JAX-RS) contem a regra de negocio diretamente e chamam `*Repository` (Panache) para persistencia. Pacote por feature em `backend/src/main/java/br/com/financeos/{auth,categories,dashboard,profiles,shared,transactions,users}` (`accounts`/`cards` existiram ate a issue #20, quando Contas e Cartoes foram removidos por completo do sistema — ver `knowledge/accounts.md`/`knowledge/cards.md`).
- **Migrations**: Flyway, `backend/src/main/resources/db/migration/V<n>__descricao.sql`. Nunca editar uma migration ja commitada — sempre criar uma nova `V<n+1>`. `check` constraints criados inline sem nome explicito (ex.: o de `profile_permissions.screen` na V5) recebem nome autogerado pelo Postgres por convencao (`<tabela>_<coluna>_check`), mas isso deve ser **confirmado no banco** (`select conname from pg_constraint where conrelid = '<tabela>'::regclass and contype = 'c';`) antes de escrever `DROP CONSTRAINT <nome>` numa migration nova — um nome errado quebra a migration e a aplicacao inteira nao sobe (ver issue #20, `V9__remove_accounts_and_cards.sql`).
- **Frontend**: Angular standalone (sem NgModules), em `frontend/src/app`. `core/` = services/guards/interceptors/models compartilhados; `features/<nome>/` = tela (componente + `.html` + `.scss`); `layout/` = shell da aplicacao.
- **Banco**: PostgreSQL via `docker compose up -d postgres`.
- **Auth**: JWT (SmallRye JWT), chaves RSA em `backend/src/main/resources/{privateKey,publicKey}.pem` (gitignored) — caminho sobrescrevivel por `JWT_PRIVATE_KEY_LOCATION`/`JWT_PUBLIC_KEY_LOCATION`, que e como producao usa um par proprio. As senhas dos usuarios seed foram rotacionadas para fora do repositorio (`V10__rotate_seeded_user_passwords.sql`, issue #29): nenhuma etapa automatizada consegue autenticar via `POST /api/auth/login` na stack local sem a senha atual, que so o usuario tem — verificacoes de API autenticada devem prever esse limite e cair para validacao manual quando nao houver credencial (constatado na esteira da issue #31).

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

Swagger/OpenAPI no ambiente local: `http://localhost:8080/docs/` e `http://localhost:8080/openapi` — **na raiz, fora do `quarkus.http.root-path=/api`** (nao existe `/api/docs`; errar isso faz uma verificacao de "esta bloqueado?" passar sem ter testado nada). Em producao os dois somem, por dois mecanismos diferentes, porque as chaves de configuracao tem naturezas diferentes:

- `quarkus.swagger-ui.always-include` e **build-time**: a imagem de producao e construida com `--build-arg SWAGGER_UI=false` (`ARG` no `backend/Dockerfile`). Passar essa chave em runtime nao tem efeito.
- `quarkus.smallrye-openapi.enable` e **runtime**: vai como `QUARKUS_SMALLRYE_OPENAPI_ENABLE=false` no `docker-compose.prod.yml`. Passa-la ao `mvn package` e aceito sem aviso e **nao faz nada** — a pegadinha custou uma verificacao invalida.
- O Caddy ainda devolve 404 para `/docs*` e `/openapi*`, como rede de seguranca para uma imagem reconstruida na mao.

## Versionamento e branches

Fonte da verdade: arquivo `VERSION` na raiz. Formato `X.Y.Z-NN` (versao + build) nas branches de versao e `X.Y.Z-dev` na `main`. Comandos e detalhes no [README.md](../README.md#versionamento-e-branches).

- `main` = versao em desenvolvimento, nunca publicada. `vX.Y.Z` = branch de uma versao cortada, de onde sai o deploy.
- O numero de build conta **correcoes publicadas numa versao**: ele sobe sozinho, via hook `.githooks/pre-commit`, em qualquer commit feito numa branch de versao ou numa branch criada a partir de uma (`branch.<nome>.financeosVersionBase`). O hook nao roda em merge/rebase/cherry-pick. Ele precisa de `core.hooksPath` apontando para `.githooks`, e isso se resolve sozinho: `npm install` no frontend (script `prepare` -> `scripts/ensure-hooks.js`), os proprios scripts de versao e a etapa de implementacao da esteira ativam quando esta faltando; `scripts/install-hooks.ps1` existe para forcar ou desativar.
- `scripts/lib/version-lib.ps1` e o unico lugar que sabe quais arquivos carregam a versao (`VERSION`, `backend/pom.xml`, `frontend/src/app/core/version.ts`, `frontend/package.json`, `frontend/package-lock.json`, `APP_VERSION` no `.env`/`.env.example`) — qualquer script novo de versao deve usar essa lib em vez de reescrever os regex.
- `package.json`/`package-lock.json` guardam so `X.Y.Z`: `1.0.1-02` nao e semver valido (zero a esquerda no identificador numerico) e quebraria o npm. A versao completa vive no `VERSION`, no `pom.xml` (e portanto em `GET /api/health`), no rodape do frontend e nas tags das imagens Docker.
- Migracao Flyway nao volta atras: o rollback de `scripts/update-environment.ps1` devolve o codigo, nao o banco — por isso ele faz dump antes de atualizar.

## Convencoes de codigo

- **Sem comentarios** a menos que expliquem um "porque" nao-obvio (regra geral do projeto, nao so desta esteira).
- Todo endpoint que le ou escreve dado chama `accessControl.require(Screen.X, Action.Y)` como primeira linha do metodo — ver [auth-and-permissions.md](auth-and-permissions.md). Qualquer endpoint novo deve seguir esse padrao.
- Exclusao normalmente e **soft delete** (`active=false`) ou, no caso de transacoes, mudanca de status para `CANCELED` — nao ha hard delete de registros de negocio (so perfis sem uso e usuarios sao excecoes especificas, ver docs de dominio).
- **Toda regra de negocio e validacao e imposta no back-end** (Bean Validation no DTO ou checagem no `Resource`, com erro em portugues). O front-end pode espelhar a regra como UX, mas nunca ser o unico lugar dela; constraint de banco e rede de seguranca (excecao: PKs e FKs). Detalhes de como o erro chega a tela em [backend-patterns.md](backend-patterns.md).

## Idioma

- **Commits e Pull Requests em portugues** (convencao ja estabelecida no projeto). Titulo curto e direto, corpo (quando houver) focado no "porque".
- Nomes de variaveis/classes/rotas seguem o que ja existe no codigo (majoritariamente em ingles nos identificadores, portugues nos textos/UI voltados ao usuario).
- **Todo texto exibido ao usuario e acentuado corretamente** (issue #39, que passou o app inteiro a limpo): labels, botoes, placeholders, titulos, tooltips e `title`/`aria-label` do menu recolhido, `.empty-state`, modais, **e tambem as mensagens do backend que chegam a tela** (Bean Validation e mensagens de negocio dos `Resource`). Nao se acentua nem se renomeia identificador de codigo, chave de objeto, nome de rota ou valor de enum (`INCOME`, `PENDING`, `Screen`, `Action`) — so texto exibido; a excecao sao **dados que sao texto exibido**, como os nomes das categorias semeadas, corrigidos pela migration `V11` (ver [categories.md](categories.md)). Varreduras de conferencia (valem para codigo novo):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  **Nenhuma das duas sai vazia** — ha divida pre-existente de **comentario de codigo**, medida na `main` em 2026-09-20 (issue #70): 2 linhas no frontend (`styles.scss` 24, 30) e 6 no backend (`DashboardResource.java` 41, 85, 124, 125 e `ProductionBootstrap.java` 178, 179), nenhuma delas texto exibido. Entao o criterio util e **baseline**: medir antes de comecar e exigir **nenhuma ocorrencia nova**, sem acentuar de carona comentario de arquivo fora do escopo da mudanca. **Os dois regex sao diferentes**: o do backend traz `lancamento` e `periodo` em **minusculas**, entao um identificador, slug ou `id` em minuscula num `.java` (`"lancamentos"`, `"periodo"`) **casa** a varredura e acrescenta ocorrencia — por isso os `id` das areas da Central sao alinhados as rotas em ingles; o do frontend usa `Lancamento` capitalizado e nao pega o equivalente em minuscula. A varredura do front cobre `*.spec.ts` tambem: titulo de teste e fixture que casem com o regex precisam ser ajustados junto. Os arquivos ficam em UTF-8 e `index.html` mantem `<meta charset="utf-8">` — a acentuacao so vale se nao virar mojibake no bundle servido.

## Onde esta o resto

Este arquivo e o **nucleo**: toda etapa da esteira o carrega. O detalhe por area vive separado, e so e carregado quando a issue toca aquela area (ver [README.md](README.md)):

| Arquivo | Carregue quando |
|---|---|
| [backend-patterns.md](backend-patterns.md) | a issue altera `backend/src/main` |
| [frontend-ui.md](frontend-ui.md) | a issue altera tela, estilo ou navegacao |
| [testing.md](testing.md) | a etapa escreve, ajusta ou roda teste |
| [deployment.md](deployment.md) | a issue toca deploy, Compose, Caddy ou modo de exposicao |
