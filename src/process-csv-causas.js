require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { startBrowser } = require('./browser');
const { downloadPDFsFromTable } = require('./pdfDownloader');
const { downloadEbook } = require('./ebook');
const { fillForm, openDetalle, resetForm } = require('./form');
const { extractTable } = require('./table');
const { closeModalIfExists } = require('./navigation');
const { saveErrorEvidence } = require('./utils');
const { readCausaCSV } = require('./read-csv');
const { processTableData } = require('./dataProcessor');
const { importarAMovimientosIntermedia } = require('./importar_intermedia_sql');

const PROGRESS_FILE = path.resolve(__dirname, 'progress.json');
const DAILY_LIMIT_FILE = path.resolve(__dirname, 'daily_count.json');
const DEFAULT_DAILY_LIMIT = 150;

/**
 * Mapear datos del CSV a formato para scraping
 */
function csvToScrapingConfig(csvCausa) {
  return {
    rit: csvCausa.rit || `${csvCausa.rol}-${csvCausa.anio}`,
    competencia: csvCausa.competencia_id || '3',
    corte: csvCausa.corte_id || '90',
    tribunal: csvCausa.tribunal_id || '',
    tipoCausa: csvCausa.tipo_causa || 'C'
  };
}

/**
 * Validar si una causa es válida para scraping
 */
function isValidForScraping(csvCausa) {
  const rit = csvCausa.rit || (csvCausa.rol && csvCausa.anio);
  if (!rit) return false;
  return true;
}

/**
 * Guardar progreso del scraping
 */
