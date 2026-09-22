# Deploy e ambiente de producao externo

Leia so quando a issue tocar `docker-compose*.yml`, `deploy/`, `scripts/deploy.sh`, `scripts/*environment*` ou o modo de exposicao da stack. Para desenvolvimento local basta a secao "Comandos" de [architecture.md](architecture.md).

## Ambiente de producao externo

Local e producao usam o **mesmo perfil Quarkus (`prod`)** e o mesmo `docker-compose.yml`; a diferenca inteira vive em `docker-compose.prod.yml`, uma **sobreposicao** aplicada por cima (`-f docker-compose.yml -f docker-compose.prod.yml`) e nunca sozinha. Ela remove as portas publicadas pelo arquivo base com `!reset` (exige Docker Compose >= 2.24), poe um **Caddy** na frente com HTTPS automatico (`deploy/Caddyfile`, dominio e e-mail por variavel) e liga o modo `production` do backend.

- **`financeos.deployment=production` e o interruptor de tudo** — ver as travas em [auth-and-permissions.md](auth-and-permissions.md). Ele existe justamente porque o perfil Quarkus nao distingue os dois ambientes: amarrar as travas a `%prod` quebraria a stack Docker local, que a esteira usa para validacao manual.
- Em producao **so o Caddy publica porta** (80/443). Postgres, backend e frontend ficam acessiveis apenas pela rede interna do Compose.
- A sobreposicao de producao tambem troca o **nome do projeto** (`name: financeos-prod`) e o `container_name` de todos os servicos (`financeos-prod-*`). Isso e o que permite a stack local e a de producao rodarem **na mesma maquina ao mesmo tempo** — no modo `funnel`, que nao publica porta nenhuma. Consequencia a lembrar: os volumes passam a se chamar `financeos-prod_*`, entao um ambiente que ja tivesse subido com o nome antigo comecaria com banco vazio.
- **Dois modos de exposicao**, escolhidos por `FINANCEOS_EXPOSICAO` no `.env` e resolvidos pelo `deploy.sh`: `acme` (padrao) e `funnel`. O `funnel` empilha uma **terceira** sobreposicao, `docker-compose.funnel.yml`, sempre depois da de producao — nela o Caddy perde as portas e o ACME (`deploy/Caddyfile.tunnel`, site em `:80`) e quem fala com a internet e um container `tailscale/tailscale` que termina o TLS e repassa para `caddy:80`. Nenhuma porta fica aberta no host.
- No modo `funnel`, `FINANCEOS_DOMAIN` e o nome `.ts.net` do no — e ele que vale como endereco publico, entao `JWT_ISSUER` e `CORS_ORIGINS` seguem derivando dele sem mudanca. `ACME_EMAIL` deixou de ter `:?` no Compose por causa disso (no modo `funnel` o campo nao existe); quem cobra a variavel por modo e o `deploy.sh`.
- Duas armadilhas do container do Tailscale ja resolvidas no overlay: `TS_ACCEPT_DNS=false` (com MagicDNS ligado ele reescreve o `resolv.conf` e perde o DNS interno do Compose, quebrando o `caddy:80` com 502) e o `TS_SERVE_CONFIG` montado como **diretorio** (`./deploy/tailscale:/config`), nao como arquivo — montado como arquivo, alteracoes na configuracao do funnel nao sao vistas.
- `scripts/deploy.sh <versao>` e `scripts/backup-db.sh` sao os equivalentes shell dos scripts PowerShell de ambiente — os `.ps1` nao rodam na VM Linux. O `deploy.sh` faz dump -> troca de branch -> rebuild -> health-check -> **rollback do codigo** se nao subir; o banco nao volta (Flyway nao tem down), por isso o dump vem antes.
- O health-check do deploy consulta o backend **de dentro da rede**, via `wget` do container do frontend (`nginx:alpine` e busybox, tem `wget`; a imagem do backend nao tem `curl`).
- `.env.prod.example` e o modelo do `.env` do servidor; `secrets/` (chaves RSA do ambiente) e `backups/` sao gitignored.

