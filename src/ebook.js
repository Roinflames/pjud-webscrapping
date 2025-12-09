const fs = require('fs');
const path = require('path');

async function downloadEbook(page, context, CONFIG, ebookDir) {
  console.log("📘 Buscando enlace de eBook...");

  await page.waitForSelector('form[action*="newebookcivil.php"] a[title*="Ebook"]', { timeout: 8000 });

  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('form[action*="newebookcivil.php"] a[title*="Ebook"]').catch(() => {}),
  ]);

  await newPage.waitForLoadState('networkidle');

  const pdfUrl = newPage.url();
  console.log(`📄 URL eBook: ${pdfUrl}`);

  const response = await newPage.request.get(pdfUrl);
  const buffer = await response.body();

  const fileName = `ebook_${CONFIG.rit.replace('-', '_')}_${Date.now()}.pdf`;
  const savePath = path.join(ebookDir, fileName);

  fs.writeFileSync(savePath, buffer);

  console.log(`✅ Ebook descargado: ${savePath}`);

  await newPage.close();
}

module.exports = { downloadEbook };
