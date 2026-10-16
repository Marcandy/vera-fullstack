# Vera demo deployment

This deployment serves the React application and Spring Boot API from one Railway
HTTPS address, backed by Aiven MySQL. It contains fictional records. Claims are
simulated and document uploads store metadata only. Credentials are shared
privately; the public repository contains no demo passwords.

## Build and configuration

From the repository root, build `docker build -t vera-demo:local .`. The image
defaults to the `prod` profile, runs as a non-root user, and contains no local
`.env`, startup demo seed, or private working files. Normal startup runs Flyway
and validates the schema. It never resets demo data. Local Maven development
retains its existing database and seed behavior, with Flyway disabled.

Create `.agents/deployment.env` using the following keys. This directory is
gitignored. Use unquoted `NAME=value` lines; never put this file into a commit.

| Variable | Value |
| --- | --- |
| `MYSQL_HOST` | Aiven service hostname, without a scheme or port |
| `MYSQL_PORT` | Aiven service port |
| `MYSQL_USER` | Database service user |
| `MYSQL_PASSWORD` | Database service password |
| `AIVEN_CA_BASE64` | Base64 encoding of the downloaded project CA certificate |

Encode the certificate with
`[Convert]::ToBase64String([IO.File]::ReadAllBytes('path-to-ca.pem'))` in
PowerShell. Supply these five variables to Railway too. The entry point creates
an ephemeral certificate truststore; JDBC verifies both the CA and hostname.
Do not disable certificate verification to fix a connection failure.

The database name is fixed to `vera_demo`. Create that empty schema in Aiven;
do not import a local `vera` database or enable baseline-on-migrate. The first
application start creates the six entity tables and Flyway history. Only this
dedicated demo schema may be used by the operator tools.

`PORT` is supplied by Railway. The image sets `SPRING_PROFILES_ACTIVE=prod` and
`JAVA_TOOL_OPTIONS=-Xms128m -Xmx384m`. Set the service memory limit to 1 GB and
keep one replica. The configured database pool has at most five connections.

## First launch

1. Create Railway Hobby and Aiven Developer accounts. Set Railway's compute
   alert to $10 and hard limit to $13; verify the dashboard's subscription and
   included-credit treatment. Aiven is $5/month. Leave $2 for tax and metering
   margin; do not enable paid add-ons or automatic upgrades.
2. Create Aiven MySQL and `vera_demo`. Check its assigned region, then choose
   the closest available Railway region. Confirm actual database latency during
   acceptance; the Developer tier does not guarantee region selection.
3. Connect Railway to the repository's merged `main`, with the repository root
   as the build context. Use the checked-in Dockerfile and Railway configuration.
   Disable PR environments and application sleep. Supply the five variables
   above, then generate a Railway domain and verify HTTPS.
4. Confirm `/livez` and `/readyz` return only `{"status":"UP"}`. Readiness includes
   the database; liveness does not. Other management endpoints remain protected.
5. Generate the three demo passwords locally:

   ```powershell
   ./scripts/New-DemoCredentials.ps1 -EnvFile .agents/deployment.env
   ./scripts/demo.ps1 -Action bootstrap -EnvFile .agents/deployment.env
   ```

   Bootstrap requires empty application tables. It creates Denise
   (`denise@agency.com`), Marcus (`marcus@agency.com`), and Dana (`dana@agency.com`).
   Read their passwords from the private environment file. Do not add these
   three password variables to the normal Railway application service.
6. Run the acceptance checks below, reset the demo, and verify both roles again
   before distributing the URL. Record the Git commit and Railway deployment ID.

Application sessions are kept in memory and are lost on restart or release.
Deploy between demonstrations. The Railway configuration uses no extra overlap,
30 seconds of draining, and bounded retries on crash; Spring allows 25 seconds
for active requests to finish. A frontend release also restarts the API.

## Acceptance

The smoke script performs writes against the fictional demo. Run it after
bootstrap or reset, with the same private password variables:

```powershell
$env:VERA_DEMO_URL = 'https://your-generated-domain.up.railway.app'
node --env-file=.agents/deployment.env checks/deployment-smoke.mjs
```

