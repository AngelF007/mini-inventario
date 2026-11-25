# Bitácora — Día 9: Publica tu app y diagnostica un despliegue fallido

**Fecha:** 2026-11-24 · **Repositorio:** https://github.com/AngelF007/mini-inventario · **Agente:** Claude (y Claude Code en mi compu para el MCP de Render)

## URL pública

**https://mini-inventario-m9u5.onrender.com** (Render, plan Free, Docker). La primera visita puede tardar cerca de un minuto porque el servicio gratuito se duerme cuando nadie lo usa.

| Archivo | Qué es |
|---|---|
| `Dockerfile` | Imagen de la app: Node 22 Alpine, solo dependencias de producción, usuario sin privilegios |
| `.dockerignore` | Deja fuera `.env`, `node_modules`, `tests`, `entregas` y todo lo que la app no necesita |
| `server.js` | Ahora escucha en `0.0.0.0` y en `process.env.PORT` |
| `entregas/dia-09/probar-docker.ps1` + `docker-local.txt` | Prueba local del contenedor y su salida |
| `entregas/dia-09/render-mcp.ps1` | Registra el MCP de Render en Claude Code pidiendo la API key sin mostrarla |
| `entregas/dia-09/1-diagnostico-render.md` | Lo que hizo el agente con el MCP para diagnosticar la falla |
| `entregas/dia-09/2-verificacion.md` | Lo que hizo el agente para comprobar el despliegue reparado |

---

## 1. Contenedor en local

Prompt que usé (el de la guía):

> Crea un Dockerfile para Mini Inventario y un .dockerignore que excluya .env, node_modules, tests y entregas. La app debe escuchar en 0.0.0.0 y en process.env.PORT. No copies secretos a la imagen. Explícame cada instrucción.

**Qué hace cada instrucción del `Dockerfile`:**

| Instrucción | Para qué |
|---|---|
| `FROM node:22-alpine` | Imagen oficial de Node 22, pequeña. Es la versión que pide `package.json` |
| `WORKDIR /app` | Carpeta de trabajo dentro del contenedor |
| `ENV NODE_ENV=production` | Express y npm trabajan en modo producción |
| `COPY package.json package-lock.json ./` | Primero solo los manifiestos, para que Docker reuse la capa de dependencias si no cambian |
| `RUN npm ci --omit=dev && npm cache clean --force` | Instala exactamente lo del lock, sin Playwright ni otras dependencias de desarrollo |
| `COPY server.js ./` y `COPY public ./public` | Copia **solo** el código que la app usa: nada de `.env`, pruebas ni entregas |
| `USER node` | No corre como root |
| `ENV PORT=10000` / `EXPOSE 10000` | Puerto por defecto de Render. `server.js` lee `PORT`, así que en local uso 3000 |
| `CMD ["node", "server.js"]` | Arranca el servidor |

En `server.js` cambié `app.listen(PORT, ...)` por `app.listen(PORT, '0.0.0.0', ...)`. Dentro de un contenedor la app tiene que escuchar en todas las interfaces; si no, nadie de afuera la alcanza.

**Prueba** con `probar-docker.ps1` (salida completa en [`docker-local.txt`](docker-local.txt)):

```
> docker build -t mini-inventario .
  #12 naming to docker.io/library/mini-inventario:latest done
> La imagen no trae secretos ni archivos de mas:
  node_modules  package-lock.json  package.json  public  server.js
  SIN_.env_DENTRO_DE_LA_IMAGEN
> docker run --env-file .env -e PORT=3000 -p 3000:3000 mini-inventario
> GET http://localhost:3000/health   ->  {"status":"ok"}
> docker logs  ->  Mini Inventario escuchando en 0.0.0.0:3000
Inicio de sesion en http://localhost:3000 desde el contenedor: OK
```

Para `docker run`, el script arma un archivo de variables temporal con **solo** `SUPABASE_URL` y `SUPABASE_KEY`, en lugar de pasarle todo mi `.env` con la contraseña de prueba, y lo borra al terminar.

![La app corriendo desde el contenedor en localhost:3000](01-docker-local.png)

