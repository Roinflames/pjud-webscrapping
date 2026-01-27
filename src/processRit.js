const fs = require('fs');
const path = require('path');

const { fillForm, openDetalle } = require('./form');
const { extractTable } = require('./table');
const { downloadPDFsFromTable } = require('./pdfDownloader');
const { downloadEbook } = require('./ebook');
const { processTableData } = require('./dataProcessor');
const { saveCausaJSON, appendCausaNDJSON, upsertIndex } = require('./jsonStore');
const { saveErrorEvidence } = require('./utils');

/**
 * Extrae rol y año del RIT
 */
function extractRolAnio(rit) {
  if (!rit || rit === 'NULL') return { rol: null, año: null };
  // Formato: "C-13786-2018" o "16707-2019" -> rol: "13786", año: "2018"
  const parts = rit.split('-');
  if (parts.length >= 3) {
    return { rol: parts[1], año: parts[2] };
  } else if (parts.length === 2) {
    // Formato sin tipo: "16707-2019"
    return { rol: parts[0], año: parts[1] };
  }
  return { rol: null, año: null };
}

/**
 * Extraer datos básicos de la tabla de resultados (Rol, Fecha, Caratulado)
 */
async function extractResultadosBasicos(page, config) {
  try {
    await page.waitForTimeout(1500);
    try {
      await page.waitForSelector('table tbody tr, #tablaConsultas tbody tr, table tr', { 
        timeout: 10000,
        state: 'attached'
      });
    } catch (error) {
      console.warn('   ⚠️ Tabla no encontrada con waitForSelector, intentando extraer directamente...');
    }
    
    const datos = await page.evaluate((ritBuscado, rolBuscado) => {
      const tables = document.querySelectorAll('table, #tablaConsultas');
      
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
        
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length < 3) continue;
          
          const rowText = row.innerText || '';
          const contieneRIT = rowText.includes(ritBuscado);
          const contieneRol = rolBuscado && rowText.includes(rolBuscado);
          
          if (contieneRIT || contieneRol) {
            let rol = '';
            let fecha = '';
            let caratulado = '';
            
            const ritMatch = rowText.match(/([A-Z])-(\d+)-(\d{4})/);
            if (ritMatch) {
              rol = ritMatch[2];
            } else if (rolBuscado) {
              rol = rolBuscado;
            }
            
            for (let i = 0; i < cells.length; i++) {
              const text = cells[i].innerText.trim();
              if (!text) continue;
              
              if (!fecha) {
                const fechaMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
                if (fechaMatch) {
                  fecha = fechaMatch[0];
                }
              }
              
              if (!caratulado && text.length > 10 && 
                  !text.match(/^\d+$/) && 
                  !text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/) &&
                  !text.match(/\d{4}[\/\-]\d{2}[\/\-]\d{2}/) &&
                  !text.match(/^[A-Z]-\d+-\d{4}$/) &&
                  !text.match(/^[A-Z]$/)) {
                caratulado = text;
              }
            }
            
            if (!rol) {
              for (let i = 0; i < cells.length; i++) {
                const text = cells[i].innerText.trim();
                if (text && /^\d{4,}$/.test(text) && text !== ritBuscado.split('-')[2]) {
                  rol = text;
                  break;
                }
              }
            }
            
            return { rol, fecha, caratulado, encontrado: true };
          }
        }
      }
      
      return { rol: null, fecha: null, caratulado: null, encontrado: false };
    }, config.rit, config.rol);
    
    if (!datos.encontrado || !datos.rol) {
      datos.rol = config.rol || datos.rol || '';
      datos.caratulado = config.caratulado || datos.caratulado || '';
    }
    
    return datos;
  } catch (error) {
    console.warn(`   ⚠️ Error extrayendo datos básicos: ${error.message}`);
    return {
      rol: config.rol || '',
      fecha: null,
      caratulado: config.caratulado || '',
      encontrado: false
    };
  }
}

/**
 * Procesa un RIT individual completo
 * @param {Object} page - Playwright Page
 * @param {Object} context - Playwright Context
 * @param {Object} ritConfig - Configuración del RIT desde rit_list.json
 * @param {string} outputDir - Directorio de salida
 * @param {string} logDir - Directorio de logs
 * @returns {boolean} true si fue exitoso, false si hubo error
 */
