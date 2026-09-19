# Funcoes compartilhadas de versionamento do FinanceOS.
# Fonte da verdade: arquivo VERSION na raiz do repositorio.
#
# Formatos aceitos:
#   X.Y.Z-NN    versao publicada, NN = numero da build (branch de versao vX.Y.Z)
#   X.Y.Z-dev   versao em desenvolvimento (branch main)
#   X.Y.Z       versao sem build definida ainda (a proxima build vira 01)

$ErrorActionPreference = 'Stop'

$Global:FinanceOsVersionRegex = '^(\d+)\.(\d+)\.(\d+)(?:-(dev|\d+))?$'
$Global:FinanceOsVersionBranchRegex = '^v(\d+)\.(\d+)\.(\d+)$'

function Invoke-FinanceOsGit {
    # PowerShell 5.1 transforma stderr de executavel nativo em erro terminante quando
    # $ErrorActionPreference = 'Stop' - por isso a chamada roda com 'Continue'.
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumentos)

    $anterior = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $saida = & git @Argumentos 2>&1
        return [pscustomobject]@{
            Ok    = ($LASTEXITCODE -eq 0)
            Saida = (($saida | ForEach-Object { "$_" }) -join "`n").Trim()
            Codigo = $LASTEXITCODE
        }
    }
    finally {
        $ErrorActionPreference = $anterior
    }
}

function Get-FinanceOsRepoRoot {
    param([string]$From = $PSScriptRoot)
    return (Resolve-Path (Join-Path $From '..\..')).Path
}

function ConvertFrom-FinanceOsVersion {
    param([Parameter(Mandatory = $true)][string]$Texto)

    $valor = $Texto.Trim()
    if ($valor -notmatch $Global:FinanceOsVersionRegex) {
        throw "Versao invalida: '$valor' (esperado X.Y.Z, X.Y.Z-NN ou X.Y.Z-dev)"
    }

    $sufixo = $Matches[4]
    $isDev = $sufixo -eq 'dev'
    $build = if ($isDev -or [string]::IsNullOrEmpty($sufixo)) { $null } else { [int]$sufixo }

    return [pscustomobject]@{
        Major = [int]$Matches[1]
        Minor = [int]$Matches[2]
        Patch = [int]$Matches[3]
        Build = $build
        IsDev = $isDev
        Base  = "$($Matches[1]).$($Matches[2]).$($Matches[3])"
        Full  = $valor
    }
}

function Format-FinanceOsBuild {
    param([Parameter(Mandatory = $true)][int]$Numero)
    return $Numero.ToString('00')
}

function Get-FinanceOsVersion {
    param([string]$RepoRoot = (Get-FinanceOsRepoRoot))

    $versionFile = Join-Path $RepoRoot 'VERSION'
    if (-not (Test-Path $versionFile)) {
        throw "Arquivo VERSION nao encontrado em $versionFile"
    }

    return ConvertFrom-FinanceOsVersion ([System.IO.File]::ReadAllText($versionFile))
}

