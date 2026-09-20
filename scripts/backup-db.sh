#!/usr/bin/env bash
# Dump do banco de producao para backups/, com expurgo dos dumps antigos.
#
#   scripts/backup-db.sh                # retencao padrao de 14 dias
#   RETENCAO_DIAS=30 scripts/backup-db.sh
#
# Pensado para rodar tambem via cron na VM:
#   0 3 * * * cd /opt/financeos && ./scripts/backup-db.sh >> /var/log/financeos-backup.log 2>&1
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$raiz"

retencao="${RETENCAO_DIAS:-14}"
destino="$raiz/backups"

if [[ ! -f .env ]]; then
    echo "ERRO: .env nao encontrado em $raiz (copie de .env.prod.example)." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

usuario="${POSTGRES_USER:-financeos}"
banco="${POSTGRES_DB:-financeos}"

mkdir -p "$destino"
arquivo="$destino/financeos-$(date +%Y%m%d-%H%M%S).sql.gz"

echo "==> Gerando dump de '$banco' em $arquivo"
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
    exec -T postgres pg_dump -U "$usuario" -d "$banco" \
    | gzip > "$arquivo"

if [[ ! -s "$arquivo" ]]; then
    rm -f "$arquivo"
    echo "ERRO: o dump saiu vazio — nada foi gravado." >&2
    exit 1
fi

echo "==> Dump concluido ($(du -h "$arquivo" | cut -f1))"

echo "==> Expurgando dumps com mais de $retencao dias"
find "$destino" -name 'financeos-*.sql.gz' -type f -mtime "+$retencao" -print -delete
