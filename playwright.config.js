// Pruebas de Mini Inventario con Playwright Test.
const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

// TEST_EMAIL y TEST_PASSWORD (y la configuración de Supabase) vienen de .env.
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  // En CI se usan variables de entorno del sistema.
}

const PORT = process.env.PORT || 3000;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // un solo usuario de prueba: mejor una prueba a la vez
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Arranca la app antes de las pruebas (o usa la que ya esté corriendo).
  webServer: {
    command: 'npm start',
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
