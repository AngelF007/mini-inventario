# Bitácora — Día 3: Primera versión de la web

**Fecha:** 2026-11-19 · **Repositorio:** https://github.com/AngelF007/mini-inventario · **Rama:** `dia-03-web` · **Agente:** Claude

![Mini Inventario funcionando con 5 productos, 2 bajo mínimo](Captura%201.png)

---

## 1. Qué construí

**Mini Inventario para papelería**: una web donde registro cuadernos, plumas, hojas y otros productos, y veo cuáles hay que reabastecer.

| Requisito de la guía | Dónde está |
|---|---|
| Express sirve `public/`, responde `/health` y usa `process.env.PORT` o 3000 | `server.js` |
| Listar, agregar y editar productos | `public/app.js` + `public/index.html` |
| Marcar los que tienen cantidad por debajo del mínimo | Fila en rojo, etiqueta "Bajo mínimo: faltan N" y titular "N productos por reabastecer" |
| Todo el acceso a datos en un solo archivo, con localStorage | `public/productos.js` (ningún otro archivo usa `localStorage`) |
| Sin inicio de sesión | No hay login. Llega con Supabase |

**Estilo propio:** pedí que no se viera como una tabla genérica sino como un sitio web. Elegí el tema **papelería**: fondo de hoja cuadriculada, azul de pluma, rojo de margen para lo que falta y SKU como etiqueta de marcatextos. También tiene buscador, vistas "Todos / Bajo mínimo" y una barra de nivel que compara la cantidad contra el mínimo.

---

## 2. Prompts clave

1. **Construcción** (prompt de la guía): *"Lee docs/requisitos.md y docs/diseno.md. Construye la primera versión de Mini Inventario. Express sirve la carpeta public/, responde /health y usa process.env.PORT o el puerto 3000. La página lista, agrega y edita productos, y marca los que tienen una cantidad por debajo del mínimo. Todo el acceso a datos va en public/productos.js y por ahora usa localStorage, porque mañana lo cambiaremos por Supabase. No agregues inicio de sesión todavía. Explica tu plan antes de editar."*
2. **Diseño:** *"Quiero que lo hagas diferente, con estilo de sitio web"* → el agente me dio 4 opciones de negocio y elegí **papelería**.
3. **Revisión acotada** (en contexto nuevo): *"Revisa solo public/productos.js y dime si algo no cumple docs/diseno.md."*
4. **Pull request:** *"Revisa los cambios de esta rama y crea con gh un pull request con un resumen claro. Vincula los issues que resuelve usando Closes #numero. No hagas merge."*

---

## 3. Prueba a mano y problema corregido

Probé en mi computadora con `npm start` y abrí http://localhost:3000:

| Prueba | Resultado |
|---|---|
| `/health` | `{"status":"ok"}` |
| Agregar 5 productos (Cuadro chico, Goma, Hojas, Lápiz, Plumones) | Aparecen en la lista ✅ |
| Dejar productos bajo el mínimo (Cuadro chico 2/6, Goma 5/19) | Se ponen en rojo, suben al inicio y el titular dice "2 productos por reabastecer" ✅ |
| Recargar con F5 | Los 5 productos siguen ✅ |
| Guardar con todos los campos vacíos | No se guarda y muestra el error ✅ |

**Problema encontrado y corregido:** al guardar con los campos vacíos, la primera versión solo decía *"Falta el nombre."*, aunque faltaban los 4 campos. HU-2 pide indicar qué campo falta, así que se corrigió para nombrar todos. Ahora dice **"Faltan: nombre, SKU, cantidad y mínimo."**

---

## 4. Errores o malas decisiones de la IA

### 4.1 Iba a hacer merge del PR del Día 2 sin necesidad
La guía pide tener `docs/` en `main`, y el agente propuso hacer **merge del PR #6** del Día 2. Lo detuve: ese PR todavía lo tiene que revisar mi profesor. Le mostré cómo lo resolvieron mis compañeros: crear `dia-03-web` desde `main` y copiar solo `docs/requisitos.md` y `docs/diseno.md`. Así se hizo, y el PR #6 sigue abierto.

### 4.2 El SKU no cumplía el diseño
En la primera versión, `productos.js` trataba `tor-01` y `TOR-01` como el mismo SKU, pero el diseño dice `unique (user_id, sku)`, que en Postgres sí distingue mayúsculas. Lo detecté en la revisión de `productos.js` contra `docs/diseno.md`, y se cambió a comparación exacta para que mañana se comporte igual que Supabase.

---

## 5. Contexto: antes y después

El agente que usé no tiene `/context` ni `/compact` como Claude Code, así que tomé las medidas del contador de uso de la sesión.

| | Antes: conversación larga | Después: contexto nuevo |
|---|---|---|
| Qué era | La misma conversación de los Días 1, 2 y 3 | Un agente nuevo que solo leyó `productos.js` y `diseno.md` |
| Uso | 231 peticiones, **~250 mil tokens** releídos en cada petición en promedio | **75 mil tokens en total**, 2 lecturas de archivo, 28 segundos |
| Qué encontró al revisar `productos.js` | 1 problema: SKU con mayúsculas (4.2) | **3 problemas nuevos** que la conversación larga no vio |

**Qué cambió en la respuesta:** con el contexto limpio, la revisión fue más precisa:
1. `cantidad` y `minimo` aceptaban números más grandes que el `integer` de Postgres (2,147,483,647), y `Number()` aceptaba textos como `1e2` o `0x10`. **Corregido.**
2. `listarProductos` no ordenaba por nombre, como dice el diseño. **Corregido.**
3. Los límites de 100 y 50 caracteres cuentan un emoji como 2. Es más estricto que la tabla, no más laxo, así que lo dejé como está.

**Lección:** una conversación muy larga arrastra mucho contexto que no sirve para una revisión puntual. Empezar de cero con solo los archivos necesarios dio una revisión más útil y mucho más barata.

---

## 6. Comandos aprobados y rechazados

- ❌ **Rechazado:** hacer merge del PR #6 (ver 4.1). No era necesario y quitaba el PR de revisión.
- ✅ **Aprobado:** `git switch dia-03-web`, `npm install` y `npm start` en mi computadora. Leí que `npm install` solo instala Express, la única dependencia de `package.json`, y dio **0 vulnerabilidades**.

---

## 7. Issues

| Issue | Estado en este PR |
|---|---|
| #2 HU-2 Registrar un producto | **Se cierra**: validaciones, SKU único y quitar espacios |
| #4 HU-4 Ver productos bajo el mínimo | **Se cierra**: marca, filtro y contador |
| #3 HU-3 Ver mis productos | Avanza: falta "solo mis productos", que necesita inicio de sesión |
| #5 HU-5 Actualizar la cantidad | Avanza: falta "no puedo cambiar productos de otra cuenta", que necesita inicio de sesión |
| #1 HU-1 Cuenta y sesión | Fuera del Día 3 |

No cerré #3 ni #5 porque tienen criterios que dependen del login, y cerrarlos daría por terminado algo que no lo está.
