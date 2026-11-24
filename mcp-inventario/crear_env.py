"""Crea mcp-inventario/.env con DATABASE_URL del usuario inventario_lector.

Lo llama configurar.ps1. La contraseña llega por la variable de entorno
LECTOR_CLAVE (nunca por la línea de comandos) y no se imprime.
Prueba los hosts del Session pooler y se queda con el que conecta.
"""

import os
import sys
from pathlib import Path
from urllib.parse import quote

import psycopg

REF = "wbgiwuypgfamivxypcdc"
REGION = "us-east-1"
HOSTS = [f"aws-0-{REGION}.pooler.supabase.com", f"aws-1-{REGION}.pooler.supabase.com"]

clave = os.environ.get("LECTOR_CLAVE", "")
if not clave:
    print("Falta la contraseña.", file=sys.stderr)
    sys.exit(1)

usuario = f"inventario_lector.{REF}"
ultimo_error = ""
for host in HOSTS:
    url = f"postgresql://{usuario}:{quote(clave, safe='')}@{host}:5432/postgres"
    try:
        with psycopg.connect(url, connect_timeout=10) as conexion:
            fila = conexion.execute("select current_user, count(*) from public.productos").fetchone()
    except psycopg.Error as error:
        ultimo_error = str(error).splitlines()[0] if str(error) else error.__class__.__name__
        continue
    (Path(__file__).resolve().parent / ".env").write_text(f"DATABASE_URL={url}\n", encoding="utf-8")
    print(f"OK: conectado por {host} como {fila[0]}; ve {fila[1]} productos. Guardado en mcp-inventario/.env")
    sys.exit(0)

print(f"No se pudo conectar con inventario_lector. Último error: {ultimo_error}", file=sys.stderr)
print("Revisa que corriste el SQL en Supabase y que la contraseña es la misma.", file=sys.stderr)
sys.exit(1)
