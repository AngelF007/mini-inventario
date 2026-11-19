// Recorrido exploratorio (Día 5): inicia sesión con el usuario de prueba,
// agrega un producto bajo el mínimo, toma capturas en escritorio y móvil
// y guarda los errores de consola. No muestra ni guarda la contraseña.
// Uso: npm run explorar   (si la app no está corriendo, el script la prende y la apaga al final)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

try { process.loadEnvFile('.env'); } catch { /* variables del sistema */ }

const URL = `http://localhost:${process.env.PORT || 3000}`;
const { TEST_EMAIL, TEST_PASSWORD } = process.env;
if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Faltan TEST_EMAIL y TEST_PASSWORD en .env');
  process.exit(1);
}

const carpeta = path.join('entregas', 'dia-05');
mkdirSync(carpeta, { recursive: true });

async function estaViva() {
  try {
    return (await fetch(`${URL}/health`)).ok;
  } catch {
    return false;
  }
}

// Si la app no responde, la arranca aquí mismo (igual que npm start).
let servidor = null;
if (!(await estaViva())) {
  console.log('La app no estaba corriendo: la arranco...');
  servidor = spawn(process.execPath, ['server.js'], { stdio: 'inherit' });
  for (let i = 0; i < 30 && !(await estaViva()); i++) await new Promise((r) => setTimeout(r, 500));
  if (!(await estaViva())) {
    console.error('No pude arrancar la app. Revisa que exista .env y prueba con npm start.');
    servidor.kill();
    process.exit(1);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consola = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consola.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => consola.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => consola.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''}`));

const sku = `EXP-${Date.now().toString(36).toUpperCase()}`;
const pasos = [];
try {
  await page.goto(URL);
  await page.screenshot({ path: path.join(carpeta, '01-acceso-1280.png') });
  pasos.push('Abrí la pantalla de acceso');

  await page.locator('#form-acceso [name=correo]').fill(TEST_EMAIL);
  await page.locator('#form-acceso [name=contrasena]').fill(TEST_PASSWORD);
  await page.locator('#boton-acceso').click();
  await page.locator('#pantalla-inventario').waitFor({ state: 'visible' });
  await page.locator('#cargando').waitFor({ state: 'hidden' });
  pasos.push('Inicié sesión con el usuario de prueba');

  const form = page.locator('#form-agregar');
  await form.locator('[name=nombre]').fill('Exploración: marcatextos');
  await form.locator('[name=sku]').fill(sku);
  await form.locator('[name=cantidad]').fill('2');
  await form.locator('[name=minimo]').fill('10');
  await form.getByRole('button', { name: 'Agregar producto' }).click();
  await page.locator('#cuerpo tr', { hasText: sku }).waitFor();
  pasos.push(`Agregué ${sku} con cantidad 2 y mínimo 10`);

  await page.screenshot({ path: path.join(carpeta, '02-inventario-1280x800.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(carpeta, '03-inventario-390x844.png'), fullPage: true });
  pasos.push('Tomé capturas en 1280x800 y 390x844');

  const ancho = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  pasos.push(`Ancho de la página en móvil: ${ancho[0]}px (ventana ${ancho[1]}px)`);
  const tabla = await page.evaluate(() => {
    const e = document.querySelector('.tabla-envoltura');
    return e ? [e.scrollWidth, e.clientWidth] : null;
  });
  if (tabla) pasos.push(`Tabla en móvil: contenido ${tabla[0]}px en una caja de ${tabla[1]}px`);
  const acciones = await page.locator('#cuerpo tr', { hasText: sku }).getByRole('button', { name: 'Editar' }).boundingBox();
  pasos.push(`Botón Editar en móvil: ${acciones ? `x=${Math.round(acciones.x)} (visible si < 390)` : 'no encontrado'}`);
} finally {
  // Limpieza: borrar el producto de exploración.
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    const fila = page.locator('#cuerpo tr', { hasText: sku });
    if (await fila.count()) {
      await fila.getByRole('button', { name: 'Eliminar' }).click();
      await fila.getByRole('button', { name: 'Sí, eliminar' }).click();
      await page.locator('#cuerpo tr', { hasText: sku }).waitFor({ state: 'detached' });
      pasos.push(`Borré ${sku} al terminar`);
    }
  } catch (e) {
    pasos.push(`No se pudo borrar ${sku}: ${e.message}`);
  }
  await browser.close();
  servidor?.kill();
}

const reporte = [
  '# Reporte de exploración',
  '',
  ...pasos.map((p) => `- ${p}`),
  '',
  '## Consola (errores y avisos)',
  '',
  ...(consola.length ? consola.map((c) => `- ${c}`) : ['- Sin errores ni avisos']),
  '',
].join('\n');
writeFileSync(path.join(carpeta, 'consola.md'), reporte);
console.log(reporte);
