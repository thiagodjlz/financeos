param(
    [string[]]$Servico
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
    if ($Servico) {
        docker compose up -d --build @Servico
    } else {
        docker compose up -d --build
    }
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
