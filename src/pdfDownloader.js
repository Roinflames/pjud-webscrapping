const fs = require('fs');
const path = require('path');

async function downloadPDFsFromTable(page, context, outputDir, rit) {
  console.log("🔎 Buscando iconos PDF en la tabla...");

  // Obtener los datos de la tabla que ya extrajimos para saber qué PDFs corresponden a qué fila
  const { extractTable } = require('./table');
  const rows = await extractTable(page);
  
  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfMapping = {};
  let downloadedCount = 0;

    for (const row of rows) {
      if (!row.pdfs || row.pdfs.length === 0) continue;

      // Usar el folio como índice (es el primer elemento de texto)
      const folio = row.datos_limpios?.folio || row.texto[0];
      // También necesitamos el índice numérico del movimiento para el mapeo
      const indiceMov = parseInt(row.texto[0]) || null;
      if (!indiceMov) continue; // Saltar si no hay índice válido
      
      pdfMapping[indiceMov] = { azul: null, rojo: null };

      for (const pdf of row.pdfs) {
        try {
          console.log(`⬇️ Descargando PDF ${pdf.tipo} del movimiento ${indiceMov}...`);

          // Preparar para la descarga
          const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
          
          // Hacer click usando el folio para encontrar la fila y el linkIndex para el enlace específico
          await page.evaluate(({ folioValue, linkIndex }) => {
            const trs = document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr');
            const row = Array.from(trs).find(tr => {
              const firstCell = tr.querySelector('td');
              return firstCell && firstCell.innerText.trim() === folioValue;
            });
            if (row) {
              const links = row.querySelectorAll('td:nth-child(2) a');
              if (links[linkIndex]) links[linkIndex].click();
            }
          }, { folioValue: folio, linkIndex: pdf.linkIndex });

          const download = await downloadPromise;
          if (download) {
            // Nombre con abreviatura: _P (Principal) o _A (Anexo)
            const filename = `${ritClean}_mov_${indiceMov}_${pdf.tipo}.pdf`;
            const savePath = path.join(outputDir, filename);
            await download.saveAs(savePath);
            
            if (fs.existsSync(savePath) && fs.statSync(savePath).size > 0) {
              console.log(`   ✅ Guardado: ${filename} (Tipo: ${pdf.tipo_desc})`);
              pdfMapping[indiceMov][pdf.tipo_desc] = filename;
              downloadedCount++;
            }
          } else {
            console.warn(`   ⚠️ No se detectó descarga para PDF ${pdf.tipo_desc} de movimiento ${indiceMov}`);
          }
        } catch (error) {
          console.warn(`   ⚠️ Error descargando PDF ${pdf.tipo} de movimiento ${indiceMov}: ${error.message}`);
        }
        await page.waitForTimeout(1000); // Esperar entre clics
      }
    }

  console.log(`✅ Proceso de descarga completado: ${downloadedCount} PDFs descargados`);
  return pdfMapping;
}

module.exports = { downloadPDFsFromTable };
