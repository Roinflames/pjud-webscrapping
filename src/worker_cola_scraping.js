/**
 * WORKER DE COLA DE SCRAPING
 * 
 * Este script escucha la tabla pjud_cola_scraping y ejecuta el scraping
 * automáticamente cuando detecta RITs pendientes.
 * 
 * Uso:
 *   node src/worker_cola_scraping.js
 *   node src/worker_cola_scraping.js --interval 5000  (cada 5 segundos)
 *   node src/worker_cola_scraping.js --once            (procesa uno y termina)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const { startBrowser } = require('./browser');
const { downloadPDFsFromTable } = require('./pdfDownloader');
const { downloadEbook } = require('./ebook');
const { fillForm, openDetalle, resetForm } = require('./form');
const { extractTable } = require('./table');
const { closeModalIfExists } = require('./navigation');
const { processTableData } = require('./dataProcessor');
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
    const config = validacion.config;
    
    // Inicializar navegador si no está abierto
    if (!browser) {
      console.log('🌐 Iniciando navegador...');
      const browserData = await startBrowser('https://oficinajudicialvirtual.pjud.cl/indexN.php');
      browser = browserData.browser;
      context = browserData.context;
      page = browserData.page;
      
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
    
    // Ejecutar scraping
    console.log(`📝 Llenando formulario para RIT: ${config.rit}...`);
    await fillForm(page, config);
    await openDetalle(page);
    
    // Extraer tabla
    const rows = await extractTable(page);
    if (!rows || rows.length === 0) {
      throw new Error('No se pudieron extraer movimientos de la tabla');
    }
    
    // Descargar PDFs
    const outputDir = path.resolve(__dirname, 'outputs');
    if (!require('fs').existsSync(outputDir)) {
      require('fs').mkdirSync(outputDir, { recursive: true });
    }
    
    const pdfMapping = await downloadPDFsFromTable(
      page,
      context,
      outputDir,
      config.rit,
      rows
    );

    
    // Descargar eBook
    await downloadEbook(page, context, config, outputDir);
    
    // Identificar PDF de demanda
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
        if (require('fs').existsSync(oldPath)) {
          require('fs').copyFileSync(oldPath, newPath);
          demandaNombre = `${ritClean}_demanda.pdf`;
          console.log(`   ✅ PDF de demanda guardado: ${demandaNombre}`);
        }
      }
    }
    
    // Verificar eBook
    const ebookNombre = require('fs').existsSync(path.join(outputDir, `${ritClean}_ebook.pdf`)) 
      ? `${ritClean}_ebook.pdf` 
      : null;
    
    // Procesar datos
    const datosProcesados = processTableData(rows, config.rit, pdfMapping);
    
    // Importar a SQL (con guardado de SQL)
    await importarAMovimientosIntermedia(
      config.rit, 
      datosProcesados, 
      config, 
      pdfMapping, 
      true,  // guardarSQL
      demandaNombre, 
      ebookNombre
    );
    
    // Volver al formulario para siguiente RIT
    await resetForm(page);
    await page.waitForTimeout(2000);
    
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


