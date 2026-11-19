// Funciones compartidas por las pruebas.
const { expect } = require('@playwright/test');

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

function exigirCredenciales(test) {
  test.skip(!EMAIL || !PASSWORD, 'Faltan TEST_EMAIL y TEST_PASSWORD en .env');
}

// SKU único por prueba para no chocar con datos existentes.
function skuUnico(prefijo = 'PW') {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

async function iniciarSesion(page, email = EMAIL, password = PASSWORD) {
  await page.goto('/');
  await expect(page.locator('#pantalla-acceso')).toBeVisible();
  await page.locator('#form-acceso [name=correo]').fill(email);
  await page.locator('#form-acceso [name=contrasena]').fill(password);
  await page.locator('#boton-acceso').click();
}

async function agregarProducto(page, { nombre, sku, cantidad, minimo }) {
  const form = page.locator('#form-agregar');
  await form.locator('[name=nombre]').fill(nombre);
  await form.locator('[name=sku]').fill(sku);
  await form.locator('[name=cantidad]').fill(String(cantidad));
  await form.locator('[name=minimo]').fill(String(minimo));
  await form.getByRole('button', { name: 'Agregar producto' }).click();
  // Espera a que Supabase responda y la fila aparezca: el formulario se limpia
  // al terminar, y escribir antes podría mezclarse con el siguiente producto.
  await expect(filaPorSku(page, sku)).toHaveCount(1);
}

function filaPorSku(page, sku) {
  return page.locator('#cuerpo tr').filter({ has: page.locator('.sku', { hasText: sku }) });
}

// Borra desde la interfaz (RLS solo deja borrar lo propio). No falla si ya no existe.
async function borrarPorSku(page, sku) {
  const fila = filaPorSku(page, sku);
  if ((await fila.count()) === 0) return;
  await fila.getByRole('button', { name: 'Eliminar' }).click();
  await fila.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(filaPorSku(page, sku)).toHaveCount(0);
}

module.exports = { EMAIL, exigirCredenciales, skuUnico, iniciarSesion, agregarProducto, filaPorSku, borrarPorSku };
