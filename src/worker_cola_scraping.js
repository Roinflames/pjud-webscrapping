/**
 * WORKER DE COLA DE SCRAPING
 * 
 * ⚠️ STANDARD COMPLIANCE: This worker now delegates scraping to processCausa engine.
 * See docs/scraping-standard.md for the single-engine rule.
 * 
 * This worker:
 * - Listens to pjud_cola_scraping table
 * - Converts queue items to ScrapingConfig
 * - Calls processCausa (the engine) for scraping
 * - Post-processes: imports to intermedia table, marks queue items as done
 * 
 * Uso:
 *   node src/worker_cola_scraping.js
 *   node src/worker_cola_scraping.js --interval 5000  (cada 5 segundos)
 *   node src/worker_cola_scraping.js --once            (procesa uno y termina)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { startBrowser } = require('./browser');
const { goToConsultaCausas } = require('./navigation');
const { processCausa } = require('./process-causas');
const { importarAMovimientosIntermedia } = require('./importar_intermedia_sql');
const { validarParaScraping } = require('./utils/validacion-pjud');
const { crearTablaCola } = require('./utils/crear-tabla-cola');

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

// Configuración del worker
const INTERVAL_MS = process.argv.includes('--interval') 
  ? parseInt(process.argv[process.argv.indexOf('--interval') + 1]) || 10000
  : 10000; // 10 segundos por defecto

const MODO_ONCE = process.argv.includes('--once');
const MAX_INTENTOS = 3;

let isRunning = true;
let browser = null;
let context = null;
let page = null;

/**
 * Conectar a la base de datos
 */
async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

/**
 * Obtener siguiente RIT pendiente de la cola
 */
