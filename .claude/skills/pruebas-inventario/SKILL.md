---
name: pruebas-inventario
description: Reglas para escribir, cambiar o revisar pruebas de Playwright de Mini Inventario (iniciar sesión, agregar, editar, borrar o marcar productos bajo el mínimo). Úsala siempre que se pida una prueba, un test o una prueba automática de Mini Inventario o de la carpeta tests/.
---

# Pruebas de Mini Inventario

Sigue estas reglas cada vez que escribas o cambies una prueba de este proyecto. Si una regla no se puede cumplir, dilo en tu respuesta en vez de saltártela.

## 1. Dónde van

- Todas las pruebas usan **Playwright Test** (`@playwright/test`) y viven en `tests/`.
- Si la prueba es de un tema que ya existe, agrégala en `tests/inventario.spec.js`, dentro del `test.describe` que corresponde ("Inicio de sesión" o "Productos"). Crea `tests/<tema>.spec.js` solo para un tema nuevo.
- Reusa las funciones de `tests/ayuda.js` (`exigirCredenciales`, `skuUnico`, `iniciarSesion`, `agregarProducto`, `filaPorSku`, `borrarPorSku`). No las copies en otro archivo. Si falta una, agrégala a `tests/ayuda.js`.
- Escribe los nombres de las pruebas y los comentarios en español, diciendo qué comprueban ("edita la cantidad y cambia el estado").

## 2. Credenciales

- El correo y la contraseña salen **solo** de `process.env.TEST_EMAIL` y `process.env.TEST_PASSWORD` (en local vienen de `.env`, en la CI de los secretos de GitHub).
- Llama a `exigirCredenciales(test)` en el `beforeEach`. Así, si faltan, la prueba se salta con un aviso en vez de fallar.
- Nunca escribas un correo, una contraseña, una llave o una URL de Supabase dentro de una prueba, y no los imprimas con `console.log`.

## 3. Datos de prueba

- Cada producto que crea una prueba usa un **SKU único**: `skuUnico('PREFIJO')`, con un prefijo corto del tema (`EDI`, `BAJ`, `AGR`…). Nunca uses un SKU fijo como `"CUA-100"`.
- Guarda cada SKU en la lista `creados` **antes** de crearlo. Si la prueba cambia el SKU, guarda también el SKU nuevo.
- Borra lo creado en `test.afterEach` con `borrarPorSku`. Así se borra **aunque la prueba falle**. No borres al final del cuerpo de la prueba.
- No toques los productos que ya tiene el usuario de prueba, y no cuentes filas totales esperando un número fijo.

## 4. Cómo seleccionar elementos

Selecciona como lo haría una persona: **por rol o por etiqueta**.

| Qué | Cómo |
|---|---|
| Botones | `getByRole('button', { name: 'Editar' })`, `'Guardar'`, `'Cancelar'`, `'Eliminar'`, `'Sí, eliminar'`, `'Agregar producto'` |
| Campos del formulario de agregar | `getByLabel('Nombre')`, `'SKU'`, `'Cantidad'`, `'Mínimo'` dentro de `#form-agregar` |
| Campos de la fila en edición | `getByRole('textbox', { name: 'Nombre' })` / `getByRole('spinbutton', { name: 'Cantidad' })` (tienen `aria-label`) |
| Fila de un producto | `filaPorSku(page, sku)` de `tests/ayuda.js` |
| Mensajes de error | `getByRole('alert')` (`#error-acceso`, `#error-agregar` y `#error-lista` tienen `role="alert"`) |

- Usa `#id` o clases solo cuando no hay rol ni etiqueta: las pantallas (`#pantalla-acceso`, `#pantalla-inventario`), `#cargando` y la clase `bajo` de la fila.
- No uses XPath, `nth()` ni posiciones como `td:nth-child(3)`.
- No uses `page.waitForTimeout`. Espera con `expect(...)`, que reintenta solo.

## 5. Qué debe cubrir

Toda prueba nueva cubre **al menos dos casos**:

1. **El caso correcto:** la acción funciona y se ve el resultado (texto, estado "Suficiente" o "Bajo mínimo: faltan N").
2. **Un caso de error:** un dato inválido o vacío muestra el mensaje exacto de la app (por ejemplo `Falta: nombre.` o `Faltan: nombre, SKU, cantidad y mínimo.`) y **no** guarda nada.

Copia los mensajes de `public/productos.js` o de `docs/requisitos.md`. No los inventes. Si el texto de la app y el de la historia de usuario no coinciden, avisa en vez de cambiar la prueba para que pase.

## 6. Cómo comprobar

1. `npx playwright test` en local (con `.env`). Todas deben pasar.
2. Provoca la falla a propósito una vez (por ejemplo, cambia el valor esperado) para ver que la prueba sí detecta el error, y regrésalo.
3. Sube la rama y abre el pull request. La CI (`.github/workflows/ci.yml`) corre las mismas pruebas y debe quedar en verde.
