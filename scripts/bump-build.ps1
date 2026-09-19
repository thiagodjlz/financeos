# Incrementa o numero da build da versao atual (X.Y.Z-NN -> X.Y.Z-NN+1).
# Chamado automaticamente pelo hook .githooks/pre-commit em commits de branch de versao;
# tambem pode ser rodado na mao: powershell -File scripts/bump-build.ps1
param(
    [switch]$Stage,   # faz git add dos arquivos de versao (usado pelo hook)
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\version-lib.ps1')

$repoRoot = Get-FinanceOsRepoRoot
$atual = Get-FinanceOsVersion -RepoRoot $repoRoot

if ($atual.IsDev) {
    Write-Host "VERSION esta em '$($atual.Full)' (desenvolvimento) - build nao incrementada." -ForegroundColor Yellow
    Write-Host "Builds so existem em branch de versao (vX.Y.Z). Para cortar uma versao: scripts/new-version.ps1" -ForegroundColor Yellow
    exit 0
}

$proximaBuild = if ($null -eq $atual.Build) { 1 } else { $atual.Build + 1 }
$nova = "$($atual.Base)-$(Format-FinanceOsBuild $proximaBuild)"

Set-FinanceOsVersion -Versao $nova -RepoRoot $repoRoot -Quiet:$Quiet | Out-Null

if (-not $Quiet) {
    Write-Host "Build: $($atual.Full) -> $nova" -ForegroundColor Green
}

if ($Stage) {
    Push-Location $repoRoot
    try {
        foreach ($arquivo in Get-FinanceOsVersionFiles) {
            if (Test-Path (Join-Path $repoRoot $arquivo)) {
                Invoke-FinanceOsGit add -- $arquivo | Out-Null
            }
        }
    }
    finally {
        Pop-Location
    }
}
