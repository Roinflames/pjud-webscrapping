/**
 * Servicio de Scraping - Ejecuta el scraping de PJUD de forma programática
 * 
 * Este módulo encapsula la lógica de scraping para que pueda ser llamado
 * desde la API sin necesidad de ejecutar el script completo.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { startBrowser } = require('../browser');
const { closeModalIfExists } = require('../navigation');
const { fillForm, openDetalle } = require('../form');
const { extractTable } = require('../table');
const { downloadPDFsFromTable } = require('../pdfDownloader');
const { processTableData, exportToJSON, exportToCSV } = require('../exporter');

/**
 * Convierte un archivo PDF a base64
 */
function pdfToBase64(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`Error convirtiendo PDF a base64: ${error.message}`);
    return null;
  }
}

/**
 * Ejecuta el scraping completo de una causa
 * 
 * @param {Object} config - Configuración del scraping
 * @param {string} config.rit - RIT de la causa (ej: "16707-2019")
 * @param {string} config.competencia - ID de competencia (ej: "3")
 * @param {string} config.corte - ID de corte (ej: "90")
 * @param {string} config.tribunal - ID de tribunal (ej: "276")
 * @param {string} config.tipoCausa - Tipo de causa (ej: "C")
 * @param {boolean} config.headless - Si debe ejecutarse en modo headless (default: false)
 * 
 * @returns {Object} Resultado del scraping con movimientos y PDFs en base64
 */
async function ejecutarScraping(config) {
  const {
    rit,
    competencia,
    corte,
    tribunal,
    tipoCausa,
    headless = false
  } = config;

  // Validar campos requeridos
  if (!rit || !competencia || !corte || !tribunal || !tipoCausa) {
    throw new Error('Faltan campos requeridos: rit, competencia, corte, tribunal, tipoCausa');
  }

  // Verificar OJV_URL
  if (!process.env.OJV_URL) {
    throw new Error('OJV_URL no está configurada en .env');
  }

  const CONFIG = {
    rit,
    competencia,
    corte,
    tribunal,
    tipoCausa
  };

  const outputDir = path.resolve(__dirname, '../outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`🚀 Iniciando scraping para RIT: ${rit}`);
  
  const { browser, context, page } = await startBrowser(process.env.OJV_URL, headless);

  try {
    // Navegar y establecer sesión
    await closeModalIfExists(page);
    
    const currentUrl = page.url();
    if (currentUrl.includes('home/index.php')) {
      await page.evaluate(async () => {
        const accesoConsultaCausas = 'CC';
        await fetch('../includes/sesion-invitado.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `nombreAcceso=${accesoConsultaCausas}`
        });
        localStorage.setItem('InitSitioOld', '0');
        localStorage.setItem('InitSitioNew', '1');
        localStorage.setItem('logged-in', 'true');
        sessionStorage.setItem('logged-in', 'true');
      });
      
      await page.waitForTimeout(500);
      await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForTimeout(1000);
    } else if (!currentUrl.includes('indexN.php')) {
      await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForTimeout(1000);
    }
    
    await page.waitForSelector('#competencia', { timeout: 20000 });
    
    // Ejecutar scraping
    await fillForm(page, CONFIG);
    await openDetalle(page);
    
    // Extraer datos
    const rows = await extractTable(page);
    console.log(`📊 Extraídos ${rows.length} movimientos`);
    
    // Descargar PDFs
    const pdfMapping = await downloadPDFsFromTable(page, context, outputDir, rit) || {};
    
    // Procesar datos
    const datosProcesados = processTableData(rows, rit, pdfMapping);

    // Guardar resultados en archivos (JSON y CSV)
    exportToJSON(rows, outputDir, rit, pdfMapping);
    exportToCSV(rows, outputDir, rit);
    console.log(`💾 Resultados guardados en ${outputDir}`);

    // Convertir PDFs a base64
    const pdfsBase64 = {};
    const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Buscar todos los PDFs descargados relacionados con este RIT
    const pdfFiles = fs.readdirSync(outputDir).filter(f => 
      f.startsWith(ritClean) && f.endsWith('.pdf')
    );
    
    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(outputDir, pdfFile);
      const base64 = pdfToBase64(pdfPath);
      if (base64) {
        pdfsBase64[pdfFile] = base64;
      }
    }
    
    // Preparar resultado
    const resultado = {
      rit,
      fecha_scraping: new Date().toISOString(),
      movimientos: datosProcesados.movimientos || [],
      cabecera: datosProcesados.cabecera || {},
      pdfs: pdfsBase64,
      total_movimientos: rows.length,
      total_pdfs: Object.keys(pdfsBase64).length,
      estado: 'completado'
    };
    
    console.log(`✅ Scraping completado: ${resultado.total_movimientos} movimientos, ${resultado.total_pdfs} PDFs`);
    
    return resultado;
    
  } catch (error) {
    console.error(`❌ Error en scraping: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { ejecutarScraping };