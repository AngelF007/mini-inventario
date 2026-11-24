# Configura el servidor MCP propio de Mini Inventario (Dia 8).
# Correlo desde la carpeta del repositorio:
#   powershell -ExecutionPolicy Bypass -File mcp-inventario\configurar.ps1
#
# Que hace:
#   1. Crea el entorno virtual .venv e instala fastmcp, psycopg[binary] y python-dotenv.
#   2. Te pide una contrasena nueva para inventario_lector (no se muestra ni se guarda en el repo).
#   3. Copia el SQL del usuario de solo lectura al portapapeles y abre el editor de SQL de Supabase.
#   4. Guarda DATABASE_URL (Session pooler) en mcp-inventario\.env y prueba las 2 herramientas.
#   5. Registra supabase-lectura (solo lectura) e inventario en Claude Code.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$py = Join-Path $raiz '.venv\Scripts\python.exe'
$server = Join-Path $raiz 'mcp-inventario\server.py'
$ref = 'wbgiwuypgfamivxypcdc'

Write-Host "`n1/5 Entorno virtual y dependencias" -ForegroundColor Cyan
if (-not (Test-Path $py)) {
  if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3.12 -m venv .venv
    if (-not (Test-Path $py)) { py -3 -m venv .venv }
  } else {
    python -m venv .venv
  }
}
if (-not (Test-Path $py)) { throw 'No se pudo crear .venv. Revisa que Python 3.12 este instalado.' }
& $py -m pip install --quiet --disable-pip-version-check -r mcp-inventario\requirements.txt
if ($LASTEXITCODE) { throw 'No se pudieron instalar las dependencias.' }
Write-Host '    Listo: fastmcp, psycopg[binary] y python-dotenv instalados en .venv'

Write-Host "`n2/5 Contrasena del usuario de solo lectura" -ForegroundColor Cyan
$segura = Read-Host '    Inventa una contrasena para inventario_lector (12+ caracteres; no se mostrara)' -AsSecureString
$clave = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura))
if ($clave.Length -lt 12) { throw 'Usa al menos 12 caracteres.' }

# El mismo SQL de la guia. Si lo corres dos veces no falla: si el rol ya existe solo cambia la contrasena.
$claveSql = $clave.Replace("'", "''")
$sql = @"
do `$`$ begin
  if not exists (select from pg_roles where rolname = 'inventario_lector') then
    create role inventario_lector login;
  end if;
end `$`$;
alter role inventario_lector login password '$claveSql';
grant usage on schema public to inventario_lector;
grant select on public.productos to inventario_lector;
drop policy if exists lector_ve_productos on public.productos;
create policy lector_ve_productos on public.productos
  for select to inventario_lector using (true);
"@
Set-Clipboard -Value $sql
$sql = $null; $claveSql = $null

Write-Host "`n3/5 Crear el usuario en Supabase" -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/$ref/sql/new"
Write-Host '    Ya copie el SQL (con tu contrasena) y abri el editor de SQL de Supabase.'
Write-Host '    Pega con Ctrl+V, dale Run y espera a que diga Success.'
Read-Host '    Cuando diga Success, regresa aqui y presiona Enter'
Set-Clipboard -Value ' '   # borra la contrasena del portapapeles

Write-Host "`n4/5 Guardar mcp-inventario\.env y probar" -ForegroundColor Cyan
$env:LECTOR_CLAVE = $clave
& $py mcp-inventario\crear_env.py
$fallo = $LASTEXITCODE
Remove-Item Env:LECTOR_CLAVE
$clave = $null
if ($fallo) { throw 'No se pudo conectar con inventario_lector.' }
& $py $server --probar
if ($LASTEXITCODE) { throw 'La prueba del servidor fallo.' }

Write-Host "`n5/5 Registrar los servidores MCP en Claude Code" -ForegroundColor Cyan
if (Get-Command claude -ErrorAction SilentlyContinue) {
  cmd /c "claude mcp remove inventario >nul 2>&1"
  cmd /c "claude mcp remove supabase-lectura >nul 2>&1"
  claude mcp add inventario -- $py $server
  claude mcp add --transport http supabase-lectura "https://mcp.supabase.com/mcp?project_ref=$ref&read_only=true"
  claude mcp list
  Write-Host "`nListo. Falta autorizar supabase-lectura: abre 'claude', escribe /mcp, elige supabase-lectura y Authenticate." -ForegroundColor Green
} else {
  Write-Warning 'No encontre el comando claude. Instala Claude Code y vuelve a correr este script.'
}
