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

  test('edita la cantidad y cambia el estado', async ({ page }) => {
    const sku = skuUnico('EDI');
    creados.push(sku);
    await agregarProducto(page, { nombre: 'Prueba hojas', sku, cantidad: 10, minimo: 5 });
    const fila = filaPorSku(page, sku);
    await fila.getByRole('button', { name: 'Editar' }).click();
    const edicion = page.locator('#cuerpo tr.editando');
    await edicion.locator('[name=cantidad]').fill('1');
    await edicion.getByRole('button', { name: 'Guardar' }).click();
    await expect(filaPorSku(page, sku)).toContainText('Bajo mínimo: faltan 4');
  });

  test('no guarda con campos vacíos', async ({ page }) => {
    const antes = await page.locator('#cuerpo tr').count();
    await page.locator('#form-agregar').getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.locator('#error-agregar')).toHaveText('Faltan: nombre, SKU, cantidad y mínimo.');
    await expect(page.locator('#cuerpo tr')).toHaveCount(antes);
  });
});
