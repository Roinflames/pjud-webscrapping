const fs = require('fs');
const path = require('path');

// Extraer solo las URLs de los PDFs (sin descargarlos)
async function extractPDFUrlsFromTable(page, context, outputDir, rit) {
  console.log("🔎 Buscando URLs de PDFs en la tabla...");

  // DEBUG: Capturar estructura real de la tabla para entender el DOM
  const tableDebug = await page.evaluate(() => {
    // Buscar todas las tablas en el modal
    const modal = document.querySelector('#modalDetalleCivil, #modalDetalleLaboral, .modal.show');
    if (!modal) {
      return { error: 'No se encontró modal', tables: [] };
    }

    const tables = modal.querySelectorAll('table');
    const tableInfo = [];

    tables.forEach((table, tableIndex) => {
      const rows = table.querySelectorAll('tbody tr');
      const firstRow = rows[0];
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        const cellsInfo = Array.from(cells).map((cell, i) => ({
          index: i,
          text: cell.innerText.substring(0, 50).trim(),
          hasLinks: cell.querySelectorAll('a').length,
          hasImages: cell.querySelectorAll('img').length,
          hasIcons: cell.querySelectorAll('i').length,
          linksHTML: Array.from(cell.querySelectorAll('a')).map(a => a.outerHTML.substring(0, 150))
        }));
        tableInfo.push({
          tableIndex,
          className: table.className,
          rowCount: rows.length,
          cellCount: cells.length,
          cells: cellsInfo
        });
      }
    });

    return { modalId: modal.id, tables: tableInfo };
  });

  console.log("📊 DEBUG - Estructura de tablas en modal:");
  console.log(JSON.stringify(tableDebug, null, 2));

  // Obtener los datos de la tabla con información de PDFs (azul/rojo)
  // Usar extractTableAsArray para obtener información completa de los PDFs
  const { extractTableAsArray } = require('./table');
  const rows = await extractTableAsArray(page);

  console.log(`📊 DEBUG - Filas extraídas: ${rows.length}`);
  if (rows.length > 0) {
    console.log("📊 DEBUG - Primera fila:", JSON.stringify(rows[0], null, 2));
  }

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
      
      // Si no hay pdfs array, saltar (formato antiguo o sin PDFs)
      if (!row.pdfs || row.pdfs.length === 0) continue;
      
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
            // Nombre usando tipo_desc para claridad: _azul o _rojo
            // Azul = PDFs subidos por abogados (Principal)
            // Rojo = PDFs de la corte (Anexo/Escrito)
            const filename = `${ritClean}_mov_${indiceMov}_${pdf.tipo_desc}.pdf`;
            const savePath = path.join(outputDir, filename);
            await download.saveAs(savePath);
            
            if (fs.existsSync(savePath) && fs.statSync(savePath).size > 0) {
              console.log(`   ✅ Guardado: ${filename} (Tipo: ${pdf.tipo_desc} - ${pdf.tipo === 'P' ? 'Azul (Abogados)' : 'Rojo (Corte)'})`);
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

// Función legacy para compatibilidad (ahora solo extrae URLs)
async function downloadPDFsFromTable(page, context, outputDir, rit) {
  return await extractPDFUrlsFromTable(page, context, outputDir, rit);
}

module.exports = { extractPDFUrlsFromTable, downloadPDFsFromTable };
