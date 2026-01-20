const fs = require('fs');
const path = require('path');

async function extractPDFUrlsFromTable(page, context, outputDir, rit, rows) {
  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfMapping = {};
  let downloadedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const indiceMov = parseInt(row.texto?.[0]) || i + 1;

    if (!row.forms || row.forms.length === 0) continue;

    pdfMapping[indiceMov] = { rojo: null, azul: null };

    for (let j = 0; j < row.forms.length; j++) {
      const selector = row.forms[j].selector;
      const tipo = j === 0 ? 'rojo' : 'azul';

      console.log(`⬇️ PDF ${tipo} mov ${indiceMov}`);

      const [response] = await Promise.all([
        page.waitForResponse(
          r => r.url().includes('docu') || r.url().includes('docCertificado'),
          { timeout: 20000 }
        ),
        page.evaluate(sel => {
          const el = document.querySelector(sel);
          if (el) el.querySelector('a').click();
        }, selector)
      ]);

      const buffer = await response.body();
      const filename = `${ritClean}_mov_${indiceMov}_${tipo}.pdf`;
      const savePath = path.join(outputDir, filename);

      fs.writeFileSync(savePath, buffer);

      if (fs.existsSync(savePath) && fs.statSync(savePath).size > 0) {
        pdfMapping[indiceMov][tipo] = filename;
        downloadedCount++;
        console.log(`   ✅ Guardado ${filename}`);
      }

      await page.waitForTimeout(1200);
    }
  }

  console.log(`✅ PDFs descargados: ${downloadedCount}`);
  return pdfMapping;
}

module.exports = { extractPDFUrlsFromTable, downloadPDFsFromTable: extractPDFUrlsFromTable };
