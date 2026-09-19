# Atualizador de ambiente: leva a stack Docker que esta rodando de uma versao para outra.
#
#   backup do banco -> troca para a branch da versao -> rebuild das imagens ->
#   health-check -> rollback automatico se a nova versao nao subir.
#
# Exemplos:
#   powershell -File scripts/update-environment.ps1 -Versao 1.0.1
#   powershell -File scripts/update-environment.ps1 -Versao main -SemBackup
param(
    [Parameter(Mandatory = $true)][string]$Versao,
    [switch]$SemPull,
    [switch]$SemBackup,
    [switch]$SemRollback,
    [int]$TimeoutSegundos = 240
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

function Invoke-Docker {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumentos)
    $anterior = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $saida = & docker @Argumentos 2>&1
        return [pscustomobject]@{
            Ok    = ($LASTEXITCODE -eq 0)
            Saida = (($saida | ForEach-Object { "$_" }) -join "`n").Trim()
        }
    }
    finally {
        $ErrorActionPreference = $anterior
    }
}

function Read-EnvFile {
    param([string]$Path)
    $valores = @{}
    if (-not (Test-Path $Path)) { return $valores }
    foreach ($linha in [System.IO.File]::ReadAllLines($Path)) {
        if ($linha -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
            $valores[$Matches[1]] = $Matches[2].Trim()
        }
    }
    return $valores
}

function Set-EnvAppVersion {
    param([string]$Path, [string]$Valor)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $conteudo = [System.IO.File]::ReadAllText($Path)
    if ($conteudo -match '(?m)^APP_VERSION=.*$') {
        $conteudo = [regex]::Replace($conteudo, '(?m)^APP_VERSION=.*$', "APP_VERSION=$Valor")
    }
    else {
        if (-not $conteudo.EndsWith("`n")) { $conteudo += "`n" }
        $conteudo += "APP_VERSION=$Valor`n"
    }
    [System.IO.File]::WriteAllText($Path, $conteudo, $utf8NoBom)
}

function Test-Endpoint {
    param([string]$Url, [int]$TimeoutSec = 5)
    try {
        return Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing
    }
    catch {
        return $null
    }
}

function Wait-Ambiente {
    param([string]$UrlHealth, [string]$UrlFrontend, [string]$VersaoEsperada, [int]$Timeout)

    $limite = (Get-Date).AddSeconds($Timeout)
    $ultimoErro = 'sem resposta do backend'

    while ((Get-Date) -lt $limite) {
        $health = Test-Endpoint -Url $UrlHealth
        if ($health -and $health.StatusCode -eq 200) {
            $corpo = $health.Content | ConvertFrom-Json
            if ($corpo.version -ne $VersaoEsperada) {
                $ultimoErro = "backend respondeu com a versao '$($corpo.version)', esperada '$VersaoEsperada' (imagem antiga?)"
            }
            elseif ($corpo.status -ne 'UP') {
                $ultimoErro = "backend respondeu status '$($corpo.status)'"
            }
            else {
                $front = Test-Endpoint -Url $UrlFrontend
                if ($front -and $front.StatusCode -eq 200) {
                    return @{ Ok = $true; Erro = $null }
                }
                $ultimoErro = 'frontend nao respondeu 200'
            }
        }
        Start-Sleep -Seconds 5
    }

    return @{ Ok = $false; Erro = $ultimoErro }
}

