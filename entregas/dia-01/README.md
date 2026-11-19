# Bitácora — Día 1: Mini Inventario

**Fecha:** 2026-11-18 / 19 · **Repositorio:** https://github.com/AngelF007/mini-inventario · **Asistente:** Claude (app de escritorio, con navegador integrado) · **Equipo:** Windows

![Prueba en limpio](captura-prueba-limpio.png)

---

## 1. Prompts clave

| # | Prompt | Resultado |
|---|---|---|
| 1 | Le di al asistente la guía del Día 1 (PDF y HTML) y le pedí: *"hazme esta act por favor"* | Preparó README, `.gitignore`, `CLAUDE.md` y los comandos para Windows |
| 2 | **Prompt de la guía para el repositorio:** *"Crea en esta carpeta un repositorio Git llamado mini-inventario. Usa gh para publicarlo como repositorio público en mi cuenta. Agrega un README corto que indique que el proyecto requiere Node.js 22 y Python 3.12, y un .gitignore para Node y Python que excluya .env, .venv y node_modules. Antes de ejecutar cada comando, explícame qué hace."* | Repositorio `mini-inventario` público con README y `.gitignore` |
| 3 | **Prompt de la guía para las reglas:** *"Crea el archivo de instrucciones de este proyecto (CLAUDE.md si eres Claude Code, AGENTS.md si eres Codex)… Máximo 20 líneas."* | `CLAUDE.md` de 17 líneas (comprobado con `wc -l`) |
| 4 | *"hazme toda la act tú"* (después de atorarme con `gh auth login`) | Cambio de plan: el asistente creó el repo desde la web de GitHub |
| 5 | *"ponla privada"* → *"ponlo en público, me equivoqué"* | Primero me advirtió del costo y después hizo cada cambio (ver 3.2) |
| 6 | *"hazme bien el README"* (punto extra «Si terminas antes») | README completo con sección **Cómo empezar** |

---

## 2. Incidencias

### 2.1 Error de herramienta: el asistente no podía usar mi terminal
- **Qué pasó:** el asistente intentó trabajar en mi computadora, pero las terminales (PowerShell) tienen el teclado bloqueado para él. Además, el sistema de permisos le **negó el acceso** a mi carpeta `Documents`.
- **Consecuencia:** no podía instalar programas ni ejecutar `git`/`gh` por mí. Las instalaciones las hice yo con Scoop.
- **Solución:** inicié sesión en GitHub en el navegador integrado de la app (la contraseña la escribí yo), y desde ahí el asistente creó el repositorio y los archivos.

### 2.2 Me atoré con `gh auth login`
- **Qué pasó:** no encontraba "el código" que pedía GitHub. Las primeras instrucciones del asistente no dejaban claro que el código de 8 caracteres lo muestra **PowerShell**, no GitHub.
- **Solución:** en lugar de seguir con `gh`, usé el inicio de sesión en la web. Para la prueba en limpio usé `git clone` con la URL HTTPS, que no necesita sesión porque el repo es público.

### 2.3 Error de la IA: no siguió su propia regla de ramas
- **Qué pasó:** `CLAUDE.md` dice *"cada cambio va en una rama nueva y se integra con pull request"*, pero el asistente hizo todos los commits **directamente en `main`**.
- **Cómo lo detecté:** al revisar el historial de commits en GitHub, no hay ninguna rama ni pull request.
- **Lección:** las reglas de `CLAUDE.md` hay que pedirlas y verificarlas. A partir del Día 2, cada cambio irá en una rama con PR.

### 2.4 Detalle: acentos en Windows PowerShell 5.1
- `cat README.md` mostró **"CÃ³mo"** en lugar de **"Cómo"**. El archivo está bien (en GitHub se ve correcto). Es un problema de codificación de Windows PowerShell 5.1.
- Además, hice la prueba en PowerShell 5.1 y no en **PowerShell 7** (`pwsh`) como pide la guía. En PowerShell 7 los acentos se ven bien.

