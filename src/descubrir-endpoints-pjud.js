require('dotenv').config();
const { chromium } = require('playwright');

/**
 * Script para descubrir los endpoints AJAX que usa el PJUD
 * para cargar las opciones de corte y tribunal
 */

(async () => {
  console.log('🔍 Descubriendo endpoints AJAX del PJUD...\n');

  if (!process.env.OJV_URL) {
    console.error('❌ ERROR: No se encontró OJV_URL en .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Interceptar todas las peticiones de red
  const requests = [];
  const responses = [];

  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    
    // Solo interesar peticiones AJAX/API
    if (url.includes('ajax') || url.includes('api') || 
        url.includes('corte') || url.includes('tribunal') ||
        url.includes('competencia') || method === 'POST') {
      requests.push({
        url,
        method,
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📤 REQUEST: ${method} ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('ajax') || url.includes('api') || 
        url.includes('corte') || url.includes('tribunal') ||
        url.includes('competencia')) {
      responses.push({
        url,
        status,
        headers: response.headers()
      });
      console.log(`📥 RESPONSE: ${status} ${url}`);
    }
  });

  try {
    console.log('🌐 Navegando a:', process.env.OJV_URL);
    await page.goto(process.env.OJV_URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Cerrar modal
    try {
      await page.waitForSelector('#close-modal', { timeout: 3000 });
      await page.click('#close-modal');
      await page.waitForTimeout(500);
    } catch (e) {}

    // Navegar a consulta causas
    console.log('\n🖱️ Navegando a "Consulta causas"...');
    await page.click('text=Consulta causas');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Esperar formulario
    await page.waitForSelector('#competencia', { timeout: 20000 });

    console.log('\n📋 Seleccionando competencia para activar AJAX...');
    await page.selectOption('#competencia', '3'); // Civil
    await page.waitForTimeout(3000);

    console.log('\n📋 Seleccionando corte para activar AJAX...');
    await page.waitForSelector('#conCorte:not([disabled])', { timeout: 10000 });
    await page.selectOption('#conCorte', '90'); // C.A. de Santiago
    await page.waitForTimeout(3000);

    console.log('\n📋 Esperando que se carguen tribunales...');
    await page.waitForSelector('#conTribunal:not([disabled])', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('\n✅ Peticiones interceptadas:');
    console.log('\n📤 REQUESTS:');
    requests.forEach((req, i) => {
      console.log(`\n${i + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Body: ${req.postData.substring(0, 200)}`);
      }
    });

    console.log('\n📥 RESPONSES:');
    responses.forEach((res, i) => {
      console.log(`\n${i + 1}. ${res.status} ${res.url}`);
    });

    // Guardar resultados
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.resolve(__dirname, 'outputs/endpoints_pjud.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify({
      requests,
      responses,
      fecha: new Date().toISOString()
    }, null, 2), 'utf-8');

    console.log(`\n✅ Resultados guardados en: ${outputPath}`);
    console.log('\n⏸️ Presiona Enter para cerrar...');
    await page.pause();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})();


