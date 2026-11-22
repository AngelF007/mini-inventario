# Bitácora — Día 7: Enséñale a tu agente cómo trabaja tu proyecto

**Fecha:** 2026-11-21 · **Repositorio:** https://github.com/AngelF007/mini-inventario · **Rama:** `dia-07-skill` · **Agente:** Claude

## Qué agregué

| Archivo | Qué es |
|---|---|
| `.claude/skills/pruebas-inventario/SKILL.md` | Skill con las reglas para escribir pruebas de Mini Inventario |
| `.claude/agents/revisor-pr.md` | Subagente que revisa `git diff main` sin modificar nada |
| `tests/inventario.spec.js` | La prueba de editar producto que salió con la skill, con el hallazgo del revisor ya atendido |

---

## 1. El pedido sin skill

En la rama `dia-07-skill` abrí una conversación limpia: un agente nuevo, sin el historial de esta conversación y sin la carpeta `.claude/`. Le pedí exactamente:

> Escribe una prueba de Playwright para editar un producto

El agente creó el archivo nuevo `tests/editar-producto.spec.js`, con 3 pruebas y 106 líneas. Guardé el código aquí abajo y **descarté el archivo**; no está en el PR.

<details>
<summary>Código que salió sin skill (<code>tests/editar-producto.spec.js</code>, descartado)</summary>

```js
// Pruebas de edición de productos en Mini Inventario.
const { test, expect } = require('@playwright/test');
const {
  exigirCredenciales, skuUnico, iniciarSesion, agregarProducto, filaPorSku, borrarPorSku,
} = require('./ayuda');

test.describe('Editar producto', () => {
  // SKUs que pueden existir al final de cada prueba; se borran aunque la prueba falle.
  let creados = [];

  test.beforeEach(async ({ page }) => {
    exigirCredenciales(test);
    creados = [];
    await iniciarSesion(page);
    await expect(page.locator('#pantalla-inventario')).toBeVisible();
    await expect(page.locator('#cargando')).toBeHidden();
  });

  test.afterEach(async ({ page }) => {
    for (const sku of creados) await borrarPorSku(page, sku);
  });

  function filaEnEdicion(page) {
    return page.locator('#cuerpo tr.editando');
  }

  test('edita nombre, SKU, cantidad y mínimo, y el cambio se conserva al recargar', async ({ page }) => {
    const skuOriginal = skuUnico('EDT');
    const skuNuevo = skuUnico('EDN');
    creados.push(skuOriginal, skuNuevo);
    await agregarProducto(page, { nombre: 'Prueba carpeta', sku: skuOriginal, cantidad: 3, minimo: 5 });
    await expect(filaPorSku(page, skuOriginal)).toContainText('Bajo mínimo: faltan 2');

    await filaPorSku(page, skuOriginal).getByRole('button', { name: 'Editar' }).click();
    const edicion = filaEnEdicion(page);
    await expect(edicion).toHaveCount(1);

    // La fila de edición arranca con los valores actuales.
    await expect(edicion.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Prueba carpeta');
    await expect(edicion.getByRole('textbox', { name: 'SKU' })).toHaveValue(skuOriginal);
    await expect(edicion.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue('3');
    await expect(edicion.getByRole('spinbutton', { name: 'Mínimo' })).toHaveValue('5');

    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('Prueba carpeta editada');
    await edicion.getByRole('textbox', { name: 'SKU' }).fill(skuNuevo);
    await edicion.getByRole('spinbutton', { name: 'Cantidad' }).fill('12');
    await edicion.getByRole('spinbutton', { name: 'Mínimo' }).fill('4');
    await edicion.getByRole('button', { name: 'Guardar' }).click();

    // Sale del modo edición y muestra los datos nuevos.
    await expect(filaEnEdicion(page)).toHaveCount(0);
    await expect(page.locator('#error-lista')).toBeHidden();
    await expect(filaPorSku(page, skuOriginal)).toHaveCount(0);
    const fila = filaPorSku(page, skuNuevo);
    await expect(fila).toHaveCount(1);
    await expect(fila.locator('.producto')).toHaveText('Prueba carpeta editada');
    await expect(fila.locator('td.num').first()).toHaveText('12');
    await expect(fila.locator('td.minimo')).toHaveText('4');
    await expect(fila).not.toHaveClass(/\bbajo\b/);
    await expect(fila).toContainText('Suficiente');

    // El cambio quedó guardado en la base, no solo en pantalla.
    await page.reload();
    await expect(page.locator('#pantalla-inventario')).toBeVisible();
    await expect(page.locator('#cargando')).toBeHidden();
    await expect(filaPorSku(page, skuNuevo).locator('.producto')).toHaveText('Prueba carpeta editada');
    await expect(filaPorSku(page, skuOriginal)).toHaveCount(0);
  });

  test('cancelar la edición no cambia el producto', async ({ page }) => {
    const sku = skuUnico('CAN');
    creados.push(sku);
    await agregarProducto(page, { nombre: 'Prueba regla', sku, cantidad: 8, minimo: 2 });

    await filaPorSku(page, sku).getByRole('button', { name: 'Editar' }).click();
    const edicion = filaEnEdicion(page);
    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('No debería guardarse');
    await edicion.getByRole('spinbutton', { name: 'Cantidad' }).fill('0');
    await edicion.getByRole('button', { name: 'Cancelar' }).click();

    await expect(filaEnEdicion(page)).toHaveCount(0);
    const fila = filaPorSku(page, sku);
    await expect(fila.locator('.producto')).toHaveText('Prueba regla');
    await expect(fila.locator('td.num').first()).toHaveText('8');
    await expect(fila).toContainText('Suficiente');
  });

  test('no guarda la edición con un campo vacío', async ({ page }) => {
    const sku = skuUnico('VAC');
    creados.push(sku);
    await agregarProducto(page, { nombre: 'Prueba goma', sku, cantidad: 6, minimo: 3 });

    await filaPorSku(page, sku).getByRole('button', { name: 'Editar' }).click();
    const edicion = filaEnEdicion(page);
    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('');
    await edicion.getByRole('button', { name: 'Guardar' }).click();

    // Muestra el error y se queda en modo edición.
    await expect(page.locator('#error-lista')).toHaveText('Falta: nombre.');
    await expect(filaEnEdicion(page)).toHaveCount(1);

    // Al cancelar, el producto sigue con su nombre original.
    await edicion.getByRole('button', { name: 'Cancelar' }).click();
    await expect(filaPorSku(page, sku).locator('.producto')).toHaveText('Prueba goma');
  });
});
```

