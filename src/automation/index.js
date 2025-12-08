require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { startBrowser } = require('./browser');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { fillForm, openDetalle } = require('./form');
const { extractTable } = require('./table');
const { downloadEbook } = require('./ebook');
const { saveErrorEvidence } = require('./utils');

(async () => {
  const logDir = path.resolve(__dirname, '../../logs');
  const ebookDir = path.resolve(__dirname, '../assets/ebook');
  const jsonPath = path.resolve(__dirname, '../config/pjud_config.json');

  [logDir, ebookDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  if (!fs.existsSync(jsonPath)) {
    console.error(`[ERROR] ❌ No se encontró configuración: ${jsonPath}`);
    process.exit(1);
  }

  const CONFIG = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

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

    await downloadEbook(page, context, CONFIG, ebookDir);

  } catch (err) {
    console.error('💥 Error:', err);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
  } finally {
    console.log('🧭 Proceso finalizado.');
    await browser.close();
  }
})();
