#!/bin/sh
set -eu
umask 077
: "${MYSQL_HOST:?}" "${MYSQL_PORT:?}" "${MYSQL_USER:?}" "${MYSQL_PASSWORD:?}" "${AIVEN_CA_BASE64:?}"
printf '%s' "$AIVEN_CA_BASE64" | base64 -d > /tmp/vera-ca.pem
export MYSQL_PWD="$MYSQL_PASSWORD"
mysqldump --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
    --ssl-mode=VERIFY_IDENTITY --ssl-ca=/tmp/vera-ca.pem --single-transaction \
    --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 \
    --result-file=/backup/vera-demo.sql vera_demo
mysql --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
    --ssl-mode=VERIFY_IDENTITY --ssl-ca=/tmp/vera-ca.pem --batch --skip-column-names \
    vera_demo < /scripts/counts.sql > /backup/counts.tsv
checksum=$(sh /scripts/mysql-data-checksum.sh --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
    --ssl-mode=VERIFY_IDENTITY --ssl-ca=/tmp/vera-ca.pem)
printf 'data_sha256\t%s\n' "$checksum" >> /backup/counts.tsv
echo 'Export complete. Password hashes are included; keep this directory private.'
