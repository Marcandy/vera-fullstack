param(
    [Parameter(Mandatory = $true)][ValidateSet('bootstrap', 'reset', 'verify', 'export', 'restore-check')][string]$Action,
    [string]$EnvFile,
    [string]$Image = 'vera-demo:local',
    [string]$Network,
    [switch]$AppStopped,
    [string]$BackupDirectory
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$scriptMount = 'type=bind,source=' + $PSScriptRoot + ',target=/scripts,readonly'

function Invoke-DockerChecked {
    param([string[]]$DockerArguments)
    # Windows PowerShell treats native stderr as ErrorRecords when output is
    # redirected. Java/keytool write harmless startup notices there even on success.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & docker @DockerArguments 2>&1 | ForEach-Object { $_.ToString() }
        $dockerExit = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousPreference }
    if ($dockerExit -ne 0) { throw "Docker operation failed (exit $dockerExit)." }
}

function Resolve-PrivatePath {
    param([string]$Path)
    $full = [System.IO.Path]::GetFullPath($Path)
    git -C $repoRoot check-ignore --quiet -- $full
    if ($LASTEXITCODE -ne 0) { throw 'Credentials and backups must be under the gitignored .agents directory.' }
    return $full
}

if ($Action -eq 'restore-check') {
    if (!$BackupDirectory) { throw 'Supply the backup directory to restore-check.' }
    $backup = Resolve-PrivatePath $BackupDirectory
    if (!(Test-Path -LiteralPath (Join-Path $backup 'vera-demo.sql')) -or
        !(Test-Path -LiteralPath (Join-Path $backup 'counts.tsv'))) { throw 'Incomplete backup directory.' }
    $expected = (Get-Content -LiteralPath (Join-Path $backup 'counts.tsv')) -join "`n"
    if ($expected -notmatch '(?m)^data_sha256\t[0-9a-f]{64}$') {
        throw 'Backup has no data checksum. Create a fresh export before verifying recovery.'
    }
    $container = 'vera-restore-' + [Guid]::NewGuid().ToString('N').Substring(0, 12)
    $restoreEnv = Join-Path $backup 'restore.env'
    if (Test-Path -LiteralPath $restoreEnv) { throw 'A restore.env file already exists; check the previous restore operation.' }
    $password = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    [System.IO.File]::WriteAllText($restoreEnv, "MYSQL_DATABASE=vera_demo`nMYSQL_ROOT_PASSWORD=$password`n")
    try {
        Invoke-DockerChecked -DockerArguments @('run', '-d', '--name', $container, '--network', 'none', '--env-file', $restoreEnv,
            '--mount', ('type=bind,source=' + $backup + ',target=/backup,readonly'), '--mount', $scriptMount,
            '--tmpfs', '/var/lib/mysql:rw', 'mysql:8.4') | Out-Null
        $ready = $false
        for ($attempt = 0; $attempt -lt 60; $attempt++) {
            try {
                & docker exec $container sh /scripts/mysql-ready.sh 2>$null | Out-Null
                if ($LASTEXITCODE -eq 0) { $ready = $true; break }
            } catch { <# Initialization can temporarily refuse connections. #> }
            Start-Sleep -Seconds 1
        }
        if (!$ready) { throw 'Disposable restore database did not become ready.' }
        $restored = & docker exec $container sh /scripts/mysql-restore.sh
        if ($LASTEXITCODE -ne 0) { throw 'Database restore failed.' }
        if (($restored -join "`n").Trim() -cne $expected.Trim()) { throw 'Restored data checksum, counts, or relationship checks differ from the export.' }
        Write-Output 'Restore verified: all record values, table counts, and relationship checks match the exported database.'
    } finally {
        # This exact random name belongs only to the disposable container above.
        try { & docker rm -f $container 2>$null | Out-Null } catch { <# It may not have been created. #> }
        Remove-Item -LiteralPath $restoreEnv -ErrorAction SilentlyContinue
    }
    return
}

if (!$EnvFile) { throw 'Supply a gitignored environment file.' }
$envPath = Resolve-PrivatePath $EnvFile
if (!(Test-Path -LiteralPath $envPath)) { throw 'Environment file does not exist.' }
if ($Action -in @('reset', 'export') -and !$AppStopped) {
    throw 'Stop the deployed application, confirm it is stopped, then pass -AppStopped.'
}
$dockerArgs = @('run', '--rm', '--env-file', $envPath)
if ($Network) { $dockerArgs += @('--network', $Network) }
if ($Action -eq 'export') {
    if (!$BackupDirectory) { $BackupDirectory = Join-Path $repoRoot ('.agents/backups/' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')) }
    $backup = Resolve-PrivatePath $BackupDirectory
    if (Test-Path -LiteralPath $backup) { throw 'Choose a new backup directory; existing backups are never overwritten.' }
    New-Item -ItemType Directory -Path $backup | Out-Null
    $dockerArgs += @('--entrypoint', 'sh', '--mount', $scriptMount, '--mount',
        ('type=bind,source=' + $backup + ',target=/backup'), 'mysql:8.4', '/scripts/mysql-export.sh')
    Invoke-DockerChecked $dockerArgs
    Write-Output "Private backup saved to $backup. Run restore-check before relying on it."
} else {
    if ($Action -eq 'reset') { $dockerArgs += @('-e', 'DEMO_APP_STOPPED=true') }
    $dockerArgs += @($Image, 'demo', $Action, '--confirm=vera_demo')
    Invoke-DockerChecked $dockerArgs
}
