// Pruebas permanentes de Mini Inventario (Día 5).
const { test, expect } = require('@playwright/test');
const {
  EMAIL, exigirCredenciales, skuUnico, iniciarSesion, agregarProducto, filaPorSku, borrarPorSku,
} = require('./ayuda');

test.describe('Inicio de sesión', () => {
  test.beforeEach(() => exigirCredenciales(test));

  test('inicia sesión con el usuario de prueba', async ({ page }) => {
    await iniciarSesion(page);
    await expect(page.locator('#pantalla-inventario')).toBeVisible();
    await expect(page.locator('#usuario-correo')).toHaveText(EMAIL);
    await expect(page.locator('#pantalla-acceso')).toBeHidden();
  });

  test('rechaza una contraseña incorrecta', async ({ page }) => {
    await iniciarSesion(page, EMAIL, 'contrasena-incorrecta-123');
    await expect(page.locator('#error-acceso')).toHaveText('Correo o contraseña incorrectos.');
    await expect(page.locator('#pantalla-acceso')).toBeVisible();
    await expect(page.locator('#pantalla-inventario')).toBeHidden();
  });
});

test.describe('Productos', () => {
  // SKUs creados por cada prueba; se borran al final aunque la prueba falle.
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

  test('agrega un producto', async ({ page }) => {
    const sku = skuUnico('AGR');
    creados.push(sku);
    await agregarProducto(page, { nombre: 'Prueba cuaderno', sku, cantidad: 20, minimo: 5 });
    const fila = filaPorSku(page, sku);
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText('Prueba cuaderno');
    await expect(fila).toContainText('Suficiente');
  });

  test('marca un producto bajo el mínimo', async ({ page }) => {
    const bajo = skuUnico('BAJ');
    const igual = skuUnico('IGU');
    creados.push(bajo, igual);
    await agregarProducto(page, { nombre: 'Prueba pluma', sku: bajo, cantidad: 2, minimo: 5 });
    await agregarProducto(page, { nombre: 'Prueba lápiz', sku: igual, cantidad: 5, minimo: 5 });

    // cantidad < mínimo → marcado
    const filaBajo = filaPorSku(page, bajo);
    await expect(filaBajo).toHaveClass(/\bbajo\b/);
    await expect(filaBajo).toContainText('Bajo mínimo: faltan 3');

    // cantidad = mínimo → NO marcado (docs/requisitos.md, HU-4)
    const filaIgual = filaPorSku(page, igual);
    await expect(filaIgual).not.toHaveClass(/\bbajo\b/);
    await expect(filaIgual).toContainText('Suficiente');
  });

  // Fila que está en modo edición: es la única que tiene el botón "Guardar".
  function filaEnEdicion(page) {
    return page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Guardar' }) });
  }

  test('edita el nombre y la cantidad y cambia el estado', async ({ page }) => {
    const sku = skuUnico('EDI');
    creados.push(sku);
    await agregarProducto(page, { nombre: 'Prueba hojas', sku, cantidad: 10, minimo: 5 });
    await expect(filaPorSku(page, sku)).toContainText('Suficiente');

    await filaPorSku(page, sku).getByRole('button', { name: 'Editar' }).click();
    const edicion = filaEnEdicion(page);
    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('Prueba hojas editada');
    await edicion.getByRole('spinbutton', { name: 'Cantidad' }).fill('1');
    await edicion.getByRole('button', { name: 'Guardar' }).click();

    // Sale del modo edición y la fila muestra los datos nuevos.
    await expect(filaEnEdicion(page)).toHaveCount(0);
    const fila = filaPorSku(page, sku);
    await expect(fila).toContainText('Prueba hojas editada');
    await expect(fila).toHaveClass(/\bbajo\b/);
    await expect(fila).toContainText('Bajo mínimo: faltan 4');
  });

  test('no guarda la edición con el nombre vacío', async ({ page }) => {
    const sku = skuUnico('EDI');
    creados.push(sku);
    await agregarProducto(page, { nombre: 'Prueba carpeta', sku, cantidad: 10, minimo: 5 });

    await filaPorSku(page, sku).getByRole('button', { name: 'Editar' }).click();
    const edicion = filaEnEdicion(page);
    await edicion.getByRole('textbox', { name: 'Nombre' }).fill('');
    await edicion.getByRole('spinbutton', { name: 'Cantidad' }).fill('1');
    await edicion.getByRole('button', { name: 'Guardar' }).click();

    // Mensaje exacto de validar() en public/productos.js; sigue en edición.
    await expect(page.getByRole('alert')).toHaveText('Falta: nombre.');
    await expect(edicion).toHaveCount(1);

    // Al cancelar y recargar, la fila trae de Supabase los datos originales:
    // así se comprueba que la base no cambió, no solo la pantalla.
    await edicion.getByRole('button', { name: 'Cancelar' }).click();
    await page.reload();
    await expect(page.locator('#pantalla-inventario')).toBeVisible();
    await expect(page.locator('#cargando')).toBeHidden();
    const fila = filaPorSku(page, sku);
    await expect(fila).toContainText('Prueba carpeta');
    await expect(fila).toContainText('Suficiente');
    await expect(fila).not.toHaveClass(/\bbajo\b/);
  });

  // Incidente del día 10: "Pude registrar dos productos con el mismo SKU".
  // El SKU no debe repetirse aunque cambien las mayúsculas.
  test('no deja registrar el mismo SKU con otras mayúsculas', async ({ page }) => {
    const sku = skuUnico('DUP');
    creados.push(sku); // borrarPorSku borra todas las filas con ese SKU, sin importar mayúsculas
    await agregarProducto(page, { nombre: 'Prueba SKU original', sku, cantidad: 4, minimo: 2 });

    const form = page.locator('#form-agregar');
    await form.getByLabel('Nombre').fill('Prueba SKU repetido');
    await form.getByLabel('SKU').fill(sku.toLowerCase());
    await form.getByLabel('Cantidad').fill('1');
    await form.getByLabel('Mínimo').fill('1');
    await form.getByRole('button', { name: 'Agregar producto' }).click();

    // Mensaje que ya usa la app para un SKU repetido (public/productos.js).
    await expect(page.getByRole('alert')).toHaveText('Ya tienes un producto con ese SKU.');
    // Solo debe quedar un producto con ese SKU (hasText no distingue mayúsculas).
    await expect(page.locator('#cuerpo tr .sku').filter({ hasText: sku })).toHaveCount(1);
  });

  test('no guarda con campos vacíos', async ({ page }) => {
    const antes = await page.locator('#cuerpo tr').count();
    await page.locator('#form-agregar').getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.locator('#error-agregar')).toHaveText('Faltan: nombre, SKU, cantidad y mínimo.');
    await expect(page.locator('#cuerpo tr')).toHaveCount(antes);
  });
});
