# Requisitos — Mini Inventario

Mini Inventario es una web donde una persona inicia sesión, registra productos con nombre, SKU, cantidad y cantidad mínima, y ve cuáles están por debajo del mínimo.

## Decisiones tomadas

| Pregunta | Decisión |
|---|---|
| ¿Cuándo está un producto "por debajo del mínimo"? | Cuando `cantidad < minimo` (si son iguales, **no** se marca). |
| ¿El SKU puede repetirse? | No dentro de la misma cuenta. Dos personas distintas sí pueden usar el mismo SKU. |
| ¿Cómo entra la persona? | Crea su cuenta con correo y contraseña, y luego inicia sesión. |
| ¿Quién ve los productos? | Cada persona ve **solo sus propios** productos. |
| ¿En qué orden se muestran? | Primero los productos bajo mínimo, luego el resto; cada grupo por nombre A–Z. |
| ¿Qué queda fuera de esta versión? | Categorías, proveedores, precios, varios usuarios por inventario y reportes. |

---

## HU-1 · Crear cuenta e iniciar sesión

**Como** persona que lleva un inventario, **quiero** crear una cuenta e iniciar sesión con mi correo y contraseña, **para** que solo yo pueda ver y modificar mis productos.

**Criterios de aceptación**
- [ ] Con un correo válido y una contraseña de 8 caracteres o más, se crea la cuenta y entro a la página de inventario.
- [ ] Con un correo ya registrado, aparece el mensaje "Ese correo ya tiene una cuenta" y no se crea otra.
- [ ] Con una contraseña incorrecta, aparece "Correo o contraseña incorrectos" y sigo en la pantalla de inicio de sesión.
- [ ] Si abro la página de inventario sin haber iniciado sesión, me lleva a la pantalla de inicio de sesión.
- [ ] Al pulsar "Cerrar sesión" vuelvo a la pantalla de inicio de sesión, y al recargar no veo mis productos.

## HU-2 · Registrar un producto

**Como** persona con sesión iniciada, **quiero** registrar un producto con nombre, SKU, cantidad y cantidad mínima, **para** llevar el control de mis existencias.

**Criterios de aceptación**
- [ ] Con nombre, SKU, cantidad y mínimo válidos, el producto aparece en mi lista sin recargar la página.
- [ ] Si falta el nombre o el SKU, no se guarda y se indica qué campo falta.
- [ ] Si la cantidad o el mínimo son negativos o no son números enteros, no se guarda y aparece un mensaje de error.
- [ ] Si ya tengo un producto con ese SKU, no se guarda y aparece "Ya tienes un producto con ese SKU".
- [ ] Los espacios al inicio y al final del nombre y del SKU se eliminan antes de guardar.

## HU-3 · Ver mis productos

**Como** persona con sesión iniciada, **quiero** ver la lista de mis productos, **para** saber cuánto tengo de cada uno.

**Criterios de aceptación**
- [ ] La lista muestra nombre, SKU, cantidad y mínimo de cada producto.
- [ ] Solo aparecen los productos de mi cuenta: si entro con otra cuenta, no veo los míos.
- [ ] Si no tengo productos, aparece "Aún no tienes productos" en lugar de una tabla vacía.
- [ ] Los productos bajo mínimo aparecen primero; dentro de cada grupo, se ordenan por nombre de la A a la Z.

## HU-4 · Ver productos por debajo del mínimo

**Como** persona con sesión iniciada, **quiero** ver qué productos están por debajo de su cantidad mínima, **para** saber qué debo reabastecer.

**Criterios de aceptación**
- [ ] Un producto con `cantidad < minimo` aparece marcado como "Bajo mínimo" en la lista.
- [ ] Un producto con `cantidad = minimo` o `cantidad > minimo` **no** aparece marcado.
- [ ] Hay un filtro "Solo bajo mínimo" que muestra únicamente los productos marcados.
- [ ] Arriba de la lista se muestra cuántos productos están bajo mínimo (por ejemplo, "3 productos bajo mínimo").

## HU-5 · Actualizar la cantidad de un producto

**Como** persona con sesión iniciada, **quiero** cambiar la cantidad de un producto, **para** reflejar entradas y salidas de mercancía.

**Criterios de aceptación**
- [ ] Al guardar una nueva cantidad válida, la lista muestra el valor nuevo sin recargar la página.
- [ ] Si la nueva cantidad es negativa o no es un número entero, no se guarda y aparece un mensaje de error.
- [ ] Si la nueva cantidad queda por debajo del mínimo, el producto pasa a estar marcado como "Bajo mínimo"; si sube al mínimo o más, deja de estarlo.
- [ ] No puedo cambiar la cantidad de un producto de otra cuenta, aunque conozca su `id`.
