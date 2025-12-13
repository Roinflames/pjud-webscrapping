// Script para procesar múltiples causas desde el CSV
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { readCausaCSV, mapCsvToDB } = require('./read-csv');
const { startBrowser } = require('./browser');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { fillForm, openDetalle } = require('./form');
const { extractTable } = require('./table');
const { exportToJSON, exportToCSV } = require('./exporter');
const { downloadPDFsFromTable } = require('./pdfDownloader');
const { saveErrorEvidence } = require('./utils');

// Función para extraer tipoCausa del RIT
function extractTipoCausa(rit) {
  if (!rit || rit === 'NULL') return null;
  // Formato: "C-13786-2018" -> "C"
  const match = rit.match(/^([A-Za-z0-9]+)-/);
  return match ? match[1] : null;
}

// Función para extraer rol y año del RIT
function extractRolAnio(rit) {
  if (!rit || rit === 'NULL') return { rol: null, año: null };
  // Formato: "C-13786-2018" -> rol: "13786", año: "2018"
  const parts = rit.split('-');
  if (parts.length >= 3) {
    return { rol: parts[1], año: parts[2] };
  }
  return { rol: null, año: null };
}

// Mapear datos del CSV a formato para scraping
// IMPORTANTE: Todas las causas con RIT son civiles (competencia = 3)
function csvToScrapingConfig(csvCausa) {
  const { rol, año } = extractRolAnio(csvCausa.rit);
  const tipoCausa = extractTipoCausa(csvCausa.rit);
  
  return {
    rit: csvCausa.rit,
    competencia: '3', // SIEMPRE Civil (todas las causas con RIT son civiles)
    corte: '90', // Default
    tribunal: csvCausa.tribunal || null, // Opcional, puede ser NULL
    tipoCausa: tipoCausa || 'C', // Extraído del RIT
    caratulado: csvCausa.caratulado,
    cliente: csvCausa.cliente,
    rut: csvCausa.rut,
    abogado_id: csvCausa.abogado_id,
    cuenta_id: csvCausa.cuenta_id,
    // Datos originales
    causa_id: csvCausa.causa_id,
    agenda_id: csvCausa.agenda_id
  };
}

