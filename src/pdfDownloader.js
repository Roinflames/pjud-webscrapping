const fs = require('fs');
const path = require('path');
const { log } = require('winston');

async function downloadPDFsFromTable(page, context, outputDir, rit) {
  console.log("🔎 Buscando iconos PDF en la tabla...");

  const pdfLinks = await page.$$(
    'a[onclick*="submit"] i.fa-file-pdf-o'
  );

  console.log(`📄 Se encontraron ${pdfLinks.length} PDFs.`);

  let index = 1;

  for (const icon of pdfLinks) {
    console.log(`⬇️ Descargando PDF ${index}...`);

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      icon.click()
    ]);

    await newPage.waitForLoadState("networkidle");

    const pdfUrl = newPage.url();
    const response = await newPage.request.get(pdfUrl);
    const buffer = await response.body();

    const filename = `${rit.replaceAll('-', '_')}_doc_${index}.pdf`;
    console.log(filename);
    
    const savePath = path.join(outputDir, filename);

    fs.writeFileSync(savePath, buffer);
    console.log(`✅ Guardado: ${savePath}`);

    await newPage.close();
    index++;
  }
}

module.exports = { downloadPDFsFromTable };
