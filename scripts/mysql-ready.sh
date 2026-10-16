#!/bin/sh
set -eu
# Do not mistake the entrypoint's temporary initialization server for readiness.
[ "$(cat /proc/1/comm)" = 'mysqld' ] || exit 1
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql -uroot --batch --skip-column-names -e 'SELECT 1' vera_demo
