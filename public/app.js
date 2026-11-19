// Interfaz de Mini Inventario. No sabe dónde se guardan los datos:
// todo (productos e inicio de sesión) pasa por public/productos.js.
import {
  listarProductos, agregarProducto, actualizarProducto, eliminarProducto,
  obtenerUsuario, alCambiarSesion, iniciarSesion, registrarse, cerrarSesion,
} from './productos.js';

const $ = (id) => document.getElementById(id);
const formAgregar = $('form-agregar');
const errorAgregar = $('error-agregar');
const errorLista = $('error-lista');
const resumen = document.querySelector('.resumen');
const titular = $('titular');
const detalle = $('detalle');
const buscar = $('buscar');
const botonesVista = document.querySelectorAll('.vista');
const vacio = $('vacio');
const vacioTexto = $('vacio-texto');
const tabla = $('tabla');
const cuerpo = $('cuerpo');

let editandoId = null;
let confirmandoId = null;
let vista = 'todos';
let productos = [];
let usuarioActual = null;

function estaBajoMinimo(producto) {
  return producto.cantidad < producto.minimo;
}

// Primero los que están bajo mínimo; dentro de cada grupo, por nombre A–Z.
function ordenar(productos) {
  return [...productos].sort((a, b) => {
    const diferencia = Number(estaBajoMinimo(b)) - Number(estaBajoMinimo(a));
    return diferencia || a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  });
}

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.hidden = !mensaje;
}

function crear(etiqueta, { clase, texto } = {}) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function boton(texto, alClic, clase) {
  const b = crear('button', { clase, texto });
  b.type = 'button';
  b.addEventListener('click', alClic);
  return b;
}

function salirDeEdicion() {
  editandoId = null;
  mostrarError(errorLista, '');
  pintar();
}

// La barra llega al 100 % cuando la cantidad es el doble del mínimo;
// la raya marca dónde está el mínimo.
function barraDeNivel(p) {
  const tope = Math.max(p.minimo * 2, p.cantidad, 1);
  const nivel = crear('div', { clase: 'nivel' });
  const barra = crear('div', { clase: 'barra' });
  barra.setAttribute('role', 'img');
  barra.setAttribute('aria-label', `${p.cantidad} de un mínimo de ${p.minimo}`);
  const relleno = crear('span', { clase: 'relleno' });
  relleno.style.width = `${(p.cantidad / tope) * 100}%`;
  const marca = crear('span', { clase: 'marca-minimo' });
  marca.style.left = `calc(${(p.minimo / tope) * 100}% - 1px)`;
  barra.append(relleno, marca);
  const faltan = p.minimo - p.cantidad;
  const estado = crear('span', {
    clase: 'estado',
    texto: estaBajoMinimo(p) ? `Bajo mínimo: faltan ${faltan}` : 'Suficiente',
  });
  nivel.append(barra, estado);
  return nivel;
}

function filaNormal(p) {
  const tr = crear('tr', { clase: estaBajoMinimo(p) ? 'bajo' : '' });
  const tdSku = crear('td');
  tdSku.append(crear('span', { clase: 'sku', texto: p.sku }));
  const tdNivel = crear('td');
  tdNivel.append(barraDeNivel(p));
  const tdAcciones = crear('td', { clase: 'acciones' });
  tdAcciones.append(boton('Editar', () => {
    editandoId = p.id;
    confirmandoId = null;
    mostrarError(errorLista, '');
    pintar();
  }, 'secundario'));
  if (confirmandoId === p.id) {
    tdAcciones.append(
      boton('Sí, eliminar', async () => {
        try {
          await eliminarProducto(p.id);
          confirmandoId = null;
          await render();
        } catch (error) {
          mostrarError(errorLista, error.message);
        }
      }, 'peligro confirmar'),
      boton('No', () => { confirmandoId = null; pintar(); }, 'texto'),
    );
  } else {
    tdAcciones.append(boton('Eliminar', () => {
      confirmandoId = p.id;
      editandoId = null;
      pintar();
    }, 'peligro'));
  }
  tr.append(
    tdSku,
    crear('td', { clase: 'producto', texto: p.nombre }),
    crear('td', { clase: 'num', texto: String(p.cantidad) }),
    crear('td', { clase: 'num minimo', texto: String(p.minimo) }),
    tdNivel,
    tdAcciones,
  );
  return tr;
}

