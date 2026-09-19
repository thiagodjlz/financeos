# Ativa os hooks versionados do repositorio (.githooks) para esta copia local.
# Precisa ser rodado uma vez por clone - git nao versiona .git/hooks.
param([switch]$Desinstalar)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
    if ($Desinstalar) {
        git config --unset core.hooksPath 2>$null | Out-Null
        Write-Host "Hooks desativados (core.hooksPath removido)." -ForegroundColor Yellow
        Write-Host "A build deixa de ser incrementada automaticamente nos commits de branch de versao."
        return
    }

    git config core.hooksPath .githooks
    Write-Host "Hooks ativados: core.hooksPath = .githooks" -ForegroundColor Green
    Write-Host ""
    Write-Host "pre-commit: em commit de branch de versao (vX.Y.Z), incrementa a build e inclui"
    Write-Host "os arquivos de versao no proprio commit. Para pular uma vez:"
    Write-Host "  FINANCEOS_SKIP_BUILD_BUMP=1 git commit -m ..."
}
finally {
    Pop-Location
}
