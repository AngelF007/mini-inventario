# Dia 10, paso 2: reproduce el reporte en produccion y pide al agente que investigue.
#   powershell -ExecutionPolicy Bypass -File entregas\dia-10\investigar.ps1
# 1) scripts/reproducir-incidente.mjs abre la URL publica con Playwright, intenta guardar
#    el mismo SKU en mayusculas y en minusculas y toma una captura.
# 2) claude -p revisa los logs de Render y los datos (solo lectura) y explica la causa.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$py = Join-Path $raiz '.venv\Scripts\python.exe'
$resumir = Join-Path $raiz 'entregas\dia-08\resumir.py'
$carpeta = Join-Path $raiz 'entregas\dia-10'
$utf8 = New-Object Text.UTF8Encoding $false

Write-Host '>> Reproduciendo el reporte en https://mini-inventario-m9u5.onrender.com (puede tardar 1 minuto en despertar)...' -ForegroundColor Cyan
node scripts/reproducir-incidente.mjs antes
if ($LASTEXITCODE) { throw 'La reproduccion fallo. Mandale captura al agente.' }

$reporte = Get-Content (Join-Path $carpeta 'reproduccion-antes.txt') -Raw
$permitidas = 'mcp__render__list_workspaces,mcp__render__list_services,mcp__render__get_service,mcp__render__list_deploys,mcp__render__get_deploy,mcp__render__list_logs,mcp__render__list_log_label_values,mcp__inventario__buscar_producto,mcp__inventario__stock_bajo,Read,Grep,Glob'
$pregunta = @"
Tenemos este reporte de produccion: 'Pude registrar dos productos con el mismo SKU'. Ya lo reproduje en la URL publica https://mini-inventario-m9u5.onrender.com con Playwright; este fue el resultado:

$reporte
Revisa los logs recientes del servicio mini-inventario con el MCP de Render (workspace My Workspace, es el unico) y consulta los datos con el MCP inventario, que es de solo lectura (busca los productos que se llaman Reporte). Lee tambien public/productos.js y supabase/migrations/ para ver como se valida el SKU. Explica la causa exacta. No cambies nada todavia.
"@
Write-Host "`n>> Investigacion con el agente" -ForegroundColor Cyan
$crudo = Join-Path $env:TEMP '1-investigacion.jsonl'
$OutputEncoding = New-Object Text.UTF8Encoding $false   # el prompt va por stdin para no romper las comillas
$salida = $pregunta | & claude -p --output-format stream-json --verbose --max-turns 20 --allowedTools $permitidas
[IO.File]::WriteAllLines($crudo, [string[]]$salida, $utf8)
& $py $resumir $crudo (Join-Path $carpeta '1-investigacion.md') 'Investigacion del incidente: SKU duplicado' $pregunta.Replace([string][char]34, [string][char]39)

Write-Host "`nSubiendo la evidencia a GitHub..." -ForegroundColor Cyan
git add entregas/dia-10/reproduccion-antes.txt entregas/dia-10/reproduccion-antes.png entregas/dia-10/1-investigacion.md
git commit -m 'Dia 10: reproduccion en produccion e investigacion del SKU duplicado'
git push
Write-Host "`nListo. Avisale al agente." -ForegroundColor Green