// Procesar una causa individual
async function processCausa(page, context, config, outputDir) {
  try {
    console.log(`\n📋 Procesando causa: ${config.rit}`);
    console.log(`   Caratulado: ${config.caratulado || 'N/A'}`);
    
    await fillForm(page, config);
    await openDetalle(page);

    const rows = await extractTable(page);
    console.log(`   ✅ Extraídas ${rows.length} filas`);

    // Exportar resultados
    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    exportToJSON(rows, outputDir, ritClean);
    exportToCSV(rows, outputDir, ritClean);

    // Descargar PDFs
    await downloadPDFsFromTable(page, context, outputDir, ritClean);

    // Cerrar modal/detalle y volver al formulario
    try {
      // Intentar cerrar modal si existe
      const closeButtons = [
        'button.close',
        '.modal-header button',
        '[data-dismiss="modal"]',
        'button[aria-label="Close"]'
      ];
      
      for (const selector of closeButtons) {
        try {
          const closeBtn = await page.$(selector);
          if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(500);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Presionar ESC para cerrar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (error) {
      console.warn('   ⚠️ No se pudo cerrar modal:', error.message);
    }

    return { success: true, rows: rows.length };
  } catch (error) {
    console.error(`   ❌ Error procesando ${config.rit}:`, error.message);
    
    // Intentar cerrar modal/volver al formulario en caso de error
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      // Ignorar errores al cerrar
    }
    
    return { success: false, error: error.message };
  }
}

// Validar si una causa es válida para scraping
// IMPORTANTE: Todas las causas con RIT son civiles
function isValidForScraping(csvCausa) {
  // Debe tener RIT válido (formato: TIPO-ROL-AÑO)
  if (!csvCausa.rit || csvCausa.rit === 'NULL' || csvCausa.rit.trim() === '') {
    return false;
  }
  
  // Validar formato RIT (debe tener al menos 2 guiones)
  const parts = csvCausa.rit.split('-');
  if (parts.length < 3) {
    // RITs como "SIN ROL", "SOLEDAD SILV", "10187-2021" son inválidos
    return false;
  }
  
  // No necesitamos validar competencia porque todas las causas con RIT son civiles
  // Tribunal es opcional - el scraping puede funcionar sin él
  
  return true;
}

// Procesar múltiples causas
async function processMultipleCausas(limit = 10, requireTribunal = true) {
  console.log('📂 Leyendo CSV de causas...');
  const causas = readCausaCSV();
  
  // Filtrar solo las válidas para scraping
  let causasValidas = causas.filter(c => isValidForScraping(c));
  
  // Opcional: filtrar también por tribunal
  // NOTA: Tribunal es opcional, todas las causas con RIT son civiles
  if (requireTribunal) {
    const conTribunal = causasValidas.filter(c => 
      c.tribunal && c.tribunal !== 'NULL' && c.tribunal.trim() !== ''
    );
    console.log(`\n📊 Causas válidas: ${causasValidas.length}`);
    console.log(`   Con tribunal: ${conTribunal.length}`);
    console.log(`   Sin tribunal: ${causasValidas.length - conTribunal.length}`);
    console.log(`   ⚠️  Nota: Todas las causas con RIT son civiles (competencia = 3)`);
    causasValidas = conTribunal;
  } else {
    console.log(`\n📊 Causas válidas: ${causasValidas.length}`);
    console.log(`   ✅ Todas las causas con RIT son civiles (competencia = 3)`);
  }
  
  console.log(`\n📊 Causas válidas para procesar: ${causasValidas.length}`);
  console.log(`   Limitando a las primeras ${limit} causas\n`);
  
  const outputDir = path.resolve(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const logDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  
  const { browser, context, page } = await startBrowser(process.env.OJV_URL);
  
  try {
    // Verificar página inicial
    const bodyContent = await page.evaluate(() => document.body.innerText);
    if (!bodyContent || bodyContent.trim().length === 0) {
      throw new Error('La página está en blanco');
    }
    
    await closeModalIfExists(page);
    await page.waitForTimeout(1000 + Math.random() * 1000);
    
    // Navegar a consulta causas una sola vez
    await goToConsultaCausas(page);
    
    // Esperar a que el formulario esté completamente cargado
    await page.waitForSelector('#competencia', { timeout: 20000 });
    await page.waitForTimeout(1000);
    
    // Procesar cada causa
    const resultados = [];
    const causasAProcesar = causasValidas.slice(0, limit);
    
    for (let i = 0; i < causasAProcesar.length; i++) {
      const csvCausa = causasAProcesar[i];
      const config = csvToScrapingConfig(csvCausa);
      
      console.log(`\n[${i + 1}/${causasAProcesar.length}] Procesando causa ID: ${csvCausa.causa_id}`);
      
      const resultado = await processCausa(page, context, config, outputDir);
      resultados.push({
        causa_id: csvCausa.causa_id,
        rit: config.rit,
        ...resultado
      });
      
      // Si hubo error, esperar más tiempo antes de continuar
      if (!resultado.success) {
        console.log(`   ⚠️ Error en causa anterior, esperando más tiempo...`);
        await page.waitForTimeout(3000 + Math.random() * 2000);
      }
      
      // Delay entre causas (como humano: 2-4 segundos)
      if (i < causasAProcesar.length - 1) {
        const delay = 2000 + Math.random() * 2000;
        console.log(`   ⏳ Esperando ${Math.round(delay/1000)}s antes de la siguiente causa...`);
        await page.waitForTimeout(delay);
        
        // Verificar que estamos en el formulario (no navegar si ya estamos ahí)
        try {
          const competencia = await page.$('#competencia');
          const hasForm = competencia !== null && await competencia.isVisible();
          
          if (!hasForm) {
            const currentUrl = page.url();
            if (!currentUrl.includes('consulta') && !currentUrl.includes('causa')) {
              console.log('   🔄 Volviendo al formulario de consulta...');
              await goToConsultaCausas(page);
              await page.waitForSelector('#competencia', { timeout: 20000 });
              await page.waitForTimeout(1000);
            } else {
              // Estamos en la URL correcta pero el formulario no es visible (puede ser modal)
              console.log('   🔄 Cerrando modales para mostrar formulario...');
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
              await page.waitForSelector('#competencia', { timeout: 10000 });
            }
          } else {
            // Ya estamos en el formulario, solo asegurar que esté listo
            await page.waitForTimeout(500);
          }
        } catch (error) {
          console.warn('   ⚠️ No se pudo verificar formulario:', error.message);
        }
      }
    }
    
    // Resumen
    console.log('\n📊 Resumen de procesamiento:');
    const exitosas = resultados.filter(r => r.success).length;
    const fallidas = resultados.filter(r => !r.success).length;
    console.log(`   ✅ Exitosas: ${exitosas}`);
    console.log(`   ❌ Fallidas: ${fallidas}`);
    
    // Guardar log de resultados
    const logPath = path.join(logDir, `procesamiento_${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(resultados, null, 2));
    console.log(`\n📝 Log guardado en: ${logPath}`);
    
  } catch (error) {
    console.error('💥 Error general:', error);
    await saveErrorEvidence(
      page, 
      path.join(logDir, `error_${Date.now()}.png`),
      path.join(logDir, `error_${Date.now()}.html`)
    );
  } finally {
    await browser.close();
  }
}

// Ejecutar
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 5;
  console.log(`🚀 Iniciando procesamiento de ${limit} causas...\n`);
  processMultipleCausas(limit).catch(console.error);
}

module.exports = { processCausa, processMultipleCausas, csvToScrapingConfig };

