## Reporte de producción

> "Pude registrar dos productos con el mismo SKU."

## Pasos para reproducir

1. Entrar a https://mini-inventario-m9u5.onrender.com con una cuenta.
2. Agregar un producto con SKU `INC-MWWBUTUE`.
3. Agregar otro producto con el mismo SKU en minúsculas: `inc-mwwbutue`.
4. Resultado: **los dos se guardan** y la lista muestra dos productos con el mismo SKU. Se esperaba el aviso "Ya tienes un producto con ese SKU."

Reproducido el 2026-11-25 con Playwright en la URL pública (`entregas/dia-10/reproduccion-antes.png` y `reproduccion-antes.txt`).

## Causa

- **Base de datos:** la regla `unique (user_id, sku)` de `supabase/migrations/20261119000000_crear_productos.sql` compara el texto tal cual, así que `INC-MWWBUTUE` e `inc-mwwbutue` cuentan como SKUs distintos.
- **Web:** `validar()` en `public/productos.js` solo quita espacios (`trim()`). No unifica mayúsculas antes de guardar, ni al agregar ni al editar.
- **No es la causa:** RLS, Render ni el servidor Express. Los logs de Render no muestran errores porque el guardado va del navegador directo a Supabase.

Datos en producción: las dos filas existen (consultado con el MCP `inventario`, de solo lectura).

## Criterios de aceptación

- [ ] Una prueba de Playwright reproduce el caso: falla antes de corregir y pasa después.
- [ ] La web guarda el SKU en mayúsculas al agregar y al editar, y un SKU repetido con otras mayúsculas muestra "Ya tienes un producto con ese SKU."
- [ ] La base rechaza el duplicado aunque se inserte directo por la API: índice único sobre `(user_id, upper(btrim(sku)))`, aplicado con una migración.
- [ ] Antes de aplicar la migración, se revisan y resuelven con aprobación las filas que ya incumplen la regla.
- [ ] La CI queda en verde y, después del despliegue, la URL pública ya no permite el duplicado.
