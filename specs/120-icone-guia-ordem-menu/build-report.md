# Relatorio de build

## Backend

PASSOU — jar gerado em `backend/target/quarkus-app/quarkus-run.jar` (runner Quarkus, ponto de entrada) e `backend/target/quarkus-app/app/backend-1.0.3-02.jar` (artefato da aplicacao, 253009 bytes). Comando: `./mvnw -q package -DskipTests`, codigo de saida 0. Obs.: o empacotamento `quarkus` nao gera `*.jar` na raiz de `backend/target/`; o layout fica em `quarkus-app/`.

## Frontend

PASSOU — bundle gerado em `frontend/dist/frontend/browser` (`index.html`, `favicon.svg`, `favicon.ico` e chunks JS/CSS; `frontend/dist/frontend/` tambem traz `3rdpartylicenses.txt` e `prerendered-routes.json`). Comando: `npm run build`, codigo de saida 0, sem erros nem avisos. Obs.: o builder de aplicacao do Angular publica o conteudo servido em `browser/`.

Verificacoes adicionais (rodada apos o ajuste da moeda com "F"):

- `favicon.svg` em `dist` tem o mesmo sha256 de `frontend/public/favicon.svg`: `2b18eb462ec94248fbd1953c2929f691012e3bf49b963f4c0bd8f3feb3423e7c` (difere de `84df37f0…`, `74a83745…` e do ajuste anterior).
- `favicon.ico` em `dist` tem o mesmo sha256 de `frontend/public/favicon.ico`: `aa9dd4300579ad7655b5c4e91b88c515df0272f11d2f1016a4eb836d8795a2d5` (difere de `c2140972…` e `810561d7…`).
- Cabecalho do `favicon.ico` do bundle: reserved=0, type=1 (icone), count=3 (16, 32 e 48 px).
- `index.html` servido no bundle declara `favicon.ico?v=2` (com `sizes="16x16 32x32 48x48"`) e `favicon.svg?v=2` (com `type="image/svg+xml"`).

## Conclusao

Pronto para abrir PR (build). Os dois builds passaram e os artefatos foram conferidos. A esteira ainda passa por `docker-restart` e `verify` (validacao manual do usuario em `http://localhost`) antes do `open-pr`.
