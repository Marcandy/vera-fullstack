#!/bin/sh
set -eu
umask 077
# A stable, private serialization checks values (including password hashes), not
# just counts. Both sides use the same MySQL client and UTC representation.
snapshot=$(mktemp)
trap 'rm -f "$snapshot"' EXIT HUP INT TERM
mysqldump "$@" --single-transaction --no-tablespaces --set-gtid-purged=OFF \
    --column-statistics=0 --no-create-info --skip-comments --compact \
    --hex-blob --order-by-primary --skip-extended-insert \
    vera_demo patients caregivers users visits documents claims flyway_schema_history > "$snapshot"
sha256sum "$snapshot" | cut -d ' ' -f 1
