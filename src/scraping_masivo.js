require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { startBrowser, delay } = require('./browser');
const { processRit } = require('./processRit');
const { saveLastRit, getLastRit, resetState } = require('./ritState');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { readCausaCSV } = require('./read-csv');
const { isValidForScraping, csvToScrapingConfig, loadTribunalToCorteMap } = require('./process-csv-causas');

const STATE_FILE = path.resolve(__dirname, 'rit_state.json');

/**
 * Carga la lista de RITs válidos desde el CSV (causa.csv)
 * Usa la misma lógica de validación que process-csv-causas.js
 */
function loadRitList() {
  console.log('📂 Leyendo CSV de causas...');
  
  // Cargar mapeo de tribunales a cortes
  console.log('🔍 Cargando mapeo de tribunales a cortes...');
  loadTribunalToCorteMap();
  
  const causas = readCausaCSV();
  
  // Filtrar solo las válidas para scraping
  let causasValidas = causas.filter(c => isValidForScraping(c));
  
  // Mostrar estadísticas
  const causasConTribunal = causasValidas.filter(c => {
    const tribunal = c.tribunal || c.tribunal_id || c.juzgado || c.juzgado_id;
    return tribunal && tribunal !== 'NULL' && String(tribunal).trim() !== '';
  });
  
  console.log(`\n📊 Causas válidas: ${causasValidas.length}`);
  console.log(`   Con tribunal/juzgado: ${causasConTribunal.length}`);
  console.log(`   Sin tribunal/juzgado: ${causasValidas.length - causasConTribunal.length}`);
  
  // Filtrar solo las que tienen tribunal (requerido)
  causasValidas = causasValidas.filter(c => {
    const tribunal = c.tribunal || c.tribunal_id || c.juzgado || c.juzgado_id;
    return tribunal && tribunal !== 'NULL' && String(tribunal).trim() !== '';
  });
  
  const causasDescartadas = causas.length - causasValidas.length;
  if (causasDescartadas > 0) {
    console.log(`   ⚠️  Se descartaron ${causasDescartadas} causas por falta de TRIBUNAL/JUZGADO`);
  }
  
  console.log(`\n✅ Total de causas válidas para procesar: ${causasValidas.length}\n`);
  
  // Convertir a formato de configuración para scraping
  return causasValidas.map(csvCausa => csvToScrapingConfig(csvCausa));
}

(async () => {
  console.log('🚀 Iniciando procesamiento de lista de RITs\n');

  // Crear directorios necesarios
  const logDir = path.resolve(__dirname, 'logs');
  const outputDir = path.resolve(__dirname, 'outputs');
  [logDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Cargar lista de RITs
  const ritList = loadRitList();
  console.log(`📋 Se encontraron ${ritList.length} RITs en la lista\n`);

  // Obtener último RIT procesado
  const lastRit = getLastRit();
  let startIndex = 0;

  if (lastRit) {
    console.log(`📍 Último RIT procesado: ${lastRit}`);
    startIndex = ritList.findIndex(rit => rit.rit === lastRit);
    
    if (startIndex === -1) {
      console.log('⚠️ El último RIT no se encuentra en la lista. Iniciando desde el principio.');
      startIndex = 0;
    } else {
      startIndex += 1; // Continuar desde el siguiente
      console.log(`▶️ Continuando desde el RIT ${startIndex + 1} de ${ritList.length}\n`);
    }
  } else {
    console.log('🆕 Iniciando desde el principio (no se encontró estado previo)\n');
  }

  if (startIndex >= ritList.length) {
    console.log('✅ Todas las causas ya han sido procesadas.');
    console.log('💡 Para reiniciar, elimina el archivo:', STATE_FILE);
    process.exit(0);
  }

  // URL por defecto
  const url = process.env.OJV_URL || 'https://oficinajudicialvirtual.pjud.cl/home/index.php';
  
  console.log('🌐 Iniciando navegador...');
  const { browser, context, page } = await startBrowser(url);

  try {
    console.log('🌐 Página cargada:', page.url());
    await delay(2000);

    // Navegar a consulta de causas una vez al inicio
    console.log('\n📌 Navegando a Consulta causas...');
    await closeModalIfExists(page);
    await goToConsultaCausas(page);
    await delay(3000); // Aumentado para hacer consultas más lentas

    const remainingRits = ritList.slice(startIndex);
    let successCount = 0;
    let errorCount = 0;

    console.log(`\n📊 Procesando ${remainingRits.length} RITs restantes...\n`);

    for (let i = 0; i < remainingRits.length; i++) {
      const ritConfig = remainingRits[i];
      const currentIndex = startIndex + i + 1;
      
      console.log(`\n[${currentIndex}/${ritList.length}] Procesando causa: ${ritConfig.rit}`);
      if (ritConfig.caratulado) {
        console.log(`   Caratulado: ${ritConfig.caratulado}`);
      }

      const success = await processRit(page, context, ritConfig, outputDir, logDir);
      
      if (success) {
        successCount++;
        // Guardar checkpoint después de cada causa exitosa
        saveLastRit(ritConfig.rit);
        console.log(`💾 Checkpoint guardado: última causa procesada = ${ritConfig.rit}`);
      } else {
        errorCount++;
        // Guardar checkpoint incluso si hay error, para poder continuar desde el siguiente
        saveLastRit(ritConfig.rit);
        console.log(`⚠️ Error en causa ${ritConfig.rit}, pero checkpoint guardado. Puedes continuar desde la siguiente causa más tarde.`);
      }

      // Pausa entre causas (excepto la última) - Aumentada para respetar límite de búsqueda
      if (i < remainingRits.length - 1) {
        console.log('\n⏸️  Pausa de 5 segundos antes de la siguiente causa (respetando límite de 200 búsquedas)...');
        await delay(5000); // Aumentado de 3 a 5 segundos
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN FINAL');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📋 Total procesados: ${successCount + errorCount} de ${ritList.length}`);
    
    if (successCount + errorCount === ritList.length) {
      console.log('\n🎉 Todas las causas han sido procesadas!');
      console.log('💡 Para reiniciar, elimina el archivo:', STATE_FILE);
    }

  } catch (err) {
    console.error('\n💥 Error crítico:', err);
  } finally {
    console.log('\n⏸️  Pausando ejecución... Puedes revisar la página.');
    console.log('   Presiona cualquier tecla en la consola para continuar y cerrar el navegador.');
    await page.pause();
    console.log('🧭 Cerrando navegador...');
    await delay(1000);
    await browser.close();
    console.log('👋 Proceso finalizado.');
  }
})();