function entrada(nombre, valor, etiqueta, tipo = 'text') {
  const input = crear('input');
  input.name = nombre;
  input.value = valor;
  input.type = tipo;
  input.setAttribute('aria-label', etiqueta);
  if (tipo === 'number') { input.min = '0'; input.step = '1'; }
  return input;
}

function filaEdicion(p) {
  const tr = crear('tr', { clase: 'editando' });
  const campos = {
    sku: entrada('sku', p.sku, 'SKU'),
    nombre: entrada('nombre', p.nombre, 'Nombre'),
    cantidad: entrada('cantidad', p.cantidad, 'Cantidad', 'number'),
    minimo: entrada('minimo', p.minimo, 'Mínimo', 'number'),
  };
  for (const [clave, input] of Object.entries(campos)) {
    const td = crear('td', { clase: clave === 'cantidad' || clave === 'minimo' ? 'num' : '' });
    td.append(input);
    tr.append(td);
  }
  tr.append(crear('td'));

  const guardar = async () => {
    try {
      await actualizarProducto(p.id, {
        nombre: campos.nombre.value,
        sku: campos.sku.value,
        cantidad: campos.cantidad.value,
        minimo: campos.minimo.value,
      });
      editandoId = null;
      mostrarError(errorLista, '');
      await render();
    } catch (error) {
      mostrarError(errorLista, error.message);
    }
  };

  const tdAcciones = crear('td', { clase: 'acciones' });
  tdAcciones.append(boton('Guardar', guardar, 'primario'), boton('Cancelar', salirDeEdicion, 'texto'));
  tr.append(tdAcciones);
  tr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') guardar();
    if (e.key === 'Escape') salirDeEdicion();
  });
  return tr;
}

function pintarResumen(todos, bajos) {
  const unidades = todos.reduce((suma, p) => suma + p.cantidad, 0);
  resumen.classList.toggle('alerta', bajos > 0);
  resumen.classList.toggle('en-orden', todos.length > 0 && bajos === 0);
  if (todos.length === 0) {
    titular.textContent = 'Tu inventario está vacío';
    detalle.textContent = 'Agrega tu primer producto con el formulario de abajo.';
  } else if (bajos > 0) {
    titular.textContent = `${plural(bajos, 'producto', 'productos')} por reabastecer`;
    detalle.textContent = `De ${plural(todos.length, 'producto', 'productos')} registrados, con ${plural(unidades, 'unidad', 'unidades')} en total.`;
  } else {
    titular.textContent = 'Todo tu inventario está por encima del mínimo';
    detalle.textContent = `${plural(todos.length, 'producto', 'productos')} registrados, con ${plural(unidades, 'unidad', 'unidades')} en total.`;
  }
  $('n-todos').textContent = todos.length;
  $('n-bajo').textContent = bajos;
}

// Vuelve a pedir los productos a la base y los pinta.
async function render() {
  try {
    productos = await listarProductos();
    mostrarError(errorLista, '');
  } catch (error) {
    mostrarError(errorLista, error.message);
  }
  pintar();
}

function pintar() {
  const todos = productos;
  const bajos = todos.filter(estaBajoMinimo).length;
  pintarResumen(todos, bajos);

  const texto = buscar.value.trim().toLowerCase();
  let visibles = vista === 'bajo' ? todos.filter(estaBajoMinimo) : todos;
  if (texto) {
    visibles = visibles.filter((p) => p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto));
  }
  visibles = ordenar(visibles);

  if (todos.length === 0) {
    vacioTexto.textContent = 'Aún no tienes productos. Cuando agregues uno, aparecerá aquí.';
  } else if (texto) {
    vacioTexto.textContent = `Ningún producto coincide con “${buscar.value.trim()}”.`;
  } else {
    vacioTexto.textContent = 'No hay productos bajo mínimo.';
  }
  $('cargando').hidden = true;
  vacio.hidden = visibles.length > 0;
  tabla.hidden = visibles.length === 0;

  cuerpo.replaceChildren(...visibles.map((p) => (p.id === editandoId ? filaEdicion(p) : filaNormal(p))));
  cuerpo.querySelector('tr.editando input')?.focus();
}

