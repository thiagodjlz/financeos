param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('versao', 'release', 'build')]
    [string]$Parte
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$versionFile = Join-Path $repoRoot 'VERSION'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path $versionFile)) {
    Write-Host "Arquivo VERSION nao encontrado em $versionFile" -ForegroundColor Red
    exit 1
}

$current = ([System.IO.File]::ReadAllText($versionFile)).Trim()

if ($current -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
    Write-Host "Conteudo invalido em VERSION: '$current' (esperado MAJOR.MINOR.PATCH)" -ForegroundColor Red
    exit 1
}

$major = [int]$Matches[1]
$minor = [int]$Matches[2]
$patch = [int]$Matches[3]

switch ($Parte) {
    'versao' { $major++; $minor = 0; $patch = 0 }
    'release' { $minor++; $patch = 0 }
    'build' { $patch++ }
}

$newVersion = "$major.$minor.$patch"

function Set-InFile {
    param(
        [string]$Path,
        [string]$Pattern,
        [scriptblock]$BuildReplacement,
        [string]$Label
    )

    if (-not (Test-Path $Path)) {
        Write-Host "Arquivo nao encontrado: $Path" -ForegroundColor Red
        exit 1
    }

    $content = [System.IO.File]::ReadAllText($Path)

    if ($content -notmatch $Pattern) {
        Write-Host "Padrao nao encontrado em $Label ($Path) - abortando sem alterar nada." -ForegroundColor Red
        exit 1
    }

    $updated = [regex]::Replace($content, $Pattern, [System.Text.RegularExpressions.MatchEvaluator]$BuildReplacement)
    [System.IO.File]::WriteAllText($Path, $updated, $utf8NoBom)
    Write-Host "Atualizado: $Label"
}

function Set-InFileOptional {
    param(
        [string]$Path,
        [string]$Pattern,
        [scriptblock]$BuildReplacement,
        [string]$Label
    )

    if (-not (Test-Path $Path)) {
        Write-Host "Pulado (arquivo nao existe): $Label" -ForegroundColor Yellow
        return
    }

    $content = [System.IO.File]::ReadAllText($Path)

    if ($content -notmatch $Pattern) {
        Write-Host "Pulado (padrao nao encontrado): $Label" -ForegroundColor Yellow
        return
    }

    $updated = [regex]::Replace($content, $Pattern, [System.Text.RegularExpressions.MatchEvaluator]$BuildReplacement)
    [System.IO.File]::WriteAllText($Path, $updated, $utf8NoBom)
    Write-Host "Atualizado: $Label"
}

$twoGroupEvaluator = {
    param($m)
    $m.Groups[1].Value + $newVersion + $m.Groups[2].Value
}.GetNewClosure()

$oneGroupEvaluator = {
    param($m)
    $m.Groups[1].Value + $newVersion
}.GetNewClosure()

Write-Host "Versao atual: $current"
Write-Host "Bump ($Parte) -> $newVersion"
Write-Host ""

[System.IO.File]::WriteAllText($versionFile, "$newVersion`n", $utf8NoBom)
Write-Host "Atualizado: VERSION"

Set-InFile -Path (Join-Path $repoRoot 'frontend\package.json') `
    -Pattern '("version": ")[^"]+(")' `
    -BuildReplacement $twoGroupEvaluator `
    -Label 'frontend/package.json'

Set-InFile -Path (Join-Path $repoRoot 'frontend\package-lock.json') `
    -Pattern '("name": "frontend",\s*"version": ")[^"]+(")' `
    -BuildReplacement $twoGroupEvaluator `
    -Label 'frontend/package-lock.json'

Set-InFile -Path (Join-Path $repoRoot 'backend\pom.xml') `
    -Pattern '(<artifactId>backend</artifactId>\s*<version>)[^<]+(</version>)' `
    -BuildReplacement $twoGroupEvaluator `
    -Label 'backend/pom.xml'

Set-InFile -Path (Join-Path $repoRoot 'frontend\src\app\core\version.ts') `
    -Pattern "(export const APP_VERSION = ')[^']+(';)" `
    -BuildReplacement $twoGroupEvaluator `
    -Label 'frontend/src/app/core/version.ts'

Set-InFileOptional -Path (Join-Path $repoRoot '.env') `
    -Pattern '(APP_VERSION=).*' `
    -BuildReplacement $oneGroupEvaluator `
    -Label '.env'

Set-InFileOptional -Path (Join-Path $repoRoot '.env.example') `
    -Pattern '(APP_VERSION=).*' `
    -BuildReplacement $oneGroupEvaluator `
    -Label '.env.example'

Write-Host ""
Write-Host "Versao atualizada: $current -> $newVersion" -ForegroundColor Green
Write-Host "Revise o diff, commite as mudancas e rode 'docker compose up -d --build' para publicar a nova versao."
