/**
 * WORKER DE MONITOREO CONTINUO 24/7
 * 
 * ⚠️ STANDARD COMPLIANCE: This worker delegates scraping to processCausa engine.
 * See docs/scraping-standard.md for the single-engine rule.
 * 
 * Este worker:
 * - Recorre causas activas periódicamente (configurable, default: 1 hora)
 * - Usa processCausa para scraping
 * - Compara movimientos con BD para detectar solo movimientos nuevos
 * - Actualiza BD solo con movimientos nuevos
 * - Se ejecuta 24/7 sin parar
 * 
 * Uso:
 *   node src/worker-monitoreo-continuo.js
 *   node src/worker-monitoreo-continuo.js --interval 3600000  (cada 1 hora, default)
 *   node src/worker-monitoreo-continuo.js --interval 1800000  (cada 30 minutos)
 *   node src/worker-monitoreo-continuo.js --once             (procesa una vez y termina)
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
  ? parseInt(process.argv[process.argv.indexOf('--interval') + 1]) || 3600000
  : 3600000; // 1 hora por defecto

const MODO_ONCE = process.argv.includes('--once');
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
 * Obtener todas las causas activas de la base de datos
 */
async function obtenerCausasActivas(connection) {
  const [rows] = await connection.query(`
    SELECT 
      c.id as causa_id,
      c.rit,
      c.competencia_id,
      c.corte_id,
      c.tribunal_id,
      c.tipo_causa,
      c.caratulado,
      c.agenda_id,
      c.cliente,
      c.rut,
      c.abogado_id,
      c.cuenta_id
    FROM causa c
    WHERE c.rit IS NOT NULL 
      AND c.rit != ''
      AND c.rit != 'NULL'
      AND c.competencia_id IS NOT NULL
      AND c.corte_id IS NOT NULL
      AND c.tribunal_id IS NOT NULL
    ORDER BY c.id ASC
  `);
  
  return rows;
}

/**
 * Obtener movimientos existentes de una causa desde BD
 */
async function obtenerMovimientosExistentes(connection, rit) {
  const [rows] = await connection.query(`
    SELECT 
      folio,
      fecha,
      descripcion,
      tipo_movimiento,
      fecha_ingreso
    FROM pjud_movimientos_intermedia
    WHERE rit = ?
    ORDER BY folio ASC, fecha_ingreso ASC
  `, [rit]);
  
  return rows;
}

/**
 * Comparar movimientos nuevos vs existentes
 * Retorna solo los movimientos que no existen en BD
 */
function detectarMovimientosNuevos(movimientosScraping, movimientosExistentes) {
  if (!movimientosScraping || movimientosScraping.length === 0) {
    return [];
  }
  
  if (!movimientosExistentes || movimientosExistentes.length === 0) {
    // Si no hay movimientos en BD, todos son nuevos
    return movimientosScraping;
  }
  
  // Crear set de movimientos existentes para búsqueda rápida
  const existentesSet = new Set();
  movimientosExistentes.forEach(mov => {
    // Usar folio + fecha como clave única
    const clave = `${mov.folio || ''}_${mov.fecha || ''}_${(mov.descripcion || '').substring(0, 50)}`;
    existentesSet.add(clave);
  });
  
  // Filtrar solo movimientos nuevos
  const movimientosNuevos = movimientosScraping.filter(mov => {
    const folio = mov.folio || mov.texto?.[0] || '';
    const fecha = mov.fecha || mov.texto?.[1] || '';
    const descripcion = mov.descripcion || mov.texto?.[5] || '';
    const clave = `${folio}_${fecha}_${descripcion.substring(0, 50)}`;
    
    return !existentesSet.has(clave);
  });
  
  return movimientosNuevos;
}

/**
 * Procesar una causa: scraping y detección de movimientos nuevos
 */
