# Comprueba con el agente que el despliegue reparado funciona (Dia 9).
#   powershell -ExecutionPolicy Bypass -File entregas\dia-09\verificar.ps1

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$py = Join-Path $raiz '.venv\Scripts\python.exe'
$resumir = Join-Path $raiz 'entregas\dia-08\resumir.py'
$carpeta = Join-Path $raiz 'entregas\dia-09'
$utf8 = New-Object Text.UTF8Encoding $false
$url = 'https://mini-inventario-m9u5.onrender.com'
$permitidas = 'WebFetch,mcp__render__list_workspaces,mcp__render__select_workspace,mcp__render__get_selected_workspace,mcp__render__list_services,mcp__render__list_deploys,mcp__render__get_deploy'

Write-Host 'Despertando el servicio (puede tardar ~1 minuto)...' -ForegroundColor Cyan
for ($i = 0; $i -lt 12; $i++) {
  try { $r = Invoke-RestMethod "$url/health" -TimeoutSec 15; if ($r.status -eq 'ok') { break } } catch { Start-Sleep -Seconds 5 }
}

$titulo = 'Verificacion del despliegue reparado'
$pregunta = "Usa el MCP de Render para ver el estado del ultimo despliegue de mi servicio mini-inventario, y luego abre $url y $url/health para comprobar que la app responde y muestra la pantalla de inicio de sesion. Dime si todo funciona. No cambies nada."
$crudo = Join-Path $env:TEMP '2-verificacion.jsonl'
Write-Host "`n>> $titulo" -ForegroundColor Cyan
$salida = & claude -p $pregunta --output-format stream-json --verbose --max-turns 15 --allowedTools $permitidas
[IO.File]::WriteAllLines($crudo, [string[]]$salida, $utf8)
& $py $resumir $crudo (Join-Path $carpeta '2-verificacion.md') $titulo $pregunta

Write-Host "`nSubiendo la evidencia a GitHub..." -ForegroundColor Cyan
git add entregas/dia-09/2-verificacion.md
git commit -m 'Dia 9: verificacion del despliegue reparado'
git push
Write-Host "`nListo. Avisale al agente." -ForegroundColor Green
