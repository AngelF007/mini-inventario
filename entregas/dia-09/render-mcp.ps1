# Registra el MCP de Render en Claude Code (Dia 9).
#   powershell -ExecutionPolicy Bypass -File entregas\dia-09\render-mcp.ps1
# Te pide la API key de Render sin mostrarla. La key se guarda solo en la
# configuracion local de Claude Code (no en el repositorio).

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { throw 'No encontre claude.' }

Write-Host 'Crea una API key en Render: Account Settings > API Keys > Create API Key.' -ForegroundColor Cyan
Start-Process 'https://dashboard.render.com/settings#api-keys'
$segura = Read-Host 'Pega aqui tu API key de Render (no se mostrara)' -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura))
if ($key.Trim().Length -lt 10) { throw 'La API key se ve vacia o incompleta.' }

cmd /c "claude mcp remove render >nul 2>&1"
claude mcp add --transport http render https://mcp.render.com/mcp --header "Authorization: Bearer $($key.Trim())" | Out-Null
$key = $null
Write-Host "`nServidores MCP:" -ForegroundColor Cyan
claude mcp list
Write-Host "`nListo. Avisale al agente." -ForegroundColor Green
