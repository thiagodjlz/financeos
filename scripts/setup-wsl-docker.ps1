Write-Host "FinanceOS - habilitando recursos do Windows para Docker Desktop" -ForegroundColor Cyan
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).
    IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Este script precisa ser executado como Administrador." -ForegroundColor Red
    Write-Host "Clique com o botao direito no PowerShell e escolha 'Executar como administrador'."
    Read-Host "Pressione Enter para fechar"
    exit 1
}

Write-Host "Habilitando Microsoft-Windows-Subsystem-Linux..."
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart

Write-Host "Habilitando VirtualMachinePlatform..."
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart

Write-Host ""
Write-Host "Recursos solicitados. Reinicie o Windows antes de continuar." -ForegroundColor Green
Write-Host "Depois da reinicializacao:"
Write-Host "1. Abra o Docker Desktop."
Write-Host "2. Conclua a tela inicial."
Write-Host "3. Volte ao Codex para subirmos o PostgreSQL."
Write-Host ""
Read-Host "Pressione Enter para fechar"