---

## 3. Comandos y decisiones aprobados o rechazados

### 3.1 Aprobado: crear el repositorio público
- **Qué hace:** crea `AngelF007/mini-inventario` como **público** y sube README, `.gitignore` y `CLAUDE.md`. Es el equivalente en la web de `gh repo create mini-inventario --public --source=. --push`.
- **Por qué lo aprobé:** la actividad pide un repositorio público y revisé el contenido de cada archivo antes de subirlo.

### 3.2 Cambio de visibilidad: privado → público
- Le pedí ponerlo **privado** por miedo a que copiaran mi trabajo. El asistente **no lo hizo de inmediato**: me avisó que el criterio "Repositorio: es público" vale **25 puntos** y que mi profesor no podría ver el enlace. Elegí hacerlo privado de todos modos.
- Minutos después me di cuenta del error y pedí volverlo a **público**. El asistente comprobó que el repositorio se ve sin iniciar sesión.
- **Estado final:** público ✅

### 3.3 Rechazado: acceso a mi carpeta Documents
- El permiso para que el asistente entrara a mi carpeta `Documents` fue **denegado**. Así no tuvo acceso a mis otros archivos, y no hacía falta para la actividad.

> **Seguridad:** la contraseña de GitHub la escribí yo en la página oficial (github.com). Nunca la pegué en el chat.

---

## 4. Verificación del entorno

Salida de `node --version; npm --version; python --version`, ejecutado por mí en PowerShell:

| Herramienta | Versión | ¿Cumple? |
|---|---|---|
| Node.js | v22.23.5 | ✅ (pide 22.20 o superior) |
| npm | 10.9.9 | ✅ |
| Python | 3.12.10 | ✅ |

Con `Get-Command` confirmé que `scoop`, `git`, `gh`, `pwsh`, `node` y `python` están instalados desde Scoop (`C:\Users\migue\scoop\...`).
**Nota:** en Windows con Scoop el comando es `python`; `python3` puede no existir.

---

## 5. Prueba en limpio

Ejecutada por mí en PowerShell, en `C:\Users\migue\Documents`:

```powershell
git clone https://github.com/AngelF007/mini-inventario.git prueba-inventario
cd prueba-inventario
git ls-files
cat README.md
```

- **Clonación:** correcta (14 objetos).
- **`git ls-files`:** `.gitignore`, `CLAUDE.md`, `README.md`, `entregas/dia-01/README.md`.
- **`cat README.md`:** muestra los requisitos **Node.js 22 (22.20 o superior)** y **Python 3.12**.
- **Evidencia:** `captura-prueba-limpio.png` (arriba). La captura es anterior a la mejora del README (commit `ac40ab5`). Los requisitos no cambiaron.

---

## 6. Historial de commits

| Commit | Hora (CDMX) | Cambio |
|---|---|---|
| `85a823b` | 00:06 | README inicial con requisitos |
| `03f7098` | 00:06 | `.gitignore` (excluye `.env`, `.venv`, `node_modules`) |
| `44272d8` | 00:07 | `CLAUDE.md` con las reglas del proyecto |
| `2f9623b` | 00:07 | Esta bitácora (`entregas/dia-01/README.md`) |
| `ac40ab5` | 00:24 | README completo con sección **Cómo empezar** (extra) |

---

## 7. Checklist de la rúbrica

| Criterio | Evidencia | Puntos |
|---|---|---|
| Repositorio | Público; el README indica Node.js 22 y Python 3.12 | 25 |
| Prueba en limpio | Captura con `git ls-files` y `cat README.md` de una copia recién clonada | 25 |
| Instrucciones | `CLAUDE.md` con reglas de ramas, llaves y aprobación | 20 |
| Protección de secretos | `.gitignore` excluye `.env`, `.venv` y `node_modules` | 10 |
| Bitácora | Este archivo: prompts, errores de la IA, decisiones y verificación | 20 |