</details>

## 2. La skill `pruebas-inventario`

El agente la creó con este prompt de la guía:

> Crea una skill llamada pruebas-inventario en la ruta correcta para este agente. Debe indicar: usar Playwright en tests/, leer credenciales del entorno, usar un SKU único por prueba, borrar lo creado, seleccionar elementos por rol o etiqueta, y cubrir el caso correcto y un caso de error. La descripción debe activarse cuando se pidan pruebas de Mini Inventario.

Está en `.claude/skills/pruebas-inventario/SKILL.md`, la ruta de Claude Code, y tiene `name` y `description` en el encabezado. La revisé y le pedí que las reglas fueran concretas para **este** proyecto, no genéricas:

| Regla | Qué dice en concreto |
|---|---|
| Dónde van | En `tests/`. Si el tema ya existe, se agregan a `tests/inventario.spec.js`. Se reusan las funciones de `tests/ayuda.js`. |
| Credenciales | Solo `process.env.TEST_EMAIL` y `TEST_PASSWORD`, con `exigirCredenciales(test)`. Nada escrito a mano ni en `console.log`. |
| SKU único | `skuUnico('PREFIJO')`. El SKU se guarda en `creados` **antes** de crear el producto; si la prueba lo cambia, también se guarda el nuevo. |
| Borrar lo creado | En `afterEach` con `borrarPorSku`, para que se borre aunque la prueba falle. |
| Selectores | Una tabla con el rol o la etiqueta de cada botón, campo y mensaje de la app (`getByRole('alert')` para errores). `#id` solo para las pantallas y `#cargando`. Nada de XPath, `nth()` ni `waitForTimeout`. |
| Qué cubrir | El caso correcto **y** un caso de error con el mensaje exacto copiado de `public/productos.js`. |
| Cómo comprobar | `npx playwright test`, provocar la falla una vez para ver que se detecta, y la CI en verde. |

