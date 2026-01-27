/**
 * WORKER DE EVENTOS ERP - Procesa eventos de scraping creados por el ERP
 * 
 * ⚠️ STANDARD COMPLIANCE: This worker now delegates scraping to processCausa engine.
 * See docs/scraping-standard.md for the single-engine rule.
 * 
 * Este worker procesa eventos de la tabla pjud_eventos_scraping que fueron
 * creados por el listener del ERP cuando detecta nuevos contratos.
 * 
 * Uso:
 *   node src/worker-eventos.js
 *   node src/worker-eventos.js --interval 5000
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { startBrowser } = require('./browser');
const { goToConsultaCausas } = require('./navigation');
const { processCausa } = require('./process-causas');
const { resetForm } = require('./form');
const { closeModalIfExists } = require('./navigation');
const { importarAMovimientosIntermedia } = require('./importar_intermedia_sql');
const { validarParaScraping } = require('./utils/validacion-pjud');

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: parseInt(process.env.DB_PORT || '3306')
};

// Configuración del worker
const INTERVAL_MS = process.argv.includes('--interval') 
  ? parseInt(process.argv[process.argv.indexOf('--interval') + 1]) || 10000
  : 10000; // 10 segundos por defecto

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
 * Obtener siguiente evento pendiente
 */
