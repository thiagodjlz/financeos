# Atualizador de versao: corta uma nova versao a partir da branch de desenvolvimento.
#
#   1. cria a branch da versao (vX.Y.Z) a partir da main atualizada, com VERSION = X.Y.Z-01;
#   2. devolve a main para a proxima versao em desenvolvimento (X.Y.Z+1-dev).
#
# Exemplos:
#   powershell -File scripts/new-version.ps1                      # usa a versao que esta na main
#   powershell -File scripts/new-version.ps1 -Versao 1.1.0        # corta 1.1.0
#   powershell -File scripts/new-version.ps1 -Versao 1.1.0 -Proxima 1.2.0 -Push
param(
    [string]$Versao,
    [string]$Proxima,
    [string]$Base = 'main',
    [switch]$SemPull,
    [switch]$Push
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\version-lib.ps1')

$repoRoot = Get-FinanceOsRepoRoot
Push-Location $repoRoot

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumentos)
    $resultado = Invoke-FinanceOsGit @Argumentos
    if (-not $resultado.Ok) {
        throw "git $($Argumentos -join ' ') falhou:`n$($resultado.Saida)"
    }
    return $resultado.Saida
}

function Invoke-GitCommit {
    param([string]$Mensagem, [string[]]$Arquivos)
    foreach ($arquivo in $Arquivos) {
        if (Test-Path (Join-Path $repoRoot $arquivo)) { Invoke-Git add -- $arquivo | Out-Null }
    }
    # O commit de versao ja carrega o numero de build correto - o hook nao deve incrementar de novo.
    $env:FINANCEOS_SKIP_BUILD_BUMP = '1'
    try { Invoke-Git commit -m $Mensagem | Out-Null }
    finally { Remove-Item Env:\FINANCEOS_SKIP_BUILD_BUMP -ErrorAction SilentlyContinue }
}

try {
    if ((Invoke-FinanceOsGit status --porcelain).Saida) {
        throw "Working tree sujo. Comite ou guarde suas mudancas antes de cortar uma versao."
    }

    $branchAtual = (Invoke-FinanceOsGit rev-parse --abbrev-ref HEAD).Saida
    if ($branchAtual -ne $Base) {
        Write-Host "Trocando de '$branchAtual' para '$Base'..."
        Invoke-Git checkout $Base | Out-Null
    }

    if (-not $SemPull) {
        Write-Host "Atualizando '$Base' a partir do origin..."
        Invoke-Git fetch origin | Out-Null
        Invoke-Git pull --ff-only | Out-Null
    }

    $versaoAtual = Get-FinanceOsVersion -RepoRoot $repoRoot
    $alvo = if ($Versao) { (ConvertFrom-FinanceOsVersion $Versao).Base } else { $versaoAtual.Base }

    $branchVersao = "v$alvo"
    if ((Invoke-FinanceOsGit branch --list $branchVersao).Saida) { throw "A branch '$branchVersao' ja existe localmente." }
    if ((Invoke-FinanceOsGit ls-remote --heads origin $branchVersao).Saida) { throw "A branch '$branchVersao' ja existe no origin." }

    $proximaVersao = if ($Proxima) {
        (ConvertFrom-FinanceOsVersion $Proxima).Base
    }
    else {
        $p = ConvertFrom-FinanceOsVersion $alvo
        "$($p.Major).$($p.Minor).$($p.Patch + 1)"
    }

    Write-Host ""
    Write-Host "Versao a cortar : $alvo (branch $branchVersao, build 01)" -ForegroundColor Cyan
    Write-Host "Main volta para : $proximaVersao-dev" -ForegroundColor Cyan
    Write-Host ""

    Invoke-Git checkout -b $branchVersao | Out-Null
    Set-FinanceOsVersion -Versao "$alvo-01" -RepoRoot $repoRoot | Out-Null
    Invoke-GitCommit -Mensagem "Inicia a versao $alvo (build 01)" -Arquivos (Get-FinanceOsVersionFiles)
    Write-Host "Branch $branchVersao criada em $alvo-01." -ForegroundColor Green

    Invoke-Git checkout $Base | Out-Null
    Set-FinanceOsVersion -Versao "$proximaVersao-dev" -RepoRoot $repoRoot | Out-Null
    Invoke-GitCommit -Mensagem "Abre o desenvolvimento da versao $proximaVersao" -Arquivos (Get-FinanceOsVersionFiles)
    Write-Host "Branch $Base agora esta em $proximaVersao-dev." -ForegroundColor Green

    if ($Push) {
        Write-Host ""
        Write-Host "Empurrando branches para o origin..."
        Invoke-Git push -u origin $branchVersao | Out-Null
        Invoke-Git push origin $Base | Out-Null
        Write-Host "Push concluido." -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "Nada foi empurrado. Para publicar:" -ForegroundColor Yellow
        Write-Host "  git push -u origin $branchVersao"
        Write-Host "  git push origin $Base"
    }

    Write-Host ""
    Write-Host "Proximos passos:"
    Write-Host "  - corrigir bugs da versao: branch a partir de $branchVersao (a build sobe sozinha a cada commit)"
    Write-Host "  - publicar a versao no ambiente: powershell -File scripts/update-environment.ps1 -Versao $alvo"
}
catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