**Descripción** (lo que hace que se active): *"Reglas para escribir, cambiar o revisar pruebas de Playwright de Mini Inventario (iniciar sesión, agregar, editar, borrar o marcar productos bajo el mínimo). Úsala siempre que se pida una prueba, un test o una prueba automática de Mini Inventario o de la carpeta tests/."* Incluí "editar" y "prueba" para que coincida con palabras del pedido.

## 3. El mismo pedido con la skill

Abrí otra conversación limpia, ahora con la skill en el proyecto, y pedí exactamente lo mismo. El agente leyó la skill antes de escribir y esta vez **no creó un archivo nuevo**: cambió la prueba de editar que ya existía en `tests/inventario.spec.js`.

<details>
<summary>Cambio que salió con la skill (antes de atender el hallazgo del revisor)</summary>

```diff
--- a/tests/inventario.spec.js
+++ b/tests/inventario.spec.js
@@ -66,16 +66,52 @@ test.describe('Productos', () => {
     await expect(filaIgual).toContainText('Suficiente');
   });
 
-  test('edita la cantidad y cambia el estado', async ({ page }) => {
+  // Fila que está en modo edición: es la única que tiene el botón "Guardar".
+  function filaEnEdicion(page) {
+    return page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Guardar' }) });
+  }
+
+  test('edita el nombre y la cantidad y cambia el estado', async ({ page }) => {
     const sku = skuUnico('EDI');
     creados.push(sku);
     await agregarProducto(page, { nombre: 'Prueba hojas', sku, cantidad: 10, minimo: 5 });
+    await expect(filaPorSku(page, sku)).toContainText('Suficiente');
+
+    await filaPorSku(page, sku).getByRole('button', { name: 'Editar' }).click();
+    const edicion = filaEnEdicion(page);
+    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('Prueba hojas editada');
+    await edicion.getByRole('spinbutton', { name: 'Cantidad' }).fill('1');
+    await edicion.getByRole('button', { name: 'Guardar' }).click();
+
+    // Sale del modo edición y la fila muestra los datos nuevos.
+    await expect(filaEnEdicion(page)).toHaveCount(0);
     const fila = filaPorSku(page, sku);
-    await fila.getByRole('button', { name: 'Editar' }).click();
-    const edicion = page.locator('#cuerpo tr.editando');
-    await edicion.locator('[name=cantidad]').fill('1');
+    await expect(fila).toContainText('Prueba hojas editada');
+    await expect(fila).toHaveClass(/\bbajo\b/);
+    await expect(fila).toContainText('Bajo mínimo: faltan 4');
+  });
+
+  test('no guarda la edición con el nombre vacío', async ({ page }) => {
+    const sku = skuUnico('EDI');
+    creados.push(sku);
+    await agregarProducto(page, { nombre: 'Prueba carpeta', sku, cantidad: 10, minimo: 5 });
+
+    await filaPorSku(page, sku).getByRole('button', { name: 'Editar' }).click();
+    const edicion = filaEnEdicion(page);
+    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('');
+    await edicion.getByRole('spinbutton', { name: 'Cantidad' }).fill('1');
     await edicion.getByRole('button', { name: 'Guardar' }).click();
-    await expect(filaPorSku(page, sku)).toContainText('Bajo mínimo: faltan 4');
+
+    // Mensaje exacto de validar() en public/productos.js; sigue en edición.
+    await expect(page.getByRole('alert')).toHaveText('Falta: nombre.');
+    await expect(edicion).toHaveCount(1);
+
+    // Al cancelar, la fila conserva los datos originales: no se guardó nada.
+    await edicion.getByRole('button', { name: 'Cancelar' }).click();
+    const fila = filaPorSku(page, sku);
+    await expect(fila).toContainText('Prueba carpeta');
+    await expect(fila).toContainText('Suficiente');
+    await expect(fila).not.toHaveClass(/\bbajo\b/);
   });
 
   test('no guarda con campos vacíos', async ({ page }) => {
```