El PR [#13](https://github.com/AngelF007/mini-inventario/pull/13) pasó la CI y le hice merge.

## 2. Servicio en Render

Lo creé en el panel de Render: **New → Web Service**, con mi repositorio, y estos datos:
- **Language:** Docker
- **Branch:** `main`
- **Plan:** **Free**. Por defecto venía seleccionado el de $7 al mes y lo cambié.
- **Variables:** `SUPABASE_URL` y `SUPABASE_KEY` (la llave publicable), escritas **en el panel**, no en el código.
- **Health Check Path:** `/health`
- **Auto-Deploy:** On Commit

El primer despliegue terminó en 23.7 s con estado **Live**. Entré en la URL pública e inicié sesión:

![Sesión iniciada en la URL pública](02-render-publico.png)

## 3. MCP de Render

Creé una API key en Render con permisos **Read only**: puede ver servicios, despliegues y logs, pero **no** variables de entorno ni hacer cambios. La registré con `render-mcp.ps1`, que la pide sin mostrarla y la guarda solo en la configuración local de Claude Code:

```
claude mcp add --transport http render https://mcp.render.com/mcp --header "Authorization: Bearer ****"
render: https://mcp.render.com/mcp (HTTP) - ✓ Connected
```

## 4. Falla provocada y diagnóstico

Agregué a `main` la línea `RUN npm run no-existe` en el `Dockerfile` (commit `b92e82a`). Render hizo el auto-deploy y falló en 10 s. **La versión anterior siguió en línea**, porque Render no reemplaza el despliegue si la construcción falla.

![Despliegue fallido en Render](03-render-deploy-fallido.png)

Prompt (el de la guía), corrido con `claude -p` y permiso **solo** para las herramientas de lectura del MCP de Render:

> Usa el MCP de Render para listar el último despliegue de mi servicio y leer sus logs. Explícame la causa exacta de la falla y qué línea la provocó. No cambies variables ni lances despliegues sin preguntarme.

El agente usó `list_workspaces` → `list_services` → `list_deploys` → `list_logs` (detalle en [`1-diagnostico-render.md`](1-diagnostico-render.md)) y respondió:
- **Despliegue:** `dep-dc351649v7es73fl1uf0`, estado `build_failed`, commit `b92e82a`.
- **Línea responsable:** la **17 del `Dockerfile`**:
  ```
  16 |     RUN npm ci --omit=dev && npm cache clean --force
  17 | >>> RUN npm run no-existe
  npm error Missing script: "no-existe"
  ERROR: process "/bin/sh -c npm run no-existe" did not complete successfully: exit code: 1
  ```
- **Causa:** `npm run no-existe` llama a un script que no está en `"scripts"` de `package.json`. npm sale con código 1 y Docker corta la construcción. No era un problema de variables, de la imagen base ni del código.
- **Impacto:** seguía sirviendo el despliegue anterior en la URL pública.

## 5. Reparación y verificación

Quité la línea de `main` (commit `f0eee0a`, el `Dockerfile` quedó idéntico al original). Render volvió a desplegar solo y quedó **Live** en 20.4 s.

![Despliegue reparado en Render](04-render-reparado.png)

Luego le pedí al agente que lo comprobara ([`2-verificacion.md`](2-verificacion.md)):
- **MCP de Render:** el último despliegue, `dep-dc352qu0tbcc73csge90` (commit `f0eee0a`), está `live`, y el anterior quedó en `build_failed`.
- **https://mini-inventario-m9u5.onrender.com:** respondió **HTTP 200** con la pantalla "Entra a tu inventario", con los campos Correo y Contraseña.
- **/health:** respondió **HTTP 200** con `{"status":"ok"}`.

---

## 6. Errores y malas decisiones de la IA

1. **El script que resume las respuestas tronó.** En la primera verificación, `resumir.py` falló con `AttributeError: 'str' object has no attribute 'get'`. Claude Code mandó un evento cuyo `message` era texto y no un objeto, y el script no lo esperaba. Lo vi en la terminal, porque no se generó `2-verificacion.md` y git dijo "did not match any files". Se corrigió el script para ignorar esos eventos y se repitió la verificación.
2. **El agente eligió el workspace sin preguntar.** El MCP de Render le respondió que preguntara qué workspace usar y que **no** escogiera uno solo (*"ask the user which workspace to use — do NOT pick one yourself"*). Aun así, el agente usó el único workspace que había. Lo justificó porque eran consultas de solo lectura y solo existía uno, y lo dijo al final de su respuesta. Esta vez no hubo riesgo, porque la llave es de solo lectura, pero es justo el tipo de decisión que en una cuenta con varios workspaces podría tocar el lugar equivocado.

## 7. Comandos y herramientas aprobados o rechazados

- ✅ **API key de Render en "Read only".** Así el MCP no puede cambiar variables ni lanzar despliegues aunque se lo pidan; lo que pide la guía queda garantizado por la llave, no solo por el prompt.
- ✅ Solo herramientas de lectura en `--allowedTools`: `list_services`, `list_deploys`, `get_deploy`, `list_logs`, etc.
- ❌ **Rechacé la oferta del agente** de "preparar la rama y el PR" para arreglar el Dockerfile. La guía pide quitar la línea en `main`, y no quería que el agente creara cambios por su cuenta.
- ❌ Cambiar variables desde el MCP: las puse a mano en el panel de Render.
- ❌ El plan de **$7 al mes** que Render seleccionaba por defecto: lo cambié a **Free**.

## 8. Cómo comprobé que funciona

- **Contenedor:** `docker run` respondió `/health` con `{"status":"ok"}`, inicié sesión en `localhost:3000` y la imagen **no** trae `.env`.
- **Publicación:** inicié sesión en https://mini-inventario-m9u5.onrender.com con mi cuenta y se ven mis productos.
- **Secretos:** `.dockerignore` excluye `.env`, el `Dockerfile` copia solo `server.js` y `public/`, y las llaves están en el panel de Render.
- **Diagnóstico:** el agente encontró la línea exacta con el MCP de Render, sin permisos de escritura.
- **Reparación:** el despliegue `f0eee0a` está Live y la URL y `/health` responden HTTP 200.