async function obtenerSiguienteRIT(connection) {
  const [rows] = await connection.query(`
    SELECT * FROM pjud_cola_scraping
    WHERE estado = 'PENDIENTE'
    ORDER BY fecha_creacion ASC
    LIMIT 1
  `);
  
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Marcar RIT como procesando
 */
async function marcarProcesando(connection, rit) {
  await connection.query(`
    UPDATE pjud_cola_scraping
    SET estado = 'PROCESANDO',
        fecha_procesamiento = NOW(),
        intentos = intentos + 1
    WHERE rit = ? AND estado = 'PENDIENTE'
  `, [rit]);
}

/**
 * Marcar RIT como completado
 */
async function marcarCompletado(connection, rit, exito, errorMessage = null) {
  if (exito) {
    await connection.query(`
      UPDATE pjud_cola_scraping
      SET estado = 'COMPLETADO',
          fecha_completado = NOW(),
          error_message = NULL
      WHERE rit = ?
    `, [rit]);
  } else {
    await connection.query(`
      UPDATE pjud_cola_scraping
      SET estado = 'ERROR',
          fecha_completado = NOW(),
          error_message = ?
      WHERE rit = ?
    `, [errorMessage || 'Error desconocido', rit]);
  }
}

/**
 * Procesar un RIT (ejecutar scraping)
 */
async function procesarRIT(colaItem) {
  const connection = await getConnection();
  
  try {
    console.log(`\n🔄 Procesando RIT: ${colaItem.rit}`);
    console.log(`   - Competencia: ${colaItem.competencia_id}`);
    console.log(`   - Corte: ${colaItem.corte_id}`);
    console.log(`   - Tribunal: ${colaItem.tribunal_id || 'No especificado'}`);
    
    // Validar datos antes de procesar
    const causaParaValidar = {
      rit: colaItem.rit,
      competencia: colaItem.competencia_id,
      corte: colaItem.corte_id,
      tribunal: colaItem.tribunal_id,
      tipoCausa: colaItem.tipo_causa,
      causa_id: colaItem.id || null
    };

    const validacion = validarParaScraping(causaParaValidar);

    if (!validacion.puedeProcesar) {
      console.log(`   ❌ Causa descartada: ${validacion.motivo}`);
      await marcarCompletado(connection, colaItem.rit, false, validacion.motivo);
      return; // Saltar esta causa
    }

    // Marcar como procesando
    await marcarProcesando(connection, colaItem.rit);
    
    // Usar configuración validada
    const scrapingConfig = validacion.config;
    
    // Inicializar navegador si no está abierto
    if (!browser) {
      console.log('🌐 Iniciando navegador...');
      const browserData = await startBrowser(process.env.OJV_URL || 'https://oficinajudicialvirtual.pjud.cl/indexN.php');
      browser = browserData.browser;
      context = browserData.context;
      page = browserData.page;
      
      // Navegar a consulta causas
      await goToConsultaCausas(page);
    }
    
    // ✅ DELEGATE TO ENGINE: Use processCausa for all scraping
    const outputDir = path.resolve(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`📝 Ejecutando scraping para RIT: ${scrapingConfig.rit} (via processCausa engine)...`);
    const resultado = await processCausa(page, context, scrapingConfig, outputDir);
    
    if (!resultado.success) {
      throw new Error(resultado.error || 'Error desconocido en scraping');
    }
    
    // Post-process: Read JSON generated by processCausa and import to intermedia table
    const ritClean = scrapingConfig.rit.replace(/[^a-zA-Z0-9]/g, '_');
    const jsonPath = path.join(outputDir, 'causas', `${ritClean}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON generado por processCausa no encontrado en: ${jsonPath}`);
    }
    
    const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    // Identificar demanda y ebook desde el payload
    const demandaNombre = payload.demanda || null;
    const ebookNombre = payload.ebook || null;
    
    // Importar a SQL intermedia (con guardado de SQL)
    await importarAMovimientosIntermedia(
      scrapingConfig.rit, 
      {
        movimientos: payload.movimientos || [],
        cabecera: payload.cabecera || {},
        estado_actual: payload.estado_actual || {}
      }, 
      scrapingConfig, 
      payload.pdf_mapping || {}, 
      true,  // guardarSQL
      demandaNombre, 
      ebookNombre
    );
    
    // Marcar como completado
    await marcarCompletado(connection, colaItem.rit, true);
    console.log(`✅ RIT ${colaItem.rit} procesado exitosamente`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error procesando RIT ${colaItem.rit}:`, error.message);
    
    // Marcar como error
    await marcarCompletado(connection, colaItem.rit, false, error.message);
    
    // Si no ha excedido intentos, podría reintentar más tarde
    if (colaItem.intentos < MAX_INTENTOS) {
      console.log(`   ⚠️ Se reintentará más tarde (intento ${colaItem.intentos + 1}/${MAX_INTENTOS})`);
    }
    
    return false;
  } finally {
    await connection.end();
  }
}

/**
 * Ciclo principal del worker
 */
async function ejecutarCiclo() {
  const connection = await getConnection();
  
  try {
    const siguienteRIT = await obtenerSiguienteRIT(connection);
    
    if (siguienteRIT) {
      await procesarRIT(siguienteRIT);
    } else {
      console.log('⏳ No hay RITs pendientes en la cola...');
    }
  } catch (error) {
    console.error('❌ Error en ciclo del worker:', error.message);
  } finally {
    await connection.end();
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando Worker de Cola de Scraping...');
  console.log(`   - Intervalo: ${INTERVAL_MS}ms`);
  console.log(`   - Modo: ${MODO_ONCE ? 'Una vez' : 'Continuo'}`);
  console.log(`   - Base de datos: ${DB_CONFIG.database}`);
  
  // Crear tabla de cola si no existe
  await crearTablaCola();
  
  // Manejar cierre graceful
  process.on('SIGINT', async () => {
    console.log('\n🛑 Deteniendo worker...');
    isRunning = false;
    if (browser) {
      await browser.close();
    }
    process.exit(0);
  });
  
  if (MODO_ONCE) {
    // Modo una vez: procesa un RIT y termina
    await ejecutarCiclo();
    if (browser) {
      await browser.close();
    }
  } else {
    // Modo continuo: procesa cada X segundos
    while (isRunning) {
      await ejecutarCiclo();
      
      if (isRunning) {
        await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
      }
    }
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, procesarRIT, obtenerSiguienteRIT };


