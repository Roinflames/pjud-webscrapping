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

  const screenshotPath = path.join(logDir, `pjud_error_${Date.now()}.png`);
  const htmlPath = path.join(logDir, `pjud_error_${Date.now()}.html`);

  const { browser, context, page } = await startBrowser(process.env.OJV_URL);

  try {
    console.log('🌐 Página cargada:', page.url());

    await closeModalIfExists(page);
    await goToConsultaCausas(page);
    await fillForm(page, CONFIG);
    await openDetalle(page);

    const rows = await extractTable(page);
    console.log(rows);

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
  } catch (err) {
    console.error('💥 Error:', err);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
  } finally {
    await page.pause();
    console.log('🧭 Proceso finalizado.');
    await browser.close();
  }
})();
