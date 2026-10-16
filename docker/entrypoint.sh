#!/bin/sh
set -eu
umask 077

if [ -n "${AIVEN_CA_BASE64:-}" ]; then
    printf '%s' "$AIVEN_CA_BASE64" | base64 -d > /tmp/vera-aiven-ca.pem
else
    : "${AIVEN_CA_PEM:?Supply AIVEN_CA_BASE64 or AIVEN_CA_PEM}"
    printf '%s\n' "$AIVEN_CA_PEM" > /tmp/vera-aiven-ca.pem
fi
# The store contains a public CA certificate, not a private key. Its password is
# deliberately not a credential. It is recreated for every container start.
rm -f /tmp/vera-aiven.p12
keytool -importcert -noprompt -alias aiven -file /tmp/vera-aiven-ca.pem \
    -keystore /tmp/vera-aiven.p12 -storetype PKCS12 -storepass changeit

if [ "${1:-}" = "demo" ]; then
    shift
    exec java -Dloader.main=com.vera.api.demo.DemoDataTool \
        -cp /app/app.jar org.springframework.boot.loader.launch.PropertiesLauncher "$@"
fi

exec java -jar /app/app.jar "$@"