function Set-FinanceOsVersion {
    param(
        [Parameter(Mandatory = $true)][string]$Versao,
        [string]$RepoRoot = (Get-FinanceOsRepoRoot),
        [switch]$Quiet
    )

    $parsed = ConvertFrom-FinanceOsVersion $Versao
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $alterados = New-Object System.Collections.Generic.List[string]

    function Write-Line {
        param([string]$Mensagem)
        if (-not $Quiet) { Write-Host $Mensagem }
    }

    function Set-InFile {
        param(
            [string]$Path,
            [string]$Pattern,
            [string]$Valor,
            [string]$Label,
            [switch]$Opcional
        )

        if (-not (Test-Path $Path)) {
            if ($Opcional) { Write-Line "Pulado (arquivo nao existe): $Label"; return }
            throw "Arquivo nao encontrado: $Path"
        }

        $content = [System.IO.File]::ReadAllText($Path)
        if ($content -notmatch $Pattern) {
            if ($Opcional) { Write-Line "Pulado (padrao nao encontrado): $Label"; return }
            throw "Padrao nao encontrado em $Label ($Path) - nada foi alterado."
        }

        $evaluator = [System.Text.RegularExpressions.MatchEvaluator] {
            param($m)
            $m.Groups[1].Value + $Valor + $m.Groups[2].Value
        }.GetNewClosure()

        $updated = [regex]::Replace($content, $Pattern, $evaluator)
        if ($updated -ne $content) {
            [System.IO.File]::WriteAllText($Path, $updated, $utf8NoBom)
            Write-Line "Atualizado: $Label"
        }
        $alterados.Add($Label) | Out-Null
    }

    [System.IO.File]::WriteAllText((Join-Path $RepoRoot 'VERSION'), "$($parsed.Full)`n", $utf8NoBom)
    $alterados.Add('VERSION') | Out-Null
    Write-Line "Atualizado: VERSION"

    Set-InFile -Path (Join-Path $RepoRoot 'backend\pom.xml') `
        -Pattern '(<artifactId>backend</artifactId>\s*<version>)[^<]+(</version>)' `
        -Valor $parsed.Full -Label 'backend/pom.xml'

    Set-InFile -Path (Join-Path $RepoRoot 'frontend\src\app\core\version.ts') `
        -Pattern "(export const APP_VERSION = ')[^']+(';)" `
        -Valor $parsed.Full -Label 'frontend/src/app/core/version.ts'

    # package.json/package-lock recebem so X.Y.Z: npm exige semver estrito e '-02' tem
    # zero a esquerda no identificador numerico, o que invalida a versao para o npm.
    Set-InFile -Path (Join-Path $RepoRoot 'frontend\package.json') `
        -Pattern '("version": ")[^"]+(")' `
        -Valor $parsed.Base -Label 'frontend/package.json'

    Set-InFile -Path (Join-Path $RepoRoot 'frontend\package-lock.json') `
        -Pattern '("name": "frontend",\s*"version": ")[^"]+(")' `
        -Valor $parsed.Base -Label 'frontend/package-lock.json'

    Set-InFile -Path (Join-Path $RepoRoot '.env') `
        -Pattern '(APP_VERSION=)[^\r\n]*(\r?\n|$)' `
        -Valor $parsed.Full -Label '.env' -Opcional

    Set-InFile -Path (Join-Path $RepoRoot '.env.example') `
        -Pattern '(APP_VERSION=)[^\r\n]*(\r?\n|$)' `
        -Valor $parsed.Full -Label '.env.example' -Opcional

    return $alterados
}

function Get-FinanceOsVersionFiles {
    # Arquivos versionados que Set-FinanceOsVersion toca (.env fica de fora: nao e versionado).
    return @(
        'VERSION',
        'backend/pom.xml',
        'frontend/src/app/core/version.ts',
        'frontend/package.json',
        'frontend/package-lock.json',
        '.env.example'
    )
}

function Confirm-FinanceOsHooks {
    # Ativa os hooks versionados se este clone ainda nao tiver feito isso.
    # Silencioso quando ja esta ativo - a ideia e que ninguem precise lembrar do instalador.
    param([string]$RepoRoot = (Get-FinanceOsRepoRoot))

    if (-not (Test-Path (Join-Path $RepoRoot '.githooks\pre-commit'))) { return $false }

    Push-Location $RepoRoot
    try {
        $atual = Invoke-FinanceOsGit config --get core.hooksPath
        if ($atual.Ok -and $atual.Saida -eq '.githooks') { return $false }

        $resultado = Invoke-FinanceOsGit config core.hooksPath .githooks
        if ($resultado.Ok) {
            Write-Host "Hooks do FinanceOS ativados neste clone (core.hooksPath = .githooks)." -ForegroundColor Yellow
            return $true
        }
        return $false
    }
    finally {
        Pop-Location
    }
}

function Get-FinanceOsVersionBranch {
    # Descobre a branch de versao (vX.Y.Z) alvo do commit atual:
    #   1. a propria branch, se ela for uma branch de versao;
    #   2. a base gravada em branch.<nome>.financeosVersionBase (a esteira grava isso);
    #   3. o upstream, quando aponta para origin/vX.Y.Z.
    # Retorna $null quando o trabalho nao pertence a nenhuma versao (ex.: main).
    param([string]$RepoRoot = (Get-FinanceOsRepoRoot))

    Push-Location $RepoRoot
    try {
        $branch = Invoke-FinanceOsGit rev-parse --abbrev-ref HEAD
        if (-not $branch.Ok -or -not $branch.Saida) { return $null }
        $atual = $branch.Saida

        if ($atual -match $Global:FinanceOsVersionBranchRegex) { return $atual }

        $base = Invoke-FinanceOsGit config --get "branch.$atual.financeosVersionBase"
        if ($base.Ok -and $base.Saida) {
            $valor = $base.Saida -replace '^origin/', ''
            if ($valor -match $Global:FinanceOsVersionBranchRegex) { return $valor }
        }

        $upstream = Invoke-FinanceOsGit rev-parse --abbrev-ref '@{upstream}'
        if ($upstream.Ok -and $upstream.Saida) {
            $valor = $upstream.Saida -replace '^origin/', ''
            if ($valor -match $Global:FinanceOsVersionBranchRegex) { return $valor }
        }

        return $null
    }
    finally {
        Pop-Location
    }
}