async function processRit(page, context, ritConfig, outputDir, logDir) {
  try {
    console.log(`   📋 RIT: ${ritConfig.rit}`);
    
    // Extraer rol y año del RIT si no están en config
    const { rol, año } = extractRolAnio(ritConfig.rit);
    const tipoCausa = ritConfig.tipoCausa || (ritConfig.rit.match(/^([A-Za-z0-9]+)-/) ? ritConfig.rit.match(/^([A-Za-z0-9]+)-/)[1] : 'C');
    
    // Crear config completo para scraping
    const config = {
      rit: ritConfig.rit,
      competencia: ritConfig.competencia || '3',
      corte: ritConfig.corte || '90',
      tribunal: ritConfig.tribunal || '0',
      tipoCausa: tipoCausa,
      rol: ritConfig.rol || rol,
      año: ritConfig.año || año,
      caratulado: ritConfig.caratulado || null,
    };

    // Llenar formulario y buscar
    await fillForm(page, config);
    
    // Extraer datos básicos
    const datosBasicos = await extractResultadosBasicos(page, config);
    console.log(`   ✅ Datos básicos: Rol=${datosBasicos.rol || 'N/A'}, Fecha=${datosBasicos.fecha || 'N/A'}`);

    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    const datosAGuardar = {
      rol: datosBasicos.rol || config.rol || '',
      fecha: datosBasicos.fecha || '',
      caratulado: datosBasicos.caratulado || config.caratulado || ''
    };

    // Abrir detalle usando token JWT
    console.log(`   🔍 Abriendo detalle...`);
    try {
      const onclickToken = await page.evaluate((ritBuscado) => {
        const tables = document.querySelectorAll('table, #tablaConsultas');
        
        for (const table of tables) {
          const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
          
          for (const row of rows) {
            const rowText = row.innerText || '';
            if (!rowText) continue;

            const partes = ritBuscado.split('-');
            const rolRit = partes.length >= 2 ? partes[1] : null;
            const coincideRit = rowText.includes(ritBuscado);
            const coincideRol = rolRit && rowText.includes(rolRit);

            if (coincideRit || coincideRol) {
              const link = row.querySelector('a[onclick*="detalleCausaCivil"]') 
                        || row.querySelector('a.toggle-modal[title*="Detalle"]') 
                        || row.querySelector('a[href="#modalDetalleCivil"]');

              if (link) {
                const onclickAttr = link.getAttribute('onclick') || '';
                const match = onclickAttr.match(/detalleCausaCivil\('([^']+)'/);
                if (match && match[1]) {
                  return match[1];
                }
              }

              const icon = row.querySelector('i.fa-search.fa-lg, i.fa-search');
              if (icon) {
                const parentLink = icon.closest('a');
                if (parentLink) {
                  const onclickAttr = parentLink.getAttribute('onclick') || '';
                  const match = onclickAttr.match(/detalleCausaCivil\('([^']+)'/);
                  if (match && match[1]) {
                    return match[1];
                  }
                }
              }
            }
          }
        }
        return null;
      }, config.rit);

      if (onclickToken) {
        console.log('   ✅ Token encontrado, ejecutando detalleCausaCivil...');
        await page.evaluate((token) => {
          if (typeof window.detalleCausaCivil === 'function') {
            window.detalleCausaCivil(token);
          } else if (typeof detalleCausaCivil === 'function') {
            detalleCausaCivil(token);
          }
        }, onclickToken);
      } else {
        console.log('   ⚠️ No se encontró token, intentando click directo...');
        await page.click('a[onclick*="detalleCausaCivil"], a[href="#modalDetalleCivil"], i.fa-search').catch(() => {
          throw new Error('No se pudo encontrar el enlace de detalle');
        });
      }
    } catch (error) {
      console.error(`   ❌ Error abriendo detalle: ${error.message}`);
      throw error;
    }
    
    // Esperar modal
    console.log(`   ⏳ Esperando modal...`);
    await page.waitForSelector('#modalDetalleCivil table, #modalDetalleLaboral table, .modal-body table', { 
      timeout: 20000 
    });
    await page.waitForTimeout(1500);
    console.log(`   ✅ Modal abierto`);
    
    // Extraer tabla
    console.log(`   📊 Extrayendo movimientos...`);
    const rows = await extractTable(page);
    console.log(`   ✅ ${rows.length} movimientos extraídos`);

    // Descargar PDFs
    const pdfDir = path.join(outputDir, 'pdf');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    console.log(`   📄 Descargando PDFs...`);
    const pdfMapping = await downloadPDFsFromTable(page, context, pdfDir, ritClean) || {};
    console.log(`   ✅ PDFs descargados: ${Object.keys(pdfMapping).length} movimientos con PDFs`);

    // Descargar eBook
    console.log(`   📚 Descargando eBook...`);
    await downloadEbook(page, context, config, pdfDir);
    
    // Identificar demanda y eBook
    let demandaNombre = null;
    let ebookNombre = null;
    
    const movDemanda = rows.find(r => {
      if (r.raw && Array.isArray(r.raw) && r.raw.length > 5) {
        return r.raw[5] && r.raw[5].toLowerCase().includes('demanda');
      }
      if (r.descripcion) {
        return r.descripcion.toLowerCase().includes('demanda');
      }
      return false;
    });
    
    if (movDemanda) {
      const folioDemanda = movDemanda.folio || (movDemanda.raw && movDemanda.raw[0]);
      if (folioDemanda && pdfMapping[folioDemanda] && pdfMapping[folioDemanda].azul) {
        demandaNombre = pdfMapping[folioDemanda].azul;
      }
    }
    
    const ebookPath = path.join(pdfDir, `${ritClean}_ebook.pdf`);
    if (fs.existsSync(ebookPath)) {
      ebookNombre = `${ritClean}_ebook.pdf`;
    }

    // Procesar datos
    const datosProcesados = processTableData(rows, config.rit, pdfMapping);

    // Crear payload
    const payload = {
      rit: config.rit,
      metadata: {
        processed_at: new Date().toISOString(),
        total_movimientos: Array.isArray(datosProcesados.movimientos) ? datosProcesados.movimientos.length : 0,
        tiene_documentos_pdf: !!pdfMapping && Object.keys(pdfMapping).length > 0,
        tiene_demanda: !!demandaNombre,
        tiene_ebook: !!ebookNombre,
      },
      config_entrada: ritConfig,
      datos_basicos: datosAGuardar,
      demanda: demandaNombre,
      ebook: ebookNombre,
      pdf_mapping: pdfMapping,
      cabecera: datosProcesados.cabecera,
      estado_actual: datosProcesados.estado_actual,
      movimientos: datosProcesados.movimientos,
      partes: datosProcesados.partes,
    };

    // Guardar JSON
    const jsonPath = saveCausaJSON(outputDir, config.rit, payload);
    console.log(`   ✅ JSON guardado: ${path.basename(jsonPath)}`);

    appendCausaNDJSON(outputDir, payload);

    upsertIndex(outputDir, {
      rit: config.rit,
      processed_at: payload.metadata.processed_at,
      caratulado: payload.cabecera?.caratulado || payload.datos_basicos?.caratulado || null,
      tribunal: payload.cabecera?.juzgado || payload.config_entrada?.tribunal || null,
      estado: payload.estado_actual?.estado || null,
      fecha_ultimo_mov: payload.estado_actual?.fecha_ultimo_movimiento || null,
      total_movimientos: payload.metadata.total_movimientos,
      tiene_pdf: payload.metadata.tiene_documentos_pdf,
      tiene_demanda: payload.metadata.tiene_demanda,
      tiene_ebook: payload.metadata.tiene_ebook,
    });

    // Cerrar modal
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (error) {
      console.warn('   ⚠️ No se pudo cerrar modal:', error.message);
    }

    console.log(`   ✅ RIT procesado exitosamente`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error procesando RIT ${ritConfig.rit}:`, error.message);
    
    // Guardar evidencia
    const screenshotPath = path.join(logDir, `error_${ritConfig.rit.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`);
    const htmlPath = path.join(logDir, `error_${ritConfig.rit.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
    
    // Intentar cerrar modal
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      // Ignorar
    }
    
    return false;
  }
}

module.exports = { processRit };
