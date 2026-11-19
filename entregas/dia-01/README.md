# Bitácora — Día 1: Mini Inventario

**Fecha:** 2026-11-18 · **Repositorio:** https://github.com/AngelF007/mini-inventario · **Agente:** Claude · **Sistema:** Windows + Scoop

![Prueba en limpio](captura-prueba-limpio.png)

---

## 1. Prompts clave

1. **Repositorio:** *"Crea en esta carpeta un repositorio Git llamado mini-inventario. Usa gh para publicarlo como repositorio público en mi cuenta. Agrega un README corto que indique que el proyecto requiere Node.js 22 y Python 3.12, y un .gitignore para Node y Python que excluya .env, .venv y node_modules. Antes de ejecutar cada comando, explícame qué hace."*
2. **Reglas del proyecto:** *"Crea el archivo de instrucciones de este proyecto (CLAUDE.md si eres Claude Code, AGENTS.md si eres Codex). Explica que Mini Inventario es una web de inventario, que el proyecto usa Node.js 22 y Python 3.12, que cada cambio va en una rama con pull request, que nunca se suben llaves ni archivos .env, y que debes pedir aprobación antes de borrar datos o desplegar. Máximo 20 líneas."*
3. **Extra:** *"Agrega al README una sección «Cómo empezar» con los pasos para clonar el proyecto y comprobar las versiones."*

---

## 2. Lo que hice

| Paso | Qué hice | Resultado |
|---|---|---|
| 1. Terminal y GitHub | Instalé Scoop y con él `git`, `gh` y `pwsh` | Las 3 herramientas quedaron en `C:\Users\migue\scoop\shims` |
| 2. Repositorio | Le di al agente el prompt 1, revisé el README y el `.gitignore` y aprobé la publicación | Repo público `AngelF007/mini-inventario` |
| 3. Node y Python | Instalé `nodejs22` y `python312` con Scoop y comprobé las versiones | Ver sección 5 |
| 4. Reglas | Le di el prompt 2 y revisé que `CLAUDE.md` tuviera las reglas de ramas, llaves y aprobación | `CLAUDE.md` de 17 líneas (máximo 20) |
| 5. Prueba en limpio | Cloné el repo en otra carpeta y tomé la captura | Ver sección 6 |
| Extra | Le pedí al agente mejorar el README con la sección «Cómo empezar» | README completo con instalación y estructura |

---

## 3. Errores y problemas

### 3.1 Error de la IA: no respetó su propia regla de ramas
`CLAUDE.md` dice *"cada cambio va en una rama nueva y se integra con pull request"*, pero el agente subió todos los cambios **directo a `main`**.
**Cómo lo detecté:** al revisar el historial del repo en GitHub no había ninguna rama ni pull request.
**Lección:** no basta con escribir las reglas; hay que revisar que el agente las cumpla. Desde el Día 2 le voy a pedir explícitamente una rama y un PR por cada cambio.

### 3.2 Error de la IA: instrucciones confusas para `gh auth login`
El agente me dijo que pegara "el código" en GitHub sin aclarar que ese código de 8 caracteres lo muestra **PowerShell**, no GitHub. Me atoré varios minutos. Lo resolví iniciando sesión directamente en github.com, y para la prueba en limpio usé `git clone` con HTTPS, que no necesita `gh` porque el repo es público.

### 3.3 Acentos en Windows PowerShell 5.1
Al hacer `cat README.md` salió **"CÃ³mo"** en lugar de **"Cómo"**. En GitHub el archivo se ve bien: es un problema de codificación de Windows PowerShell 5.1. La guía pide trabajar en **PowerShell 7** (`pwsh`), que muestra los acentos correctamente. Desde el Día 2 trabajaré ahí.

---

## 4. Comandos y decisiones aprobados o rechazados

- ✅ **Aprobé** crear el repositorio **público** (equivale a `gh repo create mini-inventario --public --source=. --push`), porque la actividad lo pide y antes revisé el contenido de cada archivo.
- 🔁 **Cambié de opinión con la visibilidad:** pedí ponerlo privado para que no copiaran mi trabajo. El agente me advirtió que el criterio "Repositorio: es público" vale 25 puntos y que mi profesor no podría ver el enlace. Lo puse privado de todos modos, pero luego lo regresé a **público**. Estado final: público.
- ❌ **Acceso denegado:** el permiso para que el agente entrara a mi carpeta `Documents` fue rechazado. No era necesario para la actividad y así no tuvo acceso a mis otros archivos.
- 🔒 La contraseña de GitHub la escribí yo en github.com. Nunca la compartí con el agente.

---

## 5. Verificación del entorno

`node --version; npm --version; python --version`

| Herramienta | Versión | ¿Cumple? |
|---|---|---|
| Node.js | v22.23.5 | ✅ (mínimo 22.20) |
| npm | 10.9.9 | ✅ |
| Python | 3.12.10 | ✅ |

**Nota:** en Windows con Scoop el comando es `python`, no `python3`.

---

## 6. Prueba en limpio

```powershell
cd ~\Documents
git clone https://github.com/AngelF007/mini-inventario.git prueba-inventario
cd prueba-inventario
git ls-files
cat README.md
```

- **Clonación:** correcta.
- **`git ls-files`:** `.gitignore`, `CLAUDE.md`, `README.md`, `entregas/dia-01/README.md`.
- **`cat README.md`:** muestra los requisitos **Node.js 22** y **Python 3.12**.
- **Evidencia:** la captura de arriba. La tomé antes de mejorar el README; los requisitos son los mismos.