formAgregar.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(formAgregar);
  try {
    await agregarProducto({
      nombre: f.get('nombre'),
      sku: f.get('sku'),
      cantidad: f.get('cantidad'),
      minimo: f.get('minimo'),
    });
    formAgregar.reset();
    mostrarError(errorAgregar, '');
    formAgregar.elements.nombre.focus();
    await render();
  } catch (error) {
    mostrarError(errorAgregar, error.message);
  }
});

botonesVista.forEach((b) => b.addEventListener('click', () => {
  vista = b.dataset.vista;
  botonesVista.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  pintar();
}));

buscar.addEventListener('input', pintar);
formAgregar.addEventListener('input', () => mostrarError(errorAgregar, ''));

// ---------- Inicio de sesión ----------

const pantallaAcceso = $('pantalla-acceso');
const pantallaInventario = $('pantalla-inventario');
const formAcceso = $('form-acceso');
const errorAcceso = $('error-acceso');
const avisoAcceso = $('aviso-acceso');
const botonAcceso = $('boton-acceso');
const tabEntrar = $('tab-entrar');
const tabRegistro = $('tab-registro');
let modoAcceso = 'entrar';

function elegirModo(modo) {
  modoAcceso = modo;
  tabEntrar.setAttribute('aria-selected', String(modo === 'entrar'));
  tabRegistro.setAttribute('aria-selected', String(modo === 'registro'));
  botonAcceso.textContent = modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta';
  formAcceso.elements.contrasena.autocomplete = modo === 'entrar' ? 'current-password' : 'new-password';
  mostrarError(errorAcceso, '');
  mostrarError(avisoAcceso, '');
}
tabEntrar.addEventListener('click', () => elegirModo('entrar'));
tabRegistro.addEventListener('click', () => elegirModo('registro'));

formAcceso.addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo = formAcceso.elements.correo.value;
  const contrasena = formAcceso.elements.contrasena.value;
  mostrarError(errorAcceso, '');
  mostrarError(avisoAcceso, '');
  botonAcceso.disabled = true;
  try {
    if (modoAcceso === 'entrar') {
      await iniciarSesion(correo, contrasena);
    } else {
      const { necesitaConfirmar } = await registrarse(correo, contrasena);
      if (necesitaConfirmar) {
        mostrarError(avisoAcceso, 'Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.');
        elegirModo('entrar');
        mostrarError(avisoAcceso, 'Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.');
      }
    }
  } catch (error) {
    mostrarError(errorAcceso, error.message);
  } finally {
    botonAcceso.disabled = false;
  }
});

$('salir').addEventListener('click', async () => {
  try {
    await cerrarSesion();
  } catch (error) {
    mostrarError(errorLista, error.message);
  }
});

async function mostrarPantalla(usuario) {
  const cambio = (usuario?.id ?? null) !== (usuarioActual?.id ?? null);
  usuarioActual = usuario;
  $('usuario').hidden = !usuario;
  $('usuario-correo').textContent = usuario?.email ?? '';
  pantallaAcceso.hidden = Boolean(usuario);
  pantallaInventario.hidden = !usuario;
  if (!usuario) {
    productos = [];
    formAcceso.reset();
    formAcceso.elements.correo.focus();
    return;
  }
  if (cambio) {
    productos = [];
    editandoId = null;
    confirmandoId = null;
    cuerpo.replaceChildren();
    tabla.hidden = true;
    vacio.hidden = true;
    $('cargando').hidden = false;
    await render();
  }
}

alCambiarSesion((usuario) => { mostrarPantalla(usuario); });
mostrarPantalla(await obtenerUsuario());
