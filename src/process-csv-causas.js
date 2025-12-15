// Script para procesar múltiples causas desde el CSV
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { readCausaCSV, mapCsvToDB } = require('./read-csv');
const { startBrowser } = require('./browser');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { fillForm, openDetalle } = require('./form');
const { extractTable, extractTableAsArray } = require('./table');
const { exportToJSON, exportToCSV } = require('./exporter');
const { downloadPDFsFromTable } = require('./pdfDownloader');
const { saveErrorEvidence } = require('./utils');
const { 
  saveCheckpoint, 
  loadCheckpoint, 
  clearCheckpoint, 
  isCausaProcessed,
  backupCheckpoint 
} = require('./utils/checkpoint');

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

    // Extraer movimientos estructurados del PJUD (rápido, sin esperas innecesarias)
    // Extraer ambas versiones en paralelo para optimizar
    const [movimientos, rowsArray] = await Promise.all([
      extractTable(page),
      extractTableAsArray(page)
    ]);
    console.log(`   ✅ Extraídas ${movimientos.length} movimientos`);

    // Exportar resultados (usar array para compatibilidad con formato actual)
    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    exportToJSON(rowsArray, outputDir, ritClean);
    exportToCSV(rowsArray, outputDir, ritClean);
    
    // Exportar movimientos estructurados en archivo separado
    const movimientosPath = path.join(outputDir, `movimientos_${ritClean}.json`);
    fs.writeFileSync(movimientosPath, JSON.stringify(movimientos, null, 2));
    console.log(`   📋 Movimientos estructurados guardados en: ${movimientosPath}`);

    // Extraer URLs de PDFs (sin descargarlos - optimización de recursos)
    const pdfStats = await downloadPDFsFromTable(page, context, outputDir, ritClean);

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
      
      // Presionar ESC para cerrar modal (optimizado)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200); // Reducido de 500ms a 200ms
    } catch (error) {
      console.warn('   ⚠️ No se pudo cerrar modal:', error.message);
    }

    return { 
      success: true, 
      rows: rowsArray.length,
      movimientos: movimientos.length,
      pdfs_urls_extraidas: pdfStats.exitosas,
      pdfs_urls_fallidas: pdfStats.fallidas,
      pdfs_total: pdfStats.total
    };
  } catch (error) {
    console.error(`   ❌ Error procesando ${config.rit}:`, error.message);
    
    // Intentar cerrar modal/volver al formulario en caso de error (optimizado)
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200); // Reducido de 500ms a 200ms
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
  
  // Si limit es 0 o negativo, procesar todas
  let causasAProcesar = limit > 0 ? causasValidas.slice(0, limit) : causasValidas;
  
  // Intentar cargar checkpoint para reanudar desde donde se quedó
  const checkpoint = loadCheckpoint();
  let startIndex = 0;
  let resultados = [];
  let startTime = Date.now();
  
  if (checkpoint) {
    console.log(`\n🔄 Reanudando desde checkpoint...`);
    
    // Verificar si el usuario quiere continuar desde el checkpoint
    const resumeFromCheckpoint = process.argv.includes('--resume') || process.argv.includes('-r');
    
    if (resumeFromCheckpoint) {
      // El checkpoint solo tiene causas exitosas, así que empezamos desde el siguiente índice
      startIndex = checkpoint.lastProcessedIndex + 1;
      resultados = checkpoint.resultados || []; // Solo resultados exitosos
      startTime = new Date(checkpoint.startTime).getTime();
      
      // Filtrar causas ya procesadas EXITOSAMENTE
      // Las causas que fallaron NO están en el checkpoint, así que se reintentarán
      const processedIds = new Set(
        (checkpoint.processedCausas || []).map(c => String(c.causa_id || c.rit))
      );
      
      const causasAntesFiltro = causasAProcesar.length;
      causasAProcesar = causasAProcesar.filter(c => {
        const causaId = String(c.causa_id || '');
        const rit = String(c.rit || '');
        return !processedIds.has(causaId) && !processedIds.has(rit);
      });
      
      const causasReintentar = causasAntesFiltro - causasAProcesar.length;
      
      console.log(`   ✅ Reanudando desde causa ${startIndex + 1}`);
      console.log(`   📋 Causas exitosas guardadas: ${checkpoint.stats.exitosas}`);
      console.log(`   🔄 Causas a reintentar: ${checkpoint.stats.reintentar || causasReintentar}`);
      console.log(`   📋 Causas restantes: ${causasAProcesar.length}`);
      console.log(`   💡 Para empezar desde cero, elimina: src/logs/checkpoints/last_checkpoint.json\n`);
    } else {
      console.log(`   ⚠️  Checkpoint encontrado pero no se está reanudando automáticamente.`);
      console.log(`   💡 Para reanudar desde el checkpoint, ejecuta con: --resume o -r`);
      console.log(`   💡 Para empezar desde cero, elimina: src/logs/checkpoints/last_checkpoint.json\n`);
      
      // Si no se especifica --resume, preguntar o empezar desde cero
      // Por ahora, empezamos desde cero si no se especifica --resume
      clearCheckpoint();
      console.log(`   🆕 Iniciando desde cero...\n`);
    }
  }
  
  console.log(`\n📊 Causas válidas para procesar: ${causasValidas.length}`);
  if (limit > 0) {
    console.log(`   Procesando las primeras ${limit} causas`);
  } else {
    console.log(`   Procesando TODAS las causas (${causasAProcesar.length})`);
  }
  if (startIndex > 0) {
    console.log(`   🔄 Reanudando desde índice ${startIndex}\n`);
  } else {
    console.log(`\n`);
  }
  
  const outputDir = path.resolve(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const logDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  
  // Modo headless (sin vista) por defecto
  const { browser, context, page } = await startBrowser(process.env.OJV_URL, { 
    headless: true, 
    slowMo: 50 // Más rápido en headless
  });
  
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
    await page.waitForSelector('#competencia', { timeout: 30000 }); // Aumentado de 20s a 30s
    await page.waitForTimeout(500); // Reducido de 1000ms a 500ms
    
    // Procesar cada causa (startIndex ya está configurado si hay checkpoint)
    const totalCausas = causasAProcesar.length + startIndex;
    
    for (let i = 0; i < causasAProcesar.length; i++) {
      const globalIndex = startIndex + i;
      const csvCausa = causasAProcesar[i];
      const config = csvToScrapingConfig(csvCausa);
      
      // Calcular progreso y tiempo estimado
      const progreso = ((globalIndex + 1) / totalCausas * 100).toFixed(1);
      const tiempoTranscurrido = (Date.now() - startTime) / 1000; // segundos
      const causasProcesadasHastaAhora = resultados.length;
      const tiempoPromedioPorCausa = causasProcesadasHastaAhora > 0 
        ? tiempoTranscurrido / causasProcesadasHastaAhora 
        : 0;
      const tiempoRestante = (tiempoPromedioPorCausa * (causasAProcesar.length - i - 1)) / 60; // minutos
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${globalIndex + 1}/${totalCausas}] Progreso: ${progreso}%`);
      if (tiempoRestante > 0) {
        console.log(`⏱️  Tiempo estimado restante: ${tiempoRestante.toFixed(1)} minutos`);
      }
      console.log(`📋 Procesando causa ID: ${csvCausa.causa_id} | RIT: ${config.rit}`);
      
      const resultado = await processCausa(page, context, config, outputDir);
      const resultadoCompleto = {
        causa_id: csvCausa.causa_id,
        agenda_id: csvCausa.agenda_id,
        rit: config.rit,
        caratulado: config.caratulado,
        cliente: config.cliente,
        rut: config.rut,
        tribunal: config.tribunal,
        ...resultado
      };
      resultados.push(resultadoCompleto);
      
      // Guardar checkpoint después de cada causa procesada
      // IMPORTANTE: Solo guarda causas exitosas, las fallidas se reintentarán
      saveCheckpoint({
        lastProcessedIndex: globalIndex,
        totalCausas: totalCausas,
        processedCausas: causasAProcesar.slice(0, i + 1).map(c => ({
          causa_id: c.causa_id,
          rit: c.rit
        })),
        resultados: resultados, // Incluye todos, pero el checkpoint solo guarda exitosas
        causasAProcesar: causasAProcesar,
        startTime: startTime
      });
      
      // Si falló, mostrar mensaje de que se reintentará
      if (!resultado.success) {
        console.log(`   ⚠️ Esta causa falló y se reintentará al reanudar desde checkpoint`);
      }
      
      // Mostrar resumen parcial cada 10 causas
      if ((globalIndex + 1) % 10 === 0) {
        const exitosasParciales = resultados.filter(r => r.success).length;
        const fallidasParciales = resultados.filter(r => !r.success).length;
        console.log(`\n📊 Resumen parcial (${globalIndex + 1}/${totalCausas}):`);
        console.log(`   ✅ Exitosas: ${exitosasParciales} | ❌ Fallidas: ${fallidasParciales}`);
      }
      
      // Verificar CAPTCHA o bloqueo después de cada causa
      const { detectCaptcha, checkIfBlocked, handleCaptchaOrBlock } = require('./utils/captcha-detector');
      const captchaCheck = await detectCaptcha(page);
      const blockCheck = await checkIfBlocked(page);
      
      if (captchaCheck.detected || blockCheck.blocked) {
        console.error(`\n❌ CAPTCHA/Bloqueo detectado después de procesar causa ${globalIndex + 1}`);
        console.error(`   Tipo: ${captchaCheck.detected ? captchaCheck.type : 'bloqueo'}`);
        console.error(`   Razón: ${blockCheck.blocked ? blockCheck.reason : captchaCheck.selector || captchaCheck.keyword || 'desconocido'}`);
        
        // Guardar checkpoint antes de intentar recuperar
        saveCheckpoint({
          lastProcessedIndex: globalIndex,
          totalCausas: totalCausas,
          processedCausas: causasAProcesar.slice(0, i + 1).map(c => ({
            causa_id: c.causa_id,
            rit: c.rit
          })),
          resultados: resultados,
          causasAProcesar: causasAProcesar,
          startTime: startTime
        });
        backupCheckpoint(); // Backup adicional
        
        // Intentar manejar el bloqueo
        const recovered = await handleCaptchaOrBlock(page, 'CAPTCHA/Bloqueo detectado');
        
        if (!recovered) {
          console.error('\n💥 No se pudo recuperar del bloqueo. Deteniendo scraping.');
          console.error('   Recomendación: Esperar 1-2 horas antes de continuar o usar VPN/proxy.');
          console.error(`\n💾 Checkpoint guardado. Para reanudar más tarde, ejecuta:`);
          console.error(`   node src/process-csv-causas.js ${limit || 0} --resume`);
          
          // Guardar causas pendientes
          const causasPendientes = causasAProcesar.slice(i + 1);
          if (causasPendientes.length > 0) {
            const pendientesPath = path.join(logDir, `causas_pendientes_${Date.now()}.json`);
            fs.writeFileSync(pendientesPath, JSON.stringify(causasPendientes, null, 2));
            console.log(`\n📝 Causas pendientes guardadas en: ${pendientesPath}`);
          }
          
          break; // Detener el scraping
        }
      }
      
      // Si hubo error, esperar más tiempo antes de continuar
      if (!resultado.success) {
        console.log(`   ⚠️ Error en causa anterior, esperando más tiempo...`);
        await page.waitForTimeout(3000 + Math.random() * 2000); // Aumentado a 3-5s
      }
      
      // Delay entre causas aumentado significativamente para evitar bloqueos (5-15 segundos)
      if (i < causasAProcesar.length - 1) {
        const delay = 5000 + Math.random() * 10000; // Aumentado a 5-15s para evitar bloqueos
        console.log(`   ⏳ Esperando ${Math.round(delay/1000)}s antes de la siguiente causa (anti-bloqueo)...`);
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
              await page.waitForSelector('#competencia', { timeout: 20000 }); // Aumentado de 10s a 20s
              await page.waitForTimeout(300);
            } else {
              // Estamos en la URL correcta pero el formulario no es visible (puede ser modal)
              console.log('   🔄 Cerrando modales para mostrar formulario...');
              await page.keyboard.press('Escape');
              await page.waitForTimeout(200);
              await page.waitForSelector('#competencia', { timeout: 20000 }); // Aumentado de 8s a 20s
            }
          } else {
            // Ya estamos en el formulario, solo asegurar que esté listo
            await page.waitForTimeout(200); // Reducido de 500ms a 200ms
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
    
    // Limpiar checkpoint si se completó todo
    if (resultados.length >= totalCausas) {
      clearCheckpoint();
      console.log(`\n✅ Proceso completado. Checkpoint eliminado.`);
    }
    
    // Guardar log completo de resultados
    const logPath = path.join(logDir, `procesamiento_${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(resultados, null, 2));
    console.log(`\n📝 Log completo guardado en: ${logPath}`);
    
    // Guardar JSON específico con solo las causas fallidas
    const causasFallidas = resultados.filter(r => !r.success);
    if (causasFallidas.length > 0) {
      const fallidasPath = path.join(logDir, `causas_fallidas_${Date.now()}.json`);
      fs.writeFileSync(fallidasPath, JSON.stringify(causasFallidas, null, 2));
      console.log(`\n❌ Causas fallidas guardadas en: ${fallidasPath}`);
      console.log(`   Total fallidas: ${causasFallidas.length}`);
      
      // También guardar en outputs para fácil acceso
      const fallidasOutputPath = path.join(outputDir, 'causas_fallidas.json');
      fs.writeFileSync(fallidasOutputPath, JSON.stringify(causasFallidas, null, 2));
      console.log(`   También guardado en: ${fallidasOutputPath}`);
    } else {
      console.log(`\n✅ ¡Todas las causas se procesaron exitosamente!`);
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
    
    // Guardar checkpoint antes de cerrar en caso de error
    if (resultados && resultados.length > 0) {
      try {
        saveCheckpoint({
          lastProcessedIndex: startIndex + resultados.length - 1,
          totalCausas: totalCausas || causasAProcesar.length,
          processedCausas: causasAProcesar.slice(0, resultados.length).map(c => ({
            causa_id: c.causa_id,
            rit: c.rit
          })),
          resultados: resultados,
          causasAProcesar: causasAProcesar,
          startTime: startTime
        });
        backupCheckpoint();
        console.error(`\n💾 Checkpoint guardado antes de cerrar por error.`);
        console.error(`   Para reanudar: node src/process-csv-causas.js ${limit || 0} --resume`);
      } catch (checkpointError) {
        console.warn('⚠️ No se pudo guardar checkpoint:', checkpointError.message);
      }
    }
    
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
  // Si no se pasa argumento o se pasa 0, procesar todas las causas
  const limitArg = process.argv[2];
  const limit = limitArg ? parseInt(limitArg) : 0;
  
  if (limit === 0) {
    console.log(`🚀 Iniciando procesamiento de TODAS las causas (modo headless)...\n`);
  } else {
    console.log(`🚀 Iniciando procesamiento de ${limit} causas (modo headless)...\n`);
  }
  
  processMultipleCausas(limit, false).catch(console.error); // requireTribunal = false para procesar todas
}

module.exports = { processCausa, processMultipleCausas, csvToScrapingConfig };