</details>

## 4. Comparación

| Punto | Sin skill | Con skill |
|---|---|---|
| Dónde quedó | Archivo nuevo `tests/editar-producto.spec.js`, que repite la prueba de editar que ya existía en `inventario.spec.js` | Dentro de `tests/inventario.spec.js`, en el bloque "Productos". Reemplaza la prueba vieja de editar, sin duplicar nada |
| Selectores | Mezcla roles con CSS e ids: `#cuerpo tr.editando`, `#error-lista`, `.producto`, `td.num` con `.first()`, `td.minimo` | Todo por rol: la fila en edición es `getByRole('row')` con el botón "Guardar", los campos son `textbox` / `spinbutton` por su etiqueta y el error es `getByRole('alert')` |
| Credenciales, SKU y borrado | Bien: reusó `tests/ayuda.js` (`exigirCredenciales`, `skuUnico`, `afterEach`) | Igual de bien, y además guarda el SKU en `creados` antes de crear el producto, como pide la regla |
| Caso correcto | Sí: edita los 4 campos y recarga para comprobar que se guardó | Sí: edita nombre y cantidad, y comprueba el nombre, la clase `bajo` y "Bajo mínimo: faltan 4" |
| Caso de error | Sí: nombre vacío y "Falta: nombre." | Sí: el mismo mensaje exacto, sacado de `public/productos.js` |
| Extras | Prueba de "Cancelar" y comprobación con recarga | No las tiene: se perdió la recarga |
| Tamaño | 3 pruebas, 106 líneas en un archivo aparte | 2 pruebas, +41 / −5 líneas en el archivo existente |

**Qué mejoró:** la prueba quedó donde tenía que ir y con selectores por rol y etiqueta, que son los que usaría una persona y no se rompen si cambio una clase de CSS. Sin la skill habría tenido que mover la prueba de archivo, borrar la duplicada y cambiar 5 selectores.

**Qué sigue mal:** la versión con skill solo revisaba la pantalla después de cancelar, no la base. La versión sin skill sí recargaba la página. El revisor lo encontró (hallazgo 2, abajo).

**Cuánto tuve que corregir:** con la skill, nada para que siguiera las reglas. Solo agregué la recarga que pidió el revisor (4 líneas). Algo que noté es que, sin skill, el resultado no salió mal, porque el agente copió el estilo de `tests/ayuda.js`. La skill no inventó la calidad, pero hizo que la prueba siguiera **todas** las reglas y no solo las que el agente adivinó.

---

## 5. Subagente `revisor-pr`

El agente lo creó con el prompt de la guía:

> Crea un subagente llamado revisor-pr en el formato correcto para este agente. Su trabajo es revisar git diff main en busca de secretos, cambios sin pruebas y consultas sin protección por usuario. Debe responder con una lista de hallazgos, archivo y gravedad. No debe modificar archivos ni ejecutar comandos que cambien el proyecto.

Está en `.claude/agents/revisor-pr.md`, con `name`, `description` y `tools` en el encabezado:
- **Herramientas:** `tools: Read, Grep, Glob, Bash`, sin `Write` ni `Edit`.
- **Bash:** solo comandos de lectura, con una lista de los permitidos (`git diff`, `git log`, `git status`…) y otra de los prohibidos (`git add`, `commit`, `checkout`, `reset`, `push`, `npm install`, `npx playwright test`, `sed -i`, `rm`…).
- **`.env`:** no lo abre, y si encuentra un secreto solo muestra los primeros 6 caracteres.
- **Qué revisa:** secretos, cambios sin pruebas (incluye si las pruebas siguen la skill) y consultas o políticas de Supabase sin `(select auth.uid()) = user_id`.
- **Cómo responde:** una tabla con `#`, gravedad, archivo y línea, hallazgo y recomendación, y al final cierra con la lista de los comandos que usó.

