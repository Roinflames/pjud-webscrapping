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
 * @param {Array} rows - Filas ya extraídas (opcional, si no se pasan se extraen)
 * @returns {Object} - Mapeo de PDFs con base64 incluido
 */
async function extractPDFUrlsFromTable(page, context, outputDir, rit, rows = null) {
  console.log("🔎 Buscando y descargando PDFs de la tabla...");

  const { extractTableAsArray } = require('./table');
  if (!rows) {
    rows = await extractTableAsArray(page);
  }
  
  console.log(`📊 Filas extraídas: ${rows.length}`);
  const filasConForms = rows.filter(r => r.forms && r.forms.length > 0).length;
  console.log(`📋 Filas con forms: ${filasConForms}`);
  
  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfMapping = {};
  let downloadedCount = 0;

  // Crear directorio temporal si no existe
  const tempDir = outputDir || path.join(__dirname, 'outputs', 'pdfs_temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log(`📋 Total de filas con datos: ${rows.length}`);
  let filasConPDFs = 0;
  
  for (const row of rows) {
    if (!row.pdfs || row.pdfs.length === 0) {
      continue;
    }

    filasConPDFs++;
    const folio = row.datos_limpios?.folio || row.texto[0];
    const indiceMov = parseInt(row.texto[0]) || null;
    if (!indiceMov) {
      console.log(`   ⚠️ No se pudo obtener índice del movimiento para folio: ${folio}`);
      continue;
    }
    
    const tieneForms = row.forms && row.forms.length > 0;
    const tieneLinks = row.pdfLinks && row.pdfLinks.length > 0;
    
    console.log(`   📄 Movimiento ${indiceMov} (folio: ${folio}): ${tieneForms ? row.forms.length + ' forms' : ''} ${tieneLinks ? row.pdfLinks.length + ' enlaces' : ''}, ${row.pdfs.length} PDFs`);
    
    if (!tieneForms && !tieneLinks) {
      console.log(`   ⚠️ Fila sin forms ni enlaces de PDF: folio=${folio}`);
      continue;
    }
    
    pdfMapping[indiceMov] = { 
      azul: null, 
      rojo: null,
      azul_base64: null,
      rojo_base64: null,
      azul_nombre: null,
      rojo_nombre: null
    };

    // Si hay forms, usarlos; si no, usar los enlaces
    for (let pdfIndex = 0; pdfIndex < row.pdfs.length; pdfIndex++) {
      const pdf = row.pdfs[pdfIndex];
      if (!pdf) continue;

      try {
        console.log(`   ⬇️ Descargando PDF ${pdf.tipo_desc} del movimiento ${indiceMov} (${pdf.source || 'form'} ${pdfIndex + 1}/${row.pdfs.length})...`);

        const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
        
        let clickResult;
        
        if (tieneForms && pdf.source === 'form') {
          // Método 1: Usar forms
          const form = row.forms[pdfIndex];
          clickResult = await page.evaluate(({ folioValue, formIndex: idx }) => {
            const trs = document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr');
            const row = Array.from(trs).find(tr => {
              const firstCell = tr.querySelector('td');
              return firstCell && firstCell.innerText.trim() === String(folioValue);
            });
            
            if (!row) {
              return { success: false, error: 'Fila no encontrada' };
            }
            
            const forms = Array.from(row.querySelectorAll('form'));
            if (!forms[idx]) {
              return { success: false, error: `Form ${idx} no encontrado (hay ${forms.length} forms)` };
            }
            
            const form = forms[idx];
            let clickable = form.querySelector('i[onclick], i.fa-file-pdf-o, i.fa-file-pdf');
            if (!clickable) clickable = form.querySelector('a[onclick], a[href]');
            if (!clickable) clickable = form.querySelector('button[type="submit"], input[type="submit"], button');
            if (!clickable) clickable = form.querySelector('[onclick]');
            
            if (clickable) {
              clickable.click();
              return { success: true, element: clickable.tagName, method: 'form-click' };
            } else {
              try {
                form.submit();
                return { success: true, method: 'form-submit' };
              } catch (e) {
                return { success: false, error: 'No se pudo hacer submit: ' + e.message };
              }
            }
          }, { folioValue: String(folio), formIndex: pdfIndex });
        } else {
          // Método 2: Usar enlaces de la segunda columna (td:nth-child(2) a)
          clickResult = await page.evaluate(({ folioValue, linkIndex }) => {
            const trs = document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr');
            const row = Array.from(trs).find(tr => {
              const firstCell = tr.querySelector('td');
              return firstCell && firstCell.innerText.trim() === String(folioValue);
            });
            
            if (!row) {
              return { success: false, error: 'Fila no encontrada' };
            }
            
            // Buscar enlaces en la segunda columna (donde suelen estar los PDFs)
            const secondTd = row.querySelector('td:nth-child(2)');
            if (!secondTd) {
              return { success: false, error: 'Segunda columna no encontrada' };
            }
            
            // Buscar todos los enlaces e iconos clickeables
            const links = Array.from(secondTd.querySelectorAll('a[onclick], a[href*="pdf"], a[href*="documento"], i[onclick], i.fa-file-pdf-o, i.fa-file-pdf'));
            
            if (!links[linkIndex]) {
              return { success: false, error: `Enlace ${linkIndex} no encontrado (hay ${links.length} enlaces)` };
            }
            
            const link = links[linkIndex];
            link.click();
            return { success: true, element: link.tagName, method: 'link-click', hasOnclick: !!link.getAttribute('onclick') };
          }, { folioValue: String(folio), linkIndex: pdfIndex });
        }

        if (!clickResult.success) {
          console.warn(`      ⚠️ No se pudo hacer click: ${clickResult.error}`);
          continue;
        }
        
        console.log(`      ✅ Click ejecutado (${clickResult.method || clickResult.element})`);

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
              
              const sizeKB = Math.round(base64Content.length / 1024);
              console.log(`      ✅ PDF descargado y convertido a base64: ${filename} (${sizeKB}KB)`);
              downloadedCount++;
            } else {
              console.warn(`      ⚠️ PDF descargado pero no se pudo convertir a base64: ${filename}`);
            }
          } else {
            console.warn(`      ⚠️ PDF descargado pero archivo vacío o no existe: ${savePath}`);
          }
        } else {
          console.warn(`      ⚠️ No se detectó evento de descarga para PDF ${pdf.tipo_desc} de movimiento ${indiceMov} (timeout 20s)`);
        }
      } catch (error) {
        console.warn(`      ❌ Error descargando PDF ${pdf.tipo_desc} de movimiento ${indiceMov}: ${error.message}`);
        console.warn(`         Stack: ${error.stack}`);
      }
      await page.waitForTimeout(1500);
    }
  }

  console.log(`\n📊 Resumen de descarga de PDFs:`);
  console.log(`   - Filas procesadas: ${filasConPDFs}`);
  console.log(`   - PDFs descargados: ${downloadedCount}`);
  console.log(`   - Movimientos con PDFs: ${Object.keys(pdfMapping).filter(k => pdfMapping[k].azul_base64 || pdfMapping[k].rojo_base64).length}`);
  
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
async function downloadPDFsFromTable(page, context, outputDir, rit, rows = null) {
  return await extractPDFUrlsFromTable(page, context, outputDir, rit, rows);
}

module.exports = { 
  extractPDFUrlsFromTable, 
  downloadPDFsFromTable,
  asociarPDFsBase64AMovimientos,
  fileToBase64
};
