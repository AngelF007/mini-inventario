# Dia 10, pasos 3 y 4: crea el issue con gh y corre la prueba nueva (antes de corregir debe FALLAR).
#   powershell -ExecutionPolicy Bypass -File entregas\dia-10\prueba.ps1 antes     (crea el issue y corre la prueba)
#   powershell -ExecutionPolicy Bypass -File entregas\dia-10\prueba.ps1 despues   (solo corre la prueba)
param([string]$fase = 'antes')
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$carpeta = Join-Path $raiz 'entregas\dia-10'
$utf8 = New-Object Text.UTF8Encoding $false

if ($fase -eq 'antes') {
  $existe = gh issue list --search 'SKU duplicado in:title' --state all --json number --jq '.[0].number'
  if (-not $existe) {
    Write-Host '>> Creando el issue con gh...' -ForegroundColor Cyan
    gh issue create --title 'Incidente: se puede registrar el mismo SKU con otras mayusculas (SKU duplicado)' --body-file entregas/dia-10/issue.md --label bug
    if ($LASTEXITCODE) { gh issue create --title 'Incidente: se puede registrar el mismo SKU con otras mayusculas (SKU duplicado)' --body-file entregas/dia-10/issue.md }
  } else { Write-Host "El issue ya existe: #$existe" }
}

Write-Host "`n>> Corriendo la prueba nueva ($fase)..." -ForegroundColor Cyan
$salida = npx playwright test -g 'mismo SKU con otras' --reporter=list 2>&1 | ForEach-Object { "$_" }
$codigo = $LASTEXITCODE
$salida | ForEach-Object { Write-Host $_ }
$texto = @("== npx playwright test -g 'mismo SKU con otras'  ($fase, $(Get-Date -Format 'yyyy-MM-dd HH:mm'))", "Codigo de salida: $codigo  ($(if ($codigo) {'FALLA'} else {'PASA'}))", '') + $salida
[IO.File]::WriteAllLines((Join-Path $carpeta "prueba-$fase.txt"), [string[]]$texto, $utf8)

git add "entregas/dia-10/prueba-$fase.txt"
git commit -m "Dia 10: evidencia de la prueba ($fase)"
git push
Write-Host "`nListo. Avisale al agente." -ForegroundColor Green