It checks frontend refreshes and caching, protected management endpoints,
cookie attributes, CSRF, both caregivers' ownership, forbidden office actions,
visit evidence and billing, signatures and renewals, and competing transitions.
Reset after it passes. Do not run the existing whole-context Maven test against
the development database as a deployment check; use a disposable MySQL database.

Also verify:

- Browser sign-in, refresh, sign-out, expired sessions, and separate role views.
- A physical phone over cellular: location allowed and denied, typed signature,
  keyboard layout, checkout, and retry after an interrupted request. Record any
  unavailable device coverage; automated HTTP checks are not phone verification.
- Railway's real client address reaches the login throttle. Attempt forged
  `X-Real-IP` and forwarded headers through the public URL; confirm the edge
  supplies the authoritative address. Do not broaden Tomcat's proxy trust to
  arbitrary external peers to make a test pass.
- Restart/redeploy preserves records and invalidates old sessions. Database
  failure makes readiness fail and API access return retryable 503 responses;
  recovery restores access without a destructive reseed.
- Runtime memory remains below 1 GB during concurrent workflows. Inspect the
  monthly usage projection; tune within the budget instead of upgrading silently.
- Export and restore-check succeed, and fresh demo accounts still sign in after
  the final reset. Keep passwords and backup contents out of screenshots and logs.

## Manual reset, export, and recovery

Stop the Railway application service and confirm it is stopped before export or
reset. Leave Aiven running. This blocks competing writes and ends old sessions.
Do not reset during a demonstration or leave an automatically redeploying
release in progress. The `-AppStopped` flag is an operator acknowledgement,
not a remote status check performed by the script.

```powershell
./scripts/demo.ps1 -Action export -EnvFile .agents/deployment.env -AppStopped
./scripts/demo.ps1 -Action restore-check -BackupDirectory .agents/backups/TIMESTAMP
./scripts/demo.ps1 -Action reset -EnvFile .agents/deployment.env -AppStopped
```

Exports are written to new timestamped private directories and never overwrite
an existing backup. They include password hashes. The dump uses a consistent
transaction and verified TLS. Restore-check starts a disposable MySQL 8.4
container with no published port, restores the dump, compares table counts,
relationships, and a SHA-256 checksum of every stored field (including account
hashes and migration history), and removes only that container. Keep the export
afterward. Older exports without a checksum need a fresh export for this check.

Reset performs transactional DML, preserves existing accounts and hashes, clears
fictional workflow data, and recreates current-time fixtures. Visits and documents
receive fresh ids, so old tabs cannot modify replacement records after signing
in again. No automatic
startup or daily reset is enabled. Restart the Railway service after a successful
reset and run `./scripts/demo.ps1 -Action verify -EnvFile .agents/deployment.env`.
If reset fails, its transaction rolls back; inspect and resolve the failure
before reopening the app. Keep the pre-reset backup.

For an application regression, use Railway rollback to the known-good deployment
while its image is retained, or rebuild the recorded Git commit. Rolling back an
image does not roll back database migrations. Subsequent migrations must remain
compatible with the preceding application release. For database recovery, stop
the app, restore a verified export into a clean replacement demo schema/service,
verify it, and update the connection variables before restarting. Never overwrite
the only remaining database copy during an untested restore.

## Monitoring and handoff

After the public launch gate passes, set the GitHub repository Actions variable
`VERA_DEMO_URL` to the HTTPS origin. Until that variable is present, the monitor
job is intentionally disabled. Enable Actions failure notifications, trigger
`Demo uptime` manually, and confirm it passes. Scheduled runs check the homepage
and readiness every 15 minutes, offset from the hour; scheduling is best effort.
Railway's deployment health check alone does not provide ongoing monitoring.

Hand off the public URL, private credentials, merged PR, acceptance results,
known-good deployment and commit identifiers, backup location, and current
spending projection. Daily reset automation and a custom domain are the next
release. Daily automation must coordinate writes, preserve accounts, invalidate
old sessions, and catch up safely after missed runs.

Migrate `railway.json` to Railway Infrastructure as Code before December 1, 2026.
Railway's CLI 5.70 and [migration documentation](https://docs.railway.com/infrastructure-as-code#migrating-from-config-as-code)
announce that existing JSON/TOML configuration stops being read on that date.
Import with variable values preserved, review the plan, and keep the one-service
limits and verified TLS settings. Never import decrypted secrets into source.