function saveProgress(rit, causaId) {
  const progress = {
    lastRit: rit,
    lastCausaId: causaId,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Cargar progreso anterior
 */
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Procesar una sola causa (versión actualizada)
 */
async function processCausaBatch(page, context, config, outputDir) {
  try {
    console.log(`📝 Llenando formulario para RIT: ${config.rit}...`);
    await fillForm(page, config);
    await openDetalle(page);

    // 1. Extraer tabla con el nuevo formato (9 columnas + icons)
    const rows = await extractTable(page);
    if (!rows || rows.length === 0) {
      throw new Error('No se pudieron extraer movimientos de la tabla');
    }

    // 2. Descargar PDFs (azul/rojo)
    const pdfMapping = await downloadPDFsFromTable(page, context, outputDir, config.rit) || {};

    // 3. Descargar eBook
    await downloadEbook(page, context, config, outputDir);

    // 4. Identificar y clonar PDF de demanda
    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    let demandaNombre = null;
    const movDemanda = rows.find(r => 
      r.texto && r.texto[5] && r.texto[5].toLowerCase().includes('demanda')
    );
    if (movDemanda) {
      const indiceMov = parseInt(movDemanda.texto[0]) || null;
      if (indiceMov && pdfMapping[indiceMov] && pdfMapping[indiceMov].azul) {
        const pdfPrincipal = pdfMapping[indiceMov].azul;
        const oldPath = path.join(outputDir, pdfPrincipal);
        const newPath = path.join(outputDir, `${ritClean}_demanda.pdf`);
        if (fs.existsSync(oldPath)) {
          fs.copyFileSync(oldPath, newPath);
          demandaNombre = `${ritClean}_demanda.pdf`;
          console.log(`   ✅ PDF de demanda guardado: ${demandaNombre}`);
        }
      }
    }

    // 5. Verificar si existe el eBook
    const ebookNombre = fs.existsSync(path.join(outputDir, `${ritClean}_ebook.pdf`)) 
      ? `${ritClean}_ebook.pdf` 
      : null;

    // 6. Procesar datos para SQL
    const datosProcesados = processTableData(rows, config.rit, pdfMapping);
    
     // 7. Importar a la tabla intermedia SQL local (y guardar SQL en archivo)
     // El parámetro 'true' indica que también se deben guardar los SQL en archivos
     await importarAMovimientosIntermedia(config.rit, datosProcesados, config, pdfMapping, true, demandaNombre, ebookNombre);

    return { success: true };
  } catch (error) {
    console.error(`   ❌ Error en RIT ${config.rit}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Función principal para procesar N causas
 */
async function processMultipleCausas(limit = 5) {
  const logDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const checkpointDir = path.join(logDir, 'checkpoints');
  if (!fs.existsSync(checkpointDir)) fs.mkdirSync(checkpointDir, { recursive: true });

  console.log(`🚀 Iniciando scraping masivo...`);
  console.log(`📊 Límite: ${limit === 0 ? 'TODAS las causas' : limit} causas`);
  
  const causas = readCausaCSV();
  let causasValidas = causas.filter(c => isValidForScraping(c));
  
  // Opcional: filtrar también por tribunal (comentado por defecto)
  const requireTribunal = false; // Cambiar a true si quieres solo causas con tribunal
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
  
  const { browser, context, page } = await startBrowser('https://oficinajudicialvirtual.pjud.cl/indexN.php');
  
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
  
  try {
    // Manejo inicial de sesión
    await closeModalIfExists(page);
    const currentUrl = page.url();
    
    if (currentUrl.includes('home/index.php')) {
      console.log('🔐 Estableciendo sesión de invitado...');
      await page.evaluate(async () => {
        const response = await fetch('../includes/sesion-invitado.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'nombreAcceso=CC'
        });
        localStorage.setItem('logged-in', 'true');
        return response.ok;
      });
      await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', { waitUntil: 'domcontentloaded' });
    }

    // Esperar a que el formulario esté completamente cargado
    await page.waitForSelector('#competencia', { timeout: 30000 });
    await page.waitForTimeout(500);
    
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
      
      const resultado = await processCausaBatch(page, context, config, outputDir);
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
      
      // Verificar CAPTCHA o bloqueo después de cada causa - NOTIFICAR Y DETENER (NO reintentar)
      const { detectCaptcha, checkIfBlocked } = require('./utils/captcha-detector');
      const captchaCheck = await detectCaptcha(page);
      const blockCheck = await checkIfBlocked(page);
      
      // Solo detener si es CAPTCHA activo o bloqueo real (NO reintentar automáticamente)
      if ((captchaCheck.detected && captchaCheck.type === 'recaptcha-active') || blockCheck.blocked) {
        const errorType = captchaCheck.detected ? captchaCheck.type : blockCheck.reason;
        
        console.error('\n🚨 ============================================');
        console.error('🚨 BLOQUEO/CAPTCHA DETECTADO - DETENIENDO');
        console.error('🚨 ============================================');
        console.error(`\n❌ Causa procesada: ${globalIndex + 1}/${totalCausas}`);
        console.error(`❌ Tipo: ${errorType}`);
        console.error(`📋 Razón: ${blockCheck.blocked ? blockCheck.reason : captchaCheck.type}`);
        console.error('\n📝 ACCIÓN REQUERIDA:');
        console.error('   1. Espera 30-60 minutos antes de reintentar');
        console.error('   2. Considera usar una VPN o cambiar tu IP');
        console.error('   3. Reduce la velocidad de scraping si continúas');
        console.error('   4. Verifica manualmente en el navegador si el bloqueo persiste');
        console.error('\n⏸️  El proceso se ha detenido para evitar empeorar el bloqueo.');
        console.error('🚨 ============================================\n');
        
        // Guardar checkpoint antes de detener
        saveCheckpoint({
          lastProcessedIndex: globalIndex,
          totalCausas: totalCausas,
          processedCausas: causasAProcesar.slice(0, i + 1).map(c => ({
            causa_id: c.causa_id,
            rit: c.rit
          })),
          resultados: resultados,
          causasAProcesar: causasAProcesar,
          startTime: startTime,
          detenido_por_bloqueo: true
        });
        backupCheckpoint(); // Backup adicional
        
        // Guardar causas pendientes
        const causasPendientes = causasAProcesar.slice(i + 1);
        if (causasPendientes.length > 0) {
          const pendientesPath = path.join(logDir, `causas_pendientes_${Date.now()}.json`);
          fs.writeFileSync(pendientesPath, JSON.stringify(causasPendientes, null, 2));
          console.error(`   📋 Causas pendientes guardadas en: ${pendientesPath}`);
        }
        
        console.error(`\n💾 Checkpoint guardado. Para reanudar más tarde, ejecuta:`);
        console.error(`   node src/process-csv-causas.js ${limit || 0} --resume`);
        
        // Guardar screenshot para diagnóstico
        const screenshotPath = path.join(logDir, `bloqueo_causa_${globalIndex + 1}_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        console.error(`   📸 Screenshot guardado: ${screenshotPath}`);
        
        await browser.close();
        throw new Error(`Bloqueo/CAPTCHA detectado - Deteniendo ejecución: ${errorType}`);
      } else if (captchaCheck.detected) {
        // Solo advertencia si no está realmente activo
        console.warn(`   ⚠️ Script de reCAPTCHA detectado pero inactivo, continuando...`);
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
    console.log('\n🏁 Fin de la prueba de 5 causas.');
  }
}

if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 5;
  processMultipleCausas(limit).catch(console.error);
}

module.exports = { processMultipleCausas };