### Ejecución sobre esta rama

Hice commit de todo y le pedí: "Usa el subagente revisor-pr". Esto encontró:

| # | Gravedad | Archivo:línea | Hallazgo |
|---|---|---|---|
| 1 | Baja | `tests/inventario.spec.js:107` | `page.getByRole('alert')` no está acotado: si dos mensajes de error estuvieran visibles a la vez, Playwright fallaría en modo estricto |
| 2 | Baja | `tests/inventario.spec.js:110-115` | Después de "Cancelar", la prueba solo revisa la pantalla; `salirDeEdicion()` no vuelve a pedir los datos a Supabase, así que no comprueba la base |

- Secretos: sin hallazgos.
- Cambios sin pruebas: sin hallazgos.
- Consultas sin protección por usuario: sin hallazgos (no hay consultas ni migraciones nuevas).

`git status` después de correrlo:

```
On branch dia-07-skill
nothing to commit, working tree clean
```

Además comparé la huella (md5) de todos los archivos del proyecto antes y después de correr el revisor: **son iguales, no cambió ningún archivo**.

### Qué hice con los hallazgos

- **Hallazgo 2, atendido:** después de "Cancelar", la prueba ahora recarga la página, espera a que termine de cargar y vuelve a revisar el nombre y el estado. Así comprueba que **la base** no cambió, no solo la pantalla. Es el commit "Atiende hallazgo del revisor…".
- **Hallazgo 1, no aplica por ahora:** Playwright ignora los elementos con `hidden` al buscar por rol. En la pantalla de inventario, `#error-acceso` está en la pantalla de acceso, que está oculta. `#error-agregar` solo aparece si falla el formulario de agregar, y esta prueba no lo usa. Si en algún momento pudieran verse dos errores a la vez, Playwright fallaría en modo estricto y lo avisaría; no daría un falso verde.

---

## 6. Un error de la IA

Al correr el revisor, el propio revisor reportó que, para leer archivos, usó `cat`, `grep` y `sed -n`, que **no estaban** en su lista de comandos permitidos. Solo estaban los `git` de lectura. Son comandos de solo lectura y no cambiaron nada (lo comprobé con `git status` y con las huellas md5), pero rompió su propia regla. Lo detecté porque la última línea de su respuesta debe listar los comandos que usó. Lo corregí agregando a la lista `cat`, `grep`, `ls`, `head`, `tail` y `sed -n`, aclarando que `sed -i` sigue prohibido.

## 7. Comandos aprobados y rechazados

- **Aprobado:** que el revisor usara `git diff main` y `git status`, porque solo leen.
- **Rechazado:** darle al revisor las herramientas `Write` y `Edit`, o comandos como `npx playwright test`. Un revisor que puede cambiar archivos o correr pruebas contra Supabase deja de ser de solo lectura. Las pruebas las corre la CI.
- **Rechazado:** quedarme con el archivo `tests/editar-producto.spec.js` que salió sin skill. Duplicaba una prueba que ya existía, así que lo descarté como pide la guía.

## 8. Cómo comprobé que funciona

- **La skill se activa:** en la segunda conversación limpia, el agente dijo que leyó `pruebas-inventario` antes de escribir, y el resultado cumple sus reglas: está en `inventario.spec.js`, usa selectores por rol y tiene el caso de error con el mensaje exacto.
- **El revisor no modifica:** `git status` quedó limpio y las huellas md5 de todos los archivos son iguales antes y después.
- **Las pruebas pasan:** la CI del pull request corre `npx playwright test` con las pruebas nuevas (la de editar y la de error con recarga) contra Supabase. Debe quedar en verde.
