// Acceso a datos de Mini Inventario.
// Es el ÚNICO archivo que sabe dónde se guardan los productos.
// Hoy usa localStorage; mañana se cambia por Supabase sin tocar app.js.
// Todas las funciones son async para que el cambio a Supabase no cambie su forma de uso.

const CLAVE = 'mini-inventario:productos';

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function escribir(productos) {
  localStorage.setItem(CLAVE, JSON.stringify(productos));
}

// Igual que el tipo integer de Postgres (docs/diseno.md): de 0 a 2147483647.
const MAXIMO_ENTERO = 2147483647;

function esEnteroNoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0 && valor <= MAXIMO_ENTERO;
}

// Solo dígitos: evita que Number() acepte cosas como '1e2' o '0x10'.
function aEntero(valor) {
  const texto = String(valor ?? '').trim();
  return /^\d+$/.test(texto) ? Number(texto) : NaN;
}

// Limpia y valida los datos igual que lo hará la tabla en Supabase (docs/diseno.md).
function validar({ nombre, sku, cantidad, minimo }) {
  const limpio = {
    nombre: String(nombre ?? '').trim(),
    sku: String(sku ?? '').trim(),
    cantidad: aEntero(cantidad),
    minimo: aEntero(minimo),
  };
  const faltan = [];
  if (!limpio.nombre) faltan.push('nombre');
  if (!limpio.sku) faltan.push('SKU');
  if (String(cantidad ?? '').trim() === '') faltan.push('cantidad');
  if (String(minimo ?? '').trim() === '') faltan.push('mínimo');
  if (faltan.length === 1) throw new Error(`Falta: ${faltan[0]}.`);
  if (faltan.length > 1) {
    throw new Error(`Faltan: ${faltan.slice(0, -1).join(', ')} y ${faltan.at(-1)}.`);
  }
  if (limpio.nombre.length > 100) throw new Error('El nombre debe tener 100 caracteres o menos.');
  if (limpio.sku.length > 50) throw new Error('El SKU debe tener 50 caracteres o menos.');
  if (!esEnteroNoNegativo(limpio.cantidad)) {
    throw new Error('La cantidad debe ser un número entero de 0 a 2147483647.');
  }
  if (!esEnteroNoNegativo(limpio.minimo)) {
    throw new Error('El mínimo debe ser un número entero de 0 a 2147483647.');
  }
  return limpio;
}

// Igual que unique (user_id, sku) en docs/diseno.md: comparación exacta.
function skuRepetido(productos, sku, idIgnorado) {
  return productos.some((p) => p.id !== idIgnorado && p.sku === sku);
}

// Ordenados por nombre, como el select de docs/diseno.md.
export async function listarProductos() {
  return leer().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}

export async function agregarProducto(datos) {
  const productos = leer();
  const limpio = validar(datos);
  if (skuRepetido(productos, limpio.sku)) {
    throw new Error('Ya tienes un producto con ese SKU.');
  }
  const nuevo = {
    id: crypto.randomUUID(),
    ...limpio,
    created_at: new Date().toISOString(),
  };
  productos.push(nuevo);
  escribir(productos);
  return nuevo;
}

export async function actualizarProducto(id, datos) {
  const productos = leer();
  const indice = productos.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error('Ese producto ya no existe.');
  const limpio = validar(datos);
  if (skuRepetido(productos, limpio.sku, id)) {
    throw new Error('Ya tienes un producto con ese SKU.');
  }
  productos[indice] = { ...productos[indice], ...limpio };
  escribir(productos);
  return productos[indice];
}
