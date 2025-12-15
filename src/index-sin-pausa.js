// Versión del script SIN pausas automáticas
// Útil si quieres que se ejecute completamente sin interrupciones

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { startBrowser } = require('./browser');
const { loadConfig } = require('./config');
const { downloadEbook } = require('./ebook');
const { fillForm, openDetalle } = require('./form');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { extractTable } = require('./table');
const { saveErrorEvidence } = require('./utils');

(async () => {
  const logDir = path.resolve(__dirname, 'logs');
  const ebookDir = path.resolve(__dirname, 'assets/ebook');
  const jsonPath = path.resolve(__dirname, 'config/pjud_config.json');

  [logDir, ebookDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  if (!fs.existsSync(jsonPath)) {
    console.error(`[ERROR] ❌ No se encontró configuración: ${jsonPath}`);
    process.exit(1);
  }

  const CONFIG = loadConfig();

  if (!process.env.OJV_URL) {
    console.error('❌ ERROR: No se encontró OJV_URL en .env');
    console.log('💡 Ejecuta: node setup-env.js');
    process.exit(1);
  }

  const screenshotPath = path.join(logDir, `pjud_error_${Date.now()}.png`);
  const htmlPath = path.join(logDir, `pjud_error_${Date.now()}.html`);

  console.log('🌐 URL configurada:', process.env.OJV_URL);
  const { browser, context, page } = await startBrowser(process.env.OJV_URL);

  try {
    console.log('🌐 Página cargada:', page.url());
    console.log('📄 Título:', await page.title());

    const bodyContent = await page.evaluate(() => document.body.innerText);
    if (!bodyContent || bodyContent.trim().length === 0) {
      throw new Error('La página está en blanco. Verifica la URL y la conexión.');
    }
    console.log('✅ Página tiene contenido');

    await closeModalIfExists(page);
    await page.waitForTimeout(1000);
    
    await goToConsultaCausas(page);
    await fillForm(page, CONFIG);
    await openDetalle(page);

    const rows = await extractTable(page);
    console.log('📊 Datos extraídos:', rows.length, 'filas');

    const outputDir = path.resolve(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const { exportToJSON, exportToCSV } = require('./exporter');

    exportToJSON(rows, outputDir, CONFIG.rit);
    exportToCSV(rows, outputDir, CONFIG.rit);

    const { downloadPDFsFromTable } = require('./pdfDownloader');
    await downloadPDFsFromTable(page, context, outputDir, CONFIG.rit);

    console.log('✅ Scraping completado exitosamente!');
    console.log('📊 Resultados guardados en:', outputDir);
    
  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error('Stack:', err.stack);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
  } finally {
    console.log('🧭 Cerrando navegador...');
    await browser.close();
    console.log('✅ Proceso finalizado.');
  }
})();


