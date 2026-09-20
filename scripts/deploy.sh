#!/usr/bin/env bash
# Publica/atualiza o ambiente de producao numa VM Linux.
#
#   scripts/deploy.sh 1.0.2            # branch v1.0.2
#   scripts/deploy.sh v1.0.2
#   scripts/deploy.sh 1.0.2 --sem-backup
#
# Sequencia: conferencias -> backup do banco -> troca para a branch da versao ->
# rebuild das imagens -> health-check -> rollback do codigo se nao subir.
#
# O modo de exposicao vem do .env (FINANCEOS_EXPOSICAO): `acme` (padrao, dominio
# proprio + Let's Encrypt) ou `funnel` (Tailscale Funnel, sem dominio e sem abrir
# porta). O modo decide quais sobreposicoes do Compose entram e o que e obrigatorio.
#
# O rollback devolve o CODIGO, nao o banco: migracao Flyway nao volta atras — por
# isso o dump acontece antes de qualquer coisa.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$raiz"

compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
timeout_segundos="${TIMEOUT_SEGUNDOS:-240}"

versao="${1:-}"
shift || true
sem_backup=false
for arg in "$@"; do
    case "$arg" in
        --sem-backup) sem_backup=true ;;
        *) echo "ERRO: argumento desconhecido '$arg'." >&2; exit 1 ;;
    esac
done

if [[ -z "$versao" ]]; then
    echo "Uso: scripts/deploy.sh <versao> [--sem-backup]   (ex.: scripts/deploy.sh 1.0.2)" >&2
    exit 1
fi

branch="$versao"
[[ "$branch" == v* ]] || branch="v$branch"

falhar() { echo "ERRO: $1" >&2; exit 1; }

echo "==> Conferindo pre-requisitos"
[[ -f .env ]] || falhar ".env nao encontrado (copie de .env.prod.example e preencha)."
[[ -f secrets/privateKey.pem && -f secrets/publicKey.pem ]] || falhar \
    "par de chaves RSA ausente em secrets/. Gere um proprio para este ambiente:
    mkdir -p secrets
    openssl genrsa -out secrets/privateKey.pem 2048
    openssl rsa -in secrets/privateKey.pem -pubout -out secrets/publicKey.pem
    chmod 600 secrets/privateKey.pem"

set -a
# shellcheck disable=SC1091
source .env
set +a

exposicao="${FINANCEOS_EXPOSICAO:-acme}"
obrigatorias=(POSTGRES_PASSWORD FINANCEOS_DOMAIN FINANCEOS_ADMIN_EMAIL FINANCEOS_ADMIN_PASSWORD)

case "$exposicao" in
    acme)
        obrigatorias+=(ACME_EMAIL)
        ;;
    funnel)
        compose+=(-f docker-compose.funnel.yml)
        ;;
    *)
        falhar "FINANCEOS_EXPOSICAO invalida: '$exposicao'. Use 'acme' ou 'funnel'."
        ;;
esac

for obrigatoria in "${obrigatorias[@]}"; do
    [[ -n "${!obrigatoria:-}" ]] || falhar "$obrigatoria esta vazia no .env."
done
[[ ${#FINANCEOS_ADMIN_PASSWORD} -ge 12 ]] || falhar "FINANCEOS_ADMIN_PASSWORD precisa ter pelo menos 12 caracteres."

if [[ "$exposicao" == funnel ]]; then
    [[ "$FINANCEOS_DOMAIN" == *.ts.net ]] || falhar         "no modo funnel, FINANCEOS_DOMAIN e o nome .ts.net do no (ex.: financeos.tailXXXX.ts.net).
    O nome do tailnet aparece em https://login.tailscale.com/admin/dns"
    if [[ -z "${TS_AUTHKEY:-}" ]] && ! docker volume ls -q --filter name=financeos_tailscale_state | grep -q .; then
        falhar "primeira publicacao no modo funnel e o no ainda nao foi autenticado.
    Gere uma auth key em https://login.tailscale.com/admin/settings/keys e preencha TS_AUTHKEY no .env.
    Depois da primeira subida ela pode sair do .env: a sessao fica no volume de estado."
    fi
fi

ref_anterior="$(git rev-parse --abbrev-ref HEAD)"
[[ "$ref_anterior" == "HEAD" ]] && ref_anterior="$(git rev-parse HEAD)"

if [[ -n "$(git status --porcelain)" ]]; then
    falhar "ha alteracoes locais nao commitadas — resolva antes de publicar."
fi

if [[ "$sem_backup" == false ]]; then
    if "${compose[@]}" ps --status running --services 2>/dev/null | grep -qx postgres; then
        echo "==> Backup do banco antes de atualizar"
        "$raiz/scripts/backup-db.sh"
    else
        echo "==> Postgres ainda nao esta no ar: primeira publicacao, sem backup previo"
    fi
fi

echo "==> Trazendo a branch $branch"
git fetch --prune origin
git checkout "$branch"
git pull --ff-only origin "$branch"

APP_VERSION="$(cat VERSION)"
export APP_VERSION
echo "==> Publicando FinanceOS $APP_VERSION em https://$FINANCEOS_DOMAIN"

subir() {
    "${compose[@]}" up -d --build --remove-orphans
}

esperar_saude() {
    local limite=$((SECONDS + timeout_segundos))
    while (( SECONDS < limite )); do
        if "${compose[@]}" exec -T frontend wget -qO- http://backend:8080/api/health 2>/dev/null | grep -q '"status":"UP"'; then
            return 0
        fi
        sleep 5
    done
    return 1
}

subir

echo "==> Aguardando o backend responder (ate ${timeout_segundos}s)"
if esperar_saude; then
    echo "==> Health-check OK"
    "${compose[@]}" exec -T frontend wget -qO- http://backend:8080/api/health
    echo
    echo "==> Publicado. Acesse https://$FINANCEOS_DOMAIN"
    if [[ "$exposicao" == funnel ]]; then
        echo "    (o funnel pode levar ~1 min para responder na primeira subida;"
        echo "     acompanhe com: ${compose[*]} logs -f tailscale)"
    fi
    exit 0
fi

echo "ERRO: o backend nao respondeu no prazo. Ultimas linhas do log:" >&2
"${compose[@]}" logs --tail 60 backend >&2 || true

echo "==> Rollback do codigo para $ref_anterior (o banco NAO volta)" >&2
git checkout "$ref_anterior"
APP_VERSION="$(cat VERSION)"
export APP_VERSION
subir || true
exit 1
