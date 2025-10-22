require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // LOGIN
  await page.goto(process.env.LEGALFLOW_URL);
  await page.fill('#email', process.env.LEGALFLOW_USER);
  await page.fill('#password', process.env.LEGALFLOW_PASS);
  await page.click('.btn-login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#side-menu', { timeout: 10000 });
  console.log('✅ Login exitoso');

  // NAVEGAR A CASOS
  await page.click('a[href*="/casos"]');
  await page.waitForLoadState('networkidle');

  // Diagnóstico (ver dónde está realmente)
  console.log("URL actual después del clic:", page.url());
  await page.screenshot({ path: 'casos_debug.png' });

  // Esperar botón "Nuevo Caso" como indicador de carga correcta
  await page.waitForSelector('a[href*="/casos/create"]', { timeout: 15000 });
  console.log('✅ Sección Casos abierta');

  // ABRIR NUEVO CASO
  await page.locator('a[href*="/casos/create"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('form');
  console.log('✅ Formulario de Nuevo Caso abierto');

  await browser.close();
})();
