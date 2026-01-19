const fs = require('fs');
const path = require('path');

async function downloadEbook(page, context, CONFIG, ebookDir) {
  console.log("📘 Buscando enlace de eBook...");

  try {
    await page.waitForSelector('form[action*="newebookcivil.php"] a[title*="Ebook"]', { timeout: 10000 });

    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 20000 }),
      page.click('form[action*="newebookcivil.php"] a[title*="Ebook"]').catch(() => {}),
    ]);

    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(2000);

    const pdfUrl = newPage.url();
    console.log(`📄 URL eBook: ${pdfUrl}`);

    if (!pdfUrl || pdfUrl === ':' || !pdfUrl.startsWith('http')) {
      console.warn('⚠️ URL de eBook inválida, se omitirá la descarga');
      await newPage.close();
      return null;
    }

    const response = await newPage.request.get(pdfUrl);
    const buffer = await response.body();

    if (buffer && buffer.slice(0, 4).toString() === '%PDF') {
      const ritClean = CONFIG.rit.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${ritClean}_ebook.pdf`;
      const savePath = path.join(ebookDir, fileName);

      fs.writeFileSync(savePath, buffer);
      console.log(`✅ Ebook descargado: ${fileName}`);
      await newPage.close();
      return fileName;
    } else {
      console.warn('⚠️ El contenido descargado no parece ser un PDF válido');
      await newPage.close();
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ No se pudo descargar el eBook: ${error.message}`);
    return null;
  }
}

module.exports = { downloadEbook };
