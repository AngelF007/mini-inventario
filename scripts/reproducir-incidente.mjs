// Reproduce el reporte del Día 10 en la app publicada (o en otra URL):
// "Pude registrar dos productos con el mismo SKU".
// Inicia sesión con el usuario de prueba de .env, agrega un producto con un SKU
// en MAYÚSCULAS y otro con el mismo SKU en minúsculas, cuenta cuántos quedaron
// y toma una captura. No muestra ni guarda la contraseña.
//
// Uso:
//   node scripts/reproducir-incidente.mjs antes     -> captura entregas/dia-10/reproduccion-antes.png
//   node scripts/reproducir-incidente.mjs despues   -> captura entregas/dia-10/reproduccion-despues.png
// URL por defecto: la de Render. Para otra: URL_APP=http://localhost:3000 node ...
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

try { process.loadEnvFile('.env'); } catch { /* variables del sistema */ }

const URL_APP = process.env.URL_APP || 'https://mini-inventario-m9u5.onrender.com';
const etiqueta = process.argv[2] || 'antes';
const { TEST_EMAIL, TEST_PASSWORD } = process.env;
if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Faltan TEST_EMAIL y TEST_PASSWORD en .env');
  process.exit(1);
}

const carpeta = path.join('entregas', 'dia-10');
mkdirSync(carpeta, { recursive: true });
const registro = [];
const anota = (texto) => { console.log(texto); registro.push(texto); };

// El servicio gratuito de Render se duerme: lo despierta antes de empezar.
anota(`== Reproducción (${etiqueta}) en ${URL_APP} — ${new Date().toISOString()}`);
for (let i = 0; i < 24; i++) {
  try {
    const r = await fetch(`${URL_APP}/health`);
    if (r.ok) { anota(`/health: ${await r.text()}`); break; }
  } catch { /* sigue esperando */ }
  await new Promise((r) => setTimeout(r, 5000));
}

const navegador = await chromium.launch();
const page = await navegador.newPage({ viewport: { width: 1280, height: 900 } });

// SKUs exactos de la tabla (sin depender de mayúsculas/minúsculas del filtro).
async function skusEnTabla() {
  return page.locator('#cuerpo tr .sku').allInnerTexts();
}

async function agregar(nombre, sku) {
  const form = page.locator('#form-agregar');
  const antes = (await skusEnTabla()).length;
  await form.locator('[name=nombre]').fill(nombre);
  await form.locator('[name=sku]').fill(sku);
  await form.locator('[name=cantidad]').fill('3');
  await form.locator('[name=minimo]').fill('5');
  await form.getByRole('button', { name: 'Agregar producto' }).click();
  // Espera a que pase una de dos cosas: aparece una fila nueva o sale un error.
  const error = page.locator('#error-agregar');
  for (let i = 0; i < 40; i++) {
    if ((await skusEnTabla()).length > antes) return { guardado: true, mensaje: '' };
    if (await error.isVisible()) return { guardado: false, mensaje: (await error.innerText()).trim() };
    await page.waitForTimeout(250);
  }
  return { guardado: false, mensaje: '(sin respuesta en 10 s)' };
}

try {
  await page.goto(URL_APP);
  await page.locator('#form-acceso [name=correo]').fill(TEST_EMAIL);
  await page.locator('#form-acceso [name=contrasena]').fill(TEST_PASSWORD);
  await page.locator('#boton-acceso').click();
  await page.locator('#pantalla-inventario').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#cargando').waitFor({ state: 'hidden', timeout: 30000 });
  anota(`Sesión iniciada como ${TEST_EMAIL}`);

  const base = `INC-${Date.now().toString(36).toUpperCase()}`;
  const r1 = await agregar('Reporte día 10 (mayúsculas)', base);
  anota(`1) Agregar SKU "${base}": ${r1.guardado ? 'GUARDADO' : `RECHAZADO — ${r1.mensaje}`}`);
  const r2 = await agregar('Reporte día 10 (minúsculas)', base.toLowerCase());
  anota(`2) Agregar SKU "${base.toLowerCase()}": ${r2.guardado ? 'GUARDADO' : `RECHAZADO — ${r2.mensaje}`}`);

  const iguales = (await skusEnTabla()).filter((s) => s.trim().toUpperCase() === base);
  anota(`Filas con el SKU ${base} (sin importar mayúsculas): ${iguales.length} -> ${JSON.stringify(iguales)}`);
  anota(iguales.length > 1 ? 'RESULTADO: el reporte SE REPRODUCE (SKU duplicado guardado).' : 'RESULTADO: el reporte YA NO ocurre (solo un producto con ese SKU).');

  // Filtra la tabla por el SKU para que la captura muestre justo el caso.
  await page.getByPlaceholder('Buscar por nombre o SKU').fill(base.toLowerCase());
  await page.waitForTimeout(300);
  const captura = path.join(carpeta, `reproduccion-${etiqueta}.png`);
  await page.screenshot({ path: captura, fullPage: true });
  anota(`Captura: ${captura}`);
} catch (error) {
  anota(`ERROR: ${error.message.split('\n')[0]}`);
  await page.screenshot({ path: path.join(carpeta, `reproduccion-${etiqueta}-error.png`), fullPage: true });
  process.exitCode = 1;
} finally {
  await navegador.close();
  writeFileSync(path.join(carpeta, `reproduccion-${etiqueta}.txt`), registro.join('\n') + '\n');
}
