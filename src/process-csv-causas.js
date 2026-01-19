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
  console.log(`🚀 Iniciando prueba controlada de ${limit} causas...`);
  
  const causas = readCausaCSV();
  const causasValidas = causas.filter(c => isValidForScraping(c));
  
  // Tomar solo las primeras N para la prueba
  const aProcesar = causasValidas.slice(0, limit);
  console.log(`📊 Se procesarán ${aProcesar.length} causas del CSV.`);

  const outputDir = path.resolve(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const { browser, context, page } = await startBrowser('https://oficinajudicialvirtual.pjud.cl/indexN.php');

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

    for (let i = 0; i < aProcesar.length; i++) {
      const csvCausa = aProcesar[i];
      const config = csvToScrapingConfig(csvCausa);
      
      console.log(`\n📂 [${i + 1}/${aProcesar.length}] Procesando: ${config.rit}`);
      
      const resultado = await processCausaBatch(page, context, config, outputDir);
      
      if (resultado.success) {
        saveProgress(config.rit, csvCausa.causa_id);
      }

      // Volver al formulario para la siguiente causa
      if (i < aProcesar.length - 1) {
        console.log('🔄 Volviendo al formulario...');
        await resetForm(page);
        await page.waitForTimeout(2000);
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error);
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
