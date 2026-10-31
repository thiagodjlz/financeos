# Relatorio do ambiente de teste (Docker)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: stack estava rodando (imagens `1.0.3-02` buildadas antes dos ajustes de icone e do `?v=2`)
Comando: `docker compose up -d --build`

## Checagens

- Containers: `financeos-postgres` (healthy, nao recriado, dados preservados), `financeos-backend` (Up, recriado), `financeos-frontend` (Up, recriado) — imagens `financeos-backend:1.0.3-02` e `financeos-frontend:1.0.3-02` buildadas a partir do working tree. Containers `financeos-prod-*` nao foram tocados.
- Backend: `GET http://localhost:8080/api/health` -> 200
- Frontend: `GET http://localhost/` -> 200
- Favicons servidos com versao:
  - `GET http://localhost/favicon.svg?v=2` -> 200 (`image/svg+xml`), sha256 `2b18eb462ec94248fbd1953c2929f691012e3bf49b963f4c0bd8f3feb3423e7c`, igual ao `frontend/public/favicon.svg` do repositorio
  - `GET http://localhost/favicon.ico?v=2` -> 200 (`image/x-icon`), sha256 `aa9dd4300579ad7655b5c4e91b88c515df0272f11d2f1016a4eb836d8795a2d5`, igual ao `frontend/public/favicon.ico` do repositorio
- `index.html` servido traz os dois links versionados:
  - `<link rel="icon" href="favicon.ico?v=2" sizes="16x16 32x32 48x48">`
  - `<link rel="icon" type="image/svg+xml" href="favicon.svg?v=2">`
- Migrations Flyway: sem erro (18 migrations validadas, schema `public` ja na versao 18, nenhuma migration nova executada)
- Log do backend: "Listening on: http://0.0.0.0:8080" presente; "Profile prod activated" (perfil padrao do compose local, como nas rodadas anteriores)

## Onde validar

- Tela: http://localhost
- API/Swagger: http://localhost:8080/docs

Observacao: o navegador guarda o favicon em cache. Para validar a guia nova, use janela anonima ou force o recarregamento (Ctrl+F5).
