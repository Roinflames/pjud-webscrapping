const fs = require('fs');

async function saveErrorEvidence(page, screenshotPath, htmlPath) {
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    fs.writeFileSync(htmlPath, await page.content());

    console.error(`📸 Screenshot: ${screenshotPath}`);
    console.error(`🧾 HTML: ${htmlPath}`);
  } catch (err) {
    console.error('⚠️ No se pudo guardar evidencia:', err);
  }
}

module.exports = { saveErrorEvidence };