try {
    $envPath = Join-Path $repoRoot '.env'
    if (-not (Test-Path $envPath)) {
        throw ".env nao encontrado. Copie .env.example para .env e defina POSTGRES_PASSWORD antes de atualizar o ambiente."
    }

    if ((Invoke-FinanceOsGit status --porcelain).Saida) {
        throw "Working tree sujo. O atualizador troca de branch - comite ou guarde suas mudancas antes."
    }

    $alvo = $Versao.Trim()
    if ($alvo -match $Global:FinanceOsVersionRegex) { $alvo = "v$((ConvertFrom-FinanceOsVersion $alvo).Base)" }

    $branchAnterior = (Invoke-FinanceOsGit rev-parse --abbrev-ref HEAD).Saida
    $versaoAnterior = (Get-FinanceOsVersion -RepoRoot $repoRoot).Full

    if (-not $SemPull) {
        Write-Host "Buscando atualizacoes do origin..."
        Invoke-Git fetch origin | Out-Null
    }

    if ($branchAnterior -ne $alvo) {
        Write-Host "Trocando para a branch '$alvo'..."
        Invoke-Git checkout $alvo | Out-Null
    }
    if (-not $SemPull) { Invoke-Git pull --ff-only | Out-Null }

    $versaoNova = (Get-FinanceOsVersion -RepoRoot $repoRoot).Full
    $config = Read-EnvFile -Path $envPath
    $portaBackend = if ($config.BACKEND_PORT) { $config.BACKEND_PORT } else { '8080' }
    $portaFrontend = if ($config.FRONTEND_PORT) { $config.FRONTEND_PORT } else { '80' }
    $urlHealth = "http://localhost:$portaBackend/api/health"
    $urlFrontend = "http://localhost:$portaFrontend/"

    Write-Host ""
    Write-Host "Ambiente: $versaoAnterior ($branchAnterior)  ->  $versaoNova ($alvo)" -ForegroundColor Cyan
    Write-Host ""

    $dump = $null
    if (-not $SemBackup) {
        $rodando = (Invoke-Docker compose ps -q postgres).Saida
        if ($rodando) {
            $pastaBackup = Join-Path $repoRoot 'backups'
            New-Item -ItemType Directory -Force -Path $pastaBackup | Out-Null
            $dump = Join-Path $pastaBackup ("$(Get-Date -Format 'yyyyMMdd-HHmmss')-antes-de-$versaoNova.sql")
            $usuario = if ($config.POSTGRES_USER) { $config.POSTGRES_USER } else { 'financeos' }
            $banco = if ($config.POSTGRES_DB) { $config.POSTGRES_DB } else { 'financeos' }
            Write-Host "Backup do banco em $dump ..."
            & docker compose exec -T postgres pg_dump -U $usuario $banco | Set-Content -Path $dump -Encoding utf8
            if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar o backup do banco. Rode com -SemBackup para pular (por sua conta e risco)." }
            Write-Host "Backup concluido." -ForegroundColor Green
        }
        else {
            Write-Host "Postgres nao esta rodando - nada para fazer backup." -ForegroundColor Yellow
        }
    }

    Set-EnvAppVersion -Path $envPath -Valor $versaoNova
    Write-Host "Subindo a stack (docker compose up -d --build)..."
    & docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { throw "docker compose up falhou." }

    Write-Host "Aguardando o ambiente responder (ate $TimeoutSegundos s)..."
    $resultado = Wait-Ambiente -UrlHealth $urlHealth -UrlFrontend $urlFrontend -VersaoEsperada $versaoNova -Timeout $TimeoutSegundos

    if ($resultado.Ok) {
        Write-Host ""
        Write-Host "Ambiente atualizado para $versaoNova." -ForegroundColor Green
        Write-Host "  Tela : $urlFrontend"
        Write-Host "  API  : $urlHealth"
        if ($dump) { Write-Host "  Backup anterior: $dump" }
        return
    }

    Write-Host ""
    Write-Host "Ambiente nao ficou saudavel: $($resultado.Erro)" -ForegroundColor Red
    & docker compose logs --tail 40 backend

    if ($SemRollback) {
        throw "Atualizacao falhou e o rollback foi desativado (-SemRollback). Ambiente continua em $versaoNova."
    }

    Write-Host ""
    Write-Host "Revertendo para $versaoAnterior ($branchAnterior)..." -ForegroundColor Yellow
    Invoke-Git checkout $branchAnterior | Out-Null
    Set-EnvAppVersion -Path $envPath -Valor $versaoAnterior
    & docker compose up -d --build
    $voltou = Wait-Ambiente -UrlHealth $urlHealth -UrlFrontend $urlFrontend -VersaoEsperada $versaoAnterior -Timeout $TimeoutSegundos

    if ($voltou.Ok) {
        Write-Host "Rollback concluido: ambiente de volta em $versaoAnterior." -ForegroundColor Yellow
    }
    else {
        Write-Host "Rollback tambem falhou: $($voltou.Erro)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Atencao: migracoes Flyway aplicadas pela versao nova NAO sao revertidas pelo rollback." -ForegroundColor Red
    if ($dump) {
        Write-Host "Se o banco ficou incompativel com a versao antiga, restaure o dump com:" -ForegroundColor Red
        Write-Host "  Get-Content '$dump' | docker compose exec -T postgres psql -U $($config.POSTGRES_USER) -d $($config.POSTGRES_DB)"
    }
    throw "Atualizacao para $versaoNova falhou - ver mensagens acima."
}
catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
