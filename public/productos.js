// Acceso a datos de Mini Inventario.
// Es el ÚNICO archivo que habla con Supabase (base de datos e inicio de sesión).
// La seguridad real está en la base: RLS solo deja ver y cambiar los productos propios.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.SUPABASE_CONFIG ?? {};
if (!config.url || !config.key) {
  throw new Error('Falta la configuración de Supabase. Revisa SUPABASE_URL y SUPABASE_KEY en .env.');
}

const supabase = createClient(config.url, config.key);
const COLUMNAS = 'id, nombre, sku, cantidad, minimo, created_at';

// ---------- Validación (igual que las reglas de la tabla en docs/diseno.md) ----------

const MAXIMO_ENTERO = 2147483647;

function esEnteroNoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0 && valor <= MAXIMO_ENTERO;
}

// Solo dígitos: evita que Number() acepte cosas como '1e2' o '0x10'.
function aEntero(valor) {
  const texto = String(valor ?? '').trim();
  return /^\d+$/.test(texto) ? Number(texto) : NaN;
}

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
  if ([...limpio.nombre].length > 100) throw new Error('El nombre debe tener 100 caracteres o menos.');
  if ([...limpio.sku].length > 50) throw new Error('El SKU debe tener 50 caracteres o menos.');
  if (!esEnteroNoNegativo(limpio.cantidad)) {
    throw new Error('La cantidad debe ser un número entero de 0 a 2147483647.');
  }
  if (!esEnteroNoNegativo(limpio.minimo)) {
    throw new Error('El mínimo debe ser un número entero de 0 a 2147483647.');
  }
  return limpio;
}

// Traduce los errores de Supabase/Postgres a mensajes claros.
function traducirError(error) {
  if (!error) return null;
  if (error.code === '23505') return new Error('Ya tienes un producto con ese SKU.');
  if (error.code === '23514') return new Error('Algún dato no cumple las reglas del inventario.');
  if (error.code === '42501') return new Error('No tienes permiso para hacer eso. Vuelve a iniciar sesión.');
  return new Error(error.message || 'Ocurrió un error con la base de datos.');
}

// ---------- Inicio de sesión ----------

function traducirErrorDeSesion(error) {
  const mensaje = (error?.message || '').toLowerCase();
  if (mensaje.includes('invalid login credentials')) return new Error('Correo o contraseña incorrectos.');
  if (mensaje.includes('already registered')) return new Error('Ese correo ya tiene una cuenta.');
  if (mensaje.includes('email not confirmed')) return new Error('Confirma tu correo antes de entrar.');
  if (mensaje.includes('password')) return new Error('La contraseña no cumple los requisitos (mínimo 8 caracteres).');
  return new Error(error?.message || 'No se pudo completar el inicio de sesión.');
}

function validarCredenciales(correo, contrasena) {
  const email = String(correo ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo válido.');
  if (String(contrasena ?? '').length < 8) throw new Error('La contraseña debe tener 8 caracteres o más.');
  return email;
}

export async function obtenerUsuario() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export function alCambiarSesion(funcion) {
  supabase.auth.onAuthStateChange((_evento, sesion) => funcion(sesion?.user ?? null));
}

export async function iniciarSesion(correo, contrasena) {
  const email = validarCredenciales(correo, contrasena);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: contrasena });
  if (error) throw traducirErrorDeSesion(error);
  return data.user;
}

// Devuelve { usuario, necesitaConfirmar }: si Supabase pide confirmar el correo, no hay sesión todavía.
export async function registrarse(correo, contrasena) {
  const email = validarCredenciales(correo, contrasena);
  const { data, error } = await supabase.auth.signUp({ email, password: contrasena });
  if (error) throw traducirErrorDeSesion(error);
  // Supabase responde sin identidades cuando el correo ya existía.
  if (data.user && data.user.identities?.length === 0) throw new Error('Ese correo ya tiene una cuenta.');
  return { usuario: data.user, necesitaConfirmar: !data.session };
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw traducirErrorDeSesion(error);
}

// ---------- Productos (RLS filtra por usuario en la base) ----------

export async function listarProductos() {
  const { data, error } = await supabase.from('productos').select(COLUMNAS).order('nombre');
  if (error) throw traducirError(error);
  return data;
}

export async function agregarProducto(datos) {
  const limpio = validar(datos);
  // user_id lo pone la base con auth.uid(); RLS rechaza cualquier otro valor.
  const { data, error } = await supabase.from('productos').insert(limpio).select(COLUMNAS).single();
  if (error) throw traducirError(error);
  return data;
}

export async function actualizarProducto(id, datos) {
  const limpio = validar(datos);
  const { data, error } = await supabase.from('productos').update(limpio).eq('id', id).select(COLUMNAS);
  if (error) throw traducirError(error);
  if (!data.length) throw new Error('Ese producto ya no existe o no es tuyo.');
  return data[0];
}

export async function eliminarProducto(id) {
  const { data, error } = await supabase.from('productos').delete().eq('id', id).select('id');
  if (error) throw traducirError(error);
  if (!data.length) throw new Error('Ese producto ya no existe o no es tuyo.');
}
