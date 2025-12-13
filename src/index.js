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

  // Verificar que existe OJV_URL
  if (!process.env.OJV_URL) {
    console.error('❌ ERROR: No se encontró OJV_URL en .env');
    console.log('💡 Ejecuta: node setup-env.js');
    console.log('   O crea manualmente un archivo .env con:');
    console.log('   OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php');
    process.exit(1);
  }

  const screenshotPath = path.join(logDir, `pjud_error_${Date.now()}.png`);
  const htmlPath = path.join(logDir, `pjud_error_${Date.now()}.html`);

  console.log('🌐 URL configurada:', process.env.OJV_URL);
  const { browser, context, page } = await startBrowser(process.env.OJV_URL);

  try {
    console.log('🌐 Página cargada:', page.url());
    console.log('📄 Título:', await page.title());

    // Verificar que la página no esté en blanco
    const bodyContent = await page.evaluate(() => document.body.innerText);
    if (!bodyContent || bodyContent.trim().length === 0) {
      throw new Error('La página está en blanco. Verifica la URL y la conexión.');
    }
    console.log('✅ Página tiene contenido');

    await closeModalIfExists(page);
    
    // Esperar menos tiempo
    await page.waitForTimeout(500);
    
    await goToConsultaCausas(page);
    await fillForm(page, CONFIG);
    await openDetalle(page);

    // Screenshot antes de extraer tabla
    await page.screenshot({ path: 'debug_11_antes_extraer_tabla.png', fullPage: false });
    console.log('📸 Screenshot: debug_11_antes_extraer_tabla.png');

    const rows = await extractTable(page);
    console.log('📊 Datos extraídos:', rows.length, 'filas');
    if (rows.length > 0) {
      console.log('Primera fila:', rows[0]);
    }

    // Exportar resultados
    const outputDir = path.resolve(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const { exportToJSON, exportToCSV } = require('./exporter');

    exportToJSON(rows, outputDir, CONFIG.rit);
    exportToCSV(rows, outputDir, CONFIG.rit);

    // DESCARGAR PDFs de la tabla
    const { downloadPDFsFromTable } = require('./pdfDownloader');
    await downloadPDFsFromTable(page, context, outputDir, CONFIG.rit);

    // Descargar eBook
    // await downloadEbook(page, context, CONFIG, ebookDir);
    
    console.log('✅ Scraping completado exitosamente!');
    console.log('📊 Resultados guardados en:', outputDir);
    
    // Pausa opcional - Comentar esta línea si no quieres pausa
    // console.log('⏸️ Pausando para revisión (presiona Enter para continuar)...');
    // await page.pause();
  } catch (err) {
    console.error('💥 Error:', err);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
    // No hacer pause aquí para que se cierre el navegador
  } finally {
    console.log('🧭 Proceso finalizado.');
    await browser.close();
  }
})();
