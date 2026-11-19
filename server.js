const path = require('node:path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Comprobación rápida de que el servidor está vivo.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// La web completa vive en public/.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Mini Inventario en http://localhost:${PORT}`);
});
