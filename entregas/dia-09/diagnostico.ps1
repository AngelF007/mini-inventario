# Pide al agente el diagnostico del despliegue fallido con el MCP de Render (Dia 9).
#   powershell -ExecutionPolicy Bypass -File entregas\dia-09\diagnostico.ps1
# Solo se permiten herramientas de LECTURA del MCP de Render: cambiar variables,
# crear servicios o lanzar despliegues queda negado y se registra.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$py = Join-Path $raiz '.venv\Scripts\python.exe'
$resumir = Join-Path $raiz 'entregas\dia-08\resumir.py'
$carpeta = Join-Path $raiz 'entregas\dia-09'
$utf8 = New-Object Text.UTF8Encoding $false
$lectura = 'mcp__render__list_workspaces,mcp__render__select_workspace,mcp__render__get_selected_workspace,mcp__render__list_services,mcp__render__get_service,mcp__render__list_deploys,mcp__render__get_deploy,mcp__render__list_logs,mcp__render__list_log_label_values'

function Probar($archivo, $titulo, $pregunta, $permitidas) {
  Write-Host "`n>> $titulo" -ForegroundColor Cyan
  $crudo = Join-Path $env:TEMP "$archivo.jsonl"
  $salida = & claude -p $pregunta --output-format stream-json --verbose --max-turns 15 --allowedTools $permitidas
  [IO.File]::WriteAllLines($crudo, [string[]]$salida, $utf8)
  & $py $resumir $crudo (Join-Path $carpeta "$archivo.md") $titulo $pregunta
}

Probar '1-diagnostico-render' 'Diagnostico del despliegue fallido con el MCP de Render' `
  'Usa el MCP de Render para listar el ultimo despliegue de mi servicio mini-inventario y leer sus logs. Explicame la causa exacta de la falla y que linea la provoco. No cambies variables ni lances despliegues sin preguntarme.' $lectura

Write-Host "`nSubiendo la evidencia a GitHub..." -ForegroundColor Cyan
git add entregas/dia-09/1-diagnostico-render.md
git commit -m 'Dia 9: diagnostico del despliegue fallido con el MCP de Render'
git push
Write-Host "`nListo. Avisale al agente." -ForegroundColor Green
