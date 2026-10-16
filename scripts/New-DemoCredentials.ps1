param([Parameter(Mandatory = $true)][string]$EnvFile)
$ErrorActionPreference = 'Stop'
$resolved = (Resolve-Path -LiteralPath $EnvFile).Path
$repoRoot = Split-Path $PSScriptRoot -Parent
git -C $repoRoot check-ignore --quiet -- $resolved
if ($LASTEXITCODE -ne 0) { throw 'Store the environment file under the gitignored .agents directory.' }
$existing = [System.IO.File]::ReadAllText($resolved)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    foreach ($name in @('DEMO_ADMIN_PASSWORD', 'DEMO_CAREGIVER_PASSWORD', 'DEMO_SECOND_CAREGIVER_PASSWORD')) {
        if ($existing -match "(?m)^$name=") { throw "The file already contains $name; refusing to rotate a credential." }
    }
    $lines = @()
    foreach ($name in @('DEMO_ADMIN_PASSWORD', 'DEMO_CAREGIVER_PASSWORD', 'DEMO_SECOND_CAREGIVER_PASSWORD')) {
        $bytes = New-Object byte[] 32
        $rng.GetBytes($bytes)
        $lines += $name + '=' + [Convert]::ToBase64String($bytes)
    }
    [System.IO.File]::AppendAllText($resolved, "`n" + ($lines -join "`n") + "`n", [System.Text.UTF8Encoding]::new($false))
} finally { $rng.Dispose() }
Write-Output "Three fresh demo passwords were saved to $resolved. Share them separately from the URL."
