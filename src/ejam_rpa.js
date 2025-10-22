require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Función simple para escribir logs en archivo y consola
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${type}] ${message}`;
  console.log(line);
  fs.appendFileSync(path.join(__dirname, 'rpa_log.txt'), line + '\n');
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    log('🚀 Iniciando RPA de login a EJAM');

    // Abrir página de login
    const loginUrl = process.env.EJAM_URL + '/login';
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    log('Página de login cargada ✅');

    // Rellenar credenciales
    await page.fill('#inputUsername', process.env.EJAM_USER);
    await page.fill('#inputPassword', process.env.EJAM_PASS);
    log('Credenciales completadas');

    // Click en botón de login
    await page.click('button[type="submit"]');

    // Esperar URL que empiece con /dashboard o detectar error
    try {
        await page.waitForURL('**/dashboard', { timeout: 5000 });
        log('Login exitoso, redirigido a /dashboard ✅');

        // Opcional: verificar si aparece mensaje de permiso denegado
        const permisoError = await page.locator('text=Permiso denegado').count();
        if (permisoError > 0) {
            log('⚠️ Usuario sin permisos para acceder a esta sección', 'ERROR');
        }
    } catch {
        log('⚠️ No se detectó redirección a /dashboard', 'ERROR');
    }

    log('Login exitoso ✅');
    log(`URL actual: ${page.url()}`);

    // Captura de pantalla post-login
    await page.screenshot({ path: 'ejam_login_success.png' });
    log('Captura de pantalla guardada: ejam_login_success.png');

    // Redirigir automáticamente a sección de contratos
    const contratoUrl = process.env.EJAM_URL + '/contrato/';
    await page.goto(contratoUrl, { waitUntil: 'networkidle' });
    log('Navegado a Contratos ✅');
    log(`URL actual: ${page.url()}`);

    // Captura de pantalla de contratos
    await page.screenshot({ path: 'ejam_contratos.png' });
    log('Captura de pantalla guardada: ejam_contratos.png');

  } catch (error) {
    log(`Ocurrió un error en el RPA: ${error}`, 'ERROR');
  } finally {
    log('🔓 Manteniendo el navegador abierto para inspección manual');
    await page.waitForTimeout(9999999); // mantener navegador abierto
    await browser.close(); // descomentar si quieres cerrar automáticamente
  }
})();
