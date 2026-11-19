# Entrega Día 1 — Preparación

Repositorio: https://github.com/AngelF007/mini-inventario

![Prueba en limpio](captura-prueba-limpio.png)

## Prompts clave
1. "Crea en esta carpeta un repositorio Git llamado mini-inventario. Usa gh para publicarlo como repositorio público en mi cuenta. Agrega un README corto que indique que el proyecto requiere Node.js 22 y Python 3.12, y un .gitignore para Node y Python que excluya .env, .venv y node_modules. Antes de ejecutar cada comando, explícame qué hace."
2. "Crea el archivo de instrucciones de este proyecto (CLAUDE.md si eres Claude Code, AGENTS.md si eres Codex). Explica que Mini Inventario es una web de inventario, que el proyecto usa Node.js 22 y Python 3.12, que cada cambio va en una rama con pull request, que nunca se suben llaves ni archivos .env, y que debes pedir aprobación antes de borrar datos o desplegar. Máximo 20 líneas."
3. (Extra) "Agrega al README una sección «Cómo empezar» con los pasos para clonar el proyecto y comprobar las versiones."

## Un error o mala decisión de la IA
El primer plan de la IA no servía en mi equipo: supuso que podía instalar y publicar todo desde su propia
terminal, pero en Windows no tenía permiso para escribir en PowerShell ni para entrar a mi carpeta Documents.
Además, sus instrucciones para `gh auth login` no dejaban claro de dónde salía el código de 8 caracteres y me atoré.
Lo detecté porque los pasos fallaban o no coincidían con lo que veía en pantalla. Cambiamos de plan: inicié sesión
en GitHub yo mismo y el agente creó el repositorio y los archivos desde la web.

## Comando o herramienta que aprobé o rechacé
- **Rechazado:** el acceso del agente a mi carpeta Documents. No era necesario para la actividad
  y prefiero no darle acceso a todos mis documentos.
- **Aprobado:** que el agente creara el repositorio público `mini-inventario` en mi cuenta y le subiera
  README, .gitignore y CLAUDE.md, porque es exactamente lo que pide la actividad y revisé el contenido antes.
- La contraseña de GitHub la escribí yo; nunca se la di al agente.

## Cómo comprobé que funciona
- `node --version` → v22.23.5 · `npm --version` → 10.9.9 · `python --version` → Python 3.12.10
  (en Windows con Scoop el comando es `python`, no `python3`).
- Cloné el repo en otra carpeta (`prueba-inventario`) y `git ls-files` muestra `.gitignore`, `CLAUDE.md`,
  `README.md` y `entregas/dia-01/README.md`; `cat README.md` muestra los requisitos. La captura está arriba.
