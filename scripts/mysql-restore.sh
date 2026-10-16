#!/bin/sh
set -eu
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql -uroot vera_demo < /backup/vera-demo.sql
mysql -uroot --batch --skip-column-names vera_demo < /scripts/counts.sql
checksum=$(sh /scripts/mysql-data-checksum.sh -uroot)
printf 'data_sha256\t%s\n' "$checksum"
