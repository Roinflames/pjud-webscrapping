require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Login
  await page.goto(process.env.LEGALFLOW_URL);
  await page.fill('#email', process.env.LEGALFLOW_USER);
  await page.fill('#password', process.env.LEGALFLOW_PASS);
  await page.click('.btn-login');

  // Esperar que el sidebar cargue (indicando login exitoso)
  await page.waitForSelector('#sidebar-menu', { timeout: 10000 });
  console.log("Login exitoso ✅");

  // Ir a Casos
  await page.click('a[href="/casos"]');
  await page.waitForSelector('h4:has-text("Casos")');
  console.log("Sección Casos abierta ✅");

  // Abrir Nuevo Caso
  await page.click('a[href="/casos/create"]');
  await page.waitForSelector('form');
  console.log("Formulario de Nuevo Caso abierto ✅");

  await browser.close();
})();