async function obtenerSiguienteEvento(connection) {
  try {
    const [eventos] = await connection.query(`
      SELECT * FROM pjud_eventos_scraping
      WHERE estado = 'PENDIENTE'
      ORDER BY prioridad DESC, fecha_creacion ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (eventos.length === 0) {
      return null;
    }

    // Marcar como procesando
    await connection.query(`
      UPDATE pjud_eventos_scraping
      SET estado = 'PROCESANDO', fecha_procesamiento = NOW()
      WHERE id = ?
    `, [eventos[0].id]);

    return eventos[0];
  } catch (error) {
    console.error('Error obteniendo siguiente evento:', error.message);
    return null;
  }
}

/**
 * Marcar evento como completado
 */
async function marcarEventoCompletado(connection, eventoId, resultado) {
  try {
    await connection.query(`
      UPDATE pjud_eventos_scraping
      SET estado = 'COMPLETADO',
          resultado_rit = ?,
          resultado_movimientos = ?,
          resultado_pdfs = ?,
          resultado_data = ?,
          fecha_completado = NOW()
      WHERE id = ?
    `, [
      resultado.rit,
      resultado.totalMovimientos || 0,
      resultado.totalPDFs || 0,
      JSON.stringify(resultado),
      eventoId
    ]);
    console.log(`✅ Evento ${eventoId} marcado como completado`);
  } catch (error) {
    console.error(`❌ Error marcando evento como completado:`, error.message);
  }
}

/**
 * Marcar evento como error
 */
async function marcarEventoError(connection, eventoId, errorMessage) {
  try {
    await connection.query(`
      UPDATE pjud_eventos_scraping
      SET estado = 'ERROR',
          resultado_error = ?,
          fecha_completado = NOW()
      WHERE id = ?
    `, [errorMessage, eventoId]);
    console.log(`❌ Evento ${eventoId} marcado como error: ${errorMessage}`);
  } catch (error) {
    console.error(`❌ Error marcando evento como error:`, error.message);
  }
}

/**
 * Procesar evento (ejecutar scraping)
 */
async function procesarEvento(connection, evento) {
  try {
    console.log(`\n🔄 Procesando evento ID: ${evento.id}, RIT: ${evento.rit}`);
    console.log(`   Prioridad: ${evento.prioridad}, Origen: ${evento.erp_origen || 'N/A'}`);

    // Validar datos del evento
    const validacion = validarParaScraping({
      rit: evento.rit,
      competencia: evento.competencia_id,
      corte: evento.corte_id,
      tribunal: evento.tribunal_id,
      tipoCausa: evento.tipo_causa
    });

    if (!validacion.puedeProcesar) {
      throw new Error(`Datos incompletos: ${validacion.motivo}`);
    }

    const config = validacion.config;

    // Inicializar navegador si no está abierto
    if (!browser || !context || !page) {
      console.log('🌐 Inicializando navegador...');
      const browserConfig = await startBrowser(process.env.OJV_URL || 'https://oficinajudicialvirtual.pjud.cl/indexN.php', {
        headless: process.env.HEADLESS !== 'false',
        slowMo: 0
      });
      browser = browserConfig.browser;
      context = browserConfig.context;
      page = browserConfig.page;

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
        await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', { 
          waitUntil: 'domcontentloaded' 
        });
      }
    }

    // ✅ DELEGATE TO ENGINE: Use processCausa for all scraping
    const outputDir = path.resolve(__dirname, 'outputs');
    if (!require('fs').existsSync(outputDir)) {
      require('fs').mkdirSync(outputDir, { recursive: true });
    }

    const { goToConsultaCausas } = require('./navigation');
    const { processCausa } = require('./process-causas');
    
    await goToConsultaCausas(page);
    
    console.log(`📝 Ejecutando scraping para RIT: ${config.rit} (via processCausa engine)...`);
    const resultadoScraping = await processCausa(page, context, config, outputDir);
    
    if (!resultadoScraping.success) {
      throw new Error(resultadoScraping.error || 'Error desconocido en scraping');
    }

    // Post-process: Read JSON generated by processCausa and import to intermedia table
    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    const jsonPath = path.join(outputDir, 'causas', `${ritClean}.json`);
    
    if (!require('fs').existsSync(jsonPath)) {
      throw new Error(`JSON generado por processCausa no encontrado en: ${jsonPath}`);
    }
    
    const payload = JSON.parse(require('fs').readFileSync(jsonPath, 'utf-8'));
    
    // Importar a SQL intermedia (con guardado de SQL)
    await importarAMovimientosIntermedia(
      config.rit, 
      {
        movimientos: payload.movimientos || [],
        cabecera: payload.cabecera || {},
        estado_actual: payload.estado_actual || {}
      }, 
      config, 
      payload.pdf_mapping || {}, 
      true,  // guardarSQL
      payload.demanda || null,  // demandaNombre
      payload.ebook || null   // ebookNombre
    );

    // Volver al formulario para siguiente RIT
    const { resetForm } = require('./form');
    await resetForm(page);
    await page.waitForTimeout(2000);

    // Preparar resultado
    const resultado = {
      rit: config.rit,
      totalMovimientos: payload.metadata?.total_movimientos || 0,
      totalPDFs: Object.keys(payload.pdf_mapping || {}).reduce((acc, key) => {
        const mapping = payload.pdf_mapping[key];
        return acc + (mapping.azul ? 1 : 0) + (mapping.rojo ? 1 : 0);
      }, 0),
      movimientos: payload.movimientos || [],
      cabecera: payload.cabecera || {},
      estado_actual: payload.estado_actual || {},
      pdfMapping: payload.pdf_mapping || {}
    };

    // Marcar evento como completado
    await marcarEventoCompletado(connection, evento.id, resultado);

    console.log(`✅ Evento ${evento.id} procesado exitosamente`);
    return true;

  } catch (error) {
    console.error(`❌ Error procesando evento ${evento.id}:`, error.message);
    await marcarEventoError(connection, evento.id, error.message);
    return false;
  }
}

/**
 * Ciclo principal del worker
 */
async function ejecutarCiclo() {
  const connection = await getConnection();

  try {
    const siguienteEvento = await obtenerSiguienteEvento(connection);

    if (siguienteEvento) {
      await procesarEvento(connection, siguienteEvento);
    } else {
      console.log('⏳ No hay eventos pendientes...');
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
  console.log('🚀 Iniciando Worker de Eventos ERP...');
  console.log(`   - Intervalo: ${INTERVAL_MS}ms`);
  console.log(`   - Modo: ${MODO_ONCE ? 'Una vez' : 'Continuo'}`);
  console.log(`   - Base de datos: ${DB_CONFIG.database}`);

  // Manejar señales de terminación
  process.on('SIGINT', async () => {
    console.log('\n🛑 Deteniendo Worker de Eventos...');
    isRunning = false;
    if (browser) await browser.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Deteniendo Worker de Eventos...');
    isRunning = false;
    if (browser) await browser.close();
    process.exit(0);
  });

  // Ciclo principal
  while (isRunning) {
    await ejecutarCiclo();
    
    if (MODO_ONCE) {
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, procesarEvento };
