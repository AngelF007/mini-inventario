# Bitácora — Día 2: Planeación, requisitos y diseño

**Fecha:** 2026-11-19 · **Repositorio:** https://github.com/AngelF007/mini-inventario · **Rama:** `dia-02-planeacion` · **Agente:** Claude

## Entregables

| Entregable | Enlace |
|---|---|
| Historias de usuario | [`docs/requisitos.md`](https://github.com/AngelF007/mini-inventario/blob/dia-02-planeacion/docs/requisitos.md) |
| Diseño técnico + diagramas Mermaid | [`docs/diseno.md`](https://github.com/AngelF007/mini-inventario/blob/dia-02-planeacion/docs/diseno.md) |
| Issues #1 a #5 | [Issues del repositorio](https://github.com/AngelF007/mini-inventario/issues) |

---

## 1. Prompts clave

1. **Historias:** *"Vamos a planear Mini Inventario, una web donde una persona inicia sesión, registra productos con nombre, SKU, cantidad y cantidad mínima, y ve cuáles están por debajo del mínimo. No escribas código. Hazme preguntas sobre lo que no esté claro y luego propone 5 historias de usuario, cada una con criterios de aceptación que se puedan comprobar."*
2. **Diseño:** *"Propón el diseño técnico de Mini Inventario y guárdalo en docs/diseno.md. Usa Node.js con Express para servir la página, HTML y JavaScript sin framework, y Supabase para base de datos e inicio de sesión. Define la tabla productos con id, user_id, nombre, sku, cantidad, minimo y created_at. Explica qué valida cada capa."*
3. **Issues:** *"Crea un issue en GitHub por cada historia de docs/requisitos.md usando gh. Pon los criterios de aceptación como lista de tareas. Muéstrame cada comando antes de ejecutarlo."*
4. **Extra:** pedí los diagramas Mermaid de la tabla y del inicio de sesión dentro de `docs/diseno.md`.

---

## 2. Planeación antes de escribir

Antes de escribir nada, el agente me hizo 4 preguntas: cuándo cuenta como "bajo mínimo", si el SKU se puede repetir, qué más se puede hacer con un producto y cómo entra la persona. No tenía clara la respuesta de varias, así que le pedí que tomara la opción más razonable y la dejara por escrito. Quedaron en la tabla **"Decisiones tomadas"** de `docs/requisitos.md`:

- **Bajo mínimo** = `cantidad < minimo` (igual al mínimo no cuenta).
- **SKU** único por cuenta.
- **Cuenta propia** con correo y contraseña.
- **Fuera de alcance:** categorías, precios, proveedores y reportes, para quedarnos solo en lo necesario para 5 historias.

---

## 3. Correcciones al plan del agente (criterio propio)

### Corrección 1 — La contraseña mínima de Supabase
- **Qué decía el borrador:** que Supabase Auth exige contraseñas de 8 caracteres.
- **Qué cambié:** Supabase pide **6** por defecto. Ahora el diseño indica que hay que cambiarlo a 8 en *Authentication → Providers → Email → Minimum password length*.
- **Por qué:** HU-1 promete 8 caracteres. Sin ese ajuste, la base aceptaría contraseñas de 6 y el criterio de aceptación no se cumpliría.

### Corrección 2 — Orden de la lista
- **Qué decía el borrador:** lista ordenada solo por nombre, de la A a la Z.
- **Qué cambié:** primero los productos **bajo mínimo**, y dentro de cada grupo, por nombre (HU-3 y diseño).
- **Por qué:** el objetivo de la app es saber qué reabastecer. Si tengo muchos productos, los urgentes no deberían quedar escondidos al final de la lista.

---

## 4. Errores de la IA

### 4.1 Afirmó algo falso sobre Supabase
Es la corrección 1: el borrador daba por hecho que Supabase pide 8 caracteres. Lo detectamos al revisar qué valida cada capa contra la configuración por defecto de Supabase, que es de 6.

### 4.2 El comando para crear los issues falló
El primer bloque de comandos que me dio el agente pasaba el texto de cada issue con `-b "..."`. Lo ejecuté en **Windows PowerShell 5.1** y gh respondió `unknown arguments ... please quote all values that have spaces` en los 5 issues: PowerShell 5.1 rompe las comillas `"` que hay dentro del texto (por ejemplo, en *"Bajo mínimo"*).
**Cómo lo detecté:** por el error en la terminal y porque `gh issue list` decía `no open issues`.
**Solución:** el agente cambió el comando para que corra en PowerShell 7 (`pwsh`) y mande el texto a gh por la entrada estándar (`-F -`), sin comillas de por medio. Funcionó a la primera.

---

## 5. Comandos aprobados y explicados

### `gh auth login --web --git-protocol https` — aprobado
Inicia sesión de GitHub CLI con mi cuenta usando el navegador: gh muestra un código de un solo uso, yo lo escribo en github.com/login/device y autorizo. Lo aprobé porque sin esa sesión gh no puede crear issues a mi nombre.

### `gh issue create` — explicado con mis palabras
```powershell
$texto | gh issue create -R AngelF007/mini-inventario -t "HU-1 · Crear cuenta e iniciar sesión" -F -
```
- `gh issue create` crea un issue nuevo en GitHub.
- `-R AngelF007/mini-inventario` dice en qué repositorio.
- `-t` es el título (la historia).
- `-F -` dice que el texto del issue llega por la entrada estándar (el `|`), es decir, la historia con sus criterios como `- [ ]`. GitHub los convierte en casillas que se pueden marcar.

El comando lo repetí 5 veces, una por historia, leyendo cada sección de `docs/requisitos.md`.

---

## 6. Cómo comprobé el resultado

| Qué revisé | Resultado |
|---|---|
| `gh issue list -R AngelF007/mini-inventario` | 5 issues abiertos: HU-1 a HU-5 |
| Tareas en cada issue | #1: 5 · #2: 5 · #3: 4 · #4: 4 · #5: 4, las mismas que los criterios de `docs/requisitos.md` |
| Acentos y comillas en los issues | Se ven bien (por ejemplo, *"Bajo mínimo"*) |
| `docs/diseno.md` | Tiene la tecnología, la tabla `productos` con sus 7 columnas, el SQL con RLS y la tabla de qué valida cada capa |
| Diagramas Mermaid | GitHub los dibuja en la vista del archivo |
| Rama y PR | Todo está en `dia-02-planeacion`, y el pull request va hacia `main` (no hay commits directos a `main`, a diferencia del Día 1) |
