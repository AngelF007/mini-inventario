const path = require('node:path');
const express = require('express');

// Lee .env si existe (Node 22 lo trae integrado, sin dependencias extra).
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  // Sin .env: se usan las variables de entorno del sistema.
}

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// La llave secreta (service_role) se salta RLS: jamás debe llegar al navegador.
function esLlaveSecreta(llave) {
  if (llave.startsWith('sb_secret_')) return true;
  const partes = llave.split('.');
  if (partes.length !== 3) return false;
  try {
    const datos = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
    return datos.role === 'service_role';
  } catch {
    return false;
  }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Aviso: faltan SUPABASE_URL o SUPABASE_KEY en .env (copia .env.example).');
}
if (esLlaveSecreta(SUPABASE_KEY)) {
  console.error('Error: SUPABASE_KEY es una llave secreta (service_role). Usa la publishable o anon.');
  process.exit(1);
}

const app = express();

// Comprobación rápida de que el servidor está vivo.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Configuración pública para el navegador: URL del proyecto y llave publishable/anon.
app.get('/config.js', (req, res) => {
  const config = JSON.stringify({ url: SUPABASE_URL, key: SUPABASE_KEY });
  res.type('application/javascript').set('Cache-Control', 'no-store').send(`window.SUPABASE_CONFIG = ${config};\n`);
});

// La web completa vive en public/.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Mini Inventario en http://localhost:${PORT}`);
});
