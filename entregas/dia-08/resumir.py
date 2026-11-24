"""Resume una corrida de `claude -p --output-format stream-json --verbose`.

Uso: python resumir.py <entrada.jsonl> <salida.md> "<titulo>" "<pregunta>"

Guarda solo lo útil para la bitácora: herramientas usadas (con sus argumentos),
lo que devolvieron (recortado), permisos negados, número de turnos y la respuesta
final. No guarda rutas de la compu ni ids de sesión.
"""

import json
import sys
from pathlib import Path

entrada, salida, titulo, pregunta = sys.argv[1:5]
eventos = []
for linea in Path(entrada).read_text(encoding="utf-8-sig", errors="replace").splitlines():
    linea = linea.strip()
    if linea.startswith("{"):
        try:
            eventos.append(json.loads(linea))
        except json.JSONDecodeError:
            pass

servidores, llamadas, resultados, final = [], [], {}, {}
for e in eventos:
    if e.get("type") == "system" and e.get("subtype") == "init":
        servidores = [f"{s.get('name')} ({s.get('status')})" for s in e.get("mcp_servers", [])]
    for bloque in (e.get("message") or {}).get("content") or []:
        if not isinstance(bloque, dict):
            continue
        if bloque.get("type") == "tool_use":
            llamadas.append((bloque.get("id"), bloque.get("name"), bloque.get("input")))
        elif bloque.get("type") == "tool_result":
            contenido = bloque.get("content")
            if isinstance(contenido, list):
                contenido = "\n".join(c.get("text", "") for c in contenido if isinstance(c, dict))
            texto = str(contenido or "")
            resultados[bloque.get("tool_use_id")] = (bool(bloque.get("is_error")), texto)
    if e.get("type") == "result":
        final = e


def recortar(texto, limite=900):
    texto = texto.strip()
    return texto if len(texto) <= limite else texto[:limite] + " …(recortado)"


lineas = [f"# {titulo}", "", f"**Pregunta:** {pregunta}", ""]
if servidores:
    lineas += [f"**Servidores MCP cargados:** {', '.join(servidores)}", ""]
lineas += [f"## Herramientas usadas ({len(llamadas)})", ""]
if not llamadas:
    lineas.append("Ninguna.")
for i, (id_, nombre, args) in enumerate(llamadas, 1):
    error, texto = resultados.get(id_, (False, ""))
    lineas += [
        f"### {i}. `{nombre}`" + ("  ❌ error" if error else ""),
        "",
        "```json",
        json.dumps(args, ensure_ascii=False, indent=2),
        "```",
        "",
        "Resultado:",
        "",
        "```",
        recortar(texto) or "(vacío)",
        "```",
        "",
    ]
negados = final.get("permission_denials") or []
lineas += ["## Permisos negados", ""]
lineas += [f"- `{d.get('tool_name')}`: {json.dumps(d.get('tool_input'), ensure_ascii=False)}" for d in negados] or ["Ninguno."]
lineas += [
    "",
    "## Números",
    "",
    f"- Turnos: {final.get('num_turns', '?')}",
    f"- Llamadas a herramientas: {len(llamadas)}",
    f"- Duración: {round((final.get('duration_ms') or 0) / 1000, 1)} s",
    "",
    "## Respuesta final",
    "",
    str(final.get("result", "(sin respuesta)")).strip(),
    "",
]
Path(salida).write_text("\n".join(lineas), encoding="utf-8")
print(f"Guardado: {salida}")
