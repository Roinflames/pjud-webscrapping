const fs = require('fs');
const path = require('path');

/**
 * Convierte un archivo a base64
 * @param {string} filePath - Ruta del archivo
 * @returns {string|null} - String base64 o null si hay error
 */
function fileToBase64(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.warn(`⚠️ Error convirtiendo a base64: ${error.message}`);
    return null;
  }
}

/**
 * Descarga PDFs de la tabla y los convierte a base64
 * @param {Page} page - Página de Playwright
 * @param {BrowserContext} context - Contexto del navegador
 * @param {string} outputDir - Directorio de salida (opcional, para backup)
 * @param {string} rit - RIT de la causa
 * @returns {Object} - Mapeo de PDFs con base64 incluido
 */
async function extractPDFUrlsFromTable(page, context, outputDir, rit) {
  console.log("🔎 Buscando y descargando PDFs de la tabla...");

  const { extractTableAsArray } = require('./table');
  const rows = await extractTableAsArray(page);
  
  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfMapping = {};
  let downloadedCount = 0;

  // Crear directorio temporal si no existe
  const tempDir = outputDir || path.join(__dirname, 'outputs', 'pdfs_temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (const row of rows) {
    if (!row.pdfs || row.pdfs.length === 0) continue;

    const folio = row.datos_limpios?.folio || row.texto[0];
    const indiceMov = parseInt(row.texto[0]) || null;
    if (!indiceMov) continue;
    
    pdfMapping[indiceMov] = { 
      azul: null, 
      rojo: null,
      azul_base64: null,
      rojo_base64: null,
      azul_nombre: null,
      rojo_nombre: null
    };

    for (const pdf of row.pdfs) {
      try {
        console.log(`⬇️ Descargando PDF ${pdf.tipo_desc} del movimiento ${indiceMov}...`);

        const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
        
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
          const filename = `${ritClean}_mov_${indiceMov}_${pdf.tipo_desc}.pdf`;
          const savePath = path.join(tempDir, filename);
          await download.saveAs(savePath);
          
          if (fs.existsSync(savePath) && fs.statSync(savePath).size > 0) {
            // Convertir a base64
            const base64Content = fileToBase64(savePath);
            
            if (base64Content) {
              const tipoKey = pdf.tipo_desc; // 'azul' o 'rojo'
              pdfMapping[indiceMov][tipoKey] = savePath;
              pdfMapping[indiceMov][`${tipoKey}_base64`] = base64Content;
              pdfMapping[indiceMov][`${tipoKey}_nombre`] = filename;
              
              console.log(`   ✅ PDF convertido a base64: ${filename} (${Math.round(base64Content.length / 1024)}KB)`);
              downloadedCount++;
            }
          }
        } else {
          console.warn(`   ⚠️ No se detectó descarga para PDF ${pdf.tipo_desc} de movimiento ${indiceMov}`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Error descargando PDF ${pdf.tipo} de movimiento ${indiceMov}: ${error.message}`);
      }
      await page.waitForTimeout(1000);
    }
  }

  console.log(`✅ Proceso completado: ${downloadedCount} PDFs descargados y convertidos a base64`);
  return pdfMapping;
}

/**
 * Asocia los PDFs base64 a los movimientos
 * @param {Array} movimientos - Array de movimientos
 * @param {Object} pdfMapping - Mapeo de PDFs con base64
 * @returns {Array} - Movimientos con PDFs base64 incluidos
 */
function asociarPDFsBase64AMovimientos(movimientos, pdfMapping) {
  return movimientos.map(mov => {
    const indice = mov.indice || mov.folio;
    const pdfData = pdfMapping[indice];
    
    if (pdfData) {
      return {
        ...mov,
        pdf_azul: pdfData.azul_base64 ? {
          nombre: pdfData.azul_nombre,
          base64: pdfData.azul_base64,
          tipo: 'application/pdf'
        } : null,
        pdf_rojo: pdfData.rojo_base64 ? {
          nombre: pdfData.rojo_nombre,
          base64: pdfData.rojo_base64,
          tipo: 'application/pdf'
        } : null,
        tiene_pdf_azul: !!pdfData.azul_base64,
        tiene_pdf_rojo: !!pdfData.rojo_base64
      };
    }
    
    return {
      ...mov,
      pdf_azul: null,
      pdf_rojo: null,
      tiene_pdf_azul: false,
      tiene_pdf_rojo: false
    };
  });
}

/**
 * Función legacy para compatibilidad
 */
async function downloadPDFsFromTable(page, context, outputDir, rit) {
  return await extractPDFUrlsFromTable(page, context, outputDir, rit);
}

module.exports = { 
  extractPDFUrlsFromTable, 
  downloadPDFsFromTable,
  asociarPDFsBase64AMovimientos,
  fileToBase64
};