async function procesarCausa(connection, causa) {
  try {
    console.log(`\n🔄 Procesando causa: ${causa.rit}`);
    console.log(`   - ID: ${causa.causa_id}`);
    console.log(`   - Caratulado: ${causa.caratulado || 'N/A'}`);
    
    // Validar datos antes de procesar
    const causaParaValidar = {
      rit: causa.rit,
      competencia: causa.competencia_id,
      corte: causa.corte_id,
      tribunal: causa.tribunal_id,
      tipoCausa: causa.tipo_causa || 'C',
      causa_id: causa.causa_id,
      agenda_id: causa.agenda_id,
      cliente: causa.cliente,
      rut: causa.rut,
      abogado_id: causa.abogado_id,
      cuenta_id: causa.cuenta_id
    };

    const validacion = validarParaScraping(causaParaValidar);

    if (!validacion.puedeProcesar) {
      console.log(`   ❌ Causa descartada: ${validacion.motivo}`);
      return { success: false, motivo: validacion.motivo };
    }

    const scrapingConfig = validacion.config;
    
    // Inicializar navegador si no está abierto
    if (!browser) {
      console.log('🌐 Iniciando navegador...');
      const browserData = await startBrowser(process.env.OJV_URL || 'https://oficinajudicialvirtual.pjud.cl/indexN.php');
      browser = browserData.browser;
      context = browserData.context;
      page = browserData.page;
      
      await goToConsultaCausas(page);
    }
    
    // ✅ DELEGATE TO ENGINE: Use processCausa for all scraping
    const outputDir = path.resolve(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`   📝 Ejecutando scraping (via processCausa engine)...`);
    const resultado = await processCausa(page, context, scrapingConfig, outputDir);
    
    if (!resultado.success) {
      throw new Error(resultado.error || 'Error desconocido en scraping');
    }

    // Leer JSON generado por processCausa
    const ritClean = scrapingConfig.rit.replace(/[^a-zA-Z0-9]/g, '_');
    const jsonPath = path.join(outputDir, 'causas', `${ritClean}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON generado por processCausa no encontrado en: ${jsonPath}`);
    }
    
    const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const movimientosScraping = payload.movimientos || [];
    
    // Obtener movimientos existentes de BD
    const movimientosExistentes = await obtenerMovimientosExistentes(connection, scrapingConfig.rit);
    
    // Detectar solo movimientos nuevos
    const movimientosNuevos = detectarMovimientosNuevos(movimientosScraping, movimientosExistentes);
    
    console.log(`   📊 Movimientos encontrados: ${movimientosScraping.length}`);
    console.log(`   📊 Movimientos existentes en BD: ${movimientosExistentes.length}`);
    console.log(`   🆕 Movimientos nuevos: ${movimientosNuevos.length}`);
    
    if (movimientosNuevos.length === 0) {
      console.log(`   ✅ No hay movimientos nuevos, omitiendo actualización`);
      return { 
        success: true, 
        movimientosNuevos: 0,
        movimientosTotales: movimientosScraping.length
      };
    }
    
    // Actualizar BD solo con movimientos nuevos
    // Para esto, necesitamos crear un payload solo con movimientos nuevos
    const payloadNuevos = {
      ...payload,
      movimientos: movimientosNuevos,
      metadata: {
        ...payload.metadata,
        total_movimientos: movimientosNuevos.length,
        movimientos_nuevos: movimientosNuevos.length,
        movimientos_totales: movimientosScraping.length
      }
    };
    
    // Importar solo movimientos nuevos a BD
    const demandaNombre = payload.demanda || null;
    const ebookNombre = payload.ebook || null;
    
    await importarAMovimientosIntermedia(
      scrapingConfig.rit, 
      {
        movimientos: movimientosNuevos,
        cabecera: payload.cabecera || {},
        estado_actual: payload.estado_actual || {}
      }, 
      scrapingConfig, 
      payload.pdf_mapping || {}, 
      true,  // guardarSQL
      demandaNombre, 
      ebookNombre
    );
    
    console.log(`   ✅ ${movimientosNuevos.length} movimientos nuevos guardados en BD`);
    
    return { 
      success: true, 
      movimientosNuevos: movimientosNuevos.length,
      movimientosTotales: movimientosScraping.length
    };
    
  } catch (error) {
    console.error(`   ❌ Error procesando causa ${causa.rit}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Ciclo principal del worker
 */
async function cicloMonitoreo() {
  const connection = await getConnection();
  
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Ciclo de monitoreo iniciado: ${new Date().toLocaleString()}`);
    console.log(`${'='.repeat(60)}`);
    
    // Obtener todas las causas activas
    const causasActivas = await obtenerCausasActivas(connection);
    console.log(`📋 Causas activas encontradas: ${causasActivas.length}`);
    
    if (causasActivas.length === 0) {
      console.log('   ⚠️  No hay causas activas para monitorear');
      return;
    }
    
    let procesadas = 0;
    let conMovimientosNuevos = 0;
    let errores = 0;
    
    // Procesar cada causa
    for (const causa of causasActivas) {
      const resultado = await procesarCausa(connection, causa);
      
      if (resultado.success) {
        procesadas++;
        if (resultado.movimientosNuevos > 0) {
          conMovimientosNuevos++;
        }
      } else {
        errores++;
      }
      
      // Pausa pequeña entre causas para no saturar
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Resumen del ciclo:`);
    console.log(`   ✅ Procesadas: ${procesadas}`);
    console.log(`   🆕 Con movimientos nuevos: ${conMovimientosNuevos}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('❌ Error en ciclo de monitoreo:', error);
  } finally {
    await connection.end();
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando Worker de Monitoreo Continuo 24/7');
  console.log(`   Intervalo: ${INTERVAL_MS / 1000 / 60} minutos`);
  console.log(`   Modo: ${MODO_ONCE ? 'Una vez' : 'Continuo 24/7'}\n`);
  
  // Manejar señales para cierre graceful
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Señal de interrupción recibida, cerrando gracefully...');
    isRunning = false;
    
    if (browser) {
      await browser.close();
    }
    
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Señal de terminación recibida, cerrando gracefully...');
    isRunning = false;
    
    if (browser) {
      await browser.close();
    }
    
    process.exit(0);
  });
  
  // Ejecutar ciclo
  if (MODO_ONCE) {
    await cicloMonitoreo();
    if (browser) {
      await browser.close();
    }
    console.log('✅ Proceso completado (modo una vez)');
  } else {
    // Loop continuo 24/7
    while (isRunning) {
      await cicloMonitoreo();
      
      if (!isRunning) break;
      
      console.log(`\n⏸️  Esperando ${INTERVAL_MS / 1000 / 60} minutos hasta el siguiente ciclo...`);
      console.log(`   Próximo ciclo: ${new Date(Date.now() + INTERVAL_MS).toLocaleString()}\n`);
      
      await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
    }
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { cicloMonitoreo, procesarCausa, detectarMovimientosNuevos };
