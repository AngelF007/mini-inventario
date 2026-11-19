# 📦 Mini Inventario

Mini Inventario es una aplicación web sencilla para llevar el control de productos: dar de alta artículos, consultar existencias y actualizar cantidades. El proyecto se construye paso a paso durante un curso de 10 días, trabajando junto con un agente de IA (Claude Code o Codex).

- **Web:** Node.js 22
- **Servidor MCP:** Python 3.12
- **Control de versiones:** Git + GitHub

🔗 **Ver el proyecto y sus archivos:** [github.com/AngelF007/mini-inventario](https://github.com/AngelF007/mini-inventario)

---

## ✅ Requisitos

| Herramienta | Versión | Para qué se usa |
|---|---|---|
| [Node.js](https://nodejs.org/es) | **22** (22.20 o superior) | Ejecutar la web e instalar skills |
| [Python](https://www.python.org/) | **3.12** | Ejecutar el servidor MCP |
| [Git](https://git-scm.com/) | Cualquier versión reciente | Guardar versiones del código |
| [GitHub CLI (`gh`)](https://cli.github.com/) | Cualquier versión reciente | Trabajar con GitHub desde la terminal |

> En Windows, todos los comandos se ejecutan en **PowerShell 7** (`pwsh`) y los programas se instalan con **[Scoop](https://scoop.sh/)**.

---

## 🛠️ Instalación

### Windows (PowerShell 7 + Scoop)

```powershell
# 1. Instalar Scoop (en PowerShell, sin permisos de administrador)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. Instalar herramientas
scoop install git gh pwsh
scoop bucket add versions
scoop install nodejs22 python312
```

### macOS o Linux

Instala Git, `gh`, Node.js 22 y Python 3.12 siguiendo las guías oficiales de cada herramienta (enlaces en la tabla de requisitos).

---

## 🚀 Cómo empezar

```bash
# Clonar el proyecto
git clone https://github.com/AngelF007/mini-inventario.git
cd mini-inventario

# Comprobar versiones
node --version     # debe mostrar v22.20 o superior
npm --version
python --version   # debe mostrar 3.12.x  (en macOS/Linux: python3 --version)
```

Si la terminal no reconoce `node` o `python` después de instalarlos, ciérrala y ábrela de nuevo.

---

## 📁 Estructura del proyecto

```
mini-inventario/
├── .gitignore
├── CLAUDE.md
├── README.md
└── entregas/
    └── dia-01/
        └── README.md
```

Haz clic en cualquier archivo para abrirlo:

| Archivo | Para qué sirve |
|---|---|
| [`.gitignore`](https://github.com/AngelF007/mini-inventario/blob/main/.gitignore) | Archivos que no se suben (secretos y dependencias) |
| [`CLAUDE.md`](https://github.com/AngelF007/mini-inventario/blob/main/CLAUDE.md) | Reglas que sigue el agente de IA en cada sesión |
| [`README.md`](https://github.com/AngelF007/mini-inventario/blob/main/README.md) | Este archivo |
| [`entregas/dia-01/`](https://github.com/AngelF007/mini-inventario/tree/main/entregas/dia-01) | Carpeta de entrega del Día 1 |
| [`entregas/dia-01/README.md`](https://github.com/AngelF007/mini-inventario/blob/main/entregas/dia-01/README.md) | Bitácora y evidencia del Día 1 |

---

## 📏 Reglas de trabajo

1. Cada cambio va en una **rama nueva** y se integra con **pull request**; no se hace commit directo en `main`.
2. **Nunca** se suben llaves, tokens ni archivos `.env` (están excluidos en `.gitignore`).
3. El agente debe **pedir aprobación** antes de borrar datos o desplegar.

Las reglas completas para el agente están en [`CLAUDE.md`](https://github.com/AngelF007/mini-inventario/blob/main/CLAUDE.md).

---

## 📅 Avance del curso

| Día | Tema | Estado |
|---|---|---|
| 1 | Repositorio y entorno de trabajo · [ver entrega](https://github.com/AngelF007/mini-inventario/tree/main/entregas/dia-01) | ✅ Terminado |
| 2–10 | Próximamente | ⏳ |

---

## 👤 Autor

**AngelF007** · [github.com/AngelF007](https://github.com/AngelF007)
