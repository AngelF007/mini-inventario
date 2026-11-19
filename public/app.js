// Interfaz de Mini Inventario. No sabe dónde se guardan los datos:
// todo pasa por public/productos.js.
import { listarProductos, agregarProducto, actualizarProducto } from './productos.js';

const formAgregar = document.getElementById('form-agregar');
const errorAgregar = document.getElementById('error-agregar');
const errorLista = document.getElementById('error-lista');
const filtroBajo = document.getElementById('filtro-bajo');
const contador = document.getElementById('contador');
const vacio = document.getElementById('vacio');
const tabla = document.getElementById('tabla');
const cuerpo = document.getElementById('cuerpo');

let editandoId = null;

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

function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.hidden = !mensaje;
}

function datosDeFormulario(form) {
  const f = new FormData(form);
  return {
    nombre: f.get('nombre'),
    sku: f.get('sku'),
    cantidad: f.get('cantidad'),
    minimo: f.get('minimo'),
  };
}

function celda(texto, clase) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

function boton(texto, alClic, clase) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  if (clase) b.className = clase;
  b.addEventListener('click', alClic);
  return b;
}

function filaNormal(p) {
  const tr = document.createElement('tr');
  if (estaBajoMinimo(p)) tr.className = 'bajo';
  tr.append(
    celda(p.nombre),
    celda(p.sku, 'sku'),
    celda(String(p.cantidad), 'num'),
    celda(String(p.minimo), 'num'),
  );
  const estado = document.createElement('td');
  estado.innerHTML = estaBajoMinimo(p)
    ? '<span class="etiqueta etiqueta-bajo">Bajo mínimo</span>'
    : '<span class="etiqueta etiqueta-ok">OK</span>';
  tr.append(estado);
  const acciones = document.createElement('td');
  acciones.append(boton('Editar', () => { editandoId = p.id; mostrarError(errorLista, ''); render(); }, 'secundario'));
  tr.append(acciones);
  return tr;
}

function entrada(nombre, valor, tipo = 'text') {
  const input = document.createElement('input');
  input.name = nombre;
  input.value = valor;
  input.type = tipo;
  input.setAttribute('aria-label', nombre);
  if (tipo === 'number') { input.min = '0'; input.step = '1'; }
  return input;
}

function filaEdicion(p) {
  const tr = document.createElement('tr');
  tr.className = 'editando';
  const campos = {
    nombre: entrada('nombre', p.nombre),
    sku: entrada('sku', p.sku),
    cantidad: entrada('cantidad', p.cantidad, 'number'),
    minimo: entrada('minimo', p.minimo, 'number'),
  };
  for (const [clave, input] of Object.entries(campos)) {
    const td = document.createElement('td');
    if (clave === 'cantidad' || clave === 'minimo') td.className = 'num';
    td.append(input);
    tr.append(td);
  }
  tr.append(celda(''));
  const acciones = document.createElement('td');
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
  acciones.append(
    boton('Guardar', guardar),
    boton('Cancelar', () => { editandoId = null; mostrarError(errorLista, ''); render(); }, 'secundario'),
  );
  tr.append(acciones);
  tr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') guardar();
    if (e.key === 'Escape') { editandoId = null; mostrarError(errorLista, ''); render(); }
  });
  return tr;
}

async function render() {
  const todos = await listarProductos();
  const bajos = todos.filter(estaBajoMinimo).length;
  contador.textContent = bajos === 1 ? '1 producto bajo mínimo' : `${bajos} productos bajo mínimo`;
  contador.classList.toggle('alerta', bajos > 0);

  const visibles = ordenar(filtroBajo.checked ? todos.filter(estaBajoMinimo) : todos);

  if (todos.length === 0) {
    vacio.textContent = 'Aún no tienes productos.';
  } else if (visibles.length === 0) {
    vacio.textContent = 'No hay productos bajo mínimo. 🎉';
  }
  vacio.hidden = visibles.length > 0;
  tabla.hidden = visibles.length === 0;

  cuerpo.replaceChildren(...visibles.map((p) => (p.id === editandoId ? filaEdicion(p) : filaNormal(p))));
  cuerpo.querySelector('tr.editando input')?.focus();
}

formAgregar.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await agregarProducto(datosDeFormulario(formAgregar));
    formAgregar.reset();
    mostrarError(errorAgregar, '');
    formAgregar.elements.nombre.focus();
    await render();
  } catch (error) {
    mostrarError(errorAgregar, error.message);
  }
});

filtroBajo.addEventListener('change', render);

render();
