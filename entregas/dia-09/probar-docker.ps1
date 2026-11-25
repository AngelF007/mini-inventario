# Prueba el contenedor de Mini Inventario en local (Dia 9) y guarda la evidencia.
# Correlo desde la carpeta del repositorio:
#   powershell -ExecutionPolicy Bypass -File entregas\dia-09\probar-docker.ps1

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $raiz
$evidencia = Join-Path $raiz 'entregas\dia-09\docker-local.txt'
$log = New-Object System.Collections.Generic.List[string]
function Anota($texto) { Write-Host $texto; $log.Add($texto) }

# Corre docker sin que PowerShell trate su stderr (el progreso) como error.
function EjecutarDocker([string[]]$argumentos) {
  $anterior = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  $salida = & docker.exe @argumentos 2>&1 | ForEach-Object { "$_" }
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $anterior
  return @{ salida = @($salida); codigo = $codigo }
}

Anota "== Prueba local del contenedor ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"

$r = EjecutarDocker @('version', '--format', '{{.Server.Version}}')
if ($r.codigo) { throw 'Docker no esta corriendo. Abre Docker Desktop, espera a que diga "Engine running" y vuelve a correr este script.' }
Anota "Docker Engine: $($r.salida[-1])"

# Archivo de variables temporal: solo SUPABASE_URL y SUPABASE_KEY, con saltos de linea limpios.
if (-not (Test-Path .env)) { throw 'Falta .env en la carpeta del repositorio.' }
$vars = Get-Content .env | Where-Object { $_ -match '^\s*(SUPABASE_URL|SUPABASE_KEY)\s*=' } | ForEach-Object { $_.Trim() }
if ($vars.Count -lt 2) { throw '.env debe tener SUPABASE_URL y SUPABASE_KEY.' }
$envTemporal = Join-Path $env:TEMP 'mini-inventario-docker.env'
[IO.File]::WriteAllText($envTemporal, (($vars -join "`n") + "`n"))

Anota "`n> docker build -t mini-inventario ."
$r = EjecutarDocker @('build', '-t', 'mini-inventario', '.')
$r.salida | Select-Object -Last 15 | ForEach-Object { Anota "  $_" }
if ($r.codigo) { Remove-Item $envTemporal; throw 'Fallo docker build.' }

Anota "`n> La imagen no trae secretos ni archivos de mas:"
$r = EjecutarDocker @('run', '--rm', 'mini-inventario', 'sh', '-c', 'ls -A /app; test -f /app/.env && echo HAY_.env || echo SIN_.env_DENTRO_DE_LA_IMAGEN')
$r.salida | ForEach-Object { Anota "  $_" }

EjecutarDocker @('rm', '-f', 'mini-inventario-prueba') | Out-Null
Anota "`n> docker run --env-file .env -e PORT=3000 -p 3000:3000 mini-inventario   (en segundo plano, con nombre)"
$r = EjecutarDocker @('run', '-d', '--name', 'mini-inventario-prueba', '--env-file', $envTemporal, '-e', 'PORT=3000', '-p', '3000:3000', 'mini-inventario')
Remove-Item $envTemporal
if ($r.codigo) { $r.salida | ForEach-Object { Anota "  $_" }; throw 'No arranco el contenedor. Si dice que el puerto 3000 esta ocupado, cierra la ventana donde corre npm start.' }

$ok = $false
for ($i = 0; $i -lt 20 -and -not $ok; $i++) {
  Start-Sleep -Seconds 1
  try { $salud = Invoke-RestMethod 'http://localhost:3000/health' -TimeoutSec 2; $ok = $true } catch {}
}
Anota "`n> GET http://localhost:3000/health"
if (-not $ok) { Anota '  (no respondio)'; (EjecutarDocker @('logs', 'mini-inventario-prueba')).salida | ForEach-Object { Anota "  $_" }; throw 'El contenedor no respondio.' }
Anota "  $($salud | ConvertTo-Json -Compress)"

$config = (Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/config.js').Content
$tieneUrl = $config -match 'supabase\.co'
$tieneLlave = $config -match 'sb_publishable_'
Anota "`n> GET http://localhost:3000/config.js"
Anota "  Trae la URL de Supabase: $tieneUrl. Trae la llave publicable (no secreta): $tieneLlave"

Anota "`n> docker logs mini-inventario-prueba"
(EjecutarDocker @('logs', 'mini-inventario-prueba')).salida | ForEach-Object { Anota "  $_" }

Start-Process 'http://localhost:3000'
Write-Host "`nAbri tu web desde el contenedor en http://localhost:3000." -ForegroundColor Cyan
Write-Host 'Inicia sesion para comprobar que funciona y toma una captura de pantalla.' -ForegroundColor Cyan
$resp = Read-Host 'Pudiste iniciar sesion y ver tus productos? (s/n)'
Anota "`nInicio de sesion en http://localhost:3000 desde el contenedor: $(if ($resp -match '^s') {'OK'} else {'NO'})"

EjecutarDocker @('rm', '-f', 'mini-inventario-prueba') | Out-Null
Anota 'Contenedor detenido y borrado.'

[IO.File]::WriteAllLines($evidencia, $log, (New-Object Text.UTF8Encoding $false))
Write-Host "`nSubiendo la evidencia a GitHub..." -ForegroundColor Cyan
git add entregas/dia-09/docker-local.txt
git commit -m 'Dia 9: evidencia de la prueba local del contenedor'
git push
Write-Host "`nListo. Avisale al agente." -ForegroundColor Green
